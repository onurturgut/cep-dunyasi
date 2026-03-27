export type VariantAxisId =
  | "color_name"
  | "storage"
  | "ram"
  | "compatibility"
  | "power"
  | "capacity"
  | "output"
  | "display"
  | "case_size"
  | "connectivity";

export type VariantAxisDefinition = {
  id: VariantAxisId;
  label: string;
  placeholder: string;
  source: "field" | "attribute";
  fieldKey?: "color_name" | "storage" | "ram";
  attributeKeys: string[];
  style?: "pill" | "swatch";
  required?: boolean;
  showInCatalogFilter?: boolean;
  filterPlaceholder?: string;
};

export type ProductVariantCategoryConfig = {
  axes: VariantAxisDefinition[];
  helperText: string;
};

const sharedAxes = {
  color: {
    id: "color_name",
    label: "Renk",
    placeholder: "Grafit",
    source: "field",
    fieldKey: "color_name",
    attributeKeys: ["color", "renk"],
    style: "swatch",
    required: true,
    showInCatalogFilter: true,
    filterPlaceholder: "Renk seçin",
  },
  storage: {
    id: "storage",
    label: "Depolama",
    placeholder: "128 GB",
    source: "field",
    fieldKey: "storage",
    attributeKeys: ["storage", "depolama", "capacity", "hafiza", "memory"],
    required: true,
    showInCatalogFilter: true,
    filterPlaceholder: "Depolama seçin",
  },
  ram: {
    id: "ram",
    label: "RAM",
    placeholder: "8 GB",
    source: "field",
    fieldKey: "ram",
    attributeKeys: ["ram", "memory"],
    required: false,
    showInCatalogFilter: true,
    filterPlaceholder: "RAM seçin",
  },
  compatibility: {
    id: "compatibility",
    label: "Uyumluluk",
    placeholder: "iPhone 15 Pro",
    source: "attribute",
    attributeKeys: ["uyumluluk", "compatibility"],
    required: true,
    showInCatalogFilter: true,
    filterPlaceholder: "Model seçin",
  },
  power: {
    id: "power",
    label: "Güç",
    placeholder: "20W",
    source: "attribute",
    attributeKeys: ["guc", "power"],
    required: true,
    showInCatalogFilter: true,
    filterPlaceholder: "Güç seçin",
  },
  capacity: {
    id: "capacity",
    label: "Kapasite",
    placeholder: "10000 mAh",
    source: "attribute",
    attributeKeys: ["kapasite", "capacity"],
    required: true,
    showInCatalogFilter: true,
    filterPlaceholder: "Kapasite seçin",
  },
  output: {
    id: "output",
    label: "Çıkış",
    placeholder: "USB-C / 22.5W",
    source: "attribute",
    attributeKeys: ["cikis", "output", "port_type", "port"],
    required: false,
    showInCatalogFilter: true,
    filterPlaceholder: "Çıkış seçin",
  },
  display: {
    id: "display",
    label: "Ekran",
    placeholder: "AMOLED",
    source: "attribute",
    attributeKeys: ["ekran", "display"],
    required: false,
    showInCatalogFilter: true,
    filterPlaceholder: "Ekran seçin",
  },
  caseSize: {
    id: "case_size",
    label: "Kasa Boyutu",
    placeholder: "45 mm",
    source: "attribute",
    attributeKeys: ["kasa_boyutu", "case_size", "boyut"],
    required: true,
    showInCatalogFilter: true,
    filterPlaceholder: "Boyut seçin",
  },
  connectivity: {
    id: "connectivity",
    label: "Bağlantı",
    placeholder: "GPS + Cellular",
    source: "attribute",
    attributeKeys: ["baglanti", "connectivity"],
    required: false,
    showInCatalogFilter: true,
    filterPlaceholder: "Bağlantı seçin",
  },
} satisfies Record<string, VariantAxisDefinition>;

const defaultConfig: ProductVariantCategoryConfig = {
  axes: [sharedAxes.color, sharedAxes.storage, sharedAxes.ram],
  helperText: "Marka, fiyat, renk, RAM, depolama ve stok durumuna göre filtreleyebilirsiniz.",
};

const categoryConfigs: Record<string, ProductVariantCategoryConfig> = {
  telefon: {
    axes: [sharedAxes.color, sharedAxes.storage, sharedAxes.ram],
    helperText: "Telefonları marka, renk, depolama, RAM ve fiyata göre filtreleyebilirsiniz.",
  },
  "ikinci-el-telefon": {
    axes: [sharedAxes.color, sharedAxes.storage, sharedAxes.ram],
    helperText: "2. el iPhone modellerini durum, renk, depolama ve fiyat bazında filtreleyebilirsiniz.",
  },
  kilif: {
    axes: [sharedAxes.color, sharedAxes.compatibility],
    helperText: "Kılıfları uyumluluk, renk, marka ve fiyat bazında filtreleyebilirsiniz.",
  },
  "sarj-aleti": {
    axes: [sharedAxes.power, sharedAxes.output],
    helperText: "Şarj aletlerini güç, çıkış tipi, marka, fiyat ve stok durumuna göre filtreleyebilirsiniz.",
  },
  "power-bank": {
    axes: [sharedAxes.capacity, sharedAxes.output],
    helperText: "Power bank ürünlerini kapasite, çıkış gücü, marka ve fiyata göre filtreleyebilirsiniz.",
  },
  "akilli-saatler": {
    axes: [sharedAxes.color, sharedAxes.caseSize, sharedAxes.connectivity],
    helperText: "Akıllı saatleri renk, kasa boyutu, bağlantı ve fiyat bazında filtreleyebilirsiniz.",
  },
};

export function getProductVariantCategoryConfig(categorySlug?: string | null): ProductVariantCategoryConfig {
  if (!categorySlug) {
    return defaultConfig;
  }

  return categoryConfigs[categorySlug] ?? defaultConfig;
}

export function getProductVariantAxes(categorySlug?: string | null) {
  return getProductVariantCategoryConfig(categorySlug).axes;
}

export function getProductVariantFilterAxes(categorySlug?: string | null) {
  return getProductVariantAxes(categorySlug).filter((axis) => axis.showInCatalogFilter);
}
