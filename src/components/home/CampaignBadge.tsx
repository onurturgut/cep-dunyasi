"use client";

import { cn } from "@/lib/utils";
import type { CampaignThemeVariant } from "@/lib/home-campaigns";

type CampaignBadgeProps = {
  children: string;
  themeVariant?: CampaignThemeVariant;
  className?: string;
};

const badgeThemeClasses: Record<CampaignThemeVariant, string> = {
  midnight: "border-white/15 bg-white/10 text-white",
  violet: "border-violet-300/20 bg-violet-300/15 text-violet-50",
  graphite: "border-slate-200/15 bg-slate-200/10 text-slate-50",
  emerald: "border-emerald-200/20 bg-emerald-300/15 text-emerald-50",
};

export function CampaignBadge({ children, themeVariant = "midnight", className }: CampaignBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] backdrop-blur-xl",
        badgeThemeClasses[themeVariant],
        className,
      )}
    >
      {children}
    </span>
  );
}
