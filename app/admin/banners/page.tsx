import { Suspense } from "react";
import AdminCampaignsScreen from "@/screens/admin/AdminCampaigns";

export default function AdminBannersPage() {
  return (
    <Suspense fallback={null}>
      <AdminCampaignsScreen />
    </Suspense>
  );
}
