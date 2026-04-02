"use client";

import { CalendarDays, FileText, ImageIcon, Wrench } from "lucide-react";
import type { TechnicalServiceHistoryItem } from "@/lib/account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalServiceStatusBadge } from "@/components/account/TechnicalServiceStatusBadge";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/date";

export function TechnicalServiceRequestCard({ request }: { request: TechnicalServiceHistoryItem }) {
  const { locale, messages } = useI18n();
  const technicalServiceMessages = messages.account.technicalService.requestCard;

  return (
    <Card className="h-full rounded-[1.75rem] border-border/70 bg-background/95 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-1">
      <CardHeader className="space-y-4 border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/20 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{technicalServiceMessages.recordLabel}</p>
              <CardTitle className="mt-1 line-clamp-1 text-base">{request.phone_model}</CardTitle>
            </div>
          </div>
          <TechnicalServiceStatusBadge status={request.status} />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{formatDate(request.created_at, locale)}</span>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4 p-5 text-sm text-muted-foreground">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{technicalServiceMessages.issueSummary}</p>
          <p className="line-clamp-3 min-h-[4.5rem] leading-6 text-foreground/80">{request.issue_description}</p>
        </div>

        {request.photo_url ? (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/10">
            <img src={request.photo_url} alt={request.photo_name || request.phone_model} className="aspect-[4/3] w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-auto grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>{technicalServiceMessages.image}</span>
            </div>
            <p className="mt-1 font-medium text-foreground">{request.photo_url ? technicalServiceMessages.uploaded : technicalServiceMessages.none}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>{technicalServiceMessages.serviceNote}</span>
            </div>
            <p className="mt-1 font-medium text-foreground">{request.admin_note ? technicalServiceMessages.available : technicalServiceMessages.pending}</p>
          </div>
        </div>

        {request.admin_note ? (
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">{technicalServiceMessages.latestNote}</p>
            <p className="mt-2 line-clamp-3 leading-6 text-foreground/80">{request.admin_note}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
