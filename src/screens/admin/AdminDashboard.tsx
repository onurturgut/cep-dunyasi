"use client";

import { ReactNode, useEffect } from "react";
import {
  ArrowLeft,
  FileSpreadsheet,
  FolderTree,
  ImageIcon,
  LayoutDashboard,
  LogOut,
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
import { hasPermission, resolveAdminPermissions, type AdminPermission } from "@/lib/admin";

const sidebarItems: Array<{ label: string; href: string; icon: typeof LayoutDashboard; permission: AdminPermission }> = [
  { label: "Genel Bakis", href: "/admin", icon: LayoutDashboard, permission: "view_reports" },
  { label: "Raporlar", href: "/admin/reports", icon: ScrollText, permission: "view_reports" },
  { label: "Siparisler", href: "/admin/orders", icon: ShoppingCart, permission: "manage_orders" },
  { label: "Urunler", href: "/admin/products", icon: Package, permission: "manage_products" },
  { label: "Stok", href: "/admin/inventory", icon: Warehouse, permission: "manage_products" },
  { label: "Icerik", href: "/admin/site-content", icon: MonitorSmartphone, permission: "manage_site_content" },
  { label: "Kampanyalar", href: "/admin/banners", icon: ImageIcon, permission: "manage_campaigns" },
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
  const permissions = resolveAdminPermissions(user?.roles ?? [], user?.permissions ?? []);
  const visibleSidebarItems = sidebarItems.filter((item) =>
    hasPermission(user?.roles ?? [], permissions, item.permission),
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
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Magazaya Don
          </Link>
        </div>
        <nav className="space-y-1 p-3">
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

      <div className="flex-1">
        <div className="flex items-center gap-2 overflow-x-auto border-b p-2 md:hidden">
          {visibleSidebarItems.map((item) => (
            <Button key={item.href} variant={location.pathname === item.href ? "secondary" : "ghost"} size="sm" asChild>
              <Link to={item.href}>
                <item.icon className="mr-1 h-3.5 w-3.5" />
                {item.label}
              </Link>
            </Button>
          ))}
          <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={handleSignOut}>
            <LogOut className="mr-1 h-3.5 w-3.5" />
            Cikis
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
