import type { Metadata } from "next";
import { Suspense } from "react";
import TechnicalServiceScreen from "@/screens/TechnicalService";

export const metadata: Metadata = {
  title: "Cep Dünyası Teknik Servis | Telefon Tamiri ve Arıza Kaydı",
  description:
    "Cep Dünyası teknik servis hizmeti ile ekran kırığı, batarya sorunu, şarj soketi arızası, kamera ve ses problemleri için hızlı arıza kaydı oluşturun.",
};

export default function TechnicalServicePage() {
  return (
    <Suspense fallback={null}>
      <TechnicalServiceScreen />
    </Suspense>
  );
}
