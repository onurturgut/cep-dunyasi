"use client";

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { useLocation } from '@/lib/router';

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {!pathname.startsWith('/admin') && !pathname.startsWith('/auth') ? <MarketingShell /> : null}
      {pathname === '/' && <Footer />}
    </div>
  );
}
