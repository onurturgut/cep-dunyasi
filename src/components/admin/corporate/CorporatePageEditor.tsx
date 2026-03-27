"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SeoFieldsForm } from "@/components/admin/corporate/SeoFieldsForm";
import { ContactBlocksEditor } from "@/components/admin/corporate/ContactBlocksEditor";
import type { CorporatePageRecord, CorporatePageSection, CorporatePageUpsertInput } from "@/types/corporate-page";

type CorporatePageEditorProps = {
  value: CorporatePageRecord;
  saving: boolean;
  onChange: (next: CorporatePageRecord) => void;
  onSave: (payload: CorporatePageUpsertInput) => Promise<void>;
};

function createSection(): CorporatePageSection {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `section-${Date.now()}`,
    title: "",
    content: "",
    style: "card",
  };
}

export function CorporatePageEditor({ value, saving, onChange, onSave }: CorporatePageEditorProps) {
  return (
    <div className="space-y-5 rounded-3xl border border-border/70 bg-card/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{value.title}</h2>
          <p className="text-sm text-muted-foreground">/{value.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={value.isPublished} onCheckedChange={(checked) => onChange({ ...value, isPublished: checked })} />
            <span className="text-sm text-muted-foreground">Yayında</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={value.robotsNoindex} onCheckedChange={(checked) => onChange({ ...value, robotsNoindex: checked })} />
            <span className="text-sm text-muted-foreground">Noindex</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Sayfa başlığı</Label>
          <Input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Kısa özet</Label>
          <Textarea rows={3} value={value.summary} onChange={(event) => onChange({ ...value, summary: event.target.value })} />
        </div>
      </div>

      <SeoFieldsForm
        metaTitle={value.metaTitle}
        metaDescription={value.metaDescription}
        onMetaTitleChange={(next) => onChange({ ...value, metaTitle: next })}
        onMetaDescriptionChange={(next) => onChange({ ...value, metaDescription: next })}
      />

      <div className="space-y-2 rounded-2xl border border-border/70 p-4">
        <Label>Ana içerik</Label>
        <Textarea
          rows={16}
          value={value.content}
          onChange={(event) => onChange({ ...value, content: event.target.value })}
          placeholder="## Başlık ile bölüm oluşturabilir, satır başlarında - kullanarak madde listesi hazırlayabilirsiniz."
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-border/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-foreground">Yapısal Bölümler</h3>
            <p className="text-sm text-muted-foreground">Hakkımızda, iade ve teslimat gibi sayfalardaki öne çıkan bilgi kartları.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...value, sections: [...value.sections, createSection()] })}>
            Bölüm ekle
          </Button>
        </div>

        <div className="space-y-3">
          {value.sections.map((section, index) => (
            <div key={section.id} className="rounded-2xl border border-border/60 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bölüm başlığı</Label>
                  <Input
                    value={section.title}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        sections: value.sections.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: event.target.value } : item,
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stil</Label>
                  <Input
                    value={section.style}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        sections: value.sections.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, style: event.target.value === "default" ? "default" : "card" } : item,
                        ),
                      })
                    }
                    placeholder="card veya default"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Bölüm içeriği</Label>
                  <Textarea
                    rows={4}
                    value={section.content}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        sections: value.sections.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, content: event.target.value } : item,
                        ),
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onChange({ ...value, sections: value.sections.filter((item) => item.id !== section.id) })}
                >
                  Bölümü sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {value.key === "contact" ? (
        <ContactBlocksEditor blocks={value.contactBlocks} onChange={(blocks) => onChange({ ...value, contactBlocks: blocks })} />
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={saving}
          onClick={() =>
            void onSave({
              pageKey: value.key,
              title: value.title,
              metaTitle: value.metaTitle,
              metaDescription: value.metaDescription,
              summary: value.summary,
              content: value.content,
              sections: value.sections,
              contactBlocks: value.contactBlocks,
              faqItems: value.faqItems,
              isPublished: value.isPublished,
              robotsNoindex: value.robotsNoindex,
            })
          }
        >
          {saving ? "Kaydediliyor..." : "Sayfayı Kaydet"}
        </Button>
      </div>
    </div>
  );
}

