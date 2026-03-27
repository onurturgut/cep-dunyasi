"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/lib/router";
import type { CorporatePageKey, CorporatePageListItem } from "@/types/corporate-page";

type CorporatePagesTableProps = {
  items: CorporatePageListItem[];
  selectedKey: CorporatePageKey | null;
  onSelect: (pageKey: CorporatePageKey) => void;
};

export function CorporatePagesTable({ items, selectedKey, onSelect }: CorporatePagesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kurumsal Sayfalar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-2xl border p-4 transition-colors ${
              selectedKey === item.key ? "border-primary bg-primary/5" : "border-border/70 bg-background/60"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">/{item.slug}</p>
              </div>
              <Badge variant={item.isPublished ? "default" : "secondary"}>{item.isPublished ? "Yayında" : "Taslak"}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant={selectedKey === item.key ? "default" : "outline"} onClick={() => onSelect(item.key)}>
                Düzenle
              </Button>
              <Link to={`/${item.slug}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground" target="_blank" rel="noreferrer">
                Önizlemeyi aç
              </Link>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Son güncelleme: {item.updatedAt ? new Date(item.updatedAt).toLocaleString("tr-TR") : "Varsayılan içerik"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

