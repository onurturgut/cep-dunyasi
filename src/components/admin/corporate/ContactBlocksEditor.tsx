"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CorporateContactBlock } from "@/types/corporate-page";

type ContactBlocksEditorProps = {
  blocks: CorporateContactBlock[];
  onChange: (blocks: CorporateContactBlock[]) => void;
};

function createBlock(): CorporateContactBlock {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `contact-${Date.now()}`,
    label: "",
    value: "",
    href: null,
    icon: null,
    description: null,
  };
}

export function ContactBlocksEditor({ blocks, onChange }: ContactBlocksEditorProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground">İletişim Blokları</h3>
          <p className="text-sm text-muted-foreground">Telefon, e-posta, adres ve benzeri bloklar burada yönetilir.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...blocks, createBlock()])}>
          Blok ekle
        </Button>
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-2xl border border-border/60 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Etiket</Label>
                <Input
                  value={block.label}
                  onChange={(event) =>
                    onChange(blocks.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value } : item)))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Gösterilen değer</Label>
                <Input
                  value={block.value}
                  onChange={(event) =>
                    onChange(blocks.map((item, itemIndex) => (itemIndex === index ? { ...item, value: event.target.value } : item)))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bağlantı</Label>
                <Input
                  value={block.href ?? ""}
                  onChange={(event) =>
                    onChange(blocks.map((item, itemIndex) => (itemIndex === index ? { ...item, href: event.target.value || null } : item)))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>İkon</Label>
                <Input
                  value={block.icon ?? ""}
                  onChange={(event) =>
                    onChange(blocks.map((item, itemIndex) => (itemIndex === index ? { ...item, icon: event.target.value || null } : item)))
                  }
                  placeholder="phone, mail, map-pin, clock"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Açıklama</Label>
                <Input
                  value={block.description ?? ""}
                  onChange={(event) =>
                    onChange(blocks.map((item, itemIndex) => (itemIndex === index ? { ...item, description: event.target.value || null } : item)))
                  }
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}>
                Bloğu sil
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

