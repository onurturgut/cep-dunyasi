"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HeroCampaignSlider } from "@/components/home/HeroCampaignSlider";
import { CampaignCardsGrid } from "@/components/home/CampaignCardsGrid";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildCampaignPromoCards, buildHeroCampaignSlides } from "@/lib/home-campaigns";

export function CampaignShowcaseSection() {
  const campaignsQuery = useCampaigns();
  const campaigns = useMemo(() => campaignsQuery.data ?? [], [campaignsQuery.data]);
  const heroSlides = useMemo(() => buildHeroCampaignSlides(campaigns), [campaigns]);
  const promoCards = useMemo(() => buildCampaignPromoCards(campaigns), [campaigns]);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const enableAmbientMotion = !isMobile && !prefersReducedMotion;

  return (
    <motion.section
      id="campaign-showcase"
      className="relative overflow-hidden bg-background py-10 md:py-14"
      initial={enableAmbientMotion ? { opacity: 0, y: 24 } : false}
      whileInView={enableAmbientMotion ? { opacity: 1, y: 0 } : undefined}
      transition={enableAmbientMotion ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] } : undefined}
      viewport={{ once: true, amount: 0.12 }}
    >
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <motion.div
          className="absolute left-[6%] top-16 h-56 w-56 rounded-full bg-primary/12 blur-[120px] dark:bg-violet-400/18"
          animate={enableAmbientMotion ? { y: [0, 18, 0], opacity: [0.32, 0.5, 0.32] } : undefined}
          transition={enableAmbientMotion ? { duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : undefined}
        />
        <motion.div
          className="absolute right-[8%] top-20 h-64 w-64 rounded-full bg-secondary/16 blur-[140px] dark:bg-cyan-300/15"
          animate={enableAmbientMotion ? { y: [0, -16, 0], x: [0, -14, 0], opacity: [0.28, 0.42, 0.28] } : undefined}
          transition={enableAmbientMotion ? { duration: 13, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : undefined}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.58),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
      </div>

      <div className="container relative">
        <div className="rounded-[2.5rem] p-4 sm:p-6 lg:p-8">
          <div className="space-y-8">
            <HeroCampaignSlider slides={heroSlides} isLoading={campaignsQuery.isLoading} />
            <CampaignCardsGrid cards={promoCards} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
