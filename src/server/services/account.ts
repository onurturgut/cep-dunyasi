import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { SessionUser } from "@/server/auth-session";
import { Order, OrderItem, ReturnRequest, Shipment, TechnicalServiceRequest, User } from "@/server/models";
import {
  canCreateReturnRequest,
  formatAddressSummary,
  getOrderTimeline,
  type AccountAddress,
  type AccountProfile,
  type AccountStatCards,
  type MyOrderDetail,
  type MyOrderSummary,
  type ReturnRequestRecord,
  type ShipmentSummary,
  type TechnicalServiceHistoryItem,
} from "@/lib/account";
import { ensureUserMarketingProfile } from "@/server/services/marketing";
import { listWishlist, toggleWishlist } from "@/server/services/wishlist";
import { toPriceNumber } from "@/lib/utils";

const communicationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Ad zorunludur").max(60, "Ad en fazla 60 karakter olabilir"),
  lastName: z.string().trim().min(1, "Soyad zorunludur").max(60, "Soyad en fazla 60 karakter olabilir"),
  phone: z.string().trim().max(20, "Telefon en fazla 20 karakter olabilir").optional().default(""),
  profileImageUrl: z.string().trim().url("Profil gorseli gecersiz").optional().or(z.literal("")).nullable(),
  communicationPreferences: communicationPreferencesSchema.default({ email: true, sms: false }),
});

export const addressInputSchema = z.object({
  id: z.string().trim().optional(),
  title: z.string().trim().min(1, "Adres basligi zorunludur").max(40, "Adres basligi en fazla 40 karakter olabilir"),
  full_name: z.string().trim().min(3, "Ad soyad zorunludur").max(120, "Ad soyad en fazla 120 karakter olabilir"),
  phone: z.string().trim().min(10, "Telefon zorunludur").max(20, "Telefon en fazla 20 karakter olabilir"),
  city: z.string().trim().min(2, "Sehir zorunludur").max(80, "Sehir en fazla 80 karakter olabilir"),
  district: z.string().trim().min(2, "Ilce zorunludur").max(80, "Ilce en fazla 80 karakter olabilir"),
  neighborhood: z.string().trim().min(2, "Mahalle zorunludur").max(120, "Mahalle en fazla 120 karakter olabilir"),
  address_line: z.string().trim().min(8, "Adres detayi zorunludur").max(500, "Adres en fazla 500 karakter olabilir"),
  postal_code: z.string().trim().max(20, "Posta kodu en fazla 20 karakter olabilir").optional().default(""),
  is_default: z.boolean().optional().default(false),
});

