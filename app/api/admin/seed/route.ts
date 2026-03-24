import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest, isAdmin } from "@/server/auth-session";
import { ensureSeedData } from "@/server/seed";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ data: null, error: { message: "Bu islem icin admin yetkisi gerekiyor" } }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(getSessionUserFromRequest(request))) {
      return forbidden();
    }

    await connectToDatabase();
    await ensureSeedData();

    return NextResponse.json({ data: { seeded: true }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed islemi tamamlanamadi";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
