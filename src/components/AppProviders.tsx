"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useState } from "react";
import { LocaleProvider } from "@/i18n/provider";
import type { AppLocale } from "@/i18n/config";

export function AppProviders({ children, initialLocale }: { children: React.ReactNode; initialLocale: AppLocale }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>{children}</AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </LocaleProvider>
  );
}
