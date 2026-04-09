"use client";

import { useState } from "react";
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Wrench } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { LowStockTable } from "@/components/admin/LowStockTable";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { TopSellingProductsTable } from "@/components/admin/TopSellingProductsTable";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDashboard } from "@/hooks/use-admin";
import { formatAdminCurrency, type DateRangeInput } from "@/lib/admin";

const presetOptions: Array<{ value: DateRangeInput["preset"]; label: string }> = [
  { value: "today", label: "Bugun" },
  { value: "7d", label: "Son 7 Gun" },
  { value: "30d", label: "Son 30 Gun" },
  { value: "this_month", label: "Bu Ay" },
  { value: "last_month", label: "Gecen Ay" },
];

const metricIcons = {
  todayRevenue: TrendingUp,
  weekRevenue: TrendingUp,
  monthRevenue: TrendingUp,
  totalOrders: ShoppingCart,
  todayOrders: ShoppingCart,
  pendingOrders: AlertTriangle,
  preparingOrders: Package,
  lowStockCount: AlertTriangle,
  activeCampaigns: TrendingUp,
  pendingServiceRequests: Wrench,
} as const;

export default function AdminOverview() {
  const [preset, setPreset] = useState<DateRangeInput["preset"]>("30d");
  const { data, isLoading } = useAdminDashboard({ preset });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Genel Bakis</h1>
          <p className="text-sm text-muted-foreground">Satis, operasyon ve stok verilerinin tek ekrandaki ozeti.</p>
        </div>
        <Select value={preset} onValueChange={(value) => setPreset(value as DateRangeInput["preset"])}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(data?.metrics ?? []).map((metric) => (
          <AdminStatCard
            key={metric.key}
            title={metric.label}
            value={metric.value}
            format={metric.format}
            description={isLoading ? "Yukleniyor..." : undefined}
            icon={metricIcons[metric.key]}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ciro Grafigi</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `TL ${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatAdminCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#98111E" fill="#98111E" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Siparis Trendi</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.orderTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => value.toLocaleString("tr-TR")} />
                <Bar dataKey="orders" fill="#c43a46" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <RecentOrdersTable orders={data?.recentOrders ?? []} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son uullanici uayitlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.recentUsers ?? []).map((user) => (
              <div key={user.id} className="flex flex-col gap-2 rounded-xl border border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium">{user.orderCount.toLocaleString("tr-TR")} siparis</p>
                </div>
              </div>
            ))}
            {(data?.recentUsers ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">uullanici verisi bulunamadi.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TopSellingProductsTable items={data?.topProducts ?? []} />
        <LowStockTable items={data?.lowStockProducts ?? []} />
      </div>

      <AuditLogTable items={data?.recentLogs ?? []} />
    </div>
  );
}

