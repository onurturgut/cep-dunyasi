"use client";

import { AlertCircle } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { useAccountProfile } from "@/hooks/use-account";

export default function AccountProfileScreen() {
  const profileQuery = useAccountProfile();

  return (
    <AccountLayout title="Profil Bilgileri" description="Kisisel bilgilerinizi, iletisim tercihlerinizi ve profil gorselinizi bu alandan guncelleyebilirsiniz.">
      {profileQuery.isLoading ? (
        <AccountSectionSkeleton cards={2} rows={4} />
      ) : profileQuery.error ? (
        <AccountEmptyState
          icon={AlertCircle}
          title="Profil yuklenemedi"
          description={profileQuery.error instanceof Error ? profileQuery.error.message : "Profil bilgileri getirilemiyor."}
        />
      ) : profileQuery.data ? (
        <AccountProfileForm profile={profileQuery.data.profile} />
      ) : null}
    </AccountLayout>
  );
}
