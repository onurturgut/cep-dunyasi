import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { resolveReferralCode } from "@/server/services/marketing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") ?? "";
    const data = await resolveReferralCode({ referralCode: code });
    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz referans kodu" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Referans kodu cozumlenemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
