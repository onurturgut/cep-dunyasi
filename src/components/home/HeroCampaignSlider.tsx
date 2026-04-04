"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroCampaignControls } from "@/components/home/HeroCampaignControls";
import { HeroCampaignDots } from "@/components/home/HeroCampaignDots";
import { HeroCampaignSlide } from "@/components/home/HeroCampaignSlide";
import type { HeroCampaignSlideData } from "@/lib/home-campaigns";
import { postMarketingEventOnce } from "@/lib/marketing-events";

type HeroCampaignSliderProps = {
  slides: HeroCampaignSlideData[];
  isLoading?: boolean;
};

export function HeroCampaignSlider({ slides, isLoading = false }: HeroCampaignSliderProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackedSlideIdsRef = useRef<Set<string>>(new Set());
  const sliderSlides = useMemo(() => slides.filter((slide) => slide.imageUrl), [slides]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const syncIndex = () => setActiveIndex(api.selectedScrollSnap());

    syncIndex();
    api.on("select", syncIndex);
    api.on("reInit", syncIndex);

    return () => {
      api.off("select", syncIndex);
      api.off("reInit", syncIndex);
    };
  }, [api]);

  useEffect(() => {
    if (!api || sliderSlides.length < 2 || paused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [api, paused, sliderSlides.length]);

  useEffect(() => {
    const activeSlide = sliderSlides[activeIndex];
    if (!activeSlide) {
      return;
    }

    if (trackedSlideIdsRef.current.has(activeSlide.id)) {
      return;
    }

    trackedSlideIdsRef.current.add(activeSlide.id);

    void postMarketingEventOnce({
      eventType: "campaign_view",
      entityType: "campaign",
      entityId: activeSlide.id,
      pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
      metadata: {
        position: activeIndex,
      },
    }, { dedupeKey: `campaign-view:${activeSlide.id}`, windowMs: 60_000 });
  }, [activeIndex, sliderSlides]);

  if (isLoading) {
    return (
      <div className="rounded-[2.4rem] p-5">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] lg:items-center">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24 rounded-full bg-foreground/8 dark:bg-white/10" />
            <Skeleton className="h-14 w-full max-w-xl rounded-2xl bg-foreground/8 dark:bg-white/10" />
            <Skeleton className="h-14 w-full max-w-lg rounded-2xl bg-foreground/8 dark:bg-white/10" />
            <Skeleton className="h-5 w-full max-w-xl rounded-full bg-foreground/8 dark:bg-white/10" />
            <Skeleton className="h-5 w-full max-w-lg rounded-full bg-foreground/8 dark:bg-white/10" />
            <div className="flex gap-3">
              <Skeleton className="h-11 w-40 rounded-full bg-foreground/8 dark:bg-white/10" />
              <Skeleton className="h-11 w-36 rounded-full bg-foreground/8 dark:bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-[18rem] rounded-[2rem] bg-foreground/8 dark:bg-white/10 sm:h-[22rem] lg:h-[30rem]" />
        </div>
      </div>
    );
  }

  if (sliderSlides.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            className="text-xs font-medium uppercase tracking-[0.32em] text-muted-foreground dark:text-white/55"
          >
            Premium Campaigns
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, amount: 0.35 }}
            className="font-display text-3xl font-semibold tracking-tight text-foreground dark:text-white sm:text-4xl"
          >
            Teknolojiyi premium vitrin hissiyle kesfet
          </motion.h2>
        </div>
        <HeroCampaignControls
          disabled={sliderSlides.length < 2}
          onPrevious={() => api?.scrollPrev()}
          onNext={() => {
            if (!api) {
              return;
            }

            if (api.canScrollNext()) {
              api.scrollNext();
            } else {
              api.scrollTo(0);
            }
          }}
        />
      </div>

      <Carousel setApi={setApi} opts={{ align: "start", loop: sliderSlides.length > 1, duration: 28 }} className="w-full">
        <CarouselContent className="ml-0">
          {sliderSlides.map((slide, index) => (
            <CarouselItem key={slide.id} className="pl-0">
              <HeroCampaignSlide slide={slide} priority={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <HeroCampaignDots total={sliderSlides.length} activeIndex={activeIndex} onSelect={(index) => api?.scrollTo(index)} />
    </div>
  );
}
