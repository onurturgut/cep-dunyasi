"use client";

import { useEffect, useState } from "react";
import { Clock3, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDeliveryEstimate, type DeliveryEstimateInfo } from "@/lib/product-detail";

type DeliveryEstimateProps = {
  stock: number;
};

export function DeliveryEstimate({ stock }: DeliveryEstimateProps) {
  const [estimate, setEstimate] = useState<DeliveryEstimateInfo | null>(null);

  useEffect(() => {
    setEstimate(buildDeliveryEstimate({ stock }));
  }, [stock]);

  if (!estimate) {
    return <Skeleton className="h-28 w-full rounded-3xl" />;
  }

  return (
    <Card className="border-border/70 bg-gradient-to-br from-white to-muted/20 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">Teslimat Bilgisi</div>
            <p className="text-sm leading-6 text-muted-foreground">{estimate.primary}</p>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {estimate.badge}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Truck className="h-4 w-4 text-primary" />
              {estimate.shippingWindow}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{estimate.secondary}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {estimate.isPreorder ? <Clock3 className="h-4 w-4 text-primary" /> : <PackageCheck className="h-4 w-4 text-primary" />}
              {estimate.deliveryWindow}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Ucretsiz ve guvenli kargo secenekleri sepet adiminda netlestirilir.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
