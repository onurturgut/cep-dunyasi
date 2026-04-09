"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import type { ProductReviewSummary } from "@/lib/reviews";
import { ReviewDistributionBars } from "@/components/reviews/ReviewDistributionBars";
import { ReviewStars } from "@/components/reviews/ReviewStars";

type ReviewSummaryProps = {
  summary: ProductReviewSummary;
};

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  const { locale } = useI18n();

  const copy =
    locale === "en"
      ? {
          title: "Customer Reviews",
          reviewCount: `${summary.count} reviews`,
          verifiedRatio: `${summary.verified_purchase_ratio}% verified purchases`,
        }
      : {
          title: "Musteri Degerlendirmeleri",
          reviewCount: `${summary.count} yorum`,
          verifiedRatio: `%${summary.verified_purchase_ratio} dogrulanmis satin alim`,
        };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border/70 bg-muted/25 p-5 text-center">
          <div className="text-4xl font-bold text-foreground">{summary.average.toFixed(1)}</div>
          <div className="mt-2 flex justify-center">
            <ReviewStars rating={summary.average} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{copy.reviewCount}</p>
          {summary.verified_purchase_count > 0 ? (
            <Badge variant="secondary" className="mt-3">
              {copy.verifiedRatio}
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
