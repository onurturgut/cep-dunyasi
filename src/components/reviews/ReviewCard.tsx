import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import type { ProductReviewListItem } from "@/lib/reviews";

type ReviewCardProps = {
  review: ProductReviewListItem;
  onHelpful?: (reviewId: string) => void;
  helpfulLoading?: boolean;
  canMarkHelpful?: boolean;
};

export function ReviewCard({ review, onHelpful, helpfulLoading = false, canMarkHelpful = false }: ReviewCardProps) {
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{review.author_name}</p>
              {review.is_verified_purchase ? <Badge variant="secondary">Dogrulanmis Satin Alma</Badge> : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ReviewStars rating={review.rating} />
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant={review.viewer_has_marked_helpful ? "secondary" : "outline"}
            size="sm"
            disabled={!canMarkHelpful || helpfulLoading || review.viewer_has_marked_helpful}
            onClick={() => onHelpful?.(review.id)}
          >
            Faydali
            <span className="ml-2 rounded-full bg-background/70 px-2 py-0.5 text-xs">{review.helpful_count}</span>
          </Button>
        </div>

        {review.title ? <h4 className="text-base font-semibold text-foreground">{review.title}</h4> : null}
        <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{review.comment}</p>

        {review.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {review.images.map((imageUrl) => (
              <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-border/70">
                <img src={imageUrl} alt="Yorum gorseli" className="h-24 w-full object-cover transition-transform hover:scale-[1.03]" />
              </a>
            ))}
          </div>
        ) : null}

        {review.admin_reply ? (
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Magaza Cevabi</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{review.admin_reply.message}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
