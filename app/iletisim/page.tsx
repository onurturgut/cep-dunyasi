import { notFound } from "next/navigation";
import { CorporatePageScreen } from "@/components/corporate/CorporatePageScreen";
import { buildCorporatePageMetadata } from "@/lib/corporate-page-metadata";
import { getPublishedCorporatePageByKey } from "@/server/services/corporate-pages";

export async function generateMetadata() {
  return buildCorporatePageMetadata("contact");
}

export default async function ContactPage() {
  const page = await getPublishedCorporatePageByKey("contact");
  if (!page) {
    notFound();
  }

  return <CorporatePageScreen page={page} />;
}

