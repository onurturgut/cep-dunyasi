"use client";

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import { ShoppingCart, Menu, User, Search, ChevronRight, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const navLinks = [
  { label: 'Ana Sayfa', href: '/' },
  { label: 'Telefonlar', href: '/products?category=telefon' },
  { label: '2. El Telefonlar', href: '/products?category=ikinci-el-telefon' },
  { label: 'Saatler', href: '/products?category=akilli-saatler' },
  { label: 'Kiliflar', href: '/products?category=kilif' },
  { label: 'Sarj Aleti', href: '/products?category=sarj-aleti' },
  { label: 'Power Bank', href: '/products?category=power-bank' },
  { label: 'Teknik Servis', href: '/products?category=teknik-servis' },
];

const megaMenuData = {
  telefonlar: {
    label: 'Telefonlar',
    href: '/products?category=telefon',
    columns: [
      {
        title: 'Markalar',
        items: [
          { label: 'Apple', href: '/products?category=telefon' },
          { label: 'Samsung', href: '/products?category=telefon' },
          { label: 'Xiaomi', href: '/products?category=telefon' },
          { label: 'Huawei', href: '/products?category=telefon' },
        ],
      },
      {
        title: 'Populer Modeller',
        items: [
          { label: 'iPhone 15', href: '/products?category=telefon' },
          { label: 'iPhone 14', href: '/products?category=telefon' },
          { label: 'Galaxy S24', href: '/products?category=telefon' },
          { label: 'Redmi Note 13', href: '/products?category=telefon' },
        ],
      },
      {
        title: 'Seriler',
        items: [
          { label: 'Pro Serisi', href: '/products?category=telefon' },
          { label: 'Max Serisi', href: '/products?category=telefon' },
          { label: 'Ultra Serisi', href: '/products?category=telefon' },
          { label: 'A Serisi', href: '/products?category=telefon' },
        ],
      },
    ],
  },
  ikinciElTelefonlar: {
    label: '2. El Telefonlar',
    href: '/products?category=ikinci-el-telefon',
    columns: [
      {
        title: 'Markalar',
        items: [
          { label: 'Apple', href: '/products?category=ikinci-el-telefon' },
          { label: 'Samsung', href: '/products?category=ikinci-el-telefon' },
          { label: 'Xiaomi', href: '/products?category=ikinci-el-telefon' },
          { label: 'Huawei', href: '/products?category=ikinci-el-telefon' },
        ],
      },
      {
        title: 'Populer Modeller',
        items: [
          { label: 'iPhone 15', href: '/products?category=ikinci-el-telefon' },
          { label: 'iPhone 14', href: '/products?category=ikinci-el-telefon' },
          { label: 'Galaxy S24', href: '/products?category=ikinci-el-telefon' },
          { label: 'Redmi Note 13', href: '/products?category=ikinci-el-telefon' },
        ],
      },
      {
        title: 'Seriler',
        items: [
          { label: 'Pro Serisi', href: '/products?category=ikinci-el-telefon' },
          { label: 'Max Serisi', href: '/products?category=ikinci-el-telefon' },
          { label: 'Ultra Serisi', href: '/products?category=ikinci-el-telefon' },
          { label: 'A Serisi', href: '/products?category=ikinci-el-telefon' },
        ],
      },
    ],
  },
  saatler: {
    label: 'Saatler',
    href: '/products?category=akilli-saatler',
    columns: [
      {
        title: 'Apple Watch Modelleri',
        items: [
          { label: 'Apple Watch Series 9', href: '/products?category=akilli-saatler' },
          { label: 'Apple Watch Ultra 2', href: '/products?category=akilli-saatler' },
          { label: 'Apple Watch SE', href: '/products?category=akilli-saatler' },
        ],
      },
      {
        title: 'Samsung Watch Modelleri',
        items: [
          { label: 'Galaxy Watch6', href: '/products?category=akilli-saatler' },
          { label: 'Galaxy Watch6 Classic', href: '/products?category=akilli-saatler' },
          { label: 'Galaxy Watch5 Pro', href: '/products?category=akilli-saatler' },
        ],
      },
      {
        title: 'Akilli Bileklikler',
        items: [
          { label: 'Xiaomi Smart Band 8', href: '/products?category=akilli-saatler' },
          { label: 'Huawei Band 9', href: '/products?category=akilli-saatler' },
          { label: 'Samsung Galaxy Fit3', href: '/products?category=akilli-saatler' },
        ],
      },
    ],
  },
  kiliflar: {
    label: 'Kiliflar',
    href: '/products?category=kilif',
    columns: [
      {
        title: 'iPhone Modellerine Gore',
        items: [
          { label: 'iPhone 15 Kiliflari', href: '/products?category=kilif' },
          { label: 'iPhone 14 Kiliflari', href: '/products?category=kilif' },
          { label: 'iPhone 13 Kiliflari', href: '/products?category=kilif' },
        ],
      },
      {
        title: 'Samsung Modellerine Gore',
        items: [
          { label: 'Galaxy S24 Kiliflari', href: '/products?category=kilif' },
          { label: 'Galaxy S23 Kiliflari', href: '/products?category=kilif' },
          { label: 'Galaxy A55 Kiliflari', href: '/products?category=kilif' },
        ],
      },
      {
        title: 'Filtreler',
        items: [
          { label: 'Seffaf Kiliflar', href: '/products?category=kilif' },
          { label: 'Deri Kiliflar', href: '/products?category=kilif' },
          { label: 'Silikon Kiliflar', href: '/products?category=kilif' },
        ],
      },
    ],
  },
  powerBank: {
    label: 'Power Bank',
    href: '/products?category=power-bank',
    columns: [
      {
        title: 'Markalar',
        items: [
          { label: 'Anker', href: '/products?category=power-bank' },
          { label: 'Baseus', href: '/products?category=power-bank' },
          { label: 'Xiaomi', href: '/products?category=power-bank' },
          { label: 'Samsung', href: '/products?category=power-bank' },
        ],
      },
      {
        title: 'Kapasite',
        items: [
          { label: '10000 mAh', href: '/products?category=power-bank' },
          { label: '20000 mAh', href: '/products?category=power-bank' },
          { label: '30000 mAh', href: '/products?category=power-bank' },
          { label: '50000 mAh', href: '/products?category=power-bank' },
        ],
      },
      {
        title: 'Ozellikler',
        items: [
          { label: 'PD Hizli Sarj', href: '/products?category=power-bank' },
          { label: 'Kablosuz Sarj', href: '/products?category=power-bank' },
          { label: 'MagSafe Uyumlu', href: '/products?category=power-bank' },
          { label: 'Ince Tasarim', href: '/products?category=power-bank' },
        ],
      },
    ],
  },
  sarjAleti: {
    label: 'Sarj Aleti',
    href: '/products?category=sarj-aleti',
    columns: [
      {
        title: 'Markalar',
        items: [
          { label: 'Anker', href: '/products?category=sarj-aleti' },
          { label: 'Baseus', href: '/products?category=sarj-aleti' },
          { label: 'Samsung', href: '/products?category=sarj-aleti' },
          { label: 'Apple', href: '/products?category=sarj-aleti' },
        ],
      },
      {
        title: 'Guc Secenekleri',
        items: [
          { label: '20W', href: '/products?category=sarj-aleti' },
          { label: '33W', href: '/products?category=sarj-aleti' },
          { label: '45W', href: '/products?category=sarj-aleti' },
          { label: '65W', href: '/products?category=sarj-aleti' },
        ],
      },
      {
        title: 'Tipler',
        items: [
          { label: 'USB-C Adaptorlu', href: '/products?category=sarj-aleti' },
          { label: 'Coklu Port', href: '/products?category=sarj-aleti' },
          { label: 'GaN Teknolojili', href: '/products?category=sarj-aleti' },
          { label: 'Arac Sarj Aleti', href: '/products?category=sarj-aleti' },
        ],
      },
    ],
  },
} as const;

type MegaMenuKey = keyof typeof megaMenuData;

const desktopStandaloneLinks = [
  { label: 'Teknik Servis', href: '/products?category=teknik-servis' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const { user, isAdmin, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeMegaData = activeMegaMenu ? megaMenuData[activeMegaMenu] : null;
  const megaMenuTransitionStyle = { transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' } as const;
  const isDarkMode = mounted && resolvedTheme === 'dark';

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 text-foreground backdrop-blur-2xl"
        onMouseLeave={scheduleCloseMegaMenu}
      >
        <div className="container flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src={isDarkMode ? "/images/cep-dunyasi-logo-dark-v3-tight.png" : "/images/image.png"}
              alt="Cep Dunyasi"
              className="h-9 w-auto rounded-lg sm:h-10 md:h-11"
            />
              <span
                className={cn(
                  "hidden truncate font-display text-base font-bold tracking-wide transition-colors min-[390px]:inline sm:text-lg md:text-xl",
                  activeMegaData ? "text-primary" : "text-foreground",
                )}
              >
                cep dunyasi
            </span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            <Link
              to="/"
              aria-label="Ana Sayfa"
              title="Ana Sayfa"
              className="inline-flex items-center justify-center transition-opacity hover:opacity-90"
            >
              <img src="/images/home-icon.png" alt="Ana Sayfa" className="h-8 w-8 rounded-sm object-cover" />
            </Link>

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
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate('/products')}>
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <div className="absolute -right-1 -top-1">
                  <Badge className="flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground">
                    {totalItems}
                  </Badge>
                </div>
              )}
            </Button>

            {user ? (
              <div className="hidden items-center gap-2 lg:flex">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/80 bg-secondary text-secondary-foreground hover:bg-secondary/85"
                    onClick={() => navigate('/admin')}
                  >
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>
                  <User className="mr-1 h-4 w-4" />
                  Hesap
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Cikis
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" className="hidden lg:flex" onClick={() => navigate('/auth')}>
                Giris Yap
              </Button>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[92vw] max-w-xs px-5 sm:max-w-sm">
                <SheetTitle className="font-display">Menu</SheetTitle>
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 sm:hidden">
                  <span className="text-sm font-medium text-foreground">Tema</span>
                  <Switch
                    aria-label={isDarkMode ? 'Gunduz moduna gec' : 'Gece moduna gec'}
                    checked={isDarkMode}
                    disabled={!mounted}
                    className="h-7 w-14 border border-border/70 bg-muted data-[state=checked]:bg-primary/90 data-[state=unchecked]:bg-muted [&>span]:h-6 [&>span]:w-6 [&>span[data-state=checked]]:translate-x-7 [&>span[data-state=unchecked]]:translate-x-0"
                    thumbChildren={
                      isDarkMode
                        ? <Moon className="h-3.5 w-3.5 text-primary" />
                        : <Sun className="h-3.5 w-3.5 text-amber-500" />
                    }
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
                <nav className="mt-6 flex flex-col gap-3">
                  {navLinks.map((link) => (
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
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="rounded-xl border border-transparent px-2 py-2 text-base font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/40"
                          onClick={() => setMobileOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        to="/account"
                        className="rounded-xl border border-transparent px-2 py-2 text-base font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/40"
                        onClick={() => setMobileOpen(false)}
                      >
                        Hesabim
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          signOut();
                          setMobileOpen(false);
                        }}
                      >
                        Cikis Yap
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="mt-2 w-full"
                      onClick={() => {
                        navigate('/auth');
                        setMobileOpen(false);
                      }}
                    >
                      Giris Yap
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <div className="ml-1 hidden rounded-full border border-border/70 bg-background/80 p-1 sm:block">
              <Switch
                aria-label={isDarkMode ? 'Gunduz moduna gec' : 'Gece moduna gec'}
                checked={isDarkMode}
                disabled={!mounted}
                className="h-7 w-14 border border-border/70 bg-muted data-[state=checked]:bg-primary/90 data-[state=unchecked]:bg-muted [&>span]:h-6 [&>span]:w-6 [&>span[data-state=checked]]:translate-x-7 [&>span[data-state=unchecked]]:translate-x-0"
                thumbChildren={
                  isDarkMode
                    ? <Moon className="h-3.5 w-3.5 text-primary" />
                    : <Sun className="h-3.5 w-3.5 text-amber-500" />
                }
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
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
            <div className="rounded-b-3xl border-x border-b border-border/70 bg-background/92 shadow-[0_28px_55px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              {activeMegaData && (
                <div className="mx-auto max-w-7xl p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
                    <h3 className="font-display text-xl font-semibold text-primary">{activeMegaData.label}</h3>
                    <Link
                      to={activeMegaData.href}
                      className="text-sm font-semibold text-primary/90 transition-colors hover:text-primary"
                      onClick={closeMegaMenu}
                    >
                      Tumunu Gor
                    </Link>
                  </div>
                  <div className="grid gap-6 md:grid-cols-3">
                    {activeMegaData.columns.map((column) => (
                      <div key={column.title} className="rounded-2xl border border-border/65 bg-background/75 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{column.title}</p>
                        <ul className="mt-4 space-y-2">
                          {column.items.map((item) => (
                            <li key={item.label}>
                              <Link
                                to={item.href}
                                onClick={closeMegaMenu}
                                className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <span>{item.label}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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


