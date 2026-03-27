import type { Metadata } from "next";
import { getCorporatePageDefinition } from "@/lib/corporate-pages";
import { getCorporatePageByKey } from "@/server/services/corporate-pages";
import type { CorporatePageKey } from "@/types/corporate-page";

export async function buildCorporatePageMetadata(pageKey: CorporatePageKey): Promise<Metadata> {
  const fallback = getCorporatePageDefinition(pageKey);
  const page = await getCorporatePageByKey(pageKey).catch(() => null);
  const source = page ?? fallback;
  const path = `/${fallback.slug}`;

  return {
    title: source.metaTitle,
    description: source.metaDescription,
    alternates: {
      canonical: path,
    },
    robots: source.robotsNoindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: source.metaTitle,
      description: source.metaDescription,
      url: path,
      type: "article",
    },
  };
}

