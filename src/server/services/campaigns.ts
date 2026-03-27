import { z } from "zod";
import { AuditLog, BannerCampaign } from "@/server/models";
import type { SessionUser } from "@/server/auth-session";
import type { CampaignRecord } from "@/lib/campaigns";

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
  badge_color?: string | null;
  start_at?: Date | string | null;
  end_at?: Date | string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
};

const homeHeroPlacement = "home_hero";

const campaignSchema = z.object({
  id: z.string().trim().optional(),
  title: z.string().trim().min(1, "Kampanya basligi zorunludur").max(120, "Baslik en fazla 120 karakter olabilir"),
  subtitle: z.string().trim().max(180, "Alt baslik en fazla 180 karakter olabilir").optional().nullable().or(z.literal("")),
  description: z.string().trim().max(420, "Aciklama en fazla 420 karakter olabilir").optional().nullable().or(z.literal("")),
  imageUrl: z
    .string()
    .trim()
    .url("Kampanya gorseli gecersiz. Gorsel yukleyin veya https:// ile baslayan gecerli bir URL kullanin"),
  mobileImageUrl: z
    .string()
    .trim()
    .url("Mobil gorsel gecersiz. https:// ile baslayan gecerli bir URL kullanin")
    .optional()
    .nullable()
    .or(z.literal("")),
  ctaText: z.string().trim().max(40, "CTA metni en fazla 40 karakter olabilir").optional().nullable().or(z.literal("")),
  ctaLink: z
    .string()
    .trim()
    .max(255, "CTA linki en fazla 255 karakter olabilir")
    .refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), "CTA linki gecersiz")
    .optional()
    .nullable()
    .or(z.literal("")),
  badgeText: z.string().trim().max(40, "Rozet metni en fazla 40 karakter olabilir").optional().nullable().or(z.literal("")),
  badgeColor: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Rozet rengi hex formatinda olmali")
    .optional()
    .nullable()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
  startDate: z.string().trim().optional().nullable().or(z.literal("")),
  endDate: z.string().trim().optional().nullable().or(z.literal("")),
});

const reorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "En az bir kampanya secimi zorunludur"),
});

function toIsoString(value: string | Date | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function toOptionalDate(value: string | null | undefined) {
  const normalized = `${value ?? ""}`.trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Gecersiz tarih alani");
  }

  return parsed;
}

function buildActiveWindowQuery(now: Date) {
  return {
    $and: [
      {
        $or: [
          { start_at: null },
          { start_at: { $exists: false } },
          { start_at: { $lte: now } },
        ],
      },
      {
        $or: [
          { end_at: null },
          { end_at: { $exists: false } },
          { end_at: { $gte: now } },
        ],
      },
    ],
  };
}

function mapCampaignRecord(campaign: BannerCampaignDoc): CampaignRecord {
  return {
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle ?? null,
    description: campaign.description ?? null,
    imageUrl: campaign.image_url,
    mobileImageUrl: campaign.mobile_image_url ?? null,
    ctaText: campaign.cta_label ?? null,
    ctaLink: campaign.cta_href ?? null,
    badgeText: campaign.badge_text ?? null,
    badgeColor: campaign.badge_color ?? null,
    isActive: campaign.is_active !== false,
    order: Number(campaign.sort_order ?? 0),
    startDate: campaign.start_at ? toIsoString(campaign.start_at) : null,
    endDate: campaign.end_at ? toIsoString(campaign.end_at) : null,
    createdAt: toIsoString(campaign.created_at),
    updatedAt: toIsoString(campaign.updated_at),
  };
}

