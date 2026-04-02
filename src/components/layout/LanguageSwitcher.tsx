"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { supportedLocales, type AppLocale } from "@/i18n/config";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, messages } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1 text-xs shadow-sm backdrop-blur",
        className,
      )}
      aria-label={messages.common.language}
    >
      {supportedLocales.map((item) => {
        const localeOption = messages.common.locales[item];
        const active = locale === item;

        return (
          <button
            key={item}
            type="button"
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold transition-colors",
              active ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
            onClick={() => setLocale(item as AppLocale)}
            aria-pressed={active}
            title={localeOption.label}
          >
            {localeOption.short}
          </button>
        );
      })}
    </div>
  );
}
