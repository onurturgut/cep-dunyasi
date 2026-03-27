export type CommunicationPreferences = {
  email: boolean;
  sms: boolean;
};

export type AccountAddress = {
  id: string;
  title: string;
  full_name: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  address_line: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type AccountProfile = {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_image_url: string | null;
  communication_preferences: CommunicationPreferences;
  created_at: string;
  updated_at: string;
  addresses: AccountAddress[];
};

export type AccountStatCards = {
  order_count: number;
  favorite_count: number;
  active_technical_service_count: number;
  address_count: number;
  return_request_count: number;
};

export type FavoriteProductSummary = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images: string[];
  created_at?: string | Date;
  sales_count?: number;
  rating_average?: number;
  rating_count?: number;
  second_hand?: import("@/lib/second-hand").SecondHandDetails | null;
  specs?: {
    operatingSystem?: string | null;
    internalStorage?: string | null;
    ram?: string | null;
    frontCamera?: string | null;
    rearCamera?: string | null;
  } | null;
  categories?: {
    name?: string;
    slug?: string;
  } | null;
  product_variants: Array<Record<string, unknown>>;
};

export type OrderPreviewItem = {
  id: string;
  product_name: string;
  variant_info: string | null;
  variant_image: string | null;
  quantity: number;
  unit_price: number;
};

export type ShipmentSummary = {
  id: string;
  cargo_company: string | null;
  tracking_number: string | null;
  status: string;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
};

export type MyOrderSummary = {
  id: string;
  created_at: string;
  total_price: number;
  discount: number;
  shipping_price: number;
  final_price: number;
  payment_status: string;
  payment_provider: string;
  order_status: string;
  item_count: number;
  items_preview: OrderPreviewItem[];
};

export type OrderTimelineStep = {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
};

export type MyOrderItemDetail = {
  id: string;
  variant_id: string;
  variant_sku: string | null;
  variant_attributes: Record<string, unknown> | null;
  variant_image: string | null;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  return_request_id: string | null;
};

export type MyOrderDetail = {
  id: string;
  created_at: string;
  total_price: number;
  discount: number;
  shipping_price: number;
  final_price: number;
  payment_status: string;
  payment_provider: string;
  order_status: string;
  shipping_address: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  } | null;
  coupon_code: string | null;
  items: MyOrderItemDetail[];
  shipment: ShipmentSummary | null;
  timeline: OrderTimelineStep[];
};

export type ReturnRequestType = "return" | "exchange";
export type ReturnRequestStatus = "pending" | "approved" | "rejected" | "completed";

export type ReturnRequestRecord = {
  id: string;
  user_id: string;
  order_id: string;
  order_item_id: string;
  product_name: string;
  variant_info: string | null;
  request_type: ReturnRequestType;
  reason_code: string;
  reason_text: string;
  images: string[];
  status: ReturnRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type TechnicalServiceHistoryItem = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone_model: string;
  issue_description: string;
  photo_url: string;
  photo_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export const ACCOUNT_NAV_ITEMS = [
  { label: "Genel Bakis", href: "/account" },
  { label: "Profil Bilgileri", href: "/account/profile" },
  { label: "Adreslerim", href: "/account/addresses" },
  { label: "Siparislerim", href: "/account/orders" },
  { label: "Favorilerim", href: "/account/favorites" },
  { label: "Iade / Degisim", href: "/account/returns" },
  { label: "Teknik Servis", href: "/account/technical-service" },
  { label: "Guvenlik", href: "/account/security" },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandi",
  processing: "Hazirlaniyor",
  preparing: "Hazirlaniyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "Iptal",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede",
  success: "Odendi",
  paid: "Odendi",
  failed: "Basarisiz",
};

export const RETURN_STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  pending: "Inceleniyor",
  approved: "Onaylandi",
  rejected: "Reddedildi",
  completed: "Tamamlandi",
};

export const TECHNICAL_SERVICE_STATUS_LABELS: Record<string, string> = {
  new: "Alindi",
  reviewing: "Inceleniyor",
  repairing: "Tamirde",
  ready: "Hazir",
  delivered: "Teslim Edildi",
};

export function formatAddressSummary(address: AccountAddress) {
  return `${address.neighborhood}, ${address.district} / ${address.city}`;
}

export function getOrderTimeline(orderStatus: string, shipmentStatus?: string | null): OrderTimelineStep[] {
  const resolvedStatus = shipmentStatus || orderStatus;
  const activeIndex =
    resolvedStatus === "delivered"
      ? 3
      : resolvedStatus === "shipped"
        ? 2
        : resolvedStatus === "processing" || resolvedStatus === "preparing"
          ? 1
          : 0;

  return [
    { key: "pending", label: "Alindi", completed: activeIndex >= 0, active: activeIndex === 0 },
    { key: "processing", label: "Hazirlaniyor", completed: activeIndex >= 1, active: activeIndex === 1 },
    { key: "shipped", label: "Kargoya Verildi", completed: activeIndex >= 2, active: activeIndex === 2 },
    { key: "delivered", label: "Teslim Edildi", completed: activeIndex >= 3, active: activeIndex === 3 },
  ];
}

export function canCreateReturnRequest(orderStatus: string, shipmentStatus?: string | null) {
  return orderStatus === "delivered" || shipmentStatus === "delivered";
}

export function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score, label: "Zayif", value: 30 };
  }

  if (score <= 4) {
    return { score, label: "Orta", value: 65 };
  }

  return { score, label: "Guclu", value: 100 };
}

export function sanitizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").slice(0, 16);
}
