import { Suspense } from "react";
import AdminTechnicalServiceScreen from "@/screens/admin/AdminTechnicalService";

export default function AdminTechnicalServicePage() {
  return (
    <Suspense fallback={null}>
      <AdminTechnicalServiceScreen />
    </Suspense>
  );
}
