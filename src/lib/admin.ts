export const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "editor",
  "order_manager",
  "support_manager",
  "inventory_manager",
  "marketing_manager",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSION_LABELS = {
  manage_products: "Urun Yonetimi",
  manage_orders: "Siparis Yonetimi",
  manage_shipments: "Kargo Yonetimi",
  manage_users: "Kullanici Yonetimi",
  manage_roles: "Rol ve Yetki Yonetimi",
  manage_campaigns: "Kampanya ve Banner Yonetimi",
  view_reports: "Raporlari Gorme",
  manage_site_content: "Site Icerigi Yonetimi",
  manage_technical_service: "Teknik Servis Yonetimi",
  manage_import_export: "Ice / Dise Aktarma",
  view_logs: "Audit Loglarini Gorme",
} as const;

export type AdminPermission = keyof typeof ADMIN_PERMISSION_LABELS;

export const ALL_ADMIN_PERMISSIONS = Object.keys(ADMIN_PERMISSION_LABELS) as AdminPermission[];

export const ROLE_PERMISSION_PRESETS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ALL_ADMIN_PERMISSIONS,
  admin: ALL_ADMIN_PERMISSIONS,
  editor: ["manage_site_content", "manage_campaigns"],
  order_manager: ["manage_orders", "manage_shipments", "view_reports"],
  support_manager: ["manage_technical_service", "manage_orders"],
  inventory_manager: ["manage_products", "manage_import_export", "view_reports"],
  marketing_manager: ["manage_campaigns", "manage_site_content", "view_reports"],
};

export const ORDER_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
] as const;

export type AdminOrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];

export const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandi",
  preparing: "Hazirlaniyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "Iptal Edildi",
  refunded: "Iade Edildi",
  failed: "Basarisiz",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede",
  paid: "Odendi",
  failed: "Basarisiz",
  refunded: "Iade Edildi",
};

export const LOW_STOCK_FILTERS = ["all", "critical", "out_of_stock"] as const;
export type LowStockFilter = (typeof LOW_STOCK_FILTERS)[number];

export const REPORT_RANGE_PRESETS = ["today", "7d", "30d", "this_month", "last_month", "custom"] as const;
export type ReportRangePreset = (typeof REPORT_RANGE_PRESETS)[number];

export const BANNER_PLACEMENTS = ["home_hero", "home_campaign", "category", "popup", "promo_badge"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  home_hero: "Ana Sayfa Hero",
  home_campaign: "Ana Sayfa Kampanya",
  category: "Kategori Banner",
  popup: "Popup Kampanya",
  promo_badge: "Promo Rozet",
};

export type DateRangeInput = {
  preset: ReportRangePreset;
  startDate?: string | null;
  endDate?: string | null;
};

export type DashboardMetric = {
  key:
    | "todayRevenue"
    | "weekRevenue"
    | "monthRevenue"
    | "totalOrders"
    | "todayOrders"
    | "pendingOrders"
    | "preparingOrders"
    | "lowStockCount"
    | "activeCampaigns"
    | "pendingServiceRequests";
  label: string;
  value: number;
  format: "currency" | "number";
};

export type RevenuePoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type RecentOrderSummary = {
  id: string;
  customerName: string;
  createdAt: string;
  finalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  itemCount: number;
};

export type TopSellingProductRow = {
  productId: string | null;
  productName: string;
  sku: string | null;
  quantity: number;
  revenue: number;
  stock: number | null;
};

export type LowStockProductRow = {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  sku: string;
  variantLabel: string;
  stock: number;
  threshold: number;
  status: "critical" | "out_of_stock";
};

export type RecentUserSummary = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  orderCount: number;
};

export type AuditLogRecord = {
  id: string;
  actorUserId: string;
  actorEmail: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export type AdminActor = {
  id: string;
  email: string;
  roles?: string[];
  permissions?: string[];
};

export type AdminDashboardData = {
  metrics: DashboardMetric[];
  revenueTrend: RevenuePoint[];
  orderTrend: RevenuePoint[];
  recentOrders: RecentOrderSummary[];
  topProducts: TopSellingProductRow[];
  lowStockProducts: LowStockProductRow[];
  recentUsers: RecentUserSummary[];
  recentLogs: AuditLogRecord[];
};

export type SalesSummaryMetrics = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paidOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
};

export type DistributionRow = {
  key: string;
  label: string;
  count: number;
};

export type SalesByCategoryRow = {
  categoryId: string | null;
  categoryName: string;
  quantity: number;
  revenue: number;
};

export type SalesByProductRow = TopSellingProductRow;

export type CouponPerformanceRow = {
  code: string;
  usageCount: number;
  revenue: number;
};

