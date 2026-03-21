"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { db } from "@/integrations/mongo/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultSiteContent } from "@/components/home/home-data";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMediaUrls, diffRemovedMediaUrls } from "@/lib/admin-media";

type HeroSlide = {
  id: string;
  image_url: string;
  alt: string;
};

type HeroBenefit = {
  icon: string;
  title: string;
  desc: string;
};

type SiteContentForm = {
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_title_suffix: string;
  hero_subtitle: string;
  hero_logo_light_url: string;
  hero_logo_dark_url: string;
  hero_cta_label: string;
  hero_cta_href: string;
  category_section_title: string;
  category_section_description: string;
  explore_section_title: string;
  featured_section_title: string;
  featured_section_cta_label: string;
  featured_section_cta_href: string;
  hero_slides: HeroSlide[];
  hero_benefits: HeroBenefit[];
};

const benefitIconOptions = ["Truck", "ShieldCheck", "CreditCard", "Smartphone", "BatteryCharging", "Battery", "Watch", "Wrench"];

function createEmptySlide(index: number): HeroSlide {
  return {
    id: `slide-${index + 1}`,
    image_url: "",
    alt: "",
  };
}

export default function AdminSiteContent() {
  const [form, setForm] = useState<SiteContentForm>({
    ...defaultSiteContent,
    hero_slides: defaultSiteContent.hero_slides,
    hero_benefits: defaultSiteContent.hero_benefits,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await db.from("site_contents").select("*").eq("key", "home").single();
      if (error && error.message !== "Mongo sorgusu basarisiz") {
        toast.error(error.message);
      }

      if (data) {
        setForm({
          ...defaultSiteContent,
          ...data,
          hero_slides: Array.isArray(data.hero_slides) && data.hero_slides.length > 0 ? data.hero_slides : defaultSiteContent.hero_slides,
          hero_benefits:
            Array.isArray(data.hero_benefits) && data.hero_benefits.length > 0 ? data.hero_benefits : defaultSiteContent.hero_benefits,
        });
      }
      setLoading(false);
    };

    fetchContent();
  }, []);

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", "image");
    body.append("scope", "site-content");

    const response = await fetch("/api/upload", {
      method: "POST",
      body,
    });

    const payload = await response.json();

    if (!response.ok || payload?.error) {
      throw new Error(payload?.error?.message || "Gorsel yuklenemedi");
    }

    const url = payload?.data?.url;
    if (!url) {
      throw new Error("Yukleme tamamlandi ama URL donmedi");
    }

    return `${url}`;
  };

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    target: "hero_logo_light_url" | "hero_logo_dark_url" | { slideIndex: number }
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const targetKey = typeof target === "string" ? target : `slide-${target.slideIndex}`;
      setUploadingTarget(targetKey);
      const url = await uploadImage(file);

      if (typeof target === "string") {
        setForm((current) => ({ ...current, [target]: url }));
      } else {
        setForm((current) => ({
          ...current,
          hero_slides: current.hero_slides.map((slide, index) => (index === target.slideIndex ? { ...slide, image_url: url } : slide)),
        }));
      }

      toast.success("Gorsel yuklendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gorsel yukleme hatasi");
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      key: "home",
      ...form,
      hero_slides: form.hero_slides.filter((slide) => slide.image_url.trim()),
      hero_benefits: form.hero_benefits.filter((benefit) => benefit.title.trim() || benefit.desc.trim()),
    };

    const existing = await db.from("site_contents").select("*").eq("key", "home").single();
    const result = existing.data
      ? await db.from("site_contents").update(payload).eq("key", "home")
      : await db.from("site_contents").insert(payload);

    setSaving(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    if (existing.data) {
      const previousUrls = [
        existing.data.hero_logo_light_url,
        existing.data.hero_logo_dark_url,
        ...(Array.isArray(existing.data.hero_slides) ? existing.data.hero_slides.map((slide: HeroSlide) => slide.image_url) : []),
      ];
      const nextUrls = [
        payload.hero_logo_light_url,
        payload.hero_logo_dark_url,
        ...payload.hero_slides.map((slide) => slide.image_url),
      ];
      const removedUrls = diffRemovedMediaUrls(previousUrls, nextUrls);

      if (removedUrls.length > 0) {
        try {
          await deleteMediaUrls(removedUrls);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Eski site gorselleri silinemedi");
        }
      }
    }

    toast.success("Site icerigi kaydedildi");
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Yukleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Site Icerikleri</h1>
        <p className="text-sm text-muted-foreground">Anasayfa gorselleri ve metinleri admin panelden R2 destekli olarak yonetilir.</p>
      </div>

      <Card className="space-y-6 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Hero Baslik 1</Label>
            <Input value={form.hero_title_prefix} onChange={(e) => setForm((current) => ({ ...current, hero_title_prefix: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Vurgulu Metin</Label>
            <Input value={form.hero_title_highlight} onChange={(e) => setForm((current) => ({ ...current, hero_title_highlight: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Hero Baslik 2</Label>
            <Input value={form.hero_title_suffix} onChange={(e) => setForm((current) => ({ ...current, hero_title_suffix: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alt Baslik</Label>
          <Textarea value={form.hero_subtitle} onChange={(e) => setForm((current) => ({ ...current, hero_subtitle: e.target.value }))} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>CTA Metni</Label>
            <Input value={form.hero_cta_label} onChange={(e) => setForm((current) => ({ ...current, hero_cta_label: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>CTA Linki</Label>
            <Input value={form.hero_cta_href} onChange={(e) => setForm((current) => ({ ...current, hero_cta_href: e.target.value }))} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Acik Logo URL</Label>
            <Input
              value={form.hero_logo_light_url}
              onChange={(e) => setForm((current) => ({ ...current, hero_logo_light_url: e.target.value }))}
            />
            <Input type="file" accept="image/*" onChange={(e) => handleUpload(e, "hero_logo_light_url")} disabled={uploadingTarget === "hero_logo_light_url"} />
          </div>
          <div className="space-y-2">
            <Label>Koyu Logo URL</Label>
            <Input
              value={form.hero_logo_dark_url}
              onChange={(e) => setForm((current) => ({ ...current, hero_logo_dark_url: e.target.value }))}
            />
            <Input type="file" accept="image/*" onChange={(e) => handleUpload(e, "hero_logo_dark_url")} disabled={uploadingTarget === "hero_logo_dark_url"} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Hero Slaytlari</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setForm((current) => ({
                ...current,
                hero_slides: [...current.hero_slides, createEmptySlide(current.hero_slides.length)],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Slayt Ekle
          </Button>
        </div>
        <div className="space-y-4">
          {form.hero_slides.map((slide, index) => (
            <Card key={`${slide.id}-${index}`} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Slayt {index + 1}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      hero_slides: current.hero_slides.filter((_, slideIndex) => slideIndex !== index),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gorsel URL</Label>
                  <Input
                    value={slide.image_url}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        hero_slides: current.hero_slides.map((item, slideIndex) =>
                          slideIndex === index ? { ...item, image_url: e.target.value } : item
                        ),
                      }))
                    }
                  />
                  <Input type="file" accept="image/*" onChange={(e) => handleUpload(e, { slideIndex: index })} disabled={uploadingTarget === `slide-${index}`} />
                </div>
                <div className="space-y-2">
                  <Label>Alt Metin</Label>
                  <Input
                    value={slide.alt}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        hero_slides: current.hero_slides.map((item, slideIndex) =>
                          slideIndex === index ? { ...item, alt: e.target.value } : item
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Hero Avantaj Kartlari</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setForm((current) => ({
                ...current,
                hero_benefits: [...current.hero_benefits, { icon: "Truck", title: "", desc: "" }],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Kart Ekle
          </Button>
        </div>
        <div className="space-y-4">
          {form.hero_benefits.map((benefit, index) => (
            <Card key={`${benefit.title}-${index}`} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Kart {index + 1}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      hero_benefits: current.hero_benefits.filter((_, benefitIndex) => benefitIndex !== index),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Ikon</Label>
                  <Select
                    value={benefit.icon}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        hero_benefits: current.hero_benefits.map((item, benefitIndex) =>
                          benefitIndex === index ? { ...item, icon: value } : item
                        ),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {benefitIconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Baslik</Label>
                  <Input
                    value={benefit.title}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        hero_benefits: current.hero_benefits.map((item, benefitIndex) =>
                          benefitIndex === index ? { ...item, title: e.target.value } : item
                        ),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aciklama</Label>
                  <Input
                    value={benefit.desc}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        hero_benefits: current.hero_benefits.map((item, benefitIndex) =>
                          benefitIndex === index ? { ...item, desc: e.target.value } : item
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Kategori ve Kesfet Basliklari</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Kategoriler Basligi</Label>
            <Input
              value={form.category_section_title}
              onChange={(e) => setForm((current) => ({ ...current, category_section_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Kesfet Basligi</Label>
            <Input
              value={form.explore_section_title}
              onChange={(e) => setForm((current) => ({ ...current, explore_section_title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>One Cikan Urunler Basligi</Label>
            <Input
              value={form.featured_section_title}
              onChange={(e) => setForm((current) => ({ ...current, featured_section_title: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Kategori Aciklamasi</Label>
          <Textarea
            value={form.category_section_description}
            onChange={(e) => setForm((current) => ({ ...current, category_section_description: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>One Cikan CTA Metni</Label>
            <Input
              value={form.featured_section_cta_label}
              onChange={(e) => setForm((current) => ({ ...current, featured_section_cta_label: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>One Cikan CTA Linki</Label>
            <Input
              value={form.featured_section_cta_href}
              onChange={(e) => setForm((current) => ({ ...current, featured_section_cta_href: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving || Boolean(uploadingTarget)}>
        {saving ? "Kaydediliyor..." : "Tum Icerigi Kaydet"}
      </Button>
    </div>
  );
}
