"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { CaseDetails } from "@/lib/case-models";
import type { SecondHandDetails } from "@/lib/second-hand";

type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images: string[];
  created_at?: string | Date;
  sales_count?: number;
  specs?: Record<string, string | null> | null;
  rating_average?: number;
  rating_count?: number;
  second_hand?: SecondHandDetails | null;
  case_details?: CaseDetails | null;
  categories?: { name?: string; slug?: string } | null;
  product_variants: Array<Record<string, unknown>>;
};

type WishlistResponse = {
  productIds: string[];
  products: WishlistProduct[];
};

type ToggleWishlistResponse = {
  productId: string;
  isFavorite: boolean;
  productIds: string[];
  products: WishlistProduct[];
  count: number;
};

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
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

export const wishlistQueryKey = ["wishlist"] as const;

function getWishlistQueryKey(userId: string | null | undefined) {
  return [...wishlistQueryKey, userId ?? "guest"] as const;
}

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => getWishlistQueryKey(user?.id), [user?.id]);

  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    queryFn: () => requestJson<WishlistResponse>("/api/wishlist"),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: string) =>
      requestJson<ToggleWishlistResponse>("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
      }),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WishlistResponse>(queryKey);

      if (previous) {
        const exists = previous.productIds.includes(productId);
        queryClient.setQueryData<WishlistResponse>(queryKey, {
          ...previous,
          productIds: exists ? previous.productIds.filter((id) => id !== productId) : [...previous.productIds, productId],
          products: exists ? previous.products.filter((product) => product.id !== productId) : previous.products,
        });
      }

      return { previous };
    },
    onError: (_error, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<WishlistResponse>(queryKey, {
        productIds: data.productIds,
        products: data.products,
      });
      queryClient.invalidateQueries({ queryKey: ["account", "favorites"] });
      queryClient.invalidateQueries({ queryKey: ["account", "profile"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey, refetchType: "all" });
    },
  });

  return {
    productIds: query.data?.productIds ?? [],
    productsds: query.data?.productIds ?? [],
    products: query.data?.products ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    isToggling: toggleMutation.isPending,
    togglingProductId: toggleMutation.variables ?? null,
    togglingProductsd: toggleMutation.variables ?? null,
    isFavorite: (productId: string) => (query.data?.productIds ?? []).includes(productId),
    toggleWishlist: toggleMutation.mutateAsync,
  };
}
