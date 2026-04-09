"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BulkActionsToolbarProps = {
  selectedCount: number;
  onApply: (payload: { action: string; value?: string | number | null }) => void;
};

export function BulkActionsToolbar({ selectedCount, onApply }: BulkActionsToolbarProps) {
  const [action, setAction] = useState("set_active");
  const [value, setValue] = useState("");

  return (
    <Card className="mt-4">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{selectedCount} ürün seçili</p>
          <p className="text-xs text-muted-foreground">Toplu aktif/pasif, kategori, fiyat, stok ve eşik işlemleri.</p>
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="set_active">Toplu aktif yap</SelectItem>
            <SelectItem value="set_inactive">Toplu pasif yap</SelectItem>
            <SelectItem value="set_category">Kategori ata</SelectItem>
            <SelectItem value="adjust_price_percentage">Fiyatı yüzde değiştir</SelectItem>
            <SelectItem value="set_discount_percentage">İndirim uygula</SelectItem>
            <SelectItem value="set_stock">Stok belirle</SelectItem>
            <SelectItem value="set_variant_threshold">Stok eşiği belirle</SelectItem>
          </SelectContent>
        </Select>
        {["set_category", "adjust_price_percentage", "set_discount_percentage", "set_stock", "set_variant_threshold"].includes(action) ? (
          <Input className="w-full md:w-44" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Değer" />
        ) : null}
        <Button disabled={selectedCount === 0} onClick={() => onApply({ action, value: value || null })}>
          Uygula
        </Button>
      </CardContent>
    </Card>
  );
}
