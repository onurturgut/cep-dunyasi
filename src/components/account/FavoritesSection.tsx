"use client";

import { Heart } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { useWishlist } from "@/hooks/use-wishlist";
import { useI18n } from "@/i18n/provider";
import { getDefaultProductVariant, getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";

type FavoritesSectionProps = {
  title?: string;
  className?: string;
};

export function FavoritesSection({ title, className }: FavoritesSectionProps) {
  const { products: wishlistProducts, isLoading: wishlistLoading, isFetching: wishlistFetching, error: wishlistError } = useWishlist();
  const { locale } = useI18n();
  const copy =
    locale === "en"
      ? {
          title: "My Favorites",
          loading: "Loading favorites...",
          loadError: "Favorites could not be loaded right now",
          empty: "You have not added a favorite product yet.",
        }
      : {
          title: "Favorilerim",
          loading: "Favoriler yukleniyor...",
          loadError: "Favoriler su anda yuklenemedi",
          empty: "Henuz favori urun eklemediniz.",
        };

  return (
    <section className={className}>
      <h2 id="favorites" className="scroll-mt-24 font-display text-lg font-bold">
        {title || copy.title}
      </h2>

      {wishlistLoading || wishlistFetching ? (
        <div className="mt-4 text-sm text-muted-foreground">{copy.loading}</div>
      ) : wishlistError ? (
        <div className="mt-4 text-sm text-destructive">
          {copy.loadError}: {wishlistError.message}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center py-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-2 text-muted-foreground">{copy.empty}</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {wishlistProducts.map((product) => {
            const variants = normalizeProductVariants(product.product_variants || []);
            const variant = getDefaultProductVariant(variants);

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                brand={product.brand}
                description={product.description}
                images={getVariantGallery(variant, product.images)}
                price={variant?.price || 0}
                originalPrice={variant?.compare_at_price || undefined}
                variantId={variant?.id}
                variantInfo={variant ? getVariantLabel(variant) : undefined}
                createdAt={product.created_at}
                salesCount={product.sales_count}
                ratingAverage={product.rating_average}
                secondHand={product.second_hand}
                caseDetails={product.case_details}
                specs={product.specs}
                productVariants={variants}
                storage={variant?.storage}
                ram={variant?.ram}
                stock={variant?.stock || 0}
                category={product.categories?.name}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
