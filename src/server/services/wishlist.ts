import { z } from "zod";
import type { SessionUser } from "@/server/auth-session";
import { Product, ProductVariant, User } from "@/server/models";
import { normalizeProductVariants, sortProductVariants } from "@/lib/product-variants";

const wishlistToggleSchema = z.object({
  productId: z.string().trim().min(1, "Urun secimi zorunlu"),
});

type WishlistToggleInput = z.input<typeof wishlistToggleSchema>;

type WishlistProductRecord = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images?: string[];
  specs?: Record<string, string | null> | null;
  rating_average?: number;
  rating_count?: number;
  categories?: { name?: string; slug?: string } | null;
  product_variants: ReturnType<typeof normalizeProductVariants>;
};

type WishlistUserRecord = {
  wishlist_product_ids?: string[];
};

async function getWishlistUserRecord(userId: string) {
  return (await User.collection.findOne(
    { id: userId },
    { projection: { wishlist_product_ids: 1 } }
  )) as WishlistUserRecord | null;
}

async function buildWishlistResponse(wishlistIds: string[]) {
  if (wishlistIds.length === 0) {
    return {
      productIds: [] as string[],
      products: [] as WishlistProductRecord[],
    };
  }

  const [products, variants] = await Promise.all([
    Product.find({ id: { $in: wishlistIds }, is_active: true }).lean(),
    ProductVariant.find({ product_id: { $in: wishlistIds }, is_active: true }).lean(),
  ]);

  const variantsByProductId = new Map<string, ReturnType<typeof normalizeProductVariants>>();
  for (const [productId, groupedVariants] of Object.entries(
    (variants as Array<Record<string, unknown>>).reduce<Record<string, Array<Record<string, unknown>>>>((acc, variant) => {
      const key = `${variant.product_id ?? ""}`;
      if (!key) {
        return acc;
      }
      acc[key] = acc[key] ?? [];
      acc[key].push(variant);
      return acc;
    }, {})
  )) {
    variantsByProductId.set(productId, sortProductVariants(normalizeProductVariants(groupedVariants)));
  }

  const productsById = new Map(
    (products as Array<Record<string, unknown>>).map((product) => [
      `${product.id ?? ""}`,
      {
        ...(product as WishlistProductRecord),
        images: Array.isArray(product.images) ? (product.images as string[]) : [],
        product_variants: variantsByProductId.get(`${product.id ?? ""}`) ?? [],
      },
    ])
  );

  const orderedProducts = wishlistIds.map((productId) => productsById.get(productId)).filter(Boolean) as WishlistProductRecord[];

  return {
    productIds: wishlistIds,
    products: orderedProducts,
  };
}

function ensureAuthenticated(sessionUser: SessionUser | null) {
  if (!sessionUser?.id) {
    throw new Error("Favorilere eklemek icin giris yapmaniz gerekiyor");
  }
}

export async function listWishlist(sessionUser: SessionUser | null) {
  ensureAuthenticated(sessionUser);

  const user = await getWishlistUserRecord(sessionUser.id);
  const wishlistIds = Array.isArray(user?.wishlist_product_ids) ? user.wishlist_product_ids.filter(Boolean) : [];
  return buildWishlistResponse(wishlistIds);
}

export async function toggleWishlist(input: WishlistToggleInput, sessionUser: SessionUser | null) {
  ensureAuthenticated(sessionUser);

  const payload = wishlistToggleSchema.parse(input);
  const product = await Product.findOne({ id: payload.productId, is_active: true }, { id: 1 }).lean();

  if (!product) {
    throw new Error("Urun bulunamadi");
  }

  const user = await getWishlistUserRecord(sessionUser.id);
  const currentIds = Array.isArray(user?.wishlist_product_ids) ? user.wishlist_product_ids : [];
  const isFavorite = currentIds.includes(payload.productId);

  const nextIds = isFavorite
    ? currentIds.filter((productId) => productId !== payload.productId)
    : Array.from(new Set([...currentIds, payload.productId]));

  await User.collection.updateOne(
    { id: sessionUser.id },
    {
      $set: {
        wishlist_product_ids: nextIds,
        updated_at: new Date(),
      },
    }
  );

  const wishlist = await buildWishlistResponse(nextIds);

  return {
    productId: payload.productId,
    isFavorite: !isFavorite,
    productIds: wishlist.productIds,
    products: wishlist.products,
    count: wishlist.productIds.length,
  };
}
