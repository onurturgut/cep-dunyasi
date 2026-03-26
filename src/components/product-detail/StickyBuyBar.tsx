"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

type StickyBuyBarProps = {
  visible: boolean;
  productName: string;
  variantSummary: string;
  price: number;
  stock: number;
  onAddToCart: () => void;
  disabled?: boolean;
};

export function StickyBuyBar({
  visible,
  productName,
  variantSummary,
  price,
  stock,
  onAddToCart,
  disabled = false,
}: StickyBuyBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3 transition-all duration-300 lg:hidden",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      <div className="pointer-events-auto mx-auto max-w-2xl rounded-[1.75rem] border border-border/70 bg-background/92 p-3 shadow-[0_22px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{productName}</p>
            <p className="truncate text-xs text-muted-foreground">{variantSummary || "Varyant secimi gerekli"}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">{formatCurrency(price)}</span>
              <span className={cn("text-xs", stock > 0 ? "text-emerald-700" : "text-destructive")}>
                {stock > 0 ? `${stock} adet stokta` : "Stokta yok"}
              </span>
            </div>
          </div>

          <Button type="button" size="sm" className="h-11 rounded-2xl px-4" onClick={onAddToCart} disabled={disabled || stock <= 0}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sepete Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}
