import { getProductVariantAxes, type VariantAxisDefinition } from "@/lib/product-variant-config";

export type VariantSelection = {
  variantId?: string | null;
  colorName?: string | null;
  storage?: string | null;
  ram?: string | null;
  attributes?: Record<string, string | null | undefined>;
};

export type ProductVariantRecord = {
  id?: string;
  product_id?: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  images: string[];
  is_active: boolean;
  color_name: string;
  color_code: string | null;
  storage: string;
  ram: string | null;
  barcode: string | null;
  sort_order: number;
  option_signature: string;
  attributes: Record<string, string>;
  created_at?: string | Date;
  updated_at?: string | Date;
};

type VariantLike = Partial<ProductVariantRecord> & {
  attributes?: Record<string, unknown> | null;
  images?: Array<string | null | undefined> | null;
  compare_at_price?: number | string | null;
  price?: number | string | null;
  stock?: number | string | null;
  is_active?: boolean | null;
  color_name?: string | null;
  color_code?: string | null;
  storage?: string | null;
  ram?: string | null;
  sku?: string | null;
  barcode?: string | null;
  sort_order?: number | string | null;
  option_signature?: string | null;
};

function normalizeText(value: unknown) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

function normalizeStringArray(values: Array<string | null | undefined> | null | undefined) {
  return Array.from(new Set((values ?? []).map((value) => `${value ?? ""}`.trim()).filter(Boolean)));
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeInteger(value: unknown) {
  return Math.max(0, Math.floor(normalizeNumber(value)));
}

function normalizeColorCode(value: unknown) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const prefixed = normalized.startsWith("#") ? normalized : `#${normalized}`;
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(prefixed) ? prefixed.toUpperCase() : null;
}

function normalizeAttributeMap(attributes: Record<string, unknown> | null | undefined) {
  const normalizedAttributes: Record<string, string> = {};

  if (!attributes) {
    return normalizedAttributes;
  }

  for (const [key, value] of Object.entries(attributes)) {
    const normalizedKey = normalizeText(key);
    const normalizedValue = normalizeText(value);

    if (!normalizedKey || !normalizedValue) {
      continue;
    }

    normalizedAttributes[normalizedKey] = normalizedValue;
  }

  return normalizedAttributes;
}

