import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { connectToDatabase } from "@/server/mongodb";
import { registerReferralForUser } from "@/server/services/marketing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { referralCode } = (await request.json()) as { referralCode?: string };
    const data = await registerReferralForUser(referralCode ?? "", getSessionUserFromRequest(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz referans kodu" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Referans baglantisi kurulamadi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
