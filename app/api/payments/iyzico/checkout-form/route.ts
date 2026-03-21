import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { Order, OrderItem } from "@/server/models";
import { createIyzicoClient, initializeCheckoutForm } from "@/server/services/iyzico";

export const runtime = "nodejs";

type RequestBody = {
  orderId: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.orderId) {
      return NextResponse.json({ error: { message: "Ödeme isteği eksik" } }, { status: 400 });
    }

    await connectToDatabase();

    const order = await Order.findOne({ id: body.orderId }).lean();
    const orderItems = await OrderItem.find({ order_id: body.orderId }).lean();

    if (!order) {
      return NextResponse.json({ error: { message: "Sipariş bulunamadı" } }, { status: 404 });
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ error: { message: "Sipariş kalemleri bulunamadı" } }, { status: 400 });
    }

    if (!order.shipping_address?.fullName || !order.shipping_address?.email) {
      return NextResponse.json({ error: { message: "Sipariş bilgileri eksik" } }, { status: 400 });
    }

    const fullName = `${order.shipping_address.fullName}`.trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const iyzipay = createIyzicoClient();

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const callbackUrl = `${origin}/api/payments/iyzico/callback`;

    const checkoutPayload = {
      locale: "tr",
      conversationId: order.id,
      price: Number(order.final_price).toFixed(2),
      paidPrice: Number(order.final_price).toFixed(2),
      currency: "TRY",
      basketId: order.id,
      paymentGroup: "PRODUCT",
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: order.user_id || order.id,
        name: nameParts[0] || "Müşteri",
        surname: nameParts.slice(1).join(" ") || "Müşteri",
        email: `${order.shipping_address.email}`,
        gsmNumber: `${order.shipping_address.phone || "+905550000000"}`,
        registrationAddress: `${order.shipping_address.address || ""}`,
        city: `${order.shipping_address.city || ""}`,
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: {
        contactName: fullName,
        city: `${order.shipping_address.city || ""}`,
        country: "Turkey",
        address: `${order.shipping_address.address || ""}`,
        zipCode: "34000",
      },
      billingAddress: {
        contactName: fullName,
        city: `${order.shipping_address.city || ""}`,
        country: "Turkey",
        address: `${order.shipping_address.address || ""}`,
        zipCode: "34000",
      },
      basketItems: orderItems.map((item: any) => ({
        id: item.variant_id,
        name: item.product_name,
        category1: "Elektronik",
        itemType: "PHYSICAL",
        price: Number((item.unit_price || 0) * (item.quantity || 0)).toFixed(2),
      })),
    };

    const result = await initializeCheckoutForm(iyzipay, checkoutPayload);

    if (result?.status !== "success") {
      return NextResponse.json(
        { error: { message: result?.errorMessage || "iyzico ödeme başlatılamadı" } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      token: result.token,
      checkoutFormContent: result.checkoutFormContent,
      paymentPageUrl: result.paymentPageUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "iyzico ödeme hatası";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
