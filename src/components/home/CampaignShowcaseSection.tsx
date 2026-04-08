"use client";

import Image from "next/image";
import { useMemo } from "react";
import { CampaignBadge } from "@/components/home/CampaignBadge";
import { CampaignCTAButton } from "@/components/home/CampaignCTAButton";
import { useCampaigns } from "@/hooks/use-campaigns";
import { buildCampaignPromoCards, buildHeroCampaignSlides } from "@/lib/home-campaigns";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";

export function CampaignShowcaseSection() {
  const campaignsQuery = useCampaigns();
  const campaigns = useMemo(() => campaignsQuery.data ?? [], [campaignsQuery.data]);
  const heroSlides = useMemo(() => buildHeroCampaignSlides(campaigns), [campaigns]);
  const promoCards = useMemo(() => buildCampaignPromoCards(campaigns), [campaigns]);
  const featuredSlide = heroSlides[0];

  if (!featuredSlide) {
    return null;
  }

  return (
    <section id="campaign-showcase" className="relative overflow-hidden bg-background py-10 md:py-14">
      <div className="container relative">
        <div className="rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_42%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))] p-4 shadow-[0_24px_70px_-40px_rgba(148,163,184,0.5)] sm:p-6 lg:rounded-[2.5rem] lg:p-8 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] dark:shadow-[0_30px_80px_-40px_rgba(15,23,42,0.72)]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
            <div className="order-2 flex flex-col justify-center text-center lg:order-1 lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <span className="text-xs font-medium uppercase tracking-[0.32em] text-slate-500 dark:text-white/68">
                  Premium Campaigns
                </span>
                {featuredSlide.badgeText ? <CampaignBadge themeVariant={featuredSlide.themeVariant}>{featuredSlide.badgeText}</CampaignBadge> : null}
              </div>

              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                {featuredSlide.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base dark:text-white/78">
                {featuredSlide.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <CampaignCTAButton
                  to={featuredSlide.ctaLink}
                  label={featuredSlide.ctaText}
                  campaignId={featuredSlide.id}
                />
                <CampaignCTAButton
                  to={featuredSlide.ctaLink}
                  label="Tum Kampanyalar"
                  variant="secondary"
                  campaignId={featuredSlide.id}
                />
              </div>
            </div>

            <div className="order-1 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_44px_-30px_rgba(148,163,184,0.7)] dark:border-white/10 dark:bg-slate-900/80 dark:shadow-none lg:order-2">
              <div className="relative flex min-h-[16rem] items-center justify-center sm:min-h-[20rem] lg:min-h-[24rem]">
                <Image
                  src={getOptimizedImageUrl(featuredSlide.imageUrl, { kind: "campaign-banner" })}
                  alt={featuredSlide.title}
                  width={1000}
                  height={1000}
                  priority
                  sizes={getResponsiveImageSizes("campaign-banner")}
                  className="h-auto max-h-[14rem] w-auto max-w-full object-contain sm:max-h-[18rem] lg:max-h-[22rem]"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {promoCards.map((card) => (
              <article
                key={card.id}
                className="rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_40px_-30px_rgba(148,163,184,0.65)] dark:border-white/10 dark:bg-slate-900/72 dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-4">
                  {card.badgeText ? <CampaignBadge themeVariant={card.themeVariant}>{card.badgeText}</CampaignBadge> : <span />}
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-slate-200/70 bg-slate-50 px-4 py-6 dark:border-white/10 dark:bg-slate-950/60">
                  <Image
                    src={getOptimizedImageUrl(card.imageUrl, { kind: "campaign-banner" })}
                    alt={card.title}
                    width={640}
                    height={640}
                    sizes={getResponsiveImageSizes("campaign-banner")}
                    className="mx-auto h-auto max-h-44 w-auto object-contain"
                  />
                </div>

                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/75">
                  {card.description}
                </p>

                <div className="mt-5">
                  <CampaignCTAButton
                    to={card.ctaLink}
                    label={card.ctaText}
                    variant="secondary"
                    className="w-full justify-center sm:w-auto"
                    campaignId={card.id}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
