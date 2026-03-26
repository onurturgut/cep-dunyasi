import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard } from "@/components/reviews/ReviewCard";
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

export function ReviewList({
  items,
  loading,
  onHelpful,
  helpfulReviewId,
  canMarkHelpful = false,
  currentUserId,
  emptyMessage = "Bu urun icin henuz yorum bulunmuyor.",
}: ReviewListProps) {
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
    return <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 p-6 text-sm text-muted-foreground">{emptyMessage}</div>;
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
