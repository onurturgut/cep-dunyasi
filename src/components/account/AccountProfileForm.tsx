"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Loader2, Mail, UserRound } from "lucide-react";
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

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

type AccountProfileFormProps = {
  profile: AccountProfile;
};

export function AccountProfileForm({ profile }: AccountProfileFormProps) {
  const updateProfile = useUpdateAccountProfile();
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [phone, setPhone] = useState(profile.phone);
  const [profileImageUrl, setProfileImageUrl] = useState(profile.profile_image_url || "");
  const [prefersEmail, setPrefersEmail] = useState(profile.communication_preferences.email);
  const [prefersSms, setPrefersSms] = useState(profile.communication_preferences.sms);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setPhone(profile.phone);
    setProfileImageUrl(profile.profile_image_url || "");
    setPrefersEmail(profile.communication_preferences.email);
    setPrefersSms(profile.communication_preferences.sms);
  }, [profile]);

  const hasChanges = useMemo(
    () =>
      firstName !== profile.first_name ||
      lastName !== profile.last_name ||
      phone !== profile.phone ||
      profileImageUrl !== (profile.profile_image_url || "") ||
      prefersEmail !== profile.communication_preferences.email ||
      prefersSms !== profile.communication_preferences.sms,
    [firstName, lastName, phone, profileImageUrl, prefersEmail, prefersSms, profile],
  );

  const handleAvatarUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Sadece gorsel dosyasi yukleyebilirsiniz.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error("Profil gorseli en fazla 5MB olabilir.");
      return;
    }

    try {
      setUploading(true);
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "image");
      body.append("scope", "avatars");

      const response = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || "Profil gorseli yuklenemedi");
      }

      setProfileImageUrl(`${payload?.data?.url ?? ""}`.trim());
      toast.success("Profil gorseli hazir.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profil gorseli yuklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await updateProfile.mutateAsync({
        firstName,
        lastName,
        phone: sanitizePhone(phone),
        profileImageUrl: profileImageUrl || null,
        communicationPreferences: {
          email: prefersEmail,
          sms: prefersSms,
        },
      });

      toast.success("Profil bilgileriniz guncellendi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profil guncellenemedi");
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

            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="rounded-[1.5rem] border border-border/70 bg-muted/15 p-4">
                <p className="text-sm font-medium text-foreground">Profil Gorseli</p>
                <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/80">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt={profile.full_name || "Profil gorseli"} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted/30 text-muted-foreground">
                      <UserRound className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <Input id="account-avatar" type="file" accept="image/*" onChange={(event) => void handleAvatarUpload(event.target.files)} disabled={uploading} />
                  {profileImageUrl ? (
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setProfileImageUrl("")}>
                      Gorseli Kaldir
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-muted/10 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Iletisim Tercihleri</p>
                  <p className="mt-1 text-xs text-muted-foreground">Siparis ve kampanya bildirimlerinizi hangi kanallardan almak istediginizi secin.</p>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-foreground">E-posta Bildirimleri</p>
                    <p className="text-xs text-muted-foreground">Siparis guncellemeleri ve bilgilendirmeler</p>
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
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFirstName(profile.first_name);
                  setLastName(profile.last_name);
                  setPhone(profile.phone);
                  setProfileImageUrl(profile.profile_image_url || "");
                  setPrefersEmail(profile.communication_preferences.email);
                  setPrefersSms(profile.communication_preferences.sms);
                }}
                disabled={!hasChanges || updateProfile.isPending || uploading}
              >
                Degisiklikleri Geri Al
              </Button>
              <Button type="submit" disabled={!hasChanges || updateProfile.isPending || uploading}>
                {updateProfile.isPending || uploading ? (
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
            <p className="mt-1">Sifre veya iletisim bilgilerinizi guncellediginizde aktif oturumunuz otomatik olarak yenilenir.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="font-medium text-foreground">Teslimat hazirligi</p>
            <p className="mt-1">Varsayilan adres ve telefon bilgilerinizi guncel tutmaniz checkout surecini hizlandirir.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="font-medium text-foreground">Kampanya izinleri</p>
            <p className="mt-1">Iletisim tercihlerinizi istediginiz zaman bu ekran uzerinden degistirebilirsiniz.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
