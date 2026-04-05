"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { TopSellingProductsTable } from "@/components/admin/TopSellingProductsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatAdminCurrency } from "@/lib/admin";
import { useSalesReports } from "@/hooks/use-admin";

const presets = [
  { value: "today", label: "Bugun" },
  { value: "7d", label: "Son 7 Gun" },
  { value: "30d", label: "Son 30 Gun" },
  { value: "this_month", label: "Bu Ay" },
  { value: "last_month", label: "Gecen Ay" },
] as const;

export default function AdminReports() {
  const [preset, setPreset] = useState<(typeof presets)[number]["value"]>("30d");
  const { data, isLoading } = useSalesReports({ preset });

  const summaryCards = useMemo(
    () => [
      { title: "Toplam Ciro", value: data?.summary.totalRevenue ?? 0, format: "currency" as const },
      { title: "Siparis Adedi", value: data?.summary.totalOrders ?? 0, format: "number" as const },
      { title: "Ortalama Sepet", value: data?.summary.averageOrderValue ?? 0, format: "currency" as const },
      { title: "Odenen Siparis", value: data?.summary.paidOrders ?? 0, format: "number" as const },
    ],
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Satis Raporlari</h1>
          <p className="text-sm text-muted-foreground">Ciro, siparis trendleri ve kategori bazli performans.</p>
        </div>
        <Select value={preset} onValueChange={(value) => setPreset(value as (typeof presets)[number]["value"])}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <AdminStatCard key={card.title} title={card.title} value={card.value} format={card.format} description={isLoading ? "Yukleniyor..." : undefined} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ciro Trendi</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.revenueTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `TL ${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatAdminCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#98111E" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
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

      <TopSellingProductsTable items={data?.salesByProduct ?? []} title="Ürün Bazli Satis" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategori Bazli Satis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.salesByCategory ?? []).map((row) => (
            <div key={row.categoryName} className="flex items-center justify-between rounded-lg border border-border/70 px-4 py-3">
              <div>
                <p className="font-medium">{row.categoryName}</p>
                <p className="text-xs text-muted-foreground">{row.quantity.toLocaleString("tr-TR")} adet</p>
              </div>
              <p className="font-semibold text-primary">{formatAdminCurrency(row.revenue)}</p>
            </div>
          ))}
          {(data?.salesByCategory ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Kategori bazli satis verisi bulunamadi.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

