"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/date";
import type { RecentOrderSummary } from "@/lib/admin";
import { formatCurrency } from "@/lib/utils";

export function RecentOrdersTable({ orders }: { orders: RecentOrderSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Son Siparisler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3 md:hidden">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                </div>
                <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>{order.orderStatus}</Badge>
              </div>
              <p className="mt-3 text-right text-sm font-medium">{formatCurrency(order.finalPrice)}</p>
            </div>
          ))}
          {orders.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Henuz siparis yok.</p> : null}
        </div>

        <div className="hidden md:block">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Siparis</TableHead>
                <TableHead>Musteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>{order.orderStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.finalPrice)}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Henuz siparis yok.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
