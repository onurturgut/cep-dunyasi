"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileSpreadsheet,
  FolderTree,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Package,
  ScrollText,
  Shield,
  ShoppingCart,
  Tag,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "@/lib/router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { hasPermission, resolveAdminPermissions, type AdminPermission } from "@/lib/admin";

const sidebarItems: Array<{ label: string; href: string; icon: typeof LayoutDashboard; permission: AdminPermission }> = [
  { label: "Genel Bakis", href: "/admin", icon: LayoutDashboard, permission: "view_reports" },
  { label: "Raporlar", href: "/admin/reports", icon: ScrollText, permission: "view_reports" },
  { label: "Siparisler", href: "/admin/orders", icon: ShoppingCart, permission: "manage_orders" },
  { label: "Urunler", href: "/admin/products", icon: Package, permission: "manage_products" },
  { label: "Stok", href: "/admin/inventory", icon: Warehouse, permission: "manage_products" },
  { label: "Icerik", href: "/admin/site-content", icon: MonitorSmartphone, permission: "manage_site_content" },
  { label: "Kampanyalar", href: "/admin/banners", icon: ImageIcon, permission: "manage_campaigns" },
  { label: "Marketing", href: "/admin/marketing", icon: MessageSquare, permission: "manage_campaigns" },
  { label: "Import / Export", href: "/admin/import-export", icon: FileSpreadsheet, permission: "manage_import_export" },
  { label: "Kategoriler", href: "/admin/categories", icon: FolderTree, permission: "manage_products" },
  { label: "Kullanicilar", href: "/admin/users", icon: Users, permission: "manage_users" },
  { label: "Roller", href: "/admin/roles", icon: Shield, permission: "manage_roles" },
  { label: "Loglar", href: "/admin/logs", icon: ScrollText, permission: "view_logs" },
  { label: "Yorumlar", href: "/admin/reviews", icon: MessageSquare, permission: "manage_products" },
  { label: "Kuponlar", href: "/admin/coupons", icon: Tag, permission: "manage_campaigns" },
  { label: "Misyon", href: "/admin/mission", icon: ImageIcon, permission: "manage_site_content" },
  { label: "Teknik Servis", href: "/admin/technical-service", icon: Wrench, permission: "manage_technical_service" },
];

export default function AdminDashboard({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const permissions = resolveAdminPermissions(user?.roles ?? [], user?.permissions ?? []);
  const visibleSidebarItems = sidebarItems.filter((item) =>
    hasPermission(user?.roles ?? [], permissions, item.permission),
  );
  const currentPage = useMemo(
    () => visibleSidebarItems.find((item) => item.href === location.pathname) ?? visibleSidebarItems[0] ?? null,
    [location.pathname, visibleSidebarItems],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate, user]);

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-card md:block">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Magazaya Don
          </Link>
        </div>
        <nav className="space-y-1 overflow-y-auto p-3">
          {visibleSidebarItems.map((item) => (
            <Button key={item.href} variant={location.pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link to={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Cikis Yap
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Admin Panel</p>
            <p className="truncate font-semibold">{currentPage?.label ?? "Yonetim"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-4 w-4" />
              <span className="sr-only">Menuyu ac</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cikis yap</span>
            </Button>
          </div>
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
            <SheetHeader className="border-b px-5 py-4 text-left">
              <SheetTitle>Admin Menusu</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <div className="border-b px-5 py-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Magazaya Don
                </Link>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {visibleSidebarItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={location.pathname === item.href ? "secondary" : "ghost"}
                    className="h-11 w-full justify-start"
                    asChild
                  >
                    <Link to={item.href} onClick={() => setMobileNavOpen(false)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
              <div className="border-t p-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cikis Yap
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
