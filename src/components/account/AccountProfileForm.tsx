"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import type { AccountProfile } from "@/lib/account";
import { sanitizePhone } from "@/lib/account";
import { formatDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateAccountProfile } from "@/hooks/use-account";

type AccountProfileFormProps = {
  profile: AccountProfile;
};

export function AccountProfileForm({ profile }: AccountProfileFormProps) {
  const updateProfile = useUpdateAccountProfile();
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [phone, setPhone] = useState(profile.phone);
  const [prefersEmail, setPrefersEmail] = useState(profile.communication_preferences.email);
  const [prefersSms, setPrefersSms] = useState(profile.communication_preferences.sms);

  useEffect(() => {
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setPhone(profile.phone);
    setPrefersEmail(profile.communication_preferences.email);
    setPrefersSms(profile.communication_preferences.sms);
  }, [profile]);

  const hasChanges = useMemo(
    () =>
      firstName !== profile.first_name ||
      lastName !== profile.last_name ||
      phone !== profile.phone ||
      prefersEmail !== profile.communication_preferences.email ||
      prefersSms !== profile.communication_preferences.sms,
    [firstName, lastName, phone, prefersEmail, prefersSms, profile],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateProfile.mutateAsync({
        firstName,
        lastName,
        phone: sanitizePhone(phone),
        communicationPreferences: {
          email: prefersEmail,
          sms: prefersSms,
        },
      });

      toast.success("Profil bilgileriniz güncellendi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profil güncellenemedi");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
        <CardHeader>
          <CardTitle className="text-xl">Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-first-name">Ad</Label>
                <Input id="account-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Adiniz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-last-name">Soyad</Label>
                <Input id="account-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Soyadiniz" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-phone">Telefon</Label>
                <Input id="account-phone" value={phone} onChange={(event) => setPhone(sanitizePhone(event.target.value))} placeholder="05xx xxx xx xx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-email">E-posta</Label>
                <Input id="account-email" value={profile.email} readOnly className="cursor-not-allowed bg-muted/30" />
                <p className="text-xs text-muted-foreground">Guvenlik nedeniyle e-posta degisikligi ayrica destek uzerinden yonetilir.</p>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-muted/10 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">İletişim Tercihleri</p>
                  <p className="mt-1 text-xs text-muted-foreground">Sipariş ve kampanya bildirimlerinizi hangi kanallardan almak istediğinizi seçin.</p>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-foreground">E-posta Bildirimleri</p>
                    <p className="text-xs text-muted-foreground">Sipariş güncellemeleri ve bilgilendirmeler</p>
                  </div>
                  <Switch checked={prefersEmail} onCheckedChange={setPrefersEmail} />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-foreground">SMS Bildirimleri</p>
                    <p className="text-xs text-muted-foreground">Teslimat ve servis sureci bildirimleri</p>
                  </div>
                  <Switch checked={prefersSms} onCheckedChange={setPrefersSms} />
                </div>

                <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Hesabiniz {formatDate(profile.created_at)} tarihinden beri aktif.
                </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFirstName(profile.first_name);
                  setLastName(profile.last_name);
                  setPhone(profile.phone);
                  setPrefersEmail(profile.communication_preferences.email);
                  setPrefersSms(profile.communication_preferences.sms);
                }}
                disabled={!hasChanges || updateProfile.isPending}
              >
                Degisiklikleri Geri Al
              </Button>
              <Button type="submit" disabled={!hasChanges || updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Profili Kaydet
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
        <CardHeader>
          <CardTitle className="text-xl">Hesap Ozetiniz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="font-medium text-foreground">Guvenli oturum</p>
            <p className="mt-1">Şifre veya iletişim bilgilerinizi güncellediğinizde aktif oturumunuz otomatik olarak yenilenir.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="font-medium text-foreground">Teslimat hazirligi</p>
            <p className="mt-1">Varsayılan adres ve telefon bilgilerinizi güncel tutmanız checkout sürecini hızlandırır.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="font-medium text-foreground">Kampanya izinleri</p>
            <p className="mt-1">İletişim tercihlerinizi istediğiniz zaman bu ekran üzerinden değiştirebilirsiniz.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


