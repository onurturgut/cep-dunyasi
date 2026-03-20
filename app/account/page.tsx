import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AccountScreen from "@/screens/Account";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/server/auth-session";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token || !verifySessionToken(token)) {
    redirect("/auth");
  }

  return (
    <Suspense fallback={null}>
      <AccountScreen />
    </Suspense>
  );
}
