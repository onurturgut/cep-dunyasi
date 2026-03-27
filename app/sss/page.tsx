import { notFound } from "next/navigation";
import { CorporatePageScreen } from "@/components/corporate/CorporatePageScreen";
import { buildCorporatePageMetadata } from "@/lib/corporate-page-metadata";
import { getPublishedCorporatePageByKey } from "@/server/services/corporate-pages";

export async function generateMetadata() {
  return buildCorporatePageMetadata("faq");
}

export default async function FaqPage() {
  const page = await getPublishedCorporatePageByKey("faq");
  if (!page) {
    notFound();
  }

  return <CorporatePageScreen page={page} />;
}

