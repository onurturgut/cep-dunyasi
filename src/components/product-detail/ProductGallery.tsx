"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ProductMainImage } from "@/components/product-detail/ProductMainImage";
import { ProductThumbnails } from "@/components/product-detail/ProductThumbnails";

const ProductImageZoomModal = dynamic(
  () => import("@/components/product-detail/ProductImageZoomModal").then((module) => module.ProductImageZoomModal),
  { ssr: false },
);

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [touchStartPoint, setTouchStartPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  const galleryImages = images.length > 0 ? images : [];
  const selectedImage = galleryImages[activeIndex] || galleryImages[0] || null;
  const canNavigate = galleryImages.length > 1;

  const goToPrevious = () => {
    if (!canNavigate) {
      return;
    }

    setActiveIndex((current) => (current === 0 ? galleryImages.length - 1 : current - 1));
  };

  const goToNext = () => {
    if (!canNavigate) {
      return;
    }

    setActiveIndex((current) => (current === galleryImages.length - 1 ? 0 : current + 1));
  };

  return (
    <div className="space-y-4">
      <div
        className="touch-pan-y"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (!touch) {
            return;
          }

          setTouchStartPoint({ x: touch.clientX, y: touch.clientY });
        }}
        onTouchEnd={(event) => {
          if (!touchStartPoint || !canNavigate) {
            setTouchStartPoint(null);
            return;
          }

          const touch = event.changedTouches[0];
          if (!touch) {
            setTouchStartPoint(null);
            return;
          }

          const deltaX = touch.clientX - touchStartPoint.x;
          const deltaY = touch.clientY - touchStartPoint.y;
          const horizontalSwipeThreshold = 48;

          if (Math.abs(deltaX) > horizontalSwipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
              goToPrevious();
            } else {
              goToNext();
            }
          }

          setTouchStartPoint(null);
        }}
      >
        <ProductMainImage
          image={selectedImage}
          alt={productName}
          onOpenZoom={() => setZoomOpen(true)}
          index={activeIndex}
          total={galleryImages.length}
        />
      </div>

      <ProductThumbnails
        images={galleryImages}
        productName={productName}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
      />

      <ProductImageZoomModal
        open={zoomOpen}
        onOpenChange={setZoomOpen}
        images={galleryImages}
        activeIndex={activeIndex}
        onIndexChange={setActiveIndex}
        productName={productName}
      />
    </div>
  );
}
