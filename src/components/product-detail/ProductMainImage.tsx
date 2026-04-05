"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Expand, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";

type ProductMainImageProps = {
  image: string | null;
  alt: string;
  onOpenZoom: () => void;
  index: number;
  total: number;
};

export function ProductMainImage({ image, alt, onOpenZoom, index, total }: ProductMainImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setLoaded(false);
  }, [image]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_30px_80px_-48px_rgba(15,23,42,0.62)]">
      {image ? (
        <>
          {!loaded ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
          <button
            type="button"
            className="relative h-full w-full cursor-zoom-in overflow-hidden"
            onClick={onOpenZoom}
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - bounds.left) / bounds.width) * 100;
              const y = ((event.clientY - bounds.top) / bounds.height) * 100;
              setZoomPosition({ x, y });
            }}
          >
            <Image
              src={getOptimizedImageUrl(image, { kind: "product-detail" })}
              alt={alt}
              fill
              priority
              sizes={getResponsiveImageSizes("product-detail")}
              className="object-contain transition-transform duration-300 ease-out group-hover:scale-[1.18]"
              style={{ transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }}
              onLoad={() => setLoaded(true)}
            />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end bg-gradient-to-t from-black/35 via-black/5 to-transparent px-5 pb-5 pt-16 text-white">
            {total > 1 ? (
              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-medium tracking-[0.14em] backdrop-blur">
                {index + 1}/{total}
              </span>
            ) : null}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 h-10 rounded-full border border-white/15 bg-black/20 px-3 text-white shadow-sm backdrop-blur transition-opacity hover:bg-black/30 md:opacity-0 md:group-hover:opacity-100"
            onClick={onOpenZoom}
          >
            <Expand className="mr-2 h-4 w-4" />
            Incele
          </Button>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-muted-foreground">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60">
            <ImageOff className="h-9 w-9 opacity-50" />
          </div>
          <p className="text-sm">Bu urun icin görsel bulunamadi.</p>
        </div>
      )}
    </div>
  );
}

