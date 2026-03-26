import { RefreshCcw, ShieldCheck, Wrench } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { buildPolicyHighlights } from "@/lib/product-detail";

type WarrantyReturnInfoProps = {
  productName: string;
  brand?: string | null;
};

export function PolicyHighlights({ brand }: { brand?: string | null }) {
  const highlights = buildPolicyHighlights(brand);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {highlights.map((item, index) => {
        const Icon = index === 0 ? ShieldCheck : index === 1 ? RefreshCcw : Wrench;

        return (
          <div key={item.title} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export function WarrantyReturnInfo({ productName, brand }: WarrantyReturnInfoProps) {
  return (
    <section className="space-y-4" id="warranty">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Garanti ve Iade</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {productName} icin satin alma sonrasi surecler, acik ve guven veren bir ozet ile sunulur.
        </p>
      </div>

      <PolicyHighlights brand={brand} />

      <Card className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
        <CardContent className="p-5">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guarantee" className="border-border/60">
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">Garanti kapsami</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  {brand ? `${brand} markali bu urun, resmi veya ithalatci firma garantisiyle birlikte sevk edilir.` : "Urun, resmi veya ithalatci firma garantisiyle birlikte sevk edilir."}
                </p>
                <p>Garanti belgesi, fatura ve servis surecinde gerekli dokumanlar siparisle birlikte paylasilir.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="return" className="border-border/60">
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">Iade ve degisim kosullari</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Kullanilmamis, aktivasyon gerektiren alanlari etkilenmemis ve fiziksel olarak hasarsiz urunlerde 14 gun icinde iade veya degisim talebi
                  olusturabilirsiniz.
                </p>
                <p>
                  Acilmis kutu, aktivasyon, hijyen veya kullanima ozel kosullar gerektiren urunlerde ilgili mevzuat ve urun sinifina ait sartlar gecerlidir.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="service" className="border-border/60">
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">Teknik servis sureci</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Teknik servis ihtiyaciniz oldugunda site uzerindeki teknik servis formu ile cihaz modeli ve ariza detaylarini iletebilir, sureci uzman ekibimizle
                  takip edebilirsiniz.
                </p>
                <p>Servis ve destek sureclerinde urunun seri numarasi, fatura ve garanti bilgileri esas alinir.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
