"use client";

import { useEffect, useMemo, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import type { CampaignRecord } from "@/lib/campaigns";
import { HeroSlide } from "@/components/home/HeroSlide";
import { HeroSliderControls } from "@/components/home/HeroSliderControls";
import { HeroSliderDots } from "@/components/home/HeroSliderDots";

type HeroSliderProps = {
  campaigns: CampaignRecord[];
  isLoading?: boolean;
};

export function HeroSlider({ campaigns, isLoading = false }: HeroSliderProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slides = useMemo(() => campaigns.filter((campaign) => campaign.imageUrl), [campaigns]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const syncSelectedIndex = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    syncSelectedIndex();
    api.on("select", syncSelectedIndex);
    api.on("reInit", syncSelectedIndex);

    return () => {
      api.off("select", syncSelectedIndex);
      api.off("reInit", syncSelectedIndex);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length < 2 || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
        return;
      }

      api.scrollTo(0);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [api, isPaused, slides.length]);

  if (isLoading) {
    return (
      <section className="bg-background pb-8">
        <div className="container">
          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:items-center">
              <div className="space-y-4">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-14 w-full max-w-xl" />
                <Skeleton className="h-14 w-full max-w-lg" />
                <Skeleton className="h-5 w-full max-w-xl" />
                <Skeleton className="h-5 w-full max-w-lg" />
                <Skeleton className="h-11 w-40 rounded-full" />
              </div>
              <Skeleton className="h-[18rem] rounded-[1.75rem] sm:h-[24rem] lg:h-[30rem]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="bg-background pb-8 md:pb-10">
      <div className="container">
        <div
          className="space-y-5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary/70">Campaign Slider</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                uunun one cikan kampanyalari
              </h2>
            </div>
            <HeroSliderControls
              disabled={slides.length < 2}
              onPrevious={() => api?.scrollPrev()}
              onNext={() => {
                if (!api) {
                  return;
                }

                if (api.canScrollNext()) {
                  api.scrollNext();
                  return;
                }

                api.scrollTo(0);
              }}
            />
          </div>

          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: slides.length > 1, duration: 28 }}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {slides.map((campaign, index) => (
                <CarouselItem key={campaign.id} className="pl-0">
                  <HeroSlide campaign={campaign} priority={index === 0} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <HeroSliderDots total={slides.length} activeIndex={activeIndex} onSelect={(index) => api?.scrollTo(index)} />
        </div>
      </div>
    </section>
  );
}

