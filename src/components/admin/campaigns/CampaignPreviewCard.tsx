"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CampaignFormValues } from "@/lib/campaigns";
import { getCampaignBadgeStyle } from "@/lib/campaigns";

type CampaignPreviewCardProps = {
  value: CampaignFormValues;
};

export function CampaignPreviewCard({ value }: CampaignPreviewCardProps) {
  const badgeStyle = getCampaignBadgeStyle(value.badgeColor);

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <CardContent className="space-y-4 p-4">
        <div className="relative overflow-hidden rounded-[1.25rem] border border-border/60 bg-gradient-to-br from-background via-background to-primary/5 p-4">
          {value.badgeText ? (
            <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={badgeStyle}>
              {value.badgeText}
            </span>
          ) : null}
          <div className="grid gap-5 pt-8 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
            <div className="space-y-3">
              {value.subtitle ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">{value.subtitle}</p> : null}
              <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {value.title || "Kampanya basligi"}
              </h3>
              <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                {value.description || "Kampanya aciklamasi burada gorunecek."}
              </p>
              {value.ctaText ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {value.ctaText}
                </Badge>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-[1.25rem] border border-border/60 bg-background">
              {value.imageUrl ? (
                <img
                  src={value.mobileImageUrl || value.imageUrl}
                  alt={value.title || "Kampanya görseli"}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-44 items-center justify-center bg-muted/60 text-sm text-muted-foreground">
                  Görsel onizlemesi
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border/60 px-3 py-2">
            <p className="font-medium text-foreground">Durum</p>
            <p>{value.isActive ? "Yayinda" : "Taslak"}</p>
          </div>
          <div className="rounded-xl border border-border/60 px-3 py-2">
            <p className="font-medium text-foreground">Sira</p>
            <p>{value.order}</p>
          </div>
          <div className="rounded-xl border border-border/60 px-3 py-2">
            <p className="font-medium text-foreground">Mobil</p>
            <p>{value.mobileImageUrl ? "Ayrik görsel var" : "Ana görsel kullanilir"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

