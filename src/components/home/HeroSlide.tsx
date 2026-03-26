"use client";

import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";
import type { CampaignRecord } from "@/lib/campaigns";
import { getCampaignBadgeStyle } from "@/lib/campaigns";

type HeroSlideProps = {
  campaign: CampaignRecord;
  priority?: boolean;
};

export const HeroSlide = memo(function HeroSlide({ campaign, priority = false }: HeroSlideProps) {
  const badgeStyle = getCampaignBadgeStyle(campaign.badgeColor);
  const badgeText = campaign.badgeText?.trim();
  const ctaText = campaign.ctaText?.trim();
  const ctaLink = campaign.ctaLink?.trim();
  const description = campaign.description?.trim();
  const subtitle = campaign.subtitle?.trim();

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/95 text-card-foreground shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(255,255,255,0.2)_36%,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_36%,transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/5" />
      <div className="absolute -left-12 top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-4rem] right-[-2rem] h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative grid min-h-[28rem] gap-8 px-6 py-8 sm:px-8 md:px-10 lg:min-h-[34rem] lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center lg:px-12 lg:py-12 xl:px-14">
        <div className="order-2 flex flex-col items-center justify-center text-center lg:order-1 lg:items-start lg:pr-6 lg:text-left">
          {badgeText ? (
            <span
              className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] shadow-sm"
              style={badgeStyle}
            >
              {badgeText}
            </span>
          ) : null}

          {subtitle ? <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/80">{subtitle}</p> : null}

          <h2 className="mt-3 max-w-[14ch] font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl xl:text-6xl">
            {campaign.title}
          </h2>

          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base lg:max-w-xl">
              {description}
            </p>
          ) : null}

          {ctaText && ctaLink ? (
            <div className="mt-8">
              <Button asChild size="lg" className="min-w-[11rem] rounded-full px-7 shadow-[0_16px_38px_rgba(190,24,93,0.18)]">
                <Link to={ctaLink}>
                  {ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="order-1 flex min-h-[18rem] items-center justify-center lg:order-2 lg:min-h-[28rem]">
          <picture className="block w-full">
            {campaign.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={campaign.mobileImageUrl} /> : null}
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              className="mx-auto max-h-[22rem] w-auto max-w-full object-contain drop-shadow-[0_30px_70px_rgba(15,23,42,0.18)] transition-transform duration-700 ease-out hover:scale-[1.02] sm:max-h-[25rem] lg:max-h-[32rem]"
            />
          </picture>
        </div>
      </div>
    </article>
  );
});
