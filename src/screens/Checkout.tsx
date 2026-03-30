"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Lock, MapPin, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAddresses } from "@/hooks/use-account";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/integrations/mongo/client";
import { useCartStore } from "@/lib/cart-store";
import type { AccountAddress } from "@/lib/account";
import { calculateOrderTotals, DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, resolveShippingFee } from "@/lib/shipping";
import { formatCurrency, toPriceNumber } from "@/lib/utils";

type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  couponCode: string;
};

type ShippingMode = "saved" | "manual";

function buildUserFullName(user: { full_name?: string | null; first_name?: string | null; last_name?: string | null }) {
  const direct = `${user.full_name ?? ""}`.trim();

  if (direct) {
    return direct;
  }

  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
}

function formatSelectedAddress(address: AccountAddress) {
  const detailParts = [address.address_line, address.neighborhood, address.district].filter(Boolean);

  return {
    fullName: address.full_name,
    phone: address.phone,
    city: address.city,
    address: detailParts.join(", "),
  };
}

function getDefaultAddress(addresses: AccountAddress[]) {
  return addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const addressesQuery = useAddresses(Boolean(user?.id));
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingMode, setShippingMode] = useState<ShippingMode>(user ? "saved" : "manual");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [shippingFee, setShippingFee] = useState(DEFAULT_SHIPPING_FEE);
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    couponCode: "",
  });

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);
  const hasSavedAddresses = addresses.length > 0;
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      email: user?.email || current.email,
      fullName: current.fullName || (user ? buildUserFullName(user) : ""),
      phone: current.phone || `${user?.phone ?? ""}`.trim(),
    }));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setShippingMode("manual");
      setSelectedAddressId("");
      return;
    }

    if (!hasSavedAddresses) {
      setShippingMode("manual");
      return;
    }

    const defaultAddress = getDefaultAddress(addresses);
    if (!defaultAddress) {
      return;
    }

    setShippingMode((current) => (current === "manual" ? current : "saved"));
    setSelectedAddressId((current) => current || defaultAddress.id);
  }, [addresses, hasSavedAddresses, user]);

  useEffect(() => {
    if (shippingMode !== "saved" || !selectedAddress) {
      return;
    }

    const normalized = formatSelectedAddress(selectedAddress);
    setForm((current) => ({
      ...current,
      fullName: normalized.fullName || current.fullName,
      email: user?.email || current.email,
      phone: normalized.phone,
      address: normalized.address,
      city: normalized.city,
    }));
  }, [selectedAddress, shippingMode, user?.email]);

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

  const handleChange = (field: keyof CheckoutFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyCoupon = async () => {
    if (!form.couponCode.trim()) {
      return;
    }

    const { data } = await db
      .from("coupons")
      .select("*")
      .eq("code", form.couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (!data) {
      toast.error("Gecersiz kupon kodu");
      return;
    }

    const total = totalPrice();

    if (data.min_order_amount && total < data.min_order_amount) {
      toast.error(`Minimum siparis tutari: ${formatCurrency(data.min_order_amount)}`);
      return;
    }

    const calculatedDiscount = data.type === "percentage" ? (total * data.value) / 100 : data.value;
    setDiscount(Math.min(calculatedDiscount, total));
    toast.success("Kupon uygulandi");
  };

  const startCheckout = async () => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
        },
        couponCode: form.couponCode,
      }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.data?.paymentPageUrl) {
      throw new Error(body?.error?.message || "Odeme baslatilamadi");
    }

    return body.data.paymentPageUrl as string;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (items.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const paymentPageUrl = await startCheckout();

      clearCart();
      toast.success("iyzico odeme sayfasina yonlendiriliyorsunuz");
      window.location.href = paymentPageUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Odeme baslatilamadi";
      toast.error("Odeme baslatilamadi", { description: message });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const subtotal = totalPrice();
  const { shippingPrice, finalPrice } = calculateOrderTotals(subtotal, discount, shippingFee);

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Odeme</h1>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teslimat Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {user ? (
                  <div className="space-y-4 rounded-3xl border border-border/70 bg-muted/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">Kayitli adresler</p>
                        <p className="mt-1 text-sm text-muted-foreground">Adres defterinizden bir teslimat adresi secin veya yeni bilgi girin.</p>
                      </div>
                      <Link to="/account/addresses" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                        Adresleri yonet
                      </Link>
                    </div>

                    {hasSavedAddresses ? (
                      <>
                        <RadioGroup
                          value={shippingMode}
                          onValueChange={(value) => setShippingMode(value as ShippingMode)}
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                            <RadioGroupItem value="saved" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Kayitli adres kullan</p>
                              <p className="text-xs text-muted-foreground">Varsayilan veya secilen adresle devam et</p>
                            </div>
                          </label>
                          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                            <RadioGroupItem value="manual" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Yeni adres gir</p>
                              <p className="text-xs text-muted-foreground">Bu siparis icin farkli teslimat bilgisi kullan</p>
                            </div>
                          </label>
                        </RadioGroup>

                        {shippingMode === "saved" ? (
                          <div className="space-y-3">
                            <Label>Kullanilacak adres</Label>
                            <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-3">
                              {addresses.map((address) => (
                                <label
                                  key={address.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-4 transition-colors hover:border-primary/40"
                                >
                                  <RadioGroupItem value={address.id} className="mt-1" />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium text-foreground">{address.title}</p>
                                      {address.is_default ? (
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                                          Varsayilan
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-1 text-sm text-foreground">{address.full_name}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                      {address.address_line}
                                      <br />
                                      {address.neighborhood}, {address.district} / {address.city}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          Kayitli adresiniz bulunmuyor. Bu siparis icin adres bilgilerinizi asagidan girebilir veya once hesap alanindan adres ekleyebilirsiniz.
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input required value={form.fullName} onChange={(event) => handleChange("fullName", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input type="email" required value={form.email} onChange={(event) => handleChange("email", event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input required value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Textarea
                    required
                    value={form.address}
                    onChange={(event) => handleChange("address", event.target.value)}
                    className="min-h-[110px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sehir</Label>
                  <Input required value={form.city} onChange={(event) => handleChange("city", event.target.value)} />
                </div>

                {user && hasSavedAddresses ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    Yeni bir adres eklemek isterseniz{" "}
                    <Link to="/account/addresses" className="font-medium text-primary transition-colors hover:text-primary/80">
                      hesap alanindaki adres defterine
                    </Link>{" "}
                    gidebilirsiniz.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit p-5 lg:sticky lg:top-24 lg:p-6">
            <h3 className="font-display text-lg font-bold">Siparis Ozeti</h3>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-muted-foreground">
                      {item.productName} x{item.quantity}
                    </p>
                    {item.variantInfo ? <p className="text-xs text-muted-foreground/80">{item.variantInfo}</p> : null}
                  </div>
                  <span className="shrink-0">{formatCurrency(toPriceNumber(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Kupon kodu" value={form.couponCode} onChange={(event) => handleChange("couponCode", event.target.value)} />
              <Button type="button" variant="outline" onClick={applyCoupon}>
                Uygula
              </Button>
            </div>
            {discount > 0 ? (
              <div className="mt-2 flex justify-between text-sm text-success">
                <span>Indirim</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Kargo</span>
              <span className={shippingPrice > 0 ? "text-foreground" : "text-success"}>
                {shippingPrice > 0 ? formatCurrency(shippingPrice) : "Ucretsiz"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {FREE_SHIPPING_THRESHOLD} TL ve uzeri siparislerde kargo ucretsizdir.
            </p>
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span className="text-primary">{formatCurrency(finalPrice)}</span>
            </div>
            <Button type="submit" className="mt-4 w-full" size="lg" disabled={loading}>
              <Lock className="mr-2 h-4 w-4" />
              {loading ? "Isleniyor..." : "iyzico ile Ode"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <CreditCard className="mr-1 inline h-3 w-3" />
              iyzico guvenli odeme altyapisi
            </p>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
