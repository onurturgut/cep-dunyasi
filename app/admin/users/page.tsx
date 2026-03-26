import { Suspense } from "react";
import AdminUsersScreen from "@/screens/admin/AdminUsers";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersScreen />
    </Suspense>
  );
}
