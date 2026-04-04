import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { previewCoupon } from "@/server/services/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const data = await previewCoupon(body);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz kupon istegi" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Kupon bilgisi yuklenemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
