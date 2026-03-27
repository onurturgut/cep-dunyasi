import { notFound } from "next/navigation";
import { CorporatePageScreen } from "@/components/corporate/CorporatePageScreen";
import { buildCorporatePageMetadata } from "@/lib/corporate-page-metadata";
import { getPublishedCorporatePageByKey } from "@/server/services/corporate-pages";

export async function generateMetadata() {
  return buildCorporatePageMetadata("delivery_terms");
}

export default async function DeliveryTermsPage() {
  const page = await getPublishedCorporatePageByKey("delivery_terms");
  if (!page) {
    notFound();
  }

  return <CorporatePageScreen page={page} />;
}

