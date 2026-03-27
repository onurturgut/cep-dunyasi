import { notFound } from "next/navigation";
import { CorporatePageScreen } from "@/components/corporate/CorporatePageScreen";
import { buildCorporatePageMetadata } from "@/lib/corporate-page-metadata";
import { getPublishedCorporatePageByKey } from "@/server/services/corporate-pages";

export async function generateMetadata() {
  return buildCorporatePageMetadata("return_exchange_policy");
}

export default async function ReturnExchangePolicyPage() {
  const page = await getPublishedCorporatePageByKey("return_exchange_policy");
  if (!page) {
    notFound();
  }

  return <CorporatePageScreen page={page} />;
}

