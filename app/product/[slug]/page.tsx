import { Suspense } from "react";
import ProductDetailScreen from "@/screens/ProductDetail";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailScreen />
    </Suspense>
  );
}
