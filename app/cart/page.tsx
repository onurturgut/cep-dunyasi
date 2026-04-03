import { Suspense } from "react";
import CartScreen from "@/screens/Cart";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartScreen />
    </Suspense>
  );
}
