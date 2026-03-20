"use client";

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { Link } from '@/lib/router';
import { sectionReveal, type HomeProduct } from '@/components/home/home-data';
import { useSectionParallax } from '@/components/home/useSectionParallax';

type FeaturedProductsSectionProps = {
  featuredProducts: HomeProduct[];
};

export function FeaturedProductsSection({ featuredProducts }: FeaturedProductsSectionProps) {
  const featuredFirstColumn = featuredProducts.filter((_, index) => index % 2 === 0);
  const featuredSecondColumnBase = featuredProducts.filter((_, index) => index % 2 === 1);
  const featuredSecondColumn = featuredSecondColumnBase.length > 0 ? featuredSecondColumnBase : featuredFirstColumn;
  const featuredFirstTrack = [...featuredFirstColumn, ...featuredFirstColumn];
  const featuredSecondTrack = [...featuredSecondColumn, ...featuredSecondColumn];
  const { ref, backgroundY, foregroundY, accentY } = useSectionParallax<HTMLElement>({
    distance: 85,
    rotate: 4,
  });

  return (
    <motion.section
      ref={ref}
      id="home-featured"
      data-section="featured"
      className="relative py-6 md:py-10"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
    >
      <motion.div aria-hidden="true" style={{ y: backgroundY }} className="pointer-events-none absolute inset-x-0 top-0 hidden h-72 overflow-hidden md:block">
        <div className="absolute left-[12%] top-20 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[10%] top-10 h-44 w-44 rounded-full bg-secondary/15 blur-3xl" />
      </motion.div>

      <div className="container">
        <motion.div style={{ y: foregroundY }} className="p-5 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-5xl font-bold">One Cikan Urunler</h2>
            <Button variant="ghost" asChild>
              <Link to="/products">
                Tum Urunleri Gor <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4">
              <div className="featured-marquee">
                <motion.div style={{ y: accentY }} className="featured-marquee-track featured-marquee-track-ltr">
                  {featuredFirstTrack.map((product, index) => {
                    const variant = product.product_variants?.[0];

                    return (
                      <div key={`${product.id}-ltr-${index}`} className="featured-marquee-item">
                        <ProductCard
                          id={product.id}
                          name={product.name}
                          slug={product.slug}
                          brand={product.brand}
                          images={product.images}
                          price={variant?.price || 0}
                          variantId={variant?.id}
                          stock={variant?.stock || 0}
                          category={product.categories?.name}
                        />
                      </div>
                    );
                  })}
                </motion.div>
              </div>

              <div className="featured-marquee">
                <motion.div style={{ y: foregroundY }} className="featured-marquee-track featured-marquee-track-rtl">
                  {featuredSecondTrack.map((product, index) => {
                    const variant = product.product_variants?.[0];

                    return (
                      <div key={`${product.id}-rtl-${index}`} className="featured-marquee-item">
                        <ProductCard
                          id={product.id}
                          name={product.name}
                          slug={product.slug}
                          brand={product.brand}
                          images={product.images}
                          price={variant?.price || 0}
                          variantId={variant?.id}
                          stock={variant?.stock || 0}
                          category={product.categories?.name}
                        />
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-6 text-sm text-muted-foreground">
              Henuz one cikan urun eklenmedi.
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
