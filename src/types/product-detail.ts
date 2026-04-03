import type { ProductSpecs } from "@/lib/product-specs";
import type { SecondHandDetails } from "@/lib/second-hand";
import type { ProductVariantRecord } from "@/lib/product-variants";

export type ProductDetailRecord = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images: string[];
  starting_price?: number;
  created_at?: string | Date;
  sales_count?: number;
  rating_average?: number;
  rating_count?: number;
  rating_distribution?: Record<string, number> | null;
  specs?: ProductSpecs | null;
  second_hand?: SecondHandDetails | null;
  categories?: { name?: string; slug?: string } | null;
  product_variants: ProductVariantRecord[];
};
