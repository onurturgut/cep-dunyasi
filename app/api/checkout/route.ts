import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { connectToDatabase } from "@/server/mongodb";
import { createCheckoutSession, type CheckoutRequestBody } from "@/server/services/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<CheckoutRequestBody, "origin">;
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    await connectToDatabase();

    const result = await createCheckoutSession(
      {
        ...body,
        origin,
      },
      getSessionUserFromRequest(request)
    );

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ödeme başlatılamadı";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
