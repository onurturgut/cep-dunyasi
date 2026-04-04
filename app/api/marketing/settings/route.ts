import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { connectToDatabase } from "@/server/mongodb";
import { getMarketingSettings, listActivePopupCampaigns } from "@/server/services/marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("pathname");
    const [settings, popups] = await Promise.all([
      getMarketingSettings(),
      listActivePopupCampaigns({ pathname, sessionUser: getSessionUserFromRequest(request) }),
    ]);

    return NextResponse.json({ data: { settings, popups }, error: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketing ayarlari getirilemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
