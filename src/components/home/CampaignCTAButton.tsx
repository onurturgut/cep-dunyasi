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
          ? "bg-white text-slate-950 hover:bg-white/95"
          : "border-white/15 bg-white/5 text-white hover:bg-white/10",
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
