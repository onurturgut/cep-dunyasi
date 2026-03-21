"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/integrations/mongo/client";
import { parseValidDate, toIsoDateKey } from "@/lib/date";

type DashboardOrderItem = {
  variant_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type DashboardOrder = {
  id: string;
  created_at: string;
  final_price: number;
  payment_status: string;
  order_status: string;
  order_items?: DashboardOrderItem[];
};

type DashboardProduct = {
  id: string;
  name: string;
  categories?: {
    name?: string;
  } | null;
};

type DashboardVariant = {
  id: string;
  product_id: string;
};

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const pieColors = ["#98111E", "#c43a46", "#e36b75", "#f2a1a8", "#6b7280", "#d4d4d8"];

function formatCurrency(value: number) {
  return `TL ${Math.round(value).toLocaleString("tr-TR")}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export default function AdminOverview() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [variants, setVariants] = useState<DashboardVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      const [ordersRes, productsRes, variantsRes] = await Promise.all([
        db
          .from("orders")
          .select("id, created_at, final_price, payment_status, order_status, order_items(*)")
          .order("created_at", { ascending: true }),
        db.from("products").select("id, name, categories(name)"),
        db.from("product_variants").select("id, product_id"),
      ]);

      setOrders((ordersRes.data as DashboardOrder[]) || []);
      setProducts((productsRes.data as DashboardProduct[]) || []);
      setVariants((variantsRes.data as DashboardVariant[]) || []);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const analytics = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter((order) => order.payment_status === "paid").length;
    const totalRevenue = orders
      .filter((order) => order.payment_status === "paid")
      .reduce((sum, order) => sum + (order.final_price || 0), 0);
    const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
    const cancelledOrders = orders.filter((order) => order.order_status === "cancelled").length;

    const variantById = new Map(variants.map((variant) => [variant.id, variant.product_id]));
    const productById = new Map(products.map((product) => [product.id, product]));

    const now = new Date();
    const monthlyMap = new Map<string, { label: string; revenue: number; orders: number }>();
    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyMap.set(getMonthKey(monthDate), {
        label: monthDate.toLocaleDateString("tr-TR", { month: "short" }),
        revenue: 0,
        orders: 0,
      });
    }

    const dailyMap = new Map<string, { label: string; revenue: number; orders: number }>();
    for (let i = 13; i >= 0; i -= 1) {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - i);
      const key = toIsoDateKey(dayDate);

      if (!key) {
        continue;
      }

      dailyMap.set(key, {
        label: dayDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
        revenue: 0,
        orders: 0,
      });
    }

    const statusMap = new Map<string, number>();
    const categoryMap = new Map<string, { revenue: number; quantity: number }>();
    const productMap = new Map<string, { revenue: number; quantity: number }>();

    for (const order of orders) {
      const createdAt = parseValidDate(order.created_at);

      if (!createdAt) {
        continue;
      }

      const monthKey = getMonthKey(createdAt);
      const dayKey = toIsoDateKey(createdAt);
      const isPaid = order.payment_status === "paid";

      const monthEntry = monthlyMap.get(monthKey);
      if (monthEntry) {
        monthEntry.orders += 1;
        if (isPaid) {
          monthEntry.revenue += order.final_price || 0;
        }
      }

      const dayEntry = dayKey ? dailyMap.get(dayKey) : null;
      if (dayEntry) {
        dayEntry.orders += 1;
        if (isPaid) {
          dayEntry.revenue += order.final_price || 0;
        }
      }

      statusMap.set(order.order_status, (statusMap.get(order.order_status) ?? 0) + 1);

      for (const item of order.order_items ?? []) {
        const itemRevenue = (item.unit_price || 0) * (item.quantity || 0);
        const productAgg = productMap.get(item.product_name) ?? { revenue: 0, quantity: 0 };
        productAgg.revenue += itemRevenue;
        productAgg.quantity += item.quantity || 0;
        productMap.set(item.product_name, productAgg);

        const productId = variantById.get(item.variant_id);
        const categoryName = productId ? productById.get(productId)?.categories?.name : undefined;
        const categoryKey = categoryName || "Diger";
        const categoryAgg = categoryMap.get(categoryKey) ?? { revenue: 0, quantity: 0 };
        categoryAgg.revenue += itemRevenue;
        categoryAgg.quantity += item.quantity || 0;
        categoryMap.set(categoryKey, categoryAgg);
      }
    }

    const monthlyTrend = Array.from(monthlyMap.values()).map((entry) => ({
      ...entry,
      revenue: Math.round(entry.revenue),
    }));

    const dailyTrend = Array.from(dailyMap.values()).map((entry) => ({
      ...entry,
      revenue: Math.round(entry.revenue),
    }));

    const statusDistribution = Array.from(statusMap.entries()).map(([status, count], index) => ({
      status,
      label: statusLabels[status] ?? status,
      count,
      fill: pieColors[index % pieColors.length],
    }));

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        revenue: Math.round(value.revenue),
        quantity: value.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const topProducts = Array.from(productMap.entries())
      .map(([name, value]) => ({
        name,
        revenue: Math.round(value.revenue),
        quantity: value.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const kpis = [
      { title: "Toplam Ürün", value: products.length.toLocaleString("tr-TR"), icon: Package, color: "text-primary" },
      { title: "Toplam Sipariş", value: totalOrders.toLocaleString("tr-TR"), icon: ShoppingCart, color: "text-accent" },
      { title: "Ciro", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-success" },
      {
        title: "İptal Sipariş",
        value: cancelledOrders.toLocaleString("tr-TR"),
        icon: AlertTriangle,
        color: "text-destructive",
      },
    ];

    return {
      kpis,
      paidOrders,
      avgOrderValue,
      monthlyTrend,
      dailyTrend,
      statusDistribution,
      topCategories,
      topProducts,
    };
  }, [orders, products, variants]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Genel Bakis</h1>
      <p className="mt-1 text-sm text-muted-foreground">Grafikler ve satis analizleri</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analytics.kpis.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? "..." : card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ödeme Alınan Sipariş</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{loading ? "..." : analytics.paidOrders.toLocaleString("tr-TR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ortalama Sepet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{loading ? "..." : formatCurrency(analytics.avgOrderValue)}</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Not</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dashboard, son verilerle otomatik güncellenir. Sipariş trendi ve kategori ciro dağılımı aşağıdaki grafiklerde.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aylik Ciro Trendi (6 Ay)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `TL ${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#98111E"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#98111E" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gunluk Satis (Son 14 Gun)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `TL ${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#C43A46" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sipariş Durumu Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.statusDistribution} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                  {analytics.statusDistribution.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategori Bazli Ciro</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topCategories} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(value) => `TL ${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#98111E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">En Cok Gelir Getiren Ürünler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {index + 1}. {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{product.quantity.toLocaleString("tr-TR")} adet</p>
                </div>
                <p className="text-sm font-semibold text-primary">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
            {!loading && analytics.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Satis verisi bulunamadi.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
