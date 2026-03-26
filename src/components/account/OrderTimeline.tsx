"use client";

import { Check } from "lucide-react";
import type { OrderTimelineStep } from "@/lib/account";
import { cn } from "@/lib/utils";

export function OrderTimeline({ steps }: { steps: OrderTimelineStep[] }) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.45)]">
      <h3 className="font-display text-lg font-semibold text-foreground">Siparis Sureci</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.key} className="relative">
            {index < steps.length - 1 ? (
              <div className="absolute left-6 right-[-1rem] top-5 hidden h-px bg-border/70 md:block" />
            ) : null}
            <div className="flex items-start gap-3 md:block">
              <div
                className={cn(
                  "relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
                  step.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background text-muted-foreground",
                )}
              >
                {step.completed ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className="md:mt-3">
                <p className={cn("text-sm font-medium", step.active ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.completed ? "Tamamlandi" : "Bekleniyor"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
