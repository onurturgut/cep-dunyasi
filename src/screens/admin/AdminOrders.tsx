"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShipmentForm } from "@/components/admin/ShipmentForm";
import { useAdminOrderDetail, useAdminOrders, useUpdateOrderStatus, useUpsertShipment } from "@/hooks/use-admin";
import { ORDER_STATUS_LABELS, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_LABELS } from "@/lib/admin";
import { formatDateTime } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [shipmentOrderId, setShipmentOrderId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const ordersQuery = useAdminOrders({ page: 1, limit: 50, search, status, paymentStatus });
  const detailQuery = useAdminOrderDetail(selectedOrderId);
  const updateOrderStatus = useUpdateOrderStatus();
  const upsertShipment = useUpsertShipment();

  const currentDetail = detailQuery.data;
  const currentOrderStatus = currentDetail?.orderStatus ?? "pending";
  const orderItems = ordersQuery.data?.items ?? [];

  const paymentStatuses = useMemo(() => ["all", "pending", "paid", "failed", "refunded"], []);

  useEffect(() => {
    if (currentDetail) {
      setAdminNote(currentDetail.adminNote ?? "");
    }
  }, [currentDetail]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Siparisler</h1>
        <p className="text-sm text-muted-foreground">Durum, kargo ve odeme akislarini tek ekrandan yonetin.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Siparis no veya musteri ile ara" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tum Durumlar</SelectItem>
              {ORDER_STATUS_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {ORDER_STATUS_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tum Odemeler</SelectItem>
              {paymentStatuses.filter((item) => item !== "all").map((item) => (
                <SelectItem key={item} value={item}>
                  {PAYMENT_STATUS_LABELS[item] ?? item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {orderItems.map((order) => (
          <Card key={order.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                  <p className="truncate font-semibold">{order.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{order.customerEmail ?? "-"}</p>
                </div>
                <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tarih</p>
                  <p>{formatDateTime(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tutar</p>
                  <p className="font-medium">{formatCurrency(order.finalPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Durum</p>
                  <Badge variant={order.orderStatus === "cancelled" ? "destructive" : "secondary"} className="mt-1">
                    {
                      ORDER_STATUS_LABELS[
                        (ORDER_STATUS_OPTIONS.includes(order.orderStatus as (typeof ORDER_STATUS_OPTIONS)[number]) ? order.orderStatus : "pending") as (typeof ORDER_STATUS_OPTIONS)[number]
                      ]
                    }
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kargo</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {order.shipmentCompany ? `${order.shipmentCompany} / ${order.shipmentTrackingNumber ?? "-"}` : "-"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedOrderId(order.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Detay
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShipmentOrderId(order.id)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Kargo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {orderItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Siparis kaydi bulunamadi.</CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow>
                <TableHead>Siparis</TableHead>
                <TableHead>Musteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Odeme</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kargo</TableHead>
                <TableHead className="text-right">Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail ?? "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(order.finalPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.orderStatus === "cancelled" ? "destructive" : "secondary"}>
                      {ORDER_STATUS_LABELS[(ORDER_STATUS_OPTIONS.includes(order.orderStatus as (typeof ORDER_STATUS_OPTIONS)[number]) ? order.orderStatus : "pending") as (typeof ORDER_STATUS_OPTIONS)[number]]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {order.shipmentCompany ? `${order.shipmentCompany} / ${order.shipmentTrackingNumber ?? "-"}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(order.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setShipmentOrderId(order.id)}>
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orderItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Siparis kaydi bulunamadi.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedOrderId)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Siparis Detayi</DialogTitle>
          </DialogHeader>
          {currentDetail ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-sm text-muted-foreground">Musteri</p>
                  <p className="mt-2 font-semibold">{currentDetail.customerName}</p>
                  <p className="text-sm text-muted-foreground">{currentDetail.customerEmail ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="mt-2 text-xl font-semibold">{formatCurrency(currentDetail.finalPrice)}</p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-sm text-muted-foreground">Odeme</p>
                  <p className="mt-2 font-semibold">{PAYMENT_STATUS_LABELS[currentDetail.paymentStatus] ?? currentDetail.paymentStatus}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label>Durum Guncelle</Label>
                  <Select
                    value={currentOrderStatus}
                    onValueChange={async (value) => {
                      if (!selectedOrderId) {
                        return;
                      }
                      await updateOrderStatus.mutateAsync({
                        orderId: selectedOrderId,
                        status: value,
                        note: adminNote.trim() ? adminNote : null,
                      });
                      toast.success("Siparis durumu guncellendi");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {ORDER_STATUS_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admin Notu</Label>
                  <Input value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Siparis notu ekleyin" />
                </div>
              </div>

              <Card>
                <CardContent className="space-y-4 p-4">
                  <p className="font-semibold">Siparis Kalemleri</p>
                  {currentDetail.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center">
                      {item.variantImage ? <img src={item.variantImage} alt={item.productName} className="h-16 w-16 rounded-lg object-cover" /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{item.variantInfo ?? item.variantSku ?? "-"}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-muted-foreground">{item.quantity} adet</p>
                        <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-4">
                  <p className="font-semibold">Durum Gecmisi</p>
                  {(currentDetail.statusHistory ?? []).map((entry) => (
                    <div key={`${entry.createdAt}-${entry.status}`} className="rounded-xl border border-border/70 p-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium">{ORDER_STATUS_LABELS[entry.status]}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                      </div>
                      {entry.note ? <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p> : null}
                    </div>
                  ))}
                  {(currentDetail.statusHistory ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Henuz durum gecmisi bulunmuyor.</p>
                  ) : null}
                </CardContent>
              </Card>

              {currentDetail.shipment ? (
                <Card>
                  <CardContent className="grid gap-3 p-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Kargo Firmasi</p>
                      <p className="font-medium">{currentDetail.shipment.cargoCompany ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Takip No</p>
                      <p className="font-medium">{currentDetail.shipment.trackingNumber ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Durum</p>
                      <p className="font-medium">{currentDetail.shipment.status}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ShipmentForm
        open={Boolean(shipmentOrderId)}
        onOpenChange={(open) => !open && setShipmentOrderId(null)}
        onSubmit={async (payload) => {
          if (!shipmentOrderId) {
            return;
          }
          await upsertShipment.mutateAsync({ orderId: shipmentOrderId, ...payload });
          toast.success("Kargo bilgisi kaydedildi");
          setShipmentOrderId(null);
        }}
      />
    </div>
  );
}
