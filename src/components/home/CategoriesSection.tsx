"use client";

import { motion } from 'framer-motion';
import { Link } from '@/lib/router';
import {
  categoryIcons,
  sectionReveal,
  type HomeCategory,
  type HomeSiteContent,
} from '@/components/home/home-data';
import { useSectionParallax } from '@/components/home/useSectionParallax';

type CategoriesSectionProps = {
  categories: HomeCategory[];
  content: HomeSiteContent;
};

export function CategoriesSection({ categories, content }: CategoriesSectionProps) {
  const { ref, backgroundY, foregroundY, accentY, driftX, scale } = useSectionParallax<HTMLElement>({
    distance: 90,
    rotate: 4,
  });

  return (
    <motion.section ref={ref} id="home-categories" data-section="categories" className="relative bg-background pb-10 md:pb-12">
      <motion.div
        aria-hidden="true"
        style={{ y: backgroundY }}
        className="pointer-events-none absolute inset-x-0 top-20 hidden h-[32rem] overflow-hidden md:block"
      >
        <div className="absolute left-[8%] top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[10%] top-40 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
      </motion.div>

      <div className="container -mt-8 md:-mt-10">
        <motion.div
          style={{ y: foregroundY, scale }}
          className="rounded-3xl border border-border/70 bg-card/75 p-4 text-foreground shadow-lg backdrop-blur-xl sm:p-5 md:p-8"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{content.category_section_title}</h2>
            {content.category_section_description ? (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{content.category_section_description}</p>
            ) : null}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => {
                const Icon = categoryIcons[category.icon || 'Smartphone'] || categoryIcons.Smartphone;

                return (
                  <div key={category.id}>
                    <Link
                      to={`/products?category=${category.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card text-left text-foreground transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      {category.image_url ? (
                        <div className="relative h-32 w-full overflow-hidden bg-muted sm:h-40">
                          <motion.img
                            src={category.image_url}
                            alt={category.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            style={{ x: driftX }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                          <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-background/85 text-primary backdrop-blur-sm">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-28 w-full items-center justify-center bg-primary/10 text-primary">
                          <Icon className="h-7 w-7" />
                        </div>
                      )}
                      <div className="space-y-1 p-4">
                        <span className="block text-sm font-semibold text-foreground sm:text-[15px]">{category.name}</span>
                        {category.description ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{category.description}</p>
                        ) : null}
                      </div>
                    </Link>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
