import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { createRequestTimer } from "@/server/observability/request-timing";
import { getActiveCampaigns } from "@/server/services/campaigns";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const timer = createRequestTimer("GET /api/campaigns");
  try {
    await connectToDatabase();
    timer.mark("db-connect");
    const data = await getActiveCampaigns();
    timer.mark("query-campaigns");

    const response = NextResponse.json(
      { data, error: null },
      {
        headers: timer.headers({
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        }),
      },
    );

    timer.log({ count: Array.isArray(data) ? data.length : 0 });
    return response;
  } catch (error) {
    timer.mark("error");
    const message = error instanceof Error ? error.message : "Kampanyalar getirilemedi";
    const response = NextResponse.json({ data: [], error: { message } }, { status: 400, headers: timer.headers() });
    timer.log({ error: message });
    return response;
  }
}
