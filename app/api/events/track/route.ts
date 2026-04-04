import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { connectToDatabase } from "@/server/mongodb";
import { trackMarketingEvent } from "@/server/services/marketing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const forwardedFor = request.headers.get("x-forwarded-for");
    const data = await trackMarketingEvent(await request.json(), getSessionUserFromRequest(request), forwardedFor);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz event istegi" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Event kaydi tamamlanamadi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
