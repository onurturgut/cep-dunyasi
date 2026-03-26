"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HeroCampaignSlider } from "@/components/home/HeroCampaignSlider";
import { CampaignCardsGrid } from "@/components/home/CampaignCardsGrid";
import { useCampaigns } from "@/hooks/use-campaigns";
import { buildCampaignPromoCards, buildHeroCampaignSlides } from "@/lib/home-campaigns";

export function CampaignShowcaseSection() {
  const campaignsQuery = useCampaigns();
  const campaigns = useMemo(() => campaignsQuery.data ?? [], [campaignsQuery.data]);
  const heroSlides = useMemo(() => buildHeroCampaignSlides(campaigns), [campaigns]);
  const promoCards = useMemo(() => buildCampaignPromoCards(campaigns), [campaigns]);

  return (
    <motion.section
      id="campaign-showcase"
      className="relative overflow-hidden bg-background py-10 md:py-14"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.12 }}
    >
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <motion.div
          className="absolute left-[6%] top-16 h-56 w-56 rounded-full bg-primary/12 blur-[120px] dark:bg-violet-400/18"
          animate={{ y: [0, 18, 0], opacity: [0.32, 0.5, 0.32] }}
          transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[8%] top-20 h-64 w-64 rounded-full bg-secondary/16 blur-[140px] dark:bg-cyan-300/15"
          animate={{ y: [0, -16, 0], x: [0, -14, 0], opacity: [0.28, 0.42, 0.28] }}
          transition={{ duration: 13, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.58),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
      </div>

      <div className="container relative">
        <div className="rounded-[2.5rem] border border-border/70 bg-card p-4 shadow-[0_20px_54px_rgba(15,23,42,0.08)] md:bg-[linear-gradient(135deg,rgba(255,255,255,0.88)_0%,rgba(248,249,252,0.92)_42%,rgba(243,245,249,0.98)_100%)] md:shadow-[0_30px_100px_rgba(15,23,42,0.12)] md:backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 dark:md:bg-[linear-gradient(135deg,rgba(9,12,22,0.9),rgba(12,16,30,0.94),rgba(18,24,38,0.98))] dark:md:shadow-[0_40px_140px_rgba(2,6,23,0.45)] sm:p-6 lg:p-8">
          <div className="space-y-8">
            <HeroCampaignSlider slides={heroSlides} isLoading={campaignsQuery.isLoading} />
            <CampaignCardsGrid cards={promoCards} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
