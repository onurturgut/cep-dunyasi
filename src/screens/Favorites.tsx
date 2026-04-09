"use client";

import { Layout } from "@/components/layout/Layout";
import { FavoritesSection } from "@/components/account/FavoritesSection";
import { useI18n } from "@/i18n/provider";

export default function Favorites() {
  const { locale } = useI18n();
  const copy =
    locale === "en"
      ? {
          title: "My Favorites",
          description: "Track the products you liked from this area.",
          savedProducts: "Saved Products",
        }
      : {
          title: "Favorilerim",
          description: "Beğendiğiniz ürünleri buradan takip edebilirsiniz.",
          savedProducts: "Kaydettiğin Ürünler",
        };

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>

        <FavoritesSection className="mt-8" title={copy.savedProducts} />
      </div>
    </Layout>
  );
}

