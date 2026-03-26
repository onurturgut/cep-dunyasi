"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AccountAddress,
  AccountProfile,
  AccountStatCards,
  FavoriteProductSummary,
  MyOrderDetail,
  MyOrderSummary,
  ReturnRequestRecord,
  TechnicalServiceHistoryItem,
} from "@/lib/account";

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
};

type AccountProfileResponse = {
  profile: AccountProfile;
  stats: AccountStatCards;
};

type PaginatedOrdersResponse = {
  items: MyOrderSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type FavoritesResponse = {
  productIds: string[];
  products: FavoriteProductSummary[];
  count?: number;
};

type AddressInput = Omit<AccountAddress, "id" | "created_at" | "updated_at"> & { id?: string };

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ReturnRequestInput = {
  orderId: string;
  orderItemId: string;
  requestType: "return" | "exchange";
  reasonCode: string;
  reasonText: string;
  images?: string[];
};

async function requestJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || "Islem basarisiz");
  }

  return body?.data as T;
}

function toQueryString(params: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, `${value}`);
  });

  return searchParams.toString();
}

export const accountQueryKeys = {
  profile: ["account", "profile"] as const,
  addresses: ["account", "addresses"] as const,
  orders: (page: number, limit: number) => ["account", "orders", page, limit] as const,
  orderDetail: (orderId: string) => ["account", "orders", orderId] as const,
  returns: ["account", "returns"] as const,
  favorites: ["account", "favorites"] as const,
  technicalService: ["account", "technical-service"] as const,
};

export function useAccountProfile() {
  return useQuery({
    queryKey: accountQueryKeys.profile,
    queryFn: () => requestJson<AccountProfileResponse>("/api/account/profile"),
  });
}

export function useUpdateAccountProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      firstName: string;
      lastName: string;
      phone: string;
      profileImageUrl?: string | null;
      communicationPreferences: { email: boolean; sms: boolean };
    }) =>
      requestJson<AccountProfileResponse>("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(accountQueryKeys.profile, data);
    },
  });
}

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.addresses,
    enabled,
    queryFn: () => requestJson<AccountAddress[]>("/api/account/addresses"),
  });
}

function invalidateAddressQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: accountQueryKeys.addresses });
  queryClient.invalidateQueries({ queryKey: accountQueryKeys.profile });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddressInput) =>
      requestJson<AccountAddress[]>("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateAddressQueries(queryClient);
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddressInput & { id: string }) =>
      requestJson<AccountAddress[]>("/api/account/addresses", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateAddressQueries(queryClient);
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) =>
      requestJson<AccountAddress[]>("/api/account/addresses", {
        method: "DELETE",
        body: JSON.stringify({ addressId }),
      }),
    onSuccess: () => {
      invalidateAddressQueries(queryClient);
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) =>
      requestJson<AccountAddress[]>("/api/account/addresses/default", {
        method: "POST",
        body: JSON.stringify({ addressId }),
      }),
    onSuccess: () => {
      invalidateAddressQueries(queryClient);
    },
  });
}

export function useMyOrders(page = 1, limit = 10) {
  return useQuery({
    queryKey: accountQueryKeys.orders(page, limit),
    queryFn: () => requestJson<PaginatedOrdersResponse>(`/api/account/orders?${toQueryString({ page, limit })}`),
  });
}

export function useMyOrderDetail(orderId: string | null | undefined) {
  return useQuery({
    queryKey: accountQueryKeys.orderDetail(orderId || "unknown"),
    enabled: Boolean(orderId),
    queryFn: () => requestJson<MyOrderDetail>(`/api/account/orders/${orderId}`),
  });
}

export function useMyFavorites() {
  return useQuery({
    queryKey: accountQueryKeys.favorites,
    queryFn: () => requestJson<FavoritesResponse>("/api/account/favorites"),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      requestJson<FavoritesResponse & { productId: string; isFavorite: boolean }>("/api/account/favorites", {
        method: "POST",
        body: JSON.stringify({ productId }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(accountQueryKeys.favorites, data);
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.profile });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useMyReturnRequests() {
  return useQuery({
    queryKey: accountQueryKeys.returns,
    queryFn: () => requestJson<ReturnRequestRecord[]>("/api/account/returns"),
  });
}

export function useCreateReturnRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReturnRequestInput) =>
      requestJson<{ id: string; order_id: string }>("/api/account/returns", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.returns });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.orderDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.orders(1, 10) });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.profile });
    },
  });
}

export function useMyTechnicalServiceRequests() {
  return useQuery({
    queryKey: accountQueryKeys.technicalService,
    queryFn: () => requestJson<TechnicalServiceHistoryItem[]>("/api/account/technical-service"),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      requestJson<{ changed: boolean }>("/api/account/security/change-password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export type { AccountProfileResponse, PaginatedOrdersResponse, FavoritesResponse, AddressInput, ChangePasswordInput, ReturnRequestInput };
