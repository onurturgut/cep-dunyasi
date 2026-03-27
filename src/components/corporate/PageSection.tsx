import type { CorporatePageSection } from "@/types/corporate-page";

type PageSectionProps = {
  section: CorporatePageSection;
};

export function PageSection({ section }: PageSectionProps) {
  const cardClassName =
    section.style === "card"
      ? "rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm"
      : "rounded-3xl border border-transparent bg-transparent p-0";

  return (
    <article className={cardClassName}>
      <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{section.content}</p>
    </article>
  );
}

