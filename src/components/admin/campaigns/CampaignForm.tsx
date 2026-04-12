"use client";

import { type ChangeEvent, useMemo } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCampaignCtaOptions,
  campaignBadgePresets,
  resolveCampaignCtaSelection,
  type CampaignCategoryOption,
  type CampaignFormValues,
} from "@/lib/campaigns";

type CampaignFormProps = {
  categories: CampaignCategoryOption[];
  value: CampaignFormValues;
  uploading: boolean;
  submitting: boolean;
  onChange: (value: CampaignFormValues) => void;
  onSubmit: () => void;
  onImageUpload: (field: "imageUrl" | "mobileImageUrl", file: File) => Promise<void>;
};

export function CampaignForm({ categories, value, uploading, submitting, onChange, onSubmit, onImageUpload }: CampaignFormProps) {
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

  const ctaOptions = useMemo(() => buildCampaignCtaOptions(categories), [categories]);
  const selectedCtaTarget = useMemo(() => resolveCampaignCtaSelection(value.ctaLink, ctaOptions), [ctaOptions, value.ctaLink]);

  const handleTargetChange = (nextValue: string) => {
    if (nextValue === "custom") {
      if (!value.ctaLink.trim()) {
        updateField("ctaLink", "/products");
      }
      return;
    }

    const selectedOption = ctaOptions.find((option) => option.value === nextValue);
    updateField("ctaLink", selectedOption?.href ?? "");
  };

  const selectedTargetLabel = ctaOptions.find((option) => option.value === selectedCtaTarget)?.label ?? "Ozel baglanti";

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
              Yukleme sirasinda otomatik olarak 1600x1600 px olcegine uyarlanir. Kare kompozisyon en iyi sonucu verir.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-mobile-image">Mobil Gorsel</Label>
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-3">
              <Input
                id="campaign-mobile-image"
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(event) => void handleFileChange(event, "mobileImageUrl")}
              />
              {value.mobileImageUrl ? (
                <img src={value.mobileImageUrl} alt="Kampanya mobil gorseli" className="mt-3 h-32 w-full rounded-xl object-cover" />
              ) : (
                <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-border/60 bg-background text-sm text-muted-foreground">
                  Mobil icin ayri gorsel opsiyonel
                </div>
              )}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Yukleme sirasinda otomatik olarak 1200x1500 px olcegine uyarlanir. Mobil gorsel bos birakilirsa ana gorsel kullanilir.
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
            <Label htmlFor="campaign-cta-target">Hedef Sayfa</Label>
            <Select value={selectedCtaTarget} onValueChange={handleTargetChange}>
              <SelectTrigger id="campaign-cta-target">
                <SelectValue placeholder="Kullanici nereye gitsin?" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {ctaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Teknik link yazmak yerine hazir bir hedef secin. Gerekiyorsa en alttan ozel baglanti kullanabilirsiniz.</p>
          </div>
        </div>

        {selectedCtaTarget === "custom" ? (
          <div className="space-y-2">
            <Label htmlFor="campaign-cta-link">Ozel Baglanti</Label>
            <Input
              id="campaign-cta-link"
              value={value.ctaLink}
              onChange={(event) => updateField("ctaLink", event.target.value)}
              placeholder="/products?category=iphone-kiliflari"
            />
            <p className="text-xs text-muted-foreground">Site ici sayfalarda baglantiyi genelde `/` ile baslatin. Ornek: `/products` veya `/iletisim`.</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Secili hedef: <span className="font-medium text-foreground">{selectedTargetLabel}</span>
          {value.ctaLink ? <span className="ml-2 rounded-full border border-border/60 px-2 py-1 text-xs">{value.ctaLink}</span> : null}
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
          Ilk slide daha hizli yuklenecegi icin en guclu kampanyayi en ust siraya koymaniz onerilir.
        </div>
        <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">
          Kampanya yonlendirmelerinde once kategori veya urunler sayfasini secmek daha anlasilir olur. Ozel baglanti sadece istisna durumlarda lazim.
        </div>
        <Button type="button" className="w-full rounded-full" onClick={() => void onSubmit()} disabled={submitting || uploading}>
          {value.id ? "Kampanyayi Guncelle" : "Kampanyayi Yayinla"}
        </Button>
      </div>
    </div>
  );
}
