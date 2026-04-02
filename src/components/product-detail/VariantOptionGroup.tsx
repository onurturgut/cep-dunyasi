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
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
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
                "group inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-45",
                style === "swatch" ? "min-w-[118px] justify-start" : "min-w-[92px] justify-center",
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_36px_-28px_rgba(15,23,42,0.72)]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {style === "swatch" ? (
                <span
                  className={cn(
                    "h-5 w-5 rounded-full border border-black/10 shadow-sm",
                    !option.colorCode ? "bg-slate-200" : "",
                  )}
                  style={option.colorCode ? { backgroundColor: option.colorCode } : undefined}
                />
              ) : null}

              <span>{option.label}</span>

              {!option.disabled && option.inStock === false ? (
                <span className={cn("text-[10px] uppercase tracking-[0.18em]", isSelected ? "text-white/70" : "text-muted-foreground")}>
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
