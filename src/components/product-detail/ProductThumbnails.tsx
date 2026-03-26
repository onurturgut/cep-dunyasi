"use client";

import { cn } from "@/lib/utils";

type ProductThumbnailsProps = {
  images: string[];
  productName: string;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function ProductThumbnails({ images, productName, activeIndex, onSelect }: ProductThumbnailsProps) {
  if (images.length <= 1) {
    return null;
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
      {images.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "relative aspect-square overflow-hidden rounded-2xl border bg-card transition-all",
            index === activeIndex
              ? "border-primary shadow-[0_14px_30px_-20px_rgba(220,38,38,0.55)]"
              : "border-border/70 hover:-translate-y-0.5 hover:border-foreground/20",
          )}
        >
          <img src={image} alt={`${productName} ${index + 1}`} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
