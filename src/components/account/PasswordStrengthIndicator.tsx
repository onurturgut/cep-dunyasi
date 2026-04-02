"use client";

import { Progress } from "@/components/ui/progress";
import { getPasswordStrength } from "@/lib/account";
import { useI18n } from "@/i18n/provider";

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const { locale } = useI18n();
  const strength = getPasswordStrength(password, locale);
  const label = locale === "en" ? "Password strength" : "Sifre gucu";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{strength.label}</span>
      </div>
      <Progress value={strength.value} className="h-2 rounded-full bg-muted/40" />
    </div>
  );
}
