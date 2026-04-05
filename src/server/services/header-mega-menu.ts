import { Category, Product, ProductVariant } from "@/server/models";
import { normalizeMediaUrl } from "@/server/storage/r2";
import { getDefaultProductVariant, getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";

export type HeaderMegaMenuProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  image: string | null;
  price: number;
  originalPrice: number | null;
  variantLabel: string | null;
  salesCount: number;
  inStock: boolean;
};

function normalizeText(value: unknown) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

function normalizeStringArray(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => normalizeMediaUrl(`${value ?? ""}`.trim())).filter(Boolean);
}

function isAppleBrand(value: string | null | undefined) {
  return `${value ?? ""}`.trim().toLocaleLowerCase("tr-TR") === "apple";
}

export async function listHeaderMegaMenuProducts(activeCategory: string, limit = 4): Promise<HeaderMegaMenuProduct[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 6);
  const matchedCategory = await Category.findOne({ slug: activeCategory }).select("id").lean();

  if (!matchedCategory?.id) {
    return [];
  }

  const rawProducts = (await Product.find({
    is_active: true,
    category_id: matchedCategory.id,
  })
    .select("id name slug brand images sales_count created_at is_featured")
    .sort({ is_featured: -1, sales_count: -1, created_at: -1 })
    .limit(Math.max(safeLimit * 4, 16))
    .lean()) as Array<Record<string, unknown>>;

  const categoryProducts =
    activeCategory === "ikinci-el-telefon" ? rawProducts.filter((product) => isAppleBrand(normalizeText(product.brand))) : rawProducts;

  if (categoryProducts.length === 0) {
    return [];
  }

  const productIds = categoryProducts.map((product) => `${product.id ?? ""}`).filter(Boolean);
  const rawVariants = (await ProductVariant.find({
    product_id: { $in: productIds },
    is_active: true,
  })
    .select("id product_id sku price compare_at_price stock images is_active color_name color_code storage ram barcode sort_order option_signature attributes created_at updated_at")
    .lean()) as Array<Record<string, unknown>>;

  const variantsByProductId = new Map<string, ReturnType<typeof normalizeProductVariants>>();
  for (const rawVariant of rawVariants) {
    const productId = `${rawVariant.product_id ?? ""}`;
    if (!productId) {
      continue;
    }

    const normalizedVariants = variantsByProductId.get(productId) ?? [];
    normalizedVariants.push(
      ...normalizeProductVariants([
        {
          ...rawVariant,
          images: normalizeStringArray(rawVariant.images),
        },
      ]),
    );
    variantsByProductId.set(productId, normalizedVariants);
  }

  const primarySuggestions = categoryProducts
    .map<HeaderMegaMenuProduct | null>((product) => {
      const productId = `${product.id ?? ""}`;
      const variants = normalizeProductVariants(variantsByProductId.get(productId) ?? []);
      const defaultVariant = getDefaultProductVariant(variants);

      if (!defaultVariant || defaultVariant.stock <= 0) {
        return null;
      }

      const gallery = getVariantGallery(defaultVariant, normalizeStringArray(product.images));

      return {
        id: productId,
        name: `${product.name ?? ""}`.trim(),
        slug: `${product.slug ?? ""}`.trim(),
        brand: normalizeText(product.brand),
        image: gallery[0] ?? null,
        price: Number(defaultVariant.price ?? 0),
        originalPrice: defaultVariant.compare_at_price ?? null,
        variantLabel: getVariantLabel(defaultVariant) || null,
        salesCount: Number(product.sales_count ?? 0),
        inStock: defaultVariant.stock > 0,
      };
    })
    .filter((product): product is HeaderMegaMenuProduct => Boolean(product))
    .slice(0, safeLimit);

  if (primarySuggestions.length >= safeLimit) {
    return primarySuggestions;
  }

  const fallbackSuggestions = categoryProducts
    .map<HeaderMegaMenuProduct | null>((product) => {
      const productId = `${product.id ?? ""}`;
      if (primarySuggestions.some((item) => item.id === productId)) {
        return null;
      }

      const variants = normalizeProductVariants(variantsByProductId.get(productId) ?? []);
      const defaultVariant = getDefaultProductVariant(variants);

      if (!defaultVariant) {
        return null;
      }

      const gallery = getVariantGallery(defaultVariant, normalizeStringArray(product.images));

      return {
        id: productId,
        name: `${product.name ?? ""}`.trim(),
        slug: `${product.slug ?? ""}`.trim(),
        brand: normalizeText(product.brand),
        image: gallery[0] ?? null,
        price: Number(defaultVariant.price ?? 0),
        originalPrice: defaultVariant.compare_at_price ?? null,
        variantLabel: getVariantLabel(defaultVariant) || null,
        salesCount: Number(product.sales_count ?? 0),
        inStock: defaultVariant.stock > 0,
      };
    })
    .filter((product): product is HeaderMegaMenuProduct => Boolean(product))
    .slice(0, safeLimit - primarySuggestions.length);

  return [...primarySuggestions, ...fallbackSuggestions].slice(0, safeLimit);
}
