"use client";

import { Badge } from "@/components/ui/badge";
import { RETURN_STATUS_LABELS, type ReturnRequestStatus } from "@/lib/account";
import { cn } from "@/lib/utils";

const toneMap: Record<ReturnRequestStatus, string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  approved: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  rejected: "border-destructive/20 bg-destructive/10 text-destructive",
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
};

export function ReturnRequestStatusBadge({ status }: { status: ReturnRequestStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs font-medium", toneMap[status])}>
      {RETURN_STATUS_LABELS[status]}
    </Badge>
  );
}
