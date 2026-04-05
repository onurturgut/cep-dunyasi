import { getDefaultProductVariant, normalizeProductVariants, type ProductVariantRecord } from "@/lib/product-variants";
import type { CaseDetails } from "@/lib/case-models";
import { getProductVariantCategoryConfig, getProductVariantFilterAxes } from "@/lib/product-variant-config";
import { type SecondHandDetails, normalizeSecondHandDetails } from "@/lib/second-hand";
import { toPriceNumber } from "@/lib/utils";

export type CatalogProductRecord = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images?: string[];
  created_at?: string | Date;
  sales_count?: number;
  rating_average?: number;
  rating_count?: number;
  type?: string | null;
  second_hand?: SecondHandDetails | null;
  case_details?: CaseDetails | null;
  categories?: { id?: string; name?: string; slug?: string } | null;
  subcategory?: { id?: string; name?: string; slug?: string; parent_category_id?: string | null } | null;
  product_variants?: ProductVariantRecord[];
  specs?: Record<string, string | null> | null;
};

export type CatalogSubcategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type ProductSortOption = "newest" | "best_selling" | "price_asc" | "price_desc" | "rating_desc";

export type CatalogFilters = {
  subcategory?: string[];
  brand?: string[];
  color?: string[];
  storage?: string[];
  ram?: string[];
  inStockOnly?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  attributeFilters?: Record<string, string[]>;
  secondHandCondition?: string[];
  batteryHealthMin?: number[];
  warrantyType?: string[];
  includesBoxOnly?: boolean;
  faceIdWorkingOnly?: boolean;
  trueToneWorkingOnly?: boolean;
};

export type CatalogAttributeFilterDefinition = {
  id: string;
  label: string;
  placeholder: string;
  attributeKeys: string[];
};

export type CatalogFilterProfile = {
  showColor: boolean;
  showStorage: boolean;
  showRam: boolean;
  attributeFilters: CatalogAttributeFilterDefinition[];
  helperText: string;
};

type CatalogVariantOptions = {
  brands: string[];
  colors: string[];
  storages: string[];
  ramOptions: string[];
  attributeOptions: Record<string, string[]>;
};

function buildFilterProfile(activeCategory?: string | null): CatalogFilterProfile {
  const categoryConfig = getProductVariantCategoryConfig(activeCategory);
  const filterAxes = getProductVariantFilterAxes(activeCategory);

  return {
    showColor: filterAxes.some((axis) => axis.id === "color_name"),
    showStorage: filterAxes.some((axis) => axis.id === "storage"),
    showRam: filterAxes.some((axis) => axis.id === "ram"),
    attributeFilters: filterAxes
      .filter((axis) => !["color_name", "storage", "ram"].includes(axis.id))
      .map((axis) => ({
        id: axis.id,
        label: axis.label,
        placeholder: axis.filterPlaceholder || axis.placeholder,
        attributeKeys: axis.attributeKeys,
      })),
    helperText: categoryConfig.helperText,
  };
}

function normalizeText(value: unknown) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

