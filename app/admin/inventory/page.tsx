import { Suspense } from "react";
import AdminInventoryScreen from "@/screens/admin/AdminInventory";

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={null}>
      <AdminInventoryScreen />
    </Suspense>
  );
}
