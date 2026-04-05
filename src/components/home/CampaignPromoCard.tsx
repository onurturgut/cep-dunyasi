"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CampaignBadge } from "@/components/home/CampaignBadge";
import { CampaignCTAButton } from "@/components/home/CampaignCTAButton";
import type { CampaignPromoCardData, CampaignThemeVariant } from "@/lib/home-campaigns";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";

type CampaignPromoCardProps = {
  card: CampaignPromoCardData;
  index: number;
};

const cardThemeClasses: Record<CampaignThemeVariant, string> = {
  midnight: "md:from-slate-50 md:via-slate-100 md:to-white dark:md:from-slate-900/95 dark:md:via-slate-900/80 dark:md:to-slate-950/95",
  violet: "md:from-violet-50 md:via-slate-50 md:to-fuchsia-50 dark:md:from-violet-950/90 dark:md:via-slate-900/85 dark:md:to-slate-950/95",
  graphite: "md:from-zinc-50 md:via-slate-50 md:to-white dark:md:from-zinc-900/95 dark:md:via-slate-900/80 dark:md:to-zinc-950/95",
  emerald: "md:from-emerald-50 md:via-slate-50 md:to-cyan-50 dark:md:from-emerald-950/90 dark:md:via-slate-900/85 dark:md:to-slate-950/95",
};

export function CampaignPromoCard({ card, index }: CampaignPromoCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.2 }}
      className={`group relative overflow-hidden rounded-[2rem] border border-border/70 bg-card md:bg-gradient-to-br ${cardThemeClasses[card.themeVariant]} p-5 text-foreground shadow-[0_16px_34px_rgba(15,23,42,0.07)] md:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 dark:text-white dark:md:shadow-[0_24px_60px_rgba(2,6,23,0.34)]`}
    >
      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.48),transparent_38%)] md:block dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%)]" />
      <div className="absolute -right-10 top-8 hidden h-36 w-36 rounded-full bg-primary/10 blur-3xl transition-transform duration-700 group-hover:scale-110 md:block dark:bg-white/8" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          {card.badgeText ? <CampaignBadge themeVariant={card.themeVariant}>{card.badgeText}</CampaignBadge> : <span />}
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border/70 bg-background px-4 py-6 md:bg-background/75 md:backdrop-blur-xl dark:border-white/10 dark:bg-slate-900 dark:md:bg-white/5">
          <Image
            src={getOptimizedImageUrl(card.imageUrl, { kind: "campaign-banner" })}
            alt={card.title}
            width={640}
            height={640}
            sizes={getResponsiveImageSizes("campaign-banner")}
            className="mx-auto h-auto max-h-52 w-auto object-contain transition-transform duration-700 group-hover:scale-[1.05]"
          />
        </div>

        <div className="mt-5 space-y-3">
          <h3 className="font-display text-2xl font-semibold tracking-tight">{card.title}</h3>
          <p className="text-sm leading-7 text-muted-foreground dark:text-white/80">{card.description}</p>
        </div>

        <div className="mt-6">
          <CampaignCTAButton
            to={card.ctaLink}
            label={card.ctaText}
            variant="secondary"
            className="w-full justify-center sm:w-auto"
            campaignId={card.id}
          />
        </div>
      </div>
    </motion.article>
  );
}
