"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LowStockProductRow } from "@/lib/admin";

export function LowStockTable({ items }: { items: LowStockProductRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dusuk Stok Uyarilari</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <div key={item.variantId} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.productName}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.variantLabel}</p>
                  <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                </div>
                <Badge variant={item.status === "out_of_stock" ? "destructive" : "secondary"}>
                  {item.status === "out_of_stock" ? "Tukendi" : "Kritik"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Esik</p>
                  <p>{item.threshold}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stok</p>
                  <p className="font-semibold">{item.stock}</p>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Dusuk stoklu varyant bulunmuyor.</p> : null}
        </div>

        <div className="hidden md:block">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Varyant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Esik</TableHead>
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
                      {item.status === "out_of_stock" ? "Tukendi" : "Kritik"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Dusuk stoklu varyant bulunmuyor.
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

