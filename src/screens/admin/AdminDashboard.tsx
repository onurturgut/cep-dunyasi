"use client";

import { ReactNode, useEffect } from 'react';
import { Link, useNavigate, useLocation } from '@/lib/router';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingCart, Tag, ArrowLeft, ImageIcon, LogOut, Wrench } from 'lucide-react';

const sidebarItems = [
  { label: 'Genel Bakis', href: '/admin', icon: LayoutDashboard },
  { label: 'Urunler', href: '/admin/products', icon: Package },
  { label: 'Siparisler', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Kuponlar', href: '/admin/coupons', icon: Tag },
  { label: 'Misyon', href: '/admin/mission', icon: ImageIcon },
  { label: 'Teknik Servis', href: '/admin/technical-service', icon: Wrench },
];

export default function AdminDashboard({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, loading, navigate]);

  if (loading || !isAdmin) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Magazaya Don
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {sidebarItems.map((item) => (
            <Button
              key={item.href}
              variant={location.pathname === item.href ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              asChild
            >
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
          {sidebarItems.map((item) => (
            <Button
              key={item.href}
              variant={location.pathname === item.href ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
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
