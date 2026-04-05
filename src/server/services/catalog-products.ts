import { Category, Product, ProductVariant } from "@/server/models";
import { normalizeMediaUrl } from "@/server/storage/r2";
import { buildCatalogFacetSectionsData, type CatalogFacetSectionData } from "@/lib/catalog-facets";
import {
  type CatalogSubcategoryOption,
  createEmptyCatalogFilters,
  getCatalogFilterProfile,
  matchesCatalogFilters,
  sortCatalogProducts,
  type CatalogFilters,
  type CatalogProductRecord,
  type ProductSortOption,
} from "@/lib/product-catalog";
import { normalizeSecondHandDetails } from "@/lib/second-hand";
import { normalizeProductVariants, sortProductVariants } from "@/lib/product-variants";

export type CatalogProductsQuery = {
  activeCategory: string | null;
  search: string;
  sortBy: ProductSortOption;
  page: number;
  limit: number;
  filters: CatalogFilters;
};

export type CatalogProductsListResult = {
  items: CatalogProductRecord[];
  facetSections: CatalogFacetSectionData[];
  totalCount: number;
};

type CatalogProductsSource = {
  products: CatalogProductRecord[];
  availableSubcategories: CatalogSubcategoryOption[];
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

function matchesSearch(product: CatalogProductRecord, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  const searchable = [product.name, product.brand, product.description]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  return searchable.includes(normalizedSearch);
}

export function normalizeCatalogFilters(input: unknown): CatalogFilters {
  const fallback = createEmptyCatalogFilters();

  if (!input || typeof input !== "object") {
    return fallback;
  }

  const source = input as Record<string, unknown>;
  const normalizeStringList = (value: unknown) =>
    Array.isArray(value)
      ? value.map((item) => normalizeText(item)).filter((item): item is string => Boolean(item))
      : [];
  const normalizeNumberList = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item))
          .map((item) => Math.floor(item))
      : [];
  const normalizeBoolean = (value: unknown) => value === true;
  const normalizeNullableNumber = (value: unknown) => {
    if (value == null || value === "") {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    subcategory: normalizeStringList(source.subcategory),
    brand: normalizeStringList(source.brand),
    color: normalizeStringList(source.color),
    storage: normalizeStringList(source.storage),
    ram: normalizeStringList(source.ram),
    caseType: normalizeStringList(source.caseType),
    caseTheme: normalizeStringList(source.caseTheme),
    caseFeature: normalizeStringList(source.caseFeature),
    inStockOnly: normalizeBoolean(source.inStockOnly),
    minPrice: normalizeNullableNumber(source.minPrice),
    maxPrice: normalizeNullableNumber(source.maxPrice),
    attributeFilters:
      source.attributeFilters && typeof source.attributeFilters === "object"
        ? Object.fromEntries(
            Object.entries(source.attributeFilters as Record<string, unknown>).map(([key, value]) => [key, normalizeStringList(value)]),
          )
        : {},
    secondHandCondition: normalizeStringList(source.secondHandCondition),
    batteryHealthMin: normalizeNumberList(source.batteryHealthMin),
    warrantyType: normalizeStringList(source.warrantyType),
    includesBoxOnly: normalizeBoolean(source.includesBoxOnly),
    faceIdWorkingOnly: normalizeBoolean(source.faceIdWorkingOnly),
    trueToneWorkingOnly: normalizeBoolean(source.trueToneWorkingOnly),
  };
}

