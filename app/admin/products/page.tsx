import { Suspense } from "react";
import AdminProductsScreen from "@/screens/admin/AdminProducts";

export default function AdminProductsPage() {
  return (
    <Suspense fallback={null}>
      <AdminProductsScreen />
    </Suspense>
  );
}
