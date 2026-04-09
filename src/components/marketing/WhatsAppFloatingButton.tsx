"use client";

import { MessageCircleMore } from "lucide-react";
import { useTrackMarketingEvent } from "@/hooks/use-marketing";
import { useLocation } from "@/lib/router";
import { buildWhatsAppHref } from "@/lib/marketing";
import { cn } from "@/lib/utils";

type WhatsAppFloatingButtonProps = {
  phone: string;
  message: string;
  helpText?: string;
  showHelpText?: boolean;
};

export function WhatsAppFloatingButton({ phone, message, helpText, showHelpText = true }: WhatsAppFloatingButtonProps) {
  const { mutate: trackMarketingEvent } = useTrackMarketingEvent();
  const { pathname } = useLocation();
  const href = buildWhatsAppHref(phone, message);
  const liftForCheckoutFlow = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  if (!phone.trim() || href === "#") {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex items-end gap-3 md:right-5",
        liftForCheckoutFlow ? "bottom-[calc(env(safe-area-inset-bottom)+6.75rem)] md:bottom-5" : "bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-5",
      )}
    >
      {showHelpText && helpText ? (
        <div className="hidden max-w-[220px] rounded-2xl border border-border/70 bg-background/95 px-4 py-3 text-sm text-foreground shadow-lg backdrop-blur md:block">
          {helpText}
        </div>
      ) : null}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_20px_50px_-24px_rgba(37,211,102,0.8)] transition-transform hover:scale-[1.03]"
        aria-label="WhatsApp destek hattini ac"
        onClick={() =>
          void trackMarketingEvent({
            eventType: "whatsapp_click",
            entityType: "whatsapp",
            pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
          })
        }
      >
        <MessageCircleMore className="h-6 w-6" />
      </a>
    </div>
  );
}
