"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY, resolveLocale, type AppLocale } from "@/i18n/config";
import { localeMessages, type LocaleMessages } from "@/i18n/messages";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  messages: LocaleMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  initialLocale?: AppLocale;
  children: React.ReactNode;
};

export function LocaleProvider({ initialLocale = DEFAULT_LOCALE, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedLocale = resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
    setLocaleState((currentLocale) => (storedLocale === currentLocale ? currentLocale : storedLocale));

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [hydrated, locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      messages: localeMessages[locale],
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useI18n must be used within a LocaleProvider");
  }

  return context;
}
