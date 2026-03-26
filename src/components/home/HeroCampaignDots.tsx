"use client";

type HeroCampaignDotsProps = {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function HeroCampaignDots({ total, activeIndex, onSelect }: HeroCampaignDotsProps) {
  if (total < 2) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 md:justify-start">
      {Array.from({ length: total }, (_value, index) => (
        <button
          key={`hero-campaign-dot-${index}`}
          type="button"
          aria-label={`${index + 1}. kampanyaya git`}
          onClick={() => onSelect(index)}
          className={`rounded-full transition-all duration-300 ${index === activeIndex ? "h-2.5 w-9 bg-white" : "h-2.5 w-2.5 bg-white/30 hover:bg-white/55"}`}
        />
      ))}
    </div>
  );
}
