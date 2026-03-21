import type { Metadata } from "next";
import { Suspense } from "react";
import TechnicalServiceScreen from "@/screens/TechnicalService";

export const metadata: Metadata = {
  title: "Cep Dunyasi Teknik Servis | Telefon Tamiri ve Ariza Kaydi",
  description:
    "Cep Dunyasi teknik servis hizmeti ile ekran kirigi, batarya sorunu, sarj soketi arizasi, kamera ve ses problemleri icin hizli ariza kaydi olusturun.",
};

export default function TechnicalServicePage() {
  return (
    <Suspense fallback={null}>
      <TechnicalServiceScreen />
    </Suspense>
  );
}
