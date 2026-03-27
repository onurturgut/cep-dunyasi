"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LowStockProductRow } from "@/lib/admin";

export function LowStockTable({ items }: { items: LowStockProductRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Düşük Stok Uyarıları</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Varyant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Eşik</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.variantId}>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.variantLabel}</TableCell>
                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                <TableCell>{item.threshold}</TableCell>
                <TableCell className="font-semibold">{item.stock}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "out_of_stock" ? "destructive" : "secondary"}>
                    {item.status === "out_of_stock" ? "Tükendi" : "Kritik"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Düşük stoklu varyant bulunmuyor.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
