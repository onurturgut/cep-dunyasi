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
            "relative aspect-square overflow-hidden rounded-[1.35rem] border transition-all duration-300",
            index === activeIndex
              ? "border-white/30 bg-white/10 shadow-[0_18px_36px_-28px_rgba(255,255,255,0.45)]"
              : "border-white/8 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/20",
          )}
        >
          <img src={image} alt={`${productName} ${index + 1}`} className="h-full w-full object-cover" />
          <div className={cn("absolute inset-0 transition-colors", index === activeIndex ? "ring-1 ring-inset ring-white/20" : "")} />
        </button>
      ))}
    </div>
  );
}
