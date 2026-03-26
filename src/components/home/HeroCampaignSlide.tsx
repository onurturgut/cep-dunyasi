"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CampaignBadge } from "@/components/home/CampaignBadge";
import { CampaignCTAButton } from "@/components/home/CampaignCTAButton";
import type { CampaignThemeVariant, HeroCampaignSlideData } from "@/lib/home-campaigns";

type HeroCampaignSlideProps = {
  slide: HeroCampaignSlideData;
  priority?: boolean;
};

const themeClassMap: Record<CampaignThemeVariant, { shell: string; accent: string; glow: string }> = {
  midnight: {
    shell: "from-slate-950 via-slate-900 to-slate-950",
    accent: "from-cyan-400/10 via-transparent to-fuchsia-400/10",
    glow: "bg-cyan-400/20",
  },
  violet: {
    shell: "from-slate-950 via-violet-950/80 to-slate-950",
    accent: "from-violet-400/14 via-transparent to-fuchsia-400/12",
    glow: "bg-violet-400/20",
  },
  graphite: {
    shell: "from-slate-950 via-slate-800 to-zinc-950",
    accent: "from-slate-200/12 via-transparent to-sky-300/10",
    glow: "bg-slate-200/15",
  },
  emerald: {
    shell: "from-slate-950 via-emerald-950/70 to-slate-950",
    accent: "from-emerald-300/14 via-transparent to-cyan-300/12",
    glow: "bg-emerald-300/18",
  },
};

function isOptimizedSource(src: string) {
  return src.startsWith("/");
}

export function HeroCampaignSlide({ slide, priority = false }: HeroCampaignSlideProps) {
  const theme = themeClassMap[slide.themeVariant];

  return (
    <article className={`relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br ${theme.shell} text-white shadow-[0_28px_80px_rgba(2,6,23,0.46)]`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent}`} />
      <motion.div
        aria-hidden="true"
        className={`absolute -left-8 top-12 h-40 w-40 rounded-full blur-3xl ${theme.glow}`}
        animate={{ y: [0, -12, 0], opacity: [0.55, 0.75, 0.55] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[-4rem] right-[-2rem] h-64 w-64 rounded-full bg-fuchsia-400/12 blur-3xl"
        animate={{ y: [0, 16, 0], x: [0, -10, 0], opacity: [0.3, 0.48, 0.3] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative grid min-h-[34rem] gap-8 px-6 py-8 sm:px-8 md:px-10 lg:min-h-[38rem] lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center lg:px-12 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {slide.badgeText ? <CampaignBadge themeVariant={slide.themeVariant}>{slide.badgeText}</CampaignBadge> : null}
            {slide.badgeSecondaryText ? (
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/70 backdrop-blur-xl">
                {slide.badgeSecondaryText}
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-sm font-medium uppercase tracking-[0.28em] text-white/60">{slide.subtitle}</p>
          <h2 className="mt-4 max-w-[12ch] font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl xl:text-6xl">
            {slide.title}
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base lg:max-w-xl">
            {slide.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <CampaignCTAButton to={slide.ctaLink} label={slide.ctaText} />
            <CampaignCTAButton to={slide.ctaLink} label="Detaylari Gor" variant="secondary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="order-1 flex min-h-[18rem] items-center justify-center lg:order-2 lg:min-h-[30rem]"
        >
          <div className="relative flex w-full items-center justify-center">
            <motion.div
              aria-hidden="true"
              className="absolute inset-x-8 bottom-6 h-10 rounded-full bg-white/10 blur-2xl"
              animate={{ scaleX: [1, 1.08, 1] }}
              transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="relative flex max-h-[30rem] min-h-[18rem] w-full items-center justify-center"
            >
              {isOptimizedSource(slide.imageUrl) ? (
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  width={1000}
                  height={1000}
                  priority={priority}
                  sizes="(max-width: 1024px) 80vw, 40vw"
                  className="h-auto max-h-[26rem] w-auto max-w-full object-contain drop-shadow-[0_28px_80px_rgba(15,23,42,0.5)] sm:max-h-[28rem] lg:max-h-[32rem]"
                />
              ) : (
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  loading={priority ? "eager" : "lazy"}
                  className="h-auto max-h-[26rem] w-auto max-w-full object-contain drop-shadow-[0_28px_80px_rgba(15,23,42,0.5)] sm:max-h-[28rem] lg:max-h-[32rem]"
                />
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </article>
  );
}
