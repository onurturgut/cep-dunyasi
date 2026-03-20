import { Suspense } from "react";
import ProductsScreen from "@/screens/Products";

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsScreen />
    </Suspense>
  );
}
