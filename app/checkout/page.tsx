import { Suspense } from "react";
import CheckoutScreen from "@/screens/Checkout";

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutScreen />
    </Suspense>
  );
}
