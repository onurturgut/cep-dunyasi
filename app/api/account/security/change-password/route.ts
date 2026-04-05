import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { setSessionCookie } from "@/server/auth-session";
import { getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { changePassword, getAccountProfile, sanitizeSessionPayload } from "@/server/services/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const sessionUser = getAccountSessionUser(request);
    const data = await changePassword(await request.json(), sessionUser);
    const { profile } = await getAccountProfile(sessionUser);
    const response = NextResponse.json({ data, error: null });
    setSessionCookie(response, sanitizeSessionPayload({ ...profile }, sessionUser?.roles));
    return response;
  } catch (error) {
    return handleAccountRouteError(error, "Şifre degistirilemedi");
  }
}

