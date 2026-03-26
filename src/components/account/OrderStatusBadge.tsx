"use client";

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/account";
import { cn } from "@/lib/utils";

type OrderStatusBadgeProps = {
  status: string;
  type?: "order" | "payment";
};

const toneMap: Record<string, string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  confirmed: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  processing: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  preparing: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  shipped: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700",
  delivered: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
};

export function OrderStatusBadge({ status, type = "order" }: OrderStatusBadgeProps) {
  const normalized = `${status || "pending"}`.trim().toLowerCase();
  const label = type === "payment" ? PAYMENT_STATUS_LABELS[normalized] || status : ORDER_STATUS_LABELS[normalized] || status;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        toneMap[normalized] || "border-border/70 bg-muted/30 text-foreground/80",
      )}
    >
      {label}
    </Badge>
  );
}
