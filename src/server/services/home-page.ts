import type { HomeCategory, HomeProduct, HomeSiteContent } from "@/components/home/home-data";
import { defaultCategories, defaultSiteContent, mergeCategories } from "@/components/home/home-data";
import type { MarketingHomeModules } from "@/lib/marketing";
import { normalizeProductVariants, sortProductVariants } from "@/lib/product-variants";
import { connectToDatabase } from "@/server/mongodb";
import { Category, Product, ProductVariant, SiteContent } from "@/server/models";
import { createRequestTimer } from "@/server/observability/request-timing";
import { getMarketingHomeModules } from "@/server/services/marketing";
import { normalizeMediaUrl } from "@/server/storage/r2";

type RawRecord = Record<string, unknown>;

export type HomePageData = {
  categories: HomeCategory[];
  featuredProducts: HomeProduct[];
  siteContent: HomeSiteContent;
  marketing: MarketingHomeModules;
};

function serializeForClient<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const homeSiteContentSelect =
  "hero_title_prefix hero_title_highlight hero_title_suffix hero_subtitle hero_logo_light_url hero_logo_dark_url hero_cta_label hero_cta_href shipping_fee hero_slides hero_benefits category_section_title category_section_description category_banner_enabled category_banner_main_image category_banner_video category_banner_video_link category_banner_badge_text category_banner_intro_text category_banner_brand_title category_banner_stat_1_label category_banner_stat_1_value category_banner_stat_2_label category_banner_stat_2_value category_banner_highlight_label category_banner_brand_desc_1 category_banner_brand_desc_2 category_banner_brand_desc_3 category_banner_slots explore_section_title featured_section_title featured_section_cta_label featured_section_cta_href";

const homeProductSelect = "id name slug description category_id brand images created_at sales_count rating_average rating_count specs second_hand case_details";

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

