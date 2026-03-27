"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CorporateFaqItem,
  CorporatePageKey,
  CorporatePageListItem,
  CorporatePageRecord,
  CorporatePageUpsertInput,
} from "@/types/corporate-page";

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
    throw new Error(payload?.error?.message || "İstek tamamlanamadı");
  }

  return payload?.data as T;
}

const corporatePageKeys = {
  public: (slug: string) => ["corporate-page", "public", slug] as const,
  faq: ["corporate-page", "public", "faq"] as const,
  adminList: ["corporate-page", "admin", "list"] as const,
  adminDetail: (pageKey: CorporatePageKey) => ["corporate-page", "admin", pageKey] as const,
};

export function useCorporatePage(slug: string) {
  return useQuery({
    queryKey: corporatePageKeys.public(slug),
    queryFn: () => requestJson<CorporatePageRecord>(`/api/pages/${slug}`),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useFaqPage() {
  return useQuery({
    queryKey: corporatePageKeys.faq,
    queryFn: () => requestJson<CorporatePageRecord>("/api/pages/sss"),
    staleTime: 60_000,
  });
}

export function useAdminCorporatePages() {
  return useQuery({
    queryKey: corporatePageKeys.adminList,
    queryFn: () => requestJson<CorporatePageListItem[]>("/api/admin/pages"),
  });
}

export function useAdminCorporatePage(pageKey: CorporatePageKey | null) {
  return useQuery({
    queryKey: pageKey ? corporatePageKeys.adminDetail(pageKey) : ["corporate-page", "admin", "empty"],
    queryFn: () => requestJson<CorporatePageRecord>(`/api/admin/pages/${pageKey}`),
    enabled: Boolean(pageKey),
  });
}

export function useUpsertCorporatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CorporatePageUpsertInput) =>
      requestJson<CorporatePageRecord>("/api/admin/pages/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.adminList });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.adminDetail(page.key) });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.public(page.slug) });
      if (page.key === "faq") {
        queryClient.invalidateQueries({ queryKey: corporatePageKeys.faq });
      }
    },
  });
}

export function useUpsertFaqItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { pageKey: "faq"; item: CorporateFaqItem }) =>
      requestJson<CorporatePageRecord>("/api/admin/pages/faq/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.adminList });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.adminDetail(page.key) });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.public(page.slug) });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.faq });
    },
  });
}

export function useDeleteFaqItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { pageKey: "faq"; id: string }) =>
      requestJson<CorporatePageRecord>("/api/admin/pages/faq/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.adminList });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.adminDetail(page.key) });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.public(page.slug) });
      queryClient.invalidateQueries({ queryKey: corporatePageKeys.faq });
    },
  });
}

