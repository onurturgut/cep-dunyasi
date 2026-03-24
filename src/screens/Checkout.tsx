"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/integrations/mongo/client';
import { toast } from 'sonner';
import { CreditCard, Lock } from 'lucide-react';
import { formatCurrency, toPriceNumber } from '@/lib/utils';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    couponCode: '',
  });
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (!user?.email) {
      return;
    }

    setForm((current) => ({
      ...current,
      email: current.email || user.email,
    }));
  }, [user?.email]);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const applyCoupon = async () => {
    if (!form.couponCode) return;

    const { data } = await db
      .from('coupons')
      .select('*')
      .eq('code', form.couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!data) {
      toast.error('Geçersiz kupon kodu');
      return;
    }

    const total = totalPrice();

    if (data.min_order_amount && total < data.min_order_amount) {
      toast.error(`Minimum sipariş tutarı: ${formatCurrency(data.min_order_amount)}`);
      return;
    }

    const calculatedDiscount = data.type === 'percentage' ? (total * data.value) / 100 : data.value;
    setDiscount(Math.min(calculatedDiscount, total));
    toast.success('Kupon uygulandı');
  };

  const startCheckout = async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    const body = await response.json();

    if (!response.ok || !body?.data?.paymentPageUrl) {
      throw new Error(body?.error?.message || 'Ödeme başlatılamadı');
    }

    return body.data.paymentPageUrl as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) return;

    setLoading(true);

    try {
      const paymentPageUrl = await startCheckout();

      clearCart();
      toast.success('iyzico ödeme sayfasına yönlendiriliyorsunuz');
      window.location.href = paymentPageUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ödeme baslatilamadi';
      toast.error('Ödeme baslatilamadi', { description: message });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const finalPrice = totalPrice() - discount;

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Ödeme</h1>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teslimat Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input required value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input type="email" required value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input required value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Input required value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Input required value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit p-5 lg:sticky lg:top-24 lg:p-6">
            <h3 className="font-display text-lg font-bold">Sipariş Özeti</h3>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-muted-foreground">{item.productName} x{item.quantity}</p>
                    {item.variantInfo && <p className="text-xs text-muted-foreground/80">{item.variantInfo}</p>}
                  </div>
                  <span className="shrink-0">{formatCurrency(toPriceNumber(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Kupon kodu" value={form.couponCode} onChange={(e) => handleChange('couponCode', e.target.value)} />
              <Button type="button" variant="outline" onClick={applyCoupon}>
                Uygula
              </Button>
            </div>
            {discount > 0 && (
              <div className="mt-2 flex justify-between text-sm text-success">
                <span>İndirim</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span className="text-primary">{formatCurrency(finalPrice)}</span>
            </div>
            <Button type="submit" className="mt-4 w-full" size="lg" disabled={loading}>
              <Lock className="mr-2 h-4 w-4" />
              {loading ? 'İşleniyor...' : 'iyzico ile Ode'}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <CreditCard className="mr-1 inline h-3 w-3" />
              iyzico güvenli ödeme altyapısı
            </p>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
