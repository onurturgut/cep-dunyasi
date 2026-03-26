"use client";

type HeroSliderDotsProps = {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function HeroSliderDots({ total, activeIndex, onSelect }: HeroSliderDotsProps) {
  if (total < 2) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 md:justify-start">
      {Array.from({ length: total }, (_value, index) => (
        <button
          key={`campaign-dot-${index}`}
          type="button"
          aria-label={`${index + 1}. kampanyaya git`}
          onClick={() => onSelect(index)}
          className={`h-2.5 rounded-full transition-all duration-300 ${
            index === activeIndex ? "w-8 bg-primary" : "w-2.5 bg-border hover:bg-primary/50"
          }`}
        />
      ))}
    </div>
  );
}
