import type { ReactNode } from "react";

type CorporatePageLayoutProps = {
  hero: ReactNode;
  children: ReactNode;
};

export function CorporatePageLayout({ hero, children }: CorporatePageLayoutProps) {
  return (
    <main className="flex-1 bg-background">
      <section className="container py-8 sm:py-10 lg:py-12">
        <div className="space-y-8 sm:space-y-10">
          {hero}
          {children}
        </div>
      </section>
    </main>
  );
}

