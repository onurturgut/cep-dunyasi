"use client";

import { useEffect, useState } from 'react';
import { db } from '@/integrations/mongo/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minOrder: '', usageLimit: '' });

  const fetchCoupons = async () => {
    const { data } = await db.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async () => {
    const { error } = await db.from('coupons').insert({
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_order_amount: form.minOrder ? parseFloat(form.minOrder) : 0,
      usage_limit: form.usageLimit ? parseInt(form.usageLimit, 10) : 0,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Kupon oluşturuldu');
    setDialogOpen(false);
    setForm({ code: '', type: 'percentage', value: '', minOrder: '', usageLimit: '' });
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    await db.from('coupons').delete().eq('id', id);
    toast.success('Kupon silindi');
    fetchCoupons();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Kuponlar</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Kupon Ekle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Kupon</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kupon Kodu</Label>
                <Input value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))} placeholder="INDIRIM20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tür</Label>
                  <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit (TL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Değer</Label>
                  <Input type="number" value={form.value} onChange={(e) => setForm((current) => ({ ...current, value: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min. Sipariş (TL)</Label>
                  <Input type="number" value={form.minOrder} onChange={(e) => setForm((current) => ({ ...current, minOrder: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Kullanım Limiti</Label>
                  <Input type="number" value={form.usageLimit} onChange={(e) => setForm((current) => ({ ...current, usageLimit: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={handleSave}>Oluştur</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-6 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Değer</TableHead>
              <TableHead>Kullanım</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                <TableCell>{coupon.type === 'percentage' ? 'Yüzde' : 'Sabit'}</TableCell>
                <TableCell>{coupon.type === 'percentage' ? `%${coupon.value}` : `TL ${coupon.value}`}</TableCell>
                <TableCell>{coupon.usage_count}/{coupon.usage_limit || 'sinirsiz'}</TableCell>
                <TableCell>
                  <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                    {coupon.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
