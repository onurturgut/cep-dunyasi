"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LowStockTable } from "@/components/admin/LowStockTable";
import { useLowStockProducts } from "@/hooks/use-admin";
import type { LowStockFilter } from "@/lib/admin";

export default function AdminInventory() {
  const [filter, setFilter] = useState<LowStockFilter>("all");
  const { data, isLoading } = useLowStockProducts(filter, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Stok Uyarilari</h1>
          <p className="text-sm text-muted-foreground">Kritik esik altindaki varyantlari yonetin.</p>
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as LowStockFilter)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Uyarilar</SelectItem>
            <SelectItem value="critical">Kritik Stok</SelectItem>
            <SelectItem value="out_of_stock">Stokta Yok</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Envanter Ozeti</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">Toplam Uyari</p>
            <p className="mt-2 text-2xl font-semibold">{isLoading ? "..." : (data?.length ?? 0).toLocaleString("tr-TR")}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">Kritik Stok</p>
            <p className="mt-2 text-2xl font-semibold">
              {isLoading ? "..." : (data?.filter((item) => item.status === "critical").length ?? 0).toLocaleString("tr-TR")}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">Tukenenler</p>
            <p className="mt-2 text-2xl font-semibold">
              {isLoading ? "..." : (data?.filter((item) => item.status === "out_of_stock").length ?? 0).toLocaleString("tr-TR")}
            </p>
          </div>
        </CardContent>
      </Card>

      <LowStockTable items={data ?? []} />
    </div>
  );
}
