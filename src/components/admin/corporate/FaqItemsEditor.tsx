"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteFaqItem, useUpsertFaqItem } from "@/hooks/use-corporate-pages";
import type { CorporateFaqItem } from "@/types/corporate-page";

type FaqItemsEditorProps = {
  items: CorporateFaqItem[];
};

function createFaqItem(): CorporateFaqItem {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `faq-${Date.now()}`,
    question: "",
    answer: "",
    category: null,
    order: 0,
    isActive: true,
  };
}

export function FaqItemsEditor({ items }: FaqItemsEditorProps) {
  const [drafts, setDrafts] = useState<CorporateFaqItem[]>(items);
  const upsertFaqItem = useUpsertFaqItem();
  const deleteFaqItem = useDeleteFaqItem();

  useEffect(() => {
    setDrafts(items);
  }, [items]);

  const sortedDrafts = useMemo(() => [...drafts].sort((left, right) => left.order - right.order), [drafts]);

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground">SSS Maddeleri</h3>
          <p className="text-sm text-muted-foreground">Soru, cevap, kategori ve sıralama alanlarını ayrı ayrı yönetebilirsiniz.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setDrafts((current) => [...current, createFaqItem()])}>
          Soru ekle
        </Button>
      </div>

      <div className="space-y-3">
        {sortedDrafts.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border/60 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Soru</Label>
                <Input
                  value={item.question}
                  onChange={(event) =>
                    setDrafts((current) => current.map((entry) => (entry.id === item.id ? { ...entry, question: event.target.value } : entry)))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cevap</Label>
                <Textarea
                  rows={4}
                  value={item.answer}
                  onChange={(event) =>
                    setDrafts((current) => current.map((entry) => (entry.id === item.id ? { ...entry, answer: event.target.value } : entry)))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input
                  value={item.category ?? ""}
                  onChange={(event) =>
                    setDrafts((current) => current.map((entry) => (entry.id === item.id ? { ...entry, category: event.target.value || null } : entry)))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sıra</Label>
                <Input
                  type="number"
                  min="0"
                  value={item.order}
                  onChange={(event) =>
                    setDrafts((current) => current.map((entry) => (entry.id === item.id ? { ...entry, order: Number(event.target.value) || 0 } : entry)))
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.isActive}
                  onCheckedChange={(checked) =>
                    setDrafts((current) => current.map((entry) => (entry.id === item.id ? { ...entry, isActive: checked } : entry)))
                  }
                />
                <span className="text-sm text-muted-foreground">Aktif</span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await upsertFaqItem.mutateAsync({ pageKey: "faq", item });
                      toast.success("SSS maddesi kaydedildi");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "SSS maddesi kaydedilemedi");
                    }
                  }}
                >
                  Kaydet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={async () => {
                    try {
                      if (items.some((entry) => entry.id === item.id)) {
                        await deleteFaqItem.mutateAsync({ pageKey: "faq", id: item.id });
                      }
                      setDrafts((current) => current.filter((entry) => entry.id !== item.id));
                      toast.success("SSS maddesi silindi");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "SSS maddesi silinemedi");
                    }
                  }}
                >
                  Sil
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
