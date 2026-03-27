import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  getProductSpecsSections,
  type ProductSpecs,
  type ProductSpecsTableContext,
} from "@/lib/product-specs";
import type { ProductVariantRecord } from "@/lib/product-variants";

type ProductSpecsTableProps = {
  specs?: ProductSpecs | null;
  variant?: ProductVariantRecord | null;
  context?: ProductSpecsTableContext;
};

export function ProductSpecsTable({ specs, variant, context }: ProductSpecsTableProps) {
  const sections = getProductSpecsSections(specs, variant, context);

  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" id="specs">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Teknik Özellikler</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Seçili modele ve ürün kategorisine ait teknik bilgiler, sade ve okunabilir bir formatta sunulur.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
            <CardHeader className="border-b border-border/60 bg-muted/15">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="md:hidden">
                <div className="grid gap-3 p-4">
                  {section.items.map((item) => (
                    <div key={`${section.id}-${item.label}`} className="rounded-2xl border border-border/60 bg-card px-4 py-3">
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
                      <div className="mt-2 text-sm font-medium text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableBody>
                    {section.items.map((item) => (
                      <TableRow key={`${section.id}-${item.label}`} className="border-border/60">
                        <TableCell className="w-[42%] bg-muted/10 text-sm font-medium text-muted-foreground">{item.label}</TableCell>
                        <TableCell className="text-sm font-medium text-foreground">{item.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
