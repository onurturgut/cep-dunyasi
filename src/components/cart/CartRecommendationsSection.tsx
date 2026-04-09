"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router";

type CartRecommendationsSectionProps = {
  cartProductIds?: string[];
};

export function CartRecommendationsSection({ cartProductIds = [] }: CartRecommendationsSectionProps) {
  return (
    <section className="rounded-[1.6rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Sepetini tamamla</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {cartProductIds.length > 0
              ? "Benzer urunler ve aksesuarlar icin katalogu gezerek siparisini guclendirebilirsin."
              : "Katalogu inceleyip sepetine yeni urunler ekleyebilirsin."}
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          Urunlere git
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
