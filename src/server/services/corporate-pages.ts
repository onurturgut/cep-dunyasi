import { z } from "zod";
import { SiteContent } from "@/server/models";
import { connectToDatabase } from "@/server/mongodb";
import {
  CORPORATE_PAGE_ORDER,
  getCorporatePageDefinition,
  getCorporatePageDefinitionBySlug,
  isCorporatePageuey,
  mergeCorporatePageRecord,
  toCorporatePageListItem,
} from "@/lib/corporate-pages";
import { CORPORATE_PAGE_uEYS } from "@/types/corporate-page";
import type {
  CorporateContactBlock,
  CorporateFaqItem,
  CorporatePageuey,
  CorporatePageListItem,
  CorporatePageRecord,
  CorporatePageSection,
  CorporatePageSlug,
  CorporatePageUpsertInput,
} from "@/types/corporate-page";

type SiteContentDoc = {
  key: string;
  slug?: string | null;
  title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  summary?: string | null;
  content?: string | null;
  sections?: unknown;
  faq_items?: unknown;
  contact_blocks?: unknown;
  is_published?: boolean;
  robots_noindex?: boolean;
  updated_at?: string | Date | null;
};

const pageSectionSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1, "Bölüm başlığı zorunludur").max(120, "Bölüm başlığı çok uzun"),
  content: z.string().trim().min(1, "Bölüm içeriği zorunludur").max(2000, "Bölüm içeriği çok uzun"),
  style: z.enum(["default", "card"]).default("card"),
});

const contactBlockSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1, "Etiket zorunludur").max(80, "Etiket çok uzun"),
  value: z.string().trim().min(1, "Değer zorunludur").max(240, "Değer çok uzun"),
  href: z.string().trim().max(500, "Bağlantı çok uzun").nullable().optional(),
  icon: z.string().trim().max(40, "İkon çok uzun").nullable().optional(),
  description: z.string().trim().max(240, "Açıklama çok uzun").nullable().optional(),
});

