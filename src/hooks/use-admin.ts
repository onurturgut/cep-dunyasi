"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminDashboardData,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminUsersResponse,
  AuditLogRecord,
  BannerCampaignRecord,
  BulkProductActionResult,
  DateRangeInput,
  LowStockFilter,
  LowStockProductRow,
  ProductImportResult,
  SalesReportData,
} from "@/lib/admin";

type ApiError = {
  message: string;
};

type ApiResponse<T> = {
  data: T;
  error: ApiError | null;
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || "Istek tamamlanamadi");
  }

  return payload?.data as T;
}

const adminKeys = {
  dashboard: (range: DateRangeInput) => ["admin", "dashboard", range] as const,
  reports: (range: DateRangeInput) => ["admin", "reports", range] as const,
  lowStock: (filter: LowStockFilter, threshold: number) => ["admin", "low-stock", filter, threshold] as const,
  orders: (params: Record<string, unknown>) => ["admin", "orders", params] as const,
  orderDetail: (orderId: string) => ["admin", "orders", orderId] as const,
  banners: ["admin", "banners"] as const,
  users: (params: Record<string, unknown>) => ["admin", "users", params] as const,
  roles: ["admin", "roles"] as const,
  logs: (params: Record<string, unknown>) => ["admin", "logs", params] as const,
};

function withSearchParams(path: string, params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }
    search.set(key, `${value}`);
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function useAdminDashboard(range: DateRangeInput) {
  return useQuery({
    queryKey: adminKeys.dashboard(range),
    queryFn: () =>
      requestJson<AdminDashboardData>(
        withSearchParams("/api/admin/dashboard/summary", {
          preset: range.preset,
          startDate: range.startDate ?? undefined,
          endDate: range.endDate ?? undefined,
        }),
      ),
  });
}

export function useSalesReports(range: DateRangeInput) {
  return useQuery({
    queryKey: adminKeys.reports(range),
    queryFn: () =>
      requestJson<SalesReportData>(
        withSearchParams("/api/admin/reports", {
          preset: range.preset,
          startDate: range.startDate ?? undefined,
          endDate: range.endDate ?? undefined,
        }),
      ),
  });
}

export function useRevenueChart(range: DateRangeInput) {
  return useSalesReports(range);
}

export function useTopSellingProducts(range: DateRangeInput) {
  const query = useSalesReports(range);
  return {
    ...query,
    data: query.data?.salesByProduct ?? [],
  };
}

export function useLowStockProducts(filter: LowStockFilter, threshold = 5, limit?: number) {
  return useQuery({
    queryKey: adminKeys.lowStock(filter, threshold),
    queryFn: () =>
      requestJson<LowStockProductRow[]>(
        withSearchParams("/api/admin/inventory/low-stock", {
          filter,
          threshold,
          limit: limit ?? undefined,
        }),
      ),
  });
}

export function useAdminOrders(params: {
  page: number;
  limit: number;
  search: string;
  status: string;
  paymentStatus: string;
}) {
  return useQuery({
    queryKey: adminKeys.orders(params),
    queryFn: () =>
      requestJson<{
        items: AdminOrderListItem[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>(withSearchParams("/api/admin/orders/list", params)),
  });
}

export function useAdminOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: orderId ? adminKeys.orderDetail(orderId) : ["admin", "orders", "empty"],
    enabled: Boolean(orderId),
    queryFn: () => requestJson<AdminOrderDetail>(`/api/admin/orders/${orderId}`),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { orderId: string; status: string; note?: string | null }) =>
      requestJson<AdminOrderDetail>("/api/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ["account", "orders"] });
    },
  });
}

export function useUpsertShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { orderId: string; cargoCompany: string; trackingNumber: string; status?: "preparing" | "shipped" | "delivered" }) =>
      requestJson<AdminOrderDetail>("/api/admin/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ["account", "orders"] });
    },
  });
}

export function useBulkProductActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { productIds: string[]; action: string; value?: string | number | null }) =>
      requestJson<BulkProductActionResult>("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "low-stock"] });
    },
  });
}

export function useImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { csv: string; dryRun: boolean }) =>
      requestJson<ProductImportResult>("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (data: ProductImportResult) => {
      if (!data.dryRun) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "low-stock"] });
      }
    },
  });
}

export function useExportProducts() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/products/export", { method: "GET" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiResponse<null> | null;
        throw new Error(payload?.error?.message || "Disa aktarma tamamlanamadi");
      }
      return response.text();
    },
  });
}

export function useBanners() {
  return useQuery({
    queryKey: adminKeys.banners,
    queryFn: () => requestJson<BannerCampaignRecord[]>("/api/admin/banners"),
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id?: string;
      placement: BannerCampaignRecord["placement"];
      title: string;
      subtitle?: string;
      description?: string;
      imageUrl: string;
      mobileImageUrl?: string;
      ctaLabel?: string;
      ctaHref?: string;
      badgeText?: string;
      themeVariant?: string;
      triggerType?: "delay" | "scroll" | "exit_intent";
      triggerDelaySeconds?: number;
      triggerScrollPercent?: number;
      showOncePerSession?: boolean;
      targetPaths?: string[];
      audience?: "all" | "guest" | "authenticated";
      startAt?: string;
      endAt?: string;
      isActive: boolean;
      sortOrder: number;
    }) =>
      requestJson<BannerCampaignRecord[]>("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.banners }),
  });
}

export function useUpdateBanner() {
  return useCreateBanner();
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestJson<{ deleted: boolean }>(`/api/admin/banners?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.banners }),
  });
}

export function useAdminUsers(params: { page: number; limit: number; search: string; status: "all" | "active" | "inactive" }) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => requestJson<AdminUsersResponse>(withSearchParams("/api/admin/users", params)),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; roles: string[]; permissions: string[]; isActive: boolean }) =>
      requestJson<{ updated: boolean }>("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.roles });
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: adminKeys.roles,
    queryFn: () =>
      requestJson<{
        roles: Array<{ role: string; permissions: string[] }>;
        permissions: Array<{ id: string; label: string }>;
        users: AdminUsersResponse["items"];
      }>("/api/admin/roles"),
  });
}

export function usePermissions() {
  const query = useRoles();
  return {
    ...query,
    data: query.data?.permissions ?? [],
  };
}

export function useAuditLogs(params: {
  page: number;
  limit: number;
  actorUserId?: string;
  actionType?: string;
  startDate?: string | null;
  endDate?: string | null;
}) {
  return useQuery({
    queryKey: adminKeys.logs(params),
    queryFn: () =>
      requestJson<{
        items: AuditLogRecord[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>(
        withSearchParams("/api/admin/logs", {
          page: params.page,
          limit: params.limit,
          actorUserId: params.actorUserId ?? undefined,
          actionType: params.actionType ?? undefined,
          startDate: params.startDate ?? undefined,
          endDate: params.endDate ?? undefined,
        }),
      ),
  });
}
