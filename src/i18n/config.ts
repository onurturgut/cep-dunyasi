export const supportedLocales = ["tr", "en"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const LOCALE_COOKIE_NAME = "site-locale";
export const LOCALE_STORAGE_KEY = "site-locale";
export const DEFAULT_LOCALE: AppLocale = "tr";

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && supportedLocales.includes(value as AppLocale);
}

export function resolveLocale(value: unknown): AppLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function getIntlLocale(locale: AppLocale) {
  return locale === "en" ? "en-US" : "tr-TR";
}

export function getRuntimeLocale(preferred?: string | null): AppLocale {
  if (isSupportedLocale(preferred)) {
    return preferred;
  }

  if (typeof document !== "undefined") {
    return resolveLocale(document.documentElement.lang);
  }

  return DEFAULT_LOCALE;
}