function normalizeDateValue(value: string | Date | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function normalizeAttributeKey(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function hasSelections(values?: Array<string | number> | null) {
  return Array.isArray(values) && values.length > 0;
}

function getVariantAttributeValue(variant: ProductVariantRecord, keys: string[]) {
  const attributeEntries = Object.entries(variant.attributes ?? {});

  for (const key of keys) {
    const normalizedKey = normalizeAttributeKey(key);
    const matchedEntry = attributeEntries.find(([entryKey]) => normalizeAttributeKey(entryKey) === normalizedKey);
    const matchedValue = normalizeText(matchedEntry?.[1]);

    if (matchedValue) {
      return matchedValue;
    }
  }

  return null;
}

export function createEmptyCatalogFilters(): CatalogFilters {
  return {
    subcategory: [],
    brand: [],
    color: [],
    storage: [],
    ram: [],
    inStockOnly: false,
    minPrice: null,
    maxPrice: null,
    attributeFilters: {},
    secondHandCondition: [],
    batteryHealthMin: [],
    warrantyType: [],
    includesBoxOnly: false,
    faceIdWorkingOnly: false,
    trueToneWorkingOnly: false,
  };
}

export function getCatalogFilterProfile(activeCategory: string | null | undefined): CatalogFilterProfile {
  return buildFilterProfile(activeCategory);
}

export function getCatalogVariantOptions(products: CatalogProductRecord[], profile: CatalogFilterProfile): CatalogVariantOptions {
  const brands = new Set<string>();
  const colors = new Set<string>();
  const storages = new Set<string>();
  const ramOptions = new Set<string>();
  const attributeOptionMap = new Map<string, Set<string>>();

  for (const definition of profile.attributeFilters) {
    attributeOptionMap.set(definition.id, new Set<string>());
  }

  for (const product of products) {
    const brand = normalizeText(product.brand);
    if (brand) {
      brands.add(brand);
    }

    const variants = normalizeProductVariants(product.product_variants || []);
    for (const variant of variants) {
      if (profile.showColor && variant.color_name && variant.color_name !== "Standart") {
        colors.add(variant.color_name);
      }
      if (profile.showStorage && variant.storage && variant.storage !== "Standart") {
        storages.add(variant.storage);
      }
      if (profile.showRam && variant.ram) {
        ramOptions.add(variant.ram);
      }

      for (const definition of profile.attributeFilters) {
        const value = getVariantAttributeValue(variant, definition.attributeKeys);
        if (value) {
          attributeOptionMap.get(definition.id)?.add(value);
        }
      }
    }
  }

  return {
    brands: Array.from(brands).sort((a, b) => a.localeCompare(b, "tr")),
    colors: Array.from(colors).sort((a, b) => a.localeCompare(b, "tr")),
    storages: Array.from(storages).sort((a, b) => a.localeCompare(b, "tr")),
    ramOptions: Array.from(ramOptions).sort((a, b) => a.localeCompare(b, "tr")),
    attributeOptions: Object.fromEntries(
      Array.from(attributeOptionMap.entries()).map(([key, values]) => [
        key,
        Array.from(values).sort((a, b) => a.localeCompare(b, "tr")),
      ])
    ),
  };
}

export function getDisplayVariantForCatalogProduct(
  product: CatalogProductRecord,
  filters: CatalogFilters,
  profile: CatalogFilterProfile = buildFilterProfile()
) {
  const variants = normalizeProductVariants(product.product_variants || []);

  const matchingVariant =
    variants.find((variant) => {
      if (!variant.is_active) {
        return false;
      }

      if (profile.showColor && hasSelections(filters.color) && !filters.color?.includes(variant.color_name)) {
        return false;
      }

      if (profile.showStorage && hasSelections(filters.storage) && !filters.storage?.includes(variant.storage)) {
        return false;
      }

      if (profile.showRam && hasSelections(filters.ram) && !filters.ram?.includes(variant.ram || "")) {
        return false;
      }

      for (const definition of profile.attributeFilters) {
        const expectedValues = filters.attributeFilters?.[definition.id];
        if (!hasSelections(expectedValues)) {
          continue;
        }

        const actualValue = getVariantAttributeValue(variant, definition.attributeKeys);
        if (!actualValue || !expectedValues?.includes(actualValue)) {
          return false;
        }
      }

      if (filters.inStockOnly && variant.stock <= 0) {
        return false;
      }

      const price = toPriceNumber(variant.price);
      if (filters.minPrice != null && price < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice != null && price > filters.maxPrice) {
        return false;
      }

      return true;
    }) || getDefaultProductVariant(variants);

  return matchingVariant ? normalizeProductVariants([matchingVariant])[0] : null;
}

export function matchesCatalogFilters(
  product: CatalogProductRecord,
  filters: CatalogFilters,
  profile: CatalogFilterProfile = buildFilterProfile()
) {
  const brand = normalizeText(product.brand);
  const secondHand = normalizeSecondHandDetails(product.second_hand);

  if (hasSelections(filters.brand) && (!brand || !filters.brand?.includes(brand))) {
    return false;
  }

  const subcategorySlug = normalizeText(product.subcategory?.slug);
  if (hasSelections(filters.subcategory) && (!subcategorySlug || !filters.subcategory?.includes(subcategorySlug))) {
    return false;
  }

  if (hasSelections(filters.secondHandCondition) && (!secondHand?.condition || !filters.secondHandCondition?.includes(secondHand.condition))) {
    return false;
  }

  if (hasSelections(filters.batteryHealthMin) && !filters.batteryHealthMin?.some((threshold) => (secondHand?.battery_health ?? 0) >= threshold)) {
    return false;
  }

  if (hasSelections(filters.warrantyType) && (!secondHand?.warranty_type || !filters.warrantyType?.includes(secondHand.warranty_type))) {
    return false;
  }

  if (filters.includesBoxOnly && !secondHand?.includes_box) {
    return false;
  }

  if (filters.faceIdWorkingOnly && secondHand?.face_id_status !== "working") {
    return false;
  }

  if (filters.trueToneWorkingOnly && secondHand?.true_tone_status !== "working") {
    return false;
  }

  return Boolean(getDisplayVariantForCatalogProduct(product, filters, profile));
}

export function sortCatalogProducts(
  products: CatalogProductRecord[],
  filters: CatalogFilters,
  sort: ProductSortOption,
  profile: CatalogFilterProfile = buildFilterProfile()
) {
  return [...products].sort((left, right) => {
    const leftVariant = getDisplayVariantForCatalogProduct(left, filters, profile);
    const rightVariant = getDisplayVariantForCatalogProduct(right, filters, profile);
    const leftPrice = toPriceNumber(leftVariant?.price ?? 0);
    const rightPrice = toPriceNumber(rightVariant?.price ?? 0);
    const leftSales = Number(left.sales_count ?? 0);
    const rightSales = Number(right.sales_count ?? 0);
    const leftRating = Number(left.rating_average ?? 0);
    const rightRating = Number(right.rating_average ?? 0);
    const leftCreatedAt = normalizeDateValue(left.created_at);
    const rightCreatedAt = normalizeDateValue(right.created_at);

    if (sort === "price_asc") {
      return leftPrice - rightPrice || rightCreatedAt - leftCreatedAt;
    }

    if (sort === "price_desc") {
      return rightPrice - leftPrice || rightCreatedAt - leftCreatedAt;
    }

    if (sort === "best_selling") {
      return rightSales - leftSales || rightCreatedAt - leftCreatedAt;
    }

    if (sort === "rating_desc") {
      return rightRating - leftRating || rightCreatedAt - leftCreatedAt;
    }

    return rightCreatedAt - leftCreatedAt;
  });
}

export function isNewProduct(createdAt?: string | Date) {
  const created = normalizeDateValue(createdAt);

  if (!created) {
    return false;
  }

  return Date.now() - created <= 1000 * 60 * 60 * 24 * 30;
}

export function isLowStock(stock?: number) {
  const normalizedStock = Number(stock ?? 0);
  return normalizedStock > 0 && normalizedStock <= 5;
}

export function isBestSeller(salesCount?: number) {
  return Number(salesCount ?? 0) >= 5;
}
