import type { AppLocale } from "@/i18n/config";

const categoryLabels = {
  tr: {
    telefon: "Telefonlar",
    "ikinci-el-telefon": "2. El Telefonlar",
    "akilli-saatler": "Saatler",
    kilif: "Kiliflar",
    "sarj-aleti": "Sarj Aleti",
    "power-bank": "Power Bank",
    "teknik-servis": "Teknik Servis",
  },
  en: {
    telefon: "Phones",
    "ikinci-el-telefon": "Second-Hand Phones",
    "akilli-saatler": "Watches",
    kilif: "Cases",
    "sarj-aleti": "Chargers",
    "power-bank": "Power Banks",
    "teknik-servis": "Technical Service",
  },
} as const;

export function getLocalizedCategoryLabel(locale: AppLocale, slug?: string | null, fallback?: string | null) {
  if (!slug) {
    return fallback || "";
  }

  return categoryLabels[locale][slug as keyof (typeof categoryLabels)[typeof locale]] || fallback || slug;
}
