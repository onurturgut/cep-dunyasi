"use client";

import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "@/lib/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import type { MyOrderSummary } from "@/lib/account";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";

export function OrderCard({ order }: { order: MyOrderSummary }) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="font-display text-lg font-semibold">#{order.id.slice(0, 8)}</CardTitle>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            {formatDate(order.created_at)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.payment_status} type="payment" />
          <OrderStatusBadge status={order.order_status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-3">
          {order.items_preview.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted/30">
                {item.variant_image ? (
                  <img src={item.variant_image} alt={item.product_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Ürün</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.product_name}</p>
                {item.variant_info ? <p className="truncate text-xs text-muted-foreground">{item.variant_info}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">Adet: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(item.unit_price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{order.item_count}</span> urun
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <p className="text-lg font-semibold text-foreground">{formatCurrency(order.final_price)}</p>
            <Link
              to={`/account/orders/${order.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
            >
              Detay
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

