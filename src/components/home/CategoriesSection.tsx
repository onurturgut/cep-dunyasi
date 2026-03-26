"use client";

import { motion } from 'framer-motion';
import {
  sectionReveal,
  type HomeCategory,
  type HomeSiteContent,
} from '@/components/home/home-data';

type CategoriesSectionProps = {
  categories: HomeCategory[];
  content: HomeSiteContent;
};

export function CategoriesSection({ categories: _categories, content }: CategoriesSectionProps) {
  const showBanner = content.category_banner_enabled ?? false;

  if (!showBanner) {
    return null;
  }

  return (
    <motion.section id="home-categories" data-section="categories" className="relative bg-background pb-10 md:pb-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-20 hidden h-[32rem] overflow-hidden md:block"
      >
        <div className="absolute left-[8%] top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[10%] top-40 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container -mt-8 md:-mt-10">
        <motion.div
          className="relative min-h-0 overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-5 text-foreground shadow-[0_18px_42px_rgba(15,23,42,0.08)] md:bg-[linear-gradient(135deg,rgba(255,255,255,0.88)_0%,rgba(248,249,252,0.92)_42%,rgba(243,245,249,0.98)_100%)] md:shadow-[0_30px_90px_rgba(15,23,42,0.12)] md:backdrop-blur-2xl md:p-8 dark:border-white/10 dark:bg-slate-950/95 dark:md:bg-[linear-gradient(135deg,#060915_0%,#0c1220_42%,#151b29_100%)] dark:text-white dark:md:shadow-[0_36px_120px_rgba(2,6,23,0.34)]"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute left-[8%] top-10 h-40 w-40 rounded-full bg-primary/10 blur-[110px] dark:bg-fuchsia-500/15" />
            <div className="absolute right-[10%] top-12 h-48 w-48 rounded-full bg-secondary/12 blur-[130px] dark:bg-cyan-400/12" />
            <div className="absolute bottom-[-4rem] left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-white/55 blur-[120px] dark:bg-white/8" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.52),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_40%)]" />
          </div>

          <div className="relative grid items-start gap-8 text-left lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:gap-12">
            <motion.div className="max-w-[38rem] space-y-5">
              <span className="inline-flex rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground md:bg-background/75 md:backdrop-blur-xl dark:border-white/12 dark:bg-slate-900 dark:md:bg-white/6 dark:text-white/72">
                Brand Finance 2025
              </span>

              {(content.hero_logo_dark_url || content.hero_logo_light_url) && (
                <div className="inline-flex rounded-[1.5rem] border border-border/70 bg-card px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.08)] md:bg-background/80 md:backdrop-blur-xl dark:border-white/10 dark:bg-slate-900 dark:md:bg-white/6 dark:md:shadow-[0_20px_60px_rgba(2,6,23,0.28)]">
                  {(content.hero_logo_light_url || content.hero_logo_dark_url) && (
                    <img
                      src={content.hero_logo_light_url || content.hero_logo_dark_url}
                      alt="Cep Dunyasi"
                      className="h-auto w-[180px] dark:hidden md:w-[240px]"
                      loading="lazy"
                    />
                  )}
                  {(content.hero_logo_dark_url || content.hero_logo_light_url) && (
                    <img
                      src={content.hero_logo_dark_url || content.hero_logo_light_url}
                      alt="Cep Dunyasi"
                      className="hidden h-auto w-[180px] dark:block md:w-[240px]"
                      loading="lazy"
                    />
                  )}
                </div>
              )}

              <h3 className="max-w-[11ch] font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground md:text-[3.6rem] dark:text-white">
                {content.category_banner_brand_title}
              </h3>

              <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base dark:text-white/62">
                Premium teknoloji vitrini, guven veren marka konumlanmasi ve temiz bir sunum diliyle desteklenir.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-border/70 bg-card px-4 py-3.5 md:bg-background/80 md:backdrop-blur-xl dark:border-white/10 dark:bg-slate-900 dark:md:bg-white/[0.05]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground/80 dark:text-white/45">Odak</p>
                  <p className="mt-1.5 text-base font-semibold text-foreground md:text-lg dark:text-white">Premium mobil deneyim</p>
                </div>
                <div className="rounded-[1.3rem] border border-border/70 bg-card px-4 py-3.5 md:bg-background/80 md:backdrop-blur-xl dark:border-white/10 dark:bg-slate-900 dark:md:bg-white/[0.05]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground/80 dark:text-white/45">Konum</p>
                  <p className="mt-1.5 text-base font-semibold text-foreground md:text-lg dark:text-white">Guclu marka algisi</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="grid auto-rows-max content-start self-start gap-3 lg:pl-2">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.35 }}
                className="rounded-[1.45rem] border border-border/70 bg-card px-5 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] md:bg-background/82 md:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900 dark:md:bg-white/[0.06] dark:md:shadow-[0_18px_46px_rgba(2,6,23,0.18)]"
              >
                <p className="text-base leading-7 text-muted-foreground md:text-[1.03rem] dark:text-white/74">{content.category_banner_brand_desc_1}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.35 }}
                className="rounded-[1.55rem] border border-primary/20 bg-card px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.10)] md:bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,255,255,0.68))] md:backdrop-blur-2xl dark:border-fuchsia-300/18 dark:bg-slate-900 dark:md:bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))] dark:md:shadow-[0_22px_56px_rgba(2,6,23,0.22)]"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-primary/80 dark:text-fuchsia-100/70">One Cikan Vurgu</p>
                <p className="mt-2.5 text-lg font-semibold leading-8 text-foreground md:text-[1.38rem] dark:text-white">{content.category_banner_brand_desc_2}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.35 }}
                className="rounded-[1.45rem] border border-border/70 bg-card px-5 py-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] md:bg-background/82 md:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900 dark:md:bg-white/[0.05] dark:md:shadow-[0_18px_46px_rgba(2,6,23,0.18)]"
              >
                <p className="text-base leading-7 text-muted-foreground md:text-[1.03rem] dark:text-white/74">{content.category_banner_brand_desc_3}</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
