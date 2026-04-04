import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { finalizeIyzicoPayment } from "@/server/services/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");

  const fallbackBase = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const failedRedirect = new URL("/checkout/result", fallbackBase);
  failedRedirect.searchParams.set("payment", "failed");

  try {
    if (!token) {
      return NextResponse.redirect(failedRedirect);
    }

    await connectToDatabase();

    const { order, paymentStatus } = await finalizeIyzicoPayment(token);
    const redirectUrl = new URL("/checkout/result", fallbackBase);

    if (order?.id) {
      redirectUrl.searchParams.set("orderId", order.id);
    }
    redirectUrl.searchParams.set("payment", paymentStatus === "paid" ? "success" : "failed");

    if (order?.guest_token) {
      redirectUrl.searchParams.set("retryToken", order.guest_token);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Iyzico callback failed:", error);
    return NextResponse.redirect(failedRedirect);
  }
}
