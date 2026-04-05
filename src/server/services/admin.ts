import { z } from "zod";
import {
  AuditLog,
  BannerCampaign,
  Category,
  Coupon,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Shipment,
  TechnicalServiceRequest,
  User,
} from "@/server/models";
import {
  ALL_ADMIN_PERMISSIONS,
  BANNER_PLACEMENTS,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  REPORT_RANGE_PRESETS,
  ROLE_PERMISSION_PRESETS,
  type AdminActor,
  type AdminDashboardData,
  type AdminOrderDetail,
  type AdminOrderListItem,
  type AdminOrderStatus,
  type AdminPermission,
  type AdminRole,
  type AdminUsersResponse,
  type AuditLogRecord,
  type BannerCampaignRecord,
  type BulkProductActionPayload,
  type BulkProductActionResult,
  type DashboardMetric,
  type DateRangeInput,
  type DistributionRow,
  type LowStockFilter,
  type LowStockProductRow,
  type ProductImportPreviewRow,
  type ProductImportResult,
  type RecentOrderSummary,
  type RecentUserSummary,
  type RevenuePoint,
  type SalesByCategoryRow,
  type SalesByProductRow,
  type SalesReportData,
  type SalesSummaryMetrics,
  type ShipmentRecordSummary,
  type TopSellingProductRow,
} from "@/lib/admin";
import { buildVariantAttributes, buildVariantOptionSignature, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";
import { parseValidDate } from "@/lib/date";
import { toPriceNumber } from "@/lib/utils";

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
  payment_reference_id?: string | null;
  payment_failure_reason?: string | null;
  payment_attempts_count?: number;
  order_status?: string;
  coupon_code?: string | null;
  admin_note?: string | null;
  shipping_address?: Record<string, unknown> | null;
  billing_info?: Record<string, unknown> | null;
  status_history?: Array<{
    status?: string;
    note?: string | null;
    changed_by_user_id?: string | null;
    created_at?: Date | string;
  }>;
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

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  type?: string;
  category_id?: string | null;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  sales_count?: number;
  starting_price?: number;
  rating_average?: number;
  rating_count?: number;
  created_at?: Date | string;
};

type ProductVariantRecord = {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  stock_alert_threshold?: number;
  images?: string[];
  is_active?: boolean;
  color_name?: string;
  color_code?: string | null;
  storage?: string;
  ram?: string | null;
  attributes?: Record<string, string> | null;
};

type UserRecord = {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  roles?: string[];
  permissions?: string[];
  is_active?: boolean;
  wishlist_product_ids?: string[];
  addresses?: unknown[];
  last_login_at?: Date | string | null;
  created_at?: Date | string;
};

type TechnicalServiceRecord = {
  id: string;
  user_id?: string | null;
  status?: string;
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

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
};

