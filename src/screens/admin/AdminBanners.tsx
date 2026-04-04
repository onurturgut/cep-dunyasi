"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBanners, useCreateBanner, useDeleteBanner } from "@/hooks/use-admin";
import { BANNER_PLACEMENT_LABELS, BANNER_PLACEMENTS, type BannerCampaignRecord } from "@/lib/admin";

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
  themeVariant: string;
  triggerType: "delay" | "scroll" | "exit_intent";
  triggerDelaySeconds: number;
  triggerScrollPercent: number;
  showOncePerSession: boolean;
  targetPaths: string;
  audience: "all" | "guest" | "authenticated";
  startAt: string;
  endAt: string;
  isActive: boolean;
  sortOrder: number;
};

type BannerStatusFilter = "all" | "active" | "inactive" | "scheduled" | "popup";
type BannerPlacementFilter = "all" | BannerCampaignRecord["placement"];
const EMPTY_BANNERS: BannerCampaignRecord[] = [];

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
  themeVariant: "",
  triggerType: "delay",
  triggerDelaySeconds: 4,
  triggerScrollPercent: 40,
  showOncePerSession: true,
  targetPaths: "",
  audience: "all",
  startAt: "",
  endAt: "",
  isActive: true,
  sortOrder: 0,
};

const placementHints: Record<BannerCampaignRecord["placement"], string> = {
  home_hero: "Ust vitrinde buyuk etki icin kullan.",
  home_campaign: "Hero altindaki destek kampanyalari icin idealdir.",
  category: "Kategoriye ozel mesaj veya marka vurgusu icin kullan.",
  popup: "Nazik bir popup akisi icin tetikleyiciyi dikkatli sec.",
  promo_badge: "Kisa, vurucu rozet tipi mesajlar icin uygundur.",
};

