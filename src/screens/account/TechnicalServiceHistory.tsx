"use client";

import { Button } from "@/components/ui/button";
import { AccountLayout } from "@/components/account/AccountLayout";
import { TechnicalServiceHistoryList } from "@/components/account/TechnicalServiceHistoryList";
import { useMyTechnicalServiceRequests } from "@/hooks/use-account";
import { useNavigate } from "@/lib/router";

export default function AccountTechnicalServiceHistoryScreen() {
  const navigate = useNavigate();
  const technicalServiceQuery = useMyTechnicalServiceRequests();

  return (
    <AccountLayout
      title="Teknik Servis Gecmisim"
      description="Basvurularinizin durumlarini, servis notlarini ve onceki kayitlarinizi buradan takip edin."
      actions={
        <Button type="button" onClick={() => navigate("/technical-service")}>
          Yeni Basvuru
        </Button>
      }
    >
      <TechnicalServiceHistoryList
        requests={technicalServiceQuery.data ?? []}
        isLoading={technicalServiceQuery.isLoading}
        error={technicalServiceQuery.error instanceof Error ? technicalServiceQuery.error.message : null}
      />
    </AccountLayout>
  );
}
