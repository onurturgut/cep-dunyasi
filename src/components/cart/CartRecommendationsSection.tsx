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

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [cartProductIds]);

  const recommendations = useMemo(
    () => getComplementaryProducts(products, cartProductIds, 8),
    [cartProductIds, products],
  );

  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 overflow-hidden rounded-[28px] border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">Sepetini Tamamla</h2>
            <p className="mt-1 max-w-[28rem] text-sm text-muted-foreground">
              Sepetindeki ürünlerle uyumlu, karar vermesi kolay tamamlayıcı öneriler.
            </p>
          </div>
        </div>
        <span className="hidden rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          Uyumlu öneriler
        </span>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-w-0 space-y-3">
                <Skeleton className="aspect-[4/4.35] w-full rounded-[22px]" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          : recommendations.map((product) => {
              const variant = getDefaultProductVariant(normalizeProductVariants(product.product_variants || []));

              return (
                <div key={product.id} className="min-w-0">
                  <ProductCard
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
                    caseDetails={product.case_details}
                    specs={product.specs as Record<string, string | null> | null}
                    productVariants={normalizeProductVariants(product.product_variants || [])}
                    colorName={variant?.color_name}
                    storage={variant?.storage}
                    ram={variant?.ram}
                    stock={variant?.stock || 0}
                    category={product.categories?.name}
                    layout="compact"
                  />
                </div>
              );
            })}
      </div>
    </section>
  );
}
