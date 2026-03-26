"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CampaignFormValues, CampaignRecord } from "@/lib/campaigns";

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

const campaignKeys = {
  active: ["campaigns", "active"] as const,
  admin: ["campaigns", "admin"] as const,
};

export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.active,
    queryFn: () => requestJson<CampaignRecord[]>("/api/campaigns"),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminCampaigns() {
  return useQuery({
    queryKey: campaignKeys.admin,
    queryFn: () => requestJson<CampaignRecord[]>("/api/admin/campaigns"),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CampaignFormValues) =>
      requestJson<CampaignRecord>("/api/admin/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.admin });
      queryClient.invalidateQueries({ queryKey: campaignKeys.active });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CampaignFormValues) =>
      requestJson<CampaignRecord>("/api/admin/campaigns/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.admin });
      queryClient.invalidateQueries({ queryKey: campaignKeys.active });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      requestJson<{ deleted: boolean }>("/api/admin/campaigns/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.admin });
      queryClient.invalidateQueries({ queryKey: campaignKeys.active });
    },
  });
}

export function useReorderCampaigns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      requestJson<CampaignRecord[]>("/api/admin/campaigns/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.admin });
      queryClient.invalidateQueries({ queryKey: campaignKeys.active });
    },
  });
}
