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
      className="relative overflow-hidden bg-[linear-gradient(180deg,#060913_0%,#070b16_30%,#0b1020_100%)] py-10 text-white md:py-14"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.12 }}
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[6%] top-16 h-56 w-56 rounded-full bg-violet-400/18 blur-[120px]"
          animate={{ y: [0, 18, 0], opacity: [0.32, 0.5, 0.32] }}
          transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[8%] top-20 h-64 w-64 rounded-full bg-cyan-300/15 blur-[140px]"
          animate={{ y: [0, -16, 0], x: [0, -14, 0], opacity: [0.28, 0.42, 0.28] }}
          transition={{ duration: 13, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
      </div>

      <div className="container relative">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_40px_140px_rgba(2,6,23,0.45)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <div className="space-y-8">
            <HeroCampaignSlider slides={heroSlides} isLoading={campaignsQuery.isLoading} />
            <CampaignCardsGrid cards={promoCards} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
