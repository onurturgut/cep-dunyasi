"use client";

import { type ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { campaignBadgePresets, type CampaignFormValues } from "@/lib/campaigns";

type CampaignFormProps = {
  value: CampaignFormValues;
  uploading: boolean;
  submitting: boolean;
  onChange: (value: CampaignFormValues) => void;
  onSubmit: () => void;
  onImageUpload: (field: "imageUrl" | "mobileImageUrl", file: File) => Promise<void>;
};

export function CampaignForm({ value, uploading, submitting, onChange, onSubmit, onImageUpload }: CampaignFormProps) {
  const updateField = <K extends keyof CampaignFormValues>(field: K, nextValue: CampaignFormValues[K]) => {
    onChange({ ...value, [field]: nextValue });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, field: "imageUrl" | "mobileImageUrl") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    await onImageUpload(field, file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="campaign-title">Baslik</Label>
            <Input id="campaign-title" value={value.title} onChange={(event) => updateField("title", event.target.value)} />
            <p className="text-xs text-muted-foreground">Bu alan hem hero sliderda hem de ana sayfa kampanya kartinda kullanilir.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-subtitle">Alt Baslik</Label>
            <Input id="campaign-subtitle" value={value.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} />
            <p className="text-xs text-muted-foreground">Alt baslik daha cok hero slider tarafinda gorunur.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign-description">Aciklama</Label>
          <Textarea
            id="campaign-description"
            value={value.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">Aciklama metni hem slider iceriginde hem de kampanya karti aciklamasinda kullanilir.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="campaign-image">Ana Gorsel</Label>
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-3">
              <Input id="campaign-image" type="file" accept="image/*" disabled={uploading} onChange={(event) => void handleFileChange(event, "imageUrl")} />
              {value.imageUrl ? (
                <img src={value.imageUrl} alt="Kampanya ana gorseli" className="mt-3 h-32 w-full rounded-xl object-cover" />
              ) : (
                <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-border/60 bg-background text-sm text-muted-foreground">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Ana gorsel secin
                </div>
              )}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Onerilen masaustu olcusu: 1920x1080 px. Guvenli alternatif: 1600x900 px. Yatay oran en iyi sonucu verir.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-mobile-image">Mobil Gorsel</Label>
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-3">
              <Input id="campaign-mobile-image" type="file" accept="image/*" disabled={uploading} onChange={(event) => void handleFileChange(event, "mobileImageUrl")} />
              {value.mobileImageUrl ? (
                <img src={value.mobileImageUrl} alt="Kampanya mobil gorseli" className="mt-3 h-32 w-full rounded-xl object-cover" />
              ) : (
                <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-border/60 bg-background text-sm text-muted-foreground">
                  Mobil icin ayri gorsel opsiyonel
                </div>
              )}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Onerilen mobil olcu: 1080x1350 px veya 1080x1440 px. Mobil gorsel bos birakilirsa ana gorsel kullanilir.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="campaign-cta-text">CTA Metni</Label>
            <Input id="campaign-cta-text" value={value.ctaText} onChange={(event) => updateField("ctaText", event.target.value)} />
            <p className="text-xs text-muted-foreground">Buton metni kart ve slider butonuna ayni anda yansir.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-cta-link">CTA Linki</Label>
            <Input id="campaign-cta-link" value={value.ctaLink} onChange={(event) => updateField("ctaLink", event.target.value)} placeholder="/products?campaign=bahar" />
            <p className="text-xs text-muted-foreground">Ilk 3 aktif kampanyada bu link ana sayfa kartlarinda da kullanilir.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px_110px]">
          <div className="space-y-2">
            <Label htmlFor="campaign-badge-text">Rozet Metni</Label>
            <Input id="campaign-badge-text" value={value.badgeText} onChange={(event) => updateField("badgeText", event.target.value)} placeholder="4 Taksit" />
            <p className="text-xs text-muted-foreground">Rozet metni kampanya karti ustunde de gorunur.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-badge-color">Rozet Rengi</Label>
            <Input id="campaign-badge-color" type="color" value={value.badgeColor} onChange={(event) => updateField("badgeColor", event.target.value)} className="h-11 p-1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-order">Sira</Label>
            <Input id="campaign-order" type="number" min="0" value={value.order} onChange={(event) => updateField("order", Number(event.target.value) || 0)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {campaignBadgePresets.map((preset) => (
            <Button key={preset.value} type="button" variant="outline" size="sm" onClick={() => updateField("badgeColor", preset.value)}>
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="campaign-start-date">Baslangic Tarihi</Label>
            <Input id="campaign-start-date" type="datetime-local" value={value.startDate} onChange={(event) => updateField("startDate", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-end-date">Bitis Tarihi</Label>
            <Input id="campaign-end-date" type="datetime-local" value={value.endDate} onChange={(event) => updateField("endDate", event.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
          <div>
            <p className="font-medium text-foreground">Aktif kampanya</p>
            <p className="text-sm text-muted-foreground">Tarih araligina girse bile pasif kampanyalar yayina cikmaz.</p>
          </div>
          <Switch checked={value.isActive} onCheckedChange={(checked) => updateField("isActive", checked)} />
        </div>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-border/60 bg-muted/20 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Kaydetmeden once</p>
          <p className="text-sm text-muted-foreground">Metinlerin kisa, vurucu ve CTA odakli olmasi donusumu arttirir.</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
          Ilk slide daha hizli yukecegi icin en guclu kampanyayi en ust siraya koymaniz onerilir.
        </div>
        <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
          Gorsel gecersiz hatasi pikselden degil, gorsel adresinden gelir. Dosya yuklediginizde sistem otomatik gecerli URL olusturur.
        </div>
        <Button type="button" className="w-full rounded-full" onClick={() => void onSubmit()} disabled={submitting || uploading}>
          {value.id ? "Kampanyayi Guncelle" : "Kampanyayi Yayinla"}
        </Button>
      </div>
    </div>
  );
}
