"use client";

import { FavoritesGrid } from "@/components/account/FavoritesGrid";
import { Layout } from "@/components/layout/Layout";
import { useMyFavorites } from "@/hooks/use-account";

export default function AccountFavoritesScreen() {
  const favoritesQuery = useMyFavorites();

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <FavoritesGrid
          products={favoritesQuery.data?.products ?? []}
          isLoading={favoritesQuery.isLoading}
          error={favoritesQuery.error instanceof Error ? favoritesQuery.error.message : null}
        />
      </div>
    </Layout>
  );
}
