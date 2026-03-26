import { Suspense } from "react";
import AdminImportExportScreen from "@/screens/admin/AdminImportExport";

export default function AdminImportExportPage() {
  return (
    <Suspense fallback={null}>
      <AdminImportExportScreen />
    </Suspense>
  );
}
