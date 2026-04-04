import { NextResponse } from "next/server";
import { getInstallmentPreview } from "@/server/services/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { amount: number; paymentMethod?: string };
    const data = getInstallmentPreview({
      amount: body.amount,
      paymentMethod: (body.paymentMethod as "credit_card_3ds" | "bank_transfer" | "cash_on_delivery" | "pay_at_store") ?? "credit_card_3ds",
    });

    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Taksit önizlemesi alınamadı";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
