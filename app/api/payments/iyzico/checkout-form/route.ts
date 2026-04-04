import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { retryCheckoutPayment } from "@/server/services/checkout";

export const runtime = "nodejs";

type RequestBody = {
  orderId: string;
  retryToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.orderId) {
      return NextResponse.json({ error: { message: "Ödeme isteği eksik" } }, { status: 400 });
    }

    await connectToDatabase();

    const result = await retryCheckoutPayment(
      {
        orderId: body.orderId,
        retryToken: body.retryToken,
        paymentMethod: "credit_card_3ds",
        installmentMonths: 1,
      },
      getSessionUserFromRequest(request),
    );

    if (!result.paymentPageUrl) {
      return NextResponse.json(
        { error: { message: "iyzico ödeme formu hazırlanamadı" } },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: {
        paymentPageUrl: result.paymentPageUrl,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "iyzico ödeme hatası";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
