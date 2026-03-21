import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function formatCurrency(value: unknown) {
  return `TL ${toPriceNumber(value).toLocaleString("tr-TR")}`;
}
