import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { CorporateFaqItem } from "@/types/corporate-page";

type FaqAccordionProps = {
  items: CorporateFaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-border/70 bg-card/80 px-5 py-2 shadow-sm sm:px-6">
      <Accordion type="single" collapsible className="w-full">
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="border-border/60">
            <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">{item.question}</AccordionTrigger>
            <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground sm:text-base">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

