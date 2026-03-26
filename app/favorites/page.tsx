import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FavoritesScreen from "@/screens/Favorites";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/server/auth-session";

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token || !verifySessionToken(token)) {
    redirect("/auth");
  }

  return (
    <Suspense fallback={null}>
      <FavoritesScreen />
    </Suspense>
  );
}
