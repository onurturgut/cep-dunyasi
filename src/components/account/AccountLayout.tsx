"use client";

import type { ReactNode } from "react";
import { Layout } from "@/components/layout/Layout";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountMobileNav } from "@/components/account/AccountMobileNav";

type AccountLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AccountLayout({ title, description, children, actions }: AccountLayoutProps) {
  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/15 p-6 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.5)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>

          <AccountMobileNav />
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <AccountSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </Layout>
  );
}
