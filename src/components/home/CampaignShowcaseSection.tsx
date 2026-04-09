"use client";

import { useMemo } from "react";
import { CampaignCardsGrid } from "@/components/home/CampaignCardsGrid";
import { HeroCampaignSlider } from "@/components/home/HeroCampaignSlider";
import { useCampaigns } from "@/hooks/use-campaigns";
import { buildCampaignPromoCards, buildHeroCampaignSlides } from "@/lib/home-campaigns";

export function CampaignShowcaseSection() {
  const campaignsQuery = useCampaigns();
  const campaigns = useMemo(() => campaignsQuery.data ?? [], [campaignsQuery.data]);
  const heroSlides = useMemo(() => buildHeroCampaignSlides(campaigns), [campaigns]);
  const promoCards = useMemo(() => buildCampaignPromoCards(campaigns), [campaigns]);

  if (heroSlides.length === 0) {
    return null;
  }

  return (
    <section
      id="campaign-showcase"
      className="relative overflow-hidden bg-background py-10 md:py-14 dark:bg-[radial-gradient(circle_at_top,rgba(28,40,68,0.4),transparent_32%),linear-gradient(180deg,#0b1220_0%,#0f172a_55%,#0b1220_100%)]"
    >
      <div className="container relative">
        <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_42%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))] p-4 shadow-[0_24px_70px_-40px_rgba(148,163,184,0.5)] sm:p-6 lg:rounded-[2.5rem] lg:p-8 dark:border-white/[0.08] dark:bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.1),transparent_34%),linear-gradient(135deg,rgba(24,33,49,0.98),rgba(11,18,32,0.98))] dark:shadow-[0_34px_90px_-44px_rgba(2,6,23,0.88)]">
          <HeroCampaignSlider slides={heroSlides} isLoading={campaignsQuery.isLoading} />
          <div className="mt-6">
            <CampaignCardsGrid cards={promoCards} />
          </div>
        </div>
      </div>
    </section>
  );
}
