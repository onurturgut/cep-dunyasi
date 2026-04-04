import { NextResponse } from "next/server";
import { getCheckoutPaymentMethods } from "@/server/services/checkout";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ data: getCheckoutPaymentMethods(), error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ödeme yöntemleri alınamadı";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
