import { Suspense } from "react";
import AdminMissionScreen from "@/screens/admin/AdminMission";

export default function AdminMissionPage() {
  return (
    <Suspense fallback={null}>
      <AdminMissionScreen />
    </Suspense>
  );
}
