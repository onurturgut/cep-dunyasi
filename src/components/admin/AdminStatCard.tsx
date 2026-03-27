"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAdminCurrency } from "@/lib/admin";

type AdminStatCardProps = {
  title: string;
  value: number;
  format: "currency" | "number";
  description?: string;
  icon?: LucideIcon;
};

export function AdminStatCard({ title, value, format, description, icon: Icon }: AdminStatCardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 break-words text-xl sm:text-2xl">
            {format === "currency" ? formatAdminCurrency(value) : value.toLocaleString("tr-TR")}
          </CardTitle>
        </div>
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" /> : null}
      </CardHeader>
      {description ? (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
