"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TopSellingProductRow } from "@/lib/admin";
import { formatCurrency } from "@/lib/utils";

export function TopSellingProductsTable({
  items,
  title = "En Cok Satan Urunler",
}: {
  items: TopSellingProductRow[];
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <div key={`${item.productId ?? item.productName}-${item.sku ?? "na"}`} className="rounded-xl border border-border/70 p-4">
              <p className="font-medium">{item.productName}</p>
              <p className="font-mono text-xs text-muted-foreground">{item.sku ?? "-"}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Adet</p>
                  <p>{item.quantity.toLocaleString("tr-TR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stok</p>
                  <p>{item.stock ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ciro</p>
                  <p className="font-medium">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Satis verisi bulunamadi.</p> : null}
        </div>

        <div className="hidden md:block">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Urun</TableHead>
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
                    Satis verisi bulunamadi.
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
