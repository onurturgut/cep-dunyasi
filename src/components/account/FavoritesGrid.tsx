"use client";

import { Heart } from "lucide-react";
import { FavoriteProductCard } from "@/components/account/FavoriteProductCard";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { useI18n } from "@/i18n/provider";
import type { FavoriteProductSummary } from "@/lib/account";

type FavoritesGridProps = {
  products: FavoriteProductSummary[];
  isLoading?: boolean;
  error?: string | null;
};

export function FavoritesGrid({ products, isLoading, error }: FavoritesGridProps) {
  const { locale } = useI18n();
  const copy =
    locale === "en"
      ? {
          loadError: "Favorites could not be loaded",
          emptyTitle: "Your favorites list is empty",
          emptyDescription: "Save products you like with the heart icon and review them quickly from this area later.",
        }
      : {
          loadError: "Favoriler yüklenemedi",
          emptyTitle: "Favori listeniz boş",
          emptyDescription: "Beğendiğiniz ürünleri kalp ikonuyla kaydedebilir, daha sonra bu alandan hızlıca inceleyebilirsiniz.",
        };

  if (isLoading) {
    return <AccountSectionSkeleton cards={1} rows={4} />;
  }

  if (error) {
    return <AccountEmptyState icon={Heart} title={copy.loadError} description={error} />;
  }

  if (products.length === 0) {
    return <AccountEmptyState icon={Heart} title={copy.emptyTitle} description={copy.emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
      {products.map((product) => (
        <FavoriteProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

