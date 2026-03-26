"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AccountEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function AccountEmptyState({ icon: Icon, title, description, action, className }: AccountEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
