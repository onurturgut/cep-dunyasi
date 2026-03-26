import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { Coupon, Order, OrderItem, Product, ProductVariant } from "@/server/models";
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
      let orderStatus =
        paymentStatus === "paid"
          ? existingOrder?.order_status && existingOrder.order_status !== "pending"
            ? existingOrder.order_status
            : "confirmed"
          : "pending";

      if (existingOrder && callbackSucceeded && existingOrder.payment_status !== "paid") {
        const orderItems = (await OrderItem.find({ order_id: orderId }).lean()) as Array<{
          variant_id: string;
          quantity?: number;
        }>;

        if (orderItems.length > 0) {
          const variants = await ProductVariant.find(
            { id: { $in: orderItems.map((item: any) => item.variant_id) } },
            { id: 1, product_id: 1 }
          ).lean() as Array<{ id: string; product_id: string }>;
          const productIdByVariantId = new Map(variants.map((variant) => [variant.id, variant.product_id]));

          const stockResults = await Promise.all(
            orderItems.map((item) =>
              ProductVariant.updateOne(
                {
                  id: item.variant_id,
                  is_active: true,
                  stock: { $gte: Number(item.quantity ?? 0) },
                },
                {
                  $inc: { stock: -Number(item.quantity ?? 0) },
                  $set: { updated_at: new Date() },
                }
              )
            )
          );
          const stockAdjusted = stockResults.every((result) => (result.modifiedCount ?? 0) === 1);

          if (!stockAdjusted) {
            orderStatus = "cancelled";
          } else {
            const salesCountByProductId = new Map<string, number>();

            for (const item of orderItems) {
              const productId = productIdByVariantId.get(item.variant_id);
              if (!productId) {
                continue;
              }

              salesCountByProductId.set(productId, (salesCountByProductId.get(productId) ?? 0) + Number(item.quantity ?? 0));
            }

            await Promise.all(
              Array.from(salesCountByProductId.entries()).map(([productId, quantity]) =>
                Product.updateOne(
                  { id: productId },
                  {
                    $inc: { sales_count: quantity },
                    $set: { updated_at: new Date() },
                  }
                )
              )
            );
          }
        }

        if (existingOrder.coupon_id && orderStatus !== "cancelled") {
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