function normalizeSiteContent(rawSiteContent: RawRecord | null): HomeSiteContent {
  if (!rawSiteContent) {
    return defaultSiteContent;
  }

  return {
    hero_title_prefix: normalizeText(rawSiteContent.hero_title_prefix) ?? defaultSiteContent.hero_title_prefix,
    hero_title_highlight: normalizeText(rawSiteContent.hero_title_highlight) ?? defaultSiteContent.hero_title_highlight,
    hero_title_suffix: normalizeText(rawSiteContent.hero_title_suffix) ?? defaultSiteContent.hero_title_suffix,
    hero_subtitle: normalizeText(rawSiteContent.hero_subtitle) ?? defaultSiteContent.hero_subtitle,
    hero_logo_light_url: normalizeText(rawSiteContent.hero_logo_light_url) ?? defaultSiteContent.hero_logo_light_url,
    hero_logo_dark_url: normalizeText(rawSiteContent.hero_logo_dark_url) ?? defaultSiteContent.hero_logo_dark_url,
    hero_cta_label: normalizeText(rawSiteContent.hero_cta_label) ?? defaultSiteContent.hero_cta_label,
    hero_cta_href: normalizeText(rawSiteContent.hero_cta_href) ?? defaultSiteContent.hero_cta_href,
    shipping_fee: Number(rawSiteContent.shipping_fee ?? defaultSiteContent.shipping_fee),
    hero_slides: Array.isArray(rawSiteContent.hero_slides)
      ? rawSiteContent.hero_slides.map((slide, index) => {
          const source = slide as RawRecord;
          return {
            id: normalizeText(source.id) ?? `hero-slide-${index + 1}`,
            image_url: normalizeMediaUrl(normalizeText(source.image_url) ?? ""),
            alt: normalizeText(source.alt) ?? `Hero görseli ${index + 1}`,
          };
        })
      : defaultSiteContent.hero_slides,
    hero_benefits: Array.isArray(rawSiteContent.hero_benefits)
      ? rawSiteContent.hero_benefits.map((benefit) => {
          const source = benefit as RawRecord;
          return {
            icon: normalizeText(source.icon) ?? "Truck",
            title: normalizeText(source.title) ?? "",
            desc: normalizeText(source.desc) ?? "",
          };
        })
      : defaultSiteContent.hero_benefits,
    category_section_title: normalizeText(rawSiteContent.category_section_title) ?? defaultSiteContent.category_section_title,
    category_section_description: normalizeText(rawSiteContent.category_section_description) ?? defaultSiteContent.category_section_description,
    category_banner_enabled:
      typeof rawSiteContent.category_banner_enabled === "boolean"
        ? rawSiteContent.category_banner_enabled
        : defaultSiteContent.category_banner_enabled,
    category_banner_main_image:
      normalizeText(rawSiteContent.category_banner_main_image) ?? defaultSiteContent.category_banner_main_image,
    category_banner_video: normalizeText(rawSiteContent.category_banner_video) ?? defaultSiteContent.category_banner_video,
    category_banner_video_link:
      normalizeText(rawSiteContent.category_banner_video_link) ?? defaultSiteContent.category_banner_video_link,
    category_banner_badge_text:
      normalizeText(rawSiteContent.category_banner_badge_text) ?? defaultSiteContent.category_banner_badge_text,
    category_banner_intro_text:
      normalizeText(rawSiteContent.category_banner_intro_text) ?? defaultSiteContent.category_banner_intro_text,
    category_banner_brand_title:
      normalizeText(rawSiteContent.category_banner_brand_title) ?? defaultSiteContent.category_banner_brand_title,
    category_banner_stat_1_label:
      normalizeText(rawSiteContent.category_banner_stat_1_label) ?? defaultSiteContent.category_banner_stat_1_label,
    category_banner_stat_1_value:
      normalizeText(rawSiteContent.category_banner_stat_1_value) ?? defaultSiteContent.category_banner_stat_1_value,
    category_banner_stat_2_label:
      normalizeText(rawSiteContent.category_banner_stat_2_label) ?? defaultSiteContent.category_banner_stat_2_label,
    category_banner_stat_2_value:
      normalizeText(rawSiteContent.category_banner_stat_2_value) ?? defaultSiteContent.category_banner_stat_2_value,
    category_banner_highlight_label:
      normalizeText(rawSiteContent.category_banner_highlight_label) ?? defaultSiteContent.category_banner_highlight_label,
    category_banner_brand_desc_1:
      normalizeText(rawSiteContent.category_banner_brand_desc_1) ?? defaultSiteContent.category_banner_brand_desc_1,
    category_banner_brand_desc_2:
      normalizeText(rawSiteContent.category_banner_brand_desc_2) ?? defaultSiteContent.category_banner_brand_desc_2,
    category_banner_brand_desc_3:
      normalizeText(rawSiteContent.category_banner_brand_desc_3) ?? defaultSiteContent.category_banner_brand_desc_3,
    category_banner_slots: Array.isArray(rawSiteContent.category_banner_slots)
      ? rawSiteContent.category_banner_slots
          .map((slot) => normalizeMediaUrl(`${slot ?? ""}`.trim()))
          .filter(Boolean)
      : defaultSiteContent.category_banner_slots,
    explore_section_title: normalizeText(rawSiteContent.explore_section_title) ?? defaultSiteContent.explore_section_title,
    featured_section_title: normalizeText(rawSiteContent.featured_section_title) ?? defaultSiteContent.featured_section_title,
    featured_section_cta_label:
      normalizeText(rawSiteContent.featured_section_cta_label) ?? defaultSiteContent.featured_section_cta_label,
    featured_section_cta_href:
      normalizeText(rawSiteContent.featured_section_cta_href) ?? defaultSiteContent.featured_section_cta_href,
  };
}

