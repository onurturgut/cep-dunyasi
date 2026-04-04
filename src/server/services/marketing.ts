import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  FeaturedReviewRecord,
  LoyaltyTransactionRecord,
  MarketingAudience,
  MarketingHomeModules,
  MarketingPopupRecord,
  MarketingSettingsRecord,
  NewsletterSubscriberRecord,
  NewsletterSource,
  ReferralRecord,
  SocialProofItemRecord,
} from "@/lib/marketing";
import { getDefaultMarketingSettings } from "@/lib/marketing";
import { maskReviewerName } from "@/lib/reviews";
import type { SessionUser } from "@/server/auth-session";
import {
  AuditLog,
  BannerCampaign,
  LoyaltyTransaction,
  MarketingEvent,
  MarketingSetting,
  NewsletterSubscriber,
  Order,
  Product,
  ProductReview,
  Referral,
  SocialProofItem,
  User,
} from "@/server/models";

type BannerCampaignDoc = {
  id: string;
  placement: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  badge_text?: string | null;
  theme_variant?: string | null;
  trigger_type?: string | null;
  trigger_delay_seconds?: number | null;
  trigger_scroll_percent?: number | null;
  show_once_per_session?: boolean | null;
  target_paths?: string[] | null;
  audience?: string | null;
  start_at?: Date | string | null;
  end_at?: Date | string | null;
  is_active?: boolean;
};

type ProductReviewDoc = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string | null;
  comment: string;
  is_verified_purchase?: boolean;
  helpful_count?: number;
  created_at?: Date | string;
};

const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta adresi girin"),
  firstName: z.string().trim().max(80, "Isim en fazla 80 karakter olabilir").optional().nullable(),
  source: z.enum(["footer", "popup", "homepage-inline", "checkout", "manual"]).default("footer"),
  campaignSource: z.string().trim().max(120).optional().nullable(),
  consentNewsletter: z.boolean().default(true),
  consentKvkk: z.boolean().default(false),
});

