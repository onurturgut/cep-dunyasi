"use client";

import { Eye, Flame, Package2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProductUrgencyInfoProps = {
  salesCount?: number | null;
  stock?: number | null;
  ratingCount?: number | null;
  lowStockThreshold?: number;
  compact?: boolean;
};

export function ProductUrgencyInfo({
  salesCount = 0,
  stock = 0,
  ratingCount = 0,
  lowStockThreshold = 5,
  compact = false,
}: ProductUrgencyInfoProps) {
  const items: Array<{ id: string; label: string; icon: typeof Eye }> = [];

  if (salesCount >= 10) {
    items.push({
      id: "sales",
      label: compact ? "Çok ilgi goruyor" : `Bu hafta ${salesCount}+ siparis ilgisi gordu`,
      icon: Flame,
    });
  }

  if (stock > 0 && stock <= lowStockThreshold) {
    items.push({
      id: "stock",
      label: compact ? `Son ${stock} adet` : `Stokta son ${stock} adet kaldi`,
      icon: Package2,
    });
  }

  if (ratingCount >= 5) {
    items.push({
      id: "reviews",
      label: compact ? `${ratingCount}+ yorum` : `Gercek kullanicilardan ${ratingCount}+ yorum`,
      icon: Eye,
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, compact ? 2 : 3).map((item) => (
        <Badge key={item.id} variant="outline" className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium">
          <item.icon className="mr-1.5 h-3.5 w-3.5" />
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

