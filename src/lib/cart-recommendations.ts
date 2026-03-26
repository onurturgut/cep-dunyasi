import type { CatalogProductRecord } from "@/lib/product-catalog";

const complementaryCategoryMap: Record<string, string[]> = {
  telefon: ["kilif", "sarj-aleti", "power-bank", "akilli-saatler"],
  "ikinci-el-telefon": ["kilif", "sarj-aleti", "power-bank", "akilli-saatler"],
  kilif: ["sarj-aleti", "power-bank", "akilli-saatler"],
  "sarj-aleti": ["power-bank", "kilif", "akilli-saatler"],
  "power-bank": ["sarj-aleti", "kilif", "akilli-saatler"],
  "akilli-saatler": ["power-bank", "sarj-aleti", "kilif"],
  "teknik-servis": ["kilif", "sarj-aleti", "power-bank"],
};

function normalizeText(value: unknown) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

function getCategorySlug(product: CatalogProductRecord) {
  return normalizeText(product.categories?.slug);
}

function getCategoryPriorityScores(cartProducts: CatalogProductRecord[]) {
  const scores = new Map<string, number>();

  for (const product of cartProducts) {
    const categorySlug = getCategorySlug(product);
    if (!categorySlug) {
      continue;
    }

    const relatedCategories = complementaryCategoryMap[categorySlug] ?? [];
    relatedCategories.forEach((relatedCategory, index) => {
      const score = Math.max(1, relatedCategories.length - index);
      scores.set(relatedCategory, (scores.get(relatedCategory) ?? 0) + score);
    });
  }

  return scores;
}

function getFallbackProducts(allProducts: CatalogProductRecord[], excludedIds: Set<string>, limit: number) {
  return allProducts
    .filter((product) => !excludedIds.has(product.id))
    .sort((left, right) => {
      const leftSales = Number(left.sales_count ?? 0);
      const rightSales = Number(right.sales_count ?? 0);
      const leftRating = Number(left.rating_average ?? 0);
      const rightRating = Number(right.rating_average ?? 0);

      return rightSales - leftSales || rightRating - leftRating || `${left.name}`.localeCompare(`${right.name}`, "tr");
    })
    .slice(0, limit);
}

export function getComplementaryProducts(
  allProducts: CatalogProductRecord[],
  cartProductIds: string[],
  limit = 8
) {
  const cartProductIdSet = new Set(cartProductIds);
  const cartProducts = allProducts.filter((product) => cartProductIdSet.has(product.id));
  const categoryPriorityScores = getCategoryPriorityScores(cartProducts);
  const cartBrands = new Set(
    cartProducts
      .map((product) => normalizeText(product.brand))
      .filter(Boolean)
  );

  if (cartProducts.length === 0 || categoryPriorityScores.size === 0) {
    return getFallbackProducts(allProducts, cartProductIdSet, limit);
  }

  const candidates = allProducts
    .filter((product) => !cartProductIdSet.has(product.id))
    .map((product) => {
      const categorySlug = getCategorySlug(product);
      const categoryScore = categorySlug ? categoryPriorityScores.get(categorySlug) ?? 0 : 0;
      const sameBrandBoost = cartBrands.has(normalizeText(product.brand)) ? 0.5 : 0;
      const salesBoost = Number(product.sales_count ?? 0) > 0 ? 0.25 : 0;
      const ratingBoost = Number(product.rating_average ?? 0) > 0 ? Number(product.rating_average ?? 0) / 10 : 0;

      return {
        product,
        score: categoryScore + sameBrandBoost + salesBoost + ratingBoost,
      };
    })
    .filter((entry) => entry.score > 0);

  if (candidates.length === 0) {
    return getFallbackProducts(allProducts, cartProductIdSet, limit);
  }

  const sortedCandidates = candidates.sort(
    (left, right) => right.score - left.score || Number(right.product.sales_count ?? 0) - Number(left.product.sales_count ?? 0)
  );

  const groupedByCategory = new Map<string, CatalogProductRecord[]>();
  for (const entry of sortedCandidates) {
    const categorySlug = getCategorySlug(entry.product) ?? "other";
    const current = groupedByCategory.get(categorySlug) ?? [];
    current.push(entry.product);
    groupedByCategory.set(categorySlug, current);
  }

  const diversified: CatalogProductRecord[] = [];
  while (diversified.length < limit) {
    let addedInRound = false;

    for (const [categorySlug, products] of groupedByCategory.entries()) {
      const nextProduct = products.shift();
      if (!nextProduct) {
        continue;
      }

      diversified.push(nextProduct);
      addedInRound = true;

      if (products.length === 0) {
        groupedByCategory.delete(categorySlug);
      }

      if (diversified.length >= limit) {
        break;
      }
    }

    if (!addedInRound) {
      break;
    }
  }

  if (diversified.length < limit) {
    const selectedIds = new Set(diversified.map((product) => product.id));
    const remaining = getFallbackProducts(allProducts, new Set([...cartProductIdSet, ...selectedIds]), limit - diversified.length);
    return [...diversified, ...remaining].slice(0, limit);
  }

  return diversified.slice(0, limit);
}
