import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { listFeaturedHomepageReviews } from "@/server/services/marketing";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    await connectToDatabase();
    const data = await listFeaturedHomepageReviews(6);
    return NextResponse.json(
      { data, error: null },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "One cikan yorumlar getirilemedi";
    return NextResponse.json({ data: [], error: { message } }, { status: 400 });
  }
}
