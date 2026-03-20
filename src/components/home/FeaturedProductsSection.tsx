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
  const { ref, backgroundY, foregroundY } = useSectionParallax<HTMLElement>({
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
        <motion.div style={{ y: foregroundY }} className="rounded-3xl border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur-xl sm:p-5 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">One Cikan Urunler</h2>
            <Button variant="ghost" asChild className="w-full justify-center sm:w-auto">
              <Link to="/products">
                Tum Urunleri Gor <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 min-[500px]:grid-cols-2 xl:grid-cols-4">
              {featuredProducts.map((product) => {
                const variant = product.product_variants?.[0];

                return (
                  <ProductCard
                    key={product.id}
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
                );
              })}
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
