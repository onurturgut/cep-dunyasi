"use client";

import { Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/account/OrderCard";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import type { MyOrderSummary } from "@/lib/account";

type OrdersListProps = {
  orders: MyOrderSummary[];
  page: number;
  totalPages: number;
  isLoading?: boolean;
  error?: string | null;
  onPageChange?: (page: number) => void;
};

export function OrdersList({ orders, page, totalPages, isLoading, error, onPageChange }: OrdersListProps) {
  if (isLoading) {
    return <AccountSectionSkeleton cards={2} rows={3} />;
  }

  if (error) {
    return <AccountEmptyState icon={Package2} title="Siparisler yuklenemedi" description={error} />;
  }

  if (orders.length === 0) {
    return (
      <AccountEmptyState
        icon={Package2}
        title="Henuz siparisiniz yok"
        description="Verdiginiz siparisler burada listelenecek. Ilk siparisinizden sonra kargo durumu ve siparis detaylarini bu alandan takip edebilirsiniz."
      />
    );
  }

  return (
    <div className="space-y-5">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-[1.5rem] border border-border/70 bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
              Onceki
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
              Sonraki
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
