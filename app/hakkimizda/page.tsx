import { notFound } from "next/navigation";
import { CorporatePageScreen } from "@/components/corporate/CorporatePageScreen";
import { buildCorporatePageMetadata } from "@/lib/corporate-page-metadata";
import { getPublishedCorporatePageByKey } from "@/server/services/corporate-pages";

export async function generateMetadata() {
  return buildCorporatePageMetadata("about");
}

export default async function AboutPage() {
  const page = await getPublishedCorporatePageByKey("about");
  if (!page) {
    notFound();
  }

  return <CorporatePageScreen page={page} />;
}

