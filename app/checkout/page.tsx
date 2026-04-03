import { Suspense } from "react";
import CheckoutScreen from "@/screens/Checkout";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutScreen />
    </Suspense>
  );
}
