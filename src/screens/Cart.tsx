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
import { db } from "@/integrations/mongo/client";
import { calculateShippingPrice, DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, resolveShippingFee } from "@/lib/shipping";
import { formatCurrency, toPriceNumber } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";

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
          emptyTitle: "Sepetiniz bos",
          emptyDescription: "Hemen urunlere goz atin ve sepetinizi doldurun.",
          startShopping: "Alisverise Basla",
          quantity: "Adet",
          orderSummary: "Siparis Ozeti",
          subtotal: "Ara Toplam",
          productDiscount: "Urun Indirimi",
          shipping: "Kargo",
          free: "Ucretsiz",
          freeShippingNote: `${FREE_SHIPPING_THRESHOLD} TL ve uzeri siparislerde kargo ucretsizdir.`,
          total: "Toplam",
          completeOrder: "Siparisi Tamamla",
        };

  useEffect(() => {
    let cancelled = false;

    const fetchShippingFee = async () => {
      const { data } = await db.from("site_contents").select("shipping_fee").eq("key", "home").single();

      if (cancelled) {
        return;
      }

      setShippingFee(resolveShippingFee(data?.shipping_fee));
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
  const originalSubtotal = items.reduce((sum, item) => sum + toPriceNumber(item.originalPrice ?? item.price) * item.quantity, 0);
  const productDiscountTotal = Math.max(originalSubtotal - subtotal, 0);
  const shippingPrice = calculateShippingPrice(subtotal, shippingFee);
  const finalPrice = subtotal + shippingPrice;

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {locale === "en" ? "My Cart" : "Sepetim"} ({items.length})
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.variantId} className="flex flex-col gap-4 p-4 sm:flex-row">
                <div className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-20">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground">{item.variantInfo}</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-full items-center justify-center gap-2 rounded-lg border px-1 sm:w-auto sm:justify-start">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="font-semibold text-primary">{formatCurrency(toPriceNumber(item.price) * item.quantity)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.variantId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <CartRecommendationsSection cartProductIds={items.map((item) => item.productId)} />
          </div>

          <Card className="h-fit p-5 lg:sticky lg:top-24 lg:p-6">
            <h3 className="font-display text-lg font-bold">{copy.orderSummary}</h3>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{copy.subtotal}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {productDiscountTotal > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>{copy.productDiscount}</span>
                  <span>-{formatCurrency(productDiscountTotal)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{copy.shipping}</span>
                <span className={shippingPrice > 0 ? "" : "text-success"}>{shippingPrice > 0 ? formatCurrency(shippingPrice) : copy.free}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{copy.freeShippingNote}</p>
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span>{copy.total}</span>
              <span className="text-primary">{formatCurrency(finalPrice)}</span>
            </div>
            <Button className="mt-4 w-full" size="lg" onClick={() => navigate("/checkout")}>
              {copy.completeOrder} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
