"use client";

import { motion } from 'framer-motion';
import {
  sectionReveal,
  type HomeCategory,
  type HomeSiteContent,
} from '@/components/home/home-data';
import { useSectionParallax } from '@/components/home/useSectionParallax';

type CategoriesSectionProps = {
  categories: HomeCategory[];
  content: HomeSiteContent;
};

export function CategoriesSection({ categories: _categories, content }: CategoriesSectionProps) {
  const showBanner = content.category_banner_enabled ?? false;
  const { ref, backgroundY, foregroundY, accentY, scale } = useSectionParallax<HTMLElement>({
    distance: 90,
    rotate: 4,
  });

  if (!showBanner) {
    return null;
  }

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
          className="relative min-h-0 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,#050814_0%,#0b1120_42%,#121826_100%)] p-5 text-white shadow-[0_36px_120px_rgba(2,6,23,0.4)] md:p-8"
          variants={sectionReveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[8%] top-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-[110px]" />
            <div className="absolute right-[10%] top-12 h-48 w-48 rounded-full bg-cyan-400/12 blur-[130px]" />
            <div className="absolute bottom-[-4rem] left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-white/8 blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_40%)]" />
          </div>

          <div className="relative grid items-start gap-8 text-left lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:gap-12">
            <motion.div style={{ y: accentY }} className="max-w-[38rem] space-y-5">
              <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72 backdrop-blur-xl">
                Brand Finance 2025
              </span>

              {(content.hero_logo_dark_url || content.hero_logo_light_url) && (
                <div className="inline-flex rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl">
                  <img
                    src={content.hero_logo_dark_url || content.hero_logo_light_url}
                    alt="Cep Dunyasi"
                    className="h-auto w-[180px] md:w-[240px]"
                    loading="lazy"
                  />
                </div>
              )}

              <h3 className="max-w-[11ch] font-display text-4xl font-bold leading-[1.02] tracking-tight text-white md:text-[3.8rem]">
                {content.category_banner_brand_title}
              </h3>

              <p className="max-w-xl text-sm leading-7 text-white/62 sm:text-base">
                Premium teknoloji vitrini, guven veren marka konumlanmasi ve temiz bir sunum diliyle desteklenir.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] px-4 py-3.5 backdrop-blur-xl">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/45">Odak</p>
                  <p className="mt-1.5 text-base font-semibold text-white md:text-lg">Premium mobil deneyim</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] px-4 py-3.5 backdrop-blur-xl">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/45">Konum</p>
                  <p className="mt-1.5 text-base font-semibold text-white md:text-lg">Guclu marka algisi</p>
                </div>
              </div>
            </motion.div>

            <motion.div style={{ y: foregroundY }} className="grid auto-rows-max content-start self-start gap-3 lg:pl-2">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.35 }}
                className="rounded-[1.45rem] border border-white/10 bg-white/[0.06] px-5 py-4 shadow-[0_18px_46px_rgba(2,6,23,0.18)] backdrop-blur-2xl"
              >
                <p className="text-base leading-7 text-white/74 md:text-[1.03rem]">{content.category_banner_brand_desc_1}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.35 }}
                className="rounded-[1.55rem] border border-fuchsia-300/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))] px-5 py-4 shadow-[0_22px_56px_rgba(2,6,23,0.22)] backdrop-blur-2xl"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-fuchsia-100/70">One Cikan Vurgu</p>
                <p className="mt-2.5 text-lg font-semibold leading-8 text-white md:text-[1.38rem]">{content.category_banner_brand_desc_2}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.35 }}
                className="rounded-[1.45rem] border border-white/10 bg-white/[0.05] px-5 py-4 shadow-[0_18px_46px_rgba(2,6,23,0.18)] backdrop-blur-2xl"
              >
                <p className="text-base leading-7 text-white/74 md:text-[1.03rem]">{content.category_banner_brand_desc_3}</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
