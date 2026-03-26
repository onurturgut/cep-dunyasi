"use client";

import { AccountLayout } from "@/components/account/AccountLayout";
import { SecuritySettingsForm } from "@/components/account/SecuritySettingsForm";

export default function AccountSecurityScreen() {
  return (
    <AccountLayout
      title="Guvenlik Ayarlari"
      description="Sifrenizi guvenli sekilde yenileyin ve hesabinizin koruma ayarlarini kontrol edin."
    >
      <SecuritySettingsForm />
    </AccountLayout>
  );
}
