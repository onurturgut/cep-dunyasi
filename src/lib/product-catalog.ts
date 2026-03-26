import { getDefaultProductVariant, normalizeProductVariants, type ProductVariantRecord } from "@/lib/product-variants";
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
  categories?: { name?: string; slug?: string } | null;
  product_variants?: ProductVariantRecord[];
  specs?: Record<string, string | null> | null;
};

export type ProductSortOption = "newest" | "best_selling" | "price_asc" | "price_desc" | "rating_desc";

export type CatalogFilters = {
  brand?: string | null;
  color?: string | null;
  storage?: string | null;
  ram?: string | null;
  inStockOnly?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  attributeFilters?: Record<string, string | null>;
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

const defaultFilterProfile: CatalogFilterProfile = {
  showColor: true,
  showStorage: true,
  showRam: true,
  attributeFilters: [],
  helperText: "Marka, fiyat, renk, RAM, depolama ve stok durumuna gore filtreleyebilirsiniz.",
};

const categoryFilterProfiles: Record<string, CatalogFilterProfile> = {
  telefon: {
    showColor: true,
    showStorage: true,
    showRam: true,
    attributeFilters: [],
    helperText: "Telefonlari marka, renk, depolama, RAM ve fiyata gore filtreleyebilirsiniz.",
  },
  "ikinci-el-telefon": {
    showColor: true,
    showStorage: true,
    showRam: true,
    attributeFilters: [
      {
        id: "condition",
        label: "Durum",
        placeholder: "Durum secin",
        attributeKeys: ["durum", "condition"],
      },
    ],
    helperText: "2. el cihazlari durum, renk, depolama ve fiyat bazinda filtreleyebilirsiniz.",
  },
  kilif: {
    showColor: true,
    showStorage: false,
    showRam: false,
    attributeFilters: [
      {
        id: "compatibility",
        label: "Uyumluluk",
        placeholder: "Model secin",
        attributeKeys: ["uyumluluk", "compatibility"],
      },
    ],
    helperText: "Kiliflari uyumluluk, renk, marka ve fiyat bazinda filtreleyebilirsiniz.",
  },
  "sarj-aleti": {
    showColor: false,
    showStorage: false,
    showRam: false,
    attributeFilters: [
      {
        id: "power",
        label: "Guc",
        placeholder: "Guc secin",
        attributeKeys: ["guc", "power"],
      },
    ],
    helperText: "Sarj aletlerini guc, marka, fiyat ve stok durumuna gore filtreleyebilirsiniz.",
  },
  "power-bank": {
    showColor: false,
    showStorage: false,
    showRam: false,
    attributeFilters: [
      {
        id: "capacity",
        label: "Kapasite",
        placeholder: "Kapasite secin",
        attributeKeys: ["kapasite", "capacity"],
      },
      {
        id: "output",
        label: "Cikis",
        placeholder: "Cikis secin",
        attributeKeys: ["cikis", "output"],
      },
    ],
    helperText: "Power bank urunlerini kapasite, cikis gucu, marka ve fiyata gore filtreleyebilirsiniz.",
  },
  "akilli-saatler": {
    showColor: true,
    showStorage: false,
    showRam: false,
    attributeFilters: [
      {
        id: "display",
        label: "Ekran",
        placeholder: "Ekran secin",
        attributeKeys: ["ekran", "display"],
      },
    ],
    helperText: "Akilli saatleri ekran, renk, marka ve fiyat bazinda filtreleyebilirsiniz.",
  },
};

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
    brand: null,
    color: null,
    storage: null,
    ram: null,
    inStockOnly: false,
    minPrice: null,
    maxPrice: null,
    attributeFilters: {},
  };
}

export function getCatalogFilterProfile(activeCategory: string | null | undefined): CatalogFilterProfile {
  if (!activeCategory) {
    return defaultFilterProfile;
  }

  return categoryFilterProfiles[activeCategory] ?? defaultFilterProfile;
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
  profile: CatalogFilterProfile = defaultFilterProfile
) {
  const variants = normalizeProductVariants(product.product_variants || []);

  const matchingVariant =
    variants.find((variant) => {
      if (!variant.is_active) {
        return false;
      }

      if (profile.showColor && filters.color && variant.color_name !== filters.color) {
        return false;
      }

      if (profile.showStorage && filters.storage && variant.storage !== filters.storage) {
        return false;
      }

      if (profile.showRam && filters.ram && variant.ram !== filters.ram) {
        return false;
      }

      for (const definition of profile.attributeFilters) {
        const expectedValue = filters.attributeFilters?.[definition.id];
        if (!expectedValue) {
          continue;
        }

        const actualValue = getVariantAttributeValue(variant, definition.attributeKeys);
        if (actualValue !== expectedValue) {
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
  profile: CatalogFilterProfile = defaultFilterProfile
) {
  const brand = normalizeText(product.brand);

  if (filters.brand && brand !== filters.brand) {
    return false;
  }

  return Boolean(getDisplayVariantForCatalogProduct(product, filters, profile));
}

export function sortCatalogProducts(
  products: CatalogProductRecord[],
  filters: CatalogFilters,
  sort: ProductSortOption,
  profile: CatalogFilterProfile = defaultFilterProfile
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
