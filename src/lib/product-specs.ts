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
  categorySlug?: string | null;
  sku?: string | null;
  color?: string | null;
  variantSummary?: string | null;
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

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
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

function getRawSpecs(raw: unknown) {
  return raw && typeof raw === "object" ? (raw as ProductSpecsLike) : {};
}

function getSpecValue(raw: ProductSpecsLike, keys: string[]) {
  for (const key of keys) {
    const expectedKey = normalizeKey(key);
    const match = Object.entries(raw).find(([entryKey]) => normalizeKey(entryKey) === expectedKey);
    const normalizedValue = normalizeText(match?.[1]);

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return null;
}

function mapCategorySlug(context?: ProductSpecsTableContext) {
  if (context?.categorySlug) {
    return context.categorySlug;
  }

  const categoryName = normalizeText(context?.categoryName)?.toLocaleLowerCase("tr-TR");

  if (!categoryName) {
    return null;
  }

  if (categoryName.includes("telefon")) return "telefon";
  if (categoryName.includes("k\u0131l\u0131f") || categoryName.includes("kilif")) return "kilif";
  if (categoryName.includes("\u015farj") || categoryName.includes("sarj")) return "sarj-aleti";
  if (categoryName.includes("power bank")) return "power-bank";
  if (categoryName.includes("saat")) return "akilli-saatler";

  return null;
}

export function normalizeProductSpecs(raw: unknown): ProductSpecs {
  const specs = getRawSpecs(raw);

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
    { key: "operatingSystem", label: "\u0130\u015fletim Sistemi", value: specs.operatingSystem || "" },
    { key: "internalStorage", label: "D\u00e2hili Haf\u0131za", value: internalStorage || "" },
    { key: "ram", label: "RAM Kapasitesi", value: ram || "" },
    { key: "frontCamera", label: "\u00d6n Kamera", value: specs.frontCamera || "" },
    { key: "rearCamera", label: "Arka Kamera", value: specs.rearCamera || "" },
  ];

  return entries.filter((entry) => entry.value);
}

