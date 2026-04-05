"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PasswordStrengthIndicator } from "@/components/account/PasswordStrengthIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/use-account";

export function SecuritySettingsForm() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Şifreniz basariyla degistirildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Şifre degistirilemedi");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
        <CardHeader>
          <CardTitle className="text-xl">Şifreyi Yenile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Mevcut Şifre</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Yeni Şifre</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Yeni Şifre Tekrari</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Kaydediliyor" : "Şifreyi Güncelle"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
        <CardHeader>
          <CardTitle className="text-xl">Guvenlik Notlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Guclu şifre kullanin
            </div>
            <p className="mt-2">Yeni şifrenizde buyuk harf, kucuk harf ve rakam bulundurun. Mumkunse ozel karakter de ekleyin.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="font-medium text-foreground">Oturum guvenligi</p>
            <p className="mt-2">Şifrenizi degistirdikten sonra mevcut oturumunuz yenilenir. Supheli bir durumda tekrar giris yapmaniz istenebilir.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="font-medium text-foreground">Destek</p>
            <p className="mt-2">Hesabiniza erisimle ilgili yardim gerekiyorsa destek ekibimizle iletisime gecebilirsiniz.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

