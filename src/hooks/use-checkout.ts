"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CheckoutPaymentMethod,
  CheckoutStartInput,
  CheckoutStartResult,
  OrderPaymentStatusResponse,
} from "@/lib/checkout";

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
    throw new Error(body?.error?.message || "İstek tamamlanamadı");
  }

  return body?.data as T;
}

export const checkoutQueryKeys = {
  paymentMethods: ["checkout", "payment-methods"] as const,
  installmentPreview: (amount: number, paymentMethod: CheckoutPaymentMethod) =>
    ["checkout", "installments", amount, paymentMethod] as const,
  paymentStatus: (orderId: string, retryToken?: string | null) =>
    ["checkout", "payment-status", orderId, retryToken ?? null] as const,
};

export function useCheckoutPaymentMethods() {
  return useQuery({
    queryKey: checkoutQueryKeys.paymentMethods,
    queryFn: () =>
      requestJson<{
        methods: Array<{
          method: CheckoutPaymentMethod;
          label: string;
          description: string;
          enabled: boolean;
          requiresAction: boolean;
          supportsInstallments: boolean;
          badge?: string;
        }>;
        defaultMethod: CheckoutPaymentMethod;
      }>("/api/checkout/payment-methods"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstallmentPreview(amount: number, paymentMethod: CheckoutPaymentMethod, enabled = true) {
  return useQuery({
    queryKey: checkoutQueryKeys.installmentPreview(amount, paymentMethod),
    enabled: enabled && amount > 0,
    queryFn: () =>
      requestJson<{
        amount: number;
        paymentMethod: CheckoutPaymentMethod;
        options: Array<{
          months: number;
          commissionRate: number;
          totalAmount: number;
          monthlyAmount: number;
          isHighlighted: boolean;
        }>;
      }>("/api/checkout/installments-preview", {
        method: "POST",
        body: JSON.stringify({ amount, paymentMethod }),
      }),
    staleTime: 60 * 1000,
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: (payload: CheckoutStartInput) =>
      requestJson<CheckoutStartResult>("/api/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useRetryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      orderId: string;
      retryToken?: string | null;
      paymentMethod?: CheckoutPaymentMethod;
      installmentMonths?: number;
    }) =>
      requestJson<CheckoutStartResult>("/api/checkout/retry-payment", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["checkout", "payment-status", data.orderId] });
      queryClient.invalidateQueries({ queryKey: ["account", "orders"] });
    },
  });
}

export function useOrderPaymentStatus(orderId: string | null | undefined, retryToken?: string | null) {
  return useQuery({
    queryKey: orderId ? checkoutQueryKeys.paymentStatus(orderId, retryToken) : ["checkout", "payment-status", "empty"],
    enabled: Boolean(orderId),
    queryFn: () =>
      requestJson<OrderPaymentStatusResponse>(
        `/api/orders/${orderId}/payment-status${retryToken ? `?retryToken=${encodeURIComponent(retryToken)}` : ""}`,
      ),
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus;
      return status === "requires_action" || status === "pending" ? 7000 : false;
    },
    staleTime: 10 * 1000,
  });
}
