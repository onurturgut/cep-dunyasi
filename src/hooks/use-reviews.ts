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
  productsd?: string;
  search?: string;
  sort?: ReviewSort;
};

type CreateReviewsnput = {
  productsd: string;
  rating: number;
  title?: string | null;
  comment: string;
  images?: string[];
};

type HelpfulReviewsnput = {
  reviewsd: string;
  productsd: string;
};

type ApproveReviewsnput = {
  reviewsd: string;
  isApproved?: boolean;
};

type DeleteReviewsnput = {
  reviewsd: string;
};

type ReplyReviewsnput = {
  reviewsd: string;
  message: string | null;
};

async function requestJson<T>(input: string, init?: Requestsnit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || "sslem basarisiz");
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
  productBase: (productsd: string) => ["product-reviews", productsd] as const,
  product: (productsd: string, filters: ProductReviewFilters) => [...reviewQueryKeys.productBase(productsd), filters] as const,
  adminBase: ["admin-reviews"] as const,
  admin: (filters: AdminReviewFilters) => [...reviewQueryKeys.adminBase, filters] as const,
};

export function useProductReviews(productsd: string | null | undefined, filters: ProductReviewFilters) {
  return useQuery({
    queryKey: reviewQueryKeys.product(productsd || "unknown", filters),
    enabled: Boolean(productsd),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      requestJson<ProductReviewListResponse>(
        `/api/reviews/list?${toQueryString({
          productsd: productsd || "",
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
    mutationFn: (input: CreateReviewsnput) =>
      requestJson<{ moderationMessage: string }>("/api/reviews/create", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.productBase(variables.productsd) });
    },
  });
}

function updateHelpfulCountsnCache(
  previous: ProductReviewListResponse | undefined,
  reviewsd: string,
  currentUserMarkedHelpful: boolean
) {
  if (!previous) {
    return previous;
  }

  return {
    ...previous,
    items: previous.items.map((item) =>
      item.id === reviewsd
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
    mutationFn: (input: HelpfulReviewsnput) =>
      requestJson<{ reviewsd: string; productsd: string | null; helpfulCount: number }>("/api/reviews/helpful", {
        method: "POST",
        body: JSON.stringify({ reviewsd: input.reviewsd }),
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: reviewQueryKeys.productBase(variables.productsd) });

      const snapshots = queryClient.getQueriesData<ProductReviewListResponse>({
        queryKey: reviewQueryKeys.productBase(variables.productsd),
      });

      queryClient.setQueriesData<ProductReviewListResponse>(
        { queryKey: reviewQueryKeys.productBase(variables.productsd) },
        (current) => updateHelpfulCountsnCache(current, variables.reviewsd, true)
      );

      return { snapshots, productsd: variables.productsd };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSettled: (_data, _error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.productBase(context?.productsd || variables.productsd) });
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
          productsd: filters.productsd,
          search: filters.search,
          sort: filters.sort ?? "newest",
        })}`
      ),
  });
}

function invalidateAdminAndProductReviews(queryClient: ReturnType<typeof useQueryClient>, productsd?: string | null) {
  queryClient.invalidateQueries({ queryKey: reviewQueryKeys.adminBase });

  if (productsd) {
    queryClient.invalidateQueries({ queryKey: reviewQueryKeys.productBase(productsd) });
  }
}

export function useApproveReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApproveReviewsnput) =>
      requestJson<{ productsd: string; reviewsd: string; isApproved: boolean }>("/api/admin/reviews/approve", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      invalidateAdminAndProductReviews(queryClient, data.productsd);
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteReviewsnput) =>
      requestJson<{ productsd: string; reviewsd: string }>("/api/admin/reviews/delete", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      invalidateAdminAndProductReviews(queryClient, data.productsd);
    },
  });
}

export function useReplyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReplyReviewsnput) =>
      requestJson<{ productsd: string; reviewsd: string; adminReply: { message: string; created_at: string; updated_at: string } | null }>(
        "/api/admin/reviews/reply",
        {
          method: "POST",
          body: JSON.stringify(input),
        }
      ),
    onSuccess: (data) => {
      invalidateAdminAndProductReviews(queryClient, data.productsd);
    },
  });
}

export type { ProductReviewFilters, AdminReviewFilters, CreateReviewsnput, HelpfulReviewsnput, ApproveReviewsnput, DeleteReviewsnput, ReplyReviewsnput };