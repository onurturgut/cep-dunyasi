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
} from '@/components/home/home-data';
import { useSectionParallax } from '@/components/home/useSectionParallax';

type CategoriesSectionProps = {
  categories: HomeCategory[];
};

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const visibleHomeCategories = categories.filter((category) => !hiddenHomeCategorySlugs.has(category.slug));
  const hasVisibleHomeCategories = visibleHomeCategories.length > 0;
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
          className="min-h-[2000px] rounded-3xl border border-border/70 bg-card/75 p-5 text-foreground shadow-lg backdrop-blur-xl md:p-8"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <h2 className="font-display text-2xl font-bold text-foreground">Kategoriler</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {hasVisibleHomeCategories ? (
              visibleHomeCategories.map((category) => {
                const Icon = categoryIcons[category.icon || 'Smartphone'] || categoryIcons.Smartphone;

                return (
                  <div key={category.id}>
                    <Link
                      to={`/products?category=${category.slug}`}
                      className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center text-foreground transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{category.name}</span>
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 space-y-4 md:col-span-5">
                <motion.div style={{ y: accentY }} className="h-[500px] w-full overflow-hidden rounded-xl border border-border/30 bg-card">
                  <motion.img
                    src={encodeURI('/images/image copy.png')}
                    alt="Kategori banner"
                    className="h-full w-full object-contain"
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
                    {Array.from({ length: 3 }).map((_, index) => {
                      const imageName = categorySlotImages[index % categorySlotImages.length];
                      const isFirstSlot = index === 0;

                      return (
                        <motion.div key={`category-slot-top-${index + 1}`} variants={staggerItem}>
                          <div
                            className={`relative h-[500px] w-full overflow-hidden rounded-xl border border-background/30 ${
                              isFirstSlot ? 'bg-card' : 'bg-background/5'
                            }`}
                          >
                            {isFirstSlot ? (
                              <>
                                <video
                                  className="absolute inset-0 h-full w-full object-contain object-center"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                  preload="metadata"
                                >
                                  <source src="/images/AF%C4%B0%C5%9E1.mp4" type="video/mp4" />
                                </video>
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
                                <Link
                                  to="/products?category=telefon"
                                  aria-label="Hemen satin al"
                                  className="absolute bottom-[14px] left-1/2 z-20 h-[40px] w-[132px] -translate-x-1/2 rounded-[12px] bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
                                >
                                  <span className="sr-only">Hemen Satin Al</span>
                                </Link>
                              </>
                            ) : (
                              <img
                                src={encodeURI(`/images/${imageName}`)}
                                alt={`Kategori kisim ${index + 1}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  <div className="grid gap-8 text-left lg:grid-cols-2 lg:gap-16">
                    <motion.div style={{ y: accentY }} className="space-y-4">
                      <img
                        src={encodeURI('/images/cep-dunyasi-logo-black-v3-tight.png')}
                        alt="Cep Dunyasi"
                        className="h-auto w-[180px] dark:hidden md:w-[240px]"
                        loading="lazy"
                      />
                      <img
                        src={encodeURI('/images/cep-dunyasi-logo-dark-v3-tight.png')}
                        alt="Cep Dunyasi"
                        className="hidden h-auto w-[180px] dark:block md:w-[240px]"
                        loading="lazy"
                      />
                      <h3 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
                        Turkiye&apos;nin En Degerli Markalari Arasinda!
                      </h3>
                    </motion.div>

                    <motion.div style={{ y: foregroundY }} className="space-y-6 text-lg leading-relaxed text-muted-foreground">
                      <p>
                        Uluslararasi marka degerlendirme kurulusu Brand Finance&apos;in &quot;Turkiye 2025&quot; raporunda Reeder,
                        ulkemizin en degerli ve en guclu markalari arasinda yerini aldi.
                      </p>
                      <p className="font-semibold text-foreground">Brand Finance &quot;Turkiye 2025&quot; listesinde</p>
                      <p>Reeder, Turkiye&apos;nin en degerli 3. cihaz ureticisi konumunda.</p>
                    </motion.div>
                  </div>

                  <motion.div
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    {Array.from({ length: 3 }).map((_, index) => {
                      const slotIndex = index + 3;
                      const imageName = categorySlotImages[slotIndex % categorySlotImages.length];

                      return (
                        <motion.div key={`category-slot-bottom-${slotIndex + 1}`} variants={staggerItem}>
                          <div className="h-[500px] w-full overflow-hidden rounded-xl border border-background/30 bg-background/5">
                            <img
                              src={encodeURI(`/images/${imageName}`)}
                              alt={`Kategori kisim ${slotIndex + 1}`}
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
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
