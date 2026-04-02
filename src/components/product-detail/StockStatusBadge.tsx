"use client";

import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/provider";

type StockStatusBadgeProps = {
  stock: number;
};

export function StockStatusBadge({ stock }: StockStatusBadgeProps) {
  const { locale } = useI18n();
  const copy =
    locale === "en"
      ? {
          sourcing: "Restocking",
          lastUnits: `Last ${stock} left`,
          inStock: "In stock",
        }
      : {
          sourcing: "Tedarik surecinde",
          lastUnits: `Son ${stock} adet`,
          inStock: "Stokta",
        };

  if (stock <= 0) {
    return (
      <Badge variant="outline" className="gap-1 rounded-full border-slate-200 px-3 py-1 text-slate-600">
        <Clock3 className="h-3.5 w-3.5" />
        {copy.sourcing}
      </Badge>
    );
  }

  if (stock <= 5) {
    return (
      <Badge variant="outline" className="gap-1 rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        {copy.lastUnits}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {copy.inStock}
    </Badge>
  );
}
