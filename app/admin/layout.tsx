export const dynamic = "force-dynamic";

import AdminDashboard from "@/screens/admin/AdminDashboard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboard>{children}</AdminDashboard>;
}
