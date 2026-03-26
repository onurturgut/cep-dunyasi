"use client";

import { useMemo, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { MyOrderItemDetail, ReturnRequestType } from "@/lib/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReturnRequest } from "@/hooks/use-account";

const MAX_RETURN_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;

const reasonOptions = [
  { value: "wrong-product", label: "Yanlis urun geldi" },
  { value: "defective", label: "Urun arizali / hasarli" },
  { value: "changed-mind", label: "Vazgectim" },
  { value: "size-fit", label: "Uyumsuz / beklentiyi karsilamadi" },
  { value: "other", label: "Diger" },
] as const;

type ReturnRequestFormProps = {
  orderId: string;
  items: MyOrderItemDetail[];
  initialOrderItemId?: string | null;
  onSuccess?: () => void;
};

export function ReturnRequestForm({ orderId, items, initialOrderItemId, onSuccess }: ReturnRequestFormProps) {
  const createReturnRequest = useCreateReturnRequest();
  const [orderItemId, setOrderItemId] = useState(initialOrderItemId || items[0]?.id || "");
  const [requestType, setRequestType] = useState<ReturnRequestType>("return");
  const [reasonCode, setReasonCode] = useState<string>(reasonOptions[0].value);
  const [reasonText, setReasonText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const selectedItem = useMemo(() => items.find((item) => item.id === orderItemId) ?? items[0] ?? null, [items, orderItemId]);

  const handleUpload = async (files: FileList | null) => {
    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    if (images.length + selectedFiles.length > 4) {
      toast.error("En fazla 4 gorsel ekleyebilirsiniz.");
      return;
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        toast.error("Sadece gorsel dosyasi yukleyebilirsiniz.");
        return;
      }

      if (file.size > MAX_RETURN_IMAGE_SIZE_BYTES) {
        toast.error("Her gorsel en fazla 6MB olabilir.");
        return;
      }
    }

    try {
      setUploading(true);
      const uploadedUrls = await Promise.all(
        selectedFiles.map(async (file) => {
          const body = new FormData();
          body.append("file", file);
          body.append("kind", "image");
          body.append("scope", "returns");

          const response = await fetch("/api/upload", {
            method: "POST",
            body,
          });

          const payload = await response.json().catch(() => null);
          if (!response.ok || payload?.error) {
            throw new Error(payload?.error?.message || "Gorsel yuklenemedi");
          }

          return `${payload?.data?.url ?? ""}`.trim();
        }),
      );

      setImages((current) => Array.from(new Set([...current, ...uploadedUrls.filter(Boolean)])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gorsel yukleme hatasi");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedItem) {
      toast.error("Talep olusturmak icin uygun urun bulunamadi.");
      return;
    }

    try {
      await createReturnRequest.mutateAsync({
        orderId,
        orderItemId: selectedItem.id,
        requestType,
        reasonCode,
        reasonText,
        images,
      });

      toast.success("Talebiniz alindi. Inceleme tamamlandiginda hesabiniz uzerinden bilgilendirileceksiniz.");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Talep olusturulamadi");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>Urun</Label>
        <Select value={orderItemId} onValueChange={setOrderItemId}>
          <SelectTrigger className="rounded-2xl border-border/70">
            <SelectValue placeholder="Urun secin" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.product_name}
                {item.variant_info ? ` - ${item.variant_info}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Talep Turu</Label>
          <Select value={requestType} onValueChange={(value: ReturnRequestType) => setRequestType(value)}>
            <SelectTrigger className="rounded-2xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="return">Iade</SelectItem>
              <SelectItem value="exchange">Degisim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Neden</Label>
          <Select value={reasonCode} onValueChange={setReasonCode}>
            <SelectTrigger className="rounded-2xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reasonOptions.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="return-reason-text">Aciklama</Label>
        <Textarea
          id="return-reason-text"
          value={reasonText}
          onChange={(event) => setReasonText(event.target.value)}
          placeholder="Sorunu veya iade gerekcenizi detaylandirin"
          minLength={5}
          maxLength={1500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="return-images">Destekleyici Gorseller</Label>
        <Input id="return-images" type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => void handleUpload(event.target.files)} />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((imageUrl) => (
            <div key={imageUrl} className="relative overflow-hidden rounded-2xl border border-border/70">
              <img src={imageUrl} alt="Talep gorseli" className="h-24 w-full object-cover" />
              <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2 h-7 w-7" onClick={() => setImages((current) => current.filter((url) => url !== imageUrl))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Talebinizi desteklemek icin en fazla 4 gorsel ekleyebilirsiniz.
          </div>
        </div>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={createReturnRequest.isPending || uploading || reasonText.trim().length < 5}>
        {createReturnRequest.isPending || uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gonderiliyor
          </>
        ) : (
          "Talebi Olustur"
        )}
      </Button>
    </form>
  );
}
