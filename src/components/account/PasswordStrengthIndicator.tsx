"use client";

import { Progress } from "@/components/ui/progress";
import { getPasswordStrength } from "@/lib/account";

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Sifre gucu</span>
        <span className="font-medium text-foreground">{strength.label}</span>
      </div>
      <Progress value={strength.value} className="h-2 rounded-full bg-muted/40" />
    </div>
  );
}
