"use client";

import { Wrench } from "lucide-react";
import type { TechnicalServiceHistoryItem } from "@/lib/account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalServiceStatusBadge } from "@/components/account/TechnicalServiceStatusBadge";
import { formatDate } from "@/lib/date";

export function TechnicalServiceRequestCard({ request }: { request: TechnicalServiceHistoryItem }) {
  return (
    <Card className="rounded-[1.75rem] border-border/70 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/20 text-primary">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{request.phone_model}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(request.created_at)}</p>
          </div>
        </div>
        <TechnicalServiceStatusBadge status={request.status} />
      </CardHeader>
      <CardContent className="space-y-4 p-5 text-sm text-muted-foreground">
        <p className="leading-6">{request.issue_description}</p>
        {request.photo_url ? (
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <img src={request.photo_url} alt={request.photo_name || request.phone_model} className="h-44 w-full object-cover" />
          </div>
        ) : null}
        {request.admin_note ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-medium text-foreground">Servis notu</p>
            <p className="mt-2 leading-6">{request.admin_note}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
