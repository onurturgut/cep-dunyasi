"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MarketingPopupRecord } from "@/lib/marketing";
import { postMarketingEvent, postMarketingEventOnce } from "@/lib/marketing-events";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";
import { Link } from "@/lib/router";

type PromoPopupManagerProps = {
  popups: MarketingPopupRecord[];
  pathname: string;
};

function getStorageKey(popupId: string) {
  return `cep-dunyasi-popup:${popupId}`;
}

export function PromoPopupManager({ popups, pathname }: PromoPopupManagerProps) {
  const [visiblePopupId, setVisiblePopupId] = useState<string | null>(null);
  const trackedPopupViewIdsRef = useRef<Set<string>>(new Set());
  const popup = useMemo(() => popups.find((item) => item.id === visiblePopupId) ?? null, [popups, visiblePopupId]);
  const isMobile = useIsMobile();

  const showPopup = useCallback(
    (nextPopup: MarketingPopupRecord) => {
      setVisiblePopupId(nextPopup.id);

      if (trackedPopupViewIdsRef.current.has(nextPopup.id)) {
        return;
      }

      trackedPopupViewIdsRef.current.add(nextPopup.id);
      void postMarketingEventOnce(
        {
          eventType: "popup_view",
          entityType: "popup",
          entityId: nextPopup.id,
          pagePath: pathname,
        },
        {
          dedupeKey: `popup-view:${pathname}:${nextPopup.id}`,
          windowMs: 60_000,
        },
      );
    },
    [pathname],
  );

  useEffect(() => {
    if (popups.length === 0) {
      setVisiblePopupId(null);
      return;
    }

    const delayPopup = popups.find((item) => item.triggerType === "delay");
    if (!delayPopup) {
      return;
    }

    if (delayPopup.showOncePerSession && window.sessionStorage.getItem(getStorageKey(delayPopup.id))) {
      return;
    }

    const timer = window.setTimeout(() => {
      showPopup(delayPopup);
    }, delayPopup.delaySeconds * 1000);

    return () => window.clearTimeout(timer);
  }, [pathname, popups, showPopup]);

  useEffect(() => {
    const scrollPopup = popups.find((item) => item.triggerType === "scroll");
    if (!scrollPopup) {
      return;
    }

    const onScroll = () => {
      if (visiblePopupId) {
        return;
      }

      if (scrollPopup.showOncePerSession && window.sessionStorage.getItem(getStorageKey(scrollPopup.id))) {
        return;
      }

      const scrolled = (window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= scrollPopup.scrollPercent) {
        showPopup(scrollPopup);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, popups, showPopup, visiblePopupId]);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const exitPopup = popups.find((item) => item.triggerType === "exit_intent");
    if (!exitPopup) {
      return;
    }

    const onMouseLeave = (event: MouseEvent) => {
      if (visiblePopupId || event.clientY > 16) {
        return;
      }

      if (exitPopup.showOncePerSession && window.sessionStorage.getItem(getStorageKey(exitPopup.id))) {
        return;
      }

      showPopup(exitPopup);
    };

    document.addEventListener("mouseout", onMouseLeave);
    return () => document.removeEventListener("mouseout", onMouseLeave);
  }, [isMobile, pathname, popups, showPopup, visiblePopupId]);

  if (!popup) {
    return null;
  }

  const isExternalLink = Boolean(popup.ctaLink && /^https?:\/\//i.test(popup.ctaLink));

  const closePopup = () => {
    if (popup.showOncePerSession) {
      window.sessionStorage.setItem(getStorageKey(popup.id), "1");
    }

    void postMarketingEvent({
      eventType: "popup_close",
      entityType: "popup",
      entityId: popup.id,
      pagePath: pathname,
    });
    setVisiblePopupId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 md:items-center">
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-background shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)] md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <button
          type="button"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90"
          onClick={closePopup}
          aria-label="Popup kapat"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8">
          {popup.badgeText ? (
            <span className="inline-flex rounded-full border border-border/70 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              {popup.badgeText}
            </span>
          ) : null}
          <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">{popup.title}</h3>
          {popup.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{popup.description}</p> : null}
          {popup.ctaText && popup.ctaLink ? (
            <Button
              asChild
              className="mt-6 rounded-full"
              onClick={() => {
                void postMarketingEvent({
                  eventType: "popup_cta_click",
                  entityType: "popup",
                  entityId: popup.id,
                  pagePath: pathname,
                });
                if (popup.showOncePerSession) {
                  window.sessionStorage.setItem(getStorageKey(popup.id), "1");
                }
              }}
            >
              {isExternalLink ? (
                <a href={popup.ctaLink} target="_blank" rel="noreferrer">
                  {popup.ctaText}
                </a>
              ) : (
                <Link to={popup.ctaLink}>{popup.ctaText}</Link>
              )}
            </Button>
          ) : null}
        </div>

        <div className="relative min-h-[240px] bg-muted/30">
          <Image
            src={getOptimizedImageUrl(popup.mobileImageUrl || popup.imageUrl, { kind: "campaign-banner" })}
            alt={popup.title}
            fill
            sizes={getResponsiveImageSizes("campaign-banner")}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
