"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FeaturedReviewRecord,
  LoyaltyTransactionRecord,
  MarketingEventPayload,
  MarketingPopupRecord,
  MarketingSettingsRecord,
  NewsletterSubscriberRecord,
  ReferralRecord,
  SocialProofItemRecord,
} from "@/lib/marketing";
import { postMarketingEvent } from "@/lib/marketing-events";

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
};

async function requestJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || "Istek tamamlanamadi");
  }

  return body?.data as T;
}

function toQueryString(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    search.set(key, `${value}`);
  });

  return search.toString();
}

export const marketingQueryKeys = {
  socialProof: ["marketing", "social-proof"] as const,
  featuredReviews: ["marketing", "featured-reviews"] as const,
  settings: (pathname?: string | null) => ["marketing", "settings", pathname ?? "/"] as const,
  accountSummary: ["account", "marketing"] as const,
  adminSettings: ["admin", "marketing", "settings"] as const,
  adminSocialProof: ["admin", "marketing", "social-proof"] as const,
  adminNewsletter: (params: { page: number; limit: number; search: string }) =>
    ["admin", "marketing", "newsletter", params] as const,
};

export function useSocialProof(initialData?: SocialProofItemRecord[]) {
  return useQuery({
    queryKey: marketingQueryKeys.socialProof,
    queryFn: () => requestJson<SocialProofItemRecord[]>("/api/social-proof"),
    initialData,
    staleTime: 5 * 60_000,
  });
}

export function useFeaturedReviews(initialData?: FeaturedReviewRecord[]) {
  return useQuery({
    queryKey: marketingQueryKeys.featuredReviews,
    queryFn: () => requestJson<FeaturedReviewRecord[]>("/api/reviews/featured"),
    initialData,
    staleTime: 5 * 60_000,
  });
}

export function useMarketingSettings(pathname?: string | null, initialData?: { settings: MarketingSettingsRecord; popups: MarketingPopupRecord[] }) {
  return useQuery({
    queryKey: marketingQueryKeys.settings(pathname),
    queryFn: () =>
      requestJson<{ settings: MarketingSettingsRecord; popups: MarketingPopupRecord[] }>(
        `/api/marketing/settings?${toQueryString({ pathname })}`,
      ),
    initialData,
    staleTime: 2 * 60_000,
  });
}

export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: (input: {
      email: string;
      firstName?: string | null;
      source?: "footer" | "popup" | "homepage-inline" | "checkout" | "manual";
      campaignSource?: string | null;
      consentNewsletter?: boolean;
      consentKvkk?: boolean;
    }) =>
      requestJson<{ subscriber: NewsletterSubscriberRecord; isNew: boolean }>("/api/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useLoyaltyPoints() {
  return useQuery({
    queryKey: marketingQueryKeys.accountSummary,
    queryFn: () =>
      requestJson<{
        loyaltyPointsBalance: number;
        referralCode: string;
        referredBy: string | null;
        transactions: LoyaltyTransactionRecord[];
        referrals: ReferralRecord[];
      }>("/api/account/marketing"),
    staleTime: 30_000,
  });
}

export function useReferralHistory() {
  const query = useLoyaltyPoints();
  return {
    ...query,
    data: query.data?.referrals ?? [],
  };
}

export function useReferralCode(code: string | null | undefined) {
  return useQuery({
    queryKey: ["marketing", "referral-code", code ?? ""],
    enabled: Boolean(code),
    queryFn: () => requestJson<{ referrerUserId: string; referrerName: string; referralCode: string }>(`/api/referral/resolve?${toQueryString({ code })}`),
    staleTime: 60_000,
  });
}

export function useTrackMarketingEvent() {
  const mutateAsync = useCallback((input: MarketingEventPayload) => postMarketingEvent(input), []);
  const mutate = useCallback((input: MarketingEventPayload) => {
    void postMarketingEvent(input);
  }, []);

  return {
    mutate,
    mutateAsync,
  };
}

export function useAdminMarketingSettings() {
  return useQuery({
    queryKey: marketingQueryKeys.adminSettings,
    queryFn: () => requestJson<MarketingSettingsRecord>("/api/admin/marketing/settings"),
    staleTime: 30_000,
  });
}

export function useUpdateAdminMarketingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MarketingSettingsRecord) =>
      requestJson<MarketingSettingsRecord>("/api/admin/marketing/settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingQueryKeys.adminSettings });
      queryClient.invalidateQueries({ queryKey: ["marketing", "settings"] });
    },
  });
}

export function useAdminSocialProof() {
  return useQuery({
    queryKey: marketingQueryKeys.adminSocialProof,
    queryFn: () => requestJson<SocialProofItemRecord[]>("/api/admin/social-proof"),
    staleTime: 30_000,
  });
}

export function useUpsertAdminSocialProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id?: string;
      label: string;
      value: string;
      icon?: string | null;
      description?: string | null;
      sourceType?: "manual" | "derived";
      isActive: boolean;
      order: number;
    }) =>
      requestJson<SocialProofItemRecord[]>("/api/admin/social-proof", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingQueryKeys.adminSocialProof });
      queryClient.invalidateQueries({ queryKey: marketingQueryKeys.socialProof });
    },
  });
}

export function useDeleteAdminSocialProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      requestJson<{ deleted: boolean }>(`/api/admin/social-proof?${toQueryString({ id })}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingQueryKeys.adminSocialProof });
      queryClient.invalidateQueries({ queryKey: marketingQueryKeys.socialProof });
    },
  });
}

export function useAdminNewsletterSubscribers(params: { page: number; limit: number; search: string }) {
  return useQuery({
    queryKey: marketingQueryKeys.adminNewsletter(params),
    queryFn: () =>
      requestJson<{
        items: NewsletterSubscriberRecord[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>(`/api/admin/newsletter?${toQueryString(params)}`),
    staleTime: 30_000,
  });
}
