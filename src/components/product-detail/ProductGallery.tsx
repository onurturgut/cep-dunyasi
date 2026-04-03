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

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  const galleryImages = images.length > 0 ? images : [];
  const selectedImage = galleryImages[activeIndex] || galleryImages[0] || null;

  return (
    <div className="space-y-4">
      <ProductMainImage
        image={selectedImage}
        alt={productName}
        onOpenZoom={() => setZoomOpen(true)}
        index={activeIndex}
        total={galleryImages.length}
      />

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
