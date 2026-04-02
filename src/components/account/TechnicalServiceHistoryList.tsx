"use client";

import { Wrench } from "lucide-react";
import type { TechnicalServiceHistoryItem } from "@/lib/account";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { TechnicalServiceRequestCard } from "@/components/account/TechnicalServiceRequestCard";
import { useI18n } from "@/i18n/provider";

type TechnicalServiceHistoryListProps = {
  requests: TechnicalServiceHistoryItem[];
  isLoading?: boolean;
  error?: string | null;
};

export function TechnicalServiceHistoryList({ requests, isLoading, error }: TechnicalServiceHistoryListProps) {
  const { messages } = useI18n();
  const technicalServiceMessages = messages.account.technicalService;

  if (isLoading) {
    return <AccountSectionSkeleton cards={3} rows={2} />;
  }

  if (error) {
    return <AccountEmptyState icon={Wrench} title={technicalServiceMessages.loadError} description={error} />;
  }

  if (requests.length === 0) {
    return (
      <AccountEmptyState
        icon={Wrench}
        title={technicalServiceMessages.emptyTitle}
        description={technicalServiceMessages.emptyDescription}
      />
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {requests.map((request) => (
        <TechnicalServiceRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}
