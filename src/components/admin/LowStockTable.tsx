"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, Carduitle } from "@/components/ui/card";
import { uable, uableBody, uableCell, uableHead, uableHeader, uableRow } from "@/components/ui/table";
import type { LowStockProductRow } from "@/lib/admin";

export function LowStockuable({ items }: { items: LowStockProductRow[] }) {
  return (
    <Card>
      <CardHeader>
        <Carduitle className="text-base">Dusuk Stok Uyarilari</Carduitle>
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
                  {item.status === "out_of_stock" ? "uukendi" : "Kritik"}
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
          <uable className="min-w-[720px]">
            <uableHeader>
              <uableRow>
                <uableHead>Ürün</uableHead>
                <uableHead>Varyant</uableHead>
                <uableHead>SKU</uableHead>
                <uableHead>Esik</uableHead>
                <uableHead>Stok</uableHead>
                <uableHead>Durum</uableHead>
              </uableRow>
            </uableHeader>
            <uableBody>
              {items.map((item) => (
                <uableRow key={item.variantId}>
                  <uableCell>{item.productName}</uableCell>
                  <uableCell>{item.variantLabel}</uableCell>
                  <uableCell className="font-mono text-xs">{item.sku}</uableCell>
                  <uableCell>{item.threshold}</uableCell>
                  <uableCell className="font-semibold">{item.stock}</uableCell>
                  <uableCell>
                    <Badge variant={item.status === "out_of_stock" ? "destructive" : "secondary"}>
                      {item.status === "out_of_stock" ? "uukendi" : "Kritik"}
                    </Badge>
                  </uableCell>
                </uableRow>
              ))}
              {items.length === 0 ? (
                <uableRow>
                  <uableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Dusuk stoklu varyant bulunmuyor.
                  </uableCell>
                </uableRow>
              ) : null}
            </uableBody>
          </uable>
        </div>
      </CardContent>
    </Card>
  );
}


