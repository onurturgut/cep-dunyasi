"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/integrations/mongo/client';
import { formatDate } from '@/lib/date';
import { Package, Clock } from 'lucide-react';
import { formatCurrency, toPriceNumber } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
};

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  confirmed: 'bg-primary/10 text-primary',
  processing: 'bg-accent/10 text-accent',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function Account() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    db
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
      });
  }, [user]);

  if (!user) return null;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-2xl font-bold">Hesabim</h1>
        <p className="text-muted-foreground">{user.email}</p>

        <h2 className="mt-8 font-display text-lg font-bold">Siparişlerim</h2>
        {orders.length === 0 ? (
          <div className="mt-4 flex flex-col items-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-2 text-muted-foreground">Henüz sipariş yok.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">#{order.id.slice(0, 8)}</CardTitle>
                  <Badge className={statusColors[order.order_status] || ''}>
                    {statusLabels[order.order_status] || order.order_status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(order.created_at)}
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p>{item.product_name} x{item.quantity}</p>
                          {item.variant_info && <p className="text-xs text-muted-foreground">{item.variant_info}</p>}
                        </div>
                        <span>{formatCurrency(toPriceNumber(item.unit_price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between font-semibold">
                    <span>Toplam</span>
                    <span className="text-primary">{formatCurrency(order.final_price)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
