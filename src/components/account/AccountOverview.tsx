"use client";

import { Heart, MapPin, Package, Wrench } from "lucide-react";
import { Link } from "@/lib/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountProfile, AccountStatCards, MyOrderSummary, TechnicalServiceHistoryItem } from "@/lib/account";
import { ORDER_STATUS_LABELS, TECHNICAL_SERVICE_STATUS_LABELS } from "@/lib/account";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";

type AccountOverviewProps = {
  profile: AccountProfile;
  stats: AccountStatCards;
  latestOrder: MyOrderSummary | null;
  latestTechnicalService: TechnicalServiceHistoryItem | null;
};

export function AccountStatCardsView({ stats }: { stats: AccountStatCards }) {
  const items = [
    { label: "Toplam Siparis", value: stats.order_count, icon: Package },
    { label: "Favoriler", value: stats.favorite_count, icon: Heart },
    { label: "Adresler", value: stats.address_count, icon: MapPin },
    { label: "Aktif Servis", value: stats.active_technical_service_count, icon: Wrench },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{item.value.toLocaleString("tr-TR")}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function AccountOverview({ profile, stats, latestOrder, latestTechnicalService }: AccountOverviewProps) {
  return (
    <div className="space-y-6">
      <AccountStatCardsView stats={stats} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle className="text-lg">Profil Ozetiniz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Hesap:</span> {profile.full_name || "Bilgi eklenmedi"}
            </p>
            <p>
              <span className="font-medium text-foreground">E-posta:</span> {profile.email}
            </p>
            <p>
              <span className="font-medium text-foreground">Telefon:</span> {profile.phone || "Eklenmedi"}
            </p>
            <p>
              <span className="font-medium text-foreground">Uyelik Tarihi:</span> {formatDate(profile.created_at)}
            </p>
            <div className="pt-2">
              <Link to="/account/profile" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                Profili duzenle
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle className="text-lg">Son Siparis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {latestOrder ? (
              <>
                <p>
                  <span className="font-medium text-foreground">Siparis No:</span> #{latestOrder.id.slice(0, 8)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Durum:</span> {ORDER_STATUS_LABELS[latestOrder.order_status] || latestOrder.order_status}
                </p>
                <p>
                  <span className="font-medium text-foreground">Toplam:</span> {formatCurrency(latestOrder.final_price)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Tarih:</span> {formatDate(latestOrder.created_at)}
                </p>
                <div className="pt-2">
                  <Link to={`/account/orders/${latestOrder.id}`} className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    Siparis detayina git
                  </Link>
                </div>
              </>
            ) : (
              <p>Henüz siparisiniz bulunmuyor.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle className="text-lg">Adres Defteri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Kayitli Adres:</span> {stats.address_count}
            </p>
            <p>
              <span className="font-medium text-foreground">Varsayilan Iletisim:</span>{" "}
              {profile.communication_preferences.email ? "E-posta" : "E-posta kapali"}
              {profile.communication_preferences.sms ? " / SMS aktif" : ""}
            </p>
            <div className="pt-2">
              <Link to="/account/addresses" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                Adresleri yonet
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle className="text-lg">Teknik Servis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {latestTechnicalService ? (
              <>
                <p>
                  <span className="font-medium text-foreground">Son Kayit:</span> {latestTechnicalService.phone_model}
                </p>
                <p>
                  <span className="font-medium text-foreground">Durum:</span>{" "}
                  {TECHNICAL_SERVICE_STATUS_LABELS[latestTechnicalService.status] || latestTechnicalService.status}
                </p>
                <p>
                  <span className="font-medium text-foreground">Tarih:</span> {formatDate(latestTechnicalService.created_at)}
                </p>
                <div className="pt-2">
                  <Link to="/account/technical-service" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    Servis gecmisini gor
                  </Link>
                </div>
              </>
            ) : (
              <p>Aktif teknik servis kaydiniz bulunmuyor.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
