import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewDistributionBars } from "@/components/reviews/ReviewDistributionBars";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import type { ProductReviewSummary } from "@/lib/reviews";

type ReviewSummaryProps = {
  summary: ProductReviewSummary;
};

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">Musteri Degerlendirmeleri</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border/70 bg-muted/25 p-5 text-center">
          <div className="text-4xl font-bold text-foreground">{summary.average.toFixed(1)}</div>
          <div className="mt-2 flex justify-center">
            <ReviewStars rating={summary.average} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{summary.count} yorum</p>
          {summary.verified_purchase_count > 0 ? (
            <Badge variant="secondary" className="mt-3">
              %{summary.verified_purchase_ratio} dogrulanmis satin alim
            </Badge>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <ReviewDistributionBars distribution={summary.distribution} total={summary.count} />
        </div>
      </CardContent>
    </Card>
  );
}
