"use client";

import { Link, useNavigate } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-xl font-bold">Sepetiniz bos</h2>
          <p className="mt-2 text-muted-foreground">Hemen urunlere goz atin ve sepetinizi doldurun.</p>
          <Button className="mt-6" asChild>
            <Link to="/products">Alisverise Basla</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-2xl font-bold">Sepetim ({items.length})</h1>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {items.map((item) => (
              <Card key={item.variantId} className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-lg border px-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">TL {(item.price * item.quantity).toLocaleString('tr-TR')}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.variantId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="h-fit p-6">
            <h3 className="font-display text-lg font-bold">Siparis Ozeti</h3>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>TL {totalPrice().toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kargo</span>
                <span className="text-success">Ucretsiz</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span className="text-primary">TL {totalPrice().toLocaleString('tr-TR')}</span>
            </div>
            <Button className="mt-4 w-full" size="lg" onClick={() => navigate('/checkout')}>
              Siparisi Tamamla <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
