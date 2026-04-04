"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import type { MarketingSettingsRecord } from "@/lib/marketing";
import { postMarketingEventOnce } from "@/lib/marketing-events";

type LiveSupportProviderProps = {
  settings: MarketingSettingsRecord;
  visible: boolean;
};

export function LiveSupportProvider({ settings, visible }: LiveSupportProviderProps) {
  const trackedSupportViewIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.liveSupportEnabled || !visible || !settings.liveSupportProvider) {
      return;
    }

    const dedupeKey = `live-support:${settings.liveSupportProvider}:${typeof window !== "undefined" ? window.location.pathname : "/"}`;
    if (trackedSupportViewIdsRef.current.has(dedupeKey)) {
      return;
    }

    trackedSupportViewIdsRef.current.add(dedupeKey);

    void postMarketingEventOnce({
      eventType: "live_chat_open",
      entityType: "live_support",
      entityId: settings.liveSupportProvider,
      pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
    }, { dedupeKey, windowMs: 60_000 });
  }, [settings.liveSupportEnabled, settings.liveSupportProvider, visible]);

  if (!settings.liveSupportEnabled || !visible || !settings.liveSupportScriptUrl) {
    return null;
  }

  return (
    <Script
      id={`live-support-${settings.liveSupportProvider}`}
      src={settings.liveSupportScriptUrl}
      strategy="lazyOnload"
      data-widget-id={settings.liveSupportWidgetId ?? ""}
    />
  );
}