async function createCampaignAuditLog(input: {
  actor: SessionUser;
  actionType: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  await AuditLog.create({
    actor_user_id: input.actor.id,
    actor_email: input.actor.email,
    action_type: input.actionType,
    entity_type: "banner_campaign",
    entity_id: input.entityId ?? null,
    message: input.message,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
    created_at: new Date(),
  });
}

function buildWritePayload(input: z.output<typeof campaignSchema>) {
  return {
    placement: homeHeroPlacement,
    title: input.title,
    subtitle: input.subtitle || null,
    description: input.description || null,
    image_url: input.imageUrl,
    mobile_image_url: input.mobileImageUrl || null,
    cta_label: input.ctaText || null,
    cta_href: input.ctaLink || null,
    badge_text: input.badgeText || null,
    badge_color: input.badgeColor || null,
    is_active: input.isActive,
    sort_order: input.order,
    start_at: toOptionalDate(input.startDate),
    end_at: toOptionalDate(input.endDate),
    updated_at: new Date(),
  };
}

export async function getActiveCampaigns() {
  const now = new Date();
  const campaigns = (await BannerCampaign.find({
    placement: homeHeroPlacement,
    is_active: true,
    ...buildActiveWindowQuery(now),
  })
    .sort({ sort_order: 1, created_at: -1 })
    .lean()) as BannerCampaignDoc[];

  return campaigns.map(mapCampaignRecord);
}

export async function listAdminCampaigns() {
  const campaigns = (await BannerCampaign.find({ placement: homeHeroPlacement })
    .sort({ sort_order: 1, created_at: -1 })
    .lean()) as BannerCampaignDoc[];

  return campaigns.map(mapCampaignRecord);
}

export async function createCampaign(input: z.input<typeof campaignSchema>, actor: SessionUser, ip?: string | null) {
  const payload = campaignSchema.parse(input);
  const now = new Date();
  const created = await BannerCampaign.create({
    ...buildWritePayload(payload),
    created_at: now,
    updated_at: now,
  });

  await createCampaignAuditLog({
    actor,
    actionType: "campaign.created",
    entityId: created.id as string,
    message: "Hero kampanyasi olusturuldu",
    metadata: { title: payload.title, order: payload.order, isActive: payload.isActive },
    ip,
  });

  return mapCampaignRecord(
    (await BannerCampaign.findOne({ id: created.id }).lean()) as BannerCampaignDoc,
  );
}

export async function updateCampaign(input: z.input<typeof campaignSchema>, actor: SessionUser, ip?: string | null) {
  const payload = campaignSchema.parse(input);
  if (!payload.id) {
    throw new Error("Guncellenecek kampanya secilmedi");
  }

  const existing = await BannerCampaign.findOne({ id: payload.id, placement: homeHeroPlacement }).lean();
  if (!existing) {
    throw new Error("Kampanya bulunamadi");
  }

  await BannerCampaign.updateOne({ id: payload.id }, { $set: buildWritePayload(payload) });

  await createCampaignAuditLog({
    actor,
    actionType: "campaign.updated",
    entityId: payload.id,
    message: "Hero kampanyasi guncellendi",
    metadata: { title: payload.title, order: payload.order, isActive: payload.isActive },
    ip,
  });

  return mapCampaignRecord(
    (await BannerCampaign.findOne({ id: payload.id }).lean()) as BannerCampaignDoc,
  );
}

export async function deleteCampaign(id: string, actor: SessionUser, ip?: string | null) {
  const campaign = (await BannerCampaign.findOne({ id, placement: homeHeroPlacement }).lean()) as BannerCampaignDoc | null;
  if (!campaign) {
    throw new Error("Kampanya bulunamadi");
  }

  await BannerCampaign.deleteOne({ id });

  await createCampaignAuditLog({
    actor,
    actionType: "campaign.deleted",
    entityId: id,
    message: "Hero kampanyasi silindi",
    metadata: { title: campaign.title },
    ip,
  });

  return { deleted: true };
}

export async function reorderCampaigns(input: z.input<typeof reorderSchema>, actor: SessionUser, ip?: string | null) {
  const payload = reorderSchema.parse(input);
  const campaigns = (await BannerCampaign.find({
    id: { $in: payload.ids },
    placement: homeHeroPlacement,
  }).lean()) as BannerCampaignDoc[];

  if (campaigns.length !== payload.ids.length) {
    throw new Error("Siralama icin secilen kampanyalardan biri bulunamadi");
  }

  const now = new Date();
  await Promise.all(
    payload.ids.map((id, index) =>
      BannerCampaign.updateOne(
        { id, placement: homeHeroPlacement },
        { $set: { sort_order: index, updated_at: now } },
      ),
    ),
  );

  await createCampaignAuditLog({
    actor,
    actionType: "campaign.reordered",
    message: "Hero kampanya sirasi guncellendi",
    metadata: { ids: payload.ids },
    ip,
  });

  return listAdminCampaigns();
}
