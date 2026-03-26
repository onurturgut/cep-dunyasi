"use client";

import { useEffect, useState } from "react";
import { Expand, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="group relative aspect-square overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-white via-muted/10 to-muted/30 shadow-[0_24px_64px_-40px_rgba(15,23,42,0.4)]">
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
            <img
              src={image}
              alt={alt}
              className="h-full w-full object-contain p-5 transition-transform duration-300 ease-out group-hover:scale-[1.65]"
              style={{ transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }}
              onLoad={() => setLoaded(true)}
            />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 via-black/5 to-transparent px-4 pb-4 pt-16 text-white">
            <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium backdrop-blur">
              Premium Galeri
            </span>
            {total > 1 ? (
              <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium backdrop-blur">
                {index + 1}/{total}
              </span>
            ) : null}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 h-10 rounded-full border border-white/50 bg-white/90 px-3 text-foreground shadow-sm backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100"
            onClick={onOpenZoom}
          >
            <Expand className="mr-2 h-4 w-4" />
            Yakindan incele
          </Button>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-muted-foreground">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60">
            <ImageOff className="h-9 w-9 opacity-50" />
          </div>
          <p className="text-sm">Bu urun icin gorsel bulunamadi.</p>
        </div>
      )}
    </div>
  );
}
