"use client";

import Image from "next/image";
import { Link } from '@/lib/router';
import { categoryIcons, type HomeCategory, type HomeSiteContent } from '@/components/home/home-data';
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";

type ExploreCategoriesSectionProps = {
  categories: HomeCategory[];
  content: HomeSiteContent;
};

export function ExploreCategoriesSection({ categories, content }: ExploreCategoriesSectionProps) {
  const exploreCategories = categories.slice(0, 12);

  return (
    <section
      id="home-explore"
      data-section="explore"
      className="relative py-4 md:py-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden h-64 overflow-hidden md:block">
        <div className="absolute left-[14%] top-6 h-24 w-24 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[8%] top-20 h-32 w-32 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="container">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">{content.explore_section_title}</h2>
          <div className="explore-categories-scroll overflow-x-auto pb-2">
            <div className="explore-category-list flex gap-3 pr-2">
              {exploreCategories.map((category) => {
                const Icon = categoryIcons[category.icon || 'Smartphone'] || categoryIcons.Smartphone;
                const categoryName = `${category.name || ''}`.toLowerCase();
                const categorySlug = `${category.slug || ''}`.toLowerCase();
                const isServiceColumn =
                  categorySlug === 'teknik-servis' || categorySlug === 'servis' || categoryName.includes('teknik') || categoryName.includes('servis');

                return (
                  <Link
                    key={`explore-${category.id}`}
                    to={isServiceColumn ? '/technical-service' : `/products?category=${category.slug}`}
                    className="explore-category-card group flex min-h-[240px] w-[78vw] max-w-[280px] shrink-0 flex-col overflow-hidden bg-transparent p-0 transition-all hover:bg-transparent sm:min-h-[300px] sm:w-[300px]"
                  >
                    {category.image_url ? (
                      <>
                        <div className="relative flex h-[190px] w-full items-center justify-center overflow-hidden sm:h-[250px]">
                          <Image
                            src={getOptimizedImageUrl(category.image_url, { kind: "campaign-banner" })}
                            alt={category.name}
                            fill
                            sizes={getResponsiveImageSizes("campaign-banner")}
                            className={`h-full w-full ${
                              category.image_url.startsWith('/images/') ? 'object-contain p-2' : 'object-cover'
                            }`}
                          />
                        </div>
                        <span className="explore-category-label px-3 pb-2 text-sm font-semibold text-foreground sm:text-base">{category.name}</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="explore-category-label text-sm font-semibold text-foreground sm:text-base">{category.name}</span>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
