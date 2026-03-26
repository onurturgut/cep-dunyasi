"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";

type CampaignCTAButtonProps = {
  to: string;
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export function CampaignCTAButton({ to, label, variant = "primary", className }: CampaignCTAButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      variant={variant === "primary" ? "default" : "outline"}
      className={cn(
        "rounded-full px-6 shadow-[0_14px_34px_rgba(15,23,42,0.22)] transition-transform duration-300 hover:-translate-y-0.5",
        variant === "primary"
          ? "bg-foreground text-background hover:bg-foreground/92 dark:bg-white dark:text-slate-950 dark:hover:bg-white/95"
          : "border-border/70 bg-card text-foreground hover:bg-background md:bg-background/75 dark:border-white/15 dark:bg-slate-900 dark:md:bg-white/5 dark:text-white dark:hover:bg-white/10",
        className,
      )}
    >
      <Link to={to}>
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}
