import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getActiveCampaigns } from "@/server/services/campaigns";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    await connectToDatabase();
    const data = await getActiveCampaigns();

    return NextResponse.json(
      { data, error: null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kampanyalar getirilemedi";
    return NextResponse.json({ data: [], error: { message } }, { status: 400 });
  }
}
