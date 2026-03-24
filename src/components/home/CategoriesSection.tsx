"use client";

import { motion } from 'framer-motion';
import { Link } from '@/lib/router';
import {
  categoryIcons,
  categorySlotImages,
  hiddenHomeCategorySlugs,
  sectionReveal,
  staggerContainer,
  staggerItem,
  type HomeCategory,
  type HomeSiteContent,
} from '@/components/home/home-data';
import { useSectionParallax } from '@/components/home/useSectionParallax';

type CategoriesSectionProps = {
  categories: HomeCategory[];
  content: HomeSiteContent;
};

export function CategoriesSection({ categories, content }: CategoriesSectionProps) {
  const showBanner = content.category_banner_enabled ?? false;
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
          className="min-h-[2000px] rounded-3xl border border-border bg-card p-5 text-foreground shadow-lg md:border-border/70 md:bg-card/75 md:backdrop-blur-xl md:p-8"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-foreground">{content.category_section_title}</h2>
            {content.category_section_description ? (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{content.category_section_description}</p>
            ) : null}
          </div>
          <div className="mt-6 flex flex-col gap-12">
            {showBanner && (
              <div className="space-y-4">
                <motion.div style={{ y: accentY }} className="h-[500px] w-full overflow-hidden rounded-xl border border-border/30 bg-card">
                  <motion.img
                    src={content.category_banner_main_image}
                    alt="Kategori banner"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    style={{ x: driftX }}
                  />
                </motion.div>

                <div className="space-y-[50px]">
                  <motion.div
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    <motion.div variants={staggerItem}>
                      <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-border bg-card md:border-background/30">
                        <video
                          className="absolute inset-0 h-full w-full object-contain object-center bg-black md:bg-black/5"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        >
                          <source src={content.category_banner_video} type="video/mp4" />
                        </video>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent md:from-primary/30" />
                        {content.category_banner_video_link && (
                          <Link
                            to={content.category_banner_video_link}
                            aria-label="Hemen satin al"
                            className="absolute bottom-[14px] left-1/2 z-20 h-[40px] w-[132px] -translate-x-1/2 rounded-[12px] bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
                          >
                            <span className="sr-only">Hemen Satin Al</span>
                          </Link>
                        )}
                      </div>
                    </motion.div>

                    {[0, 1].map((index) => {
                      const imageUrl = content.category_banner_slots?.[index];
                      if (!imageUrl) return null;

                      return (
                        <motion.div key={`category-slot-top-${index}`} variants={staggerItem}>
                          <div className="h-[500px] w-full overflow-hidden rounded-xl border border-border bg-background md:border-background/30 md:bg-background/5">
                            <img
                              src={imageUrl}
                              alt={`Kategori kisim ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  <div className="grid gap-8 text-left lg:grid-cols-2 lg:gap-16">
                    <motion.div style={{ y: accentY }} className="space-y-4">
                      {content.hero_logo_light_url && (
                        <img
                          src={content.hero_logo_light_url}
                          alt="Cep Dunyasi"
                          className="h-auto w-[180px] dark:hidden md:w-[240px]"
                          loading="lazy"
                        />
                      )}
                      {content.hero_logo_dark_url && (
                        <img
                          src={content.hero_logo_dark_url}
                          alt="Cep Dunyasi"
                          className="hidden h-auto w-[180px] dark:block md:w-[240px]"
                          loading="lazy"
                        />
                      )}
                      <h3 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
                        {content.category_banner_brand_title}
                      </h3>
                    </motion.div>

                    <motion.div style={{ y: foregroundY }} className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                      <p>{content.category_banner_brand_desc_1}</p>
                      <p className="font-semibold text-foreground">{content.category_banner_brand_desc_2}</p>
                      <p>{content.category_banner_brand_desc_3}</p>
                    </motion.div>
                  </div>

                  <motion.div
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    {[2, 3, 4].map((index) => {
                      const imageUrl = content.category_banner_slots?.[index];
                      if (!imageUrl) return null;

                      return (
                        <motion.div key={`category-slot-bottom-${index}`} variants={staggerItem}>
                          <div className="h-[500px] w-full overflow-hidden rounded-xl border border-border bg-background md:border-background/30 md:bg-background/5">
                            <img
                              src={imageUrl}
                              alt={`Kategori kisim ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
