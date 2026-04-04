import { randomUUID } from "node:crypto";
import {
  billingInfoSchema,
  buildCheckoutInstallmentPreview,
  checkoutStartSchema,
  copyShippingAddressToBilling,
  getEnabledCheckoutPaymentMethods,
  getPaymentMethodConfig,
  installmentPreviewSchema,
  retryPaymentSchema,
  sanitizeRetryToken,
  shippingAddressSchema,
  couponPreviewSchema,
  type BillingInfoInput,
  type CheckoutPaymentMethod,
  type CouponPreviewInput,
  type CheckoutStartInput,
  type CheckoutStartResult,
  type InstallmentPreviewInput,
  type OrderPaymentStatusResponse,
  type RetryPaymentInput,
  type ShippingAddressInput,
} from "@/lib/checkout";
import { calculateOrderTotals, resolveShippingFee } from "@/lib/shipping";
import { toPriceNumber } from "@/lib/utils";
import { getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";
import { createIyzicoClient, initializeCheckoutForm, retrieveCheckoutForm, type IyzicoCheckoutFormRetrieveResult } from "@/server/services/iyzico";
import { sendOrderNotifications } from "@/server/services/order-notifications";
import type { SessionUser } from "@/server/auth-session";
import { Coupon, Order, OrderItem, PaymentAttempt, Product, ProductVariant, SiteContent, User } from "@/server/models";

type CheckoutRequestItem = {
  variantId: string;
  quantity: number;
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
  variantSku: string;
  variantAttributes: Record<string, string>;
  variantImage: string | null;
  quantity: number;
  unitPrice: number;
  linePrice: number;
  productName: string;
  variantInfo: string | null;
};

type CheckoutProductRecord = {
  id: string;
  name: string;
  images: string[];
};

type VariantRecord = {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  images?: string[];
};

type SiteContentRecord = {
  shipping_fee?: number | null;
};

type OrderRecord = {
  id: string;
  user_id: string | null;
  guest_token?: string | null;
  total_price?: number;
  discount?: number;
  shipping_price?: number;
  final_price?: number;
  coupon_id?: string | null;
  coupon_code?: string | null;
  payment_method?: CheckoutPaymentMethod;
  payment_provider?: string;
  payment_status?: string;
  payment_reference_id?: string | null;
  payment_conversation_id?: string | null;
  payment_transaction_id?: string | null;
  payment_attempts_count?: number;
  last_payment_attempt_at?: Date | string | null;
  payment_failure_reason?: string | null;
  is_retryable_payment?: boolean;
  billing_info?: BillingInfoInput | null;
  notification_summary?: { email?: string | null; sms?: string | null } | null;
  order_status?: string;
  shipping_address?: Record<string, unknown> | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type OrderItemRecord = {
  id: string;
  order_id: string;
  variant_id: string;
  variant_sku?: string | null;
  variant_attributes?: Record<string, unknown> | null;
  variant_image?: string | null;
  product_name: string;
  variant_info?: string | null;
  quantity: number;
  unit_price: number;
};

type PaymentAttemptRecord = {
  id: string;
  order_id: string;
  payment_method?: CheckoutPaymentMethod;
  attempt_number?: number;
  status?: string;
  started_at?: Date | string;
  provider_reference?: string | null;
  transaction_id?: string | null;
  checkout_token?: string | null;
  payment_page_url?: string | null;
};

type UserRecord = {
  id: string;
  email: string;
  phone?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  communication_preferences?: {
    email?: boolean;
    sms?: boolean;
  } | null;
};

export type CheckoutRequestBody = CheckoutStartInput;
export type CheckoutSessionResult = CheckoutStartResult;

const ACTIVE_PAYMENT_ATTEMPT_MINUTES = 15;

function normalizeQuantity(value: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

export function normalizeCheckoutItems(items: Array<{ variantId?: string; quantity?: number }>) {
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
    return { discount: 0, error: "Kupon aktif değil" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { discount: 0, error: "Kuponun suresi dolmus" };
  }

  if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
    return { discount: 0, error: "Kupon kullanım limiti dolmuş" };
  }

  if (coupon.min_order_amount && totalPrice < coupon.min_order_amount) {
    return {
      discount: 0,
      error: `Minimum sipariş tutarı: TL ${coupon.min_order_amount.toLocaleString("tr-TR")}`,
    };
  }

  const rawDiscount = coupon.type === "percentage" ? (totalPrice * coupon.value) / 100 : coupon.value;
  return { discount: Math.min(Math.max(rawDiscount, 0), totalPrice), error: null };
}

function splitFullName(fullName: string) {
  const pieces = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    name: pieces[0] || "Müşteri",
    surname: pieces.slice(1).join(" ") || "Müşteri",
  };
}

function getCallbackBaseUrl(origin?: string) {
  return origin?.trim() || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function getPostalCode(value?: string | null) {
  const normalized = `${value ?? ""}`.trim();
  return normalized || "34000";
}

function getBankTransferInstructions(orderId: string) {
  const iban = process.env.BANK_TRANSFER_IBAN;

  if (!iban) {
    return null;
  }

  return {
    accountHolder: process.env.BANK_TRANSFER_ACCOUNT_HOLDER || "Cep Dünyası",
    iban,
    bankName: process.env.BANK_TRANSFER_BANK_NAME || "Banka bilgisi güncellenecek",
    branchName: process.env.BANK_TRANSFER_BRANCH_NAME || null,
    description: `Sipariş No: ${orderId}`,
  };
}

function buildOrderResultUrl(origin: string, orderId: string, status: string, retryToken?: string | null) {
  const url = new URL("/checkout/result", origin);
  url.searchParams.set("orderId", orderId);
  url.searchParams.set("payment", status);

  if (retryToken) {
    url.searchParams.set("retryToken", retryToken);
  }

  return url.toString();
}

function isPaymentAttemptActive(attempt: PaymentAttemptRecord | null) {
  if (!attempt || attempt.status !== "started") {
    return false;
  }

  const startedAt = attempt.started_at ? new Date(attempt.started_at).getTime() : 0;
  return startedAt > 0 && Date.now() - startedAt <= ACTIVE_PAYMENT_ATTEMPT_MINUTES * 60 * 1000;
}

function assertPaymentMethodEnabled(method: CheckoutPaymentMethod) {
  const enabledMethods = getEnabledCheckoutPaymentMethods();

  if (!enabledMethods.some((item) => item.method === method)) {
    throw new Error("Seçilen ödeme yöntemi şu anda kullanılamıyor");
  }
}

async function loadSiteShippingFee() {
  const siteContent = (await SiteContent.findOne({ key: "home" }).select("shipping_fee").lean()) as SiteContentRecord | null;
  return resolveShippingFee(siteContent?.shipping_fee);
}

export async function getCheckoutShippingFee() {
  return loadSiteShippingFee();
}

async function prepareCheckoutItems(items: Array<{ variantId?: string; quantity?: number }>) {
  const normalizedItems = normalizeCheckoutItems(items);

  if (normalizedItems.length === 0) {
    throw new Error("Sepet boş");
  }

  const variantIds = normalizedItems.map((item) => item.variantId);
  const variants = normalizeProductVariants(
    await ProductVariant.find({ id: { $in: variantIds }, is_active: true }).lean(),
  ) as VariantRecord[];
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

  if (variants.length !== variantIds.length) {
    throw new Error("Sepetteki bazı varyantlar artık kullanılamıyor");
  }

  const productIds = Array.from(new Set(variants.map((variant) => variant.product_id).filter(Boolean))) as string[];
  const products = (await Product.find({ id: { $in: productIds }, is_active: true }).lean()) as CheckoutProductRecord[];
  const productsById = new Map<string, CheckoutProductRecord>(products.map((product) => [product.id, product]));

  return normalizedItems.map<PreparedCheckoutItem>((item) => {
    const variant = variantsById.get(item.variantId);
    const product = variant ? productsById.get(variant.product_id) : null;

    if (!variant || !product) {
      throw new Error("Sepetteki bazı ürünler artık satışta değil");
    }

    if (variant.stock < item.quantity) {
      throw new Error(`${product.name} için yeterli stok yok`);
    }

    const unitPrice = Number(variant.price ?? 0);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`${product.name} için geçerli fiyat bulunamadı`);
    }

    return {
      variantId: variant.id,
      variantSku: variant.sku,
      variantAttributes: variant.attributes,
      variantImage: getVariantGallery(variant, product.images)[0] ?? null,
      quantity: item.quantity,
      unitPrice,
      linePrice: unitPrice * item.quantity,
      productName: product.name,
      variantInfo: getVariantLabel(variant),
    };
  });
}

