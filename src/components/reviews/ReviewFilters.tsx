import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReviewSort } from "@/lib/reviews";

type ReviewFiltersValue = {
  rating?: number;
  verified?: boolean;
  sort: ReviewSort;
};

type ReviewFiltersProps = {
  value: ReviewFiltersValue;
  onChange: (next: ReviewFiltersValue) => void;
};

export function ReviewFilters({ value, onChange }: ReviewFiltersProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant={value.rating === undefined ? "default" : "outline"} size="sm" onClick={() => onChange({ ...value, rating: undefined })}>
            Tum Yorumlar
          </Button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <Button
              key={rating}
              variant={value.rating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...value, rating })}
            >
              {rating} Yildiz
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="verified-only"
              checked={Boolean(value.verified)}
              onCheckedChange={(checked) => onChange({ ...value, verified: checked === true ? true : undefined })}
            />
            <Label htmlFor="verified-only" className="text-sm text-muted-foreground">
              Sadece dogrulanmis satin alma
            </Label>
          </div>

          <Select value={value.sort} onValueChange={(nextSort) => onChange({ ...value, sort: nextSort as ReviewSort })}>
            <SelectTrigger className="w-full sm:w-[210px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">En Yeni</SelectItem>
              <SelectItem value="highest">En Yuksek Puan</SelectItem>
              <SelectItem value="lowest">En Dusuk Puan</SelectItem>
              <SelectItem value="most_helpful">En Faydali</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
