import { RefreshCcw, ShieldCheck, Wrench } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { buildPolicyHighlights } from "@/lib/product-detail";

type WarrantyReturnInfoProps = {
  productName: string;
  brand?: string | null;
  embedded?: boolean;
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

export function WarrantyReturnInfo({ productName, brand, embedded = false }: WarrantyReturnInfoProps) {
  return (
    <section className="space-y-4" id="warranty">
      {!embedded ? <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Garanti ve İade</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {productName} için satın alma sonrası süreçler, açık ve güven veren bir özet ile sunulur.
        </p>
      </div> : null}

      <PolicyHighlights brand={brand} />

      <Card className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
        <CardContent className="p-5">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guarantee" className="border-border/60">
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">Garanti kapsamı</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  {brand ? `${brand} markalı bu ürün, resmi veya ithalatçı firma garantisiyle birlikte sevk edilir.` : "Ürün, resmi veya ithalatçı firma garantisiyle birlikte sevk edilir."}
                </p>
                <p>Garanti belgesi, fatura ve servis sürecinde gerekli dokümanlar siparişle birlikte paylaşılır.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="return" className="border-border/60">
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">İade ve değişim koşulları</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Kullanılmamış, aktivasyon gerektiren alanları etkilenmemiş ve fiziksel olarak hasarsız ürünlerde 14 gün içinde iade veya değişim talebi
                  oluşturabilirsiniz.
                </p>
                <p>
                  Açılmış kutu, aktivasyon, hijyen veya kullanıma özel koşullar gerektiren ürünlerde ilgili mevzuat ve ürün sınıfına ait şartlar geçerlidir.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="service" className="border-border/60">
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">Teknik servis süreci</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Teknik servis ihtiyacınız olduğunda site üzerindeki teknik servis formu ile cihaz modeli ve arıza detaylarını iletebilir, süreci uzman ekibimizle
                  takip edebilirsiniz.
                </p>
                <p>Servis ve destek süreçlerinde ürünün seri numarası, fatura ve garanti bilgileri esas alınır.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
