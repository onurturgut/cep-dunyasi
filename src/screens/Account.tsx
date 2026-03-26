"use client";

import { AlertCircle } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AccountOverview } from "@/components/account/AccountOverview";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { useAccountProfile, useMyOrders, useMyTechnicalServiceRequests } from "@/hooks/use-account";

export default function Account() {
  const profileQuery = useAccountProfile();
  const ordersQuery = useMyOrders(1, 5);
  const technicalServiceQuery = useMyTechnicalServiceRequests();

  return (
    <AccountLayout
      title="Hesabim"
      description="Siparislerinizi, favorilerinizi, teknik servis sureclerinizi ve hesap bilgilerinizi tek bir merkezden yonetin."
    >
      {profileQuery.isLoading ? (
        <AccountSectionSkeleton cards={2} rows={4} />
      ) : profileQuery.error ? (
        <AccountEmptyState
          icon={AlertCircle}
          title="Hesap bilgileri yuklenemedi"
          description={profileQuery.error instanceof Error ? profileQuery.error.message : "Hesap bilgileri su anda getirilemiyor."}
        />
      ) : profileQuery.data ? (
        <AccountOverview
          profile={profileQuery.data.profile}
          stats={profileQuery.data.stats}
          latestOrder={ordersQuery.data?.items?.[0] ?? null}
          latestTechnicalService={technicalServiceQuery.data?.[0] ?? null}
        />
      ) : null}
    </AccountLayout>
  );
}
