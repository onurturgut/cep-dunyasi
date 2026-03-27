"use client";

import { AccountLayout } from "@/components/account/AccountLayout";
import { SecuritySettingsForm } from "@/components/account/SecuritySettingsForm";

export default function AccountSecurityScreen() {
  return (
    <AccountLayout
      title="Güvenlik Ayarları"
      description="Şifrenizi güvenli şekilde yenileyin ve hesabınızın koruma ayarlarını kontrol edin."
    >
      <SecuritySettingsForm />
    </AccountLayout>
  );
}
