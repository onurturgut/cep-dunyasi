import { z } from "zod";
import { buildInstallmentOptions, type InstallmentOption } from "@/lib/product-detail";

export const CHECKOUT_PAYMENT_METHODS = [
  "credit_card_3ds",
  "bank_transfer",
  "cash_on_delivery",
  "pay_at_store",
] as const;

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export const PAYMENT_STATUS_VALUES = [
  "pending",
  "requires_action",
  "paid",
  "failed",
  "cancelled",
  "refunded",
] as const;

export type OrderPaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const ORDER_STATUS_VALUES = [
  "pending",
  "awaiting_transfer",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
] as const;

export type CheckoutOrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const PAYMENT_METHOD_LABELS: Record<CheckoutPaymentMethod, string> = {
  credit_card_3ds: "Kredi / Banka Karti (3D Secure)",
  bank_transfer: "Havale / EFT",
  cash_on_delivery: "Kapıda Ödeme",
  pay_at_store: "Mağazada Ödeme",
};

export const PAYMENT_METHOD_DESCRIPTIONS: Record<CheckoutPaymentMethod, string> = {
  credit_card_3ds: "iyzico güvenli ödeme sayfasına yönlendirilerek 3D Secure ile tahsil edilir.",
  bank_transfer: "Sipariş alınır, havale bilgileri gösterilir ve ödeme sonrası operasyon ekibi onaylar.",
  cash_on_delivery: "Sipariş teslim edilirken ödeme alınır. Bölge ve ürün uygunluğuna göre açılır.",
  pay_at_store: "Siparişiniz hazırlanır, mağazada teslim alırken ödemeyi tamamlarsınız.",
};

export const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  pending: "Beklemede",
  requires_action: "İşlem Bekleniyor",
  paid: "Ödendi",
  failed: "Başarısız",
  cancelled: "İptal Edildi",
  refunded: "İade Edildi",
};

export const CHECKOUT_ORDER_STATUS_LABELS: Record<CheckoutOrderStatus, string> = {
  pending: "Beklemede",
  awaiting_transfer: "Havale Bekleniyor",
  confirmed: "Onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
  refunded: "İade Edildi",
  failed: "Başarısız",
};

export const CHECKOUT_NOTIFICATION_EVENTS = [
  "order_created",
  "payment_succeeded",
  "payment_failed",
  "awaiting_transfer",
  "shipment_updated",
  "delivered",
] as const;

export type CheckoutNotificationEvent = (typeof CHECKOUT_NOTIFICATION_EVENTS)[number];

export type CheckoutInstallmentOption = InstallmentOption & {
  isHighlighted: boolean;
};

const trimmedString = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, message);

export function sanitizeCheckoutPhone(value: string) {
  return `${value ?? ""}`.replace(/\D/g, "").slice(0, 11);
}

export function sanitizeIdentityNumber(value: string) {
  return `${value ?? ""}`.replace(/\D/g, "").slice(0, 11);
}

const phoneStringSchema = z
  .string()
  .trim()
  .transform((value) => sanitizeCheckoutPhone(value))
  .refine((value) => value.length >= 10 && value.length <= 11, "Telefon 10 veya 11 haneli olmalıdır");

const identityNumberSchema = z
  .string()
  .trim()
  .transform((value) => sanitizeIdentityNumber(value))
  .refine((value) => value === "" || value.length === 11, "TC kimlik numarası 11 haneli olmalıdır");

export const shippingAddressSchema = z.object({
  fullName: trimmedString(3, 120, "Ad soyad zorunludur"),
  email: z.string().trim().email("Geçerli bir e-posta girin"),
  phone: phoneStringSchema,
  addressTitle: z.string().trim().max(40, "Adres başlığı en fazla 40 karakter olabilir").optional().default(""),
  city: trimmedString(2, 80, "Şehir zorunludur"),
  district: trimmedString(2, 80, "İlçe zorunludur"),
  neighborhood: z.string().trim().max(120, "Mahalle en fazla 120 karakter olabilir").optional().default(""),
  addressLine: trimmedString(8, 500, "Adres detayı zorunludur"),
  postalCode: z.string().trim().max(20, "Posta kodu en fazla 20 karakter olabilir").optional().default(""),
});

