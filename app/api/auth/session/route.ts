import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/server/auth-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request);
  return NextResponse.json({ session: user ? { user } : null });
}

