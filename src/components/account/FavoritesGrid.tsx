"use client";

import { Heart } from "lucide-react";
import { FavoriteProductCard } from "@/components/account/FavoriteProductCard";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import type { FavoriteProductSummary } from "@/lib/account";

type FavoritesGridProps = {
  products: FavoriteProductSummary[];
  isLoading?: boolean;
  error?: string | null;
};

export function FavoritesGrid({ products, isLoading, error }: FavoritesGridProps) {
  if (isLoading) {
    return <AccountSectionSkeleton cards={1} rows={4} />;
  }

  if (error) {
    return <AccountEmptyState icon={Heart} title="Favoriler yuklenemedi" description={error} />;
  }

  if (products.length === 0) {
    return (
      <AccountEmptyState
        icon={Heart}
        title="Favori listeniz bos"
        description="Begendiginiz urunleri kalp ikonuyla kaydedebilir, daha sonra bu alandan hizlica inceleyebilirsiniz."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
      {products.map((product) => (
        <FavoriteProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
