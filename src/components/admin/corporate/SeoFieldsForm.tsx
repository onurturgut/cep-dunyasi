"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SeoFieldsFormProps = {
  metaTitle: string;
  metaDescription: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
};

export function SeoFieldsForm({
  metaTitle,
  metaDescription,
  onMetaTitleChange,
  onMetaDescriptionChange,
}: SeoFieldsFormProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 p-4">
      <div>
        <h3 className="font-medium text-foreground">SEO Alanları</h3>
        <p className="text-sm text-muted-foreground">Title ve description alanları metadata üretiminde kullanılır.</p>
      </div>

      <div className="space-y-2">
        <Label>Meta başlık</Label>
        <Input value={metaTitle} onChange={(event) => onMetaTitleChange(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Meta açıklama</Label>
        <Textarea rows={4} value={metaDescription} onChange={(event) => onMetaDescriptionChange(event.target.value)} />
      </div>
    </div>
  );
}

