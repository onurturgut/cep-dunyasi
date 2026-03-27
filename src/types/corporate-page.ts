export const CORPORATE_PAGE_KEYS = [
  "about",
  "contact",
  "kvkk",
  "distance_sales_contract",
  "return_exchange_policy",
  "privacy_policy",
  "delivery_terms",
  "faq",
] as const;

export type CorporatePageKey = (typeof CORPORATE_PAGE_KEYS)[number];

export type CorporatePageTemplate = "about" | "contact" | "legal" | "policy" | "faq";

export type CorporatePageSlug =
  | "hakkimizda"
  | "iletisim"
  | "kvkk"
  | "mesafeli-satis-sozlesmesi"
  | "iade-ve-degisim-politikasi"
  | "gizlilik-politikasi"
  | "teslimat-kosullari"
  | "sss";

export type CorporatePageSection = {
  id: string;
  title: string;
  content: string;
  style: "default" | "card";
};

export type CorporateFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  isActive: boolean;
};

export type CorporateContactBlock = {
  id: string;
  label: string;
  value: string;
  href: string | null;
  icon: string | null;
  description: string | null;
};

export type CorporatePageRecord = {
  key: CorporatePageKey;
  slug: CorporatePageSlug;
  template: CorporatePageTemplate;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  content: string;
  sections: CorporatePageSection[];
  faqItems: CorporateFaqItem[];
  contactBlocks: CorporateContactBlock[];
  isPublished: boolean;
  robotsNoindex: boolean;
  updatedAt: string | null;
};

export type CorporatePageListItem = {
  key: CorporatePageKey;
  slug: CorporatePageSlug;
  template: CorporatePageTemplate;
  title: string;
  isPublished: boolean;
  updatedAt: string | null;
};

export type CorporatePageDefinition = Omit<CorporatePageRecord, "updatedAt">;

export type CorporatePageUpsertInput = {
  pageKey: CorporatePageKey;
  title: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  content: string;
  sections: CorporatePageSection[];
  faqItems?: CorporateFaqItem[];
  contactBlocks: CorporateContactBlock[];
  isPublished: boolean;
  robotsNoindex: boolean;
};

