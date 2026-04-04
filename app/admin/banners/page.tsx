import { Suspense } from "react";
import AdminBannersScreen from "@/screens/admin/AdminBanners";

export default function AdminBannersPage() {
  return (
    <Suspense fallback={null}>
      <AdminBannersScreen />
    </Suspense>
  );
}
