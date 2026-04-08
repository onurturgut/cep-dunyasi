"use client";

import { FormEvent, useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { MarketingSettingsRecord } from "@/lib/marketing";
import { useNewsletterSubscribe, useTrackMarketingEvent } from "@/hooks/use-marketing";

type NewsletterInlineCardProps = {
  settings: MarketingSettingsRecord;
  source?: "homepage-inline" | "footer" | "popup";
};

export function NewsletterInlineCard({ settings, source = "homepage-inline" }: NewsletterInlineCardProps) {
  const newsletterMutation = useNewsletterSubscribe();
  const { mutate: trackMarketingEvent } = useTrackMarketingEvent();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(true);

  if (!settings.newsletterEnabled) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const result = await newsletterMutation.mutateAsync({
        email,
        firstName,
        source,
        consentNewsletter: consent,
        consentKvkk: consent,
      });

      void trackMarketingEvent({
        eventType: "newsletter_subscribe",
        entityType: "newsletter",
        entityId: result.subscriber.id,
        pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
        metadata: {
          source,
          isNew: result.isNew,
        },
      });

      toast.success(settings.newsletterSuccessMessage);
      setEmail("");
      setFirstName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kayit tamamlanamadi");
    }
  };

  return (
    <section className="relative py-8 md:py-12" id="newsletter-inline">
      <div className="container">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_42%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))] p-6 text-slate-900 shadow-[0_30px_70px_-44px_rgba(148,163,184,0.55)] sm:p-8 dark:border-border/70 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_40%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] dark:text-white dark:shadow-[0_30px_70px_-44px_rgba(15,23,42,0.72)]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/75 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-600 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Newsletter
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{settings.newsletterTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base dark:text-white/72">{settings.newsletterDescription}</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[1.75rem] border border-slate-300/80 bg-white/78 p-5 shadow-[0_18px_40px_-28px_rgba(148,163,184,0.7)] backdrop-blur-xl dark:border-white/12 dark:bg-white/8 dark:shadow-none"
            >
              <div className="space-y-3">
                <Input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Adiniz"
                  className="border-slate-300/80 bg-white text-slate-900 placeholder:text-slate-500 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="E-posta adresiniz"
                  required
                  className="border-slate-300/80 bg-white text-slate-900 placeholder:text-slate-500 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50"
                />
                <label className="flex items-start gap-3 text-xs leading-5 text-slate-600 dark:text-white/70">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(Boolean(checked))}
                    className="mt-0.5 border-slate-400/80 data-[state=checked]:border-primary dark:border-white/30"
                  />
                  <span>{settings.newsletterConsentLabel}</span>
                </label>
                <Button type="submit" className="w-full rounded-full" disabled={newsletterMutation.isPending}>
                  <Mail className="mr-2 h-4 w-4" />
                  Kaydol
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
