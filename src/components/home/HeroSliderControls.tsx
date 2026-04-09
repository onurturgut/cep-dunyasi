"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroSliderControlsProps = {
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
};

export function HeroSliderControls({ onPrevious, onNext, disabled = false }: HeroSliderControlsProps) {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full border-border/70 bg-background/85 shadow-sm backdrop-blur"
        onClick={onPrevious}
        disabled={disabled}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Önceki kampanya</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full border-border/70 bg-background/85 shadow-sm backdrop-blur"
        onClick={onNext}
        disabled={disabled}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Sonraki kampanya</span>
      </Button>
    </div>
  );
}