const marketingEventSchema = z.object({
  eventType: z.enum([
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
  ]),
  entityType: z.string().trim().max(80).optional().nullable(),
  entityId: z.string().trim().max(120).optional().nullable(),
  pagePath: z.string().trim().max(255).optional().nullable(),
  sessionId: z.string().trim().max(120).optional().nullable(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().nullable(),
});

const socialProofSchema = z.object({
  id: z.string().trim().optional(),
  label: z.string().trim().min(1, "Baslik zorunludur").max(80, "Baslik en fazla 80 karakter olabilir"),
  value: z.string().trim().min(1, "Deger zorunludur").max(80, "Deger en fazla 80 karakter olabilir"),
  icon: z.string().trim().max(40).optional().nullable().or(z.literal("")),
  description: z.string().trim().max(180).optional().nullable().or(z.literal("")),
  sourceType: z.enum(["manual", "derived"]).default("manual"),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

const marketingSettingsSchema = z.object({
  newsletterEnabled: z.boolean(),
  newsletterTitle: z.string().trim().min(1).max(120),
  newsletterDescription: z.string().trim().min(1).max(280),
  newsletterSuccessMessage: z.string().trim().min(1).max(200),
  newsletterConsentLabel: z.string().trim().min(1).max(180),
  whatsappEnabled: z.boolean(),
  whatsappPhone: z.string().trim().max(40),
  whatsappMessage: z.string().trim().max(240),
  whatsappHelpText: z.string().trim().max(80),
  whatsappShowOnMobile: z.boolean(),
  whatsappShowOnDesktop: z.boolean(),
  liveSupportEnabled: z.boolean(),
  liveSupportProvider: z.enum(["none", "tawk", "crisp", "custom"]),
  liveSupportScriptUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  liveSupportWidgetId: z.string().trim().max(120).optional().nullable().or(z.literal("")),
  liveSupportShowOnMobile: z.boolean(),
  liveSupportShowOnDesktop: z.boolean(),
  loyaltyEnabled: z.boolean(),
  loyaltyPointsPerCurrency: z.coerce.number().min(0).max(1000),
  referralEnabled: z.boolean(),
  referralRewardPoints: z.coerce.number().min(0).max(50000),
  lowStockThreshold: z.coerce.number().int().min(1).max(50),
});

const referralRegistrationSchema = z.object({
  referralCode: z.string().trim().min(3).max(32),
});

type MarketingSettingDoc = {
  key: string;
  newsletter_enabled?: boolean;
  newsletter_title?: string | null;
  newsletter_description?: string | null;
  newsletter_success_message?: string | null;
  newsletter_consent_label?: string | null;
  whatsapp_enabled?: boolean;
  whatsapp_phone?: string | null;
  whatsapp_message?: string | null;
  whatsapp_help_text?: string | null;
  whatsapp_show_on_mobile?: boolean;
  whatsapp_show_on_desktop?: boolean;
  live_support_enabled?: boolean;
  live_support_provider?: string | null;
  live_support_script_url?: string | null;
  live_support_widget_id?: string | null;
  live_support_show_on_mobile?: boolean;
  live_support_show_on_desktop?: boolean;
  loyalty_enabled?: boolean;
  loyalty_points_per_currency?: number | null;
  referral_enabled?: boolean;
  referral_reward_points?: number | null;
  low_stock_threshold?: number | null;
};

type SocialProofDoc = {
  id: string;
  label: string;
  value: string;
  icon?: string | null;
  description?: string | null;
  source_type?: string | null;
  is_active?: boolean;
  sort_order?: number | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type NewsletterSubscriberDoc = {
  id: string;
  email: string;
  first_name?: string | null;
  source?: string | null;
  campaign_source?: string | null;
  is_verified?: boolean;
  consent_newsletter?: boolean;
  consent_kvkk?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type UserMarketingDoc = {
  id: string;
  email: string;
  full_name?: string | null;
  loyalty_points_balance?: number | null;
  referral_code?: string | null;
  referred_by?: string | null;
};

type ReferralDoc = {
  id: string;
  referrer_user_id: string;
  referred_user_id?: string | null;
  referral_code: string;
  status?: string | null;
  reward_type?: string | null;
  reward_value?: number | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type LoyaltyTransactionDoc = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  order_id?: string | null;
  description: string;
  created_at?: Date | string;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  const resolved = value instanceof Date ? value : new Date(value);
  return Number.isNaN(resolved.getTime()) ? new Date(0).toISOString() : resolved.toISOString();
}

function normalizeText(value: unknown) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

function createMarketingAuditLog(input: {
  actor: SessionUser;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  return AuditLog.create({
    actor_user_id: input.actor.id,
    actor_email: input.actor.email,
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    message: input.message,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
    created_at: new Date(),
  });
}

function buildActiveWindowQuery(now: Date) {
  return {
    $and: [
      {
        $or: [{ start_at: null }, { start_at: { $exists: false } }, { start_at: { $lte: now } }],
      },
      {
        $or: [{ end_at: null }, { end_at: { $exists: false } }, { end_at: { $gte: now } }],
      },
    ],
  };
}

function mapMarketingSettings(doc: MarketingSettingDoc | null | undefined): MarketingSettingsRecord {
  const defaults = getDefaultMarketingSettings();

  return {
    newsletterEnabled: doc?.newsletter_enabled ?? defaults.newsletterEnabled,
    newsletterTitle: normalizeText(doc?.newsletter_title) ?? defaults.newsletterTitle,
    newsletterDescription: normalizeText(doc?.newsletter_description) ?? defaults.newsletterDescription,
    newsletterSuccessMessage: normalizeText(doc?.newsletter_success_message) ?? defaults.newsletterSuccessMessage,
    newsletterConsentLabel: normalizeText(doc?.newsletter_consent_label) ?? defaults.newsletterConsentLabel,
    whatsappEnabled: doc?.whatsapp_enabled ?? defaults.whatsappEnabled,
    whatsappPhone: normalizeText(doc?.whatsapp_phone) ?? defaults.whatsappPhone,
    whatsappMessage: normalizeText(doc?.whatsapp_message) ?? defaults.whatsappMessage,
    whatsappHelpText: normalizeText(doc?.whatsapp_help_text) ?? defaults.whatsappHelpText,
    whatsappShowOnMobile: doc?.whatsapp_show_on_mobile ?? defaults.whatsappShowOnMobile,
    whatsappShowOnDesktop: doc?.whatsapp_show_on_desktop ?? defaults.whatsappShowOnDesktop,
    liveSupportEnabled: doc?.live_support_enabled ?? defaults.liveSupportEnabled,
    liveSupportProvider:
      doc?.live_support_provider === "tawk" || doc?.live_support_provider === "crisp" || doc?.live_support_provider === "custom"
        ? doc.live_support_provider
        : defaults.liveSupportProvider,
    liveSupportScriptUrl: normalizeText(doc?.live_support_script_url),
    liveSupportWidgetId: normalizeText(doc?.live_support_widget_id),
    liveSupportShowOnMobile: doc?.live_support_show_on_mobile ?? defaults.liveSupportShowOnMobile,
    liveSupportShowOnDesktop: doc?.live_support_show_on_desktop ?? defaults.liveSupportShowOnDesktop,
    loyaltyEnabled: doc?.loyalty_enabled ?? defaults.loyaltyEnabled,
    loyaltyPointsPerCurrency: Number(doc?.loyalty_points_per_currency ?? defaults.loyaltyPointsPerCurrency),
    referralEnabled: doc?.referral_enabled ?? defaults.referralEnabled,
    referralRewardPoints: Number(doc?.referral_reward_points ?? defaults.referralRewardPoints),
    lowStockThreshold: Number(doc?.low_stock_threshold ?? defaults.lowStockThreshold),
  };
}

function mapSocialProofItem(doc: SocialProofDoc): SocialProofItemRecord {
  return {
    id: doc.id,
    label: doc.label,
    value: doc.value,
    icon: normalizeText(doc.icon),
    description: normalizeText(doc.description),
    isActive: doc.is_active !== false,
    order: Number(doc.sort_order ?? 0),
    sourceType: doc.source_type === "derived" ? "derived" : "manual",
    createdAt: toIsoString(doc.created_at),
    updatedAt: toIsoString(doc.updated_at),
  };
}

function mapNewsletterSubscriber(doc: NewsletterSubscriberDoc): NewsletterSubscriberRecord {
  return {
    id: doc.id,
    email: doc.email,
    firstName: normalizeText(doc.first_name),
    source: (normalizeText(doc.source) as NewsletterSource | null) ?? "footer",
    campaignSource: normalizeText(doc.campaign_source),
    isVerified: doc.is_verified === true,
    consentNewsletter: doc.consent_newsletter !== false,
    consentKvkk: doc.consent_kvkk === true,
    createdAt: toIsoString(doc.created_at),
    updatedAt: toIsoString(doc.updated_at),
  };
}

function mapPopupCampaign(doc: BannerCampaignDoc): MarketingPopupRecord {
  return {
    id: doc.id,
    title: doc.title,
    subtitle: normalizeText(doc.subtitle),
    description: normalizeText(doc.description),
    imageUrl: doc.image_url,
    mobileImageUrl: normalizeText(doc.mobile_image_url),
    ctaText: normalizeText(doc.cta_label),
    ctaLink: normalizeText(doc.cta_href),
    badgeText: normalizeText(doc.badge_text),
    themeVariant: normalizeText(doc.theme_variant),
    triggerType: doc.trigger_type === "scroll" || doc.trigger_type === "exit_intent" ? doc.trigger_type : "delay",
    delaySeconds: Math.max(0, Number(doc.trigger_delay_seconds ?? 4)),
    scrollPercent: Math.max(0, Math.min(100, Number(doc.trigger_scroll_percent ?? 40))),
    showOncePerSession: doc.show_once_per_session !== false,
    targetPaths: Array.isArray(doc.target_paths) ? doc.target_paths.map((item) => `${item ?? ""}`.trim()).filter(Boolean) : [],
    audience: doc.audience === "guest" || doc.audience === "authenticated" ? doc.audience : "all",
  };
}

function matchesAudience(audience: MarketingAudience, sessionUser: SessionUser | null) {
  if (audience === "guest") {
    return !sessionUser?.id;
  }

  if (audience === "authenticated") {
    return Boolean(sessionUser?.id);
  }

  return true;
}

function matchesTargetPath(targetPaths: string[], pathname: string | null | undefined) {
  if (targetPaths.length === 0) {
    return true;
  }

  const currentPath = `${pathname ?? ""}`.trim() || "/";
  return targetPaths.some((targetPath) => currentPath.startsWith(targetPath));
}

async function getDerivedSocialProofFallback() {
  const [customerCount, deliveredOrdersCount, approvedReviews, activeProducts] = await Promise.all([
    User.countDocuments({ is_active: true }),
    Order.countDocuments({ order_status: "delivered", payment_status: "paid" }),
    ProductReview.find({ is_approved: true }).select("rating").lean(),
    Product.countDocuments({ is_active: true }),
  ]);

  const ratingAverage =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, review) => sum + Number((review as { rating?: number }).rating ?? 0), 0) / approvedReviews.length
      : 0;

  const fallback: SocialProofItemRecord[] = [
    {
      id: "derived-customers",
      label: "Mutlu Musteri",
      value: `${customerCount.toLocaleString("tr-TR")}+`,
      icon: "Users",
      description: "Tekrar gelen musteri ve tavsiyelerle buyuyen topluluk",
      isActive: true,
      order: 0,
      sourceType: "derived",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "derived-delivered-orders",
      label: "Teslim Edilen Siparis",
      value: `${deliveredOrdersCount.toLocaleString("tr-TR")}+`,
      icon: "PackageCheck",
      description: "Odeme onayi sonrasinda hizli hazirlanan ve takipli gonderiler",
      isActive: true,
      order: 1,
      sourceType: "derived",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "derived-rating",
      label: "Ortalama Puan",
      value: ratingAverage > 0 ? ratingAverage.toFixed(1) : "4.9",
      icon: "Star",
      description: `${approvedReviews.length.toLocaleString("tr-TR")} onayli kullanici yorumu`,
      isActive: true,
      order: 2,
      sourceType: "derived",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "derived-active-products",
      label: "Hazir Koleksiyon",
      value: `${activeProducts.toLocaleString("tr-TR")}+`,
      icon: "Sparkles",
      description: "Telefon, aksesuar ve servis paketlerinde secilmis urun vitrini",
      isActive: true,
      order: 3,
      sourceType: "derived",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return fallback;
}

export async function getMarketingSettings(): Promise<MarketingSettingsRecord> {
  const doc = (await MarketingSetting.findOne({ key: "global" }).lean()) as MarketingSettingDoc | null;
  return mapMarketingSettings(doc);
}

export async function getMarketingHomeModules(): Promise<MarketingHomeModules> {
  const [settings, socialProofItems, featuredReviews] = await Promise.all([
    getMarketingSettings(),
    listActiveSocialProofItems(),
    listFeaturedHomepageReviews(6),
  ]);

  return {
    settings,
    socialProofItems,
    featuredReviews,
  };
}

export async function listActiveSocialProofItems(): Promise<SocialProofItemRecord[]> {
  const docs = (await SocialProofItem.find({ is_active: true }).sort({ sort_order: 1, created_at: 1 }).lean()) as SocialProofDoc[];

  if (docs.length > 0) {
    return docs.map(mapSocialProofItem);
  }

  return getDerivedSocialProofFallback();
}

export async function listFeaturedHomepageReviews(limit = 6): Promise<FeaturedReviewRecord[]> {
  const reviews = (await ProductReview.find({ is_approved: true })
    .sort({ is_verified_purchase: -1, helpful_count: -1, rating: -1, created_at: -1 })
    .limit(limit)
    .lean()) as ProductReviewDoc[];

  if (reviews.length === 0) {
    return [];
  }

  const productIds = Array.from(new Set(reviews.map((review) => review.product_id).filter(Boolean)));
  const userIds = Array.from(new Set(reviews.map((review) => review.user_id).filter(Boolean)));
  const [products, users] = await Promise.all([
    Product.find({ id: { $in: productIds } }).select("id name slug").lean(),
    User.find({ id: { $in: userIds } }).select("id full_name email").lean(),
  ]);

  const productById = new Map((products as Array<{ id: string; name?: string; slug?: string }>).map((product) => [product.id, product]));
  const userById = new Map((users as Array<{ id: string; full_name?: string | null; email?: string | null }>).map((user) => [user.id, user]));

  return reviews.map((review) => {
    const product = productById.get(review.product_id);
    const user = userById.get(review.user_id);

    return {
      id: review.id,
      productId: review.product_id,
      productName: normalizeText(product?.name),
      productSlug: normalizeText(product?.slug),
      authorName: maskReviewerName(normalizeText(user?.full_name), normalizeText(user?.email)),
      rating: Number(review.rating ?? 0),
      comment: review.comment,
      title: normalizeText(review.title),
      isVerifiedPurchase: review.is_verified_purchase === true,
      helpfulCount: Number(review.helpful_count ?? 0),
      createdAt: toIsoString(review.created_at),
    };
  });
}

export async function listActivePopupCampaigns(input?: {
  pathname?: string | null;
  sessionUser?: SessionUser | null;
}): Promise<MarketingPopupRecord[]> {
  const now = new Date();
  const docs = (await BannerCampaign.find({
    placement: "popup",
    is_active: true,
    ...buildActiveWindowQuery(now),
  })
    .sort({ sort_order: 1, created_at: -1 })
    .lean()) as BannerCampaignDoc[];

  return docs
    .map(mapPopupCampaign)
    .filter((popup) => matchesAudience(popup.audience, input?.sessionUser ?? null))
    .filter((popup) => matchesTargetPath(popup.targetPaths, input?.pathname));
}

export async function subscribeToNewsletter(input: z.input<typeof newsletterSubscribeSchema>) {
  const payload = newsletterSubscribeSchema.parse(input);
  const email = payload.email.toLocaleLowerCase("tr-TR");
  const now = new Date();

  const existing = (await NewsletterSubscriber.findOne({ email }).lean()) as NewsletterSubscriberDoc | null;

  if (existing) {
    await NewsletterSubscriber.updateOne(
      { email },
      {
        $set: {
          first_name: payload.firstName?.trim() || existing.first_name || null,
          source: payload.source,
          campaign_source: payload.campaignSource?.trim() || null,
          consent_newsletter: payload.consentNewsletter,
          consent_kvkk: payload.consentKvkk,
          updated_at: now,
        },
      }
    );

    return {
      subscriber: mapNewsletterSubscriber(
        (await NewsletterSubscriber.findOne({ email }).lean()) as NewsletterSubscriberDoc,
      ),
      isNew: false,
    };
  }

  const created = await NewsletterSubscriber.create({
    email,
    first_name: payload.firstName?.trim() || null,
    source: payload.source,
    campaign_source: payload.campaignSource?.trim() || null,
    consent_newsletter: payload.consentNewsletter,
    consent_kvkk: payload.consentKvkk,
    created_at: now,
    updated_at: now,
  });

  return {
    subscriber: mapNewsletterSubscriber(created.toObject() as NewsletterSubscriberDoc),
    isNew: true,
  };
}

export async function trackMarketingEvent(input: z.input<typeof marketingEventSchema>, sessionUser: SessionUser | null, ip?: string | null) {
  const payload = marketingEventSchema.parse(input);

  await MarketingEvent.create({
    user_id: sessionUser?.id ?? null,
    session_id: payload.sessionId?.trim() || null,
    event_type: payload.eventType,
    entity_type: payload.entityType?.trim() || null,
    entity_id: payload.entityId?.trim() || null,
    page_path: payload.pagePath?.trim() || null,
    metadata: payload.metadata ?? null,
    ip: ip ?? null,
    created_at: new Date(),
  });

  return { tracked: true };
}

export async function listAdminSocialProofItems() {
  const docs = (await SocialProofItem.find().sort({ sort_order: 1, created_at: 1 }).lean()) as SocialProofDoc[];
  return docs.map(mapSocialProofItem);
}

export async function upsertSocialProofItem(input: z.input<typeof socialProofSchema>, actor: SessionUser, ip?: string | null) {
  const payload = socialProofSchema.parse(input);
  const now = new Date();
  const update = {
    label: payload.label,
    value: payload.value,
    icon: payload.icon || null,
    description: payload.description || null,
    source_type: payload.sourceType,
    is_active: payload.isActive,
    sort_order: payload.order,
    updated_at: now,
  };

  let entityId = payload.id ?? null;
  if (payload.id) {
    await SocialProofItem.updateOne({ id: payload.id }, { $set: update });
  } else {
    const created = await SocialProofItem.create({ ...update, created_at: now });
    entityId = created.id as string;
  }

  await createMarketingAuditLog({
    actor,
    actionType: payload.id ? "marketing.social_proof.updated" : "marketing.social_proof.created",
    entityType: "social_proof_item",
    entityId,
    message: payload.id ? "Sosyal kanit ogesi guncellendi" : "Sosyal kanit ogesi olusturuldu",
    metadata: { label: payload.label, sourceType: payload.sourceType, isActive: payload.isActive },
    ip,
  });

  return listAdminSocialProofItems();
}

export async function deleteSocialProofItem(id: string, actor: SessionUser, ip?: string | null) {
  const existing = (await SocialProofItem.findOne({ id }).lean()) as SocialProofDoc | null;
  if (!existing) {
    throw new Error("Sosyal kanit ogesi bulunamadi");
  }

  await SocialProofItem.deleteOne({ id });
  await createMarketingAuditLog({
    actor,
    actionType: "marketing.social_proof.deleted",
    entityType: "social_proof_item",
    entityId: id,
    message: "Sosyal kanit ogesi silindi",
    metadata: { label: existing.label },
    ip,
  });

  return { deleted: true };
}

export async function updateMarketingSettings(input: z.input<typeof marketingSettingsSchema>, actor: SessionUser, ip?: string | null) {
  const payload = marketingSettingsSchema.parse(input);
  const now = new Date();

  await MarketingSetting.updateOne(
    { key: "global" },
    {
      $set: {
        newsletter_enabled: payload.newsletterEnabled,
        newsletter_title: payload.newsletterTitle,
        newsletter_description: payload.newsletterDescription,
        newsletter_success_message: payload.newsletterSuccessMessage,
        newsletter_consent_label: payload.newsletterConsentLabel,
        whatsapp_enabled: payload.whatsappEnabled,
        whatsapp_phone: payload.whatsappPhone,
        whatsapp_message: payload.whatsappMessage,
        whatsapp_help_text: payload.whatsappHelpText,
        whatsapp_show_on_mobile: payload.whatsappShowOnMobile,
        whatsapp_show_on_desktop: payload.whatsappShowOnDesktop,
        live_support_enabled: payload.liveSupportEnabled,
        live_support_provider: payload.liveSupportProvider,
        live_support_script_url: payload.liveSupportScriptUrl || null,
        live_support_widget_id: payload.liveSupportWidgetId || null,
        live_support_show_on_mobile: payload.liveSupportShowOnMobile,
        live_support_show_on_desktop: payload.liveSupportShowOnDesktop,
        loyalty_enabled: payload.loyaltyEnabled,
        loyalty_points_per_currency: payload.loyaltyPointsPerCurrency,
        referral_enabled: payload.referralEnabled,
        referral_reward_points: payload.referralRewardPoints,
        low_stock_threshold: payload.lowStockThreshold,
        updated_at: now,
      },
      $setOnInsert: {
        key: "global",
        created_at: now,
      },
    },
    { upsert: true }
  );

  await createMarketingAuditLog({
    actor,
    actionType: "marketing.settings.updated",
    entityType: "marketing_setting",
    entityId: "global",
    message: "Marketing ayarlari guncellendi",
    metadata: {
      whatsappEnabled: payload.whatsappEnabled,
      liveSupportEnabled: payload.liveSupportEnabled,
      newsletterEnabled: payload.newsletterEnabled,
    },
    ip,
  });

  return getMarketingSettings();
}

export async function listNewsletterSubscribers(input?: { page?: number; limit?: number; search?: string | null }) {
  const page = Math.max(1, input?.page ?? 1);
  const limit = Math.min(100, Math.max(1, input?.limit ?? 20));
  const search = `${input?.search ?? ""}`.trim();
  const query =
    search.length > 0
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { first_name: { $regex: search, $options: "i" } },
            { campaign_source: { $regex: search, $options: "i" } },
          ],
        }
      : {};

  const total = await NewsletterSubscriber.countDocuments(query);
  const docs = (await NewsletterSubscriber.find(query)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()) as NewsletterSubscriberDoc[];

  return {
    items: docs.map(mapNewsletterSubscriber),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function generateReferralCodeBase() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function ensureUserMarketingProfile(userId: string) {
  const user = (await User.findOne({ id: userId }).lean()) as UserMarketingDoc | null;
  if (!user) {
    throw new Error("Kullanici bulunamadi");
  }

  if (typeof user.loyalty_points_balance !== "number") {
    await User.updateOne({ id: userId }, { $set: { loyalty_points_balance: 0, updated_at: new Date() } });
  }

  if (user.referral_code) {
    return {
      loyaltyPointsBalance: Number(user.loyalty_points_balance ?? 0),
      referralCode: user.referral_code,
      referredBy: normalizeText(user.referred_by),
    };
  }

  let referralCode = "";
  for (let index = 0; index < 6; index += 1) {
    const candidate = `CD${generateReferralCodeBase()}`;
    const existing = await User.findOne({ referral_code: candidate }).select("id").lean();
    if (!existing) {
      referralCode = candidate;
      break;
    }
  }

  if (!referralCode) {
    referralCode = `CD${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  await User.updateOne({ id: userId }, { $set: { referral_code: referralCode, updated_at: new Date() } });

  return {
    loyaltyPointsBalance: Number(user.loyalty_points_balance ?? 0),
    referralCode,
    referredBy: normalizeText(user.referred_by),
  };
}

export async function listUserLoyaltyTransactions(userId: string): Promise<LoyaltyTransactionRecord[]> {
  const docs = (await LoyaltyTransaction.find({ user_id: userId }).sort({ created_at: -1 }).limit(20).lean()) as LoyaltyTransactionDoc[];

  return docs.map((doc) => ({
    id: doc.id,
    userId: doc.user_id,
    type: doc.type === "spend" || doc.type === "expire" || doc.type === "admin_adjust" ? doc.type : "earn",
    points: Number(doc.points ?? 0),
    orderId: normalizeText(doc.order_id),
    description: doc.description,
    createdAt: toIsoString(doc.created_at),
  }));
}

export async function listUserReferrals(userId: string): Promise<ReferralRecord[]> {
  const docs = (await Referral.find({ referrer_user_id: userId }).sort({ created_at: -1 }).limit(20).lean()) as ReferralDoc[];

  return docs.map((doc) => ({
    id: doc.id,
    referrerUserId: doc.referrer_user_id,
    referredUserId: normalizeText(doc.referred_user_id),
    referralCode: doc.referral_code,
    status:
      doc.status === "first_order_completed" || doc.status === "rewarded"
        ? doc.status
        : "registered",
    rewardType: "loyalty_points",
    rewardValue: Number(doc.reward_value ?? 0),
    createdAt: toIsoString(doc.created_at),
    updatedAt: toIsoString(doc.updated_at),
  }));
}

export async function resolveReferralCode(input: z.input<typeof referralRegistrationSchema>) {
  const payload = referralRegistrationSchema.parse(input);
  const user = (await User.findOne({ referral_code: payload.referralCode }).select("id full_name email").lean()) as
    | { id: string; full_name?: string | null; email?: string | null }
    | null;

  if (!user) {
    throw new Error("Referans kodu bulunamadi");
  }

  return {
    referrerUserId: user.id,
    referrerName: maskReviewerName(normalizeText(user.full_name), normalizeText(user.email)),
    referralCode: payload.referralCode,
  };
}

export async function registerReferralForUser(referralCode: string, sessionUser: SessionUser | null) {
  if (!sessionUser?.id) {
    throw new Error("Referans baglamak icin giris yapmaniz gerekiyor");
  }

  const payload = referralRegistrationSchema.parse({ referralCode });
  const user = (await User.findOne({ id: sessionUser.id }).lean()) as UserMarketingDoc | null;
  if (!user) {
    throw new Error("Kullanici bulunamadi");
  }

  if (user.referral_code && user.referral_code === payload.referralCode) {
    throw new Error("Kendi referans kodunuzu kullanamazsiniz");
  }

  if (user.referred_by) {
    throw new Error("Bu hesap zaten bir referans kodu ile eslesti");
  }

  const referrer = (await User.findOne({ referral_code: payload.referralCode }).select("id").lean()) as { id: string } | null;
  if (!referrer) {
    throw new Error("Referans kodu bulunamadi");
  }

  if (referrer.id === user.id) {
    throw new Error("Kendi referans kodunuzu kullanamazsiniz");
  }

  const existingReferral = await Referral.findOne({ referred_user_id: user.id }).lean();
  if (existingReferral) {
    throw new Error("Bu hesap zaten bir referans iliskisi icinde");
  }

  await Referral.create({
    referrer_user_id: referrer.id,
    referred_user_id: user.id,
    referral_code: payload.referralCode,
    status: "registered",
    reward_type: "loyalty_points",
    reward_value: 0,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await User.updateOne({ id: user.id }, { $set: { referred_by: referrer.id, updated_at: new Date() } });

  return {
    registered: true,
    referralCode: payload.referralCode,
  };
}

export async function registerReferralForNewUser(referralCode: string | null | undefined, newUserId: string) {
  const normalizedCode = `${referralCode ?? ""}`.trim();
  if (!normalizedCode) {
    return { registered: false };
  }

  const referrer = (await User.findOne({ referral_code: normalizedCode }).select("id").lean()) as { id: string } | null;
  if (!referrer || referrer.id === newUserId) {
    return { registered: false };
  }

  const existingReferral = await Referral.findOne({ referred_user_id: newUserId }).lean();
  if (existingReferral) {
    return { registered: false };
  }

  await Referral.create({
    referrer_user_id: referrer.id,
    referred_user_id: newUserId,
    referral_code: normalizedCode,
    status: "registered",
    reward_type: "loyalty_points",
    reward_value: 0,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await User.updateOne({ id: newUserId }, { $set: { referred_by: referrer.id, updated_at: new Date() } });

  return { registered: true, referralCode: normalizedCode };
}

export async function getUserMarketingSummary(userId: string) {
  const marketingProfile = await ensureUserMarketingProfile(userId);
  const [transactions, referrals] = await Promise.all([listUserLoyaltyTransactions(userId), listUserReferrals(userId)]);

  return {
    loyaltyPointsBalance: marketingProfile.loyaltyPointsBalance,
    referralCode: marketingProfile.referralCode,
    referredBy: marketingProfile.referredBy,
    transactions,
    referrals,
  };
}
