"use client";

import { useState } from "react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { OrdersList } from "@/components/account/OrdersList";
import { useMyOrders } from "@/hooks/use-account";

export default function AccountOrdersScreen() {
  const [page, setPage] = useState(1);
  const ordersQuery = useMyOrders(page, 10);

  return (
    <AccountLayout title="Siparişlerim" description="Verdiğiniz tüm siparişleri, ödeme durumlarını ve kargo süreçlerini buradan takip edebilirsiniz.">
      <OrdersList
        orders={ordersQuery.data?.items ?? []}
        page={ordersQuery.data?.page ?? page}
        totalPages={ordersQuery.data?.totalPages ?? 1}
        isLoading={ordersQuery.isLoading}
        error={ordersQuery.error instanceof Error ? ordersQuery.error.message : null}
        onPageChange={setPage}
      />
    </AccountLayout>
  );
}
