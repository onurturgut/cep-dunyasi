"use client";

import { MessageCircleMore } from "lucide-react";
import { useTrackMarketingEvent } from "@/hooks/use-marketing";
import { buildWhatsAppHref } from "@/lib/marketing";

type WhatsAppFloatingButtonProps = {
  phone: string;
  message: string;
  helpText?: string;
  showHelpText?: boolean;
};

export function WhatsAppFloatingButton({ phone, message, helpText, showHelpText = true }: WhatsAppFloatingButtonProps) {
  const { mutate: trackMarketingEvent } = useTrackMarketingEvent();
  const href = buildWhatsAppHref(phone, message);

  if (!phone.trim() || href === "#") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-end gap-3">
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
