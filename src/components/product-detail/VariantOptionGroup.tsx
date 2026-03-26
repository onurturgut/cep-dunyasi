import { cn } from "@/lib/utils";

export type VariantOption = {
  label: string;
  value: string;
  disabled?: boolean;
  inStock?: boolean;
  colorCode?: string | null;
};

type VariantOptionGroupProps = {
  title: string;
  options: VariantOption[];
  selectedValue?: string | null;
  onSelect: (value: string) => void;
  style?: "pill" | "swatch";
};

export function VariantOptionGroup({
  title,
  options,
  selectedValue,
  onSelect,
  style = "pill",
}: VariantOptionGroupProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {selectedValue ? <span className="text-xs text-muted-foreground">{selectedValue}</span> : null}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <button
              key={`${title}-${option.value}`}
              type="button"
              disabled={option.disabled}
              onClick={() => onSelect(option.value)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-45",
                style === "swatch" ? "min-w-[110px] justify-start" : "min-w-[84px] justify-center",
                isSelected
                  ? "border-foreground bg-foreground text-background shadow-[0_18px_32px_-24px_rgba(15,23,42,0.7)]"
                  : "border-border/70 bg-card text-foreground hover:-translate-y-0.5 hover:border-foreground/20",
              )}
            >
              {style === "swatch" ? (
                <span
                  className={cn(
                    "h-5 w-5 rounded-full border border-black/10 shadow-sm",
                    !option.colorCode ? "bg-muted" : "",
                  )}
                  style={option.colorCode ? { backgroundColor: option.colorCode } : undefined}
                />
              ) : null}

              <span>{option.label}</span>

              {!option.disabled && option.inStock === false ? (
                <span className={cn("text-[10px] uppercase tracking-[0.18em]", isSelected ? "text-background/75" : "text-muted-foreground")}>
                  Tedarik
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
