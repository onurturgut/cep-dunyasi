import { z } from "zod";
import { deleteFromR2ByUrl } from "@/server/storage/r2";
import type { SessionUser } from "@/server/auth-session";
import { Order, OrderItem, Product, ProductReview, ProductVariant, User } from "@/server/models";
import {
  clampReviewRating,
  createEmptyReviewDistribution,
  maskReviewerName,
  normalizeReviewDistribution,
  type AdminReviewStatus,
  type ProductReviewListItem,
  type ProductReviewListResponse,
  type ReviewEligibilityReason,
  type ReviewDistribution,
  type ReviewSort,
  type ReviewViewerStatus,
} from "@/lib/reviews";

const createReviewSchema = z.object({
  productId: z.string().trim().min(1, "Ürün secimi zorunlu"),
  rating: z.coerce.number().int().min(1).max(5),
  title: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const normalized = `${value ?? ""}`.trim();
      return normalized || null;
    })
    .pipe(z.string().max(120).nullable()),
  comment: z.string().trim().min(5, "Yorum en az 5 karakter olmalı").max(2000, "Yorum çok uzun"),
  images: z.array(z.string().trim().min(1)).max(4, "En fazla 4 görsel yukleyebilirsiniz").default([]),
});

const listReviewsSchema = z.object({
  productId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z.boolean().optional(),
  sort: z.enum(["newest", "highest", "lowest", "most_helpful"]).default("newest"),
  admin: z.boolean().default(false),
  status: z.enum(["all", "pending", "approved"]).default("approved"),
  search: z.string().trim().max(120).optional(),
});

const reviewHelpfulSchema = z.object({
  reviewId: z.string().trim().min(1, "Yorum secimi zorunlu"),
});

const approveReviewSchema = z.object({
  reviewId: z.string().trim().min(1, "Yorum secimi zorunlu"),
  isApproved: z.boolean().default(true),
});

const deleteReviewSchema = z.object({
  reviewId: z.string().trim().min(1, "Yorum secimi zorunlu"),
});

const replyReviewSchema = z.object({
  reviewId: z.string().trim().min(1, "Yorum secimi zorunlu"),
  message: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const normalized = `${value ?? ""}`.trim();
      return normalized || null;
    })
    .pipe(z.string().max(1500).nullable()),
});

type RawProductRecord = {
  id: string;
  name: string;
  is_active?: boolean;
  rating_average?: number;
  rating_count?: number;
  rating_distribution?: Partial<Record<string, number>> | null;
};

