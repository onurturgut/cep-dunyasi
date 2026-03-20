import { Suspense } from "react";
import AdminCouponsScreen from "@/screens/admin/AdminCoupons";

export default function AdminCouponsPage() {
  return (
    <Suspense fallback={null}>
      <AdminCouponsScreen />
    </Suspense>
  );
}
