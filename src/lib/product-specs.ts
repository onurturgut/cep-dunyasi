import type { ProductVariantRecord } from "@/lib/product-variants";

export type ProductSpecs = {
  operatingSystem?: string | null;
  internalStorage?: string | null;
  ram?: string | null;
  frontCamera?: string | null;
  rearCamera?: string | null;
};

type ProductSpecsLike = Partial<ProductSpecs> & Record<string, unknown>;

export type ProductSpecsEntry = {
  key: keyof ProductSpecs;
  label: string;
  value: string;
};

export type ProductSpecsTableContext = {
  brand?: string | null;
  categoryName?: string | null;
  sku?: string | null;
  color?: string | null;
};

export type ProductSpecsTableItem = {
  label: string;
  value: string;
};

export type ProductSpecsSection = {
  id: string;
  title: string;
  items: ProductSpecsTableItem[];
};

function normalizeText(value: unknown) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

export function normalizeProductSpecs(raw: unknown): ProductSpecs {
  const specs = raw && typeof raw === "object" ? (raw as ProductSpecsLike) : {};

  return {
    operatingSystem:
      normalizeText(specs.operatingSystem) ||
      normalizeText(specs.operating_system) ||
      normalizeText(specs.os) ||
      null,
    internalStorage:
      normalizeText(specs.internalStorage) ||
      normalizeText(specs.internal_storage) ||
      normalizeText(specs.storage) ||
      null,
    ram: normalizeText(specs.ram) || normalizeText(specs.memory) || null,
    frontCamera:
      normalizeText(specs.frontCamera) ||
      normalizeText(specs.front_camera) ||
      normalizeText(specs.selfieCamera) ||
      null,
    rearCamera:
      normalizeText(specs.rearCamera) ||
      normalizeText(specs.rear_camera) ||
      normalizeText(specs.mainCamera) ||
      null,
  };
}

export function getProductSpecsEntries(raw: unknown, variant?: ProductVariantRecord | null): ProductSpecsEntry[] {
  const specs = normalizeProductSpecs(raw);
  const internalStorage = specs.internalStorage || `${variant?.storage ?? ""}`.trim() || null;
  const ram = specs.ram || `${variant?.ram ?? ""}`.trim() || null;
  const entries: ProductSpecsEntry[] = [
    { key: "operatingSystem", label: "Isletim Sistemi", value: specs.operatingSystem || "" },
    { key: "internalStorage", label: "Dahili Hafiza", value: internalStorage || "" },
    { key: "ram", label: "RAM Kapasitesi", value: ram || "" },
    { key: "frontCamera", label: "On (Selfie) Kamera", value: specs.frontCamera || "" },
    { key: "rearCamera", label: "Arka Kamera", value: specs.rearCamera || "" },
  ];

  return entries.filter((entry) => entry.value);
}

function createSpecsTableItem(label: string, value: unknown): ProductSpecsTableItem | null {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  return {
    label,
    value: normalizedValue,
  };
}

export function getProductSpecsSections(
  raw: unknown,
  variant?: ProductVariantRecord | null,
  context?: ProductSpecsTableContext,
): ProductSpecsSection[] {
  const specs = normalizeProductSpecs(raw);
  const storageValue = specs.internalStorage || normalizeText(variant?.storage);
  const ramValue = specs.ram || normalizeText(variant?.ram);

  const sections: ProductSpecsSection[] = [
    {
      id: "genel",
      title: "Genel",
      items: [
        createSpecsTableItem("Marka", context?.brand),
        createSpecsTableItem("Kategori", context?.categoryName),
        createSpecsTableItem("SKU", context?.sku || variant?.sku),
        createSpecsTableItem("Renk", context?.color || variant?.color_name),
        createSpecsTableItem("Isletim Sistemi", specs.operatingSystem),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "donanim",
      title: "Donanim",
      items: [
        createSpecsTableItem("Dahili Hafiza", storageValue),
        createSpecsTableItem("RAM Kapasitesi", ramValue),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "kamera",
      title: "Kamera",
      items: [
        createSpecsTableItem("On Kamera", specs.frontCamera),
        createSpecsTableItem("Arka Kamera", specs.rearCamera),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
  ];

  return sections.filter((section) => section.items.length > 0);
}
