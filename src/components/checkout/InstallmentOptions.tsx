import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type InstallmentOptionsProps = {
  options: Array<{
    months: number;
    commissionRate: number;
    totalAmount: number;
    monthlyAmount: number;
    isHighlighted: boolean;
  }>;
};

export function InstallmentOptions({ options }: InstallmentOptionsProps) {
  if (options.length === 0) {
    return null;
  }

  const highlighted = options.find((option) => option.isHighlighted) ?? options[0];

  return (
    <Card className="border-border/70 bg-gradient-to-br from-white to-slate-50 shadow-none">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Örnek taksit seçenekleri</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Banka kampanyaları ödeme ekranında değişebilir. Tablodaki tutarlar bilgilendirme amaçlıdır.
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              Öne çıkan plan: {highlighted.months} x {formatCurrency(highlighted.monthlyAmount)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableBody>
              {options.map((option) => (
                <TableRow key={option.months} className={option.isHighlighted ? "bg-primary/5" : undefined}>
                  <TableCell className="text-sm font-medium text-foreground">{option.months} taksit</TableCell>
                  <TableCell className="text-sm text-muted-foreground">%{Math.round(option.commissionRate * 100)} hizmet bedeli</TableCell>
                  <TableCell className="text-right text-sm font-semibold text-foreground">
                    {formatCurrency(option.monthlyAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
