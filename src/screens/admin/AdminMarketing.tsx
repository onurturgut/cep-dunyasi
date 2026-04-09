"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircleMore, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminMarketingSettings,
  useAdminNewsletterSubscribers,
  useUpdateAdminMarketingSettings,
} from "@/hooks/use-marketing";
import { getDefaultMarketingSettings } from "@/lib/marketing";

export default function AdminMarketingScreen() {
  const marketingSettingsQuery = useAdminMarketingSettings();
  const updateSettings = useUpdateAdminMarketingSettings();
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const subscribersQuery = useAdminNewsletterSubscribers({ page: 1, limit: 20, search: subscriberSearch });
  const [settingsForm, setSettingsForm] = useState(getDefaultMarketingSettings());

  useEffect(() => {
    if (marketingSettingsQuery.data) {
      setSettingsForm(marketingSettingsQuery.data);
    }
  }, [marketingSettingsQuery.data]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync(settingsForm);
      toast.success("Marketing ayarlari guncellendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Marketing ayarlari kaydedilemedi");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Marketing Ayarlari</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Newsletter, WhatsApp ve sadakat odakli ayarlari tek yerden yonetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Genel Marketing Ayarlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Newsletter Basligi</Label>
              <Input value={settingsForm.newsletterTitle} onChange={(event) => setSettingsForm((current) => ({ ...current, newsletterTitle: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Basari Mesaji</Label>
              <Input
                value={settingsForm.newsletterSuccessMessage}
                onChange={(event) => setSettingsForm((current) => ({ ...current, newsletterSuccessMessage: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Newsletter Aciklama</Label>
            <Textarea value={settingsForm.newsletterDescription} onChange={(event) => setSettingsForm((current) => ({ ...current, newsletterDescription: event.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>WhatsApp Telefon</Label>
              <Input value={settingsForm.whatsappPhone} onChange={(event) => setSettingsForm((current) => ({ ...current, whatsappPhone: event.target.value }))} placeholder="90555..." />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Yardim Metni</Label>
              <Input value={settingsForm.whatsappHelpText} onChange={(event) => setSettingsForm((current) => ({ ...current, whatsappHelpText: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>WhatsApp Mesaji</Label>
            <Textarea value={settingsForm.whatsappMessage} onChange={(event) => setSettingsForm((current) => ({ ...current, whatsappMessage: event.target.value }))} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Loyalty Puan Orani</Label>
              <Input type="number" min="0" value={settingsForm.loyaltyPointsPerCurrency} onChange={(event) => setSettingsForm((current) => ({ ...current, loyaltyPointsPerCurrency: Number(event.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Dusuk Stok Esigi</Label>
              <Input type="number" min="1" value={settingsForm.lowStockThreshold} onChange={(event) => setSettingsForm((current) => ({ ...current, lowStockThreshold: Number(event.target.value) || 1 }))} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Newsletter Acik", key: "newsletterEnabled" as const },
              { label: "WhatsApp Acik", key: "whatsappEnabled" as const },
              { label: "Loyalty Sistemi Acik", key: "loyaltyEnabled" as const },
              { label: "WhatsApp Mobilde Goster", key: "whatsappShowOnMobile" as const },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
                <span className="text-sm font-medium">{item.label}</span>
                <Switch checked={settingsForm[item.key]} onCheckedChange={(checked) => setSettingsForm((current) => ({ ...current, [item.key]: checked }))} />
              </div>
            ))}
          </div>

          <Button onClick={() => void handleSaveSettings()} disabled={updateSettings.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Ayarlari Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircleMore className="h-4 w-4" />
            Newsletter Aboneleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={subscriberSearch} onChange={(event) => setSubscriberSearch(event.target.value)} placeholder="E-posta veya kaynak ara" />
          <div className="space-y-3">
            {(subscribersQuery.data?.items ?? []).map((subscriber) => (
              <div key={subscriber.id} className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 p-3 md:flex-row md:items-center">
                <div>
                  <p className="font-medium">{subscriber.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriber.firstName || "Isimsiz"} / {subscriber.source} / {new Date(subscriber.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{subscriber.campaignSource || "Genel kaynak"}</span>
              </div>
            ))}
            {(subscribersQuery.data?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Henuz newsletter aboneligi bulunmuyor.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
