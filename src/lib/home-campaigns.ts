import type { CampaignRecord } from "@/lib/campaigns";

export type CampaignThemeVariant = "midnight" | "violet" | "graphite" | "emerald";

export type HeroCampaignSlideData = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  badgeText?: string | null;
  badgeSecondaryText?: string | null;
  ctaText: string;
  ctaLink: string;
  themeVariant: CampaignThemeVariant;
};

export type CampaignPromoCardData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  badgeText?: string | null;
  ctaText: string;
  ctaLink: string;
  themeVariant: CampaignThemeVariant;
};

const heroThemeSequence: CampaignThemeVariant[] = ["midnight", "violet", "graphite", "emerald"];

function getThemeVariant(index: number): CampaignThemeVariant {
  return heroThemeSequence[index % heroThemeSequence.length] ?? "midnight";
}

export function buildHeroCampaignSlides(campaigns: CampaignRecord[]) {
  if (campaigns.length === 0) {
    return [];
  }

  return campaigns.map((campaign, index) => ({
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle || "Premium Campaign",
    description: campaign.description || "Modern teknoloji urunlerini one cikaracak premium vitrin alani.",
    imageUrl: campaign.imageUrl,
    mobileImageUrl: campaign.mobileImageUrl ?? campaign.imageUrl,
    badgeText: campaign.badgeText,
    badgeSecondaryText: campaign.ctaText || null,
    ctaText: campaign.ctaText || "Kampanyayi Incele",
    ctaLink: campaign.ctaLink || "/products",
    themeVariant: getThemeVariant(index),
  })) satisfies HeroCampaignSlideData[];
}

export function buildCampaignPromoCards(campaigns: CampaignRecord[]) {
  if (campaigns.length === 0) {
    return [];
  }

  return campaigns.slice(0, 3).map((campaign, index) => ({
    id: `promo-${campaign.id}`,
    title: campaign.title,
    description: campaign.description || "Secili kampanya urunlerini vitrinde gosteren promo karti.",
    imageUrl: campaign.mobileImageUrl || campaign.imageUrl,
    badgeText: campaign.badgeText,
    ctaText: campaign.ctaText || "Detayli Incele",
    ctaLink: campaign.ctaLink || "/products",
    themeVariant: getThemeVariant(index),
  })) satisfies CampaignPromoCardData[];
}
