"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Heart, Menu, Moon, Search, ShoppingCart, Sun, User } from "lucide-react";
import { Link, useNavigate } from "@/lib/router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/provider";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Telefonlar", href: "/products?category=telefon" },
  { label: "2. El Telefonlar", href: "/products?category=ikinci-el-telefon" },
  { label: "Saatler", href: "/products?category=akilli-saatler" },
  { label: "Kiliflar", href: "/products?category=kilif" },
  { label: "Sarj Aleti", href: "/products?category=sarj-aleti" },
  { label: "Power Bank", href: "/products?category=power-bank" },
  { label: "Teknik Servis", href: "/technical-service" },
];

const megaMenuData = {
  telefonlar: {
    label: "Telefonlar",
    href: "/products?category=telefon",
    columns: [
      {
        title: "Apple Modelleri",
        items: [
          { label: "Apple", href: "/products?category=telefon" },
          { label: "Samsung", href: "/products?category=telefon" },
          { label: "Xiaomi", href: "/products?category=telefon" },
          { label: "Huawei", href: "/products?category=telefon" },
        ],
      },
      {
        title: "Populer Modeller",
        items: [
          { label: "iPhone 15", href: "/products?category=telefon" },
          { label: "iPhone 14", href: "/products?category=telefon" },
          { label: "Galaxy S24", href: "/products?category=telefon" },
          { label: "Redmi Note 13", href: "/products?category=telefon" },
        ],
      },
      {
        title: "Seriler",
        items: [
          { label: "Pro Serisi", href: "/products?category=telefon" },
          { label: "Max Serisi", href: "/products?category=telefon" },
          { label: "Ultra Serisi", href: "/products?category=telefon" },
          { label: "A Serisi", href: "/products?category=telefon" },
        ],
      },
    ],
  },
  ikinciElTelefonlar: {
    label: "2. El Telefonlar",
    href: "/products?category=ikinci-el-telefon",
    columns: [
      {
        title: "Markalar",
        items: [
          { label: "Apple", href: "/products?category=ikinci-el-telefon" },
          { label: "iPhone 15 Serisi", href: "/products?category=ikinci-el-telefon" },
          { label: "iPhone 14 Serisi", href: "/products?category=ikinci-el-telefon" },
          { label: "iPhone 13 Serisi", href: "/products?category=ikinci-el-telefon" },
        ],
      },
      {
        title: "Populer Modeller",
        items: [
          { label: "iPhone 15", href: "/products?category=ikinci-el-telefon" },
          { label: "iPhone 14", href: "/products?category=ikinci-el-telefon" },
          { label: "iPhone 13", href: "/products?category=ikinci-el-telefon" },
          { label: "iPhone 12", href: "/products?category=ikinci-el-telefon" },
        ],
      },
      {
        title: "Durum",
        items: [
          { label: "Cok Iyi", href: "/products?category=ikinci-el-telefon" },
          { label: "Iyi", href: "/products?category=ikinci-el-telefon" },
          { label: "Pil Sagligi Yuksek", href: "/products?category=ikinci-el-telefon" },
          { label: "Garantili Secimler", href: "/products?category=ikinci-el-telefon" },
        ],
      },
    ],
  },
  saatler: {
    label: "Saatler",
    href: "/products?category=akilli-saatler",
    columns: [
      {
        title: "Apple Watch Modelleri",
        items: [
          { label: "Apple Watch Series 9", href: "/products?category=akilli-saatler" },
          { label: "Apple Watch Ultra 2", href: "/products?category=akilli-saatler" },
          { label: "Apple Watch SE", href: "/products?category=akilli-saatler" },
        ],
      },
      {
        title: "Samsung Watch Modelleri",
        items: [
          { label: "Galaxy Watch6", href: "/products?category=akilli-saatler" },
          { label: "Galaxy Watch6 Classic", href: "/products?category=akilli-saatler" },
          { label: "Galaxy Watch5 Pro", href: "/products?category=akilli-saatler" },
        ],
      },
      {
        title: "Akilli Bileklikler",
        items: [
          { label: "Xiaomi Smart Band 8", href: "/products?category=akilli-saatler" },
          { label: "Huawei Band 9", href: "/products?category=akilli-saatler" },
          { label: "Samsung Galaxy Fit3", href: "/products?category=akilli-saatler" },
        ],
      },
    ],
  },
  kiliflar: {
    label: "Kiliflar",
    href: "/products?category=kilif",
    columns: [
      {
        title: "iPhone Modellerine Gore",
        items: [
          { label: "iPhone 15 Kiliflari", href: "/products?category=kilif" },
          { label: "iPhone 14 Kiliflari", href: "/products?category=kilif" },
          { label: "iPhone 13 Kiliflari", href: "/products?category=kilif" },
        ],
      },
      {
        title: "Samsung Modellerine Gore",
        items: [
          { label: "Galaxy S24 Kiliflari", href: "/products?category=kilif" },
          { label: "Galaxy S23 Kiliflari", href: "/products?category=kilif" },
          { label: "Galaxy A55 Kiliflari", href: "/products?category=kilif" },
        ],
      },
      {
        title: "Filtreler",
        items: [
          { label: "Seffaf Kiliflar", href: "/products?category=kilif" },
          { label: "Deri Kiliflar", href: "/products?category=kilif" },
          { label: "Silikon Kiliflar", href: "/products?category=kilif" },
        ],
      },
    ],
  },
  powerBank: {
    label: "Power Bank",
    href: "/products?category=power-bank",
    columns: [
      {
        title: "Markalar",
        items: [
          { label: "Anker", href: "/products?category=power-bank" },
          { label: "Baseus", href: "/products?category=power-bank" },
          { label: "Xiaomi", href: "/products?category=power-bank" },
          { label: "Samsung", href: "/products?category=power-bank" },
        ],
      },
      {
        title: "Kapasite",
        items: [
          { label: "10000 mAh", href: "/products?category=power-bank" },
          { label: "20000 mAh", href: "/products?category=power-bank" },
          { label: "30000 mAh", href: "/products?category=power-bank" },
          { label: "50000 mAh", href: "/products?category=power-bank" },
        ],
      },
      {
        title: "Ozellikler",
        items: [
          { label: "PD Hizli Sarj", href: "/products?category=power-bank" },
          { label: "Kablosuz Sarj", href: "/products?category=power-bank" },
          { label: "MagSafe Uyumlu", href: "/products?category=power-bank" },
          { label: "Ince Tasarim", href: "/products?category=power-bank" },
        ],
      },
    ],
  },
  sarjAleti: {
    label: "Sarj Aleti",
    href: "/products?category=sarj-aleti",
    columns: [
      {
        title: "Markalar",
        items: [
          { label: "Anker", href: "/products?category=sarj-aleti" },
          { label: "Baseus", href: "/products?category=sarj-aleti" },
          { label: "Samsung", href: "/products?category=sarj-aleti" },
          { label: "Apple", href: "/products?category=sarj-aleti" },
        ],
      },
      {
        title: "Guc Secenekleri",
        items: [
          { label: "20W", href: "/products?category=sarj-aleti" },
          { label: "33W", href: "/products?category=sarj-aleti" },
          { label: "45W", href: "/products?category=sarj-aleti" },
          { label: "65W", href: "/products?category=sarj-aleti" },
        ],
      },
      {
        title: "Tipler",
        items: [
          { label: "USB-C Adapterli", href: "/products?category=sarj-aleti" },
          { label: "Coklu Port", href: "/products?category=sarj-aleti" },
          { label: "GaN Teknolojili", href: "/products?category=sarj-aleti" },
          { label: "Arac Sarj Aleti", href: "/products?category=sarj-aleti" },
        ],
      },
    ],
  },
} as const;

