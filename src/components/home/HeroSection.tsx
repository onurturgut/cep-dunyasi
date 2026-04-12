"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { benefitIcons, type HomeSiteContent } from "@/components/home/home-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "@/lib/router";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";

type HeroSectionProps = {
  activeSlide: number;
  onSlideChange: (index: number) => void;
  content: HomeSiteContent;
  isLoading?: boolean;
};

function HeroSectionSkeleton() {
  return (
    <section id="home-hero" data-section="hero" className="bg-background pb-8 sm:pb-10 md:pb-12" aria-busy="true" aria-live="polite">
      <div className="relative min-h-[calc(100svh-4rem)] w-full overflow-hidden sm:min-h-[calc(100svh-4.5rem)]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/6 via-transparent to-secondary/10" />
          <div className="absolute -left-16 top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[-4rem] top-12 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        <div className="relative">
          <div className="container flex min-h-[calc(100svh-4rem)] items-center py-8 sm:py-10 md:py-14 sm:min-h-[calc(100svh-4.5rem)]">
            <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,540px)] lg:gap-6">
              <div className="max-w-2xl">
                <Skeleton className="h-6 w-48 rounded-full bg-muted/70 sm:h-7" />
                <div className="mt-5 space-y-3">
                  <Skeleton className="h-12 w-full max-w-[28rem] bg-muted/70 sm:h-16" />
                  <Skeleton className="h-12 w-[88%] max-w-[26rem] bg-muted/70 sm:h-16" />
                  <Skeleton className="h-12 w-[76%] max-w-[22rem] bg-muted/70 sm:h-16" />
                </div>
                <div className="mt-5 space-y-2">
                  <Skeleton className="h-4 w-full max-w-xl bg-muted/60" />
                  <Skeleton className="h-4 w-[82%] max-w-lg bg-muted/60" />
                </div>
                <Skeleton className="mt-7 h-12 w-full rounded-xl bg-primary/20 sm:w-52" />

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="rounded-xl border border-border/60 bg-card/70 p-3 shadow-[0_24px_52px_rgba(0,0,0,0.24)] sm:px-4 sm:py-3.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-lg bg-primary/20" />
                        <Skeleton className="h-4 w-28 bg-muted/70" />
                      </div>
                      <Skeleton className="mt-2 h-3 w-full bg-muted/60" />
                      <Skeleton className="mt-1 h-3 w-[70%] bg-muted/60" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mx-auto w-full max-w-[560px] lg:-ml-8">
                <div className="relative h-[320px] w-full sm:h-[420px] md:h-[520px] lg:h-[620px]">
                  <div className="absolute inset-x-10 bottom-10 h-24 rounded-full bg-primary/15 blur-3xl" />
                  <Skeleton className="absolute inset-0 rounded-[2rem] bg-muted/60" />
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 backdrop-blur-sm">
                    {[0, 1, 2, 3].map((item) => (
                      <Skeleton key={item} className="h-2.5 w-2.5 rounded-full bg-muted/70" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroSection({ activeSlide, onSlideChange: _onSlideChange, content, isLoading = false }: HeroSectionProps) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return <HeroSectionSkeleton />;
  }

  const heroSlides = content.hero_slides.filter((slide) => slide.image_url);
  const heroBenefits = content.hero_benefits.filter((benefit) => benefit.title || benefit.desc);
  const hasHeroText = Boolean(content.hero_title_prefix || content.hero_title_highlight || content.hero_title_suffix || content.hero_subtitle);
  const hasHeroLogo = Boolean(content.hero_logo_light_url || content.hero_logo_dark_url);
  const hasHeroCta = Boolean(content.hero_cta_label && content.hero_cta_href);

  if (!hasHeroText && !hasHeroLogo && !hasHeroCta && heroSlides.length === 0 && heroBenefits.length === 0) {
    return null;
  }

  return (
    <section id="home-hero" data-section="hero" className="bg-background pb-8 sm:pb-10 md:pb-12">
      <div className="relative min-h-[calc(100svh-4rem)] w-full overflow-hidden sm:min-h-[calc(100svh-4.5rem)]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/6 via-transparent to-secondary/10" />
          <div className="absolute -left-16 top-20 hidden h-52 w-52 rounded-full bg-primary/10 blur-3xl md:block" />
          <div className="absolute right-[-4rem] top-12 hidden h-64 w-64 rounded-full bg-secondary/20 blur-3xl md:block" />
        </div>

        <div className="relative">
          <div className="container flex min-h-[calc(100svh-4rem)] items-center py-8 sm:py-10 md:py-14 sm:min-h-[calc(100svh-4.5rem)]">
            <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,540px)] lg:gap-6">
              <div className="max-w-2xl">
                {hasHeroText || hasHeroLogo ? (
                  <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)] sm:text-5xl md:text-6xl xl:text-7xl">
                    {content.hero_title_prefix}
                    {content.hero_title_highlight ? <span className="text-primary"> {content.hero_title_highlight} </span> : null}
                    {content.hero_logo_light_url ? (
                      <span className="mx-1 inline-flex align-middle dark:hidden">
                        <Image
                          src={getOptimizedImageUrl(content.hero_logo_light_url, { kind: "logo" })}
                          alt="Cep Dunyasi logosu"
                          width={300}
                          height={90}
                          priority
                          sizes={getResponsiveImageSizes("logo")}
                          className="h-auto w-[160px] sm:w-[200px] md:w-[240px] xl:w-[300px]"
                        />
                      </span>
                    ) : null}
                    {content.hero_logo_dark_url ? (
                      <span className="mx-1 hidden align-middle dark:inline-flex">
                        <Image
                          src={getOptimizedImageUrl(content.hero_logo_dark_url, { kind: "logo" })}
                          alt="Cep Dunyasi logosu"
                          width={300}
                          height={90}
                          priority
                          sizes={getResponsiveImageSizes("logo")}
                          className="h-auto w-[160px] sm:w-[200px] md:w-[240px] xl:w-[300px]"
                        />
                      </span>
                    ) : null}
                    {content.hero_title_suffix}
                  </h1>
                ) : null}

                {content.hero_subtitle ? (
                  <p className="mt-4 max-w-xl text-sm text-muted-foreground md:drop-shadow-[0_8px_18px_rgba(0,0,0,0.16)] sm:text-base md:text-lg">
                    {content.hero_subtitle}
                  </p>
                ) : null}

                {hasHeroCta ? (
                  <div className="mt-7">
                    <Button size="lg" asChild className="w-full shadow-sm sm:w-auto md:shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
                      <Link to={content.hero_cta_href}>
                        {content.hero_cta_label} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : null}

                {heroBenefits.length > 0 ? (
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {heroBenefits.map((benefit) => {
                      const Icon = benefitIcons[benefit.icon] || benefitIcons.Truck;

                      return (
                        <div key={benefit.title} className="rounded-xl border border-border/60 bg-card/70 p-3 shadow-sm sm:px-4 sm:py-3.5 md:shadow-[0_24px_52px_rgba(0,0,0,0.24)]">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-sm font-semibold text-foreground md:drop-shadow-[0_6px_16px_rgba(0,0,0,0.2)] sm:text-base">{benefit.title}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground md:drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)] sm:text-[13px]">{benefit.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className={`mx-auto w-full max-w-[560px] ${heroSlides.length > 0 ? "lg:-ml-8" : ""}`}>
                <div className="relative h-[320px] w-full sm:h-[420px] md:h-[520px] lg:h-[620px]">
                  <div className="absolute inset-x-10 bottom-10 hidden h-24 rounded-full bg-primary/15 blur-3xl md:block" />
                  {heroSlides.map((slide, index) => (
                    <Image
                      key={slide.id}
                      src={getOptimizedImageUrl(slide.image_url, { kind: "hero" })}
                      alt={slide.alt}
                      fill
                      priority={index === 0}
                      sizes={getResponsiveImageSizes("hero")}
                      className={`absolute inset-0 mx-auto h-full w-full object-contain ${isMobile ? "" : "drop-shadow-[0_20px_40px_rgba(0,0,0,0.65)]"} transition-all ${isMobile ? "duration-300" : "duration-700"} ease-out ${
                        index === activeSlide ? "translate-x-0 scale-100 opacity-100" : isMobile ? "opacity-0" : "translate-x-8 scale-95 opacity-0"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
