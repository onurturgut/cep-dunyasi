"use client";

import { Wrench } from "lucide-react";
import type { TechnicalServiceHistoryItem } from "@/lib/account";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { TechnicalServiceRequestCard } from "@/components/account/TechnicalServiceRequestCard";

type TechnicalServiceHistoryListProps = {
  requests: TechnicalServiceHistoryItem[];
  isLoading?: boolean;
  error?: string | null;
};

export function TechnicalServiceHistoryList({ requests, isLoading, error }: TechnicalServiceHistoryListProps) {
  if (isLoading) {
    return <AccountSectionSkeleton cards={2} rows={3} />;
  }

  if (error) {
    return <AccountEmptyState icon={Wrench} title="Servis geçmişi yüklenemedi" description={error} />;
  }

  if (requests.length === 0) {
    return (
      <AccountEmptyState
        icon={Wrench}
        title="Henüz teknik servis kaydınız yok"
        description="Oluşturduğunuz teknik servis başvuruları ve durum güncellemeleri burada listelenecek."
      />
    );
  }

  return (
    <div className="space-y-5">
      {requests.map((request) => (
        <TechnicalServiceRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}
