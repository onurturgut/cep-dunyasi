"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { Link } from "@/lib/router";
import { sectionReveal, type HomeProduct, type HomeSiteContent } from "@/components/home/home-data";
import { getDefaultProductVariant, getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";
import { ProductRailCarousel } from "@/components/home/ProductRailCarousel";

type FeaturedProductsSectionProps = {
  featuredProducts: HomeProduct[];
  content: HomeSiteContent;
};

export function FeaturedProductsSection({ featuredProducts, content }: FeaturedProductsSectionProps) {
  return (
    <motion.section
      id="home-featured"
      data-section="featured"
      className="relative py-6 md:py-10"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden h-72 overflow-hidden md:block">
        <div className="absolute left-[12%] top-20 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[10%] top-10 h-44 w-44 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="container">
        <motion.div className="rounded-3xl border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur-xl sm:p-5 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{content.featured_section_title}</h2>
            <Button variant="ghost" asChild className="w-full justify-center sm:w-auto">
              <Link to={content.featured_section_cta_href || "/products"}>
                {content.featured_section_cta_label} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-6">
              <ProductRailCarousel
                items={featuredProducts.map((product) => {
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
                      ratingCount={product.rating_count}
                      specs={product.specs}
                      storage={variant?.storage}
                      ram={variant?.ram}
                      stock={variant?.stock || 0}
                      category={product.categories?.name}
                    />
                  );
                })}
              />
            </div>
          ) : (
            <div className="mt-6 p-6 text-sm text-muted-foreground">Henüz öne çıkan ürün eklenmedi.</div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
