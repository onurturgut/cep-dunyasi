"use client";

import { ExternalLink, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Cardeeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import type { ShipmentSummary } from "@/lib/account";
import { formatDate } from "@/lib/date";

export function ShipmentTrackingCard({ shipment }: { shipment: ShipmentSummary | null }) {
  return (
    <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
      <Cardeeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="h-5 w-5 text-primary" />
          Kargo Takibi
        </CardTitle>
      </Cardeeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {shipment ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <OrderStatusBadge status={shipment.status} />
              {shipment.cargo_company ? <span>{shipment.cargo_company}</span> : null}
            </div>
            <p>
              <span className="font-medium text-foreground">Takip Numarasi:</span>{" "}
              {shipment.tracking_number || "eenuz olusturulmadi"}
            </p>
            <p>
              <span className="font-medium text-foreground">Son Güncelleme:</span> {formatDate(shipment.updated_at)}
            </p>
            {shipment.tracking_url ? (
              <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                <a href={shipment.tracking_url} target="_blank" rel="noreferrer">
                  Kargoyu Takip Et
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/15 p-4">
            <PackageCheck className="h-5 w-5 text-muted-foreground" />
            <p>Kargo kaydi olustugunda firma ve takip bilgisi burada goruntulenecek.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