const triggerLabels: Record<BannerFormState["triggerType"], string> = {
  delay: "Gecikmeli",
  scroll: "Scroll sonrasi",
  exit_intent: "Cikis niyeti",
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

function toDateTimeValue(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function bannerToFormState(banner: BannerCampaignRecord): BannerFormState {
  return {
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
    themeVariant: banner.themeVariant ?? "",
    triggerType: banner.triggerType ?? "delay",
    triggerDelaySeconds: banner.triggerDelaySeconds ?? 4,
    triggerScrollPercent: banner.triggerScrollPercent ?? 40,
    showOncePerSession: banner.showOncePerSession !== false,
    targetPaths: Array.isArray(banner.targetPaths) ? banner.targetPaths.join(", ") : "",
    audience: banner.audience ?? "all",
    startAt: toDateTimeValue(banner.startAt),
    endAt: toDateTimeValue(banner.endAt),
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
  };
}

function formToPayload(form: BannerFormState) {
  return {
    ...form,
    targetPaths: form.targetPaths
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function bannerToPayload(banner: BannerCampaignRecord, overrides?: Partial<ReturnType<typeof formToPayload>>) {
  return {
    ...formToPayload(bannerToFormState(banner)),
    ...overrides,
  };
}

function resolveCampaignState(banner: Pick<BannerCampaignRecord, "isActive" | "startAt" | "endAt">) {
  if (!banner.isActive) {
    return "inactive" as const;
  }

  const now = Date.now();
  const startsAt = banner.startAt ? new Date(banner.startAt).getTime() : null;
  const endsAt = banner.endAt ? new Date(banner.endAt).getTime() : null;

  if (startsAt !== null && Number.isFinite(startsAt) && startsAt > now) {
    return "scheduled" as const;
  }

  if (endsAt !== null && Number.isFinite(endsAt) && endsAt < now) {
    return "inactive" as const;
  }

  return "active" as const;
}

function matchesStatusFilter(banner: BannerCampaignRecord, filter: BannerStatusFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "popup") {
    return banner.placement === "popup";
  }

  return resolveCampaignState(banner) === filter;
}

function resolvePreviewSurface(themeVariant: string) {
  const normalized = themeVariant.trim().toLowerCase();
  if (normalized.includes("emerald") || normalized.includes("green")) {
    return "from-emerald-500/90 via-emerald-400/60 to-slate-950";
  }
  if (normalized.includes("graphite") || normalized.includes("stone")) {
    return "from-slate-700 via-slate-800 to-slate-950";
  }
  if (normalized.includes("sunset") || normalized.includes("orange")) {
    return "from-orange-500/90 via-rose-400/70 to-slate-950";
  }
  return "from-slate-950 via-slate-900 to-slate-800";
}

function formatCampaignWindow(startAt: string | null, endAt: string | null) {
  if (!startAt && !endAt) {
    return "Tarih kisiti yok";
  }

  const startLabel = startAt ? new Date(startAt).toLocaleDateString("tr-TR") : "Hemen";
  const endLabel = endAt ? new Date(endAt).toLocaleDateString("tr-TR") : "Sinirsiz";
  return `${startLabel} - ${endLabel}`;
}

function PreviewBadge({ children }: { children: string }) {
  return <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/85">{children}</span>;
}

function CampaignPreview({ form }: { form: BannerFormState }) {
  const previewImage = form.mobileImageUrl || form.imageUrl;
  const surfaceClasses = resolvePreviewSurface(form.themeVariant);

  const commonCopy = (
    <>
      {form.badgeText ? <PreviewBadge>{form.badgeText}</PreviewBadge> : null}
      <div className="space-y-2">
        <h3 className="max-w-md text-xl font-semibold text-white">{form.title || "Kampanya basligi burada gorunur"}</h3>
        {form.subtitle ? <p className="text-sm font-medium text-white/80">{form.subtitle}</p> : null}
        <p className="max-w-md text-sm leading-6 text-white/70">{form.description || "Aciklama alani bos ise burada kampanya metni icin temiz bir alan kalir."}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950">{form.ctaLabel || "Kampanyayi Incele"}</span>
        {form.ctaHref ? <span className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/75">{form.ctaHref}</span> : null}
      </div>
    </>
  );

  if (form.placement === "popup") {
    return (
      <div className="rounded-[28px] border border-border/70 bg-slate-950 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between text-xs text-white/60">
          <span>Popup gorunumu</span>
          <span>{triggerLabels[form.triggerType]}</span>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-background">
          {previewImage ? <img src={previewImage} alt={form.title || "Popup preview"} className="h-40 w-full object-cover" /> : null}
          <div className="space-y-4 p-5">
            {form.badgeText ? <Badge className="rounded-full">{form.badgeText}</Badge> : null}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{form.title || "Popup basligi"}</h3>
              <p className="text-sm text-muted-foreground">{form.description || "Popup metni burada kisa ve net bir sekilde gorunur."}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              {form.targetPaths ? `Hedef sayfalar: ${form.targetPaths}` : "Tum sayfalarda gorunur"}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                {form.ctaLabel || "Kampanyayi Ac"}
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Daha Sonra
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (form.placement === "promo_badge") {
    return (
      <div className={`rounded-[28px] border border-border/70 bg-gradient-to-br ${surfaceClasses} p-6 shadow-2xl`}>
        <div className="flex flex-wrap gap-2">
          <PreviewBadge>{form.badgeText || "Bugune ozel"}</PreviewBadge>
          <PreviewBadge>{BANNER_PLACEMENT_LABELS[form.placement]}</PreviewBadge>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="space-y-3">{commonCopy}</div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right text-xs text-white/80 md:block">
            <div>Siralama #{form.sortOrder}</div>
            <div>{form.isActive ? "Yayina hazir" : "Taslak"}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br ${surfaceClasses} shadow-2xl`}>
      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 p-6 md:p-8">{commonCopy}</div>
        <div className="relative min-h-[220px] bg-black/10">
          {previewImage ? (
            <img src={previewImage} alt={form.title || "Kampanya gorseli"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-white/60">Gorsel secildiginde burada onizleme gorunur</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const [form, setForm] = useState<BannerFormState>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BannerStatusFilter>("all");
  const [placementFilter, setPlacementFilter] = useState<BannerPlacementFilter>("all");
  const bannersQuery = useBanners();
  const saveBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const banners = bannersQuery.data ?? EMPTY_BANNERS;

  const filteredBanners = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return banners.filter((banner) => {
      if (!matchesStatusFilter(banner, statusFilter)) {
        return false;
      }

      if (placementFilter !== "all" && banner.placement !== placementFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [banner.title, banner.subtitle, banner.description, banner.badgeText, banner.ctaLabel, banner.ctaHref]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [banners, placementFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = banners.filter((banner) => resolveCampaignState(banner) === "active").length;
    const popupCount = banners.filter((banner) => banner.placement === "popup").length;
    const scheduledCount = banners.filter((banner) => resolveCampaignState(banner) === "scheduled").length;
    return { total: banners.length, activeCount, popupCount, scheduledCount };
  }, [banners]);

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

  const handleReset = () => {
    setForm(defaultForm);
  };

  const handleDuplicateDraft = () => {
    setForm((current) => ({
      ...current,
      id: undefined,
      title: current.title.trim() ? `${current.title} Kopya` : current.title,
    }));
    toast.success("Mevcut kampanya kopya taslagi olarak hazirlandi");
  };

  const handleEdit = (banner: BannerCampaignRecord) => {
    setForm(bannerToFormState(banner));
  };

  const handleCloneFromCard = (banner: BannerCampaignRecord) => {
    setForm({
      ...bannerToFormState(banner),
      id: undefined,
      title: banner.title.trim() ? `${banner.title} Kopya` : banner.title,
    });
    toast.success("Kopya kampanya taslagi acildi");
  };

  const handleQuickToggle = async (banner: BannerCampaignRecord) => {
    await saveBanner.mutateAsync(
      bannerToPayload(banner, {
        isActive: !banner.isActive,
      }),
    );
    toast.success(banner.isActive ? "Kampanya pasife alindi" : "Kampanya yayina alindi");
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Kampanya basligi zorunlu");
      return;
    }

    if (!form.imageUrl.trim()) {
      toast.error("En az bir ana gorsel secmelisin");
      return;
    }

    await saveBanner.mutateAsync(formToPayload(form));
    toast.success(form.id ? "Kampanya guncellendi" : "Kampanya olusturuldu");
    setForm(defaultForm);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold">Banner ve Kampanyalar</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Kampanyalari teknik tablo yerine editoryal bir akisla yonet. Icerigi duzenle, canli onizlemede gor, sonra yayina al.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="space-y-1 p-4"><p className="text-sm text-muted-foreground">Toplam kampanya</p><p className="text-2xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="space-y-1 p-4"><p className="text-sm text-muted-foreground">Yayinda olan</p><p className="text-2xl font-semibold">{stats.activeCount}</p></CardContent></Card>
        <Card><CardContent className="space-y-1 p-4"><p className="text-sm text-muted-foreground">Popup kampanyalar</p><p className="text-2xl font-semibold">{stats.popupCount}</p></CardContent></Card>
        <Card><CardContent className="space-y-1 p-4"><p className="text-sm text-muted-foreground">Planli yayin</p><p className="text-2xl font-semibold">{stats.scheduledCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <div className="space-y-2">
            <Label>Kampanya ara</Label>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Baslik, rozet, CTA veya aciklama ile ara" />
          </div>
          <div className="space-y-2">
            <Label>Durum</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BannerStatusFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum kampanyalar</SelectItem>
                <SelectItem value="active">Yayinda</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
                <SelectItem value="scheduled">Planli</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Yerlesim</Label>
            <Select value={placementFilter} onValueChange={(value) => setPlacementFilter(value as BannerPlacementFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum yerlesimler</SelectItem>
                {BANNER_PLACEMENTS.map((placement) => (
                  <SelectItem key={placement} value={placement}>{BANNER_PLACEMENT_LABELS[placement]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" variant="outline" onClick={handleReset}>Yeni kampanya ac</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{form.id ? "Kampanya editoru" : "Yeni kampanya olustur"}</CardTitle>
              <p className="text-sm text-muted-foreground">{placementHints[form.placement]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.id ? <Button variant="outline" onClick={handleDuplicateDraft}>Kopyalayarak yeni olustur</Button> : null}
              <Button variant="outline" onClick={handleReset}>Formu temizle</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Yerlesim</Label>
                <Select value={form.placement} onValueChange={(value) => setForm((current) => ({ ...current, placement: value as BannerCampaignRecord["placement"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_PLACEMENTS.map((placement) => (
                      <SelectItem key={placement} value={placement}>{BANNER_PLACEMENT_LABELS[placement]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hedef kitle</Label>
                <Select value={form.audience} onValueChange={(value) => setForm((current) => ({ ...current, audience: value as BannerFormState["audience"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tum kullanici</SelectItem>
                    <SelectItem value="guest">Sadece misafir</SelectItem>
                    <SelectItem value="authenticated">Sadece giris yapmis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Siralama</Label>
                <Input type="number" min="0" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))} />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div><p className="font-medium">Icerik</p><p className="text-sm text-muted-foreground">Baslik, rozet ve mesaj tarafini hizla duzenle.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Baslik</Label>
                  <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ornek: Yeni sezon kiliflerde premium secim" />
                </div>
                <div className="space-y-2">
                  <Label>Alt baslik</Label>
                  <Input value={form.subtitle} onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))} placeholder="Kisa destekleyici mesaj" />
                </div>
                <div className="space-y-2">
                  <Label>Rozet</Label>
                  <Input value={form.badgeText} onChange={(event) => setForm((current) => ({ ...current, badgeText: event.target.value }))} placeholder="Sinirli sure / Yeni / Firsat" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aciklama</Label>
                <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Kampanyanin neden dikkat cekici oldugunu anlat." />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div><p className="font-medium">Gorseller</p><p className="text-sm text-muted-foreground">Desktop ve mobil yuzeyler icin gorselleri ayri yonet.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ana gorsel</Label>
                  <Input type="file" accept="image/*" onChange={(event) => void handleImageUpload(event, "imageUrl")} disabled={uploading} />
                  {form.imageUrl ? <img src={form.imageUrl} alt="Banner" className="h-36 w-full rounded-xl object-cover" /> : <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-border/70 text-sm text-muted-foreground">Desktop gorsel sec</div>}
                </div>
                <div className="space-y-2">
                  <Label>Mobil gorsel</Label>
                  <Input type="file" accept="image/*" onChange={(event) => void handleImageUpload(event, "mobileImageUrl")} disabled={uploading} />
                  {form.mobileImageUrl ? <img src={form.mobileImageUrl} alt="Mobil banner" className="h-36 w-full rounded-xl object-cover" /> : <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-border/70 text-sm text-muted-foreground">Istersen mobil icin ozel gorsel sec</div>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tema varyanti</Label>
                <Input value={form.themeVariant} onChange={(event) => setForm((current) => ({ ...current, themeVariant: event.target.value }))} placeholder="midnight / graphite / emerald / sunset" />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div><p className="font-medium">CTA ve hedef</p><p className="text-sm text-muted-foreground">Kullaniciyi nereye goturecegini ve buton dilini netlestir.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CTA metni</Label>
                  <Input value={form.ctaLabel} onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))} placeholder="Hemen incele" />
                </div>
                <div className="space-y-2">
                  <Label>CTA linki</Label>
                  <Input value={form.ctaHref} onChange={(event) => setForm((current) => ({ ...current, ctaHref: event.target.value }))} placeholder="/products?campaign=yeni-sezon" />
                </div>
              </div>
            </div>

            {form.placement === "popup" ? (
              <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div><p className="font-medium">Popup davranisi</p><p className="text-sm text-muted-foreground">Popup deneyimini rahatsiz etmeyecek sekilde ayarla.</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tetikleyici</Label>
                    <Select value={form.triggerType} onValueChange={(value) => setForm((current) => ({ ...current, triggerType: value as BannerFormState["triggerType"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delay">Gecikmeli</SelectItem>
                        <SelectItem value="scroll">Scroll sonrasi</SelectItem>
                        <SelectItem value="exit_intent">Exit intent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hedef yollar</Label>
                    <Input value={form.targetPaths} onChange={(event) => setForm((current) => ({ ...current, targetPaths: event.target.value }))} placeholder="/, /products, /product/iphone-16-pro" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gecikme (sn)</Label>
                    <Input type="number" min="0" max="120" value={form.triggerDelaySeconds} onChange={(event) => setForm((current) => ({ ...current, triggerDelaySeconds: Number(event.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Scroll yuzdesi</Label>
                    <Input type="number" min="0" max="100" value={form.triggerScrollPercent} onChange={(event) => setForm((current) => ({ ...current, triggerScrollPercent: Number(event.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3">
                  <div>
                    <p className="font-medium">Oturum basina bir kez goster</p>
                    <p className="text-sm text-muted-foreground">Kullanici ayni popup ile arka arkaya rahatsiz edilmesin.</p>
                  </div>
                  <Switch checked={form.showOncePerSession} onCheckedChange={(checked) => setForm((current) => ({ ...current, showOncePerSession: checked }))} />
                </div>
              </div>
            ) : null}

            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div><p className="font-medium">Yayinlama</p><p className="text-sm text-muted-foreground">Planli kampanyalar icin tarih araligi ve durumunu belirle.</p></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Baslangic tarihi</Label>
                  <Input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Bitis tarihi</Label>
                  <Input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3">
                <div>
                  <p className="font-medium">Yayinda</p>
                  <p className="text-sm text-muted-foreground">Pasif oldugunda tarih araliginda olsa bile yayinlanmaz.</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row">
              <Button className="sm:flex-1" onClick={() => void handleSubmit()} disabled={saveBanner.isPending || uploading}>
                {form.id ? "Degisiklikleri kaydet" : "Kampanyayi kaydet"}
              </Button>
              {form.id ? <Button className="sm:flex-1" variant="outline" onClick={handleDuplicateDraft} disabled={saveBanner.isPending}>Kopyalayarak yeni olustur</Button> : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Canli onizleme</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <CampaignPreview form={form} />
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2"><span>Yerlesim</span><span className="font-medium text-foreground">{BANNER_PLACEMENT_LABELS[form.placement]}</span></div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2"><span>Durum</span><span className="font-medium text-foreground">{form.isActive ? "Yayina hazir" : "Taslak"}</span></div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2"><span>Tarih</span><span className="font-medium text-foreground">{formatCampaignWindow(form.startAt || null, form.endAt || null)}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Hizli notlar</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Hero kampanyalarda kisa baslik ve tek bir net CTA en iyi sonucu verir.</p>
              <p>Popup kullaniyorsan sadece gercekten guclu tekliflerde acik tutman daha saglikli olur.</p>
              <p>Mobil gorseli ayrica yuklersen daha dengeli bir deneyim elde edersin.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Mevcut kampanyalar</CardTitle>
            <p className="text-sm text-muted-foreground">{filteredBanners.length} kayit listeleniyor. Duzenle, kopyala veya hizlica yayina alip kapat.</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredBanners.map((banner) => {
              const state = resolveCampaignState(banner);
              return (
                <Card key={banner.id} className="border-border/70">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold">{banner.title}</p>
                        <p className="text-sm text-muted-foreground">{BANNER_PLACEMENT_LABELS[banner.placement]}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={state === "active" ? "default" : "secondary"}>{state === "active" ? "Yayinda" : state === "scheduled" ? "Planli" : "Pasif"}</Badge>
                        {banner.placement === "popup" ? <Badge variant="outline">Popup</Badge> : null}
                      </div>
                    </div>

                    <img src={banner.imageUrl} alt={banner.title} className="h-44 w-full rounded-xl object-cover" />

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/70 px-2.5 py-1">{formatCampaignWindow(banner.startAt, banner.endAt)}</span>
                      <span className="rounded-full border border-border/70 px-2.5 py-1">Sira #{banner.sortOrder}</span>
                      {banner.ctaLabel ? <span className="rounded-full border border-border/70 px-2.5 py-1">{banner.ctaLabel}</span> : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => handleEdit(banner)}>Duzenle</Button>
                      <Button variant="outline" className="flex-1" onClick={() => handleCloneFromCard(banner)}>Kopyala</Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => void handleQuickToggle(banner)} disabled={saveBanner.isPending}>
                        {banner.isActive ? "Pasife al" : "Yayina al"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={async () => {
                          await deleteBanner.mutateAsync(banner.id);
                          toast.success("Banner silindi");
                          if (form.id === banner.id) {
                            setForm(defaultForm);
                          }
                        }}
                        disabled={deleteBanner.isPending}
                      >
                        Sil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredBanners.length === 0 ? <div className="rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center text-sm text-muted-foreground xl:col-span-2">Secili filtrelerle eslesen kampanya bulunamadi.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
