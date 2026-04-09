import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { connectToDatabase } from "@/server/mongodb";
import { getUserMarketingSummary } from "@/server/services/marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const sessionUser = getSessionUserFromRequest(request);
    if (!sessionUser?.id) {
      throw new Error("Bu işlem için giriş yapmanız gerekiyor");
    }

    const data = await getUserMarketingSummary(sessionUser.id);
    return NextResponse.json({ data, error: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketing özeti getirilemedi";
    const status = message.toLocaleLowerCase("tr-TR").includes("giriş yapmanız gerekiyor") ? 401 : 400;
    return NextResponse.json({ data: null, error: { message } }, { status });
  }
}
