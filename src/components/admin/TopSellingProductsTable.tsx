"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { TopSellingProductRow } from "@/lib/admin";

export function TopSellingProductsTable({ items, title = "En Çok Satan Ürünler" }: { items: TopSellingProductRow[]; title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Adet</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead className="text-right">Ciro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.productId ?? item.productName}-${item.sku ?? "na"}`}>
                <TableCell>{item.productName}</TableCell>
                <TableCell className="font-mono text-xs">{item.sku ?? "-"}</TableCell>
                <TableCell>{item.quantity.toLocaleString("tr-TR")}</TableCell>
                <TableCell>{item.stock ?? "-"}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Satış verisi bulunamadı.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