const commonBillingShape = {
  useShippingAddressAsBilling: z.boolean().default(true),
  billingFullName: trimmedString(3, 120, "Fatura adı zorunludur"),
  billingPhone: phoneStringSchema,
  billingEmail: z.string().trim().email("Geçerli bir fatura e-postası girin"),
  billingAddressTitle: z.string().trim().max(40, "Fatura adres başlığı en fazla 40 karakter olabilir").optional().default(""),
  billingCity: trimmedString(2, 80, "Fatura şehri zorunludur"),
  billingDistrict: trimmedString(2, 80, "Fatura ilçesi zorunludur"),
  billingNeighborhood: z.string().trim().max(120, "Fatura mahallesi en fazla 120 karakter olabilir").optional().default(""),
  billingAddressLine: trimmedString(8, 500, "Fatura adresi zorunludur"),
  billingPostalCode: z.string().trim().max(20, "Fatura posta kodu en fazla 20 karakter olabilir").optional().default(""),
};

export const individualBillingInfoSchema = z.object({
  invoiceType: z.literal("individual"),
  ...commonBillingShape,
  identityNumber: identityNumberSchema.optional().default(""),
});

export const corporateBillingInfoSchema = z.object({
  invoiceType: z.literal("corporate"),
  ...commonBillingShape,
  companyName: trimmedString(2, 160, "Firma adi zorunludur"),
  taxOffice: trimmedString(2, 120, "Vergi dairesi zorunludur"),
  taxNumber: z
    .string()
    .trim()
    .min(10, "Vergi numarasi en az 10 karakter olmali")
    .max(14, "Vergi numarasi en fazla 14 karakter olabilir"),
  authorizedPerson: z.string().trim().max(120, "Yetkili kisi en fazla 120 karakter olabilir").optional().default(""),
});

export const billingInfoSchema = z.discriminatedUnion("invoiceType", [
  individualBillingInfoSchema,
  corporateBillingInfoSchema,
]);

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type BillingInfoInput = z.infer<typeof billingInfoSchema>;

export const checkoutItemSchema = z.object({
  variantId: z.string().trim().min(1, "Varyant secimi zorunludur"),
  quantity: z.coerce.number().int().min(1, "Adet en az 1 olmalidir").max(99, "Adet en fazla 99 olabilir"),
});

export const checkoutStartSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Sepet bos"),
  shippingAddress: shippingAddressSchema,
  billingInfo: billingInfoSchema,
  couponCode: z.string().trim().max(40, "Kupon kodu en fazla 40 karakter olabilir").optional().default(""),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS).default("credit_card_3ds"),
  installmentMonths: z.coerce.number().int().min(1).max(12).optional().default(1),
  origin: z.string().trim().url().optional(),
});

export const retryPaymentSchema = z.object({
  orderId: z.string().trim().min(1, "Siparis secimi zorunludur"),
  retryToken: z.string().trim().optional(),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS).optional().default("credit_card_3ds"),
  installmentMonths: z.coerce.number().int().min(1).max(12).optional().default(1),
});

export const installmentPreviewSchema = z.object({
  amount: z.coerce.number().positive("Tutar sifirdan buyuk olmalidir"),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS).default("credit_card_3ds"),
});

export const couponPreviewSchema = z.object({
  couponCode: z.string().trim().max(40, "Kupon kodu en fazla 40 karakter olabilir").optional().default(""),
  subtotal: z.coerce.number().min(0, "Ara toplam gecersiz"),
});

export type CheckoutStartInput = z.infer<typeof checkoutStartSchema>;
export type RetryPaymentInput = z.infer<typeof retryPaymentSchema>;
export type InstallmentPreviewInput = z.infer<typeof installmentPreviewSchema>;
export type CouponPreviewInput = z.infer<typeof couponPreviewSchema>;

export type CheckoutPaymentMethodConfig = {
  method: CheckoutPaymentMethod;
  label: string;
  description: string;
  enabled: boolean;
  requiresAction: boolean;
  supportsInstallments: boolean;
  badge?: string;
};

export type CheckoutStartResult = {
  orderId: string;
  finalPrice: number;
  paymentMethod: CheckoutPaymentMethod;
  paymentProvider: string;
  paymentStatus: OrderPaymentStatus;
  orderStatus: CheckoutOrderStatus;
  paymentPageUrl?: string;
  redirectUrl?: string;
  retryToken?: string | null;
  bankTransferInstructions?: {
    accountHolder: string;
    iban: string;
    bankName: string;
    branchName?: string | null;
    description: string;
  } | null;
};

