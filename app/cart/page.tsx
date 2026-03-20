import { Suspense } from "react";
import CartScreen from "@/screens/Cart";

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartScreen />
    </Suspense>
  );
}
