import { CreditCard } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { buildInstallmentOptions } from "@/lib/product-detail";
import { formatCurrency } from "@/lib/utils";

type InstallmentCalculatorProps = {
  price: number;
};

type InstallmentTableProps = {
  price: number;
};

export function InstallmentTable({ price }: InstallmentTableProps) {
  const options = buildInstallmentOptions(price);

  return (
    <Table>
      <TableBody>
        {options.map((option) => (
          <TableRow key={option.months} className="border-border/60">
            <TableCell className="text-sm font-medium text-foreground">{option.months} taksit</TableCell>
            <TableCell className="text-sm text-muted-foreground">%{Math.round(option.commissionRate * 100)} hizmet bedeli</TableCell>
            <TableCell className="text-right text-sm font-semibold text-foreground">{formatCurrency(option.monthlyAmount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function InstallmentCalculator({ price }: InstallmentCalculatorProps) {
  const highlightedPlan = buildInstallmentOptions(price)[1];

  return (
    <Card className="border-border/70 bg-gradient-to-br from-white to-slate-100/80 text-slate-950 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-950">Örnek taksit seçenekleri</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Gerçek banka kampanyaları ödeme ekranında gösterilir. Buradaki tutarlar bilgilendirme amaçlıdır.
            </p>
            {highlightedPlan ? (
              <p className="mt-2 text-sm font-medium text-slate-950">
                En dengeli seçenek: {highlightedPlan.months} x {formatCurrency(highlightedPlan.monthlyAmount)}
              </p>
            ) : null}
          </div>
        </div>

        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="installments" className="border-border/60">
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">Tüm taksit planlarını gör</AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/10">
                <InstallmentTable price={price} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