function getAttributeValue(attributes: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!attributes) {
    return null;
  }

  for (const key of keys) {
    const value = normalizeText(attributes[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function getVariantAxisRawValue(
  axis: VariantAxisDefinition,
  input: {
    colorName?: string | null;
    storage?: string | null;
    ram?: string | null;
    attributes?: Record<string, unknown> | null | undefined;
  },
) {
  if (axis.source === "field") {
    if (axis.fieldKey === "color_name") {
      return normalizeText(input.colorName);
    }

    if (axis.fieldKey === "storage") {
      return normalizeText(input.storage);
    }

    if (axis.fieldKey === "ram") {
      return normalizeText(input.ram);
    }
  }

  return getAttributeValue(input.attributes, axis.attributeKeys);
}

export function buildVariantAttributes(input: {
  colorName?: string | null;
  storage?: string | null;
  ram?: string | null;
  attributes?: Record<string, unknown> | null;
  categorySlug?: string | null;
}) {
  const normalizedAttributes = normalizeAttributeMap(input.attributes);
  const attributes: Record<string, string> = { ...normalizedAttributes };

  for (const axis of getProductVariantAxes(input.categorySlug)) {
    const value = getVariantAxisRawValue(axis, input);
    if (!value) {
      continue;
    }

    attributes[axis.attributeKeys[0]] = value;
  }

  return attributes;
}

export function buildVariantOptionSignature(input: {
  colorName?: string | null;
  storage?: string | null;
  ram?: string | null;
  attributes?: Record<string, unknown> | null;
  categorySlug?: string | null;
}) {
  return getProductVariantAxes(input.categorySlug)
    .map((axis) => getVariantAxisRawValue(axis, input)?.toLocaleLowerCase("tr-TR") || "-")
    .join("__");
}

export function normalizeProductVariant(raw: VariantLike): ProductVariantRecord {
  const attributes = raw.attributes && typeof raw.attributes === "object" ? raw.attributes : {};
  const normalizedSourceAttributes = normalizeAttributeMap(attributes);
  const colorName =
    normalizeText(raw.color_name) ||
    getAttributeValue(attributes, ["color", "colorName", "color_name", "renk"]) ||
    "Standart";
  const storage =
    normalizeText(raw.storage) ||
    getAttributeValue(attributes, ["storage", "capacity", "depolama", "hafiza", "kapasite", "memory"]) ||
    "Standart";
  const ram =
    normalizeText(raw.ram) ||
    getAttributeValue(attributes, ["ram", "memory"]) ||
    null;
  const colorCode =
    normalizeColorCode(raw.color_code) ||
    normalizeColorCode(getAttributeValue(attributes, ["colorCode", "color_code", "hex", "swatch"])) ||
    null;
  const sku = normalizeText(raw.sku) || "";
  const optionSignature =
    normalizeText(raw.option_signature) ||
    buildVariantOptionSignature({
      colorName,
      storage,
      ram,
      attributes: normalizedSourceAttributes,
    });

  return {
    id: normalizeText(raw.id) || undefined,
    product_id: normalizeText(raw.product_id) || undefined,
    sku,
    price: normalizeNumber(raw.price),
    compare_at_price: normalizeNumber(raw.compare_at_price) > 0 ? normalizeNumber(raw.compare_at_price) : null,
    stock: normalizeInteger(raw.stock),
    images: normalizeStringArray(raw.images),
    is_active: raw.is_active !== false,
    color_name: colorName,
    color_code: colorCode,
    storage,
    ram,
    barcode: normalizeText(raw.barcode),
    sort_order: normalizeInteger(raw.sort_order),
    option_signature: optionSignature,
    attributes: {
      ...normalizedSourceAttributes,
      ...buildVariantAttributes({
        colorName,
        storage,
        ram,
        attributes: normalizedSourceAttributes,
      }),
    },
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export function normalizeProductVariants(variants: VariantLike[]) {
  return variants.map((variant) => normalizeProductVariant(variant));
}

export function sortProductVariants<T extends VariantLike>(variants: T[]) {
  return [...variants].sort((left, right) => {
    const normalizedLeft = normalizeProductVariant(left);
    const normalizedRight = normalizeProductVariant(right);

    return (
      normalizedLeft.sort_order - normalizedRight.sort_order ||
      normalizedLeft.color_name.localeCompare(normalizedRight.color_name, "tr") ||
      normalizedLeft.storage.localeCompare(normalizedRight.storage, "tr") ||
      (normalizedLeft.ram || "").localeCompare(normalizedRight.ram || "", "tr") ||
      normalizedLeft.price - normalizedRight.price
    );
  });
}

export function getActiveProductVariants<T extends VariantLike>(variants: T[]) {
  return sortProductVariants(variants).filter((variant) => normalizeProductVariant(variant).is_active);
}

export function getDefaultProductVariant<T extends VariantLike>(variants: T[], preferredVariantId?: string | null) {
  const activeVariants = getActiveProductVariants(variants);

  if (preferredVariantId) {
    const preferred = activeVariants.find((variant) => normalizeProductVariant(variant).id === preferredVariantId);
    if (preferred) {
      return preferred;
    }
  }

  const inStockVariant = activeVariants.find((variant) => normalizeProductVariant(variant).stock > 0);
  return inStockVariant ?? activeVariants[0] ?? null;
}

export function findProductVariantBySelection<T extends VariantLike>(variants: T[], selection: VariantSelection) {
  const activeVariants = getActiveProductVariants(variants);

  if (selection.variantId) {
    const byId = activeVariants.find((variant) => normalizeProductVariant(variant).id === selection.variantId);
    if (byId) {
      return byId;
    }
  }

  const requestedColor = normalizeText(selection.colorName);
  const requestedStorage = normalizeText(selection.storage);
  const requestedRam = normalizeText(selection.ram);
  const requestedAttributes = normalizeAttributeMap(selection.attributes);

  return activeVariants.find((variant) => {
    const normalizedVariant = normalizeProductVariant(variant);

    if (requestedColor && normalizedVariant.color_name !== requestedColor) {
      return false;
    }

    if (requestedStorage && normalizedVariant.storage !== requestedStorage) {
      return false;
    }

    if (requestedRam && normalizedVariant.ram !== requestedRam) {
      return false;
    }

    for (const [key, expectedValue] of Object.entries(requestedAttributes)) {
      if (normalizeText(normalizedVariant.attributes[key]) !== expectedValue) {
        return false;
      }
    }

    return true;
  }) ?? null;
}

export function resolveProductVariantBySelection<T extends VariantLike>(
  variants: T[],
  selection: VariantSelection,
  categorySlug?: string | null,
) {
  const activeVariants = getActiveProductVariants(variants).map((variant) => normalizeProductVariant(variant));

  if (activeVariants.length === 0) {
    return null;
  }

  const requestedAxes = getProductVariantAxes(categorySlug)
    .map((axis) => ({
      axis,
      value: getVariantAxisRawValue(axis, {
        colorName: selection.colorName,
        storage: selection.storage,
        ram: selection.ram,
        attributes: selection.attributes,
      }),
    }))
    .filter((entry): entry is { axis: VariantAxisDefinition; value: string } => Boolean(entry.value));

  if (requestedAxes.length === 0 && selection.variantId) {
    const byId = activeVariants.find((variant) => variant.id === selection.variantId);
    if (byId) {
      return byId;
    }
  }

  const exactMatch = activeVariants.find((variant) =>
    requestedAxes.every(({ axis, value }) =>
      getVariantAxisRawValue(axis, {
        colorName: variant.color_name,
        storage: variant.storage,
        ram: variant.ram,
        attributes: variant.attributes,
      }) === value,
    ),
  );

  if (exactMatch) {
    return exactMatch;
  }

  const rankedCandidates = activeVariants
    .map((variant) => {
      const axisMatches = requestedAxes.map(({ axis, value }) =>
        getVariantAxisRawValue(axis, {
          colorName: variant.color_name,
          storage: variant.storage,
          ram: variant.ram,
          attributes: variant.attributes,
        }) === value,
      );

      return {
        variant,
        axisMatches,
        matchedAxisCount: axisMatches.filter(Boolean).length,
      };
    })
    .filter((candidate) => candidate.matchedAxisCount > 0)
    .sort((left, right) => {
      if (right.matchedAxisCount !== left.matchedAxisCount) {
        return right.matchedAxisCount - left.matchedAxisCount;
      }

      for (let index = 0; index < left.axisMatches.length; index += 1) {
        const leftMatch = left.axisMatches[index] ? 1 : 0;
        const rightMatch = right.axisMatches[index] ? 1 : 0;

        if (rightMatch !== leftMatch) {
          return rightMatch - leftMatch;
        }
      }

      if ((right.variant.stock > 0 ? 1 : 0) !== (left.variant.stock > 0 ? 1 : 0)) {
        return (right.variant.stock > 0 ? 1 : 0) - (left.variant.stock > 0 ? 1 : 0);
      }

      return left.variant.sort_order - right.variant.sort_order;
    });

  return rankedCandidates[0]?.variant ?? getDefaultProductVariant(activeVariants);
}

export function getVariantLabel(variant: VariantLike) {
  const normalized = normalizeProductVariant(variant);
  const compatibilityLabel = normalized.attributes.uyumluluk || normalized.attributes.compatibility || null;
  const labelParts = [compatibilityLabel, normalized.color_name, normalized.storage, normalized.ram]
    .filter(Boolean)
    .filter((value, index, values) => value !== "Standart" || values.length === 1 || index === values.length - 1)
    .filter((value, index, values) => values.indexOf(value) === index);

  const label = labelParts.join(" / ");
  if (label && label !== "Standart") {
    return label;
  }

  const attributeFallbackKeys = [
    "uyumluluk",
    "compatibility",
    "guc",
    "power",
    "kapasite",
    "capacity",
    "ekran",
    "display",
    "durum",
    "condition",
    "cikis",
    "output",
    "kasa_boyutu",
    "case_size",
    "baglanti",
    "connectivity",
  ];
  const fallbackParts = attributeFallbackKeys
    .map((key) => normalized.attributes[key])
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);

  if (fallbackParts.length > 0) {
    return fallbackParts.join(" / ");
  }

  const genericAttributeParts = Object.entries(normalized.attributes)
    .filter(([key, value]) => Boolean(value) && !["color", "storage", "ram"].includes(key))
    .map(([, value]) => value)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2);

  if (genericAttributeParts.length > 0) {
    return genericAttributeParts.join(" / ");
  }

  return normalized.sku;
}

export function getVariantGallery(variant: VariantLike | null | undefined, productImages: Array<string | null | undefined>) {
  const variantImages = variant ? normalizeProductVariant(variant).images : [];
  return variantImages.length > 0 ? variantImages : normalizeStringArray(productImages);
}

export function getVariantSwatches<T extends VariantLike>(variants: T[]) {
  const swatchMap = new Map<string, { label: string; colorCode: string | null; variantId?: string }>();

  for (const variant of getActiveProductVariants(variants)) {
    const normalized = normalizeProductVariant(variant);
    if (!swatchMap.has(normalized.color_name)) {
      swatchMap.set(normalized.color_name, {
        label: normalized.color_name,
        colorCode: normalized.color_code,
        variantId: normalized.id,
      });
    }
  }

  return Array.from(swatchMap.values());
}

export function getStorageOptions<T extends VariantLike>(variants: T[], colorName?: string | null) {
  const normalizedColorName = normalizeText(colorName);
  const storageMap = new Map<string, { value: string; inStock: boolean }>();

  for (const variant of getActiveProductVariants(variants)) {
    const normalized = normalizeProductVariant(variant);
    if (normalizedColorName && normalized.color_name !== normalizedColorName) {
      continue;
    }

    const existing = storageMap.get(normalized.storage);
    storageMap.set(normalized.storage, {
      value: normalized.storage,
      inStock: (existing?.inStock ?? false) || normalized.stock > 0,
    });
  }

  return Array.from(storageMap.values());
}

export function getRamOptions<T extends VariantLike>(variants: T[], colorName?: string | null, storage?: string | null) {
  const normalizedColorName = normalizeText(colorName);
  const normalizedStorage = normalizeText(storage);
  const ramMap = new Map<string, { value: string; inStock: boolean }>();

  for (const variant of getActiveProductVariants(variants)) {
    const normalized = normalizeProductVariant(variant);

    if (normalizedColorName && normalized.color_name !== normalizedColorName) {
      continue;
    }

    if (normalizedStorage && normalized.storage !== normalizedStorage) {
      continue;
    }

    const value = normalized.ram || "Standart";
    const existing = ramMap.get(value);
    ramMap.set(value, {
      value,
      inStock: (existing?.inStock ?? false) || normalized.stock > 0,
    });
  }

  return Array.from(ramMap.values());
}

export function getVariantSummary(variant: VariantLike | null | undefined) {
  if (!variant) {
    return "";
  }

  return getVariantLabel(variant);
}

export function getProductStartingPrice<T extends VariantLike>(variants: T[]) {
  const activeVariants = getActiveProductVariants(variants).map((variant) => normalizeProductVariant(variant));

  if (activeVariants.length === 0) {
    return 0;
  }

  return activeVariants.reduce((lowestPrice, variant) => Math.min(lowestPrice, variant.price), activeVariants[0].price);
}
