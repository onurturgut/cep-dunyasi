"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BankTransferInstructions } from "@/components/checkout/BankTransferInstructions";
import { InstallmentOptions } from "@/components/checkout/InstallmentOptions";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { SecurePaymentNote } from "@/components/checkout/SecurePaymentNote";
import { useAddresses } from "@/hooks/use-account";
import { useCheckoutPaymentMethods, useInstallmentPreview, useStartCheckout } from "@/hooks/use-checkout";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/lib/cart-store";
import type { AccountAddress } from "@/lib/account";
import type { BillingInfoInput, CheckoutPaymentMethod, ShippingAddressInput } from "@/lib/checkout";
import { copyShippingAddressToBilling, sanitizeCheckoutPhone, sanitizeIdentityNumber } from "@/lib/checkout";
import { calculateOrderTotals, DEFAULT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, resolveShippingFee } from "@/lib/shipping";
import { formatCurrency, toPriceNumber } from "@/lib/utils";

type ShippingMode = "saved" | "manual";

type CheckoutFormState = {
  shippingAddress: ShippingAddressInput;
  billingInfo: BillingInfoInput;
  couponCode: string;
  paymentMethod: CheckoutPaymentMethod;
  installmentMonths: number;
};

type BillingFieldKey =
  | "invoiceType"
  | "useShippingAddressAsBilling"
  | "billingFullName"
  | "billingPhone"
  | "billingEmail"
  | "billingAddressTitle"
  | "billingCity"
  | "billingDistrict"
  | "billingNeighborhood"
  | "billingAddressLine"
  | "billingPostalCode"
  | "identityNumber"
  | "companyName"
  | "taxOffice"
  | "taxNumber"
  | "authorizedPerson";

type ShippingConfigResponse = {
  shippingFee: number;
};

type CouponPreviewResponse = {
  couponCode: string;
  valid: boolean;
  discount: number;
  error: string | null;
  coupon: {
    id: string;
    code: string;
    type: string;
    value: number;
    minOrderAmount: number;
  } | null;
};

function buildUserFullName(user: { full_name?: string | null; first_name?: string | null; last_name?: string | null }) {
  const direct = `${user.full_name ?? ""}`.trim();

  if (direct) {
    return direct;
  }

  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
}

function createEmptyShippingAddress(email: string, fullName: string, phone: string): ShippingAddressInput {
  return {
    fullName,
    email,
    phone: sanitizeCheckoutPhone(phone),
    addressTitle: "",
    city: "",
    district: "",
    neighborhood: "",
    addressLine: "",
    postalCode: "",
  };
}

function createDefaultBillingInfo(shippingAddress: ShippingAddressInput): BillingInfoInput {
  return copyShippingAddressToBilling(shippingAddress, {
    invoiceType: "individual",
    useShippingAddressAsBilling: true,
    billingFullName: shippingAddress.fullName,
    billingPhone: shippingAddress.phone,
    billingEmail: shippingAddress.email,
    billingAddressTitle: shippingAddress.addressTitle,
    billingCity: shippingAddress.city,
    billingDistrict: shippingAddress.district,
    billingNeighborhood: shippingAddress.neighborhood,
    billingAddressLine: shippingAddress.addressLine,
    billingPostalCode: shippingAddress.postalCode,
    identityNumber: "",
  });
}