type BannerCampaignDoc = {
  id: string;
  placement: BannerCampaignRecord["placement"];
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  badge_text?: string | null;
  theme_variant?: string | null;
  trigger_type?: "delay" | "scroll" | "exit_intent" | null;
  trigger_delay_seconds?: number | null;
  trigger_scroll_percent?: number | null;
  show_once_per_session?: boolean | null;
  target_paths?: string[] | null;
  audience?: "all" | "guest" | "authenticated" | null;
  start_at?: Date | string | null;
  end_at?: Date | string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type AuditLogDoc = {
  id: string;
  actor_user_id: string;
  actor_email?: string | null;
  action_type: string;
  entity_type: string;
  entity_id?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  created_at?: Date | string;
};

const statusUpdateSchema = z.object({
  orderId: z.string().trim().min(1, "Siparis secimi zorunludur"),
  status: z.enum(ORDER_STATUS_OPTIONS),
  note: z.string().trim().max(500, "Not en fazla 500 karakter olabilir").optional().nullable(),
});

const shipmentInputSchema = z.object({
  orderId: z.string().trim().min(1, "Siparis secimi zorunludur"),
  cargoCompany: z.string().trim().min(2, "Kargo firmasi zorunludur").max(80, "Kargo firmasi en fazla 80 karakter olabilir"),
  trackingNumber: z.string().trim().min(3, "Takip numarasi zorunludur").max(120, "Takip numarasi en fazla 120 karakter olabilir"),
  status: z.enum(["preparing", "shipped", "delivered"]).default("shipped"),
});

const bulkActionSchema = z.object({
  productIds: z.array(z.string().trim().min(1)).min(1, "En az bir urun secmelisiniz"),
  action: z.enum(["set_active", "set_inactive", "set_category", "adjust_price_percentage", "set_discount_percentage", "set_stock", "set_variant_threshold"]),
  value: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
});

const bannerSchema = z.object({
  id: z.string().trim().optional(),
  placement: z.enum(BANNER_PLACEMENTS),
  title: z.string().trim().min(1, "Banner basligi zorunludur").max(120, "Banner basligi en fazla 120 karakter olabilir"),
  subtitle: z.string().trim().max(180, "Alt baslik en fazla 180 karakter olabilir").optional().nullable().or(z.literal("")),
  description: z.string().trim().max(600, "Aciklama en fazla 600 karakter olabilir").optional().nullable().or(z.literal("")),
  imageUrl: z.string().trim().url("Banner görseli gecersiz"),
  mobileImageUrl: z.string().trim().url("Mobil banner görseli gecersiz").optional().nullable().or(z.literal("")),
  ctaLabel: z.string().trim().max(50, "CTA metni en fazla 50 karakter olabilir").optional().nullable().or(z.literal("")),
  ctaHref: z.string().trim().max(255, "CTA linki en fazla 255 karakter olabilir").optional().nullable().or(z.literal("")),
  badgeText: z.string().trim().max(40, "Rozet metni en fazla 40 karakter olabilir").optional().nullable().or(z.literal("")),
  themeVariant: z.string().trim().max(40, "Tema varyanti en fazla 40 karakter olabilir").optional().nullable().or(z.literal("")),
  triggerType: z.enum(["delay", "scroll", "exit_intent"]).default("delay"),
  triggerDelaySeconds: z.coerce.number().min(0).max(120).default(4),
  triggerScrollPercent: z.coerce.number().min(0).max(100).default(40),
  showOncePerSession: z.boolean().default(true),
  targetPaths: z.array(z.string().trim().min(1)).default([]),
  audience: z.enum(["all", "guest", "authenticated"]).default("all"),
  startAt: z.string().trim().optional().nullable().or(z.literal("")),
  endAt: z.string().trim().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const userAccessSchema = z.object({
  userId: z.string().trim().min(1, "Kullanici secimi zorunludur"),
  roles: z.array(z.string().trim()).default([]),
  permissions: z.array(z.string().trim()).default([]),
  isActive: z.boolean(),
});

const importCsvSchema = z.object({
  csv: z.string().min(1, "CSV verisi zorunludur"),
  dryRun: z.boolean().default(true),
});

function toIsoString(value: string | Date | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function normalizeRange(input: DateRangeInput) {
  const now = new Date();
  const preset = REPORT_RANGE_PRESETS.includes(input.preset) ? input.preset : "30d";

  if (preset === "today") {
    return { preset, start: startOfDay(now), end: endOfDay(now) };
  }

  if (preset === "7d") {
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - 6);
    return { preset, start, end: endOfDay(now) };
  }

  if (preset === "30d") {
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - 29);
    return { preset, start, end: endOfDay(now) };
  }

  if (preset === "this_month") {
    return { preset, start: startOfMonth(now), end: endOfDay(now) };
  }

  if (preset === "last_month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { preset, start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
  }

  const start = parseValidDate(input.startDate) ?? startOfDay(now);
  const end = parseValidDate(input.endDate) ?? endOfDay(now);
  return { preset, start: startOfDay(start), end: endOfDay(end) };
}

function getRevenueEligibleOrder(order: OrderRecord) {
  return order.payment_status === "paid" && !["cancelled", "failed", "refunded"].includes(`${order.order_status ?? ""}`);
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

function getDisplayName(user: UserRecord | null | undefined) {
  const fullName = `${user?.full_name ?? ""}`.trim();
  if (fullName) {
    return fullName;
  }

  const combined = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();
  return combined || "Misafir Kullanici";
}

function formatChartLabel(date: Date, mode: "day" | "week" | "month") {
  if (mode === "month") {
    return date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
  }

  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function determineTrendMode(start: Date, end: Date) {
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 180) {
    return "month" as const;
  }
  if (diffDays > 45) {
    return "week" as const;
  }
  return "day" as const;
}

function buildTrendBuckets(start: Date, end: Date) {
  const mode = determineTrendMode(start, end);
  const buckets: RevenuePoint[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    buckets.push({ label: formatChartLabel(cursor, mode), revenue: 0, orders: 0 });
    if (mode === "month") {
      cursor.setMonth(cursor.getMonth() + 1, 1);
    } else if (mode === "week") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { buckets, mode };
}

function getBucketIndex(date: Date, start: Date, mode: "day" | "week" | "month") {
  if (mode === "month") {
    return (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
  }
  if (mode === "week") {
    return Math.floor((startOfDay(date).getTime() - startOfDay(start).getTime()) / (1000 * 60 * 60 * 24 * 7));
  }
  return Math.floor((startOfDay(date).getTime() - startOfDay(start).getTime()) / (1000 * 60 * 60 * 24));
}

function summarizeTrend(orders: OrderRecord[], start: Date, end: Date) {
  const { buckets, mode } = buildTrendBuckets(start, end);

  for (const order of orders) {
    const createdAt = parseValidDate(order.created_at);
    if (!createdAt || createdAt < start || createdAt > end) {
      continue;
    }

    const bucket = buckets[getBucketIndex(createdAt, start, mode)];
    if (!bucket) {
      continue;
    }

    bucket.orders += 1;
    if (getRevenueEligibleOrder(order)) {
      bucket.revenue += toPriceNumber(order.final_price);
    }
  }

  return buckets.map((bucket) => ({ ...bucket, revenue: Math.round(bucket.revenue) }));
}

function escapeCsv(value: unknown) {
  const normalized = `${value ?? ""}`;
  if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }
  return normalized;
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === "\"") {
      if (insideQuotes && nextChar === "\"") {
        currentField += "\"";
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField);
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function mapAuditLog(log: AuditLogDoc): AuditLogRecord {
  return {
    id: log.id,
    actorUserId: log.actor_user_id,
    actorEmail: log.actor_email ?? null,
    actionType: log.action_type,
    entityType: log.entity_type,
    entityId: log.entity_id ?? null,
    message: log.message,
    metadata: log.metadata ?? null,
    ip: log.ip ?? null,
    createdAt: toIsoString(log.created_at),
  };
}

export async function createAuditLog(input: {
  actor: AdminActor;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  await AuditLog.create({
    actor_user_id: input.actor.id,
    actor_email: input.actor.email,
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    message: input.message,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
    created_at: new Date(),
  });
}

async function getAllAdminAnalyticsSources() {
  const [orders, orderItems, products, variants, users, serviceRequests, shipments, banners, logs] = await Promise.all([
    Order.find().sort({ created_at: -1 }).lean(),
    OrderItem.find().lean(),
    Product.find().lean(),
    ProductVariant.find().lean(),
    User.find().sort({ created_at: -1 }).lean(),
    TechnicalServiceRequest.find().lean(),
    Shipment.find().lean(),
    BannerCampaign.find().lean(),
    AuditLog.find().sort({ created_at: -1 }).limit(6).lean(),
  ]);

  return {
    orders: orders as OrderRecord[],
    orderItems: orderItems as OrderItemRecord[],
    products: products as ProductRecord[],
    variants: variants as ProductVariantRecord[],
    users: users as UserRecord[],
    serviceRequests: serviceRequests as TechnicalServiceRecord[],
    shipments: shipments as ShipmentRecord[],
    banners: banners as BannerCampaignDoc[],
    logs: logs as AuditLogDoc[],
  };
}

export async function getAdminDashboardData(rangeInput: DateRangeInput = { preset: "30d" }): Promise<AdminDashboardData> {
  const now = new Date();
  const range = normalizeRange(rangeInput);
  const { orders, orderItems, products, variants, users, serviceRequests, banners, logs } = await getAllAdminAnalyticsSources();
  const lowStockProducts = await listLowStockProducts("all", 5, 6);

  const todayRange = normalizeRange({ preset: "today" });
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  const productById = new Map(products.map((product) => [product.id, product]));
  const userById = new Map(users.map((user) => [user.id, user]));
  const itemsByOrderId = new Map<string, OrderItemRecord[]>();

  orderItems.forEach((item) => {
    const bucket = itemsByOrderId.get(item.order_id) ?? [];
    bucket.push(item);
    itemsByOrderId.set(item.order_id, bucket);
  });

  const paidOrders = orders.filter((order) => getRevenueEligibleOrder(order));
  const todayRevenue = paidOrders
    .filter((order) => {
      const createdAt = parseValidDate(order.created_at);
      return createdAt ? createdAt >= todayRange.start && createdAt <= todayRange.end : false;
    })
    .reduce((sum, order) => sum + toPriceNumber(order.final_price), 0);

  const weekRevenue = paidOrders
    .filter((order) => {
      const createdAt = parseValidDate(order.created_at);
      return createdAt ? createdAt >= weekStart : false;
    })
    .reduce((sum, order) => sum + toPriceNumber(order.final_price), 0);

  const monthRevenue = paidOrders
    .filter((order) => {
      const createdAt = parseValidDate(order.created_at);
      return createdAt ? createdAt >= monthStart : false;
    })
    .reduce((sum, order) => sum + toPriceNumber(order.final_price), 0);

  const todayOrders = orders.filter((order) => {
    const createdAt = parseValidDate(order.created_at);
    return createdAt ? createdAt >= todayRange.start && createdAt <= todayRange.end : false;
  }).length;

  const pendingServiceRequests = serviceRequests.filter((request) => !["completed", "delivered"].includes(`${request.status ?? "new"}`)).length;
  const activeCampaigns = banners.filter((banner) => {
    const startAt = parseValidDate(banner.start_at ?? null);
    const endAt = parseValidDate(banner.end_at ?? null);
    return banner.is_active !== false && (!startAt || startAt <= now) && (!endAt || endAt >= now);
  }).length;

  const metrics: DashboardMetric[] = [
    { key: "todayRevenue", label: "Bugunku Ciro", value: Math.round(todayRevenue), format: "currency" },
    { key: "weekRevenue", label: "Bu Hafta", value: Math.round(weekRevenue), format: "currency" },
    { key: "monthRevenue", label: "Bu Ay", value: Math.round(monthRevenue), format: "currency" },
    { key: "totalOrders", label: "Toplam Siparis", value: orders.length, format: "number" },
    { key: "todayOrders", label: "Bugun Gelen Siparis", value: todayOrders, format: "number" },
    { key: "pendingOrders", label: "Bekleyen Siparis", value: orders.filter((order) => order.order_status === "pending").length, format: "number" },
    { key: "preparingOrders", label: "Hazirlanan Siparis", value: orders.filter((order) => order.order_status === "preparing").length, format: "number" },
    { key: "lowStockCount", label: "Dusuk Stok", value: lowStockProducts.length, format: "number" },
    { key: "activeCampaigns", label: "Aktif Kampanya", value: activeCampaigns, format: "number" },
    { key: "pendingServiceRequests", label: "Bekleyen Servis", value: pendingServiceRequests, format: "number" },
  ];

  const recentOrders: RecentOrderSummary[] = orders.slice(0, 6).map((order) => ({
    id: order.id,
    customerName: getDisplayName(order.user_id ? userById.get(order.user_id) : null),
    createdAt: toIsoString(order.created_at),
    finalPrice: toPriceNumber(order.final_price),
    paymentStatus: `${order.payment_status ?? "pending"}`,
    orderStatus: `${order.order_status ?? "pending"}`,
    itemCount: (itemsByOrderId.get(order.id) ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
  }));

  const topProductsMap = new Map<string, TopSellingProductRow>();
  orderItems.forEach((item) => {
    const order = orders.find((entry) => entry.id === item.order_id);
    if (!order || !getRevenueEligibleOrder(order)) {
      return;
    }

    const variant = variantById.get(item.variant_id);
    const product = variant ? productById.get(variant.product_id) : null;
    const key = product?.id ?? item.product_name;
    const existing = topProductsMap.get(key) ?? {
      productId: product?.id ?? null,
      productName: product?.name ?? item.product_name,
      sku: variant?.sku ?? item.variant_sku ?? null,
      quantity: 0,
      revenue: 0,
      stock: variant ? Number(variant.stock ?? 0) : null,
    };

    existing.quantity += Number(item.quantity ?? 0);
    existing.revenue += Number(item.quantity ?? 0) * toPriceNumber(item.unit_price);
    topProductsMap.set(key, existing);
  });

  const topProducts = Array.from(topProductsMap.values())
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .slice(0, 6)
    .map((row) => ({ ...row, revenue: Math.round(row.revenue) }));

  const userOrderStats = new Map<string, { orderCount: number; totalSpend: number }>();
  orders.forEach((order) => {
    if (!order.user_id) {
      return;
    }

    const stats = userOrderStats.get(order.user_id) ?? { orderCount: 0, totalSpend: 0 };
    stats.orderCount += 1;
    if (getRevenueEligibleOrder(order)) {
      stats.totalSpend += toPriceNumber(order.final_price);
    }
    userOrderStats.set(order.user_id, stats);
  });

  const recentUsers: RecentUserSummary[] = users.slice(0, 6).map((user) => ({
    id: user.id,
    fullName: getDisplayName(user),
    email: user.email,
    createdAt: toIsoString(user.created_at),
    orderCount: userOrderStats.get(user.id)?.orderCount ?? 0,
  }));

  return {
    metrics,
    revenueTrend: summarizeTrend(orders, range.start, range.end),
    orderTrend: summarizeTrend(orders, range.start, range.end),
    recentOrders,
    topProducts,
    lowStockProducts,
    recentUsers,
    recentLogs: logs.map(mapAuditLog),
  };
}

export async function getSalesReport(rangeInput: DateRangeInput): Promise<SalesReportData> {
  const range = normalizeRange(rangeInput);
  const [orders, orderItems, variants, products, categories, coupons, serviceRequests] = await Promise.all([
    Order.find({ created_at: { $gte: range.start, $lte: range.end } }).lean(),
    OrderItem.find().lean(),
    ProductVariant.find().lean(),
    Product.find().lean(),
    Category.find().lean(),
    Coupon.find().lean(),
    TechnicalServiceRequest.find({ created_at: { $gte: range.start, $lte: range.end } }).lean(),
  ]);

  const orderRecords = orders as OrderRecord[];
  const orderIds = new Set(orderRecords.map((order) => order.id));
  const filteredItems = (orderItems as OrderItemRecord[]).filter((item) => orderIds.has(item.order_id));
  const variantById = new Map((variants as ProductVariantRecord[]).map((variant) => [variant.id, variant]));
  const productById = new Map((products as ProductRecord[]).map((product) => [product.id, product]));
  const categoryById = new Map((categories as CategoryRecord[]).map((category) => [category.id, category]));

  const summary: SalesSummaryMetrics = {
    totalRevenue: Math.round(orderRecords.filter(getRevenueEligibleOrder).reduce((sum, order) => sum + toPriceNumber(order.final_price), 0)),
    totalOrders: orderRecords.length,
    averageOrderValue: 0,
    paidOrders: orderRecords.filter((order) => order.payment_status === "paid").length,
    cancelledOrders: orderRecords.filter((order) => order.order_status === "cancelled").length,
    refundedOrders: orderRecords.filter((order) => order.order_status === "refunded" || order.payment_status === "refunded").length,
  };
  summary.averageOrderValue = summary.paidOrders > 0 ? Math.round(summary.totalRevenue / summary.paidOrders) : 0;

  const paymentStatusDistribution = Array.from(
    orderRecords.reduce((map, order) => {
      const key = order.payment_status ?? "pending";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries(),
  ).map(([key, count]) => ({ key, label: PAYMENT_STATUS_LABELS[key] ?? key, count })) satisfies DistributionRow[];

  const orderStatusDistribution = Array.from(
    orderRecords.reduce((map, order) => {
      const key = order.order_status ?? "pending";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries(),
  ).map(([key, count]) => ({
    key,
    label: ORDER_STATUS_LABELS[(ORDER_STATUS_OPTIONS.includes(key as AdminOrderStatus) ? key : "pending") as AdminOrderStatus] ?? key,
    count,
  })) satisfies DistributionRow[];

  const salesByCategoryMap = new Map<string, SalesByCategoryRow>();
  const salesByProductMap = new Map<string, SalesByProductRow>();

  filteredItems.forEach((item) => {
    const order = orderRecords.find((entry) => entry.id === item.order_id);
    if (!order || !getRevenueEligibleOrder(order)) {
      return;
    }

    const variant = variantById.get(item.variant_id);
    const product = variant ? productById.get(variant.product_id) : null;
    const category = product?.category_id ? categoryById.get(product.category_id) : null;
    const lineRevenue = Number(item.quantity ?? 0) * toPriceNumber(item.unit_price);

    const categoryKey = category?.id ?? "uncategorized";
    const categoryRow = salesByCategoryMap.get(categoryKey) ?? {
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? "Kategorisiz",
      quantity: 0,
      revenue: 0,
    };
    categoryRow.quantity += Number(item.quantity ?? 0);
    categoryRow.revenue += lineRevenue;
    salesByCategoryMap.set(categoryKey, categoryRow);

    const productKey = product?.id ?? item.product_name;
    const productRow = salesByProductMap.get(productKey) ?? {
      productId: product?.id ?? null,
      productName: product?.name ?? item.product_name,
      sku: variant?.sku ?? item.variant_sku ?? null,
      quantity: 0,
      revenue: 0,
      stock: variant ? Number(variant.stock ?? 0) : null,
    };
    productRow.quantity += Number(item.quantity ?? 0);
    productRow.revenue += lineRevenue;
    salesByProductMap.set(productKey, productRow);
  });

  const couponPerformanceMap = new Map<string, { code: string; usageCount: number; revenue: number }>();
  orderRecords.forEach((order) => {
    if (!order.coupon_code) {
      return;
    }
    const couponRow = couponPerformanceMap.get(order.coupon_code) ?? {
      code: order.coupon_code,
      usageCount: 0,
      revenue: 0,
    };
    couponRow.usageCount += 1;
    if (getRevenueEligibleOrder(order)) {
      couponRow.revenue += toPriceNumber(order.final_price);
    }
    couponPerformanceMap.set(order.coupon_code, couponRow);
  });

  return {
    range: { preset: range.preset, startDate: range.start.toISOString(), endDate: range.end.toISOString() },
    summary,
    revenueTrend: summarizeTrend(orderRecords, range.start, range.end),
    orderTrend: summarizeTrend(orderRecords, range.start, range.end),
    paymentStatusDistribution,
    orderStatusDistribution,
    salesByCategory: Array.from(salesByCategoryMap.values()).map((row) => ({ ...row, revenue: Math.round(row.revenue) })).sort((a, b) => b.revenue - a.revenue),
    salesByProduct: Array.from(salesByProductMap.values()).map((row) => ({ ...row, revenue: Math.round(row.revenue) })).sort((a, b) => b.revenue - a.revenue).slice(0, 20),
    couponPerformance: Array.from(couponPerformanceMap.values()).map((row) => ({ ...row, revenue: Math.round(row.revenue) })).sort((a, b) => b.usageCount - a.usageCount),
    technicalServiceSummary: {
      pending: (serviceRequests as TechnicalServiceRecord[]).filter((request) => ["new", "pending"].includes(`${request.status ?? "new"}`)).length,
      active: (serviceRequests as TechnicalServiceRecord[]).filter((request) => !["completed", "delivered"].includes(`${request.status ?? "new"}`)).length,
      total: (serviceRequests as TechnicalServiceRecord[]).length,
    },
  };
}

export async function listLowStockProducts(filter: LowStockFilter = "all", globalThreshold = 5, limit?: number) {
  const [variants, products] = await Promise.all([ProductVariant.find({ is_active: true }).lean(), Product.find().lean()]);
  const productById = new Map((products as ProductRecord[]).map((product) => [product.id, product]));

  const rows = (variants as ProductVariantRecord[])
    .map((variant) => {
      const threshold = typeof variant.stock_alert_threshold === "number" ? variant.stock_alert_threshold : globalThreshold;
      const stock = Number(variant.stock ?? 0);
      if (stock > threshold) {
        return null;
      }

      const status: LowStockProductRow["status"] = stock <= 0 ? "out_of_stock" : "critical";
      if (filter === "critical" && status !== "critical") {
        return null;
      }
      if (filter === "out_of_stock" && status !== "out_of_stock") {
        return null;
      }

      const product = productById.get(variant.product_id);
      const normalizedVariant = normalizeProductVariants([variant])[0];

      return {
        productId: variant.product_id,
        productName: product?.name ?? "Bilinmeyen Ürün",
        productSlug: product?.slug ?? "",
        variantId: variant.id,
        sku: variant.sku,
        variantLabel: getVariantLabel(normalizedVariant),
        stock,
        threshold,
        status,
      } satisfies LowStockProductRow;
    })
    .filter((row): row is LowStockProductRow => Boolean(row))
    .sort((left, right) => left.stock - right.stock || left.productName.localeCompare(right.productName, "tr"));

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export async function listAdminOrders(input: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
}) {
  const safePage = Math.max(1, input.page ?? 1);
  const safeLimit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const search = `${input.search ?? ""}`.trim();
  const query: Record<string, unknown> = {};

  if (input.status && input.status !== "all") {
    query.order_status = input.status;
  }
  if (input.paymentStatus && input.paymentStatus !== "all") {
    query.payment_status = input.paymentStatus;
  }

  let orders = (await Order.find(query).sort({ created_at: -1 }).lean()) as OrderRecord[];

  if (search) {
    const users = (await User.find({
      $or: [
        { email: { $regex: search, $options: "i" } },
        { full_name: { $regex: search, $options: "i" } },
      ],
    }).lean()) as UserRecord[];
    const matchedUserIds = new Set(users.map((user) => user.id));

    orders = orders.filter((order) => order.id.includes(search) || (order.user_id ? matchedUserIds.has(order.user_id) : false));
  }

  const total = orders.length;
  const pagedOrders = orders.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  const [users, items, shipments] = await Promise.all([
    User.find({ id: { $in: pagedOrders.map((order) => order.user_id).filter(Boolean) } }).lean(),
    OrderItem.find({ order_id: { $in: pagedOrders.map((order) => order.id) } }).lean(),
    Shipment.find({ order_id: { $in: pagedOrders.map((order) => order.id) } }).lean(),
  ]);

  const userById = new Map((users as UserRecord[]).map((user) => [user.id, user]));
  const itemCountByOrderId = new Map<string, number>();
  const shipmentByOrderId = new Map<string, ShipmentRecord>();

  (items as OrderItemRecord[]).forEach((item) => {
    itemCountByOrderId.set(item.order_id, (itemCountByOrderId.get(item.order_id) ?? 0) + Number(item.quantity ?? 0));
  });

  (shipments as ShipmentRecord[]).forEach((shipment) => {
    shipmentByOrderId.set(shipment.order_id, shipment);
  });

  return {
    items: pagedOrders.map<AdminOrderListItem>((order) => {
      const user = order.user_id ? userById.get(order.user_id) : null;
      const shipment = shipmentByOrderId.get(order.id);

      return {
        id: order.id,
        customerName: getDisplayName(user),
        customerEmail: user?.email ?? null,
          createdAt: toIsoString(order.created_at),
          finalPrice: toPriceNumber(order.final_price),
          paymentStatus: `${order.payment_status ?? "pending"}`,
          paymentMethod: `${order.payment_method ?? "credit_card_3ds"}`,
          orderStatus: `${order.order_status ?? "pending"}`,
          itemCount: itemCountByOrderId.get(order.id) ?? 0,
          shipmentTrackingNumber: shipment?.tracking_number ?? null,
        shipmentCompany: shipment?.cargo_company ?? null,
      };
    }),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail> {
  const order = (await Order.findOne({ id: orderId }).lean()) as OrderRecord | null;
  if (!order) {
    throw new Error("Siparis bulunamadi");
  }

  const [user, items, shipment] = await Promise.all([
    order.user_id ? User.findOne({ id: order.user_id }).lean() : Promise.resolve(null),
    OrderItem.find({ order_id: order.id }).sort({ created_at: 1 }).lean(),
    Shipment.findOne({ order_id: order.id }).sort({ updated_at: -1 }).lean(),
  ]);

  const normalizedShipment: ShipmentRecordSummary | null = shipment
    ? {
        id: (shipment as ShipmentRecord).id,
        cargoCompany: (shipment as ShipmentRecord).cargo_company ?? null,
        trackingNumber: (shipment as ShipmentRecord).tracking_number ?? null,
        trackingUrl: buildTrackingUrl((shipment as ShipmentRecord).cargo_company, (shipment as ShipmentRecord).tracking_number),
        status: `${(shipment as ShipmentRecord).status ?? "preparing"}`,
        createdAt: toIsoString((shipment as ShipmentRecord).created_at),
        updatedAt: toIsoString((shipment as ShipmentRecord).updated_at),
      }
    : null;

  return {
    id: order.id,
    customerName: getDisplayName(user as UserRecord | null),
    customerEmail: (user as UserRecord | null)?.email ?? null,
    createdAt: toIsoString(order.created_at),
    totalPrice: toPriceNumber(order.total_price),
    discount: toPriceNumber(order.discount),
    shippingPrice: toPriceNumber(order.shipping_price),
      finalPrice: toPriceNumber(order.final_price),
      paymentProvider: `${order.payment_provider ?? "iyzico"}`,
      paymentStatus: `${order.payment_status ?? "pending"}`,
      paymentMethod: `${order.payment_method ?? "credit_card_3ds"}`,
      paymentReferenceId: order.payment_reference_id ?? null,
      paymentFailureReason: order.payment_failure_reason ?? null,
      paymentAttemptsCount: Number(order.payment_attempts_count ?? 0),
      orderStatus: `${order.order_status ?? "pending"}`,
      adminNote: order.admin_note ?? null,
      couponCode: order.coupon_code ?? null,
      shippingAddress: (order.shipping_address as Record<string, unknown> | null) ?? null,
      billingInfo: (order.billing_info as Record<string, unknown> | null) ?? null,
      items: (items as OrderItemRecord[]).map((item) => ({
      id: item.id,
      productName: item.product_name,
      variantInfo: item.variant_info ?? null,
      variantSku: item.variant_sku ?? null,
      variantImage: item.variant_image ?? null,
      quantity: Number(item.quantity ?? 0),
      unitPrice: toPriceNumber(item.unit_price),
      lineTotal: Number(item.quantity ?? 0) * toPriceNumber(item.unit_price),
    })),
    shipment: normalizedShipment,
    statusHistory: (order.status_history ?? []).map((entry) => ({
      status: (ORDER_STATUS_OPTIONS.includes(`${entry.status ?? "pending"}` as AdminOrderStatus)
        ? `${entry.status ?? "pending"}`
        : "pending") as AdminOrderStatus,
      note: entry.note ?? null,
      changedByUserId: entry.changed_by_user_id ?? null,
      createdAt: toIsoString(entry.created_at),
    })),
  };
}

export async function updateAdminOrderStatus(
  input: z.input<typeof statusUpdateSchema>,
  actor: AdminActor,
  ip?: string | null,
) {
  const payload = statusUpdateSchema.parse(input);
  const order = await Order.findOne({ id: payload.orderId });
  if (!order) {
    throw new Error("Siparis bulunamadi");
  }

  await Order.updateOne(
    { id: payload.orderId },
    {
      $set: {
        order_status: payload.status,
        admin_note: payload.note ?? null,
        updated_at: new Date(),
      },
      $push: {
        status_history: {
          status: payload.status,
          note: payload.note ?? null,
          changed_by_user_id: actor.id,
          created_at: new Date(),
        },
      },
    },
  );

  await createAuditLog({
    actor,
    actionType: "order.status_updated",
    entityType: "order",
    entityId: payload.orderId,
    message: `Siparis durumu ${payload.status} olarak guncellendi`,
    metadata: { status: payload.status, note: payload.note ?? null },
    ip,
  });

  return getAdminOrderDetail(payload.orderId);
}

export async function upsertShipmentRecord(
  input: z.input<typeof shipmentInputSchema>,
  actor: AdminActor,
  ip?: string | null,
) {
  const payload = shipmentInputSchema.parse(input);
  const order = await Order.findOne({ id: payload.orderId }).lean();
  if (!order) {
    throw new Error("Siparis bulunamadi");
  }

  const now = new Date();
  const existingShipment = await Shipment.findOne({ order_id: payload.orderId });
  if (existingShipment) {
    existingShipment.cargo_company = payload.cargoCompany;
    existingShipment.tracking_number = payload.trackingNumber;
    existingShipment.status = payload.status;
    existingShipment.updated_at = now;
    await existingShipment.save();
  } else {
    await Shipment.create({
      order_id: payload.orderId,
      cargo_company: payload.cargoCompany,
      tracking_number: payload.trackingNumber,
      status: payload.status,
      created_at: now,
      updated_at: now,
    });
  }

  const nextOrderStatus = payload.status === "delivered" ? "delivered" : "shipped";
  await Order.updateOne(
    { id: payload.orderId },
    {
      $set: {
        order_status: nextOrderStatus,
        updated_at: now,
      },
      $push: {
        status_history: {
          status: nextOrderStatus,
          note: `${payload.cargoCompany} - ${payload.trackingNumber}`,
          changed_by_user_id: actor.id,
          created_at: now,
        },
      },
    },
  );

  await createAuditLog({
    actor,
    actionType: "shipment.upserted",
    entityType: "shipment",
    entityId: payload.orderId,
    message: "Kargo takip bilgisi kaydedildi",
    metadata: {
      cargoCompany: payload.cargoCompany,
      trackingNumber: payload.trackingNumber,
      status: payload.status,
    },
    ip,
  });

  return getAdminOrderDetail(payload.orderId);
}

async function recalculateStartingPrices(productIds: string[]) {
  if (productIds.length === 0) {
    return;
  }

  const variants = (await ProductVariant.find({ product_id: { $in: productIds } }).lean()) as ProductVariantRecord[];
  const variantsByProductId = new Map<string, ProductVariantRecord[]>();
  variants.forEach((variant) => {
    const bucket = variantsByProductId.get(variant.product_id) ?? [];
    bucket.push(variant);
    variantsByProductId.set(variant.product_id, bucket);
  });

  await Promise.all(
    productIds.map(async (productId) => {
      const rows = variantsByProductId.get(productId) ?? [];
      const active = rows.filter((variant) => variant.is_active !== false);
      const source = active.length > 0 ? active : rows;
      const startingPrice = source.length > 0 ? Math.min(...source.map((variant) => toPriceNumber(variant.price))) : 0;
      await Product.updateOne({ id: productId }, { $set: { starting_price: startingPrice, updated_at: new Date() } });
    }),
  );
}

export async function performBulkProductAction(
  input: BulkProductActionPayload,
  actor: AdminActor,
  ip?: string | null,
): Promise<BulkProductActionResult> {
  const payload = bulkActionSchema.parse(input);
  const products = (await Product.find({ id: { $in: payload.productIds } }).lean()) as ProductRecord[];
  if (products.length === 0) {
    throw new Error("Secilen urunler bulunamadi");
  }

  const productIds = products.map((product) => product.id);
  let updatedProducts = 0;
  let updatedVariants = 0;

  switch (payload.action) {
    case "set_active":
    case "set_inactive": {
      const nextActive = payload.action === "set_active";
      const productResult = await Product.updateMany({ id: { $in: productIds } }, { $set: { is_active: nextActive, updated_at: new Date() } });
      const variantResult = await ProductVariant.updateMany({ product_id: { $in: productIds } }, { $set: { is_active: nextActive, updated_at: new Date() } });
      updatedProducts = productResult.modifiedCount;
      updatedVariants = variantResult.modifiedCount;
      break;
    }
    case "set_category": {
      const result = await Product.updateMany({ id: { $in: productIds } }, { $set: { category_id: `${payload.value ?? ""}`.trim() || null, updated_at: new Date() } });
      updatedProducts = result.modifiedCount;
      break;
    }
    case "adjust_price_percentage":
    case "set_discount_percentage": {
      const percentage = Number(payload.value ?? 0);
      const variants = await ProductVariant.find({ product_id: { $in: productIds } });
      for (const variant of variants) {
        const currentPrice = toPriceNumber(variant.price);
        if (payload.action === "adjust_price_percentage") {
          variant.price = Math.max(0, Number((currentPrice * (1 + percentage / 100)).toFixed(2)));
        } else {
          variant.compare_at_price = currentPrice;
          variant.price = Math.max(0, Number((currentPrice * (1 - percentage / 100)).toFixed(2)));
        }
        variant.updated_at = new Date();
        await variant.save();
      }
      updatedVariants = variants.length;
      await recalculateStartingPrices(productIds);
      updatedProducts = productIds.length;
      break;
    }
    case "set_stock":
    case "set_variant_threshold": {
      const field = payload.action === "set_stock" ? "stock" : "stock_alert_threshold";
      const numericValue = Math.max(0, Math.floor(Number(payload.value ?? 0)));
      const result = await ProductVariant.updateMany(
        { product_id: { $in: productIds } },
        { $set: { [field]: numericValue, updated_at: new Date() } },
      );
      updatedVariants = result.modifiedCount;
      updatedProducts = productIds.length;
      break;
    }
  }

  await createAuditLog({
    actor,
    actionType: "product.bulk_action",
    entityType: "product",
    entityId: null,
    message: `Toplu urun islemi uygulandi: ${payload.action}`,
    metadata: {
      productIds,
      action: payload.action,
      value: payload.value ?? null,
      updatedProducts,
      updatedVariants,
    },
    ip,
  });

  return {
    updatedProducts,
    updatedVariants,
    skippedProducts: payload.productIds.filter((id) => !productIds.includes(id)),
    message: "Toplu urun islemi tamamlandi",
  };
}

export async function exportProductsCsv() {
  const [products, variants, categories] = await Promise.all([
    Product.find().sort({ created_at: -1 }).lean(),
    ProductVariant.find().sort({ product_id: 1, sort_order: 1 }).lean(),
    Category.find().lean(),
  ]);

  const categoryById = new Map((categories as CategoryRecord[]).map((category) => [category.id, category]));
  const variantsByProductId = new Map<string, ProductVariantRecord[]>();
  (variants as ProductVariantRecord[]).forEach((variant) => {
    const bucket = variantsByProductId.get(variant.product_id) ?? [];
    bucket.push(variant);
    variantsByProductId.set(variant.product_id, bucket);
  });

  const headers = [
    "product_name",
    "slug",
    "brand",
    "type",
    "category_slug",
    "description",
    "is_active",
    "is_featured",
    "product_images",
    "color_name",
    "color_code",
    "storage",
    "ram",
    "sku",
    "price",
    "compare_at_price",
    "stock",
    "stock_alert_threshold",
    "variant_images",
  ];

  const lines = [headers.join(",")];
  (products as ProductRecord[]).forEach((product) => {
    const category = product.category_id ? categoryById.get(product.category_id) : null;
    const rows = variantsByProductId.get(product.id) ?? [];

    rows.forEach((variant) => {
      lines.push(
        [
          product.name,
          product.slug,
          product.brand ?? "",
          product.type ?? "accessory",
          category?.slug ?? "",
          product.description ?? "",
          product.is_active !== false ? "true" : "false",
          product.is_featured === true ? "true" : "false",
          (product.images ?? []).join("|"),
          variant.color_name ?? "",
          variant.color_code ?? "",
          variant.storage ?? "",
          variant.ram ?? "",
          variant.sku,
          toPriceNumber(variant.price),
          variant.compare_at_price ?? "",
          Number(variant.stock ?? 0),
          typeof variant.stock_alert_threshold === "number" ? variant.stock_alert_threshold : 5,
          (variant.images ?? []).join("|"),
        ]
          .map((value) => escapeCsv(value))
          .join(","),
      );
    });
  });

  return lines.join("\n");
}

export async function importProductsCsv(
  input: z.input<typeof importCsvSchema>,
  actor: AdminActor,
  ip?: string | null,
): Promise<ProductImportResult> {
  const payload = importCsvSchema.parse(input);
  const rows = parseCsvRows(payload.csv);

  if (rows.length < 2) {
    throw new Error("CSV dosyasinda veri bulunamadi");
  }

  const [headerRow, ...dataRows] = rows;
  const headerMap = new Map(headerRow.map((header, index) => [header.trim(), index]));

  for (const requiredHeader of ["product_name", "sku", "price", "stock"]) {
    if (!headerMap.has(requiredHeader)) {
      throw new Error(`CSV icinde zorunlu alan eksik: ${requiredHeader}`);
    }
  }

  const categories = (await Category.find().lean()) as CategoryRecord[];
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const previewRows: ProductImportPreviewRow[] = [];
  let createdProducts = 0;
  let updatedProducts = 0;
  let updatedVariants = 0;
  let failedRows = 0;
  const touchedProductIds = new Set<string>();

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    const rowNumber = index + 2;
    const read = (header: string) => `${row[headerMap.get(header) ?? -1] ?? ""}`.trim();

    const productName = read("product_name");
    const slug = read("slug");
    const brand = read("brand");
    const type = read("type") || "accessory";
    const categorySlug = read("category_slug");
    const description = read("description");
    const isActive = read("is_active") !== "false";
    const isFeatured = read("is_featured") === "true";
    const productImages = read("product_images").split("|").map((value) => value.trim()).filter(Boolean);
    const colorName = read("color_name") || "Standart";
    const colorCode = read("color_code") || null;
    const storage = read("storage") || "Standart";
    const ram = read("ram") || null;
    const sku = read("sku").toLocaleUpperCase("en-US");
    const price = Number(read("price"));
    const compareAtPrice = read("compare_at_price") ? Number(read("compare_at_price")) : null;
    const stock = Number(read("stock"));
    const stockAlertThreshold = read("stock_alert_threshold") ? Number(read("stock_alert_threshold")) : 5;
    const variantImages = read("variant_images").split("|").map((value) => value.trim()).filter(Boolean);

    if (!productName || !sku || !Number.isFinite(price) || !Number.isFinite(stock)) {
      previewRows.push({
        rowNumber,
        sku,
        productName,
        status: "invalid",
        message: "Zorunlu alanlar eksik veya sayisal alanlar gecersiz",
      });
      failedRows += 1;
      continue;
    }

    const category = categorySlug ? categoriesBySlug.get(categorySlug) : null;
    const existingVariant = (await ProductVariant.findOne({ sku }).lean()) as ProductVariantRecord | null;
    previewRows.push({
      rowNumber,
      sku,
      productName,
      status: existingVariant ? "update" : "create",
      message: existingVariant ? "Varyant SKU uzerinden guncellenecek" : "Yeni varyant olusturulacak",
    });

    if (payload.dryRun) {
      continue;
    }

    let product: ProductRecord | null = null;
    if (existingVariant) {
      product = (await Product.findOne({ id: existingVariant.product_id }).lean()) as ProductRecord | null;
    } else if (slug) {
      product = (await Product.findOne({ slug }).lean()) as ProductRecord | null;
    }

    if (!product) {
      const createdProduct = await Product.create({
        name: productName,
        slug: slug || `${productName}`.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        brand,
        type,
        category_id: category?.id ?? null,
        description,
        is_active: isActive,
        is_featured: isFeatured,
        images: productImages,
        created_at: new Date(),
        updated_at: new Date(),
      });
      product = createdProduct.toObject() as ProductRecord;
      createdProducts += 1;
    } else {
      await Product.updateOne(
        { id: product.id },
        {
          $set: {
            name: productName,
            brand,
            type,
            category_id: category?.id ?? product.category_id ?? null,
            description,
            is_active: isActive,
            is_featured: isFeatured,
            images: productImages.length > 0 ? productImages : product.images ?? [],
            updated_at: new Date(),
          },
        },
      );
      updatedProducts += 1;
    }

    if (existingVariant) {
      await ProductVariant.updateOne(
        { id: existingVariant.id },
        {
          $set: {
            color_name: colorName,
            color_code: colorCode,
            storage,
            ram,
            option_signature: buildVariantOptionSignature({ colorName, storage, ram }),
            attributes: buildVariantAttributes({ colorName, storage, ram }),
            price,
            compare_at_price: compareAtPrice,
            stock,
            stock_alert_threshold: stockAlertThreshold,
            images: variantImages,
            is_active: isActive,
            updated_at: new Date(),
          },
        },
      );
      updatedVariants += 1;
      touchedProductIds.add(existingVariant.product_id);
    } else if (product) {
      await ProductVariant.create({
        product_id: product.id,
        sku,
        color_name: colorName,
        color_code: colorCode,
        storage,
        ram,
        option_signature: buildVariantOptionSignature({ colorName, storage, ram }),
        attributes: buildVariantAttributes({ colorName, storage, ram }),
        price,
        compare_at_price: compareAtPrice,
        stock,
        stock_alert_threshold: stockAlertThreshold,
        images: variantImages,
        is_active: isActive,
        sort_order: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
      updatedVariants += 1;
      touchedProductIds.add(product.id);
    }
  }

  if (!payload.dryRun) {
    await recalculateStartingPrices(Array.from(touchedProductIds));
    await createAuditLog({
      actor,
      actionType: "product.import_csv",
      entityType: "product",
      entityId: null,
      message: "CSV urun ice aktarma tamamlandi",
      metadata: { createdProducts, updatedProducts, updatedVariants, failedRows },
      ip,
    });
  }

  return { dryRun: payload.dryRun, createdProducts, updatedProducts, updatedVariants, failedRows, rows: previewRows };
}

function mapBannerRecord(banner: BannerCampaignDoc): BannerCampaignRecord {
  return {
    id: banner.id,
    placement: banner.placement,
    title: banner.title,
    subtitle: banner.subtitle ?? null,
    description: banner.description ?? null,
    imageUrl: banner.image_url,
    mobileImageUrl: banner.mobile_image_url ?? null,
    ctaLabel: banner.cta_label ?? null,
    ctaHref: banner.cta_href ?? null,
    badgeText: banner.badge_text ?? null,
    themeVariant: banner.theme_variant ?? null,
    triggerType: banner.trigger_type ?? "delay",
    triggerDelaySeconds: Number(banner.trigger_delay_seconds ?? 4),
    triggerScrollPercent: Number(banner.trigger_scroll_percent ?? 40),
    showOncePerSession: banner.show_once_per_session !== false,
    targetPaths: Array.isArray(banner.target_paths) ? banner.target_paths : [],
    audience: banner.audience ?? "all",
    startAt: banner.start_at ? toIsoString(banner.start_at) : null,
    endAt: banner.end_at ? toIsoString(banner.end_at) : null,
    isActive: banner.is_active !== false,
    sortOrder: Number(banner.sort_order ?? 0),
    createdAt: toIsoString(banner.created_at),
    updatedAt: toIsoString(banner.updated_at),
  };
}

export async function listBannerCampaigns() {
  const banners = (await BannerCampaign.find().sort({ placement: 1, sort_order: 1, created_at: -1 }).lean()) as BannerCampaignDoc[];
  return banners.map(mapBannerRecord);
}

export async function upsertBannerCampaign(
  input: z.input<typeof bannerSchema>,
  actor: AdminActor,
  ip?: string | null,
) {
  const payload = bannerSchema.parse(input);
  const now = new Date();
  const updatePayload = {
    placement: payload.placement,
    title: payload.title,
    subtitle: payload.subtitle || null,
    description: payload.description || null,
    image_url: payload.imageUrl,
    mobile_image_url: payload.mobileImageUrl || null,
    cta_label: payload.ctaLabel || null,
    cta_href: payload.ctaHref || null,
    badge_text: payload.badgeText || null,
    theme_variant: payload.themeVariant || null,
    trigger_type: payload.triggerType,
    trigger_delay_seconds: payload.triggerDelaySeconds,
    trigger_scroll_percent: payload.triggerScrollPercent,
    show_once_per_session: payload.showOncePerSession,
    target_paths: payload.targetPaths,
    audience: payload.audience,
    start_at: payload.startAt ? new Date(payload.startAt) : null,
    end_at: payload.endAt ? new Date(payload.endAt) : null,
    is_active: payload.isActive,
    sort_order: payload.sortOrder,
    updated_at: now,
  };

  let entityId: string | null = payload.id ?? null;
  if (payload.id) {
    await BannerCampaign.updateOne({ id: payload.id }, { $set: updatePayload });
  } else {
    const created = await BannerCampaign.create({ ...updatePayload, created_at: now });
    entityId = created.id as string;
  }

  await createAuditLog({
    actor,
    actionType: payload.id ? "banner.updated" : "banner.created",
    entityType: "banner_campaign",
    entityId,
    message: payload.id ? "Banner guncellendi" : "Banner olusturuldu",
    metadata: { placement: payload.placement, title: payload.title, isActive: payload.isActive },
    ip,
  });

  return listBannerCampaigns();
}

export async function deleteBannerCampaign(id: string, actor: AdminActor, ip?: string | null) {
  const banner = await BannerCampaign.findOne({ id }).lean();
  if (!banner) {
    throw new Error("Banner bulunamadi");
  }

  await BannerCampaign.deleteOne({ id });
  await createAuditLog({
    actor,
    actionType: "banner.deleted",
    entityType: "banner_campaign",
    entityId: id,
    message: "Banner silindi",
    metadata: { title: (banner as BannerCampaignDoc).title, placement: (banner as BannerCampaignDoc).placement },
    ip,
  });

  return { deleted: true };
}

export async function listAdminUsers(input: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
}): Promise<AdminUsersResponse> {
  const safePage = Math.max(1, input.page ?? 1);
  const safeLimit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const search = `${input.search ?? ""}`.trim();
  const query: Record<string, unknown> = {};

  if (input.status === "active") {
    query.is_active = true;
  }
  if (input.status === "inactive") {
    query.is_active = false;
  }
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { full_name: { $regex: search, $options: "i" } },
      { first_name: { $regex: search, $options: "i" } },
      { last_name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = (await User.find(query).sort({ created_at: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean()) as UserRecord[];
  const userIds = users.map((user) => user.id);

  const [orders, serviceRequests] = await Promise.all([
    Order.find({ user_id: { $in: userIds } }).lean(),
    TechnicalServiceRequest.find({ user_id: { $in: userIds } }).lean(),
  ]);

  const orderStats = new Map<string, { orderCount: number; totalSpend: number }>();
  (orders as OrderRecord[]).forEach((order) => {
    if (!order.user_id) {
      return;
    }
    const stats = orderStats.get(order.user_id) ?? { orderCount: 0, totalSpend: 0 };
    stats.orderCount += 1;
    if (getRevenueEligibleOrder(order)) {
      stats.totalSpend += toPriceNumber(order.final_price);
    }
    orderStats.set(order.user_id, stats);
  });

  const technicalServiceCounts = new Map<string, number>();
  (serviceRequests as TechnicalServiceRecord[]).forEach((request) => {
    if (!request.user_id) {
      return;
    }
    technicalServiceCounts.set(request.user_id, (technicalServiceCounts.get(request.user_id) ?? 0) + 1);
  });

  return {
    items: users.map((user) => {
      const stats = orderStats.get(user.id) ?? { orderCount: 0, totalSpend: 0 };
      return {
        id: user.id,
        fullName: getDisplayName(user),
        email: user.email,
        phone: user.phone || null,
        roles: Array.isArray(user.roles) ? user.roles : [],
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        isActive: user.is_active !== false,
        createdAt: toIsoString(user.created_at),
        lastLoginAt: user.last_login_at ? toIsoString(user.last_login_at) : null,
        orderCount: stats.orderCount,
        totalSpend: Math.round(stats.totalSpend),
        addressCount: Array.isArray(user.addresses) ? user.addresses.length : 0,
        favoriteCount: Array.isArray(user.wishlist_product_ids) ? user.wishlist_product_ids.length : 0,
        technicalServiceCount: technicalServiceCounts.get(user.id) ?? 0,
      };
    }),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function updateAdminUserAccess(
  input: z.input<typeof userAccessSchema>,
  actor: AdminActor,
  ip?: string | null,
) {
  const payload = userAccessSchema.parse(input);
  const allowedRoles = new Set<AdminRole | "customer">(["customer", ...(Object.keys(ROLE_PERMISSION_PRESETS) as AdminRole[])]);
  const roles = Array.from(new Set(payload.roles.filter((role) => allowedRoles.has(role as AdminRole | "customer"))));
  const permissions = Array.from(
    new Set(payload.permissions.filter((permission) => ALL_ADMIN_PERMISSIONS.includes(permission as AdminPermission))),
  );

  const targetUser = await User.findOne({ id: payload.userId }).lean();
  if (!targetUser) {
    throw new Error("Kullanici bulunamadi");
  }

  await User.updateOne(
    { id: payload.userId },
    {
      $set: {
        roles,
        permissions,
        is_active: payload.isActive,
        updated_at: new Date(),
      },
    },
  );

  await createAuditLog({
    actor,
    actionType: "user.access_updated",
    entityType: "user",
    entityId: payload.userId,
    message: "Kullanici rol ve yetkileri guncellendi",
    metadata: { roles, permissions, isActive: payload.isActive },
    ip,
  });

  return { updated: true };
}

export async function listAuditLogs(input: {
  page?: number;
  limit?: number;
  actorUserId?: string;
  actionType?: string;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const safePage = Math.max(1, input.page ?? 1);
  const safeLimit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const query: Record<string, unknown> = {};

  if (input.actorUserId) {
    query.actor_user_id = input.actorUserId;
  }
  if (input.actionType && input.actionType !== "all") {
    query.action_type = input.actionType;
  }

  const startDate = parseValidDate(input.startDate ?? null);
  const endDate = parseValidDate(input.endDate ?? null);
  if (startDate || endDate) {
    query.created_at = {
      ...(startDate ? { $gte: startOfDay(startDate) } : {}),
      ...(endDate ? { $lte: endOfDay(endDate) } : {}),
    };
  }

  const total = await AuditLog.countDocuments(query);
  const logs = (await AuditLog.find(query)
    .sort({ created_at: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .lean()) as AuditLogDoc[];

  return {
    items: logs.map(mapAuditLog),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export function getRoleAndPermissionMatrix() {
  return {
    roles: Object.entries(ROLE_PERMISSION_PRESETS).map(([role, permissions]) => ({
      role,
      permissions,
    })),
    permissions: ALL_ADMIN_PERMISSIONS.map((permission) => ({
      id: permission,
      label: permission,
    })),
  };
}

