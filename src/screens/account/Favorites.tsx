"use client";

import { AccountLayout } from "@/components/account/AccountLayout";
import { FavoritesGrid } from "@/components/account/FavoritesGrid";
import { useMyFavorites } from "@/hooks/use-account";

export default function AccountFavoritesScreen() {
  const favoritesQuery = useMyFavorites();

  return (
    <AccountLayout title="Favorilerim" description="Kaydettiginiz urunleri tek ekranda gorun, stok ve fiyat degisimlerini daha hizli takip edin.">
      <FavoritesGrid
        products={favoritesQuery.data?.products ?? []}
        isLoading={favoritesQuery.isLoading}
        error={favoritesQuery.error instanceof Error ? favoritesQuery.error.message : null}
      />
    </AccountLayout>
  );
}
