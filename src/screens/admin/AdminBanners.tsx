"use client";

import { type ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BANNER_PLACEMENT_LABELS, BANNER_PLACEMENTS, type BannerCampaignRecord } from "@/lib/admin";
import { useBanners, useCreateBanner, useDeleteBanner } from "@/hooks/use-admin";

type BannerFormState = {
  id?: string;
  placement: BannerCampaignRecord["placement"];
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  mobileImageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  badgeText: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  sortOrder: number;
};

const defaultForm: BannerFormState = {
  placement: "home_hero",
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  mobileImageUrl: "",
  ctaLabel: "",
  ctaHref: "",
  badgeText: "",
  startAt: "",
  endAt: "",
  isActive: true,
  sortOrder: 0,
};

async function uploadBannerImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", "image");
  body.append("scope", "site-content");

  const response = await fetch("/api/upload", { method: "POST", body });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || "Banner gorseli yuklenemedi");
  }

  return `${payload?.data?.url ?? ""}`;
}

export default function AdminBanners() {
  const [form, setForm] = useState<BannerFormState>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const bannersQuery = useBanners();
  const saveBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, field: "imageUrl" | "mobileImageUrl") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      const url = await uploadBannerImage(file);
      setForm((current) => ({ ...current, [field]: url }));
      toast.success("Banner gorseli yuklendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner gorseli yuklenemedi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Banner ve Kampanyalar</h1>
        <p className="text-sm text-muted-foreground">Ana sayfa, kategori ve popup kampanyalarini tarih bazli yonetin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{form.id ? "Banner Duzenle" : "Yeni Banner"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Yerlesim</Label>
              <Select value={form.placement} onValueChange={(value) => setForm((current) => ({ ...current, placement: value as BannerCampaignRecord["placement"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_PLACEMENTS.map((placement) => (
                    <SelectItem key={placement} value={placement}>
                      {BANNER_PLACEMENT_LABELS[placement]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Baslik</Label>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Alt Baslik</Label>
              <Input value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Rozet</Label>
              <Input value={form.badgeText} onChange={(event) => setForm((current) => ({ ...current, badgeText: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aciklama</Label>
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ana Gorsel</Label>
              <Input type="file" accept="image/*" onChange={(event) => void handleImageUpload(event, "imageUrl")} disabled={uploading} />
              {form.imageUrl ? <img src={form.imageUrl} alt="Banner" className="h-32 w-full rounded-xl object-cover" /> : null}
            </div>
            <div className="space-y-2">
              <Label>Mobil Gorsel</Label>
              <Input type="file" accept="image/*" onChange={(event) => void handleImageUpload(event, "mobileImageUrl")} disabled={uploading} />
              {form.mobileImageUrl ? <img src={form.mobileImageUrl} alt="Mobil banner" className="h-32 w-full rounded-xl object-cover" /> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>CTA Metni</Label>
              <Input value={form.ctaLabel} onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>CTA Linki</Label>
              <Input value={form.ctaHref} onChange={(event) => setForm((current) => ({ ...current, ctaHref: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Siralama</Label>
              <Input type="number" min="0" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Baslangic Tarihi</Label>
              <Input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Bitis Tarihi</Label>
              <Input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
            <div>
              <p className="font-medium">Yayin Durumu</p>
              <p className="text-sm text-muted-foreground">Pasif kampanyalar tarih araliginda olsa bile yayinlanmaz.</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
          </div>

          <Button
            className="w-full"
            onClick={async () => {
              await saveBanner.mutateAsync(form);
              toast.success(form.id ? "Banner guncellendi" : "Banner olusturuldu");
              setForm(defaultForm);
            }}
          >
            {form.id ? "Banneri Guncelle" : "Banneri Kaydet"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {(bannersQuery.data ?? []).map((banner) => (
          <Card key={banner.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{banner.title}</p>
                  <p className="text-sm text-muted-foreground">{BANNER_PLACEMENT_LABELS[banner.placement]}</p>
                </div>
                <Badge variant={banner.isActive ? "default" : "secondary"}>{banner.isActive ? "Aktif" : "Pasif"}</Badge>
              </div>
              <img src={banner.imageUrl} alt={banner.title} className="h-44 w-full rounded-xl object-cover" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setForm({
                  id: banner.id,
                  placement: banner.placement,
                  title: banner.title,
                  subtitle: banner.subtitle ?? "",
                  description: banner.description ?? "",
                  imageUrl: banner.imageUrl,
                  mobileImageUrl: banner.mobileImageUrl ?? "",
                  ctaLabel: banner.ctaLabel ?? "",
                  ctaHref: banner.ctaHref ?? "",
                  badgeText: banner.badgeText ?? "",
                  startAt: banner.startAt ? banner.startAt.slice(0, 16) : "",
                  endAt: banner.endAt ? banner.endAt.slice(0, 16) : "",
                  isActive: banner.isActive,
                  sortOrder: banner.sortOrder,
                })}>
                  Duzenle
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await deleteBanner.mutateAsync(banner.id);
                    toast.success("Banner silindi");
                  }}
                >
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
