import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StockStatusBadgeProps = {
  stock: number;
};

export function StockStatusBadge({ stock }: StockStatusBadgeProps) {
  if (stock <= 0) {
    return (
      <Badge variant="destructive" className="gap-1 rounded-full px-3 py-1">
        <Clock3 className="h-3.5 w-3.5" />
        Tedarik surecinde
      </Badge>
    );
  }

  if (stock <= 5) {
    return (
      <Badge variant="secondary" className="gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Son {stock} adet
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Stokta
    </Badge>
  );
}
