import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getShippingConfig } from "@/server/services/site-config";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const data = await getShippingConfig();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kargo bilgisi yuklenemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