type MegaMenuKey = keyof typeof megaMenuData;

const desktopStandaloneLinks = [{ label: "Teknik Servis", href: "/technical-service" }];

const megaMenuPromoContent: Partial<Record<MegaMenuKey, { title: string; description: string; cta: string }>> = {
  ikinciElTelefonlar: {
    title: "Kontrollu ikinci el iPhone secimleri",
    description: "Yalnizca Apple / iPhone modellerine odaklanan seckide pil sagligi, kondisyon ve guvenli alisveris avantajlarini hizlica inceleyin.",
    cta: "iPhone'lari Gor",
  },
};

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());
  const { user, isAdmin, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { messages } = useI18n();
  const navigate = useNavigate();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerMessages = messages.header;
  const localizedNavLinks = headerMessages.mobileNavLinks;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMegaMenu = (key: MegaMenuKey) => {
    clearCloseTimer();
    setActiveMegaMenu(key);
  };

  const closeMegaMenu = () => {
    clearCloseTimer();
    setActiveMegaMenu(null);
  };

  const scheduleCloseMegaMenu = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
      closeTimerRef.current = null;
    }, 130);
  };

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) {
        setActiveMegaMenu(null);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeMegaData = activeMegaMenu ? megaMenuData[activeMegaMenu] : null;
  const primaryMegaColumns = activeMegaData ? activeMegaData.columns.slice(0, 2) : [];
  const promoMegaColumn = activeMegaData?.columns[2] ?? null;
  const activePromoContent = activeMegaMenu ? megaMenuPromoContent[activeMegaMenu] : null;
  const megaMenuTransitionStyle = { transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" } as const;
  const isDarkMode = mounted && resolvedTheme === "dark";

  return (
    <>
      <header
        className="sticky top-0 z-50 isolate w-full border-b border-border/70 bg-background/92 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(248,249,252,0.94)_34%,rgba(236,240,248,0.92)_68%,rgba(225,232,244,0.94)_100%)] text-foreground backdrop-blur-2xl dark:bg-[linear-gradient(90deg,rgba(8,12,22,0.96)_0%,rgba(12,18,32,0.95)_34%,rgba(22,28,45,0.94)_68%,rgba(30,37,56,0.95)_100%)]"
        onMouseLeave={scheduleCloseMegaMenu}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        <div className="container relative z-10 flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src={isDarkMode ? "/images/cep-dunyasi-logo-dark-v3-tight.png" : "/images/image.png"}
              alt={headerMessages.brandAlt}
              className="h-9 w-auto rounded-lg sm:h-10 md:h-11"
            />
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {(Object.keys(megaMenuData) as MegaMenuKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onMouseEnter={() => openMegaMenu(key)}
                onFocus={() => openMegaMenu(key)}
                className={cn(
                  "text-sm font-semibold uppercase tracking-[0.04em] text-foreground/80 transition-colors hover:text-primary",
                  activeMegaMenu === key && "text-primary",
                )}
              >
                {megaMenuData[key].label}
              </button>
            ))}

            {desktopStandaloneLinks.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher className="hidden md:inline-flex" />

            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate("/products")} aria-label={headerMessages.actions.search}>
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate("/cart")} aria-label={headerMessages.actions.cart}>
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 ? (
                <div className="absolute -right-1 -top-1">
                  <Badge className="flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground">
                    {totalItems}
                  </Badge>
                </div>
              ) : null}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => navigate(user ? "/account/favorites" : "/auth")}
              aria-label={headerMessages.actions.favorites}
            >
              <Heart className="h-5 w-5" />
            </Button>

            {user ? (
              <div className="hidden items-center gap-2 lg:flex">
                {isAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/80 bg-secondary text-secondary-foreground hover:bg-secondary/85"
                    onClick={() => navigate("/admin")}
                  >
                    {headerMessages.actions.admin}
                  </Button>
                ) : null}

                <Button variant="ghost" size="sm" onClick={() => navigate("/account/profile")}>
                  <User className="mr-1 h-4 w-4" />
                  {headerMessages.actions.account}
                </Button>

                <Button variant="ghost" size="sm" onClick={signOut}>
                  {headerMessages.actions.signOut}
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" className="hidden lg:flex" onClick={() => navigate("/auth")}>
                {headerMessages.actions.signIn}
              </Button>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" aria-label={headerMessages.actions.menu}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="flex h-full w-[92vw] max-w-xs flex-col overflow-hidden px-5 sm:max-w-sm">
                <SheetTitle className="font-display">{headerMessages.actions.menu}</SheetTitle>

                <div className="mt-6 flex min-h-0 flex-1 flex-col">
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{messages.common.language}</span>
                    <LanguageSwitcher />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 sm:hidden">
                    <span className="text-sm font-medium text-foreground">{headerMessages.actions.theme}</span>
                    <Switch
                      aria-label={isDarkMode ? headerMessages.actions.switchToLight : headerMessages.actions.switchToDark}
                      checked={isDarkMode}
                      disabled={!mounted}
                      className="h-7 w-14 border border-border/70 bg-muted data-[state=checked]:bg-primary/90 data-[state=unchecked]:bg-muted [&>span]:h-6 [&>span]:w-6 [&>span[data-state=checked]]:translate-x-7 [&>span[data-state=unchecked]]:translate-x-0"
                      thumbChildren={
                        isDarkMode ? <Moon className="h-3.5 w-3.5 text-primary" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />
                      }
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>

                  <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-6 pr-1">
                    {localizedNavLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="rounded-xl border border-transparent px-2 py-2 text-base font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/40"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}

                    {user ? (
                      <div className="mt-2 flex flex-col gap-3 border-t border-border/70 pt-4">
                        {isAdmin ? (
                          <Link
                            to="/admin"
                            className="rounded-xl border border-transparent px-2 py-2 text-base font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/40"
                            onClick={() => setMobileOpen(false)}
                          >
                            {headerMessages.actions.adminPanel}
                          </Link>
                        ) : null}

                        <Link
                          to="/account/profile"
                          className="rounded-xl border border-transparent px-2 py-2 text-base font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/40"
                          onClick={() => setMobileOpen(false)}
                        >
                          {headerMessages.actions.accountMenu}
                        </Link>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            signOut();
                            setMobileOpen(false);
                          }}
                        >
                          {headerMessages.actions.signOutMobile}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="mt-2 w-full"
                        onClick={() => {
                          navigate("/auth");
                          setMobileOpen(false);
                        }}
                      >
                        {headerMessages.actions.signIn}
                      </Button>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <div className="ml-1 hidden rounded-full border border-border/70 bg-background/80 p-1 sm:block">
              <Switch
                aria-label={isDarkMode ? headerMessages.actions.switchToLight : headerMessages.actions.switchToDark}
                checked={isDarkMode}
                disabled={!mounted}
                className="h-7 w-14 border border-border/70 bg-muted data-[state=checked]:bg-primary/90 data-[state=unchecked]:bg-muted [&>span]:h-6 [&>span]:w-6 [&>span[data-state=checked]]:translate-x-7 [&>span[data-state=unchecked]]:translate-x-0"
                thumbChildren={isDarkMode ? <Moon className="h-3.5 w-3.5 text-primary" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>
        </div>

        <div
          onMouseEnter={() => activeMegaMenu && openMegaMenu(activeMegaMenu)}
          style={megaMenuTransitionStyle}
          className={cn(
            "absolute left-0 top-full z-[60] hidden w-full transform transition-all duration-300 lg:block",
            activeMegaData ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0",
          )}
        >
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="max-h-[70vh] overflow-y-auto rounded-b-3xl border-x border-b border-border/70 bg-background/92 shadow-[0_28px_55px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              {activeMegaData ? (
                <div className="mx-auto max-w-5xl p-3.5 md:p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2.5">
                    <h3 className="font-display text-lg font-semibold text-primary">{activeMegaData.label}</h3>
                    <Link
                      to={activeMegaData.href}
                      className="text-sm font-semibold text-primary/90 transition-colors hover:text-primary"
                      onClick={closeMegaMenu}
                    >
                      Tumunu Gor
                    </Link>
                  </div>

                  <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
                    {primaryMegaColumns.map((column) => (
                      <div key={column.title} className="self-start rounded-2xl border border-border/65 bg-background/75 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{column.title}</p>
                        <ul className="mt-3 space-y-1">
                          {column.items.map((item) => (
                            <li key={item.label}>
                              <Link
                                to={item.href}
                                onClick={closeMegaMenu}
                                className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <span>{item.label}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {promoMegaColumn ? (
                      <div className="self-start rounded-[1.45rem] border border-border/65 bg-gradient-to-br from-background via-background to-secondary/20 p-3.5 shadow-[0_24px_44px_rgba(0,0,0,0.12)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{promoMegaColumn.title}</p>
                        <h4 className="mt-2.5 font-display text-xl font-semibold tracking-tight text-foreground">
                          {activePromoContent?.title || `${activeMegaData.label} icin ozel secimler`}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {activePromoContent?.description || "En cok ilgi goren baglantilara hizli gecis yapin ve ilgili koleksiyonu tek adimda inceleyin."}
                        </p>
                        <div className="mt-3.5 grid grid-cols-2 gap-2">
                          {promoMegaColumn.items.map((item) => (
                            <Link
                              key={item.label}
                              to={item.href}
                              onClick={closeMegaMenu}
                              className="flex min-h-[2.5rem] items-center justify-center rounded-full border border-border/75 bg-background/85 px-3 py-1.5 text-center text-[13px] font-medium text-foreground/85 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                        <Link
                          to={activeMegaData.href}
                          onClick={closeMegaMenu}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                        >
                          {activePromoContent?.cta || "Tumunu Gor"}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div
        onMouseEnter={closeMegaMenu}
        onClick={closeMegaMenu}
        style={megaMenuTransitionStyle}
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-40 hidden bg-secondary/35 backdrop-blur-md transition-opacity duration-300 lg:block",
          activeMegaData ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />
    </>
  );
}
