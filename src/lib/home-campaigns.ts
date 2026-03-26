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

export const fallbackHeroCampaignSlides: HeroCampaignSlideData[] = [
  {
    id: "showcase-iphone",
    title: "iPhone 16 Pro ile yeni nesil hiz ve cekim deneyimi",
    subtitle: "Premium Secim",
    description: "Sinirli stok, zarif tasarim ve guclu performansi tek vitrinde birlestiren ozel kampanya secimi.",
    imageUrl: "/images/iphone15.png",
    mobileImageUrl: "/images/iphone15.png",
    badgeText: "4 Taksit",
    badgeSecondaryText: "Apple Koleksiyonu",
    ctaText: "Kampanyayi Incele",
    ctaLink: "/products?category=telefon",
    themeVariant: "midnight",
  },
  {
    id: "showcase-airpods",
    title: "AirPods ve gunluk aksesuarlar icin premium paketler",
    subtitle: "Ses ve Konfor",
    description: "Kablosuz kulaklik, sarj ve tasima aksesuarlariyla kurulan sade ama yuksek donusumlu bundle vitrini.",
    imageUrl: "/images/airpods.png",
    mobileImageUrl: "/images/airpods.png",
    badgeText: "Bundle Firsati",
    badgeSecondaryText: "Aksesuar Setleri",
    ctaText: "Paketleri Gor",
    ctaLink: "/products?category=kilif",
    themeVariant: "violet",
  },
  {
    id: "showcase-watch",
    title: "Akilli saat ve gunluk mobil yasam kombinleri",
    subtitle: "Giyilebilir Teknoloji",
    description: "Saat, power bank ve gunluk mobil ihtiyaclari tek bakista gosteren modern vitrin yapisi.",
    imageUrl: "/images/akilli-saat.jpg",
    mobileImageUrl: "/images/akilli-saat.jpg",
    badgeText: "Yeni Sezon",
    badgeSecondaryText: "Watch Edit",
    ctaText: "Detayli Incele",
    ctaLink: "/products?category=akilli-saatler",
    themeVariant: "graphite",
  },
];

export const fallbackCampaignPromoCards: CampaignPromoCardData[] = [
  {
    id: "promo-phone",
    title: "Telefon Kampanyalari",
    description: "Yeni nesil iPhone ve Android modellerde premium secimler, taksit avantajlari ve dikkat ceken vitrin kurgusu.",
    imageUrl: "/images/iphone15.png",
    badgeText: "Yeni",
    ctaText: "Hemen Al",
    ctaLink: "/products?category=telefon",
    themeVariant: "midnight",
  },
  {
    id: "promo-audio",
    title: "AirPods ve Aksesuar Seckisi",
    description: "Kulaklik, kilif ve sarj urunlerini tek bakista gosteren temiz ve yuksek donusumlu promo karti.",
    imageUrl: "/images/airpods.png",
    badgeText: "Aksesuar",
    ctaText: "Detayli Incele",
    ctaLink: "/products?category=kilif",
    themeVariant: "violet",
  },
  {
    id: "promo-watch",
    title: "Watch ve Bundle Firsatlari",
    description: "Akilli saat, power bank ve tamamlayici urunleri birlikte one cikaran premium bundle vitrini.",
    imageUrl: "/images/akilli-saat.jpg",
    badgeText: "Bundle",
    ctaText: "Paketleri Gor",
    ctaLink: "/products?category=akilli-saatler",
    themeVariant: "graphite",
  },
];

function getThemeVariant(index: number): CampaignThemeVariant {
  return heroThemeSequence[index % heroThemeSequence.length] ?? "midnight";
}

export function buildHeroCampaignSlides(campaigns: CampaignRecord[]) {
  if (campaigns.length === 0) {
    return fallbackHeroCampaignSlides;
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
  if (campaigns.length >= 3) {
    return campaigns.slice(0, 3).map((campaign, index) => ({
      id: `promo-${campaign.id}`,
      title: campaign.title,
      description: campaign.description || "Secili kampanya urunlerini vitrinde gosteren premium promo karti.",
      imageUrl: campaign.mobileImageUrl || campaign.imageUrl,
      badgeText: campaign.badgeText,
      ctaText: campaign.ctaText || "Detayli Incele",
      ctaLink: campaign.ctaLink || "/products",
      themeVariant: getThemeVariant(index),
    })) satisfies CampaignPromoCardData[];
  }

  return fallbackCampaignPromoCards;
}
