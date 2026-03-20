import { Suspense } from "react";
import AdminOverviewScreen from "@/screens/admin/AdminOverview";

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={null}>
      <AdminOverviewScreen />
    </Suspense>
  );
}
