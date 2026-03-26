"use client";

import { ACCOUNT_NAV_ITEMS } from "@/lib/account";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  return href === "/account" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-[1.75rem] border border-border/70 bg-card p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
        <nav className="space-y-1">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  active ? "bg-foreground text-background" : "text-foreground/80 hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
