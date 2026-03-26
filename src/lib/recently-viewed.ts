"use client";

import type { ProductSpecs } from "@/lib/product-specs";
import { normalizeProductVariants, type ProductVariantRecord } from "@/lib/product-variants";

const RECENTLY_VIEWED_STORAGE_KEY = "cep_dunyasi_recently_viewed";
const MAX_RECENTLY_VIEWED_PRODUCTS = 8;
export const RECENTLY_VIEWED_UPDATED_EVENT = "cep_dunyasi_recently_viewed_updated";

export type RecentlyViewedProductRecord = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images: string[];
  created_at?: string | Date;
  sales_count?: number;
  rating_average?: number;
  specs?: ProductSpecs | null;
  categories?: { name?: string; slug?: string } | null;
  product_variants: ProductVariantRecord[];
  selected_variant_id?: string | null;
  viewed_at: number;
};

type RecentlyViewedProductInput = Omit<RecentlyViewedProductRecord, "viewed_at">;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeRecentlyViewedProduct(input: RecentlyViewedProductInput, viewedAt: number): RecentlyViewedProductRecord | null {
  if (!input.id || !input.slug || !input.name) {
    return null;
  }

  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    brand: input.brand ?? null,
    description: input.description ?? null,
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    created_at: input.created_at,
    sales_count: Number(input.sales_count ?? 0),
    rating_average: Number(input.rating_average ?? 0),
    specs: input.specs ?? null,
    categories: input.categories ?? null,
    product_variants: normalizeProductVariants(input.product_variants || []),
    selected_variant_id: input.selected_variant_id ?? null,
    viewed_at: viewedAt,
  };
}

export function getRecentlyViewedProducts() {
  if (!canUseStorage()) {
    return [] as RecentlyViewedProductRecord[];
  }

  const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
  if (!raw) {
    return [] as RecentlyViewedProductRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as RecentlyViewedProductRecord[];
    if (!Array.isArray(parsed)) {
      return [] as RecentlyViewedProductRecord[];
    }

    return parsed
      .map((entry) => sanitizeRecentlyViewedProduct(entry, Number(entry.viewed_at ?? Date.now())))
      .filter(Boolean)
      .sort((left, right) => Number(right?.viewed_at ?? 0) - Number(left?.viewed_at ?? 0)) as RecentlyViewedProductRecord[];
  } catch {
    window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    return [] as RecentlyViewedProductRecord[];
  }
}

export function addRecentlyViewedProduct(input: RecentlyViewedProductInput) {
  if (!canUseStorage()) {
    return [] as RecentlyViewedProductRecord[];
  }

  const viewedAt = Date.now();
  const nextEntry = sanitizeRecentlyViewedProduct(input, viewedAt);

  if (!nextEntry) {
    return getRecentlyViewedProducts();
  }

  const nextProducts = [
    nextEntry,
    ...getRecentlyViewedProducts().filter((entry) => entry.id !== nextEntry.id),
  ].slice(0, MAX_RECENTLY_VIEWED_PRODUCTS);

  window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextProducts));
  window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_UPDATED_EVENT));
  return nextProducts;
}
