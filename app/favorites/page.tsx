import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/server/auth-session";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token || !verifySessionToken(token)) {
    redirect("/auth");
  }

  redirect("/account/favorites");
}