export type OrderPaymentStatusResponse = {
  orderId: string;
  createdAt: string;
  finalPrice: number;
  paymentStatus: OrderPaymentStatus;
  orderStatus: string;
  paymentMethod: CheckoutPaymentMethod;
  paymentProvider: string;
  paymentFailureReason: string | null;
  paymentAttemptsCount: number;
  lastPaymentAttemptAt: string | null;
  isRetryablePayment: boolean;
  retryToken: string | null;
  bankTransferInstructions?: CheckoutStartResult["bankTransferInstructions"];
  notificationSummary?: {
    email: string | null;
    sms: string | null;
  } | null;
};

export function copyShippingAddressToBilling(
  shippingAddress: ShippingAddressInput,
  currentBillingInfo: BillingInfoInput,
): BillingInfoInput {
  const sharedFields = {
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
  };

  if (currentBillingInfo.invoiceType === "corporate") {
    return {
      ...currentBillingInfo,
      ...sharedFields,
      authorizedPerson: currentBillingInfo.authorizedPerson || shippingAddress.fullName,
    };
  }

  return {
    ...currentBillingInfo,
    ...sharedFields,
  };
}

export function getEnabledCheckoutPaymentMethods(): CheckoutPaymentMethodConfig[] {
  const enableBankTransfer = process.env.NEXT_PUBLIC_ENABLE_BANK_TRANSFER !== "false";
  const enableCashOnDelivery = process.env.NEXT_PUBLIC_ENABLE_CASH_ON_DELIVERY === "true";
  const enablePayAtStore = process.env.NEXT_PUBLIC_ENABLE_PAY_AT_STORE === "true";
  const methods: CheckoutPaymentMethodConfig[] = [
    {
      method: "credit_card_3ds",
      label: PAYMENT_METHOD_LABELS.credit_card_3ds,
      description: PAYMENT_METHOD_DESCRIPTIONS.credit_card_3ds,
      enabled: true,
      requiresAction: true,
      supportsInstallments: true,
      badge: "Onerilen",
    },
    {
      method: "bank_transfer",
      label: PAYMENT_METHOD_LABELS.bank_transfer,
      description: PAYMENT_METHOD_DESCRIPTIONS.bank_transfer,
      enabled: enableBankTransfer,
      requiresAction: false,
      supportsInstallments: false,
    },
    {
      method: "cash_on_delivery",
      label: PAYMENT_METHOD_LABELS.cash_on_delivery,
      description: PAYMENT_METHOD_DESCRIPTIONS.cash_on_delivery,
      enabled: enableCashOnDelivery,
      requiresAction: false,
      supportsInstallments: false,
    },
    {
      method: "pay_at_store",
      label: PAYMENT_METHOD_LABELS.pay_at_store,
      description: PAYMENT_METHOD_DESCRIPTIONS.pay_at_store,
      enabled: enablePayAtStore,
      requiresAction: false,
      supportsInstallments: false,
    },
  ];

  return methods.filter((item) => item.enabled);
}

export function getPaymentMethodConfig(method: CheckoutPaymentMethod) {
  return (
    getEnabledCheckoutPaymentMethods().find((item) => item.method === method) ?? {
      method,
      label: PAYMENT_METHOD_LABELS[method],
      description: PAYMENT_METHOD_DESCRIPTIONS[method],
      enabled: method === "credit_card_3ds",
      requiresAction: method === "credit_card_3ds",
      supportsInstallments: method === "credit_card_3ds",
    }
  );
}

export function buildCheckoutInstallmentPreview(
  amount: number,
  paymentMethod: CheckoutPaymentMethod,
  commissionOverrides?: Partial<Record<number, number>>,
): CheckoutInstallmentOption[] {
  if (paymentMethod !== "credit_card_3ds") {
    return [];
  }

  const options = buildInstallmentOptions(amount, commissionOverrides);
  const highlightedMonths = amount >= 25000 ? 6 : amount >= 10000 ? 3 : 2;

  return options.map((option) => ({
    ...option,
    isHighlighted: option.months === highlightedMonths,
  }));
}

export function sanitizeRetryToken(value: string | null | undefined) {
  return `${value ?? ""}`.trim() || null;
}
