import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { getOrderPaymentStatus } from "@/server/services/checkout";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    await connectToDatabase();
    const { orderId } = await context.params;
    const { searchParams } = new URL(request.url);
    const retryToken = searchParams.get("retryToken");
    const data = await getOrderPaymentStatus(orderId, getSessionUserFromRequest(request), retryToken);

    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ödeme durumu alınamadı";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