function mapProductRecord(
  product: RawRecord,
  categoriesById: Map<string, { name?: string; slug?: string }>,
  variantsByProductId: Map<string, ReturnType<typeof normalizeProductVariants>>,
) {
  const productId = `${product.id ?? ""}`;

  return {
    id: productId,
    slug: `${product.slug ?? ""}`,
    name: `${product.name ?? ""}`,
    description: normalizeText(product.description),
    brand: normalizeText(product.brand),
    images: normalizeStringArray(product.images),
    created_at: product.created_at as string | Date | undefined,
    sales_count: Number(product.sales_count ?? 0),
    rating_average: Number(product.rating_average ?? 0),
    rating_count: Number(product.rating_count ?? 0),
    specs: (product.specs as Record<string, string | null> | null) ?? null,
    second_hand: (product.second_hand as Record<string, unknown> | null) ?? null,
    case_details: (product.case_details as Record<string, unknown> | null) ?? null,
    product_variants: variantsByProductId.get(productId) ?? [],
    categories: categoriesById.get(`${product.category_id ?? ""}`) ?? null,
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  const timer = createRequestTimer("service:getHomePageData");
  await connectToDatabase();
  timer.mark("db-connect");

  const [rawCategories, rawSiteContent, rawFeaturedProducts, marketing] = await Promise.all([
    Category.find({ parent_category_id: null }).select("id name slug icon description image_url").sort({ name: 1 }).lean(),
    SiteContent.findOne({ key: "home" }).select(homeSiteContentSelect).lean(),
    Product.find({ is_featured: true, is_active: true })
      .select(homeProductSelect)
      .sort({ created_at: -1 })
      .limit(8)
      .lean(),
    getMarketingHomeModules(),
  ]);
  timer.mark("load-home-documents");

  const categories =
    Array.isArray(rawCategories) && rawCategories.length > 0
      ? mergeCategories(
          defaultCategories,
          rawCategories.map((category) => ({
            id: `${category.id ?? ""}`,
            name: `${category.name ?? ""}`,
            slug: `${category.slug ?? ""}`,
            icon: normalizeText(category.icon) ?? undefined,
            description: normalizeText(category.description) ?? undefined,
            image_url: normalizeText(category.image_url) ?? undefined,
          })),
        )
      : defaultCategories;

  let candidateProducts = rawFeaturedProducts as RawRecord[];
  const featuredPreview = candidateProducts.map((product) => ({
    images: normalizeStringArray(product.images),
  }));
  const hasFeaturedProductsWithImages = featuredPreview.some((product) => product.images.some(Boolean));

  if (!hasFeaturedProductsWithImages) {
    const fallbackActiveProducts = (await Product.find({ is_active: true })
      .select(homeProductSelect)
      .sort({ created_at: -1 })
      .limit(12)
      .lean()) as RawRecord[];

    candidateProducts = fallbackActiveProducts;
    timer.mark("load-fallback-products");
  }

  const productIds = Array.from(new Set(candidateProducts.map((product) => `${product.id ?? ""}`).filter(Boolean)));
  const categoryIds = Array.from(new Set(candidateProducts.map((product) => `${product.category_id ?? ""}`).filter(Boolean)));

  const [rawVariants, rawProductCategories] = await Promise.all([
    productIds.length > 0
      ? ProductVariant.find({ product_id: { $in: productIds }, is_active: true })
          .select(
            "id product_id sku price compare_at_price stock images is_active color_name color_code storage ram barcode sort_order option_signature attributes created_at updated_at",
          )
          .lean()
      : [],
    categoryIds.length > 0 ? Category.find({ id: { $in: categoryIds } }).select("id name slug").lean() : [],
  ]);
  timer.mark("load-product-relations");

  const variantsByProductId = new Map<string, ReturnType<typeof normalizeProductVariants>>();
  for (const rawVariant of rawVariants as RawRecord[]) {
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

  const categoriesById = new Map<string, { name?: string; slug?: string }>();
  for (const rawCategory of rawProductCategories as RawRecord[]) {
    const categoryId = `${rawCategory.id ?? ""}`;
    if (!categoryId) {
      continue;
    }

    categoriesById.set(categoryId, {
      name: normalizeText(rawCategory.name) ?? undefined,
      slug: normalizeText(rawCategory.slug) ?? undefined,
    });
  }

  const featuredProducts = (rawFeaturedProducts as RawRecord[]).map((product) => mapProductRecord(product, categoriesById, variantsByProductId));
  const activeProducts = candidateProducts.map((product) => mapProductRecord(product, categoriesById, variantsByProductId));
  const featuredWithImages = featuredProducts.filter((product) => Array.isArray(product.images) && product.images.some(Boolean));
  const activeWithImages = activeProducts.filter((product) => Array.isArray(product.images) && product.images.some(Boolean));

  const result = {
    categories,
    siteContent: normalizeSiteContent((rawSiteContent as RawRecord | null) ?? null),
    marketing,
    featuredProducts:
      featuredWithImages.length > 0
        ? featuredWithImages
        : activeWithImages.length > 0
          ? activeWithImages.slice(0, 8)
          : featuredProducts.length > 0
            ? featuredProducts
            : activeProducts.slice(0, 8),
  };

  timer.log({
    categories: result.categories.length,
    featuredProducts: result.featuredProducts.length,
  });

  return serializeForClient(result);
}

export async function getTopLevelCategories(): Promise<HomeCategory[]> {
  await connectToDatabase();

  const rawCategories = await Category.find({ parent_category_id: null }).select("id name slug icon description image_url").sort({ name: 1 }).lean();

  const categories =
    Array.isArray(rawCategories) && rawCategories.length > 0
      ? mergeCategories(
          defaultCategories,
          rawCategories.map((category) => ({
            id: `${category.id ?? ""}`,
            name: `${category.name ?? ""}`,
            slug: `${category.slug ?? ""}`,
            icon: normalizeText(category.icon) ?? undefined,
            description: normalizeText(category.description) ?? undefined,
            image_url: normalizeText(category.image_url) ?? undefined,
          })),
        )
      : defaultCategories;

  return serializeForClient(categories);
}

