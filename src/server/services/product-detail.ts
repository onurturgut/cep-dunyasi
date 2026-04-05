import { normalizeMediaUrl } from "@/server/storage/r2";
import { Category, Product, ProductVariant } from "@/server/models";
import type { CaseDetails } from "@/lib/case-models";
import type { ProductSpecs } from "@/lib/product-specs";
import { normalizeSecondHandDetails, type SecondHandDetails } from "@/lib/second-hand";
import { normalizeProductVariants, sortProductVariants } from "@/lib/product-variants";
import type { ProductDetailRecord } from "@/types/product-detail";

type ProductDocument = {
  id?: string;
  name?: string;
  slug?: string;
  brand?: string | null;
  description?: string | null;
  images?: unknown;
  starting_price?: number | null;
  created_at?: string | Date;
  sales_count?: number | null;
  rating_average?: number | null;
  rating_count?: number | null;
  rating_distribution?: Record<string, number> | null;
  specs?: ProductSpecs | null;
  case_details?: CaseDetails | null;
  second_hand?: SecondHandDetails | null;
  category_id?: string | null;
};

function normalizeImageArray(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => `${value ?? ""}`.trim())
    .filter(Boolean)
    .map(normalizeMediaUrl);
}

export async function getProductDetailBySlug(slug: string): Promise<ProductDetailRecord | null> {
  const product = (await Product.findOne({ slug, is_active: true })
    .select(
      "id name slug brand description images starting_price created_at sales_count rating_average rating_count rating_distribution specs case_details second_hand category_id",
    )
    .lean()) as ProductDocument | null;

  if (!product?.id || !product.slug) {
    return null;
  }

  const [variants, category] = await Promise.all([
    ProductVariant.find({ product_id: product.id, is_active: true })
      .select("id product_id sku price compare_at_price stock images is_active color_name color_code storage ram barcode sort_order option_signature attributes created_at updated_at")
      .sort({ sort_order: 1, created_at: 1 })
      .lean(),
    product.category_id
      ? Category.findOne({ id: product.category_id }).select("name slug").lean()
      : Promise.resolve(null),
  ]);

  return {
    id: product.id,
    name: `${product.name ?? ""}`.trim(),
    slug: product.slug,
    brand: product.brand ?? null,
    description: product.description ?? null,
    images: normalizeImageArray(product.images),
    starting_price: Number(product.starting_price ?? 0),
    created_at: product.created_at,
    sales_count: Number(product.sales_count ?? 0),
    rating_average: Number(product.rating_average ?? 0),
    rating_count: Number(product.rating_count ?? 0),
    rating_distribution: product.rating_distribution ?? null,
    specs: product.specs ?? null,
    case_details: product.case_details ?? null,
    second_hand: normalizeSecondHandDetails(product.second_hand),
    categories: category ? { name: `${category.name ?? ""}`.trim(), slug: `${category.slug ?? ""}`.trim() } : null,
    product_variants: sortProductVariants(
      normalizeProductVariants(
        (variants as Array<Record<string, unknown>>).map((variant) => ({
          ...variant,
          images: normalizeImageArray(variant.images),
        })),
      ),
    ),
  };
}
