"use client";

import { RotateCcw } from "lucide-react";
import type { ReturnRequestRecord } from "@/lib/account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReturnRequestStatusBadge } from "@/components/account/ReturnRequestStatusBadge";
import { formatDate } from "@/lib/date";

export function ReturnRequestCard({ request }: { request: ReturnRequestRecord }) {
  return (
    <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/20 text-primary">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{request.product_name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.request_type === "return" ? "İade Talebi" : "Değişim Talebi"} - {formatDate(request.created_at)}
            </p>
          </div>
        </div>
        <ReturnRequestStatusBadge status={request.status} />
      </CardHeader>
      <CardContent className="space-y-4 p-5 text-sm text-muted-foreground">
        {request.variant_info ? <p><span className="font-medium text-foreground">Model:</span> {request.variant_info}</p> : null}
        <p><span className="font-medium text-foreground">Neden:</span> {request.reason_code}</p>
        <p className="leading-6">{request.reason_text}</p>
        {request.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {request.images.map((imageUrl) => (
              <div key={imageUrl} className="overflow-hidden rounded-2xl border border-border/70">
                <img src={imageUrl} alt="Talep görseli" className="h-24 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
        {request.admin_note ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-medium text-foreground">Mağaza notu</p>
            <p className="mt-2 leading-6">{request.admin_note}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
