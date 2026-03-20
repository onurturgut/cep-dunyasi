import { Suspense } from "react";
import AdminOrdersScreen from "@/screens/admin/AdminOrders";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersScreen />
    </Suspense>
  );
}
