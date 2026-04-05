"use client";

import { AlertCircle } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useAccountProfile } from "@/hooks/use-account";

export default function AccountProfileScreen() {
  const profileQuery = useAccountProfile();

  return (
    <AccountLayout title="Profil Bilgileri" description="Kisisel bilgilerinizi, iletisim tercihlerinizi ve profil görselinizi bu alandan guncelleyebilirsiniz.">
      {profileQuery.isLoading ? (
        <AccountSectionSkeleton cards={2} rows={4} />
      ) : profileQuery.error ? (
        <AccountEmptyState
          icon={AlertCircle}
          title="Profil yuklenemedi"
          description={profileQuery.error instanceof Error ? profileQuery.error.message : "Profil bilgileri getirilemiyor."}
        />
      ) : profileQuery.data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Sadakat Puani</p>
                <p className="mt-3 font-display text-3xl font-semibold">{profileQuery.data.profile.loyalty_points_balance ?? 0}</p>
                <p className="mt-2 text-sm text-muted-foreground">Biriken puanlarin checkout kullanimina hazir. Kullanim kurallari marketing ayarlarindan yonetilir.</p>
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Referans Kodun</p>
                <p className="mt-3 font-display text-2xl font-semibold">{profileQuery.data.profile.referral_code || "-"}</p>
                <p className="mt-2 text-sm text-muted-foreground">Bu kodu paylasarak yeni kullanicilar getirdiginde odul puani kazanabilecek altyapi hazir durumda.</p>
              </CardContent>
            </Card>
          </div>
          <AccountProfileForm profile={profileQuery.data.profile} />
        </div>
      ) : null}
    </AccountLayout>
  );
}

