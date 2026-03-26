"use client";

import { useMemo } from "react";
import { ACCOUNT_NAV_ITEMS } from "@/lib/account";
import { useLocation, useNavigate } from "@/lib/router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getActiveValue(pathname: string) {
  const activeItem = ACCOUNT_NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return activeItem?.href || "/account";
}

export function AccountMobileNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeValue = useMemo(() => getActiveValue(pathname), [pathname]);

  return (
    <div className="lg:hidden">
      <Select value={activeValue} onValueChange={(value) => navigate(value)}>
        <SelectTrigger className="h-11 rounded-2xl border-border/70">
          <SelectValue placeholder="Hesap bolumu secin" />
        </SelectTrigger>
        <SelectContent>
          {ACCOUNT_NAV_ITEMS.map((item) => (
            <SelectItem key={item.href} value={item.href}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
