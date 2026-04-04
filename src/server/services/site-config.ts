import { SiteContent } from "@/server/models";
import { DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, resolveShippingFee } from "@/lib/shipping";

type SiteContentRecord = {
  shipping_fee?: number | null;
};

export type ShippingConfig = {
  shippingFee: number;
  defaultShippingFee: number;
  freeShippingThreshold: number;
};

export async function getShippingConfig(): Promise<ShippingConfig> {
  const siteContent = (await SiteContent.findOne({ key: "home" }).select("shipping_fee").lean()) as SiteContentRecord | null;

  return {
    shippingFee: resolveShippingFee(siteContent?.shipping_fee),
    defaultShippingFee: DEFAULT_SHIPPING_FEE,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };
}
