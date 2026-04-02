"use client";

import { useMemo } from "react";
import { ACCOUNT_NAV_ITEMS } from "@/lib/account";
import { useLocation, useNavigate } from "@/lib/router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/provider";

function isActivePath(pathname: string, href: string) {
  return href === "/account" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveValue(pathname: string) {
  const activeItem = ACCOUNT_NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
  return activeItem?.href || "/account/profile";
}

export function AccountMobileNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { messages } = useI18n();
  const activeValue = useMemo(() => getActiveValue(pathname), [pathname]);

  return (
    <div className="lg:hidden">
      <Select value={activeValue} onValueChange={(value) => navigate(value)}>
        <SelectTrigger className="h-11 rounded-2xl border-border/70">
          <SelectValue placeholder={messages.account.mobileNavPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {ACCOUNT_NAV_ITEMS.map((item) => (
            <SelectItem key={item.href} value={item.href}>
              {messages.account.nav[item.key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
