import { z } from "zod";
import { SiteContent } from "@/server/models";
import { connectToDatabase } from "@/server/mongodb";
import {
  CORPORATE_PAGE_ORDER,
  getCorporatePageDefinition,
  getCorporatePageDefinitionBySlug,
  isCorporatePageKey,
  mergeCorporatePageRecord,
  toCorporatePageListItem,
} from "@/lib/corporate-pages";
import { CORPORATE_PAGE_KEYS } from "@/types/corporate-page";
import type {
  CorporateContactBlock,
  CorporateFaqItem,
  CorporatePageKey,
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
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(2000),
  style: z.enum(["default", "card"]).default("card"),
});

const contactBlockSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(240),
  href: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  description: z.string().trim().max(240).nullable().optional(),
});

const faqItemSchema = z.object({
  id: z.string().trim().min(1),
  question: z.string().trim().min(1).max(220),
  answer: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(80).nullable().optional(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const corporatePageUpsertSchema = z.object({
  pageKey: z.enum(CORPORATE_PAGE_KEYS),
  title: z.string().trim().min(1).max(180),
  metaTitle: z.string().trim().min(1).max(180),
  metaDescription: z.string().trim().min(1).max(320),
  summary: z.string().trim().min(1).max(400),
  content: z.string().trim().min(1).max(25000),
  sections: z.array(pageSectionSchema).default([]),
  contactBlocks: z.array(contactBlockSchema).default([]),
  faqItems: z.array(faqItemSchema).optional(),
  isPublished: z.boolean().default(true),
  robotsNoindex: z.boolean().default(false),
});

const faqUpsertSchema = z.object({
  pageKey: z.literal("faq"),
  item: faqItemSchema,
});

const faqDeleteSchema = z.object({
  pageKey: z.literal("faq"),
  id: z.string().trim().min(1),
});

type CorporatePageUpsertPayload = z.output<typeof corporatePageUpsertSchema>;
type FaqUpsertPayload = z.output<typeof faqUpsertSchema>;

function mapPageDoc(pageKey: CorporatePageKey, document: SiteContentDoc | null) {
  return mergeCorporatePageRecord(pageKey, document ?? undefined);
}

async function findCorporatePageDoc(pageKey: CorporatePageKey) {
  await connectToDatabase();
  return (await SiteContent.findOne({ key: pageKey }).lean()) as SiteContentDoc | null;
}

export async function listCorporatePages(): Promise<CorporatePageListItem[]> {
  await connectToDatabase();
  const documents = (await SiteContent.find({ key: { $in: CORPORATE_PAGE_ORDER } }).lean()) as SiteContentDoc[];
  const byKey = new Map<CorporatePageKey, SiteContentDoc>();

  for (const document of documents) {
    if (isCorporatePageKey(document.key)) {
      byKey.set(document.key, document);
    }
  }

  return CORPORATE_PAGE_ORDER.map((pageKey) => mapPageDoc(pageKey, byKey.get(pageKey) ?? null)).map(toCorporatePageListItem);
}

export async function getCorporatePageByKey(pageKey: CorporatePageKey): Promise<CorporatePageRecord> {
  const document = await findCorporatePageDoc(pageKey);
  return mapPageDoc(pageKey, document);
}

export async function getPublishedCorporatePageByKey(pageKey: CorporatePageKey): Promise<CorporatePageRecord | null> {
  try {
    const document = await findCorporatePageDoc(pageKey);
    const page = mapPageDoc(pageKey, document);

    if (document && page.isPublished === false) {
      return null;
    }

    return page;
  } catch {
    return mapPageDoc(pageKey, null);
  }
}

export async function getPublishedCorporatePageBySlug(slug: string): Promise<CorporatePageRecord | null> {
  const definition = getCorporatePageDefinitionBySlug(slug);
  if (!definition) {
    return null;
  }

  return getPublishedCorporatePageByKey(definition.key);
}

export async function upsertCorporatePage(input: CorporatePageUpsertInput): Promise<CorporatePageRecord> {
  const payload: CorporatePageUpsertPayload = corporatePageUpsertSchema.parse(input);
  const definition = getCorporatePageDefinition(payload.pageKey);
  const now = new Date();

  await connectToDatabase();

  await SiteContent.updateOne(
    { key: payload.pageKey },
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

  return getCorporatePageByKey(payload.pageKey);
}

export async function upsertFaqItem(input: z.input<typeof faqUpsertSchema>): Promise<CorporatePageRecord> {
  const payload: FaqUpsertPayload = faqUpsertSchema.parse(input);
  const page = await getCorporatePageByKey(payload.pageKey);
  const nextItems = [...page.faqItems];
  const existingIndex = nextItems.findIndex((entry) => entry.id === payload.item.id);

  if (existingIndex >= 0) {
    nextItems[existingIndex] = payload.item as CorporateFaqItem;
  } else {
    nextItems.push(payload.item as CorporateFaqItem);
  }

  return upsertCorporatePage({
    pageKey: payload.pageKey,
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
  const page = await getCorporatePageByKey(payload.pageKey);

  return upsertCorporatePage({
    pageKey: payload.pageKey,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    summary: page.summary,
    content: page.content,
    sections: page.sections,
    contactBlocks: page.contactBlocks,
    faqItems: page.faqItems.filter((item) => item.id !== payload.id),
    isPublished: page.isPublished,
    robotsNoindex: page.robotsNoindex,
  });
}

export async function getCorporatePageForMetadataBySlug(slug: CorporatePageSlug) {
  const definition = getCorporatePageDefinitionBySlug(slug);
  if (!definition) {
    return null;
  }

  return getPublishedCorporatePageByKey(definition.key);
}

export function parseCorporatePageKey(value: string) {
  if (!isCorporatePageKey(value)) {
    throw new Error("Kurumsal sayfa bulunamadi");
  }

  return value;
}

export type { CorporatePageRecord, CorporatePageListItem, CorporateFaqItem, CorporateContactBlock, CorporatePageSection };