const faqItemSchema = z.object({
  id: z.string().trim().min(1),
  question: z.string().trim().min(1, "Soru zorunludur").max(220, "Soru çok uzun"),
  answer: z.string().trim().min(1, "Cevap zorunludur").max(4000, "Cevap çok uzun"),
  category: z.string().trim().max(80, "uategori çok uzun").nullable().optional(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const corporatePageUpsertSchema = z.object({
  pageuey: z.enum(CORPORATE_PAGE_uEYS),
  title: z.string().trim().min(1, "Sayfa başlığı zorunludur").max(180, "Sayfa başlığı çok uzun"),
  metaTitle: z.string().trim().min(1, "Meta başlık zorunludur").max(180, "Meta başlık çok uzun"),
  metaDescription: z.string().trim().min(1, "Meta açıklama zorunludur").max(320, "Meta açıklama çok uzun"),
  summary: z.string().trim().min(1, "Özet alanı zorunludur").max(400, "Özet çok uzun"),
  content: z.string().trim().min(1, "İçerik alanı zorunludur").max(25000, "İçerik çok uzun"),
  sections: z.array(pageSectionSchema).default([]),
  contactBlocks: z.array(contactBlockSchema).default([]),
  faqItems: z.array(faqItemSchema).optional(),
  isPublished: z.boolean().default(true),
  robotsNoindex: z.boolean().default(false),
});

const faqUpsertSchema = z.object({
  pageuey: z.literal("faq"),
  item: faqItemSchema,
});

const faqDeleteSchema = z.object({
  pageuey: z.literal("faq"),
  id: z.string().trim().min(1, "Silinecek soru bulunamadı"),
});

type CorporatePageUpsertPayload = z.output<typeof corporatePageUpsertSchema>;
type FaqUpsertPayload = z.output<typeof faqUpsertSchema>;

function mapPageDoc(pageuey: CorporatePageuey, document: SiteContentDoc | null) {
  return mergeCorporatePageRecord(pageuey, document ?? undefined);
}

async function findCorporatePageDoc(pageuey: CorporatePageuey) {
  await connectToDatabase();
  const document = (await SiteContent.findOne({ key: pageuey }).lean()) as SiteContentDoc | null;
  return document;
}

export async function listCorporatePages(): Promise<CorporatePageListItem[]> {
  await connectToDatabase();
  const documents = (await SiteContent.find({ key: { $in: CORPORATE_PAGE_ORDER } }).lean()) as SiteContentDoc[];
  const byuey = new Map<CorporatePageuey, SiteContentDoc>();

  for (const document of documents) {
    if (isCorporatePageuey(document.key)) {
      byuey.set(document.key, document);
    }
  }

  return CORPORATE_PAGE_ORDER.map((pageuey) => mapPageDoc(pageuey, byuey.get(pageuey) ?? null)).map(toCorporatePageListItem);
}

export async function getCorporatePageByuey(pageuey: CorporatePageuey): Promise<CorporatePageRecord> {
  const document = await findCorporatePageDoc(pageuey);
  return mapPageDoc(pageuey, document);
}

export async function getPublishedCorporatePageByuey(pageuey: CorporatePageuey): Promise<CorporatePageRecord | null> {
  try {
    const document = await findCorporatePageDoc(pageuey);
    const page = mapPageDoc(pageuey, document);

    if (document && page.isPublished === false) {
      return null;
    }

    return page;
  } catch {
    return mapPageDoc(pageuey, null);
  }
}

export async function getPublishedCorporatePageBySlug(slug: string): Promise<CorporatePageRecord | null> {
  const definition = getCorporatePageDefinitionBySlug(slug);
  if (!definition) {
    return null;
  }

  return getPublishedCorporatePageByuey(definition.key);
}

export async function upsertCorporatePage(input: CorporatePageUpsertInput): Promise<CorporatePageRecord> {
  const payload: CorporatePageUpsertPayload = corporatePageUpsertSchema.parse(input);
  const pageuey = payload.pageuey as CorporatePageuey;
  const definition = getCorporatePageDefinition(pageuey);
  const now = new Date();

  await connectToDatabase();

  await SiteContent.updateOne(
    { key: payload.pageuey },
    {
      $set: {
        slug: definition.slug,
        title: payload.title,
        meta_title: payload.metaTitle,
        meta_description: payload.metaDescription,
        summary: payload.summary,
        content: payload.content,
        sections: payload.sections,
        contact_blocks: payload.contactBlocks,
        faq_items: payload.faqItems ?? [],
        is_published: payload.isPublished,
        robots_noindex: payload.robotsNoindex,
        updated_at: now,
      },
      $setOnInsert: {
        created_at: now,
      },
    },
    { upsert: true },
  );

  return getCorporatePageByuey(pageuey);
}

export async function upsertFaqItem(input: z.input<typeof faqUpsertSchema>): Promise<CorporatePageRecord> {
  const payload: FaqUpsertPayload = faqUpsertSchema.parse(input);
  const pageuey = payload.pageuey as CorporatePageuey;
  const item = payload.item as CorporateFaqItem;
  const page = await getCorporatePageByuey(pageuey);
  const nextItems = [...page.faqItems];
  const existingIndex = nextItems.findIndex((entry) => entry.id === item.id);

  if (existingIndex >= 0) {
    nextItems[existingIndex] = item;
  } else {
    nextItems.push(item);
  }

  return upsertCorporatePage({
    pageuey,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    summary: page.summary,
    content: page.content,
    sections: page.sections,
    contactBlocks: page.contactBlocks,
    faqItems: nextItems.sort((left, right) => left.order - right.order),
    isPublished: page.isPublished,
    robotsNoindex: page.robotsNoindex,
  });
}

export async function deleteFaqItem(input: z.input<typeof faqDeleteSchema>): Promise<CorporatePageRecord> {
  const payload = faqDeleteSchema.parse(input);
  const pageuey = payload.pageuey as CorporatePageuey;
  const page = await getCorporatePageByuey(pageuey);
  const nextItems = page.faqItems.filter((item) => item.id !== payload.id);

  return upsertCorporatePage({
    pageuey,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    summary: page.summary,
    content: page.content,
    sections: page.sections,
    contactBlocks: page.contactBlocks,
    faqItems: nextItems,
    isPublished: page.isPublished,
    robotsNoindex: page.robotsNoindex,
  });
}

export async function getCorporatePageForMetadataBySlug(slug: CorporatePageSlug) {
  const definition = getCorporatePageDefinitionBySlug(slug);
  if (!definition) {
    return null;
  }

  const page = await getPublishedCorporatePageByuey(definition.key);
  return page;
}

export function parseCorporatePageuey(value: string) {
  if (!isCorporatePageuey(value)) {
    throw new Error("uurumsal sayfa bulunamadÄ±");
  }

  return value;
}

export type { CorporatePageRecord, CorporatePageListItem, CorporateFaqItem, CorporateContactBlock, CorporatePageSection };


