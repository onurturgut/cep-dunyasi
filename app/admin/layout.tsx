import type { ReactNode } from "react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "@/screens/admin/AdminDashboard";
import { AUTH_COOKIE_NAME, isAdmin, verifySessionToken } from "@/server/auth-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? verifySessionToken(token) : null;

  if (!isAdmin(user)) {
    redirect("/auth");
  }

  return <AdminDashboard><Suspense fallback={null}>{children}</Suspense></AdminDashboard>;
}
