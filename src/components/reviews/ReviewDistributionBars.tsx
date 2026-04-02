"use client";

import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/i18n/provider";
import { getReviewDistributionEntries, type ReviewDistribution } from "@/lib/reviews";

type ReviewDistributionBarsProps = {
  distribution: ReviewDistribution;
  total: number;
};

export function ReviewDistributionBars({ distribution, total }: ReviewDistributionBarsProps) {
  const { locale } = useI18n();

  return (
    <div className="space-y-3">
      {getReviewDistributionEntries(distribution).map((entry) => {
        const percent = total > 0 ? (entry.count / total) * 100 : 0;
        const label = locale === "en" ? `${entry.rating} Stars` : `${entry.rating} Yildiz`;

        return (
          <div key={entry.rating} className="grid grid-cols-[40px_minmax(0,1fr)_42px] items-center gap-3">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <Progress value={percent} className="h-2.5 bg-secondary/80" />
            <span className="text-right text-sm text-muted-foreground">{entry.count}</span>
          </div>
        );
      })}
    </div>
  );
}
