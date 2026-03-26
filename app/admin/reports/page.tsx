import { Suspense } from "react";
import AdminReportsScreen from "@/screens/admin/AdminReports";

export default function AdminReportsPage() {
  return (
    <Suspense fallback={null}>
      <AdminReportsScreen />
    </Suspense>
  );
}
