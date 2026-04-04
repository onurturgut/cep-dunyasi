export const NEWSLETTER_SOURCES = ["footer", "popup", "homepage-inline", "checkout", "manual"] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export const MARKETING_EVENT_TYPES = [
  "campaign_view",
  "campaign_click",
  "popup_view",
  "popup_close",
  "popup_cta_click",
  "newsletter_subscribe",
  "whatsapp_click",
  "live_chat_open",
  "product_view",
  "add_to_cart",
  "add_to_favorites",
  "checkout_started",
  "order_completed",
  "referral_link_open",
  "referral_registered",
] as const;
export type MarketingEventType = (typeof MARKETING_EVENT_TYPES)[number];

export type MarketingEventPayload = {
  eventType: MarketingEventType;
  entityType?: string | null;
  entityId?: string | null;
  pagePath?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

export const POPUP_TRIGGER_TYPES = ["delay", "scroll", "exit_intent"] as const;
export type PopupTriggerType = (typeof POPUP_TRIGGER_TYPES)[number];

export const MARKETING_AUDIENCES = ["all", "guest", "authenticated"] as const;
export type MarketingAudience = (typeof MARKETING_AUDIENCES)[number];

export const LIVE_SUPPORT_PROVIDERS = ["none", "tawk", "crisp", "custom"] as const;
export type LiveSupportProvider = (typeof LIVE_SUPPORT_PROVIDERS)[number];

export type SocialProofItemRecord = {
  id: string;
  label: string;
  value: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  order: number;
  sourceType: "manual" | "derived";
  createdAt: string;
  updatedAt: string;
};

export type FeaturedReviewRecord = {
  id: string;
  productId: string;
  productName: string | null;
  productSlug: string | null;
  authorName: string;
  rating: number;
  comment: string;
  title: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
};

export type MarketingSettingsRecord = {
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterSuccessMessage: string;
  newsletterConsentLabel: string;
  whatsappEnabled: boolean;
  whatsappPhone: string;
  whatsappMessage: string;
  whatsappHelpText: string;
  whatsappShowOnMobile: boolean;
  whatsappShowOnDesktop: boolean;
  liveSupportEnabled: boolean;
  liveSupportProvider: LiveSupportProvider;
  liveSupportScriptUrl: string | null;
  liveSupportWidgetId: string | null;
  liveSupportShowOnMobile: boolean;
  liveSupportShowOnDesktop: boolean;
  loyaltyEnabled: boolean;
  loyaltyPointsPerCurrency: number;
  referralEnabled: boolean;
  referralRewardPoints: number;
  lowStockThreshold: number;
};

export type MarketingPopupRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  badgeText: string | null;
  themeVariant: string | null;
  triggerType: PopupTriggerType;
  delaySeconds: number;
  scrollPercent: number;
  showOncePerSession: boolean;
  targetPaths: string[];
  audience: MarketingAudience;
};

export type NewsletterSubscriberRecord = {
  id: string;
  email: string;
  firstName: string | null;
  source: NewsletterSource;
  campaignSource: string | null;
  isVerified: boolean;
  consentNewsletter: boolean;
  consentKvkk: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyTransactionRecord = {
  id: string;
  userId: string;
  type: "earn" | "spend" | "expire" | "admin_adjust";
  points: number;
  orderId: string | null;
  description: string;
  createdAt: string;
};

export type ReferralRecord = {
  id: string;
  referrerUserId: string;
  referredUserId: string | null;
  referralCode: string;
  status: "registered" | "first_order_completed" | "rewarded";
  rewardType: "loyalty_points";
  rewardValue: number;
  createdAt: string;
  updatedAt: string;
};

export type MarketingHomeModules = {
  settings: MarketingSettingsRecord;
  socialProofItems: SocialProofItemRecord[];
  featuredReviews: FeaturedReviewRecord[];
};

export function getDefaultMarketingSettings(): MarketingSettingsRecord {
  return {
    newsletterEnabled: true,
    newsletterTitle: "Kampanyalari ilk sen ogren",
    newsletterDescription: "Yeni urunler, premium koleksiyonlar ve sessizce gelen indirimler icin e-posta listemize katil.",
    newsletterSuccessMessage: "Kaydin tamamlandi. Yeni kampanyalari sana e-posta ile haber verecegiz.",
    newsletterConsentLabel: "Kampanya ve urun bilgilendirmelerini almak istiyorum.",
    whatsappEnabled: true,
    whatsappPhone: "",
    whatsappMessage: "Merhaba, Cep Dunyasi urunleri hakkinda bilgi almak istiyorum.",
    whatsappHelpText: "Yardim ister misin?",
    whatsappShowOnMobile: true,
    whatsappShowOnDesktop: true,
    liveSupportEnabled: false,
    liveSupportProvider: "none",
    liveSupportScriptUrl: null,
    liveSupportWidgetId: null,
    liveSupportShowOnMobile: false,
    liveSupportShowOnDesktop: true,
    loyaltyEnabled: true,
    loyaltyPointsPerCurrency: 1,
    referralEnabled: true,
    referralRewardPoints: 250,
    lowStockThreshold: 5,
  };
}

export function buildWhatsAppHref(phone: string, message: string) {
  const sanitizedPhone = phone.replace(/[^\d]/g, "");
  const query = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
  return sanitizedPhone ? `https://wa.me/${sanitizedPhone}${query}` : "#";
}

export function buildReferralLink(origin: string, referralCode: string) {
  return `${origin.replace(/\/$/, "")}/auth?ref=${encodeURIComponent(referralCode)}`;
}
