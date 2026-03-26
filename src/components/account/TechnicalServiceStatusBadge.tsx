"use client";

import { Badge } from "@/components/ui/badge";
import { TECHNICAL_SERVICE_STATUS_LABELS } from "@/lib/account";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  new: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  reviewing: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  repairing: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700",
  ready: "border-primary/20 bg-primary/10 text-primary",
  delivered: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
};

export function TechnicalServiceStatusBadge({ status }: { status: string }) {
  const normalized = `${status || "new"}`.trim().toLowerCase();

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        toneMap[normalized] || "border-border/70 bg-muted/30 text-foreground/80",
      )}
    >
      {TECHNICAL_SERVICE_STATUS_LABELS[normalized] || status}
    </Badge>
  );
}
