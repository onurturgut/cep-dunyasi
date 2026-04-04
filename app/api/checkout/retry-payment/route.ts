import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { retryCheckoutPayment } from "@/server/services/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId: string;
      retryToken?: string;
      paymentMethod?: "credit_card_3ds" | "bank_transfer" | "cash_on_delivery" | "pay_at_store";
      installmentMonths?: number;
    };

    await connectToDatabase();

    const data = await retryCheckoutPayment(
      {
        orderId: body.orderId,
        retryToken: body.retryToken,
        paymentMethod: body.paymentMethod ?? "credit_card_3ds",
        installmentMonths: body.installmentMonths ?? 1,
      },
      getSessionUserFromRequest(request),
    );

    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ödeme tekrar başlatılamadı";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
