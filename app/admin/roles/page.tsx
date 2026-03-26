import { Suspense } from "react";
import AdminRolesScreen from "@/screens/admin/AdminRoles";

export default function AdminRolesPage() {
  return (
    <Suspense fallback={null}>
      <AdminRolesScreen />
    </Suspense>
  );
}
