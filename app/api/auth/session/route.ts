import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { createRequestTimer } from "@/server/observability/request-timing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const timer = createRequestTimer("GET /api/auth/session");
  const user = getSessionUserFromRequest(request);
  timer.mark("resolve-session");

  const response = NextResponse.json({ session: user ? { user } : null }, { headers: timer.headers() });
  timer.log({ authenticated: Boolean(user) });
  return response;
}
