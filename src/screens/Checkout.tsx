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
      toast.error('Gecersiz kupon kodu');
      return;
    }

    const total = totalPrice();

    if (data.min_order_amount && total < data.min_order_amount) {
      toast.error(`Minimum siparis tutari: TL ${data.min_order_amount}`);
      return;
    }

    const calculatedDiscount = data.type === 'percentage' ? (total * data.value) / 100 : data.value;
    setDiscount(Math.min(calculatedDiscount, total));
    toast.success('Kupon uygulandi');
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
      throw new Error(body?.error?.message || 'Checkout baslatilamadi');
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
      toast.success('Iyzico odeme sayfasina yonlendiriliyorsunuz');
      window.location.href = paymentPageUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Odeme baslatilamadi';
      toast.error('Odeme baslatilamadi', { description: message });
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
      <div className="container py-8">
        <h1 className="font-display text-2xl font-bold">Odeme</h1>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teslimat Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>Sehir</Label>
                  <Input required value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit p-6">
            <h3 className="font-display text-lg font-bold">Siparis Ozeti</h3>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between">
                  <span className="text-muted-foreground">{item.productName} x{item.quantity}</span>
                  <span>TL {(item.price * item.quantity).toLocaleString('tr-TR')}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Input placeholder="Kupon kodu" value={form.couponCode} onChange={(e) => handleChange('couponCode', e.target.value)} />
              <Button type="button" variant="outline" onClick={applyCoupon}>
                Uygula
              </Button>
            </div>
            {discount > 0 && (
              <div className="mt-2 flex justify-between text-sm text-success">
                <span>Indirim</span>
                <span>-TL {discount.toLocaleString('tr-TR')}</span>
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span className="text-primary">TL {finalPrice.toLocaleString('tr-TR')}</span>
            </div>
            <Button type="submit" className="mt-4 w-full" size="lg" disabled={loading}>
              <Lock className="mr-2 h-4 w-4" />
              {loading ? 'Isleniyor...' : 'Iyzico ile Ode'}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <CreditCard className="mr-1 inline h-3 w-3" />
              Iyzico guvenli odeme altyapisi
            </p>
          </Card>
        </form>
      </div>
    </Layout>
  );
}

