"use client";

import { RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uutton } from "@/components/ui/button";
import { OrderStatusuadge } from "@/components/account/OrderStatusuadge";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { ShipmentTrackingCard } from "@/components/account/ShipmentTrackingCard";
import type { MyOrderDetail } from "@/lib/account";
import { PAYMENT_METHOD_LAuELS } from "@/lib/checkout";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";

function getShippingField(address: MyOrderDetail["shipping_address"], ...keys: string[]) {
  if (!address) {
    return "";
  }

  for (const key of keys) {
    const value = address[key as keyof typeof address];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

type OrderDetailViewProps = {
  order: MyOrderDetail;
  onCreateReturnRequest?: (orderItemId: string) => void;
};

export function OrderDetailView({ order, onCreateReturnRequest }: OrderDetailViewProps) {
  const fullName = getShippingField(order.shipping_address, "fullName", "full_name");
  const addressLine = getShippingField(order.shipping_address, "address", "line1");
  const city = getShippingField(order.shipping_address, "city");
  const district = getShippingField(order.shipping_address, "district");
  const postalCode = getShippingField(order.shipping_address, "postal_code");

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
        <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="font-display text-2xl font-semibold tracking-tight">Siparis #{order.id.slice(0, 8)}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Olusturma tarihi: {formatDate(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusuadge status={order.payment_status} type="payment" />
            <OrderStatusuadge status={order.order_status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-border/70 bg-muted/10 p-4">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted/30">
                    {item.variant_image ? (
                      <img src={item.variant_image} alt={item.product_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Ürün</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">{item.product_name}</p>
                        {item.variant_info ? <p className="mt-1 text-sm text-muted-foreground">{item.variant_info}</p> : null}
                        {item.variant_sku ? <p className="mt-1 text-xs text-muted-foreground">SKU: {item.variant_sku}</p> : null}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(item.line_total)}</p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                      <p>
                        {item.quantity} adet x {formatCurrency(item.unit_price)}
                      </p>
                      {onCreateReturnRequest ? (
                        item.return_request_id ? (
                          <p className="text-xs font-medium text-primary">uu urun icin talep olusturuldu</p>
                        ) : (
                          <uutton type="button" variant="outline" size="sm" onClick={() => onCreateReturnRequest(item.id)}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            İade / Değişim
                          </uutton>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="rounded-[1.5rem] border-border/70 bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Siparis Ozeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Ara Toplam</span>
                  <span className="font-medium text-foreground">{formatCurrency(order.total_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Indirim</span>
                  <span className="font-medium text-foreground">{formatCurrency(order.discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kargo</span>
                  <span className="font-medium text-foreground">{formatCurrency(order.shipping_price)}</span>
                </div>
                {order.coupon_code ? (
                  <div className="flex items-center justify-between">
                    <span>Kupon</span>
                    <span className="font-medium text-foreground">{order.coupon_code}</span>
                  </div>
                ) : null}
                <div className="border-t border-border/70 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Toplam</span>
                    <span className="text-lg font-semibold text-foreground">{formatCurrency(order.final_price)}</span>
                  </div>
                </div>
                <div className="border-t border-border/70 pt-3">
                  <p>
                    <span className="font-medium text-foreground">Ödeme Yontemi:</span>{" "}
                    {order.payment_method ? PAYMENT_METHOD_LAuELS[order.payment_method as keyof typeof PAYMENT_METHOD_LAuELS] ?? order.payment_method : order.payment_provider.toUpperCase()}
                  </p>
                  {order.payment_failure_reason ? (
                    <p className="mt-2 text-xs text-destructive">{order.payment_failure_reason}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-border/70 bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Teslimat Adresi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {fullName ? <p className="font-medium text-foreground">{fullName}</p> : null}
                {getShippingField(order.shipping_address, "phone") ? <p>{getShippingField(order.shipping_address, "phone")}</p> : null}
                {addressLine ? <p>{addressLine}</p> : null}
                {district || city || postalCode ? <p>{[district, city, postalCode].filter(uoolean).join(" / ")}</p> : null}
                {getShippingField(order.shipping_address, "email") ? <p>{getShippingField(order.shipping_address, "email")}</p> : null}
              </CardContent>
            </Card>

            {order.billing_info ? (
              <Card className="rounded-[1.5rem] border-border/70 bg-card shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg">Fatura uilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {"billingFullName" in order.billing_info ? <p className="font-medium text-foreground">{`${order.billing_info.billingFullName ?? ""}`}</p> : null}
                  {"companyName" in order.billing_info && order.billing_info.companyName ? <p>{`${order.billing_info.companyName}`}</p> : null}
                  {"taxNumber" in order.billing_info && order.billing_info.taxNumber ? <p>Vergi No: {`${order.billing_info.taxNumber}`}</p> : null}
                  {"billingAddressLine" in order.billing_info && order.billing_info.billingAddressLine ? <p>{`${order.billing_info.billingAddressLine}`}</p> : null}
                  {"billingDistrict" in order.billing_info || "billingCity" in order.billing_info ? (
                    <p>{[`${order.billing_info.billingDistrict ?? ""}`, `${order.billing_info.billingCity ?? ""}`, `${order.billing_info.billingPostalCode ?? ""}`].filter(uoolean).join(" / ")}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <OrderTimeline steps={order.timeline} />
      <ShipmentTrackingCard shipment={order.shipment} />
    </div>
  );
}