type RawUserRecord = {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type RawProductVariantRecord = {
  id: string;
  product_id: string;
};

type RawReviewRecord = {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  images?: string[];
  is_verified_purchase?: boolean;
  is_approved?: boolean;
  helpful_count?: number;
  helpful_user_ids?: string[];
  admin_reply?: {
    message: string;
    created_at: Date | string;
    updated_at: Date | string;
  } | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type ListReviewsInput = z.input<typeof listReviewsSchema>;
type CreateReviewInput = z.input<typeof createReviewSchema>;
type MarkReviewHelpfulInput = z.input<typeof reviewHelpfulSchema>;
type ApproveReviewInput = z.input<typeof approveReviewSchema>;
type DeleteReviewInput = z.input<typeof deleteReviewSchema>;
type ReplyToReviewInput = z.input<typeof replyReviewSchema>;

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureAuthenticatedUser(sessionUser: SessionUser | null) {
  if (!sessionUser?.id) {
    throw new Error("Yorum yapmak için giriş yapmanız gerekiyor");
  }
}

function buildSummary(product: RawProductRecord | null, verifiedPurchaseCount: number) {
  const count = Number(product?.rating_count ?? 0);
  return {
    average: Number(product?.rating_average ?? 0),
    count,
    distribution: normalizeReviewDistribution(product?.rating_distribution),
    verified_purchase_count: verifiedPurchaseCount,
    verified_purchase_ratio: count > 0 ? Number(((verifiedPurchaseCount / count) * 100).toFixed(1)) : 0,
  };
}

async function resolveReviewEligibility(userId: string, productId: string) {
  const variants = (await ProductVariant.find({ product_id: productId }, { id: 1, product_id: 1 }).lean()) as RawProductVariantRecord[];

  if (variants.length === 0) {
    return {
      isVerifiedPurchase: false,
      canReview: false,
      orderId: null as string | null,
      reason: "not_purchased" as ReviewEligibilityReason,
    };
  }

  const variantIds = variants.map((variant) => variant.id);
  const paidOrders = (await Order.find(
    {
      user_id: userId,
      payment_status: "paid",
      order_status: { $ne: "cancelled" },
    },
    { id: 1, order_status: 1 }
  )
    .sort({ created_at: -1 })
    .lean()) as Array<{ id: string; order_status?: string | null }>;

  if (paidOrders.length === 0) {
    return {
      isVerifiedPurchase: false,
      canReview: false,
      orderId: null as string | null,
      reason: "not_purchased" as ReviewEligibilityReason,
    };
  }

  const paidOrderIds = paidOrders.map((order) => order.id);
  const matchingPaidOrderItem = (await OrderItem.findOne(
    {
      order_id: { $in: paidOrderIds },
      variant_id: { $in: variantIds },
    },
    { order_id: 1 }
  )
    .sort({ created_at: -1 })
    .lean()) as { order_id?: string | null } | null;

  if (!matchingPaidOrderItem?.order_id) {
    return {
      isVerifiedPurchase: false,
      canReview: false,
      orderId: null as string | null,
      reason: "not_purchased" as ReviewEligibilityReason,
    };
  }

  const deliveredOrders = paidOrders.filter((order) => ["delivered", "completed"].includes(`${order.order_status ?? ""}`));
  const deliveredOrderIds = deliveredOrders.map((order) => order.id);
  const matchingDeliveredOrderItem = deliveredOrderIds.length
    ? ((await OrderItem.findOne(
        {
          order_id: { $in: deliveredOrderIds },
          variant_id: { $in: variantIds },
        },
        { order_id: 1 }
      )
        .sort({ created_at: -1 })
        .lean()) as { order_id?: string | null } | null)
    : null;

  return {
    isVerifiedPurchase: true,
    canReview: Boolean(matchingDeliveredOrderItem?.order_id),
    orderId: matchingDeliveredOrderItem?.order_id ?? matchingPaidOrderItem.order_id ?? null,
    reason: matchingDeliveredOrderItem?.order_id ? ("eligible" as ReviewEligibilityReason) : ("not_delivered" as ReviewEligibilityReason),
  };
}

async function hydrateReviewItems(reviews: RawReviewRecord[], viewerId?: string | null) {
  const userIds = Array.from(new Set(reviews.map((review) => review.user_id).filter(Boolean)));
  const productIds = Array.from(new Set(reviews.map((review) => review.product_id).filter(Boolean)));

  const [users, products] = await Promise.all([
    userIds.length > 0 ? ((await User.find({ id: { $in: userIds } }, { id: 1, email: 1, full_name: 1 }).lean()) as RawUserRecord[]) : [],
    productIds.length > 0 ? ((await Product.find({ id: { $in: productIds } }, { id: 1, name: 1 }).lean()) as RawProductRecord[]) : [],
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));
  const productsById = new Map(products.map((product) => [product.id, product]));

  return reviews.map<ProductReviewListItem>((review) => {
    const user = usersById.get(review.user_id);
    const product = productsById.get(review.product_id);
    const helpfulUserIds = Array.isArray(review.helpful_user_ids) ? review.helpful_user_ids : [];

    return {
      id: review.id,
      product_id: review.product_id,
      product_name: product?.name ?? null,
      user_id: review.user_id,
      user_email: user?.email ?? null,
      user_full_name: user?.full_name ?? null,
      author_name: maskReviewerName(user?.full_name, user?.email),
      rating: clampReviewRating(review.rating),
      title: review.title ?? null,
      comment: review.comment,
      images: Array.isArray(review.images) ? review.images : [],
      is_verified_purchase: Boolean(review.is_verified_purchase),
      is_approved: Boolean(review.is_approved),
      helpful_count: Number(review.helpful_count ?? 0),
      viewer_has_marked_helpful: Boolean(viewerId && helpfulUserIds.includes(viewerId)),
      created_at: toIsoString(review.created_at),
      updated_at: toIsoString(review.updated_at),
      admin_reply: review.admin_reply
        ? {
            message: review.admin_reply.message,
            created_at: toIsoString(review.admin_reply.created_at),
            updated_at: toIsoString(review.admin_reply.updated_at),
          }
        : null,
    };
  });
}

function getSortQuery(sort: ReviewSort) {
  if (sort === "highest") {
    return { rating: -1, created_at: -1 } as const;
  }

  if (sort === "lowest") {
    return { rating: 1, created_at: -1 } as const;
  }

  if (sort === "most_helpful") {
    return { helpful_count: -1, created_at: -1 } as const;
  }

  return { created_at: -1 } as const;
}

async function getViewerReviewStatus(productId: string, viewerId?: string | null): Promise<ReviewViewerStatus> {
  if (!viewerId) {
    return null;
  }

  const existingReview = (await ProductReview.findOne({ product_id: productId, user_id: viewerId }, { is_approved: 1 }).lean()) as
    | { is_approved?: boolean }
    | null;

  if (!existingReview) {
    return null;
  }

  return existingReview.is_approved ? "approved" : "pending";
}

export async function recomputeProductReviewStats(productId: string) {
  const approvedReviews = (await ProductReview.find(
    { product_id: productId, is_approved: true },
    { rating: 1, is_verified_purchase: 1 }
  ).lean()) as Array<{ rating: number; is_verified_purchase?: boolean }>;

  const distribution: ReviewDistribution = createEmptyReviewDistribution();
  let total = 0;
  let verifiedPurchaseCount = 0;

  for (const review of approvedReviews) {
    const ratingKey = `${clampReviewRating(review.rating)}` as keyof ReviewDistribution;
    distribution[ratingKey] += 1;
    total += clampReviewRating(review.rating);

    if (review.is_verified_purchase) {
      verifiedPurchaseCount += 1;
    }
  }

  const ratingCount = approvedReviews.length;
  const ratingAverage = ratingCount > 0 ? Number((total / ratingCount).toFixed(2)) : 0;

  await Product.updateOne(
    { id: productId },
    {
      $set: {
        rating_average: ratingAverage,
        rating_count: ratingCount,
        rating_distribution: distribution,
        updated_at: new Date(),
      },
    }
  );

  return {
    average: ratingAverage,
    count: ratingCount,
    distribution,
    verified_purchase_count: verifiedPurchaseCount,
    verified_purchase_ratio: ratingCount > 0 ? Number(((verifiedPurchaseCount / ratingCount) * 100).toFixed(1)) : 0,
  };
}

export async function createReview(input: CreateReviewInput, sessionUser: SessionUser | null) {
  ensureAuthenticatedUser(sessionUser);

  const payload = createReviewSchema.parse(input);
  const product = (await Product.findOne(
    { id: payload.productId, is_active: true },
    { id: 1, name: 1 }
  ).lean()) as RawProductRecord | null;

  if (!product) {
    throw new Error("Yorum yapılacak ürün bulunamadı");
  }

  const existingReview = await ProductReview.findOne({
    product_id: payload.productId,
    user_id: sessionUser.id,
  }).lean();

  if (existingReview) {
    throw new Error("Bu ürün için zaten yorum bıraktınız");
  }

  const reviewEligibility = await resolveReviewEligibility(sessionUser.id, payload.productId);
  if (!reviewEligibility.canReview) {
    if (reviewEligibility.reason === "not_delivered") {
      throw new Error("Yorum birakmak icin siparisinizin teslim edilmis olmasi gerekiyor");
    }

    throw new Error("Yorum bırakmak için önce bu ürünü satın alıp teslim almanız gerekiyor");
  }
  const now = new Date();

  try {
    const review = (await ProductReview.create({
      product_id: payload.productId,
      user_id: sessionUser.id,
      order_id: reviewEligibility.orderId,
      rating: clampReviewRating(payload.rating),
      title: payload.title,
      comment: payload.comment,
      images: payload.images,
      is_verified_purchase: reviewEligibility.isVerifiedPurchase,
      is_approved: false,
      helpful_count: 0,
      helpful_user_ids: [],
      created_at: now,
      updated_at: now,
    }).then((created: { toObject: () => RawReviewRecord }) => created.toObject())) as RawReviewRecord;

    const [hydrated] = await hydrateReviewItems([review], sessionUser.id);

    return {
      review: hydrated,
      moderationMessage: "Yorumunuz inceleme sonrası yayınlanacaktır",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yorum kaydedilemedi";

    if (message.includes("duplicate key")) {
      throw new Error("Bu ürün için zaten yorum bıraktınız");
    }

    throw error;
  }
}

export async function listReviews(input: ListReviewsInput, sessionUser?: SessionUser | null): Promise<ProductReviewListResponse> {
  const params = listReviewsSchema.parse(input);

  if (!params.admin && !params.productId) {
    throw new Error("Yorumları listelemek için ürün seçmelisiniz");
  }

  const query: Record<string, unknown> = {};

  if (params.productId) {
    query.product_id = params.productId;
  }

  if (params.rating) {
    query.rating = params.rating;
  }

  if (params.verified) {
    query.is_verified_purchase = true;
  }

  if (params.admin) {
    if (params.status === "approved") {
      query.is_approved = true;
    } else if (params.status === "pending") {
      query.is_approved = false;
    }
  } else {
    query.is_approved = true;
  }

  const normalizedSearch = `${params.search ?? ""}`.trim();
  if (params.admin && normalizedSearch) {
    const regex = new RegExp(escapeRegex(normalizedSearch), "i");
    const [matchingUsers, matchingProducts] = await Promise.all([
      User.find(
        {
          $or: [{ full_name: { $regex: regex } }, { email: { $regex: regex } }],
        },
        { id: 1 }
      ).lean(),
      Product.find({ name: { $regex: regex } }, { id: 1 }).lean(),
    ]);

    const userIds = matchingUsers.map((user: { id: string }) => user.id);
    const productIds = matchingProducts.map((product: { id: string }) => product.id);
    const searchConditions: Record<string, unknown>[] = [{ title: { $regex: regex } }, { comment: { $regex: regex } }];

    if (userIds.length > 0) {
      searchConditions.push({ user_id: { $in: userIds } });
    }

    if (productIds.length > 0) {
      searchConditions.push({ product_id: { $in: productIds } });
    }

    query.$or = searchConditions;
  }

  const total = await ProductReview.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  const page = Math.min(params.page, totalPages);
  const skip = (page - 1) * params.limit;

  const rawReviews = (await ProductReview.find(query)
    .sort(getSortQuery(params.sort))
    .skip(skip)
    .limit(params.limit)
    .lean()) as RawReviewRecord[];

  const items = await hydrateReviewItems(rawReviews, sessionUser?.id);
  const product = params.productId
    ? ((await Product.findOne(
        { id: params.productId },
        { id: 1, rating_average: 1, rating_count: 1, rating_distribution: 1, name: 1 }
      ).lean()) as RawProductRecord | null)
    : null;
  const verifiedPurchaseCount = params.productId
    ? await ProductReview.countDocuments({
        product_id: params.productId,
        is_approved: true,
        is_verified_purchase: true,
      })
    : 0;

  const viewerEligibility =
    params.productId && sessionUser?.id ? await resolveReviewEligibility(sessionUser.id, params.productId) : null;

  return {
    items,
    page,
    limit: params.limit,
    total,
    totalPages,
    summary: buildSummary(product, verifiedPurchaseCount),
    viewerReviewStatus: params.productId ? await getViewerReviewStatus(params.productId, sessionUser?.id) : null,
    viewerCanReview: viewerEligibility?.canReview ?? false,
    viewerReviewReason: viewerEligibility?.reason ?? "not_purchased",
  };
}

export async function markReviewHelpful(input: MarkReviewHelpfulInput, sessionUser: SessionUser | null) {
  ensureAuthenticatedUser(sessionUser);

  const payload = reviewHelpfulSchema.parse(input);
  const updateResult = await ProductReview.updateOne(
    {
      id: payload.reviewId,
      is_approved: true,
      user_id: { $ne: sessionUser.id },
      helpful_user_ids: { $ne: sessionUser.id },
    },
    {
      $addToSet: { helpful_user_ids: sessionUser.id },
      $inc: { helpful_count: 1 },
      $set: { updated_at: new Date() },
    }
  );

  if ((updateResult.modifiedCount ?? 0) !== 1) {
    throw new Error("Bu yoruma daha once faydali oyu verdiniz veya yorum uygun degil");
  }

  const updatedReview = (await ProductReview.findOne({ id: payload.reviewId }, { helpful_count: 1, product_id: 1 }).lean()) as
    | { helpful_count?: number; product_id?: string }
    | null;

  return {
    reviewId: payload.reviewId,
    productId: updatedReview?.product_id ?? null,
    helpfulCount: Number(updatedReview?.helpful_count ?? 0),
  };
}

export async function approveReview(input: ApproveReviewInput) {
  const payload = approveReviewSchema.parse(input);
  const review = (await ProductReview.findOne({ id: payload.reviewId }, { id: 1, product_id: 1, is_approved: 1 }).lean()) as
    | { id: string; product_id: string; is_approved?: boolean }
    | null;

  if (!review) {
    throw new Error("Yorum bulunamadı");
  }

  await ProductReview.updateOne(
    { id: payload.reviewId },
    {
      $set: {
        is_approved: payload.isApproved,
        updated_at: new Date(),
      },
    }
  );

  const summary = await recomputeProductReviewStats(review.product_id);

  return {
    reviewId: review.id,
    productId: review.product_id,
    isApproved: payload.isApproved,
    summary,
  };
}

export async function deleteReview(input: DeleteReviewInput) {
  const payload = deleteReviewSchema.parse(input);
  const review = (await ProductReview.findOne({ id: payload.reviewId }).lean()) as RawReviewRecord | null;

  if (!review) {
    throw new Error("Yorum bulunamadı");
  }

  await ProductReview.deleteOne({ id: payload.reviewId });

  const imageUrls = Array.isArray(review.images) ? review.images : [];
  for (const imageUrl of imageUrls) {
    try {
      await deleteFromR2ByUrl(imageUrl);
    } catch {
      // Ignore orphan cleanup failures and keep delete result successful.
    }
  }

  const summary = await recomputeProductReviewStats(review.product_id);

  return {
    reviewId: review.id,
    productId: review.product_id,
    deletedImages: imageUrls.length,
    summary,
  };
}

export async function replyToReview(input: ReplyToReviewInput) {
  const payload = replyReviewSchema.parse(input);
  const review = (await ProductReview.findOne(
    { id: payload.reviewId },
    { id: 1, product_id: 1, admin_reply: 1 }
  ).lean()) as
    | {
        id: string;
        product_id: string;
        admin_reply?: {
          message: string;
          created_at: Date | string;
          updated_at: Date | string;
        } | null;
      }
    | null;

  if (!review) {
    throw new Error("Yorum bulunamadı");
  }

  const now = new Date();
  const adminReply = payload.message
    ? {
        message: payload.message,
        created_at: review.admin_reply?.created_at ? new Date(review.admin_reply.created_at) : now,
        updated_at: now,
      }
    : null;

  await ProductReview.updateOne(
    { id: payload.reviewId },
    {
      $set: {
        admin_reply: adminReply,
        updated_at: now,
      },
    }
  );

  return {
    reviewId: review.id,
    productId: review.product_id,
    adminReply: adminReply
      ? {
          message: adminReply.message,
          created_at: adminReply.created_at.toISOString(),
          updated_at: adminReply.updated_at.toISOString(),
        }
      : null,
  };
}

export type { AdminReviewStatus, ReviewSort };