export const setDefaultAddressSchema = z.object({
  addressId: z.string().trim().min(1, "Adres secimi zorunludur"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut sifrenizi girin"),
    newPassword: z
      .string()
      .min(8, "Yeni sifre en az 8 karakter olmali")
      .max(128, "Yeni sifre en fazla 128 karakter olabilir")
      .regex(/[A-Z]/, "Yeni sifrede en az bir buyuk harf olmali")
      .regex(/[a-z]/, "Yeni sifrede en az bir kucuk harf olmali")
      .regex(/\d/, "Yeni sifrede en az bir rakam olmali"),
    confirmPassword: z.string().min(1, "Yeni sifre tekrari zorunludur"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Yeni sifreler eslesmiyor",
  });

export const createReturnRequestSchema = z.object({
  orderId: z.string().trim().min(1, "Siparis secimi zorunludur"),
  orderItemId: z.string().trim().min(1, "Urun secimi zorunludur"),
  requestType: z.enum(["return", "exchange"]),
  reasonCode: z.string().trim().min(1, "Bir neden secin"),
  reasonText: z.string().trim().min(5, "Aciklama en az 5 karakter olmali").max(1500, "Aciklama en fazla 1500 karakter olabilir"),
  images: z.array(z.string().trim().url("Gecersiz gorsel")).max(4, "En fazla 4 gorsel yukleyebilirsiniz").optional().default([]),
});

type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_image_url?: string | null;
  communication_preferences?: { email?: boolean; sms?: boolean } | null;
  roles?: string[];
  wishlist_product_ids?: string[];
  loyalty_points_balance?: number;
  referral_code?: string | null;
  referred_by?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  addresses?: Array<Record<string, unknown>>;
};

type OrderRecord = {
  id: string;
  user_id: string | null;
  total_price?: number;
  discount?: number;
  shipping_price?: number;
  final_price?: number;
  payment_status?: string;
  payment_provider?: string;
  payment_method?: string;
  payment_failure_reason?: string | null;
  payment_attempts_count?: number;
  is_retryable_payment?: boolean;
  order_status?: string;
  shipping_address?: Record<string, unknown> | null;
  billing_info?: Record<string, unknown> | null;
  coupon_code?: string | null;
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
  created_at?: Date | string;
};

type ShipmentRecord = {
  id: string;
  order_id: string;
  cargo_company?: string | null;
  tracking_number?: string | null;
  status?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type ReturnRequestDoc = {
  id: string;
  user_id: string;
  order_id: string;
  order_item_id: string;
  product_name: string;
  variant_info?: string | null;
  request_type: "return" | "exchange";
  reason_code: string;
  reason_text: string;
  images?: string[];
  status: "pending" | "approved" | "rejected" | "completed";
  admin_note?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type TechnicalServiceRecord = {
  id: string;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number: string;
  phone_model: string;
  issue_description: string;
  photo_url?: string;
  photo_name?: string;
  status?: string;
  admin_note?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};

function requireSessionUser(sessionUser: SessionUser | null) {
  if (!sessionUser?.id) {
    throw new Error("Bu islem icin giris yapmaniz gerekiyor");
  }

  return sessionUser;
}

function toIsoString(value: string | Date | undefined | null) {
  if (!value) {
    return new Date(0).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function buildTrackingUrl(cargoCompany: string | null | undefined, trackingNumber: string | null | undefined) {
  const company = `${cargoCompany ?? ""}`.trim().toLocaleLowerCase("tr-TR");
  const tracking = `${trackingNumber ?? ""}`.trim();

  if (!tracking) {
    return null;
  }

  if (company.includes("yurtici")) {
    return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(tracking)}`;
  }

  if (company.includes("aras")) {
    return `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${encodeURIComponent(tracking)}`;
  }

  if (company.includes("mng")) {
    return `https://www.mngkargo.com.tr/track/${encodeURIComponent(tracking)}`;
  }

  if (company.includes("ptt")) {
    return `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${encodeURIComponent(tracking)}`;
  }

  return null;
}

function normalizeAddress(address: Record<string, unknown>): AccountAddress {
  return {
    id: `${address.id ?? ""}`.trim(),
    title: `${address.title ?? ""}`.trim(),
    full_name: `${address.full_name ?? ""}`.trim(),
    phone: `${address.phone ?? ""}`.trim(),
    city: `${address.city ?? ""}`.trim(),
    district: `${address.district ?? ""}`.trim(),
    neighborhood: `${address.neighborhood ?? ""}`.trim(),
    address_line: `${address.address_line ?? ""}`.trim(),
    postal_code: `${address.postal_code ?? ""}`.trim(),
    is_default: Boolean(address.is_default),
    created_at: toIsoString(address.created_at as string | Date | undefined),
    updated_at: toIsoString(address.updated_at as string | Date | undefined),
  };
}

function sortAddresses(addresses: AccountAddress[]) {
  return [...addresses].sort((left, right) => {
    if (left.is_default === right.is_default) {
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    }

    return left.is_default ? -1 : 1;
  });
}

function ensureDefaultAddress(addresses: AccountAddress[]) {
  if (addresses.length === 0) {
    return addresses;
  }

  if (addresses.some((address) => address.is_default)) {
    return addresses;
  }

  return addresses.map((address, index) => ({
    ...address,
    is_default: index === 0,
  }));
}

function toProfile(user: UserRecord): AccountProfile {
  const addresses = ensureDefaultAddress(sortAddresses((user.addresses ?? []).map((address) => normalizeAddress(address))));

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    phone: user.phone || "",
    profile_image_url: user.profile_image_url || null,
    communication_preferences: {
      email: user.communication_preferences?.email !== false,
      sms: Boolean(user.communication_preferences?.sms),
    },
    loyalty_points_balance: Number(user.loyalty_points_balance ?? 0),
    referral_code: user.referral_code ?? null,
    referred_by: user.referred_by ?? null,
    created_at: toIsoString(user.created_at),
    updated_at: toIsoString(user.updated_at),
    addresses,
  };
}

async function findUserBySession(sessionUser: SessionUser) {
  const user = (await User.findOne({ id: sessionUser.id }).lean()) as UserRecord | null;

  if (!user) {
    throw new Error("Kullanici bulunamadi");
  }

  return user;
}

async function updateUserAddresses(userId: string, addresses: AccountAddress[]) {
  const nextAddresses = ensureDefaultAddress(addresses).map((address) => ({
    ...address,
    created_at: new Date(address.created_at),
    updated_at: new Date(address.updated_at),
  }));

  await User.updateOne(
    { id: userId },
    {
      $set: {
        addresses: nextAddresses,
        updated_at: new Date(),
      },
    },
  );

  return sortAddresses(ensureDefaultAddress(nextAddresses.map((address) => normalizeAddress(address as unknown as Record<string, unknown>))));
}

export function sanitizeSessionPayload(
  user: AccountProfile & { roles?: string[]; permissions?: string[]; is_active?: boolean },
  fallbackRoles?: string[],
  fallbackPermissions?: string[],
) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    roles: user.roles ?? fallbackRoles ?? ["customer"],
    permissions: user.permissions ?? fallbackPermissions ?? [],
    is_active: user.is_active !== false,
  };
}

export async function getAccountProfile(sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  await ensureUserMarketingProfile(currentUser.id);
  const user = await findUserBySession(currentUser);
  const profile = toProfile(user);

  const [orderCount, returnCount, technicalServiceCount] = await Promise.all([
    Order.countDocuments({ user_id: currentUser.id }),
    ReturnRequest.countDocuments({ user_id: currentUser.id }),
    TechnicalServiceRequest.countDocuments({
      $or: [
        { user_id: currentUser.id },
        ...(profile.phone ? [{ user_id: null, phone_number: profile.phone }] : []),
      ],
      status: { $nin: ["delivered", "completed"] },
    }),
  ]);

  const stats: AccountStatCards = {
    order_count: orderCount,
    favorite_count: Array.isArray(user.wishlist_product_ids) ? user.wishlist_product_ids.length : 0,
    active_technical_service_count: technicalServiceCount,
    address_count: profile.addresses.length,
    return_request_count: returnCount,
  };

  return {
    profile,
    stats,
  };
}

export async function updateAccountProfile(input: z.input<typeof profileUpdateSchema>, sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const payload = profileUpdateSchema.parse(input);
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();

  await User.updateOne(
    { id: currentUser.id },
    {
      $set: {
        full_name: fullName,
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone: payload.phone,
        profile_image_url: payload.profileImageUrl || null,
        communication_preferences: payload.communicationPreferences,
        updated_at: new Date(),
      },
    },
  );

  const user = await findUserBySession(currentUser);
  const profile = toProfile(user);

  return {
    profile,
    stats: {
      order_count: await Order.countDocuments({ user_id: currentUser.id }),
      favorite_count: Array.isArray(user.wishlist_product_ids) ? user.wishlist_product_ids.length : 0,
      active_technical_service_count: await TechnicalServiceRequest.countDocuments({
        $or: [
          { user_id: currentUser.id },
          ...(profile.phone ? [{ user_id: null, phone_number: profile.phone }] : []),
        ],
        status: { $nin: ["delivered", "completed"] },
      }),
      address_count: profile.addresses.length,
      return_request_count: await ReturnRequest.countDocuments({ user_id: currentUser.id }),
    } satisfies AccountStatCards,
  };
}

export async function listAddresses(sessionUser: SessionUser | null) {
  const { profile } = await getAccountProfile(sessionUser);
  return profile.addresses;
}

export async function createAddress(input: z.input<typeof addressInputSchema>, sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const user = await findUserBySession(currentUser);
  const payload = addressInputSchema.parse(input);
  const now = new Date().toISOString();
  const nextAddressId = randomUUID();
  const existingAddresses = sortAddresses((user.addresses ?? []).map((address) => normalizeAddress(address)));
  const shouldBeDefault = payload.is_default || existingAddresses.length === 0;
  const newAddress: AccountAddress = {
    id: nextAddressId,
    title: payload.title,
    full_name: payload.full_name,
    phone: payload.phone,
    city: payload.city,
    district: payload.district,
    neighborhood: payload.neighborhood,
    address_line: payload.address_line,
    postal_code: payload.postal_code,
    created_at: now,
    updated_at: now,
    is_default: shouldBeDefault,
  };

  const nextAddresses = ensureDefaultAddress([
    ...existingAddresses.map((address) => ({
      ...address,
      is_default: shouldBeDefault ? false : address.is_default,
    })),
    newAddress,
  ]);

  return updateUserAddresses(currentUser.id, nextAddresses);
}

export async function updateAddress(input: z.input<typeof addressInputSchema>, sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const user = await findUserBySession(currentUser);
  const payload = addressInputSchema.extend({ id: z.string().trim().min(1, "Adres secimi zorunludur") }).parse(input);
  const existingAddresses = sortAddresses((user.addresses ?? []).map((address) => normalizeAddress(address)));

  if (!existingAddresses.some((address) => address.id === payload.id)) {
    throw new Error("Adres bulunamadi");
  }

  const updatedAddresses = existingAddresses.map((address) =>
    address.id === payload.id
      ? {
          ...address,
          ...payload,
          updated_at: new Date().toISOString(),
        }
      : {
          ...address,
          is_default: payload.is_default ? false : address.is_default,
        },
  );

  return updateUserAddresses(currentUser.id, updatedAddresses);
}

export async function deleteAddress(addressId: string, sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const user = await findUserBySession(currentUser);
  const existingAddresses = sortAddresses((user.addresses ?? []).map((address) => normalizeAddress(address)));

  if (!existingAddresses.some((address) => address.id === addressId)) {
    throw new Error("Adres bulunamadi");
  }

  const remainingAddresses = existingAddresses.filter((address) => address.id !== addressId);
  return updateUserAddresses(currentUser.id, remainingAddresses);
}

export async function setDefaultAddress(input: z.input<typeof setDefaultAddressSchema>, sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const user = await findUserBySession(currentUser);
  const payload = setDefaultAddressSchema.parse(input);
  const existingAddresses = sortAddresses((user.addresses ?? []).map((address) => normalizeAddress(address)));

  if (!existingAddresses.some((address) => address.id === payload.addressId)) {
    throw new Error("Adres bulunamadi");
  }

  const updatedAddresses = existingAddresses.map((address) => ({
    ...address,
    is_default: address.id === payload.addressId,
    updated_at: address.id === payload.addressId ? new Date().toISOString() : address.updated_at,
  }));

  return updateUserAddresses(currentUser.id, updatedAddresses);
}

export async function listMyOrders(sessionUser: SessionUser | null, page = 1, limit = 10) {
  const currentUser = requireSessionUser(sessionUser);
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const skip = (safePage - 1) * safeLimit;

  const [orders, total] = await Promise.all([
    Order.find({ user_id: currentUser.id }).sort({ created_at: -1 }).skip(skip).limit(safeLimit).lean(),
    Order.countDocuments({ user_id: currentUser.id }),
  ]);

  const orderRecords = orders as OrderRecord[];
  const orderIds = orderRecords.map((order) => order.id);
  const items = (await OrderItem.find({ order_id: { $in: orderIds } }).sort({ created_at: 1 }).lean()) as OrderItemRecord[];
  const itemsByOrderId = new Map<string, OrderItemRecord[]>();

  items.forEach((item) => {
    const bucket = itemsByOrderId.get(item.order_id) ?? [];
    bucket.push(item);
    itemsByOrderId.set(item.order_id, bucket);
  });

  const result: MyOrderSummary[] = orderRecords.map((order) => {
    const orderItems = itemsByOrderId.get(order.id) ?? [];

    return {
      id: order.id,
      created_at: toIsoString(order.created_at),
      total_price: toPriceNumber(order.total_price),
      discount: toPriceNumber(order.discount),
        shipping_price: toPriceNumber(order.shipping_price),
        final_price: toPriceNumber(order.final_price),
        payment_status: `${order.payment_status ?? "pending"}`,
        payment_provider: `${order.payment_provider ?? "iyzico"}`,
        payment_method: `${order.payment_method ?? "credit_card_3ds"}`,
        order_status: `${order.order_status ?? "pending"}`,
        item_count: orderItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
        items_preview: orderItems.slice(0, 3).map((item) => ({
        id: item.id,
        product_name: item.product_name,
        variant_info: item.variant_info ?? null,
        variant_image: item.variant_image ?? null,
        quantity: Number(item.quantity ?? 0),
        unit_price: toPriceNumber(item.unit_price),
      })),
    };
  });

  return {
    items: result,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

function normalizeShipment(shipment: ShipmentRecord | null): ShipmentSummary | null {
  if (!shipment) {
    return null;
  }

  return {
    id: shipment.id,
    cargo_company: shipment.cargo_company ?? null,
    tracking_number: shipment.tracking_number ?? null,
    status: `${shipment.status ?? "preparing"}`,
    tracking_url: buildTrackingUrl(shipment.cargo_company, shipment.tracking_number),
    created_at: toIsoString(shipment.created_at),
    updated_at: toIsoString(shipment.updated_at),
  };
}

export async function getMyOrderDetail(orderId: string, sessionUser: SessionUser | null): Promise<MyOrderDetail> {
  const currentUser = requireSessionUser(sessionUser);

  const order = (await Order.findOne({ id: orderId, user_id: currentUser.id }).lean()) as OrderRecord | null;

  if (!order) {
    throw new Error("Siparis bulunamadi");
  }

  const [items, shipment, returnRequests] = await Promise.all([
    OrderItem.find({ order_id: order.id }).sort({ created_at: 1 }).lean(),
    Shipment.findOne({ order_id: order.id }).sort({ updated_at: -1 }).lean(),
    ReturnRequest.find({ user_id: currentUser.id, order_id: order.id }).lean(),
  ]);

  const returnRequestsByItemId = new Map<string, ReturnRequestDoc>();
  (returnRequests as ReturnRequestDoc[]).forEach((request) => {
    returnRequestsByItemId.set(request.order_item_id, request);
  });

  const normalizedShipment = normalizeShipment(shipment as ShipmentRecord | null);

  return {
    id: order.id,
    created_at: toIsoString(order.created_at),
    total_price: toPriceNumber(order.total_price),
    discount: toPriceNumber(order.discount),
      shipping_price: toPriceNumber(order.shipping_price),
      final_price: toPriceNumber(order.final_price),
      payment_status: `${order.payment_status ?? "pending"}`,
      payment_provider: `${order.payment_provider ?? "iyzico"}`,
      payment_method: `${order.payment_method ?? "credit_card_3ds"}`,
      payment_failure_reason: order.payment_failure_reason ?? null,
      payment_attempts_count: Number(order.payment_attempts_count ?? 0),
      is_retryable_payment: order.is_retryable_payment !== false,
      order_status: `${order.order_status ?? "pending"}`,
      shipping_address: (order.shipping_address as Record<string, string> | null) ?? null,
      billing_info: (order.billing_info as Record<string, unknown> | null) ?? null,
      coupon_code: order.coupon_code ?? null,
    items: (items as OrderItemRecord[]).map((item) => ({
      id: item.id,
      variant_id: item.variant_id,
      variant_sku: item.variant_sku ?? null,
      variant_attributes: item.variant_attributes ?? null,
      variant_image: item.variant_image ?? null,
      product_name: item.product_name,
      variant_info: item.variant_info ?? null,
      quantity: Number(item.quantity ?? 0),
      unit_price: toPriceNumber(item.unit_price),
      line_total: toPriceNumber(item.unit_price) * Number(item.quantity ?? 0),
      return_request_id: returnRequestsByItemId.get(item.id)?.id ?? null,
    })),
    shipment: normalizedShipment,
    timeline: getOrderTimeline(`${order.order_status ?? "pending"}`, normalizedShipment?.status),
  };
}

export async function listMyReturnRequests(sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const requests = (await ReturnRequest.find({ user_id: currentUser.id }).sort({ created_at: -1 }).lean()) as ReturnRequestDoc[];

  return requests.map<ReturnRequestRecord>((request) => ({
    id: request.id,
    user_id: request.user_id,
    order_id: request.order_id,
    order_item_id: request.order_item_id,
    product_name: request.product_name,
    variant_info: request.variant_info ?? null,
    request_type: request.request_type,
    reason_code: request.reason_code,
    reason_text: request.reason_text,
    images: Array.isArray(request.images) ? request.images : [],
    status: request.status,
    admin_note: request.admin_note ?? null,
    created_at: toIsoString(request.created_at),
    updated_at: toIsoString(request.updated_at),
  }));
}

export async function createReturnRequest(input: z.input<typeof createReturnRequestSchema>, sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const payload = createReturnRequestSchema.parse(input);
  const order = (await Order.findOne({ id: payload.orderId, user_id: currentUser.id }).lean()) as OrderRecord | null;

  if (!order) {
    throw new Error("Siparis bulunamadi");
  }

  const shipment = (await Shipment.findOne({ order_id: order.id }).sort({ updated_at: -1 }).lean()) as ShipmentRecord | null;

  if (!canCreateReturnRequest(`${order.order_status ?? "pending"}`, shipment?.status)) {
    throw new Error("Bu siparis icin iade veya degisim talebi olusturulamiyor");
  }

  const orderItem = (await OrderItem.findOne({ id: payload.orderItemId, order_id: order.id }).lean()) as OrderItemRecord | null;

  if (!orderItem) {
    throw new Error("Siparis kalemi bulunamadi");
  }

  const existing = await ReturnRequest.findOne({ user_id: currentUser.id, order_item_id: orderItem.id }).lean();

  if (existing) {
    throw new Error("Bu urun icin zaten bir iade veya degisim talebi olusturuldu");
  }

  const now = new Date();
  const created = (await ReturnRequest.create({
    user_id: currentUser.id,
    order_id: order.id,
    order_item_id: orderItem.id,
    product_name: orderItem.product_name,
    variant_info: orderItem.variant_info ?? null,
    request_type: payload.requestType,
    reason_code: payload.reasonCode,
    reason_text: payload.reasonText,
    images: payload.images,
    status: "pending",
    admin_note: null,
    created_at: now,
    updated_at: now,
  })) as ReturnRequestDoc;

  return {
    id: created.id,
    order_id: created.order_id,
  };
}

export async function listMyFavorites(sessionUser: SessionUser | null) {
  return listWishlist(sessionUser);
}

export async function toggleMyFavorite(productId: string, sessionUser: SessionUser | null) {
  return toggleWishlist({ productId }, sessionUser);
}

export async function listMyTechnicalServiceRequests(sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const user = await findUserBySession(currentUser);
  const phone = `${user.phone ?? ""}`.trim();

  const requests = (await TechnicalServiceRequest.find({
    $or: [
      { user_id: currentUser.id },
      ...(phone ? [{ user_id: null, phone_number: phone }] : []),
    ],
  })
    .sort({ created_at: -1 })
    .lean()) as TechnicalServiceRecord[];

  return requests.map<TechnicalServiceHistoryItem>((request) => ({
    id: request.id,
    first_name: request.first_name,
    last_name: request.last_name,
    email: request.email || "",
    phone_number: request.phone_number,
    phone_model: request.phone_model,
    issue_description: request.issue_description,
    photo_url: request.photo_url || "",
    photo_name: request.photo_name || "",
    status: request.status || "new",
    admin_note: request.admin_note ?? null,
    created_at: toIsoString(request.created_at),
    updated_at: toIsoString(request.updated_at),
  }));
}

export async function changePassword(input: z.input<typeof changePasswordSchema>, sessionUser: SessionUser | null) {
  const currentUser = requireSessionUser(sessionUser);
  const payload = changePasswordSchema.parse(input);
  const user = await findUserBySession(currentUser);
  const isValidPassword = await bcrypt.compare(payload.currentPassword, user.password_hash);

  if (!isValidPassword) {
    throw new Error("Mevcut sifreniz dogrulanamadi");
  }

  if (payload.currentPassword === payload.newPassword) {
    throw new Error("Yeni sifre mevcut sifre ile ayni olamaz");
  }

  const passwordHash = await bcrypt.hash(payload.newPassword, 10);
  await User.updateOne(
    { id: currentUser.id },
    {
      $set: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
    },
  );

  return {
    changed: true,
  };
}

export async function getAddressUsageSummary(sessionUser: SessionUser | null) {
  const addresses = await listAddresses(sessionUser);

  return {
    total: addresses.length,
    defaultAddressLabel: addresses.find((address) => address.is_default)?.title || null,
    addressSummaries: addresses.map((address) => ({
      id: address.id,
      label: `${address.title} - ${formatAddressSummary(address)}`,
    })),
  };
}
