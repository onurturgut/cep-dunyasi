"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CampaignBadge } from "@/components/home/CampaignBadge";
import { CampaignCTAButton } from "@/components/home/CampaignCTAButton";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CampaignThemeVariant, HeroCampaignSlideData } from "@/lib/home-campaigns";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";

type HeroCampaignSlideProps = {
  slide: HeroCampaignSlideData;
  priority?: boolean;
};

const themeClassMap: Record<CampaignThemeVariant, { shell: string; accent: string; glow: string }> = {
  midnight: {
    shell: "md:from-slate-50 md:via-slate-100 md:to-white dark:md:from-slate-950 dark:md:via-slate-900 dark:md:to-slate-950",
    accent: "from-primary/10 via-transparent to-secondary/10 dark:from-cyan-400/10 dark:via-transparent dark:to-fuchsia-400/10",
    glow: "bg-secondary/18 dark:bg-cyan-400/20",
  },
  violet: {
    shell: "md:from-violet-50 md:via-slate-50 md:to-fuchsia-50 dark:md:from-slate-950 dark:md:via-violet-950/80 dark:md:to-slate-950",
    accent: "from-violet-400/10 via-transparent to-fuchsia-300/10 dark:from-violet-400/14 dark:via-transparent dark:to-fuchsia-400/12",
    glow: "bg-violet-300/20 dark:bg-violet-400/20",
  },
  graphite: {
    shell: "md:from-zinc-50 md:via-slate-50 md:to-white dark:md:from-slate-950 dark:md:via-slate-800 dark:md:to-zinc-950",
    accent: "from-slate-300/16 via-transparent to-sky-200/10 dark:from-slate-200/12 dark:via-transparent dark:to-sky-300/10",
    glow: "bg-slate-300/20 dark:bg-slate-200/15",
  },
  emerald: {
    shell: "md:from-emerald-50 md:via-slate-50 md:to-cyan-50 dark:md:from-slate-950 dark:md:via-emerald-950/70 dark:md:to-slate-950",
    accent: "from-emerald-300/14 via-transparent to-cyan-300/12 dark:from-emerald-300/14 dark:via-transparent dark:to-cyan-300/12",
    glow: "bg-emerald-300/18 dark:bg-emerald-300/18",
  },
};

export function HeroCampaignSlide({ slide, priority = false }: HeroCampaignSlideProps) {
  const theme = themeClassMap[slide.themeVariant];
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const enableAmbientMotion = !isMobile && !prefersReducedMotion;

  return (
    <article className="relative overflow-hidden rounded-[2.25rem] text-foreground shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:text-white dark:md:shadow-[0_28px_80px_rgba(2,6,23,0.46)]">
      <motion.div
        aria-hidden="true"
        className={`absolute -left-8 top-12 hidden h-40 w-40 rounded-full blur-3xl md:block ${theme.glow}`}
        animate={enableAmbientMotion ? { y: [0, -12, 0], opacity: [0.55, 0.75, 0.55] } : undefined}
        transition={enableAmbientMotion ? { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : undefined}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[-4rem] right-[-2rem] hidden h-64 w-64 rounded-full bg-primary/10 blur-3xl md:block dark:bg-fuchsia-400/12"
        animate={enableAmbientMotion ? { y: [0, 16, 0], x: [0, -10, 0], opacity: [0.3, 0.48, 0.3] } : undefined}
        transition={enableAmbientMotion ? { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : undefined}
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
              <span className="inline-flex rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground md:bg-background/75 md:backdrop-blur-xl dark:border-white/10 dark:bg-slate-900 dark:md:bg-white/5 dark:text-white/80">
                {slide.badgeSecondaryText}
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground dark:text-white/72">{slide.subtitle}</p>
          <h2 className="mt-4 max-w-[12ch] font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl xl:text-6xl">
            {slide.title}
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground dark:text-white/80 sm:text-base lg:max-w-xl">
            {slide.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <CampaignCTAButton to={slide.ctaLink} label={slide.ctaText} campaignId={slide.id} />
            <CampaignCTAButton to={slide.ctaLink} label="Detaylari Gör" variant="secondary" campaignId={slide.id} />
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
              className="absolute inset-x-8 bottom-6 hidden h-10 rounded-full bg-foreground/10 blur-2xl md:block dark:bg-white/10"
              animate={enableAmbientMotion ? { scaleX: [1, 1.08, 1] } : undefined}
              transition={enableAmbientMotion ? { duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : undefined}
            />
            <motion.div
              animate={enableAmbientMotion ? { y: [0, -8, 0] } : undefined}
              transition={enableAmbientMotion ? { duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : undefined}
              className="relative flex max-h-[30rem] min-h-[18rem] w-full items-center justify-center"
            >
              <Image
                src={getOptimizedImageUrl(slide.imageUrl, { kind: "campaign-banner" })}
                alt={slide.title}
                width={1000}
                height={1000}
                priority={priority}
                sizes={getResponsiveImageSizes("campaign-banner")}
                className={`h-auto max-h-[26rem] w-auto max-w-full object-contain ${enableAmbientMotion ? "drop-shadow-[0_28px_80px_rgba(15,23,42,0.5)]" : "drop-shadow-[0_16px_34px_rgba(15,23,42,0.24)]"} sm:max-h-[28rem] lg:max-h-[32rem]`}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </article>
  );
}

