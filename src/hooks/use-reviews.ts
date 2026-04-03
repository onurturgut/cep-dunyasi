"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminReviewStatus, ProductReviewListResponse, ReviewSort } from "@/lib/reviews";

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
};

type ProductReviewFilters = {
  page?: number;
  limit?: number;
  rating?: number;
  verified?: boolean;
  sort?: ReviewSort;
};

type AdminReviewFilters = {
  page?: number;
  limit?: number;
  status?: AdminReviewStatus;
  productId?: string;
  search?: string;
  sort?: ReviewSort;
};

type CreateReviewInput = {
  productId: string;
  rating: number;
  title?: string | null;
  comment: string;
  images?: string[];
};

type HelpfulReviewInput = {
  reviewId: string;
  productId: string;
};

type ApproveReviewInput = {
  reviewId: string;
  isApproved?: boolean;
};

type DeleteReviewInput = {
  reviewId: string;
};

type ReplyReviewInput = {
  reviewId: string;
  message: string | null;
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

export const reviewQueryKeys = {
  productBase: (productId: string) => ["product-reviews", productId] as const,
  product: (productId: string, filters: ProductReviewFilters) => [...reviewQueryKeys.productBase(productId), filters] as const,
  adminBase: ["admin-reviews"] as const,
  admin: (filters: AdminReviewFilters) => [...reviewQueryKeys.adminBase, filters] as const,
};

export function useProductReviews(productId: string | null | undefined, filters: ProductReviewFilters) {
  return useQuery({
    queryKey: reviewQueryKeys.product(productId || "unknown", filters),
    enabled: Boolean(productId),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      requestJson<ProductReviewListResponse>(
        `/api/reviews/list?${toQueryString({
          productId: productId || "",
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
          rating: filters.rating,
          verified: filters.verified,
          sort: filters.sort ?? "newest",
        })}`
      ),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      requestJson<{ moderationMessage: string }>("/api/reviews/create", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.productBase(variables.productId) });
    },
  });
}

function updateHelpfulCountInCache(
  previous: ProductReviewListResponse | undefined,
  reviewId: string,
  currentUserMarkedHelpful: boolean
) {
  if (!previous) {
    return previous;
  }

  return {
    ...previous,
    items: previous.items.map((item) =>
      item.id === reviewId
        ? {
            ...item,
            helpful_count: item.helpful_count + 1,
            viewer_has_marked_helpful: currentUserMarkedHelpful,
          }
        : item
    ),
  };
}

export function useMarkReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HelpfulReviewInput) =>
      requestJson<{ reviewId: string; productId: string | null; helpfulCount: number }>("/api/reviews/helpful", {
        method: "POST",
        body: JSON.stringify({ reviewId: input.reviewId }),
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: reviewQueryKeys.productBase(variables.productId) });

      const snapshots = queryClient.getQueriesData<ProductReviewListResponse>({
        queryKey: reviewQueryKeys.productBase(variables.productId),
      });

      queryClient.setQueriesData<ProductReviewListResponse>(
        { queryKey: reviewQueryKeys.productBase(variables.productId) },
        (current) => updateHelpfulCountInCache(current, variables.reviewId, true)
      );

      return { snapshots, productId: variables.productId };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSettled: (_data, _error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.productBase(context?.productId || variables.productId) });
    },
  });
}

export function useAdminReviews(filters: AdminReviewFilters) {
  return useQuery({
    queryKey: reviewQueryKeys.admin(filters),
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      requestJson<ProductReviewListResponse>(
        `/api/admin/reviews/list?${toQueryString({
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          status: filters.status ?? "pending",
          productId: filters.productId,
          search: filters.search,
          sort: filters.sort ?? "newest",
        })}`
      ),
  });
}

function invalidateAdminAndProductReviews(queryClient: ReturnType<typeof useQueryClient>, productId?: string | null) {
  queryClient.invalidateQueries({ queryKey: reviewQueryKeys.adminBase });

  if (productId) {
    queryClient.invalidateQueries({ queryKey: reviewQueryKeys.productBase(productId) });
  }
}

export function useApproveReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApproveReviewInput) =>
      requestJson<{ productId: string; reviewId: string; isApproved: boolean }>("/api/admin/reviews/approve", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      invalidateAdminAndProductReviews(queryClient, data.productId);
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteReviewInput) =>
      requestJson<{ productId: string; reviewId: string }>("/api/admin/reviews/delete", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      invalidateAdminAndProductReviews(queryClient, data.productId);
    },
  });
}

export function useReplyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReplyReviewInput) =>
      requestJson<{ productId: string; reviewId: string; adminReply: { message: string; created_at: string; updated_at: string } | null }>(
        "/api/admin/reviews/reply",
        {
          method: "POST",
          body: JSON.stringify(input),
        }
      ),
    onSuccess: (data) => {
      invalidateAdminAndProductReviews(queryClient, data.productId);
    },
  });
}

export type { ProductReviewFilters, AdminReviewFilters, CreateReviewInput, HelpfulReviewInput, ApproveReviewInput, DeleteReviewInput, ReplyReviewInput };
