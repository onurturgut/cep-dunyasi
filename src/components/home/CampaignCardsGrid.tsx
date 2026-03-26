"use client";

import { CampaignPromoCard } from "@/components/home/CampaignPromoCard";
import type { CampaignPromoCardData } from "@/lib/home-campaigns";

type CampaignCardsGridProps = {
  cards: CampaignPromoCardData[];
};

export function CampaignCardsGrid({ cards }: CampaignCardsGridProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cards.map((card, index) => (
        <CampaignPromoCard key={card.id} card={card} index={index} />
      ))}
    </div>
  );
}