async function loadCatalogProducts(activeCategory: string | null): Promise<CatalogProductsSource> {
  const productQuery: Record<string, unknown> = { is_active: true };
  let availableSubcategories: CatalogSubcategoryOption[] = [];

  if (activeCategory) {
    const matchedCategory = await Category.findOne({ slug: activeCategory }).select("id").lean();

    if (!matchedCategory?.id) {
      return {
        products: [],
        availableSubcategories: [],
      };
    }

    productQuery.category_id = matchedCategory.id;
    const rawSubcategories = (await Category.find({ parent_category_id: matchedCategory.id })
      .select("id name slug")
      .sort({ name: 1 })
      .lean()) as Array<Record<string, unknown>>;

    availableSubcategories = rawSubcategories
      .map((subcategory) => ({
        id: `${subcategory.id ?? ""}`,
        name: `${subcategory.name ?? ""}`.trim(),
        slug: `${subcategory.slug ?? ""}`.trim(),
      }))
      .filter((subcategory) => subcategory.id && subcategory.name && subcategory.slug);
  }

  const rawProducts = (await Product.find(productQuery)
    .select("id name slug description category_id subcategory_id brand images created_at sales_count rating_average second_hand specs case_details")
    .sort({ created_at: -1 })
    .lean()) as Array<Record<string, unknown>>;

  if (rawProducts.length === 0) {
    return {
      products: [],
      availableSubcategories,
    };
  }

  const productIds = rawProducts.map((product) => `${product.id ?? ""}`).filter(Boolean);
  const categoryIds = [
    ...new Set(
      rawProducts
        .flatMap((product) => [`${product.category_id ?? ""}`, `${product.subcategory_id ?? ""}`])
        .filter(Boolean),
    ),
  ];

  const [rawVariants, rawCategories] = await Promise.all([
    ProductVariant.find({ product_id: { $in: productIds }, is_active: true })
      .select("id product_id sku price compare_at_price stock images is_active color_name color_code storage ram barcode sort_order option_signature attributes created_at updated_at")
      .lean(),
    Category.find({ id: { $in: categoryIds } }).select("id name slug parent_category_id").lean(),
  ]);

  const variantsByProductId = new Map<string, ReturnType<typeof normalizeProductVariants>>();
  for (const rawVariant of rawVariants as Array<Record<string, unknown>>) {
    const productId = `${rawVariant.product_id ?? ""}`;
    if (!productId) {
      continue;
    }

    const currentVariants = variantsByProductId.get(productId) ?? [];
    currentVariants.push(
      ...normalizeProductVariants([
        {
          ...rawVariant,
          images: normalizeStringArray(rawVariant.images),
        },
      ]),
    );
    variantsByProductId.set(productId, sortProductVariants(currentVariants));
  }

  const categoriesById = new Map<string, { id?: string; name?: string; slug?: string; parent_category_id?: string | null }>();
  for (const rawCategory of rawCategories as Array<Record<string, unknown>>) {
    const categoryId = `${rawCategory.id ?? ""}`;
    if (!categoryId) {
      continue;
    }

    categoriesById.set(categoryId, {
      id: categoryId,
      name: normalizeText(rawCategory.name) ?? undefined,
      slug: normalizeText(rawCategory.slug) ?? undefined,
      parent_category_id: normalizeText(rawCategory.parent_category_id),
    });
  }

  const products = rawProducts.map<CatalogProductRecord>((product) => ({
    id: `${product.id ?? ""}`,
    name: `${product.name ?? ""}`,
    slug: `${product.slug ?? ""}`,
    description: normalizeText(product.description),
    brand: normalizeText(product.brand),
    images: normalizeStringArray(product.images),
    created_at: product.created_at as string | Date | undefined,
    sales_count: Number(product.sales_count ?? 0),
    rating_average: Number(product.rating_average ?? 0),
    second_hand: normalizeSecondHandDetails(product.second_hand),
    case_details: (product.case_details as Record<string, unknown> | null) ?? null,
    specs: (product.specs as Record<string, string | null> | null) ?? null,
    categories: categoriesById.get(`${product.category_id ?? ""}`) ?? null,
    subcategory: categoriesById.get(`${product.subcategory_id ?? ""}`) ?? null,
    product_variants: variantsByProductId.get(`${product.id ?? ""}`) ?? [],
  }));

  return {
    products: activeCategory === "ikinci-el-telefon" ? products.filter((product) => isAppleBrand(product.brand)) : products,
    availableSubcategories,
  };
}

async function getCatalogDataset(query: CatalogProductsQuery) {
  const filterProfile = getCatalogFilterProfile(query.activeCategory);
  const normalizedSearch = query.search.trim().toLocaleLowerCase("tr-TR");
  const { products, availableSubcategories } = await loadCatalogProducts(query.activeCategory);
  const searchFilteredProducts = products.filter((product) => matchesSearch(product, normalizedSearch));
  const filteredProducts = sortCatalogProducts(
    searchFilteredProducts.filter((product) => matchesCatalogFilters(product, query.filters, filterProfile)),
    query.filters,
    query.sortBy,
    filterProfile,
  );

  return {
    products,
    availableSubcategories,
    filterProfile,
    searchFilteredProducts,
    filteredProducts,
  };
}

export async function listCatalogProducts(query: CatalogProductsQuery): Promise<CatalogProductsListResult> {
  const safePage = Math.max(1, query.page);
  const safeLimit = Math.max(1, query.limit);
  const { products, availableSubcategories, filterProfile, searchFilteredProducts, filteredProducts } = await getCatalogDataset(query);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;

  return {
    items: filteredProducts.slice(start, end),
    totalCount: filteredProducts.length,
    facetSections: buildCatalogFacetSectionsData({
      filters: query.filters,
      filterProfile,
      isSecondHandIphoneCategory: query.activeCategory === "ikinci-el-telefon",
      products,
      availableSubcategories,
      searchFilteredProducts,
    }),
  };
}

export async function countCatalogProducts(query: CatalogProductsQuery) {
  const { filteredProducts } = await getCatalogDataset(query);
  return { totalCount: filteredProducts.length };
}
