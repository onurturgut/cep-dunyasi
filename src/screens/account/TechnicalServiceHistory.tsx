"use client";

import { Button } from "@/components/ui/button";
import { AccountLayout } from "@/components/account/AccountLayout";
import { TechnicalServiceHistoryList } from "@/components/account/TechnicalServiceHistoryList";
import { useMyTechnicalServiceRequests } from "@/hooks/use-account";
import { useI18n } from "@/i18n/provider";
import { useNavigate } from "@/lib/router";

export default function AccountTechnicalServiceHistoryScreen() {
  const navigate = useNavigate();
  const technicalServiceQuery = useMyTechnicalServiceRequests();
  const { messages } = useI18n();
  const technicalServiceMessages = messages.account.technicalService;

  return (
    <AccountLayout
      title={technicalServiceMessages.title}
      description={technicalServiceMessages.description}
      actions={
        <Button type="button" onClick={() => navigate("/technical-service")}>
          {technicalServiceMessages.newRequest}
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
