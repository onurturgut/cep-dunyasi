import { Suspense } from "react";
import AuthScreen from "@/screens/Auth";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen />
    </Suspense>
  );
}
