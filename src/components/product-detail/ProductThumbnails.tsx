"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";

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
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0">
      {images.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "relative aspect-square w-20 shrink-0 overflow-hidden rounded-[1.35rem] border transition-all duration-300 sm:w-auto",
            index === activeIndex
              ? "border-white/30 bg-white/10 shadow-[0_18px_36px_-28px_rgba(255,255,255,0.45)]"
              : "border-white/8 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/20",
          )}
        >
          <Image
            src={getOptimizedImageUrl(image, { kind: "thumbnail" })}
            alt={`${productName} ${index + 1}`}
            width={160}
            height={160}
            sizes={getResponsiveImageSizes("thumbnail")}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className={cn("absolute inset-0 transition-colors", index === activeIndex ? "ring-1 ring-inset ring-white/20" : "")} />
        </button>
      ))}
    </div>
  );
}
