"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router";
import { categoryIcons, type HomeCategory, type HomeSiteContent } from "@/components/home/home-data";

type CategoriesSectionProps = {
  categories: HomeCategory[];
  content: HomeSiteContent;
};

export function CategoriesSection({ categories, content }: CategoriesSectionProps) {
  const visibleCategories = categories.slice(0, 6);

  return (
    <section id="home-categories" data-section="categories" className="relative py-6 md:py-10">
      <div className="container">
        <div className="rounded-3xl border border-border/60 bg-card/55 p-4 shadow-sm backdrop-blur-xl sm:p-5 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{content.category_section_title}</h2>
              {content.category_section_description ? (
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{content.category_section_description}</p>
              ) : null}
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              Tum urunler
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCategories.map((category) => {
              const Icon = categoryIcons[category.icon || "Smartphone"] || categoryIcons.Smartphone;
              const categoryName = `${category.name || ""}`.toLowerCase();
              const categorySlug = `${category.slug || ""}`.toLowerCase();
              const href =
                categorySlug === "teknik-servis" || categorySlug === "servis" || categoryName.includes("teknik") || categoryName.includes("servis")
                  ? "/technical-service"
                  : `/products?category=${category.slug}`;

              return (
                <Link
                  key={category.id}
                  to={href}
                  className="group rounded-2xl border border-border/70 bg-background/75 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{category.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description?.trim() || "Urunleri incele, modelleri karsilastir ve sana uygun secenegi bul."}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
