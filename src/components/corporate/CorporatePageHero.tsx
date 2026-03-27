import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/router";

type CorporatePageHeroProps = {
  title: string;
  summary: string;
  pageLabel?: string;
  children?: ReactNode;
};

export function CorporatePageHero({ title, summary, pageLabel = "Kurumsal Sayfa", children }: CorporatePageHeroProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Link to="/" className="transition-colors hover:text-foreground">
          Ana Sayfa
        </Link>
        <span>/</span>
        <span className="text-foreground">{title}</span>
      </div>

      <div className="rounded-[2rem] border border-border/70 bg-card/80 px-6 py-8 shadow-sm backdrop-blur sm:px-8 sm:py-10">
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline" className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            {pageLabel}
          </Badge>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{summary}</p>
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}