function buildPhoneSections(raw: ProductSpecsLike, variant: ProductVariantRecord | null | undefined, context?: ProductSpecsTableContext) {
  const specs = normalizeProductSpecs(raw);
  const storageValue = specs.internalStorage || normalizeText(variant?.storage);
  const ramValue = specs.ram || normalizeText(variant?.ram);

  return [
    {
      id: "genel",
      title: "Genel",
      items: [
        createSpecsTableItem("Marka", context?.brand),
        createSpecsTableItem("Kategori", context?.categoryName),
        createSpecsTableItem("Model", context?.variantSummary),
        createSpecsTableItem("SKU", context?.sku || variant?.sku),
        createSpecsTableItem("Renk", context?.color || variant?.color_name),
        createSpecsTableItem("\u0130\u015fletim Sistemi", specs.operatingSystem),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "performans",
      title: "Performans",
      items: [
        createSpecsTableItem("D\u00e2hili Haf\u0131za", storageValue),
        createSpecsTableItem("RAM Kapasitesi", ramValue),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "kamera",
      title: "Kamera",
      items: [
        createSpecsTableItem("\u00d6n Kamera", specs.frontCamera),
        createSpecsTableItem("Arka Kamera", specs.rearCamera),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
  ];
}

function buildCaseSections(raw: ProductSpecsLike, variant: ProductVariantRecord | null | undefined, context?: ProductSpecsTableContext) {
  return [
    {
      id: "genel",
      title: "Genel",
      items: [
        createSpecsTableItem("Marka", context?.brand),
        createSpecsTableItem("Kategori", context?.categoryName),
        createSpecsTableItem("Model", context?.variantSummary),
        createSpecsTableItem("Uyumluluk", getSpecValue(raw, ["uyumluluk", "compatibility"]) || variant?.attributes.compatibility || variant?.attributes.uyumluluk),
        createSpecsTableItem("Renk", context?.color || variant?.color_name),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "tasarim",
      title: "Tasar\u0131m",
      items: [
        createSpecsTableItem("Malzeme", getSpecValue(raw, ["material", "materyal"])),
        createSpecsTableItem("Tip", getSpecValue(raw, ["type", "tip"])),
        createSpecsTableItem("Koruma", getSpecValue(raw, ["protection", "koruma"])),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
  ];
}

function buildChargerSections(raw: ProductSpecsLike, variant: ProductVariantRecord | null | undefined, context?: ProductSpecsTableContext) {
  return [
    {
      id: "genel",
      title: "Genel",
      items: [
        createSpecsTableItem("Marka", context?.brand),
        createSpecsTableItem("Kategori", context?.categoryName),
        createSpecsTableItem("Model", context?.variantSummary),
        createSpecsTableItem("SKU", context?.sku || variant?.sku),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "guc",
      title: "G\u00fc\u00e7 ve Ba\u011flant\u0131",
      items: [
        createSpecsTableItem("G\u00fc\u00e7", getSpecValue(raw, ["guc", "power"]) || variant?.attributes.power || variant?.attributes.guc),
        createSpecsTableItem("\u00c7\u0131k\u0131\u015f", getSpecValue(raw, ["cikis", "output"]) || variant?.attributes.output || variant?.attributes.cikis),
        createSpecsTableItem("Giri\u015f", getSpecValue(raw, ["giris", "input"])),
        createSpecsTableItem("Port Tipi", getSpecValue(raw, ["port_type", "port"])),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
  ];
}

function buildPowerBankSections(raw: ProductSpecsLike, variant: ProductVariantRecord | null | undefined, context?: ProductSpecsTableContext) {
  return [
    {
      id: "genel",
      title: "Genel",
      items: [
        createSpecsTableItem("Marka", context?.brand),
        createSpecsTableItem("Kategori", context?.categoryName),
        createSpecsTableItem("Model", context?.variantSummary),
        createSpecsTableItem("SKU", context?.sku || variant?.sku),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "kapasite",
      title: "Kapasite ve \u00c7\u0131k\u0131\u015f",
      items: [
        createSpecsTableItem("Kapasite", getSpecValue(raw, ["kapasite", "capacity"]) || variant?.attributes.capacity || variant?.attributes.kapasite),
        createSpecsTableItem("\u00c7\u0131k\u0131\u015f", getSpecValue(raw, ["cikis", "output"]) || variant?.attributes.output || variant?.attributes.cikis),
        createSpecsTableItem("Giri\u015f", getSpecValue(raw, ["giris", "input"])),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
  ];
}

function buildWatchSections(raw: ProductSpecsLike, variant: ProductVariantRecord | null | undefined, context?: ProductSpecsTableContext) {
  return [
    {
      id: "genel",
      title: "Genel",
      items: [
        createSpecsTableItem("Marka", context?.brand),
        createSpecsTableItem("Kategori", context?.categoryName),
        createSpecsTableItem("Model", context?.variantSummary),
        createSpecsTableItem("Renk", context?.color || variant?.color_name),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "tasarim",
      title: "Ekran ve Tasar\u0131m",
      items: [
        createSpecsTableItem("Ekran", getSpecValue(raw, ["ekran", "display"]) || variant?.attributes.display || variant?.attributes.ekran),
        createSpecsTableItem("Kasa Boyutu", getSpecValue(raw, ["kasa_boyutu", "case_size", "boyut"]) || variant?.attributes.case_size || variant?.attributes.kasa_boyutu),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "baglanti",
      title: "Ba\u011flant\u0131",
      items: [
        createSpecsTableItem("Ba\u011flant\u0131", getSpecValue(raw, ["baglanti", "connectivity"]) || variant?.attributes.connectivity || variant?.attributes.baglanti),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
  ];
}

function buildFallbackSections(raw: ProductSpecsLike, variant: ProductVariantRecord | null | undefined, context?: ProductSpecsTableContext) {
  const genericEntries = Object.entries(raw)
    .filter(([key, value]) => {
      const normalizedKey = normalizeKey(key);
      if (["operatingsystem", "operating_system", "os", "internalstorage", "internal_storage", "storage", "ram", "memory", "frontcamera", "front_camera", "selfiecamera", "rearcamera", "rear_camera", "maincamera"].includes(normalizedKey)) {
        return false;
      }

      return Boolean(normalizeText(value));
    })
    .map(([key, value]) => ({
      label: key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toLocaleUpperCase("tr-TR")),
      value: `${value}`,
    }));

  return [
    {
      id: "genel",
      title: "Genel",
      items: [
        createSpecsTableItem("Marka", context?.brand),
        createSpecsTableItem("Kategori", context?.categoryName),
        createSpecsTableItem("Model", context?.variantSummary),
        createSpecsTableItem("SKU", context?.sku || variant?.sku),
      ].filter(Boolean) as ProductSpecsTableItem[],
    },
    {
      id: "detaylar",
      title: "Detaylar",
      items: genericEntries,
    },
  ];
}

export function getProductSpecsSections(
  raw: unknown,
  variant?: ProductVariantRecord | null,
  context?: ProductSpecsTableContext,
): ProductSpecsSection[] {
  const rawSpecs = getRawSpecs(raw);
  const categorySlug = mapCategorySlug(context);

  const sections =
    categorySlug === "telefon" || categorySlug === "ikinci-el-telefon"
      ? buildPhoneSections(rawSpecs, variant, context)
      : categorySlug === "kilif"
        ? buildCaseSections(rawSpecs, variant, context)
        : categorySlug === "sarj-aleti"
          ? buildChargerSections(rawSpecs, variant, context)
          : categorySlug === "power-bank"
            ? buildPowerBankSections(rawSpecs, variant, context)
            : categorySlug === "akilli-saatler"
              ? buildWatchSections(rawSpecs, variant, context)
              : buildFallbackSections(rawSpecs, variant, context);

  return sections.filter((section) => section.items.length > 0);
}
