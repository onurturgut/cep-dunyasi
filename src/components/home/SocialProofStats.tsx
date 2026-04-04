"use client";

import { motion } from "framer-motion";
import { PackageCheck, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import type { SocialProofItemRecord } from "@/lib/marketing";

const iconMap = {
  Users,
  PackageCheck,
  Star,
  Sparkles,
  ShieldCheck,
} as const;

type SocialProofStatsProps = {
  items: SocialProofItemRecord[];
};

export function SocialProofStats({ items }: SocialProofStatsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="relative py-6 md:py-10" id="social-proof">
      <div className="container">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] ?? ShieldCheck;

            return (
              <motion.article
                key={item.id}
                className="rounded-[1.75rem] border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
                {item.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
