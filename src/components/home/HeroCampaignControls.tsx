"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroCampaignControlsProps = {
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
};

export function HeroCampaignControls({ onPrevious, onNext, disabled = false }: HeroCampaignControlsProps) {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-11 w-11 rounded-full border-border/70 bg-background/75 text-foreground shadow-[0_10px_25px_rgba(15,23,42,0.12)] backdrop-blur-xl hover:bg-background dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_10px_25px_rgba(15,23,42,0.25)] dark:hover:bg-white/10"
        onClick={onPrevious}
        disabled={disabled}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Önceki kampanya</span>
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-11 w-11 rounded-full border-border/70 bg-background/75 text-foreground shadow-[0_10px_25px_rgba(15,23,42,0.12)] backdrop-blur-xl hover:bg-background dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-[0_10px_25px_rgba(15,23,42,0.25)] dark:hover:bg-white/10"
        onClick={onNext}
        disabled={disabled}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Sonraki kampanya</span>
      </Button>
    </div>
  );
}

