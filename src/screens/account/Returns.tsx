"use client";

import { RotateCcw } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { ReturnRequestCard } from "@/components/account/ReturnRequestCard";
import { useMyReturnRequests } from "@/hooks/use-account";

export default function AccountReturnsScreen() {
  const returnsQuery = useMyReturnRequests();

  return (
    <AccountLayout title="Iade / Degisim Taleplerim" description="Olusturdugunuz iade ve degisim taleplerinin durumunu bu alandan takip edebilirsiniz.">
      {returnsQuery.isLoading ? (
        <AccountSectionSkeleton cards={2} rows={3} />
      ) : returnsQuery.error ? (
        <AccountEmptyState
          icon={RotateCcw}
          title="Talepler yuklenemedi"
          description={returnsQuery.error instanceof Error ? returnsQuery.error.message : "Talepler su anda getirilemiyor."}
        />
      ) : (returnsQuery.data?.length ?? 0) === 0 ? (
        <AccountEmptyState
          icon={RotateCcw}
          title="Henuz iade veya degisim talebiniz yok"
          description="Teslim edilmis siparislerinizde uygun urunler icin siparis detay ekranindan talep olusturabilirsiniz."
        />
      ) : (
        <div className="space-y-5">
          {returnsQuery.data?.map((request) => (
            <ReturnRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
