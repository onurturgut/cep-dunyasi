import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type ReviewStarsProps = {
  rating: number;
  className?: string;
  iconClassName?: string;
  showValue?: boolean;
};

export function ReviewStars({ rating, className, iconClassName, showValue = false }: ReviewStarsProps) {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              "h-4 w-4",
              value <= normalizedRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35",
              iconClassName
            )}
          />
        ))}
      </div>
      {showValue ? <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span> : null}
    </div>
  );
}
