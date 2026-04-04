"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@/lib/router";
import { useMarketingSettings } from "@/hooks/use-marketing";
import { LiveSupportProvider } from "@/components/marketing/LiveSupportProvider";
import { PromoPopupManager } from "@/components/marketing/PromoPopupManager";
import { WhatsAppFloatingButton } from "@/components/marketing/WhatsAppFloatingButton";

export function MarketingShell() {
  const { pathname } = useLocation();
  const marketingQuery = useMarketingSettings(pathname);
  const marketing = marketingQuery.data;
  const settings = marketing?.settings;
  const popups = marketing?.popups ?? [];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const canShowWhatsApp = useMemo(() => {
    if (!settings?.whatsappEnabled) {
      return false;
    }

    return isMobile ? settings.whatsappShowOnMobile : settings.whatsappShowOnDesktop;
  }, [isMobile, settings]);

  const canShowLiveSupport = useMemo(() => {
    if (!settings?.liveSupportEnabled) {
      return false;
    }

    return isMobile ? settings.liveSupportShowOnMobile : settings.liveSupportShowOnDesktop;
  }, [isMobile, settings]);

  if (!settings) {
    return null;
  }

  return (
    <>
      <PromoPopupManager popups={popups} pathname={pathname} />
      {canShowWhatsApp ? (
        <WhatsAppFloatingButton
          phone={settings.whatsappPhone}
          message={settings.whatsappMessage}
          helpText={settings.whatsappHelpText}
          showHelpText={!canShowLiveSupport}
        />
      ) : null}
      <LiveSupportProvider settings={settings} visible={canShowLiveSupport} />
    </>
  );
}
