import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { setSessionCookie } from "@/server/auth-session";
import { getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { getAccountProfile, sanitizeSessionPayload, updateAccountProfile } from "@/server/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const result = await getAccountProfile(getAccountSessionUser(request));
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Profil getirilemedi");
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const sessionUser = getAccountSessionUser(request);
    const result = await updateAccountProfile(await request.json(), sessionUser);
    const response = NextResponse.json({ data: result, error: null });
    setSessionCookie(
      response,
      sanitizeSessionPayload({ ...result.profile }, sessionUser?.roles, sessionUser?.permissions),
    );
    return response;
  } catch (error) {
    return handleAccountRouteError(error, "Profil guncellenemedi");
  }
}
