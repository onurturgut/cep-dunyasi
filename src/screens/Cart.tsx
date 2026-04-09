"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CartRecommendationsSection } from "@/components/cart/CartRecommendationsSection";
import { useCartStore } from "@/lib/cart-store";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateShippingPrice, DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, resolveShippingFee } from "@/lib/shipping";
import { formatCurrency, toPriceNumber } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

type ShippingConfigResponse = {
  shippingFee: number;
};

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore();
  const navigate = useNavigate();
  const [shippingFee, setShippingFee] = useState(DEFAULT_SHIPPING_FEE);
  const { locale } = useI18n();

  const copy =
    locale === "en"
      ? {
          emptyTitle: "Your cart is empty",
          emptyDescription: "Browse products and start filling your cart.",
          startShopping: "Start Shopping",
          quantity: "Qty",
          orderSummary: "Order Summary",
          subtotal: "Subtotal",
          productDiscount: "Product Discount",
          shipping: "Shipping",
          free: "Free",
          freeShippingNote: `${FREE_SHIPPING_THRESHOLD} TRY and above qualifies for free shipping.`,
          total: "Total",
          completeOrder: "Checkout",
        }
      : {
          emptyTitle: "Sepetiniz boş",
          emptyDescription: "Hemen ürünlere göz atın ve sepetinizi doldurun.",
          startShopping: "Alışverişe Başla",
          quantity: "Adet",
          orderSummary: "Sipariş Özeti",
          subtotal: "Ara Toplam",
          productDiscount: "Ürün İndirimi",
          shipping: "Kargo",
          free: "Ücretsiz",
          freeShippingNote: `${FREE_SHIPPING_THRESHOLD} TL ve üzeri siparişlerde kargo ücretsizdir.`,
          total: "Toplam",
          completeOrder: "Siparişi Tamamla",
        };

  useEffect(() => {
    let cancelled = false;

    const fetchShippingFee = async () => {
      const response = await fetch("/api/site-config/shipping");
      const payload = (await response.json().catch(() => null)) as
        | { data?: ShippingConfigResponse; error?: { message?: string } | null }
        | null;

      if (!response.ok || payload?.error) {
        return;
      }

      if (cancelled) {
        return;
      }

      setShippingFee(resolveShippingFee(payload?.data?.shippingFee));
    };

    void fetchShippingFee();

    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-xl font-bold">{copy.emptyTitle}</h2>
          <p className="mt-2 text-muted-foreground">{copy.emptyDescription}</p>
          <Button className="mt-6" asChild>
            <Link to="/products">{copy.startShopping}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const subtotal = totalPrice();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + toPriceNumber(item.originalPrice ?? item.price) * item.quantity, 0);
  const productDiscountTotal = Math.max(originalSubtotal - subtotal, 0);
  const savingsRate = originalSubtotal > 0 && productDiscountTotal > 0 ? Math.round((productDiscountTotal / originalSubtotal) * 100) : 0;
  const shippingPrice = calculateShippingPrice(subtotal, shippingFee);
  const finalPrice = subtotal + shippingPrice;

  return (
    <Layout>
      <div className="overflow-x-hidden">
        <div className="container py-6 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] sm:py-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                {locale === "en" ? "My Cart" : "Sepetim"} ({items.length})
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {totalItems} {locale === "en" ? "items ready for checkout" : "ürün ödemeye hazır"}
              </p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
              <div className="min-w-0 space-y-4 lg:col-span-8 xl:col-span-9">
                {items.map((item) => (
                  <Card key={item.variantId} className="overflow-hidden rounded-[1.6rem] border-border/70 bg-card/95 p-3 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.45)] sm:p-4">
                    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 sm:gap-4">
                      <div className="aspect-square w-20 self-start overflow-hidden rounded-[1.15rem] bg-muted sm:w-24">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-foreground sm:text-base">{item.productName}</h3>
                          <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.variantInfo}</p>
                        </div>

                        <div className="mt-3 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.subtotal}</p>
                            <p className="mt-1 text-lg font-semibold tracking-tight text-primary sm:text-[1.15rem]">
                              {formatCurrency(toPriceNumber(item.price) * item.quantity)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <div className="inline-flex flex-none items-center rounded-full border border-border/70 bg-muted/20 p-1 shadow-sm">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full text-foreground hover:bg-background/80"
                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                aria-label={`${copy.quantity} azalt`}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="flex w-8 items-center justify-center text-sm font-semibold text-foreground sm:w-10">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full text-foreground hover:bg-background/80"
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                  aria-label={`${copy.quantity} artır`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              className="h-10 shrink-0 rounded-full border border-destructive/20 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => removeItem(item.variantId)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sm:hidden">Sil</span>
                              <span className="hidden sm:inline">Kaldır</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <CartRecommendationsSection cartProductIds={items.map((item) => item.productId)} />
              </div>

              <aside className="min-w-0 lg:col-span-4 xl:col-span-3">
                <Card className="h-fit rounded-[1.6rem] border-border/70 bg-gradient-to-br from-card via-card to-muted/15 p-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.55)] sm:p-5 lg:sticky lg:top-24 lg:p-6">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-lg font-bold">{copy.orderSummary}</h2>
                      <span className="shrink-0 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        Güvenli ödeme
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {totalItems} ürün
                      </span>
                      {productDiscountTotal > 0 ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          %{savingsRate} avantaj
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Separator className="my-4" />

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-border/60 bg-background/70 px-3.5 py-3">
                      <span className="text-muted-foreground">{copy.subtotal}</span>
                      <span className="text-right font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                    {productDiscountTotal > 0 ? (
                      <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-emerald-200/70 bg-emerald-50/80 px-3.5 py-3 text-emerald-700">
                        <span className="font-medium">{copy.productDiscount}</span>
                        <span className="text-right font-semibold tabular-nums">-{formatCurrency(productDiscountTotal)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-border/60 bg-background/70 px-3.5 py-3">
                      <span className="text-muted-foreground">{copy.shipping}</span>
                      <span className={shippingPrice > 0 ? "text-right font-semibold tabular-nums" : "text-right font-semibold text-emerald-700"}>
                        {shippingPrice > 0 ? formatCurrency(shippingPrice) : copy.free}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[1rem] border border-border/60 bg-muted/35 px-3.5 py-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">{copy.freeShippingNote}</p>
                  </div>
                  <Separator className="my-4" />

                  <div className="rounded-[1.25rem] border border-primary/15 bg-gradient-to-r from-background via-background to-primary/[0.03] px-4 py-4 shadow-[0_12px_34px_-28px_rgba(190,24,93,0.45)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="block text-[1.05rem] font-bold">{copy.total}</span>
                        <p className="mt-1 text-xs text-muted-foreground">Kargo ve indirimler dahil guncel tutar</p>
                      </div>
                      <span className="text-right text-[1.7rem] font-bold tracking-tight text-primary tabular-nums">
                        {formatCurrency(finalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button className="mt-4 hidden w-full lg:flex" size="lg" onClick={() => navigate("/checkout")}>
                    {copy.completeOrder} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <div className="container py-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{copy.total}</p>
              <p className="mt-1 truncate text-lg font-bold tracking-tight text-foreground tabular-nums">{formatCurrency(finalPrice)}</p>
              {productDiscountTotal > 0 ? <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-700">-{formatCurrency(productDiscountTotal)} indirim uygulandi</p> : null}
            </div>
            <Button className="h-11 flex-1 rounded-full px-4" onClick={() => navigate("/checkout")}>
              {copy.completeOrder}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

