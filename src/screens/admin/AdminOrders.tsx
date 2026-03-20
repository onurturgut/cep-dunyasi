"use client";

import { useEffect, useState } from 'react';
import { db } from '@/integrations/mongo/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Truck } from 'lucide-react';

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandi',
  processing: 'Hazirlaniyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'Iptal',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [shipForm, setShipForm] = useState({ cargoCompany: '', trackingNumber: '' });

  const fetchOrders = async () => {
    const { data } = await db
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await db.from('orders').update({ order_status: status }).eq('id', orderId);
    toast.success('Durum guncellendi');
    fetchOrders();
  };

  const addShipment = async () => {
    if (!selected) return;

    await db.from('shipments').insert({
      order_id: selected.id,
      cargo_company: shipForm.cargoCompany,
      tracking_number: shipForm.trackingNumber,
      status: 'shipped',
    });
    await updateStatus(selected.id, 'shipped');
    setSelected(null);
    setShipForm({ cargoCompany: '', trackingNumber: '' });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Siparisler</h1>

      <Card className="mt-6 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siparis</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Odeme</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Islem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString('tr-TR')}</TableCell>
                <TableCell className="font-medium">TL {order.final_price?.toLocaleString('tr-TR')}</TableCell>
                <TableCell>
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {order.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select value={order.order_status} onValueChange={(value) => updateStatus(order.id, value)}>
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelected(order)}>
                    <Truck className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Bilgisi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kargo Firmasi</Label>
              <Input
                value={shipForm.cargoCompany}
                onChange={(e) => setShipForm((current) => ({ ...current, cargoCompany: e.target.value }))}
                placeholder="Aras, Yurtici, MNG..."
              />
            </div>
            <div className="space-y-2">
              <Label>Takip Numarasi</Label>
              <Input
                value={shipForm.trackingNumber}
                onChange={(e) => setShipForm((current) => ({ ...current, trackingNumber: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={addShipment}>Kargo Bilgisi Ekle</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
