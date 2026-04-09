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
  productsds: string[];
  products: WishlistProduct[];
};

type ToggleWishlistResponse = {
  productsd: string;
  isFavorite: boolean;
  productsds: string[];
  products: WishlistProduct[];
  count: number;
};

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
};

async function requestJson<T>(input: string, init?: Requestsnit) {
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
    throw new Error(body?.error?.message || "sslem basarisiz");
  }

  return body?.data as T;
}

export const wishlistQueryKey = ["wishlist"] as const;
function getWishlistQueryKey(usersd: string | null | undefined) {
  return [...wishlistQueryKey, usersd ?? "guest"] as const;
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
    mutationFn: (productsd: string) =>
      requestJson<ToggleWishlistResponse>("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productsd }),
      }),
    onMutate: async (productsd) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WishlistResponse>(queryKey);

      if (previous) {
        const exists = previous.productsds.includes(productsd);
        queryClient.setQueryData<WishlistResponse>(queryKey, {
          ...previous,
          productsds: exists ? previous.productsds.filter((id) => id !== productsd) : [...previous.productsds, productsd],
          products: exists ? previous.products.filter((product) => product.id !== productsd) : previous.products,
        });
      }

      return { previous };
    },
    onError: (_error, _productsd, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<WishlistResponse>(queryKey, {
        productsds: data.productsds,
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
    productsds: query.data?.productsds ?? [],
    products: query.data?.products ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    isToggling: toggleMutation.isPending,
    togglingProductsd: toggleMutation.variables ?? null,
    isFavorite: (productsd: string) => (query.data?.productsds ?? []).includes(productsd),
    toggleWishlist: toggleMutation.mutateAsync,
  };
}