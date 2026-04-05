"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { getDefaultProductVariant, getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";
import { RECENTLY_VIEWED_UPDATED_EVENT, getRecentlyViewedProducts, type RecentlyViewedProductRecord } from "@/lib/recently-viewed";
import { ProductRailCarousel } from "@/components/home/ProductRailCarousel";

export function RecentlyViewedSection() {
  const [products, setProducts] = useState<RecentlyViewedProductRecord[]>([]);

  useEffect(() => {
    const syncProducts = () => {
      setProducts(getRecentlyViewedProducts());
    };

    syncProducts();

    window.addEventListener(RECENTLY_VIEWED_UPDATED_EVENT, syncProducts);
    window.addEventListener("storage", syncProducts);

    return () => {
      window.removeEventListener(RECENTLY_VIEWED_UPDATED_EVENT, syncProducts);
      window.removeEventListener("storage", syncProducts);
    };
  }, []);

  return (
    <section
      id="home-recently-viewed"
      data-section="recently-viewed"
      className="relative py-6 md:py-10"
    >
      <div className="container">
        <div className="rounded-3xl border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur-xl sm:p-5 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Son Görüntülenen Ürünler</h2>
              <p className="mt-1 text-sm text-muted-foreground">En son baktığın ürünlere hızlıca geri dön.</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Henüz son görüntülenen ürün yok. Bir ürün detayına girdiğinizde burada listelenecek.
            </div>
          ) : (
            <div className="mt-6">
              <ProductRailCarousel
                items={products.map((product) => {
                  const variants = normalizeProductVariants(product.product_variants || []);
                  const variant = getDefaultProductVariant(variants, product.selected_variant_id);

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
                      colorName={variant?.color_name}
                      storage={variant?.storage}
                      ram={variant?.ram}
                      stock={variant?.stock || 0}
                      category={product.categories?.name}
                    />
                  );
                })}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
