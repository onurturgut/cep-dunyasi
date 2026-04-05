"use client";

import { ProductCard } from "@/components/products/ProductCard";
import type { FavoriteProductSummary } from "@/lib/account";
import { getDefaultProductVariant, getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";

export function FavoriteProductCard({ product }: { product: FavoriteProductSummary }) {
  const variants = normalizeProductVariants(product.product_variants || []);
  const variant = getDefaultProductVariant(variants);

  return (
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
      secondHand={product.second_hand}
      caseDetails={product.case_details}
      specs={product.specs}
      storage={variant?.storage}
      ram={variant?.ram}
      stock={variant?.stock || 0}
      category={product.categories?.name}
    />
  );
}
