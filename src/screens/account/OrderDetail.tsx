"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountSectionSkeleton } from "@/components/account/AccountSectionSkeleton";
import { OrderDetailView } from "@/components/account/OrderDetailView";
import { ReturnRequestForm } from "@/components/account/ReturnRequestForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { canCreateReturnRequest } from "@/lib/account";
import { useMyOrderDetail } from "@/hooks/use-account";

type AccountOrderDetailScreenProps = {
  orderId: string;
};

export default function AccountOrderDetailScreen({ orderId }: AccountOrderDetailScreenProps) {
  const orderQuery = useMyOrderDetail(orderId);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const order = orderQuery.data ?? null;
  const eligibleItems = order
    ? order.items.filter((item) => !item.return_request_id)
    : [];
  const canRequestReturn = order ? canCreateReturnRequest(order.order_status, order.shipment?.status) : false;

  return (
    <AccountLayout title="Sipariş Detayı" description="Siparişinizin ürünlerini, ödeme özetini ve kargo takibini ayrıntılı olarak inceleyin.">
      {orderQuery.isLoading ? (
        <AccountSectionSkeleton cards={2} rows={4} />
      ) : orderQuery.error ? (
        <AccountEmptyState
          icon={AlertCircle}
          title="Sipariş detayına ulaşılamadı"
          description={orderQuery.error instanceof Error ? orderQuery.error.message : "Sipariş detayı getirilemiyor."}
        />
      ) : order ? (
        <>
          <OrderDetailView
            order={order}
            onCreateReturnRequest={canRequestReturn && eligibleItems.length > 0 ? (orderItemId) => setSelectedItemId(orderItemId) : undefined}
          />

          <Dialog open={Boolean(selectedItemId)} onOpenChange={(open) => (!open ? setSelectedItemId(null) : null)}>
            <DialogContent className="max-w-2xl rounded-[1.75rem]">
              <DialogHeader>
                <DialogTitle>İade / Değişim Talebi</DialogTitle>
                <DialogDescription>Talebiniz önce incelemeye alınacak, sonuç hesabınız üzerinden sizinle paylaşılacaktır.</DialogDescription>
              </DialogHeader>
              <ReturnRequestForm
                orderId={order.id}
                items={eligibleItems}
                initialOrderItemId={selectedItemId}
                onSuccess={() => setSelectedItemId(null)}
              />
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </AccountLayout>
  );
}
