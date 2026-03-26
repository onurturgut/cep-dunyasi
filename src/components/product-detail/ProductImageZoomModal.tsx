"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProductImageZoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
};

export function ProductImageZoomModal({
  open,
  onOpenChange,
  images,
  activeIndex,
  onIndexChange,
  productName,
}: ProductImageZoomModalProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        onIndexChange(activeIndex > 0 ? activeIndex - 1 : images.length - 1);
      }

      if (event.key === "ArrowRight") {
        onIndexChange(activeIndex < images.length - 1 ? activeIndex + 1 : 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length, onIndexChange, open]);

  const canNavigate = images.length > 1;
  const currentImage = images[activeIndex] || images[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[100dvh] max-w-none gap-0 border-none bg-black/95 p-0 text-white shadow-none sm:h-[92vh] sm:max-w-6xl sm:rounded-3xl">
        <div className="sr-only">
          <DialogTitle>{productName} gorsel galerisi</DialogTitle>
          <DialogDescription>Urun gorsellerini buyuk onizleme modunda inceleyin.</DialogDescription>
        </div>

        <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80 sm:flex">
            <ZoomIn className="h-3.5 w-3.5" />
            Tam ekran inceleme
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="relative flex h-full min-h-0 items-center justify-center overflow-hidden"
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStartX === null || !canNavigate) {
              setTouchStartX(null);
              return;
            }

            const touchEndX = event.changedTouches[0]?.clientX ?? 0;
            const deltaX = touchEndX - touchStartX;

            if (Math.abs(deltaX) > 50) {
              if (deltaX > 0) {
                onIndexChange(activeIndex > 0 ? activeIndex - 1 : images.length - 1);
              } else {
                onIndexChange(activeIndex < images.length - 1 ? activeIndex + 1 : 0);
              }
            }

            setTouchStartX(null);
          }}
        >
          {canNavigate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:flex"
              onClick={() => onIndexChange(activeIndex > 0 ? activeIndex - 1 : images.length - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : null}

          <div className="flex h-full w-full items-center justify-center px-4 py-16 sm:px-20">
            {currentImage ? (
              <img src={currentImage} alt={productName} className="max-h-full max-w-full rounded-2xl object-contain" />
            ) : (
              <div className="flex h-[320px] w-full items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 text-sm text-white/60">
                Gorsel bulunamadi
              </div>
            )}
          </div>

          {canNavigate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:flex"
              onClick={() => onIndexChange(activeIndex < images.length - 1 ? activeIndex + 1 : 0)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="border-t border-white/10 bg-black/40 px-4 py-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition-all sm:h-20 sm:w-20",
                    index === activeIndex ? "border-white bg-white/10" : "border-white/15 bg-white/5 hover:border-white/40",
                  )}
                  onClick={() => onIndexChange(index)}
                >
                  <img src={image} alt={`${productName} ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
