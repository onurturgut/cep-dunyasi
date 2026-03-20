import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cep Dunyasi",
  description: "Cep Dunyasi e-ticaret uygulamasi",
  icons: {
    icon: "/images/home-icon.png",
    shortcut: "/images/home-icon.png",
    apple: "/images/home-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
