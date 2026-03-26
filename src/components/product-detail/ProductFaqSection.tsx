import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductFaqItem } from "@/lib/product-detail";

type ProductFaqSectionProps = {
  items: ProductFaqItem[];
};

export function ProductFaqSection({ items }: ProductFaqSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" id="faq">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Sik Sorulan Sorular</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Siparis, teslimat, garanti ve teknik destek sureclerine dair en cok merak edilen konulari burada bulabilirsiniz.
        </p>
      </div>

      <Card className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
        <CardContent className="p-5">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`} className="border-border/60">
                <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
