import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getIntlLocale, getRuntimeLocale } from "@/i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toPriceNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = Number(value.replace(",", "."));
    return Number.isFinite(normalized) ? normalized : 0;
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as Record<string, unknown>;
    const nested =
      candidate.$numberDecimal ??
      candidate.$numberInt ??
      candidate.$numberLong ??
      candidate.value ??
      candidate.amount ??
      candidate.price;

    if (nested !== undefined) {
      return toPriceNumber(nested);
    }
  }

  return 0;
}

export function formatCurrency(value: unknown, locale?: string) {
  const resolvedLocale = getRuntimeLocale(locale);
  const formattedAmount = toPriceNumber(value).toLocaleString(getIntlLocale(resolvedLocale));

  return resolvedLocale === "en" ? `TRY ${formattedAmount}` : `TL ${formattedAmount}`;
}

const TURKISH_CHAR_MAP: Record<string, string> = {
  "\u00E7": "c",
  "\u011F": "g",
  "\u0131": "i",
  "\u00F6": "o",
  "\u015F": "s",
  "\u00FC": "u",
};

export function sanitizeSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[\u00E7\u011F\u0131\u00F6\u015F\u00FC]/g, (character) => TURKISH_CHAR_MAP[character] ?? character)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
