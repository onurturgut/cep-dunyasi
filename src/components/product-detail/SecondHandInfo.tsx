"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getBatteryHealthBucketLabel,
  getSecondHandCheckStatusLabel,
  getSecondHandConditionLabel,
  getSecondHandWarrantyLabel,
  maskSensitiveCode,
  normalizeSecondHandDetails,
  type SecondHandDetails,
} from "@/lib/second-hand";

type SecondHandInfoProps = {
  details?: SecondHandDetails | null;
};

function buildRows(details: SecondHandDetails) {
  return [
    { label: "Kondisyon", value: getSecondHandConditionLabel(details.condition) || "-" },
    { label: "Pil Sağlığı", value: details.battery_health != null ? `%${details.battery_health}` : "-" },
    {
      label: "Garanti",
      value: getSecondHandWarrantyLabel(details.warranty_type, details.warranty_remaining_months) || "-",
    },
    { label: "Face ID", value: getSecondHandCheckStatusLabel(details.face_id_status) || "-" },
    { label: "True Tone", value: getSecondHandCheckStatusLabel(details.true_tone_status) || "-" },
    {
      label: "Batarya Durumu",
      value: details.battery_changed == null ? "-" : details.battery_changed ? "Değişim görülüyor" : "Orijinal görünüyor",
    },
    { label: "Kutusu", value: details.includes_box ? "Var" : "Yok" },
    { label: "Faturası", value: details.includes_invoice ? "Var" : "Yok" },
    { label: "IMEI Takibi", value: maskSensitiveCode(details.imei) || "-" },
    { label: "Seri No", value: maskSensitiveCode(details.serial_number) || "-" },
  ];
}

export function SecondHandInfo({ details }: SecondHandInfoProps) {
  const normalized = normalizeSecondHandDetails(details);

  if (!normalized) {
    return null;
  }

  const rows = buildRows(normalized);
  const batteryBucketLabel = getBatteryHealthBucketLabel(normalized.battery_health);

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">2. El Cihaz Durumu</h2>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Bu cihaz için kondisyon, pil sağlığı, donanım kontrolleri ve ekspertiz özeti aşağıda sunulur.
        </p>
      </div>

      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/15 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.42)]">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-2">
            {getSecondHandConditionLabel(normalized.condition) ? (
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-primary-foreground">
                {getSecondHandConditionLabel(normalized.condition)}
              </Badge>
            ) : null}
            {batteryBucketLabel ? (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Pil {batteryBucketLabel}
              </Badge>
            ) : null}
            {normalized.includes_box ? <Badge variant="secondary">Kutulu</Badge> : null}
            {normalized.includes_invoice ? <Badge variant="secondary">Faturalı</Badge> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-border/70 bg-background/65 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{row.label}</div>
                <div className="mt-2 text-sm font-medium text-foreground">{row.value}</div>
              </div>
            ))}
          </div>

          {normalized.included_accessories.length > 0 ? (
            <>
              <Separator className="bg-border/60" />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Dahil Aksesuarlar</h3>
                <div className="flex flex-wrap gap-2">
                  {normalized.included_accessories.map((item) => (
                    <Badge key={item} variant="outline" className="rounded-full">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {normalized.changed_parts.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Değişen Parçalar</h3>
              <div className="flex flex-wrap gap-2">
                {normalized.changed_parts.map((item) => (
                  <Badge key={item} variant="outline" className="rounded-full border-amber-500/30 bg-amber-500/5 text-amber-700">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {normalized.cosmetic_notes ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Kozmetik Durum</h3>
              <p className="text-sm leading-7 text-muted-foreground">{normalized.cosmetic_notes}</p>
            </div>
          ) : null}

          {normalized.inspection_summary ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Ekspertiz Özeti</h3>
              <p className="text-sm leading-7 text-muted-foreground">{normalized.inspection_summary}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
