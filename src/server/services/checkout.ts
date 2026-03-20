import { randomUUID } from "node:crypto";
import { Coupon, Order, OrderItem, Product, ProductVariant } from "@/server/models";
import { createIyzicoClient, initializeCheckoutForm } from "@/server/services/iyzico";
import type { SessionUser } from "@/server/auth-session";

type CheckoutRequestItem = {
  variantId: string;
  quantity: number;
};

type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

type CouponLike = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order_amount?: number | null;
  usage_limit?: number | null;
  usage_count?: number | null;
  expires_at?: Date | string | null;
  is_active?: boolean;
};

type PreparedCheckoutItem = {
  variantId: string;
  quantity: number;
  unitPrice: number;
  linePrice: number;
  productName: string;
  variantInfo: string | null;
};

export type CheckoutRequestBody = {
  items: CheckoutRequestItem[];
  shippingAddress: ShippingAddress;
  couponCode?: string;
  origin: string;
};

export type CheckoutSessionResult = {
  orderId: string;
  paymentPageUrl: string;
  finalPrice: number;
};

function normalizeQuantity(value: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

export function normalizeCheckoutItems(items: CheckoutRequestItem[]) {
  const quantityByVariantId = new Map<string, number>();

  for (const item of items) {
    const variantId = `${item?.variantId ?? ""}`.trim();
    const quantity = normalizeQuantity(item?.quantity ?? 0);

    if (!variantId || quantity <= 0) {
      continue;
    }

    quantityByVariantId.set(variantId, (quantityByVariantId.get(variantId) ?? 0) + quantity);
  }

  return Array.from(quantityByVariantId.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}

export function calculateCouponDiscount(totalPrice: number, coupon: CouponLike | null) {
  if (!coupon) {
    return { discount: 0, error: null };
  }

  if (!coupon.is_active) {
    return { discount: 0, error: "Kupon aktif degil" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { discount: 0, error: "Kuponun suresi dolmus" };
  }

  if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
    return { discount: 0, error: "Kupon kullanim limiti dolmus" };
  }

  if (coupon.min_order_amount && totalPrice < coupon.min_order_amount) {
    return {
      discount: 0,
      error: `Minimum siparis tutari: TL ${coupon.min_order_amount.toLocaleString("tr-TR")}`,
    };
  }

  const rawDiscount = coupon.type === "percentage" ? (totalPrice * coupon.value) / 100 : coupon.value;
  return { discount: Math.min(Math.max(rawDiscount, 0), totalPrice), error: null };
}

function splitFullName(fullName: string) {
  const pieces = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    name: pieces[0] || "Musteri",
    surname: pieces.slice(1).join(" ") || "Musteri",
  };
}

function formatVariantInfo(attributes: Record<string, unknown> | null | undefined, fallbackSku: string) {
  if (!attributes) {
    return fallbackSku || null;
  }

  const values = Object.values(attributes)
    .map((value) => `${value ?? ""}`.trim())
    .filter(Boolean);

  if (values.length === 0) {
    return fallbackSku || null;
  }

  return values.join(" / ");
}

function validateShippingAddress(shippingAddress: ShippingAddress) {
  if (!shippingAddress.fullName.trim()) return "Ad soyad zorunludur";
  if (!shippingAddress.email.trim()) return "E-posta zorunludur";
  if (!shippingAddress.phone.trim()) return "Telefon zorunludur";
  if (!shippingAddress.address.trim()) return "Adres zorunludur";
  if (!shippingAddress.city.trim()) return "Sehir zorunludur";
  return null;
}

export async function createCheckoutSession(
  body: CheckoutRequestBody,
  sessionUser: SessionUser | null
): Promise<CheckoutSessionResult> {
  const shippingError = validateShippingAddress(body.shippingAddress);

  if (shippingError) {
    throw new Error(shippingError);
  }

  const normalizedItems = normalizeCheckoutItems(body.items);

  if (normalizedItems.length === 0) {
    throw new Error("Sepet bos");
  }

  const variantIds = normalizedItems.map((item) => item.variantId);
  const variants = await ProductVariant.find({ id: { $in: variantIds }, is_active: true }).lean();
  const variantsById = new Map<string, any>(variants.map((variant: any) => [variant.id, variant]));

  if (variants.length !== variantIds.length) {
    throw new Error("Sepetteki bazi varyantlar artik kullanilamiyor");
  }

  const productIds = Array.from(new Set(variants.map((variant: any) => variant.product_id)));
  const products = await Product.find({ id: { $in: productIds }, is_active: true }).lean();
  const productsById = new Map<string, any>(products.map((product: any) => [product.id, product]));

  const preparedItems: PreparedCheckoutItem[] = normalizedItems.map((item) => {
    const variant = variantsById.get(item.variantId);
    const product = variant ? productsById.get(variant.product_id) : null;

    if (!variant || !product) {
      throw new Error("Sepetteki bazi urunler artik satista degil");
    }

    if (variant.stock < item.quantity) {
      throw new Error(`${product.name} icin yeterli stok yok`);
    }

    const unitPrice = Number(variant.price ?? 0);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`${product.name} icin gecerli fiyat bulunamadi`);
    }

    return {
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice,
      linePrice: unitPrice * item.quantity,
      productName: product.name,
      variantInfo: formatVariantInfo(variant.attributes, variant.sku),
    };
  });

  const totalPrice = preparedItems.reduce((sum, item) => sum + item.linePrice, 0);
  const normalizedCouponCode = `${body.couponCode ?? ""}`.trim().toUpperCase();
  const coupon = normalizedCouponCode
    ? await Coupon.findOne({ code: normalizedCouponCode, is_active: true }).lean()
    : null;

  if (normalizedCouponCode && !coupon) {
    throw new Error("Gecersiz kupon kodu");
  }

  const { discount, error: couponError } = calculateCouponDiscount(totalPrice, coupon);

  if (couponError) {
    throw new Error(couponError);
  }

  const finalPrice = Math.max(totalPrice - discount, 0);

  if (finalPrice <= 0) {
    throw new Error("Odeme tutari sifirdan buyuk olmali");
  }

  const now = new Date();
  const order = await Order.create({
    user_id: sessionUser?.id ?? null,
    guest_token: sessionUser?.id ? null : randomUUID(),
    total_price: totalPrice,
    discount,
    shipping_price: 0,
    final_price: finalPrice,
    shipping_address: {
      fullName: body.shippingAddress.fullName.trim(),
      email: body.shippingAddress.email.trim(),
      phone: body.shippingAddress.phone.trim(),
      address: body.shippingAddress.address.trim(),
      city: body.shippingAddress.city.trim(),
    },
    coupon_id: coupon?.id ?? null,
    coupon_code: coupon?.code ?? null,
    payment_provider: "iyzico",
    payment_status: "pending",
    order_status: "pending",
    created_at: now,
    updated_at: now,
  });

  await OrderItem.insertMany(
    preparedItems.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      product_name: item.productName,
      variant_info: item.variantInfo,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      created_at: now,
    }))
  );

  try {
    const buyerName = splitFullName(body.shippingAddress.fullName);
    const iyzipay = createIyzicoClient();
    const callbackBase = body.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const result = await initializeCheckoutForm(iyzipay, {
      locale: "tr",
      conversationId: order.id,
      price: finalPrice.toFixed(2),
      paidPrice: finalPrice.toFixed(2),
      currency: "TRY",
      basketId: order.id,
      paymentGroup: "PRODUCT",
      callbackUrl: `${callbackBase}/api/payments/iyzico/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: sessionUser?.id || order.id,
        name: buyerName.name,
        surname: buyerName.surname,
        email: body.shippingAddress.email.trim(),
        gsmNumber: body.shippingAddress.phone.trim(),
        registrationAddress: body.shippingAddress.address.trim(),
        city: body.shippingAddress.city.trim(),
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: {
        contactName: body.shippingAddress.fullName.trim(),
        city: body.shippingAddress.city.trim(),
        country: "Turkey",
        address: body.shippingAddress.address.trim(),
        zipCode: "34000",
      },
      billingAddress: {
        contactName: body.shippingAddress.fullName.trim(),
        city: body.shippingAddress.city.trim(),
        country: "Turkey",
        address: body.shippingAddress.address.trim(),
        zipCode: "34000",
      },
      basketItems: preparedItems.map((item) => ({
        id: item.variantId,
        name: item.productName,
        category1: "Elektronik",
        itemType: "PHYSICAL",
        price: item.linePrice.toFixed(2),
      })),
    });

    if (result?.status !== "success" || !result?.paymentPageUrl) {
      throw new Error(result?.errorMessage || "Iyzico odeme sayfasi olusturulamadi");
    }

    return {
      orderId: order.id,
      paymentPageUrl: result.paymentPageUrl as string,
      finalPrice,
    };
  } catch (error) {
    await OrderItem.deleteMany({ order_id: order.id });
    await Order.deleteOne({ id: order.id });
    throw error;
  }
}
