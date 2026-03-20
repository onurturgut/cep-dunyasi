import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { Coupon, Order, OrderItem, ProductVariant } from "@/server/models";
import { createIyzicoClient, retrieveCheckoutForm } from "@/server/services/iyzico";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");

  const fallbackBase = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectFail = new URL("/account?payment=failed", fallbackBase);

  try {
    if (!token) {
      return NextResponse.redirect(redirectFail);
    }

    const iyzipay = createIyzicoClient();
    const result = await retrieveCheckoutForm(iyzipay, token);

    const orderId = result?.conversationId;

    if (orderId) {
      await connectToDatabase();
      const existingOrder = await Order.findOne({ id: orderId }).lean();
      const callbackSucceeded = result?.paymentStatus === "SUCCESS";
      const paymentStatus =
        existingOrder?.payment_status === "paid" ? "paid" : callbackSucceeded ? "paid" : "failed";
      const orderStatus =
        paymentStatus === "paid"
          ? existingOrder?.order_status && existingOrder.order_status !== "pending"
            ? existingOrder.order_status
            : "confirmed"
          : "pending";

      if (existingOrder && callbackSucceeded && existingOrder.payment_status !== "paid") {
        const orderItems = await OrderItem.find({ order_id: orderId }).lean();

        if (orderItems.length > 0) {
          await ProductVariant.bulkWrite(
            orderItems.map((item: any) => ({
              updateOne: {
                filter: { id: item.variant_id },
                update: {
                  $inc: { stock: -Number(item.quantity ?? 0) },
                  $set: { updated_at: new Date() },
                },
              },
            })),
            { ordered: false }
          );
        }

        if (existingOrder.coupon_id) {
          await Coupon.updateOne({ id: existingOrder.coupon_id }, { $inc: { usage_count: 1 } });
        }
      }

      await Order.updateOne(
        { id: orderId },
        {
          $set: {
            payment_status: paymentStatus,
            payment_id: result?.paymentId ?? null,
            order_status: orderStatus,
            updated_at: new Date(),
          },
        }
      );
    }

    const redirectSuccess = new URL(
      result?.paymentStatus === "SUCCESS" ? "/account?payment=success" : "/account?payment=failed",
      fallbackBase
    );

    return NextResponse.redirect(redirectSuccess);
  } catch {
    return NextResponse.redirect(redirectFail);
  }
}