async function resolveCoupon(couponCode?: string) {
  const normalizedCouponCode = `${couponCode ?? ""}`.trim().toUpperCase();
  const coupon = normalizedCouponCode
    ? await Coupon.findOne({ code: normalizedCouponCode, is_active: true }).lean()
    : null;

  if (normalizedCouponCode && !coupon) {
    throw new Error("Geçersiz kupon kodu");
  }

  return coupon as CouponLike | null;
}

export async function previewCoupon(input: CouponPreviewInput) {
  const payload = couponPreviewSchema.parse(input);
  const normalizedCouponCode = payload.couponCode.trim().toUpperCase();
  const coupon = await resolveCoupon(normalizedCouponCode);
  const { discount, error } = calculateCouponDiscount(payload.subtotal, coupon);

  return {
    couponCode: normalizedCouponCode,
    valid: !error && Boolean(coupon),
    discount,
    error,
    coupon: coupon
      ? {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minOrderAmount: coupon.min_order_amount ?? 0,
        }
      : null,
  };
}

async function prepareCheckoutPricing(
  items: Array<{ variantId?: string; quantity?: number }>,
  couponCode?: string,
) {
  const preparedItems = await prepareCheckoutItems(items);
  const totalPrice = preparedItems.reduce((sum, item) => sum + item.linePrice, 0);
  const coupon = await resolveCoupon(couponCode);
  const { discount, error: couponError } = calculateCouponDiscount(totalPrice, coupon);

  if (couponError) {
    throw new Error(couponError);
  }

  const shippingFee = await loadSiteShippingFee();
  const { shippingPrice, finalPrice } = calculateOrderTotals(totalPrice, discount, shippingFee);

  if (finalPrice <= 0) {
    throw new Error("Ödeme tutarı sıfırdan büyük olmalı");
  }

  return {
    preparedItems,
    coupon,
    totalPrice,
    discount,
    shippingPrice,
    finalPrice,
  };
}

