"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { useI18n } from "@/i18n/provider";
import type { ProductReviewListItem } from "@/lib/reviews";

type ReviewListProps = {
  items: ProductReviewListItem[];
  loading: boolean;
  onHelpful?: (reviewId: string) => void;
  helpfulReviewId?: string | null;
  canMarkHelpful?: boolean;
  currentUserId?: string | null;
  emptyMessage?: string;
};

export function ReviewList({ items, loading, onHelpful, helpfulReviewId, canMarkHelpful = false, currentUserId, emptyMessage }: ReviewListProps) {
  const { locale } = useI18n();
  const resolvedEmptyMessage = emptyMessage || (locale === "en" ? "There are no reviews for this product yet." : "Bu ürün için henüz yorum bulunmuyor.");

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/70 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-28" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-11/12" />
            <Skeleton className="mt-2 h-4 w-9/12" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 p-6 text-sm text-muted-foreground">{resolvedEmptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onHelpful={onHelpful}
          helpfulLoading={helpfulReviewId === review.id}
          canMarkHelpful={canMarkHelpful && review.user_id !== currentUserId}
        />
      ))}
    </div>
  );
}

