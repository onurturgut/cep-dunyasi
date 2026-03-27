import type { CorporatePageRecord } from "@/types/corporate-page";
import { CorporatePageHero } from "@/components/corporate/CorporatePageHero";
import { CorporatePageLayout } from "@/components/corporate/CorporatePageLayout";
import { RichTextContent } from "@/components/corporate/RichTextContent";
import { PageSection } from "@/components/corporate/PageSection";
import { ContactInfoCard } from "@/components/corporate/ContactInfoCard";
import { FaqAccordion } from "@/components/corporate/FaqAccordion";

type CorporatePageScreenProps = {
  page: CorporatePageRecord;
};

function groupFaqItems(items: CorporatePageRecord["faqItems"]) {
  const grouped = new Map<string, CorporatePageRecord["faqItems"]>();

  for (const item of items) {
    const groupKey = item.category?.trim() || "Genel";
    const bucket = grouped.get(groupKey) ?? [];
    bucket.push(item);
    grouped.set(groupKey, bucket);
  }

  return Array.from(grouped.entries());
}

export function CorporatePageScreen({ page }: CorporatePageScreenProps) {
  const faqGroups = groupFaqItems(page.faqItems);
  const faqSchema =
    page.template === "faq" && page.faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;
  const phoneBlock = page.contactBlocks.find((block) => block.icon === "phone");
  const emailBlock = page.contactBlocks.find((block) => block.icon === "mail");
  const addressBlock = page.contactBlocks.find((block) => block.icon === "map-pin");
  const contactSchema =
    page.template === "contact"
      ? {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Cep Dünyası",
          url: "/iletisim",
          email: emailBlock?.value ?? undefined,
          telephone: phoneBlock?.value ?? undefined,
          address: addressBlock?.value
            ? {
                "@type": "PostalAddress",
                streetAddress: addressBlock.value,
              }
            : undefined,
        }
      : null;

  const pageLabel =
    page.template === "legal"
      ? "Yasal Bilgilendirme"
      : page.template === "faq"
        ? "Yardım Merkezi"
        : "Kurumsal İçerik";

  return (
    <CorporatePageLayout
      hero={
        <CorporatePageHero title={page.title} summary={page.summary} pageLabel={pageLabel}>
          {page.updatedAt ? (
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Son güncelleme: {new Date(page.updatedAt).toLocaleDateString("tr-TR")}
            </p>
          ) : null}
        </CorporatePageHero>
      }
    >
      {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      {contactSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} /> : null}

      {page.contactBlocks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {page.contactBlocks.map((block) => (
            <ContactInfoCard key={block.id} block={block} />
          ))}
        </div>
      ) : null}

      {page.sections.length > 0 ? (
        <div className={`grid gap-4 ${page.template === "about" || page.template === "policy" ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {page.sections.map((section) => (
            <PageSection key={section.id} section={section} />
          ))}
        </div>
      ) : null}

      {page.content ? <RichTextContent content={page.content} /> : null}

      {page.faqItems.length > 0 ? (
        <div className="space-y-6">
          {faqGroups.map(([group, items]) => (
            <section key={group} className="space-y-3">
              {page.template === "faq" && faqGroups.length > 1 ? (
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{group}</h2>
                  <p className="text-sm text-muted-foreground">Bu başlık altındaki sık sorulan sorular.</p>
                </div>
              ) : null}
              <FaqAccordion items={items} />
            </section>
          ))}
        </div>
      ) : null}
    </CorporatePageLayout>
  );
}
