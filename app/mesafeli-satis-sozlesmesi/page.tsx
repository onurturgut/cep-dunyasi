import { notFound } from "next/navigation";
import { CorporatePageScreen } from "@/components/corporate/CorporatePageScreen";
import { buildCorporatePageMetadata } from "@/lib/corporate-page-metadata";
import { getPublishedCorporatePageByKey } from "@/server/services/corporate-pages";

export async function generateMetadata() {
  return buildCorporatePageMetadata("distance_sales_contract");
}

export default async function DistanceSalesContractPage() {
  const page = await getPublishedCorporatePageByKey("distance_sales_contract");
  if (!page) {
    notFound();
  }

  return <CorporatePageScreen page={page} />;
}