export type SalesReportData = {
  range: {
    preset: ReportRangePreset;
    startDate: string;
    endDate: string;
  };
  summary: SalesSummaryMetrics;
  revenueTrend: RevenuePoint[];
  orderTrend: RevenuePoint[];
  paymentStatusDistribution: DistributionRow[];
  orderStatusDistribution: DistributionRow[];
  salesByCategory: SalesByCategoryRow[];
  salesByProduct: SalesByProductRow[];
  couponPerformance: CouponPerformanceRow[];
  technicalServiceSummary: {
    pending: number;
    active: number;
    total: number;
  };
};

export type OrderStatusHistoryEntry = {
  status: AdminOrderStatus;
  note: string | null;
  changedByUserId: string | null;
  createdAt: string;
};

export type AdminOrderListItem = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  createdAt: string;
  finalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  itemCount: number;
  shipmentTrackingNumber: string | null;
  shipmentCompany: string | null;
};

export type AdminOrderItem = {
  id: string;
  productName: string;
  variantInfo: string | null;
  variantSku: string | null;
  variantImage: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ShipmentRecordSummary = {
  id: string;
  cargoCompany: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderDetail = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  createdAt: string;
  totalPrice: number;
  discount: number;
  shippingPrice: number;
  finalPrice: number;
  paymentProvider: string;
  paymentStatus: string;
  orderStatus: string;
  adminNote: string | null;
  couponCode: string | null;
  shippingAddress: Record<string, unknown> | null;
  items: AdminOrderItem[];
  shipment: ShipmentRecordSummary | null;
  statusHistory: OrderStatusHistoryEntry[];
};

export type AdminOrdersResponse = {
  items: AdminOrderListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BulkProductActionType =
  | "set_active"
  | "set_inactive"
  | "set_category"
  | "adjust_price_percentage"
  | "set_discount_percentage"
  | "set_stock"
  | "set_variant_threshold";

export type BulkProductActionPayload = {
  productIds: string[];
  action: BulkProductActionType;
  value?: string | number | null;
};

export type BulkProductActionResult = {
  updatedProducts: number;
  updatedVariants: number;
  skippedProducts: string[];
  message: string;
};

export type ProductImportPreviewRow = {
  rowNumber: number;
  sku: string;
  productName: string;
  status: "create" | "update" | "invalid";
  message: string;
};

export type ProductImportResult = {
  dryRun: boolean;
  createdProducts: number;
  updatedProducts: number;
  updatedVariants: number;
  failedRows: number;
  rows: ProductImportPreviewRow[];
};

export type BannerCampaignRecord = {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  badgeText: string | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
  totalSpend: number;
  addressCount: number;
  favoriteCount: number;
  technicalServiceCount: number;
};

export type AdminUsersResponse = {
  items: AdminUserListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RoleOption = {
  role: AdminRole;
  label: string;
  permissions: AdminPermission[];
};

export function hasAdminRole(roles: string[] | undefined | null) {
  return (roles ?? []).some((role) => role === "admin" || ADMIN_ROLES.includes(role as AdminRole));
}

export function resolveAdminPermissions(roles: string[] | undefined | null, directPermissions: string[] | undefined | null) {
  const permissions = new Set<AdminPermission>();

  for (const permission of directPermissions ?? []) {
    if ((ALL_ADMIN_PERMISSIONS as string[]).includes(permission)) {
      permissions.add(permission as AdminPermission);
    }
  }

  for (const role of roles ?? []) {
    if (role === "admin" || role === "super_admin") {
      ALL_ADMIN_PERMISSIONS.forEach((permission) => permissions.add(permission));
      continue;
    }

    if (ADMIN_ROLES.includes(role as AdminRole)) {
      ROLE_PERMISSION_PRESETS[role as AdminRole].forEach((permission) => permissions.add(permission));
    }
  }

  return Array.from(permissions);
}

export function hasAdminAccess(
  roles: string[] | undefined | null,
  directPermissions?: string[] | undefined | null,
  isActive = true,
) {
  if (!isActive) {
    return false;
  }

  return hasAdminRole(roles) || resolveAdminPermissions(roles, directPermissions).length > 0;
}

export function hasPermission(
  roles: string[] | undefined | null,
  directPermissions: string[] | undefined | null,
  permission: AdminPermission,
) {
  return resolveAdminPermissions(roles, directPermissions).includes(permission);
}

export function getAdminRoleOptions(): RoleOption[] {
  return ADMIN_ROLES.map((role) => ({
    role,
    label: role.replace(/_/g, " "),
    permissions: ROLE_PERMISSION_PRESETS[role],
  }));
}

export function formatAdminCurrency(value: number) {
  return `TL ${Math.round(value).toLocaleString("tr-TR")}`;
}