async function buildOrderNotificationRecipient(order: OrderRecord, shippingAddress: ShippingAddressInput) {
  const user = order.user_id ? ((await User.findOne({ id: order.user_id }).lean()) as UserRecord | null) : null;

  return {
    userId: order.user_id ?? null,
    email: user?.email ?? shippingAddress.email,
    phone: user?.phone?.trim() || shippingAddress.phone,
    emailEnabled: user?.communication_preferences?.email !== false,
    smsEnabled: Boolean(user?.communication_preferences?.sms),
    customerName:
      user?.full_name?.trim() ||
      `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
      shippingAddress.fullName,
  };
}

async function updateOrderNotificationSummary(orderId: string, summary: { email: string | null; sms: string | null }) {
  await Order.updateOne(
    { id: orderId },
    {
      $set: {
        notification_summary: summary,
        updated_at: new Date(),
      },
    },
  );
}

async function triggerOrderNotifications(input: {
  event: "order_created" | "payment_succeeded" | "payment_failed" | "awaiting_transfer" | "shipment_updated" | "delivered";
  order: OrderRecord;
  shippingAddress: ShippingAddressInput;
  paymentMethod: CheckoutPaymentMethod;
  paymentStatus: string;
  billingInfo?: BillingInfoInput | null;
  paymentFailureReason?: string | null;
}) {
  try {
    const recipient = await buildOrderNotificationRecipient(input.order, input.shippingAddress);
    const summary = await sendOrderNotifications({
      event: input.event,
      recipient,
      context: {
        orderId: input.order.id,
        finalPrice: toPriceNumber(input.order.final_price),
        customerName: recipient.customerName,
        paymentMethod: getPaymentMethodConfig(input.paymentMethod).label,
        paymentStatus: input.paymentStatus,
        billingInfo: input.billingInfo ?? null,
        paymentFailureReason: input.paymentFailureReason ?? null,
      },
    });

    await updateOrderNotificationSummary(input.order.id, summary);
  } catch (error) {
    console.error("Order notification dispatch failed:", error);
  }
}

async function createPaymentAttempt(order: OrderRecord, paymentMethod: CheckoutPaymentMethod) {
  const now = new Date();
  return (await PaymentAttempt.create({
    order_id: order.id,
    provider: order.payment_provider ?? "iyzico",
    payment_method: paymentMethod,
    attempt_number: Number(order.payment_attempts_count ?? 0) + 1,
    status: "started",
    started_at: now,
    completed_at: null,
    failure_reason: null,
    provider_reference: null,
    conversation_id: order.id,
    transaction_id: null,
    checkout_token: null,
    payment_page_url: null,
    raw_response_summary: null,
    created_at: now,
    updated_at: now,
  })) as PaymentAttemptRecord & { save: () => Promise<void> };
}

function normalizeShippingAddress(address: Record<string, unknown> | null | undefined): ShippingAddressInput {
  return shippingAddressSchema.parse({
    fullName: `${address?.fullName ?? address?.full_name ?? ""}`,
    email: `${address?.email ?? ""}`,
    phone: `${address?.phone ?? ""}`,
    addressTitle: `${address?.addressTitle ?? address?.address_title ?? ""}`,
    city: `${address?.city ?? ""}`,
    district: `${address?.district ?? ""}`,
    neighborhood: `${address?.neighborhood ?? ""}`,
    addressLine: `${address?.addressLine ?? address?.address ?? address?.line1 ?? ""}`,
    postalCode: `${address?.postalCode ?? address?.postal_code ?? ""}`,
  });
}

function normalizeBillingInfo(input: BillingInfoInput) {
  return billingInfoSchema.parse(input);
}

async function hydrateOrderItems(orderId: string) {
  return (await OrderItem.find({ order_id: orderId }).sort({ created_at: 1 }).lean()) as OrderItemRecord[];
}

async function createOrderRecord(input: {
  checkout: CheckoutStartInput;
  pricing: Awaited<ReturnType<typeof prepareCheckoutPricing>>;
  sessionUser: SessionUser | null;
  billingInfo: BillingInfoInput;
}) {
  const now = new Date();
  const order = await Order.create({
    user_id: input.sessionUser?.id ?? null,
    guest_token: input.sessionUser?.id ? null : randomUUID(),
    total_price: input.pricing.totalPrice,
    discount: input.pricing.discount,
    shipping_price: input.pricing.shippingPrice,
    final_price: input.pricing.finalPrice,
    shipping_address: {
      fullName: input.checkout.shippingAddress.fullName.trim(),
      email: input.checkout.shippingAddress.email.trim(),
      phone: input.checkout.shippingAddress.phone.trim(),
      addressTitle: input.checkout.shippingAddress.addressTitle.trim(),
      city: input.checkout.shippingAddress.city.trim(),
      district: input.checkout.shippingAddress.district.trim(),
      neighborhood: input.checkout.shippingAddress.neighborhood.trim(),
      addressLine: input.checkout.shippingAddress.addressLine.trim(),
      postalCode: input.checkout.shippingAddress.postalCode.trim(),
    },
    billing_info: input.billingInfo,
    coupon_id: input.pricing.coupon?.id ?? null,
    coupon_code: input.pricing.coupon?.code ?? null,
    payment_method: input.checkout.paymentMethod,
    payment_provider: input.checkout.paymentMethod === "credit_card_3ds" ? "iyzico" : "offline",
    payment_status: "pending",
    payment_reference_id: null,
    payment_conversation_id: null,
    payment_transaction_id: null,
    payment_attempts_count: 0,
    last_payment_attempt_at: null,
    payment_failure_reason: null,
    is_retryable_payment: input.checkout.paymentMethod === "credit_card_3ds",
    order_status: input.checkout.paymentMethod === "bank_transfer" ? "awaiting_transfer" : "pending",
    status_history: [
      {
        status: input.checkout.paymentMethod === "bank_transfer" ? "awaiting_transfer" : "pending",
        note: "Sipariş oluşturuldu",
        changed_by_user_id: input.sessionUser?.id ?? null,
        created_at: now,
      },
    ],
    created_at: now,
    updated_at: now,
  });

  await OrderItem.insertMany(
    input.pricing.preparedItems.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      variant_sku: item.variantSku,
      variant_attributes: item.variantAttributes,
      variant_image: item.variantImage,
      product_name: item.productName,
      variant_info: item.variantInfo,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      created_at: now,
    })),
  );

  return order as OrderRecord;
}

async function startOfflinePayment(input: {
  order: OrderRecord;
  paymentMethod: CheckoutPaymentMethod;
  shippingAddress: ShippingAddressInput;
  billingInfo: BillingInfoInput;
  origin?: string;
}) {
  const now = new Date();
  const isTransfer = input.paymentMethod === "bank_transfer";
  const orderStatus = isTransfer ? "awaiting_transfer" : "confirmed";
  const bankTransferInstructions = isTransfer ? getBankTransferInstructions(input.order.id) : null;

  await Order.updateOne(
    { id: input.order.id },
    {
      $set: {
        payment_method: input.paymentMethod,
        payment_provider: "offline",
        payment_status: "pending",
        payment_failure_reason: null,
        is_retryable_payment: false,
        order_status: orderStatus,
        updated_at: now,
      },
      $push: {
        status_history: {
          status: orderStatus,
          note: isTransfer ? "Havale bekleniyor" : "Sipariş onaylandı",
          changed_by_user_id: input.order.user_id ?? null,
          created_at: now,
        },
      },
    },
  );

  const refreshedOrder = (await Order.findOne({ id: input.order.id }).lean()) as OrderRecord | null;

  if (refreshedOrder) {
    await triggerOrderNotifications({
      event: "order_created",
      order: refreshedOrder,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      billingInfo: input.billingInfo,
    });

    if (isTransfer) {
      await triggerOrderNotifications({
        event: "awaiting_transfer",
        order: refreshedOrder,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        paymentStatus: "pending",
        billingInfo: input.billingInfo,
      });
    }
  }

  const callbackBase = getCallbackBaseUrl(input.origin);

  return {
    orderId: input.order.id,
    finalPrice: toPriceNumber(input.order.final_price),
    paymentMethod: input.paymentMethod,
    paymentProvider: "offline",
    paymentStatus: "pending" as const,
    orderStatus: orderStatus as CheckoutStartResult["orderStatus"],
    redirectUrl: buildOrderResultUrl(
      callbackBase,
      input.order.id,
      isTransfer ? "awaiting_transfer" : "success",
      sanitizeRetryToken(input.order.guest_token),
    ),
    retryToken: sanitizeRetryToken(input.order.guest_token),
    bankTransferInstructions,
  };
}

async function buildIyzicoPaymentForOrder(input: {
  order: OrderRecord;
  orderItems: OrderItemRecord[];
  shippingAddress: ShippingAddressInput;
  billingInfo: BillingInfoInput;
  sessionUser: SessionUser | null;
  paymentMethod: CheckoutPaymentMethod;
  installmentMonths: number;
  origin?: string;
}) {
  const existingOpenAttempt = (await PaymentAttempt.findOne({
    order_id: input.order.id,
    payment_method: input.paymentMethod,
    status: "started",
  })
    .sort({ created_at: -1 })
    .lean()) as PaymentAttemptRecord | null;

  if (isPaymentAttemptActive(existingOpenAttempt) && existingOpenAttempt?.payment_page_url) {
    return {
      orderId: input.order.id,
      finalPrice: toPriceNumber(input.order.final_price),
      paymentMethod: input.paymentMethod,
      paymentProvider: `${input.order.payment_provider ?? "iyzico"}`,
      paymentStatus: "requires_action" as const,
      orderStatus: `${input.order.order_status ?? "pending"}` as CheckoutStartResult["orderStatus"],
      paymentPageUrl: existingOpenAttempt.payment_page_url,
      retryToken: sanitizeRetryToken(input.order.guest_token),
    };
  }

  const buyerName = splitFullName(input.shippingAddress.fullName);
  const iyzipay = createIyzicoClient();
  const callbackBase = getCallbackBaseUrl(input.origin);
  const attempt = await createPaymentAttempt(input.order, input.paymentMethod);
  const installmentOptions = buildCheckoutInstallmentPreview(toPriceNumber(input.order.final_price), input.paymentMethod);
  const enabledInstallments = installmentOptions
    .map((option) => option.months)
    .filter((months) => months === 1 || months <= input.installmentMonths || input.installmentMonths === 1);

  try {
    const result = await initializeCheckoutForm(iyzipay, {
      locale: "tr",
      conversationId: input.order.id,
      price: toPriceNumber(input.order.final_price).toFixed(2),
      paidPrice: toPriceNumber(input.order.final_price).toFixed(2),
      currency: "TRY",
      basketId: input.order.id,
      paymentGroup: "PRODUCT",
      callbackUrl: `${callbackBase}/api/payments/iyzico/callback`,
      enabledInstallments: enabledInstallments.length > 0 ? enabledInstallments : [1, 2, 3, 6, 9, 12],
      buyer: {
        id: input.sessionUser?.id || input.order.id,
        name: buyerName.name,
        surname: buyerName.surname,
        email: input.shippingAddress.email.trim(),
        gsmNumber: input.shippingAddress.phone.trim(),
        registrationAddress: input.shippingAddress.addressLine.trim(),
        city: input.shippingAddress.city.trim(),
        country: "Turkey",
        zipCode: getPostalCode(input.shippingAddress.postalCode),
      },
      shippingAddress: {
        contactName: input.shippingAddress.fullName.trim(),
        city: input.shippingAddress.city.trim(),
        country: "Turkey",
        address: input.shippingAddress.addressLine.trim(),
        zipCode: getPostalCode(input.shippingAddress.postalCode),
      },
      billingAddress: {
        contactName: input.billingInfo.billingFullName.trim(),
        city: input.billingInfo.billingCity.trim(),
        country: "Turkey",
        address: input.billingInfo.billingAddressLine.trim(),
        zipCode: getPostalCode(input.billingInfo.billingPostalCode),
      },
      basketItems: input.orderItems.map((item) => ({
        id: item.variant_id,
        name: item.product_name,
        category1: "Elektronik",
        itemType: "PHYSICAL",
        price: (toPriceNumber(item.unit_price) * Number(item.quantity ?? 0)).toFixed(2),
      })),
    });

    if (result?.status !== "success" || !result?.paymentPageUrl) {
      throw new Error(result?.errorMessage || "iyzico ödeme sayfası oluşturulamadı");
    }

    attempt.checkout_token = result.token ?? null;
    attempt.payment_page_url = result.paymentPageUrl ?? null;
    attempt.status = "started";
    await attempt.save();

    await Order.updateOne(
      { id: input.order.id },
      {
        $set: {
          payment_method: input.paymentMethod,
          payment_provider: "iyzico",
          payment_status: "requires_action",
          payment_conversation_id: input.order.id,
          payment_failure_reason: null,
          is_retryable_payment: true,
          last_payment_attempt_at: new Date(),
          updated_at: new Date(),
        },
        $inc: {
          payment_attempts_count: 1,
        },
      },
    );

    return {
      orderId: input.order.id,
      finalPrice: toPriceNumber(input.order.final_price),
      paymentMethod: input.paymentMethod,
      paymentProvider: "iyzico",
      paymentStatus: "requires_action" as const,
      orderStatus: `${input.order.order_status ?? "pending"}` as CheckoutStartResult["orderStatus"],
      paymentPageUrl: result.paymentPageUrl,
      retryToken: sanitizeRetryToken(input.order.guest_token),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ödeme başlatılamadı";
    await PaymentAttempt.updateOne(
      { id: attempt.id },
      {
        $set: {
          status: "failed",
          completed_at: new Date(),
          failure_reason: message,
          updated_at: new Date(),
        },
      },
    );
    await Order.updateOne(
      { id: input.order.id },
      {
        $set: {
          payment_method: input.paymentMethod,
          payment_provider: "iyzico",
          payment_status: "failed",
          payment_failure_reason: message,
          is_retryable_payment: true,
          last_payment_attempt_at: new Date(),
          updated_at: new Date(),
        },
        $inc: {
          payment_attempts_count: 1,
        },
      },
    );

    const failedOrder = (await Order.findOne({ id: input.order.id }).lean()) as OrderRecord | null;
    if (failedOrder) {
      await triggerOrderNotifications({
        event: "payment_failed",
        order: failedOrder,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        paymentStatus: "failed",
        billingInfo: input.billingInfo,
        paymentFailureReason: message,
      });
    }

    return {
      orderId: input.order.id,
      finalPrice: toPriceNumber(input.order.final_price),
      paymentMethod: input.paymentMethod,
      paymentProvider: "iyzico",
      paymentStatus: "failed" as const,
      orderStatus: "failed" as const,
      redirectUrl: buildOrderResultUrl(callbackBase, input.order.id, "failed", sanitizeRetryToken(input.order.guest_token)),
      retryToken: sanitizeRetryToken(input.order.guest_token),
    };
  }
}

export function getCheckoutPaymentMethods() {
  return {
    methods: getEnabledCheckoutPaymentMethods(),
    defaultMethod: "credit_card_3ds" as const,
  };
}

export function getInstallmentPreview(input: InstallmentPreviewInput) {
  const payload = installmentPreviewSchema.parse(input);
  return {
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    options: buildCheckoutInstallmentPreview(payload.amount, payload.paymentMethod),
  };
}

export async function createCheckoutSession(
  body: CheckoutRequestBody,
  sessionUser: SessionUser | null,
): Promise<CheckoutSessionResult> {
  const payload = checkoutStartSchema.parse(body);
  assertPaymentMethodEnabled(payload.paymentMethod);

  const billingInfo = normalizeBillingInfo(
    payload.billingInfo.useShippingAddressAsBilling
      ? copyShippingAddressToBilling(payload.shippingAddress, payload.billingInfo)
      : payload.billingInfo,
  );
  const pricing = await prepareCheckoutPricing(payload.items, payload.couponCode);
  const order = await createOrderRecord({
    checkout: payload,
    pricing,
    sessionUser,
    billingInfo,
  });

  if (payload.paymentMethod === "credit_card_3ds") {
    await triggerOrderNotifications({
      event: "order_created",
      order,
      shippingAddress: payload.shippingAddress,
      paymentMethod: payload.paymentMethod,
      paymentStatus: "pending",
      billingInfo,
    });

    const orderItems = await hydrateOrderItems(order.id);
    return buildIyzicoPaymentForOrder({
      order,
      orderItems,
      shippingAddress: payload.shippingAddress,
      billingInfo,
      sessionUser,
      paymentMethod: payload.paymentMethod,
      installmentMonths: payload.installmentMonths,
      origin: payload.origin,
    });
  }

  return startOfflinePayment({
    order,
    paymentMethod: payload.paymentMethod,
    shippingAddress: payload.shippingAddress,
    billingInfo,
    origin: payload.origin,
  });
}

async function updateExistingOrderPricing(orderId: string, pricing: Awaited<ReturnType<typeof prepareCheckoutPricing>>) {
  await Order.updateOne(
    { id: orderId },
    {
      $set: {
        total_price: pricing.totalPrice,
        discount: pricing.discount,
        shipping_price: pricing.shippingPrice,
        final_price: pricing.finalPrice,
        coupon_id: pricing.coupon?.id ?? null,
        coupon_code: pricing.coupon?.code ?? null,
        updated_at: new Date(),
      },
    },
  );
}

async function validateRetryableOrder(order: OrderRecord, sessionUser: SessionUser | null, retryToken?: string | null) {
  if (order.user_id) {
    if (!sessionUser || sessionUser.id !== order.user_id) {
      throw new Error("Bu sipariş için ödeme tekrar deneme yetkiniz yok");
    }
    return;
  }

  if (!retryToken || retryToken !== sanitizeRetryToken(order.guest_token)) {
    throw new Error("Misafir siparişi için geçerli tekrar ödeme anahtarı bulunamadı");
  }
}

async function prepareRetryPricing(order: OrderRecord) {
  const orderItems = await hydrateOrderItems(order.id);
  const pricing = await prepareCheckoutPricing(
    orderItems.map((item) => ({
      variantId: item.variant_id,
      quantity: Number(item.quantity ?? 0),
    })),
    order.coupon_code ?? undefined,
  );

  const finalChanged = Math.abs(pricing.finalPrice - toPriceNumber(order.final_price)) > 0.01;
  const itemsChanged = orderItems.some((item) => {
    const preparedItem = pricing.preparedItems.find((prepared) => prepared.variantId === item.variant_id);
    return !preparedItem || Math.abs(preparedItem.unitPrice - toPriceNumber(item.unit_price)) > 0.01;
  });

  await Promise.all(
    pricing.preparedItems.map((preparedItem) =>
      OrderItem.updateOne(
        { order_id: order.id, variant_id: preparedItem.variantId },
        {
          $set: {
            variant_sku: preparedItem.variantSku,
            variant_attributes: preparedItem.variantAttributes,
            variant_image: preparedItem.variantImage,
            product_name: preparedItem.productName,
            variant_info: preparedItem.variantInfo,
            unit_price: preparedItem.unitPrice,
          },
        },
      ),
    ),
  );

  await updateExistingOrderPricing(order.id, pricing);

  if (itemsChanged || finalChanged) {
    throw new Error("Sipariş tutarı güncellendi. Lütfen yeni tutarı kontrol edip tekrar deneyin.");
  }

  return { orderItems };
}

export async function retryCheckoutPayment(
  input: RetryPaymentInput,
  sessionUser: SessionUser | null,
): Promise<CheckoutStartResult> {
  const payload = retryPaymentSchema.parse(input);
  assertPaymentMethodEnabled(payload.paymentMethod);

  const order = (await Order.findOne({ id: payload.orderId }).lean()) as OrderRecord | null;

  if (!order) {
    throw new Error("Sipariş bulunamadı");
  }

  await validateRetryableOrder(order, sessionUser, sanitizeRetryToken(payload.retryToken));

  if (order.payment_status === "paid") {
    throw new Error("Bu siparişin ödemesi zaten tamamlandı");
  }

  if (["cancelled", "refunded"].includes(`${order.order_status ?? ""}`)) {
    throw new Error("Bu sipariş için tekrar ödeme başlatılamaz");
  }

  const shippingAddress = normalizeShippingAddress(order.shipping_address);
  const billingInfo = normalizeBillingInfo(
    order.billing_info
      ? billingInfoSchema.parse(order.billing_info)
      : copyShippingAddressToBilling(shippingAddress, {
          invoiceType: "individual",
          useShippingAddressAsBilling: true,
          billingFullName: shippingAddress.fullName,
          billingPhone: shippingAddress.phone,
          billingEmail: shippingAddress.email,
          billingAddressTitle: shippingAddress.addressTitle,
          billingCity: shippingAddress.city,
          billingDistrict: shippingAddress.district,
          billingNeighborhood: shippingAddress.neighborhood,
          billingAddressLine: shippingAddress.addressLine,
          billingPostalCode: shippingAddress.postalCode,
          identityNumber: "",
        }),
  );

  const { orderItems } = await prepareRetryPricing(order);
  const latestOrder = (await Order.findOne({ id: order.id }).lean()) as OrderRecord | null;

  if (!latestOrder) {
    throw new Error("Sipariş güncellenirken bir sorun oluştu");
  }

  if (payload.paymentMethod === "credit_card_3ds") {
    return buildIyzicoPaymentForOrder({
      order: latestOrder,
      orderItems,
      shippingAddress,
      billingInfo,
      sessionUser,
      paymentMethod: payload.paymentMethod,
      installmentMonths: payload.installmentMonths,
      origin: process.env.NEXT_PUBLIC_SITE_URL,
    });
  }

  return startOfflinePayment({
    order: latestOrder,
    paymentMethod: payload.paymentMethod,
    shippingAddress,
    billingInfo,
    origin: process.env.NEXT_PUBLIC_SITE_URL,
  });
}

export async function getOrderPaymentStatus(
  orderId: string,
  sessionUser: SessionUser | null,
  retryToken?: string | null,
): Promise<OrderPaymentStatusResponse> {
  const order = (await Order.findOne({ id: orderId }).lean()) as OrderRecord | null;

  if (!order) {
    throw new Error("Sipariş bulunamadı");
  }

  await validateRetryableOrder(order, sessionUser, sanitizeRetryToken(retryToken));

  return {
    orderId: order.id,
    createdAt: new Date(order.created_at ?? Date.now()).toISOString(),
    finalPrice: toPriceNumber(order.final_price),
    paymentStatus: `${order.payment_status ?? "pending"}` as OrderPaymentStatusResponse["paymentStatus"],
    orderStatus: `${order.order_status ?? "pending"}`,
    paymentMethod: (order.payment_method ?? "credit_card_3ds") as CheckoutPaymentMethod,
    paymentProvider: `${order.payment_provider ?? "iyzico"}`,
    paymentFailureReason: order.payment_failure_reason ?? null,
    paymentAttemptsCount: Number(order.payment_attempts_count ?? 0),
    lastPaymentAttemptAt: order.last_payment_attempt_at ? new Date(order.last_payment_attempt_at).toISOString() : null,
    isRetryablePayment:
      order.is_retryable_payment !== false &&
      `${order.payment_status ?? "pending"}` !== "paid" &&
      !["cancelled", "refunded"].includes(`${order.order_status ?? ""}`),
    retryToken: sanitizeRetryToken(order.guest_token),
    bankTransferInstructions:
      order.payment_method === "bank_transfer" ? getBankTransferInstructions(order.id) : undefined,
    notificationSummary: order.notification_summary
      ? {
          email: order.notification_summary.email ?? null,
          sms: order.notification_summary.sms ?? null,
        }
      : null,
  };
}

async function consumeStockAndSales(order: OrderRecord) {
  const items = (await OrderItem.find({ order_id: order.id }).lean()) as OrderItemRecord[];
  const variantIds = items.map((item) => item.variant_id);
  const variants = normalizeProductVariants(await ProductVariant.find({ id: { $in: variantIds } }).lean()) as VariantRecord[];
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

  for (const item of items) {
    const variant = variantsById.get(item.variant_id);

    if (!variant) {
      throw new Error(`${item.product_name} varyantı bulunamadı`);
    }

    const updateResult = await ProductVariant.updateOne(
      {
        id: variant.id,
        stock: { $gte: item.quantity },
      },
      {
        $inc: { stock: -item.quantity },
        $set: { updated_at: new Date() },
      },
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error(`${item.product_name} için stok yetersiz`);
    }

    await Product.updateOne(
      { id: variant.product_id },
      {
        $inc: { sales_count: Number(item.quantity ?? 0) },
        $set: { updated_at: new Date() },
      },
    );
  }

  if (order.coupon_id) {
    await Coupon.updateOne({ id: order.coupon_id }, { $inc: { usage_count: 1 } });
  }
}

export async function finalizeIyzicoPayment(token: string) {
  const iyzipay = createIyzicoClient();
  const result = (await retrieveCheckoutForm(iyzipay, token)) as IyzicoCheckoutFormRetrieveResult;
  const orderId = `${result?.conversationId ?? ""}`.trim();

  if (!orderId) {
    throw new Error(result?.errorMessage || "Ödeme bilgisi bulunamadı");
  }

  const existingOrder = (await Order.findOne({ id: orderId }).lean()) as OrderRecord | null;

  if (!existingOrder) {
    throw new Error("Sipariş bulunamadı");
  }

  const callbackSucceeded = result?.paymentStatus === "SUCCESS" || result?.status === "success";
  const paymentReferenceId = `${result?.paymentId ?? ""}`.trim() || null;
  const paymentAttempt = (await PaymentAttempt.findOne({
    order_id: orderId,
    $or: [
      ...(paymentReferenceId ? [{ provider_reference: paymentReferenceId }] : []),
      ...(token ? [{ checkout_token: token }] : []),
    ],
  })
    .sort({ created_at: -1 })
    .lean()) as PaymentAttemptRecord | null;

  if (existingOrder.payment_status !== "paid" && callbackSucceeded) {
    await consumeStockAndSales(existingOrder);
  }

  const paymentStatus = callbackSucceeded ? "paid" : "failed";
  const paymentFailureReason = callbackSucceeded ? null : result?.errorMessage || "Ödeme doğrulanamadı";
  const now = new Date();

  await Order.updateOne(
    { id: orderId },
    {
      $set: {
        payment_status: paymentStatus,
        payment_reference_id: paymentReferenceId,
        payment_conversation_id: orderId,
        payment_transaction_id: paymentReferenceId,
        payment_failure_reason: paymentFailureReason,
        order_status: callbackSucceeded ? "confirmed" : "failed",
        is_retryable_payment: !callbackSucceeded,
        updated_at: now,
      },
      $push: {
        status_history: {
          status: callbackSucceeded ? "confirmed" : "failed",
          note: callbackSucceeded ? "3D Secure ödemesi başarıyla tamamlandı" : paymentFailureReason,
          changed_by_user_id: existingOrder.user_id ?? null,
          created_at: now,
        },
      },
    },
  );

  if (paymentAttempt) {
    await PaymentAttempt.updateOne(
      { id: paymentAttempt.id },
      {
        $set: {
          status: paymentStatus,
          completed_at: now,
          failure_reason: paymentFailureReason,
          provider_reference: paymentReferenceId,
          transaction_id: paymentReferenceId,
          raw_response_summary: result,
          updated_at: now,
        },
      },
    );
  }

  const updatedOrder = (await Order.findOne({ id: orderId }).lean()) as OrderRecord | null;

  if (updatedOrder) {
    await triggerOrderNotifications({
      event: callbackSucceeded ? "payment_succeeded" : "payment_failed",
      order: updatedOrder,
      shippingAddress: normalizeShippingAddress(updatedOrder.shipping_address),
      paymentMethod: (updatedOrder.payment_method ?? "credit_card_3ds") as CheckoutPaymentMethod,
      paymentStatus,
      billingInfo: updatedOrder.billing_info ? billingInfoSchema.parse(updatedOrder.billing_info) : null,
      paymentFailureReason,
    });
  }

  return {
    order: updatedOrder,
    paymentStatus,
    paymentFailureReason,
  };
}
