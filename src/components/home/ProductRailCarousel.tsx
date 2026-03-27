"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CarouselApi } from "@/components/ui/carousel";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

type ProductRailCarouselProps = {
  items: ReactNode[];
};

export function ProductRailCarousel({ items }: ProductRailCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(items.length > 1);

  useEffect(() => {
    if (!api) {
      return;
    }

    const sync = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    sync();
    api.on("select", sync);
    api.on("reInit", sync);

    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full border-border/70 bg-background/80"
          onClick={() => api?.scrollPrev()}
          disabled={!canScrollPrev}
          aria-label="Önceki ürünler"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full border-border/70 bg-background/80"
          onClick={() => api?.scrollNext()}
          disabled={!canScrollNext}
          aria-label="Sonraki ürünler"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Carousel setApi={setApi} opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-3 sm:-ml-4">
          {items.map((item, index) => (
            <CarouselItem
              key={`rail-item-${index}`}
              className="basis-[82%] pl-3 sm:basis-[56%] sm:pl-4 lg:basis-[36%] xl:basis-[28%] 2xl:basis-[24%]"
            >
              {item}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

