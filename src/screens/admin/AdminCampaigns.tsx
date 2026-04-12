"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, RefreshCcw, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { CampaignForm } from "@/components/admin/campaigns/CampaignForm";
import { CampaignPreviewCard } from "@/components/admin/campaigns/CampaignPreviewCard";
import { CampaignTable } from "@/components/admin/campaigns/CampaignTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { resizeImageForUpload, type UploadImagePreset } from "@/lib/client-image";
import {
  defaultCampaignFormValues,
  toCampaignFormValues,
  type CampaignCategoryOption,
  type CampaignFormValues,
  type CampaignRecord,
} from "@/lib/campaigns";
import { useAdminCampaigns, useCreateCampaign, useDeleteCampaign, useReorderCampaigns, useUpdateCampaign } from "@/hooks/use-campaigns";

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
};

type AdminCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parent_category_id?: string | null;
};

async function uploadCampaignImage(file: File, preset: UploadImagePreset) {
  const preparedFile = await resizeImageForUpload(file, preset);
  const body = new FormData();
  body.append("file", preparedFile);
  body.append("kind", "image");
  body.append("scope", "site-content");

  const response = await fetch("/api/upload", { method: "POST", body });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || "Kampanya görseli yüklenemedi");
  }

  return `${payload?.data?.url ?? ""}`;
}

function idsAreEqual(left: CampaignRecord[], right: CampaignRecord[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((campaign, index) => campaign.id === right[index]?.id);
}

export default function AdminCampaigns() {
  const campaignsQuery = useAdminCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const reorderCampaigns = useReorderCampaigns();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CampaignFormValues>(defaultCampaignFormValues);
  const [orderedCampaigns, setOrderedCampaigns] = useState<CampaignRecord[]>([]);
  const [categories, setCategories] = useState<CampaignCategoryOption[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (campaignsQuery.data) {
      setOrderedCampaigns(campaignsQuery.data);
    }
  }, [campaignsQuery.data]);

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/categories", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as ApiResponse<AdminCategoryRecord[]> | null;

        if (!response.ok || payload?.error) {
          throw new Error(payload?.error?.message || "Kampanya hedef kategorileri alinamadi");
        }

        if (!mounted) {
          return;
        }

        setCategories(
          (payload?.data ?? []).map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            parentCategoryId: category.parent_category_id ?? null,
          })),
        );
      } catch (error) {
        if (mounted) {
          console.error(error);
        }
      }
    };

    void fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  const hasOrderChanges = useMemo(() => {
    if (!campaignsQuery.data) {
      return false;
    }

    return !idsAreEqual(campaignsQuery.data, orderedCampaigns);
  }, [campaignsQuery.data, orderedCampaigns]);

  const openCreateDialog = () => {
    const nextOrder = (orderedCampaigns.at(-1)?.order ?? orderedCampaigns.length) + 1;
    setForm({ ...defaultCampaignFormValues, order: nextOrder });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (form.id) {
        await updateCampaign.mutateAsync(form);
        toast.success("Kampanya güncellendi");
      } else {
        await createCampaign.mutateAsync(form);
        toast.success("Kampanya oluşturuldu");
      }
      setDialogOpen(false);
      setForm(defaultCampaignFormValues);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kampanya kaydedilemedi");
    }
  };

  const handleImageUpload = async (field: "imageUrl" | "mobileImageUrl", file: File) => {
    try {
      setUploading(true);
      const preset = field === "imageUrl" ? "campaign-main" : "campaign-mobile";
      const url = await uploadCampaignImage(file, preset);
      setForm((current) => ({ ...current, [field]: url }));
      toast.success("öörsel yuklendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "öörsel yuklenemedi");
    } finally {
      setUploading(false);
    }
  };

  const handleDropOnCampaign = (targetId: string) => {
    setOrderedCampaigns((current) => {
      if (!draggingId || draggingId === targetId) {
        return current;
      }

      const sourceIndex = current.findIndex((campaign) => campaign.id === draggingId);
      const targetIndex = current.findIndex((campaign) => campaign.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      return next.map((campaign, index) => ({ ...campaign, order: index }));
    });
    setDraggingId(null);
  };

  const handleToggleActive = async (campaign: CampaignRecord) => {
    try {
      setTogglingId(campaign.id);
      await updateCampaign.mutateAsync({
        ...toCampaignFormValues(campaign),
        isActive: !campaign.isActive,
      });
      toast.success(!campaign.isActive ? "Kampanya aktif edildi" : "Kampanya pasife alindi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kampanya durumu güncellenemedi");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (campaign: CampaignRecord) => {
    const confirmed = window.confirm(`"${campaign.title}" kampanyasını silmek istiyor musunuz?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteCampaign.mutateAsync(campaign.id);
      toast.success("Kampanya silindi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kampanya silinemedi");
    }
  };

  const handleSaveOrder = async () => {
    try {
      await reorderCampaigns.mutateAsync(orderedCampaigns.map((campaign) => campaign.id));
      toast.success("Kampanya sirasi kaydedildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kampanya sirasi kaydedilemedi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary/70">Hero Carousel</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Campaign Slider Yönetimi</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Ana sayfanın en üstünde çıkan premium hero slider kampanyalarını buradan yönetin. Sürükle-bırak ile sıra değiştirin,
            tarih planlayın ve mobil görsel atayın. İlk 3 aktif kampanya aynı zamanda ana sayfadaki kampanya kartlarını da besler.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {hasOrderChanges ? (
            <Button type="button" variant="outline" onClick={() => void handleSaveOrder()} disabled={reorderCampaigns.isPending}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Siralamayi Kaydet
            </Button>
          ) : null}
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kampanya
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/95 shadow-sm">
          <CardContent className="p-5">
            {campaignsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            ) : orderedCampaigns.length > 0 ? (
              <CampaignTable
                campaigns={orderedCampaigns}
                draggingId={draggingId}
                onDragStart={setDraggingId}
                onDropOn={handleDropOnCampaign}
                onDragEnd={() => setDraggingId(null)}
                onEdit={(campaign) => {
                  setForm(toCampaignFormValues(campaign));
                  setDialogOpen(true);
                }}
                onDelete={(campaign) => void handleDelete(campaign)}
                onToggleActive={(campaign) => void handleToggleActive(campaign)}
                togglingId={togglingId}
              />
            ) : (
              <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-muted/20 px-6 text-center">
                <ImagePlus className="h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Hero slider henüz boş</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  İlk kampanyayı eklediğinde ana sayfa hero alanı otomatik olarak slider formatına geçecek.
                </p>
                <Button className="mt-5" onClick={openCreateDialog}>
                  <WandSparkles className="mr-2 h-4 w-4" />
                  İlk kampanyayı oluştur
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <CampaignPreviewCard value={form} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-none p-0 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:max-w-6xl">
          <div className="rounded-[1.75rem] bg-background p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-display text-2xl">
                {form.id ? "Kampanyayi Düzenle" : "Yeni Hero Kampanyasi"}
              </DialogTitle>
            </DialogHeader>
            <CampaignForm
              categories={categories}
              value={form}
              uploading={uploading}
              submitting={createCampaign.isPending || updateCampaign.isPending}
              onChange={setForm}
              onSubmit={handleSave}
              onImageUpload={handleImageUpload}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


