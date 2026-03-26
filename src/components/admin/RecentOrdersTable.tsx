"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "@/lib/date";
import type { RecentOrderSummary } from "@/lib/admin";

export function RecentOrdersTable({ orders }: { orders: RecentOrderSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Son Siparisler</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
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
      </CardContent>
    </Card>
  );
}
