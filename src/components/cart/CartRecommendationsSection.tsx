"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/integrations/mongo/client";
import { getComplementaryProducts } from "@/lib/cart-recommendations";
import { type CatalogProductRecord } from "@/lib/product-catalog";
import { getDefaultProductVariant, getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";

type CartRecommendationsSectionProps = {
  cartProductIds: string[];
};

export function CartRecommendationsSection({ cartProductIds }: CartRecommendationsSectionProps) {
  const [products, setProducts] = useState<CatalogProductRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      if (cartProductIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await db
        .from("products")
        .select("*, product_variants(*), categories(name, slug)")
        .eq("is_active", true)
        .limit(60);

      if (cancelled) {
        return;
      }

      const normalizedProducts = Array.isArray(data)
        ? data.map((product) => ({
            ...(product as CatalogProductRecord),
            images: Array.isArray(product.images) ? product.images : [],
            product_variants: normalizeProductVariants(product.product_variants || []),
          }))
        : [];

      setProducts(normalizedProducts);
      setLoading(false);
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [cartProductIds]);

  const recommendations = useMemo(
    () => getComplementaryProducts(products, cartProductIds, 8),
    [cartProductIds, products]
  );

  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-3xl border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur-xl sm:p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Sepetini Tamamla</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sepetindeki urunlere uyumlu tamamlayici oneriler hazirladik.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[5/4] w-full rounded-xl sm:aspect-square" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          : recommendations.map((product) => {
              const variant = getDefaultProductVariant(normalizeProductVariants(product.product_variants || []));

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
                  specs={product.specs as Record<string, string | null> | null}
                  storage={variant?.storage}
                  ram={variant?.ram}
                  stock={variant?.stock || 0}
                  category={product.categories?.name}
                />
              );
            })}
      </div>
    </section>
  );
}