function mapSavedAddress(address: AccountAddress, email: string): ShippingAddressInput {
  return {
    fullName: address.full_name,
    email,
    phone: sanitizeCheckoutPhone(address.phone),
    addressTitle: address.title,
    city: address.city,
    district: address.district,
    neighborhood: address.neighborhood,
    addressLine: address.address_line,
    postalCode: address.postal_code,
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
  const paymentMethodsQuery = useCheckoutPaymentMethods();
  const startCheckout = useStartCheckout();
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [shippingMode, setShippingMode] = useState<ShippingMode>(user ? "saved" : "manual");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingFee, setShippingFee] = useState(DEFAULT_SHIPPING_FEE);
  const [bankTransferPreview, setBankTransferPreview] = useState<{
    accountHolder: string;
    iban: string;
    bankName: string;
    branchName?: string | null;
    description: string;
  } | null>(null);

  const initialShipping = createEmptyShippingAddress(user?.email || "", user ? buildUserFullName(user) : "", `${user?.phone ?? ""}`.trim());
  const [form, setForm] = useState<CheckoutFormState>({
    shippingAddress: initialShipping,
    billingInfo: createDefaultBillingInfo(initialShipping),
    couponCode: "",
    paymentMethod: "credit_card_3ds",
    installmentMonths: 1,
  });

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);
  const hasSavedAddresses = addresses.length > 0;
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );
  const paymentMethods = useMemo(() => paymentMethodsQuery.data?.methods ?? [], [paymentMethodsQuery.data?.methods]);
  const subtotal = totalPrice();
  const installmentPreviewQuery = useInstallmentPreview(
    Math.max(calculateOrderTotals(subtotal, discount, shippingFee).finalPrice, 0),
    form.paymentMethod,
    form.paymentMethod === "credit_card_3ds",
  );

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate]);

  useEffect(() => {
    if (!paymentMethodsQuery.data?.defaultMethod) {
      return;
    }

    setForm((current) => {
      if (paymentMethods.some((item) => item.method === current.paymentMethod)) {
        return current;
      }

      return {
        ...current,
        paymentMethod: paymentMethodsQuery.data.defaultMethod,
      };
    });
  }, [paymentMethods, paymentMethodsQuery.data?.defaultMethod]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
        shippingAddress: {
          ...current.shippingAddress,
          email: user?.email || current.shippingAddress.email,
          fullName: current.shippingAddress.fullName || (user ? buildUserFullName(user) : ""),
          phone: current.shippingAddress.phone || sanitizeCheckoutPhone(`${user?.phone ?? ""}`.trim()),
        },
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

    setSelectedAddressId((current) => current || defaultAddress.id);
  }, [addresses, hasSavedAddresses, user]);

  useEffect(() => {
    if (shippingMode !== "saved" || !selectedAddress) {
      return;
    }

    const nextShipping = mapSavedAddress(selectedAddress, user?.email || form.shippingAddress.email);
    setForm((current) => ({
      ...current,
      shippingAddress: nextShipping,
      billingInfo: current.billingInfo.useShippingAddressAsBilling
        ? copyShippingAddressToBilling(nextShipping, current.billingInfo)
        : current.billingInfo,
    }));
  }, [selectedAddress, shippingMode, user?.email, form.shippingAddress.email]);

  useEffect(() => {
    let cancelled = false;

    const fetchShippingFee = async () => {
      const response = await fetch("/api/site-config/shipping");
      const payload = (await response.json().catch(() => null)) as
        | { data?: ShippingConfigResponse; error?: { message?: string } | null }
        | null;

      if (!response.ok || payload?.error || cancelled) {
        return;
      }

      setShippingFee(resolveShippingFee(payload?.data?.shippingFee));
    };

    void fetchShippingFee();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleShippingChange = (field: keyof ShippingAddressInput, value: string) => {
    setForm((current) => {
      const nextValue = field === "phone" ? sanitizeCheckoutPhone(value) : value;
      const shippingAddress = {
        ...current.shippingAddress,
        [field]: nextValue,
      };

      return {
        ...current,
        shippingAddress,
        billingInfo: current.billingInfo.useShippingAddressAsBilling
          ? copyShippingAddressToBilling(shippingAddress, current.billingInfo)
          : current.billingInfo,
      };
    });
  };

  const handleBillingChange = (field: BillingFieldKey, value: string | boolean) => {
    const nextValue =
      typeof value === "boolean"
        ? value
        : field === "billingPhone"
          ? sanitizeCheckoutPhone(value)
          : field === "identityNumber"
            ? sanitizeIdentityNumber(value)
            : value;

    setForm((current) => ({
      ...current,
      billingInfo: {
        ...current.billingInfo,
        [field]: nextValue,
      } as BillingInfoInput,
    }));
  };

  const applyCoupon = async () => {
    if (!form.couponCode.trim()) {
      setDiscount(0);
      return;
    }

    const response = await fetch("/api/checkout/coupon-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        couponCode: form.couponCode,
        subtotal,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: CouponPreviewResponse; error?: { message?: string } | null }
      | null;

    if (!response.ok || payload?.error) {
      toast.error(payload?.error?.message || "Kupon kodu kontrol edilemedi");
      return;
    }

    const data = payload?.data?.coupon
      ? {
          ...payload.data.coupon,
          min_order_amount: payload.data.coupon.minOrderAmount,
        }
      : null;

    if (!data) {
      toast.error("Geçersiz kupon kodu");
      return;
    }

    if (data.min_order_amount && subtotal < data.min_order_amount) {
      toast.error(`Minimum sipariş tutarı: ${formatCurrency(data.min_order_amount)}`);
      return;
    }

    const calculatedDiscount = data.type === "percentage" ? (subtotal * data.value) / 100 : data.value;
    setDiscount(Math.min(calculatedDiscount, subtotal));
    toast.success("Kupon uygulandı");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (items.length === 0 || loading) {
      return;
    }

    setLoading(true);

    try {
      const billingInfo = form.billingInfo.useShippingAddressAsBilling
        ? copyShippingAddressToBilling(form.shippingAddress, form.billingInfo)
        : form.billingInfo;

      const result = await startCheckout.mutateAsync({
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingAddress: form.shippingAddress,
        billingInfo,
        couponCode: form.couponCode,
        paymentMethod: form.paymentMethod,
        installmentMonths: form.installmentMonths,
        origin: window.location.origin,
      });

      clearCart();

      if (result.bankTransferInstructions) {
        setBankTransferPreview(result.bankTransferInstructions);
      }

      if (result.paymentPageUrl) {
        toast.success("Güvenli ödeme sayfasına yönlendiriliyorsunuz");
        window.location.href = result.paymentPageUrl;
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ödeme başlatılamadı";
      toast.error("Ödeme başlatılamadı", { description: message });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const originalSubtotal = items.reduce((sum, item) => sum + toPriceNumber(item.originalPrice ?? item.price) * item.quantity, 0);
  const productDiscountTotal = Math.max(originalSubtotal - subtotal, 0);
  const { shippingPrice, finalPrice } = calculateOrderTotals(subtotal, discount, shippingFee);

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Ödeme</h1>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
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
                        <p className="font-medium text-foreground">Kayıtlı adresler</p>
                        <p className="mt-1 text-sm text-muted-foreground">Adres defterinizden seçim yapabilir veya yeni teslimat bilgisi girebilirsiniz.</p>
                      </div>
                      <Link to="/account/addresses" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                        Adresleri yönet
                      </Link>
                    </div>

                    {hasSavedAddresses ? (
                      <>
                        <RadioGroup value={shippingMode} onValueChange={(value) => setShippingMode(value as ShippingMode)} className="grid gap-3 sm:grid-cols-2">
                          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                            <RadioGroupItem value="saved" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Kayıtlı adres kullan</p>
                              <p className="text-xs text-muted-foreground">Varsayılan veya seçilen adresle devam et</p>
                            </div>
                          </label>
                          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                            <RadioGroupItem value="manual" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Yeni adres gir</p>
                              <p className="text-xs text-muted-foreground">Bu sipariş için farklı teslimat bilgisi kullan</p>
                            </div>
                          </label>
                        </RadioGroup>

                        {shippingMode === "saved" ? (
                          <div className="space-y-3">
                            <Label>Kullanılacak adres</Label>
                            <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-3">
                              {addresses.map((address) => (
                                <label key={address.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-4 transition-colors hover:border-primary/40">
                                  <RadioGroupItem value={address.id} className="mt-1" />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium text-foreground">{address.title}</p>
                                      {address.is_default ? (
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Varsayılan</span>
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
                        <div>Henüz kayıtlı adresiniz yok. Aşağıdan manuel bilgi girebilir veya önce hesap alanından adres ekleyebilirsiniz.</div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input required value={form.shippingAddress.fullName} onChange={(event) => handleShippingChange("fullName", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input required type="email" value={form.shippingAddress.email} onChange={(event) => handleShippingChange("email", event.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      required
                      inputMode="numeric"
                      maxLength={11}
                      value={form.shippingAddress.phone}
                      onChange={(event) => handleShippingChange("phone", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adres Başlığı</Label>
                    <Input value={form.shippingAddress.addressTitle} onChange={(event) => handleShippingChange("addressTitle", event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Textarea required value={form.shippingAddress.addressLine} onChange={(event) => handleShippingChange("addressLine", event.target.value)} className="min-h-[110px]" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Şehir</Label>
                    <Input required value={form.shippingAddress.city} onChange={(event) => handleShippingChange("city", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>İlçe</Label>
                    <Input required value={form.shippingAddress.district} onChange={(event) => handleShippingChange("district", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mahalle</Label>
                    <Input value={form.shippingAddress.neighborhood} onChange={(event) => handleShippingChange("neighborhood", event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Posta Kodu</Label>
                  <Input value={form.shippingAddress.postalCode} onChange={(event) => handleShippingChange("postalCode", event.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fatura Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Teslimat adresini fatura adresi olarak kullan</p>
                    <p className="text-xs text-muted-foreground">Aynı kişi ve adres için hızlı devam edin.</p>
                  </div>
                  <Switch
                    checked={form.billingInfo.useShippingAddressAsBilling}
                    onCheckedChange={(checked) => {
                      setForm((current) => ({
                        ...current,
                        billingInfo: checked ? copyShippingAddressToBilling(current.shippingAddress, current.billingInfo) : { ...current.billingInfo, useShippingAddressAsBilling: checked },
                      }));
                    }}
                  />
                </div>

                <Tabs
                  value={form.billingInfo.invoiceType}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      billingInfo:
                        value === "corporate"
                          ? {
                              invoiceType: "corporate",
                              useShippingAddressAsBilling: current.billingInfo.useShippingAddressAsBilling,
                              billingFullName: current.billingInfo.billingFullName,
                              billingPhone: current.billingInfo.billingPhone,
                              billingEmail: current.billingInfo.billingEmail,
                              billingAddressTitle: current.billingInfo.billingAddressTitle,
                              billingCity: current.billingInfo.billingCity,
                              billingDistrict: current.billingInfo.billingDistrict,
                              billingNeighborhood: current.billingInfo.billingNeighborhood,
                              billingAddressLine: current.billingInfo.billingAddressLine,
                              billingPostalCode: current.billingInfo.billingPostalCode,
                              companyName: "",
                              taxOffice: "",
                              taxNumber: "",
                              authorizedPerson: current.billingInfo.billingFullName,
                            }
                          : {
                              invoiceType: "individual",
                              useShippingAddressAsBilling: current.billingInfo.useShippingAddressAsBilling,
                              billingFullName: current.billingInfo.billingFullName,
                              billingPhone: current.billingInfo.billingPhone,
                              billingEmail: current.billingInfo.billingEmail,
                              billingAddressTitle: current.billingInfo.billingAddressTitle,
                              billingCity: current.billingInfo.billingCity,
                              billingDistrict: current.billingInfo.billingDistrict,
                              billingNeighborhood: current.billingInfo.billingNeighborhood,
                              billingAddressLine: current.billingInfo.billingAddressLine,
                              billingPostalCode: current.billingInfo.billingPostalCode,
                              identityNumber: "",
                            },
                    }))
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="individual">Bireysel</TabsTrigger>
                    <TabsTrigger value="corporate">Kurumsal</TabsTrigger>
                  </TabsList>

                  <TabsContent value="individual" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Fatura Ad Soyad</Label>
                        <Input value={form.billingInfo.billingFullName} onChange={(event) => handleBillingChange("billingFullName", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>TC Kimlik No</Label>
                        <Input
                          inputMode="numeric"
                          maxLength={11}
                          value={form.billingInfo.invoiceType === "individual" ? form.billingInfo.identityNumber : ""}
                          onChange={(event) => form.billingInfo.invoiceType === "individual" && handleBillingChange("identityNumber", event.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="corporate" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Firma Adı</Label>
                        <Input value={form.billingInfo.invoiceType === "corporate" ? form.billingInfo.companyName : ""} onChange={(event) => form.billingInfo.invoiceType === "corporate" && handleBillingChange("companyName", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Yetkili Kişi</Label>
                        <Input value={form.billingInfo.invoiceType === "corporate" ? form.billingInfo.authorizedPerson : ""} onChange={(event) => form.billingInfo.invoiceType === "corporate" && handleBillingChange("authorizedPerson", event.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Vergi Dairesi</Label>
                        <Input value={form.billingInfo.invoiceType === "corporate" ? form.billingInfo.taxOffice : ""} onChange={(event) => form.billingInfo.invoiceType === "corporate" && handleBillingChange("taxOffice", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Vergi No</Label>
                        <Input value={form.billingInfo.invoiceType === "corporate" ? form.billingInfo.taxNumber : ""} onChange={(event) => form.billingInfo.invoiceType === "corporate" && handleBillingChange("taxNumber", event.target.value)} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fatura Telefonu</Label>
                    <Input
                      inputMode="numeric"
                      maxLength={11}
                      value={form.billingInfo.billingPhone}
                      onChange={(event) => handleBillingChange("billingPhone", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fatura E-postası</Label>
                    <Input type="email" value={form.billingInfo.billingEmail} onChange={(event) => handleBillingChange("billingEmail", event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fatura Adresi</Label>
                  <Textarea value={form.billingInfo.billingAddressLine} onChange={(event) => handleBillingChange("billingAddressLine", event.target.value)} className="min-h-[100px]" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Şehir</Label>
                    <Input value={form.billingInfo.billingCity} onChange={(event) => handleBillingChange("billingCity", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>İlçe</Label>
                    <Input value={form.billingInfo.billingDistrict} onChange={(event) => handleBillingChange("billingDistrict", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mahalle</Label>
                    <Input value={form.billingInfo.billingNeighborhood} onChange={(event) => handleBillingChange("billingNeighborhood", event.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ödeme Yöntemi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <PaymentMethodSelector methods={paymentMethods} value={form.paymentMethod} onChange={(paymentMethod) => setForm((current) => ({ ...current, paymentMethod }))} />

                {form.paymentMethod === "credit_card_3ds" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Taksit seçeneği</Label>
                      <RadioGroup value={`${form.installmentMonths}`} onValueChange={(value) => setForm((current) => ({ ...current, installmentMonths: Number(value) }))} className="grid gap-3 sm:grid-cols-3">
                        {[1, 2, 3, 6, 9, 12].map((months) => (
                          <label key={months} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
                            <RadioGroupItem value={`${months}`} />
                            <span className="text-sm font-medium">{months === 1 ? "Peşin" : `${months} taksit`}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                    <InstallmentOptions options={installmentPreviewQuery.data?.options ?? []} />
                  </>
                ) : null}

                {bankTransferPreview && form.paymentMethod === "bank_transfer" ? (
                  <BankTransferInstructions instructions={bankTransferPreview} />
                ) : null}

                <SecurePaymentNote text="Ödeme ve sipariş verileriniz sunucu tarafında doğrulanır. 3D Secure, callback ve tekrar deneme kayıtları operasyon ekibi için izlenebilir tutulur." />
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit p-5 lg:sticky lg:top-24 lg:p-6">
            <h3 className="font-display text-lg font-bold">Sipariş Özeti</h3>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-foreground">{item.productName} x{item.quantity}</p>
                    {item.variantInfo ? <p className="text-xs text-muted-foreground">{item.variantInfo}</p> : null}
                  </div>
                  <span className="shrink-0">{formatCurrency(toPriceNumber(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Kupon kodu" value={form.couponCode} onChange={(event) => setForm((current) => ({ ...current, couponCode: event.target.value }))} />
              <Button type="button" variant="outline" onClick={applyCoupon}>
                Uygula
              </Button>
            </div>
            {productDiscountTotal > 0 ? (
              <div className="mt-2 flex justify-between text-sm text-emerald-700">
                <span>Ürün indirimi</span>
                <span>-{formatCurrency(productDiscountTotal)}</span>
              </div>
            ) : null}
            {discount > 0 ? (
              <div className="mt-2 flex justify-between text-sm text-emerald-700">
                <span>Kupon indirimi</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Kargo</span>
              <span className={shippingPrice > 0 ? "text-foreground" : "text-emerald-700"}>
                {shippingPrice > 0 ? formatCurrency(shippingPrice) : "Ücretsiz"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{FREE_SHIPPING_THRESHOLD} TL ve üzeri siparişlerde kargo ücretsizdir.</p>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam</span>
                <span className="text-primary">{formatCurrency(finalPrice)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Seçilen yöntem: {paymentMethods.find((item) => item.method === form.paymentMethod)?.label ?? "Kart ile ödeme"}
              </p>
            </div>

            <Button type="submit" className="mt-4 w-full" size="lg" disabled={loading || startCheckout.isPending}>
              {loading || startCheckout.isPending ? "İşleniyor..." : "Ödemeyi Başlat"}
            </Button>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                Başarısız ödemelerde siparişiniz kaybolmaz. Fatura ve teslimat bilgileriniz korunur, daha sonra tekrar ödeme deneyebilirsiniz.
              </div>
            </div>

            {user && hasSavedAddresses ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
                <PlusCircle className="h-4 w-4 text-primary" />
                <span>Adreslerinizi güncellemek isterseniz</span>
                <Link to="/account/addresses" className="font-medium text-primary transition-colors hover:text-primary/80">
                  hesap alanındaki adres defterine gidin
                </Link>
              </div>
            ) : null}
          </Card>
        </form>
      </div>
    </Layout>
  );
}
