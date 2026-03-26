export const REVIEW_SORT_OPTIONS = ["newest", "highest", "lowest", "most_helpful"] as const;
export const ADMIN_REVIEW_STATUS_OPTIONS = ["all", "pending", "approved"] as const;
export const REVIEW_IMAGE_LIMIT = 4;

export type ReviewSort = (typeof REVIEW_SORT_OPTIONS)[number];
export type AdminReviewStatus = (typeof ADMIN_REVIEW_STATUS_OPTIONS)[number];
export type ReviewRatingValue = 1 | 2 | 3 | 4 | 5;
export type ReviewRatingKey = "1" | "2" | "3" | "4" | "5";
export type ReviewViewerStatus = "pending" | "approved" | null;

export type ReviewDistribution = Record<ReviewRatingKey, number>;

export type ReviewAdminReply = {
  message: string;
  created_at: string;
  updated_at: string;
};

export type ProductReviewListItem = {
  id: string;
  product_id: string;
  product_name?: string | null;
  user_id: string;
  user_email?: string | null;
  user_full_name?: string | null;
  author_name: string;
  rating: ReviewRatingValue;
  title: string | null;
  comment: string;
  images: string[];
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  viewer_has_marked_helpful: boolean;
  created_at: string;
  updated_at: string;
  admin_reply: ReviewAdminReply | null;
};

export type ProductReviewSummary = {
  average: number;
  count: number;
  distribution: ReviewDistribution;
  verified_purchase_count: number;
  verified_purchase_ratio: number;
};

export type ProductReviewListResponse = {
  items: ProductReviewListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: ProductReviewSummary;
  viewerReviewStatus: ReviewViewerStatus;
};

export function createEmptyReviewDistribution(): ReviewDistribution {
  return {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };
}

export function normalizeReviewDistribution(input: Partial<Record<string, number>> | null | undefined): ReviewDistribution {
  const empty = createEmptyReviewDistribution();

  if (!input) {
    return empty;
  }

  return {
    "1": Number.isFinite(input["1"]) ? Number(input["1"]) : empty["1"],
    "2": Number.isFinite(input["2"]) ? Number(input["2"]) : empty["2"],
    "3": Number.isFinite(input["3"]) ? Number(input["3"]) : empty["3"],
    "4": Number.isFinite(input["4"]) ? Number(input["4"]) : empty["4"],
    "5": Number.isFinite(input["5"]) ? Number(input["5"]) : empty["5"],
  };
}

export function getReviewDistributionEntries(distribution: ReviewDistribution) {
  return ([5, 4, 3, 2, 1] as const).map((rating) => ({
    rating,
    count: distribution[`${rating}` as ReviewRatingKey] ?? 0,
  }));
}

export function maskReviewerName(fullName?: string | null, email?: string | null) {
  const normalizedFullName = `${fullName ?? ""}`.trim();

  if (normalizedFullName) {
    const parts = normalizedFullName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      const first = parts[0];
      return first.length <= 2 ? `${first[0] ?? "K"}*` : `${first.slice(0, 2)}***`;
    }

    const [firstName, ...rest] = parts;
    const lastName = rest.join(" ");
    return `${firstName} ${lastName[0] ?? ""}.`;
  }

  const emailPrefix = `${email ?? ""}`.split("@")[0]?.trim() || "Kullanici";

  if (emailPrefix.length <= 2) {
    return `${emailPrefix[0] ?? "K"}*`;
  }

  return `${emailPrefix.slice(0, 2)}***`;
}

export function clampReviewRating(value: number): ReviewRatingValue {
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return Math.round(value) as ReviewRatingValue;
}

