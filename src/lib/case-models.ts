import { sanitizeSlug } from "@/lib/utils";

export const IPHONE_CASE_MODELS = [
  "iPhone 11",
  "iPhone 12",
  "iPhone 12 Pro",
  "iPhone 13",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14",
  "iPhone 14 Plus",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 17",
  "iPhone 17 Pro",
  "iPhone 17 Air",
  "iPhone 17 Pro Max",
] as const;

export const IPHONE_CASE_SERIES_GROUPS = [
  { id: "11", label: "11 Serisi", models: ["iPhone 11"] },
  { id: "12", label: "12 Serisi", models: ["iPhone 12", "iPhone 12 Pro"] },
  { id: "13", label: "13 Serisi", models: ["iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max"] },
  { id: "14", label: "14 Serisi", models: ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"] },
  { id: "15", label: "15 Serisi", models: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"] },
  { id: "16", label: "16 Serisi", models: ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max"] },
  { id: "17", label: "17 Serisi", models: ["iPhone 17", "iPhone 17 Pro", "iPhone 17 Air", "iPhone 17 Pro Max"] },
] as const;

export const CASE_COLOR_OPTIONS = [
  "Siyah",
  "Seffaf",
  "Beyaz",
  "Gri",
  "Lacivert",
  "Mavi",
  "Yesil",
  "Kirmizi",
  "Pembe",
  "Mor",
] as const;

export const CASE_TYPE_OPTIONS = [
  "Seffaf",
  "Silikon",
  "Deri",
  "Magsafe",
  "Zirhli",
  "Kartlikli",
  "Standli",
  "Lens Korumali",
] as const;

export const CASE_THEME_OPTIONS = [
  "Duz",
  "Guess",
  "Taraftar",
  "Lisansli",
  "Luxury",
  "Desenli",
  "Minimal",
  "Karbon",
] as const;

export const CASE_FEATURE_OPTIONS = [
  "Magsafe Uyumlu",
  "Kamera Koruma",
  "Yuksek Kose Koruma",
  "Sok Emici",
  "Kaymaz Yuzey",
  "Stand Ozellikli",
  "Kartlikli",
  "Lisansli Tasarim",
] as const;

export type CaseDetails = {
  case_type?: string | null;
  case_theme?: string | null;
  feature_tags?: string[];
};

export const CASE_COLOR_CODE_MAP: Record<string, string> = {
  Siyah: "#111827",
  Seffaf: "#D9E6F2",
  Beyaz: "#F8FAFC",
  Gri: "#6B7280",
  Lacivert: "#1E3A8A",
  Mavi: "#2563EB",
  Yesil: "#15803D",
  Kirmizi: "#DC2626",
  Pembe: "#EC4899",
  Mor: "#9333EA",
};

function abbreviateToken(value: string) {
  const normalized = sanitizeSlug(value).replace(/-/g, "");
  return normalized.slice(0, 10).toLocaleUpperCase("en-US");
}

function buildCaseModelSkuToken(model: string) {
  const normalized = sanitizeSlug(model)
    .replace(/^iphone-?/i, "")
    .split("-")
    .filter(Boolean);

  if (normalized.length === 0) {
    return abbreviateToken(model);
  }

  const [series, ...rest] = normalized;
  const suffix = rest
    .map((token) => {
      if (token === "pro") return "PRO";
      if (token === "max") return "MAX";
      if (token === "plus") return "PLUS";
      if (token === "air") return "AIR";
      return token.slice(0, 4).toLocaleUpperCase("en-US");
    })
    .join("");

  return `IP${series.toLocaleUpperCase("en-US")}${suffix}`;
}

export function buildCaseVariantSku(input: { brand?: string | null; productName: string; model: string; color: string }) {
  const segments = [
    input.brand ? abbreviateToken(input.brand) : null,
    abbreviateToken(input.productName),
    buildCaseModelSkuToken(input.model),
    abbreviateToken(input.color),
  ].filter(Boolean);

  return segments.join("-") || `KILIF-${buildCaseModelSkuToken(input.model)}-${abbreviateToken(input.color)}`;
}

export function getCaseCompatibilityValue(attributes: Record<string, string> | null | undefined) {
  return attributes?.uyumluluk || attributes?.compatibility || "";
}
