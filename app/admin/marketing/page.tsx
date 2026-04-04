import { Suspense } from "react";
import AdminMarketingScreen from "@/screens/admin/AdminMarketing";

export default function AdminMarketingPage() {
  return (
    <Suspense fallback={null}>
      <AdminMarketingScreen />
    </Suspense>
  );
}
