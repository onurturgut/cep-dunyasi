import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/AppProviders";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cep Dünyası",
  description: "Cep Dünyası e-ticaret uygulaması",
  icons: {
    icon: "/images/home-icon.png",
    shortcut: "/images/home-icon.png",
    apple: "/images/home-icon.png",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html lang={initialLocale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <AppProviders initialLocale={initialLocale}>{children}</AppProviders>
      </body>
    </html>
  );
}
