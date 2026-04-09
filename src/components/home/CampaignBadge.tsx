"use client";

import { cn } from "@/lib/utils";
import type { CampaignThemeVariant } from "@/lib/home-campaigns";

type CampaignBadgeProps = {
  children: string;
  themeVariant?: CampaignThemeVariant;
  className?: string;
};

const badgeThemeClasses: Record<CampaignThemeVariant, string> = {
  midnight: "border-border/70 bg-background/80 text-foreground dark:border-white/[0.1] dark:bg-white/[0.08] dark:text-slate-100",
  violet: "border-violet-300/30 bg-violet-100/70 text-violet-950 dark:border-violet-300/20 dark:bg-violet-300/15 dark:text-violet-50",
  graphite: "border-slate-300/35 bg-slate-100/80 text-slate-900 dark:border-slate-200/15 dark:bg-slate-200/10 dark:text-slate-50",
  emerald: "border-emerald-300/35 bg-emerald-100/75 text-emerald-950 dark:border-emerald-200/20 dark:bg-emerald-300/15 dark:text-emerald-50",
};

export function CampaignBadge({ children, themeVariant = "midnight", className }: CampaignBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] md:backdrop-blur-xl dark:bg-slate-900",
        badgeThemeClasses[themeVariant],
        className,
      )}
    >
      {children}
    </span>
  );
}
