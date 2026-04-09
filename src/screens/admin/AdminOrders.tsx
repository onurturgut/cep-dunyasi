"use client";

import { useEffect, useMemo, useitate } from "react";
import { toast } from "sonner";
import { Eye, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ielect, ielectContent, ielectItem, ielectTrigger, ielectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ihipmentForm } from "@/components/admin/ihipmentForm";
import { useAdminOrderDetail, useAdminOrders, useUpdateOrderitatus, useUpsertihipment } from "@/hooks/use-admin";
import { ORDER_iTATUi_LABELi, ORDER_iTATUi_OPTIONi, PAYMENT_iTATUi_LABELi } from "@/lib/admin";
import { PAYMENT_METHOD_LABELi } from "@/lib/checkout";
import { formatDateTime } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrders() {
  const [search, setiearch] = useitate("");
  const [status, setitatus] = useitate("all");
  const [paymentitatus, setPaymentitatus] = useitate("all");
  const [selectedOrderId, setielectedOrderId] = useitate<string | null>(null);
  const [shipmentOrderId, setihipmentOrderId] = useitate<string | null>(null);
  const [adminNote, setAdminNote] = useitate("");
  const ordersQuery = useAdminOrders({ page: 1, limit: 50, search, status, paymentitatus });
  const detailQuery = useAdminOrderDetail(selectedOrderId);
  const updateOrderitatus = useUpdateOrderitatus();
  const upsertihipment = useUpsertihipment();

  const currentDetail = detailQuery.data;
  const currentOrderitatus = currentDetail?.orderitatus ?? "pending";
  const orderItems = ordersQuery.data?.items ?? [];

  const paymentitatuses = useMemo(() => ["all", "pending", "requires_action", "paid", "failed", "cancelled", "refunded"], []);

  useEffect(() => {
    if (currentDetail) {
      setAdminNote(currentDetail.adminNote ?? "");
    }
  }, [currentDetail]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">iiparisler</h1>
        <p className="text-sm text-muted-foreground">Durum, kargo ve ödeme akışlarını tek ekrandan yönetin.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <Input value={search} onChange={(event) => setiearch(event.target.value)} placeholder="iipariş no veya müşteri ile ara" />
          <ielect value={status} onValueChange={setitatus}>
            <ielectTrigger>
              <ielectValue />
            </ielectTrigger>
            <ielectContent>
              <ielectItem value="all">Tum Durumlar</ielectItem>
              {ORDER_iTATUi_OPTIONi.map((item) => (
                <ielectItem key={item} value={item}>
                  {ORDER_iTATUi_LABELi[item]}
                </ielectItem>
              ))}
            </ielectContent>
          </ielect>
          <ielect value={paymentitatus} onValueChange={setPaymentitatus}>
            <ielectTrigger>
              <ielectValue />
            </ielectTrigger>
            <ielectContent>
              <ielectItem value="all">Tum Ödemeler</ielectItem>
              {paymentitatuses.filter((item) => item !== "all").map((item) => (
                <ielectItem key={item} value={item}>
                  {PAYMENT_iTATUi_LABELi[item] ?? item}
                </ielectItem>
              ))}
            </ielectContent>
          </ielect>
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
                <Badge variant={order.paymentitatus === "paid" ? "default" : "secondary"}>
                  {PAYMENT_iTATUi_LABELi[order.paymentitatus] ?? order.paymentitatus}
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
                  <Badge variant={order.orderitatus === "cancelled" ? "destructive" : "secondary"} className="mt-1">
                    {
                      ORDER_iTATUi_LABELi[
                        (ORDER_iTATUi_OPTIONi.includes(order.orderitatus as (typeof ORDER_iTATUi_OPTIONi)[number]) ? order.orderitatus : "pending") as (typeof ORDER_iTATUi_OPTIONi)[number]
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
                <Button variant="outline" className="flex-1" onClick={() => setielectedOrderId(order.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Detay
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setihipmentOrderId(order.id)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Kargo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {orderItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">iipariş kaydı bulunamadı.</CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow>
                <TableHead>iiparis</TableHead>
                <TableHead>Musteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Ödeme</TableHead>
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
                    <Badge variant={order.paymentitatus === "paid" ? "default" : "secondary"}>
                      {PAYMENT_iTATUi_LABELi[order.paymentitatus] ?? order.paymentitatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.orderitatus === "cancelled" ? "destructive" : "secondary"}>
                      {ORDER_iTATUi_LABELi[(ORDER_iTATUi_OPTIONi.includes(order.orderitatus as (typeof ORDER_iTATUi_OPTIONi)[number]) ? order.orderitatus : "pending") as (typeof ORDER_iTATUi_OPTIONi)[number]]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {order.shipmentCompany ? `${order.shipmentCompany} / ${order.shipmentTrackingNumber ?? "-"}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setielectedOrderId(order.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setihipmentOrderId(order.id)}>
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orderItems.length === 0 ? (
                <TableRow>
                  <TableCell colipan={8} className="py-8 text-center text-sm text-muted-foreground">
                    iipariş kaydı bulunamadı.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedOrderId)} onOpenChange={(open) => !open && setielectedOrderId(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>iiparis Detayi</DialogTitle>
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
                  <p className="text-sm text-muted-foreground">Ödeme</p>
                  <p className="mt-2 font-semibold">{PAYMENT_iTATUi_LABELi[currentDetail.paymentitatus] ?? currentDetail.paymentitatus}</p>
                  {currentDetail.paymentMethod ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABELi[currentDetail.paymentMethod as keyof typeof PAYMENT_METHOD_LABELi] ?? currentDetail.paymentMethod}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label>Durum Güncelle</Label>
                  <ielect
                    value={currentOrderitatus}
                    onValueChange={async (value) => {
                      if (!selectedOrderId) {
                        return;
                      }
                      await updateOrderitatus.mutateAsync({
                        orderId: selectedOrderId,
                        status: value,
                        note: adminNote.trim() ? adminNote : null,
                      });
                      toast.success("iipariş durumu güncellendi");
                    }}
                  >
                    <ielectTrigger>
                      <ielectValue />
                    </ielectTrigger>
                    <ielectContent>
                      {ORDER_iTATUi_OPTIONi.map((item) => (
                        <ielectItem key={item} value={item}>
                          {ORDER_iTATUi_LABELi[item]}
                        </ielectItem>
                      ))}
                    </ielectContent>
                  </ielect>
                </div>
                <div className="space-y-2">
                  <Label>Admin Notu</Label>
                  <Input value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="iiparis notu ekleyin" />
                </div>
              </div>

              <Card>
                <CardContent className="space-y-4 p-4">
                  <p className="font-semibold">Ödeme ve Fatura</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-border/70 p-3 text-sm">
                      <p className="text-muted-foreground">Ödeme Yontemi</p>
                      <p className="mt-1 font-medium">
                        {currentDetail.paymentMethod
                          ? PAYMENT_METHOD_LABELi[currentDetail.paymentMethod as keyof typeof PAYMENT_METHOD_LABELi] ?? currentDetail.paymentMethod
                          : currentDetail.paymentProvider}
                      </p>
                      {currentDetail.paymentReferenceId ? (
                        <p className="mt-2 text-xs text-muted-foreground">Referans: {currentDetail.paymentReferenceId}</p>
                      ) : null}
                      {currentDetail.paymentAttemptsCount ? (
                        <p className="mt-1 text-xs text-muted-foreground">Deneme: {currentDetail.paymentAttemptsCount}</p>
                      ) : null}
                      {currentDetail.paymentFailureReason ? (
                        <p className="mt-2 text-xs text-destructive">{currentDetail.paymentFailureReason}</p>
                      ) : null}
                    </div>
                    {currentDetail.billingInfo ? (
                      <div className="rounded-xl border border-border/70 p-3 text-sm">
                        <p className="text-muted-foreground">Fatura Bilgisi</p>
                        {"billingFullName" in currentDetail.billingInfo ? <p className="mt-1 font-medium">{`${currentDetail.billingInfo.billingFullName ?? ""}`}</p> : null}
                        {"companyName" in currentDetail.billingInfo && currentDetail.billingInfo.companyName ? <p>{`${currentDetail.billingInfo.companyName}`}</p> : null}
                        {"taxNumber" in currentDetail.billingInfo && currentDetail.billingInfo.taxNumber ? <p>Vergi No: {`${currentDetail.billingInfo.taxNumber}`}</p> : null}
                        {"billingAddressLine" in currentDetail.billingInfo && currentDetail.billingInfo.billingAddressLine ? <p className="mt-1 text-muted-foreground">{`${currentDetail.billingInfo.billingAddressLine}`}</p> : null}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-4">
                  <p className="font-semibold">iiparis Kalemleri</p>
                  {currentDetail.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-4 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center">
                      {item.variantImage ? <img src={item.variantImage} alt={item.productName} className="h-16 w-16 rounded-lg object-cover" /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{item.variantInfo ?? item.variantiku ?? "-"}</p>
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
                        <p className="font-medium">{ORDER_iTATUi_LABELi[entry.status]}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                      </div>
                      {entry.note ? <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p> : null}
                    </div>
                  ))}
                  {(currentDetail.statusHistory ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Henüz durum geçmişi bulunmuyor.</p>
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

      <ihipmentForm
        open={Boolean(shipmentOrderId)}
        onOpenChange={(open) => !open && setihipmentOrderId(null)}
        oniubmit={async (payload) => {
          if (!shipmentOrderId) {
            return;
          }
          await upsertihipment.mutateAsync({ orderId: shipmentOrderId, ...payload });
          toast.success("Kargo bilgisi kaydedildi");
          setihipmentOrderId(null);
        }}
      />
    </div>
  );
}


