"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircleMore, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminMarketingSettings,
  useAdminNewsletterSubscribers,
  useAdminSocialProof,
  useDeleteAdminSocialProof,
  useUpdateAdminMarketingSettings,
  useUpsertAdminSocialProof,
} from "@/hooks/use-marketing";
import { getDefaultMarketingSettings } from "@/lib/marketing";

type SocialProofFormState = {
  id?: string;
  label: string;
  value: string;
  icon: string;
  description: string;
  sourceType: "manual" | "derived";
  isActive: boolean;
  order: number;
};

const defaultSocialProofForm: SocialProofFormState = {
  label: "",
  value: "",
  icon: "",
  description: "",
  sourceType: "manual",
  isActive: true,
  order: 0,
};

export default function AdminMarketingScreen() {
  const marketingSettingsQuery = useAdminMarketingSettings();
  const updateSettings = useUpdateAdminMarketingSettings();
  const socialProofQuery = useAdminSocialProof();
  const upsertSocialProof = useUpsertAdminSocialProof();
  const deleteSocialProof = useDeleteAdminSocialProof();
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const subscribersQuery = useAdminNewsletterSubscribers({ page: 1, limit: 20, search: subscriberSearch });
  const [socialProofForm, setSocialProofForm] = useState<SocialProofFormState>(defaultSocialProofForm);
  const [settingsForm, setSettingsForm] = useState(getDefaultMarketingSettings());

  useEffect(() => {
    if (marketingSettingsQuery.data) {
      setSettingsForm(marketingSettingsQuery.data);
    }
  }, [marketingSettingsQuery.data]);

  const socialProofItems = socialProofQuery.data ?? [];

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync(settingsForm);
      toast.success("Marketing ayarlari guncellendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Marketing ayarlari kaydedilemedi");
    }
  };

  const handleSaveSocialProof = async () => {
    try {
      await upsertSocialProof.mutateAsync({
        ...socialProofForm,
        icon: socialProofForm.icon || null,
        description: socialProofForm.description || null,
      });
      toast.success(socialProofForm.id ? "Sosyal kanit guncellendi" : "Sosyal kanit eklendi");
      setSocialProofForm(defaultSocialProofForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sosyal kanit kaydedilemedi");
    }
  };

  const handleDeleteSocialProof = async (id: string) => {
    try {
      await deleteSocialProof.mutateAsync(id);
      toast.success("Sosyal kanit silindi");
      if (socialProofForm.id === id) {
        setSocialProofForm(defaultSocialProofForm);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sosyal kanit silinemedi");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Marketing Ayarlari</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Newsletter, WhatsApp, canli destek, sosyal kanit ve homepage donusum modullerini tek yerden yonetin.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
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
                <Input value={settingsForm.newsletterSuccessMessage} onChange={(event) => setSettingsForm((current) => ({ ...current, newsletterSuccessMessage: event.target.value }))} />
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
                <Label>Canli Destek Provider</Label>
                <Select
                  value={settingsForm.liveSupportProvider}
                  onValueChange={(value) =>
                    setSettingsForm((current) => ({
                      ...current,
                      liveSupportProvider: value as "none" | "tawk" | "crisp" | "custom",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yok</SelectItem>
                    <SelectItem value="tawk">Tawk</SelectItem>
                    <SelectItem value="crisp">Crisp</SelectItem>
                    <SelectItem value="custom">Custom Script</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canli Destek Script URL</Label>
                <Input value={settingsForm.liveSupportScriptUrl ?? ""} onChange={(event) => setSettingsForm((current) => ({ ...current, liveSupportScriptUrl: event.target.value }))} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Loyalty Puan Orani</Label>
                <Input type="number" min="0" value={settingsForm.loyaltyPointsPerCurrency} onChange={(event) => setSettingsForm((current) => ({ ...current, loyaltyPointsPerCurrency: Number(event.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Referans Odul Puani</Label>
                <Input type="number" min="0" value={settingsForm.referralRewardPoints} onChange={(event) => setSettingsForm((current) => ({ ...current, referralRewardPoints: Number(event.target.value) || 0 }))} />
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
                { label: "Canli Destek Acik", key: "liveSupportEnabled" as const },
                { label: "Loyalty Sistemi Acik", key: "loyaltyEnabled" as const },
                { label: "Referral Sistemi Acik", key: "referralEnabled" as const },
                { label: "WhatsApp Mobilde Goster", key: "whatsappShowOnMobile" as const },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
                  <span className="text-sm font-medium">{item.label}</span>
                  <Switch
                    checked={settingsForm[item.key]}
                    onCheckedChange={(checked) => setSettingsForm((current) => ({ ...current, [item.key]: checked }))}
                  />
                </div>
              ))}
            </div>

            <Button onClick={() => void handleSaveSettings()} disabled={updateSettings.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Ayarlari Kaydet
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Sosyal Kanit Ogesi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={socialProofForm.label} onChange={(event) => setSocialProofForm((current) => ({ ...current, label: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input value={socialProofForm.value} onChange={(event) => setSocialProofForm((current) => ({ ...current, value: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input value={socialProofForm.icon} onChange={(event) => setSocialProofForm((current) => ({ ...current, icon: event.target.value }))} placeholder="Users / Star" />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={socialProofForm.sourceType}
                    onValueChange={(value) => setSocialProofForm((current) => ({ ...current, sourceType: value as "manual" | "derived" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="derived">Derived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sira</Label>
                  <Input type="number" min="0" value={socialProofForm.order} onChange={(event) => setSocialProofForm((current) => ({ ...current, order: Number(event.target.value) || 0 }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aciklama</Label>
                <Textarea value={socialProofForm.description} onChange={(event) => setSocialProofForm((current) => ({ ...current, description: event.target.value }))} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
                <span className="text-sm font-medium">Aktif</span>
                <Switch checked={socialProofForm.isActive} onCheckedChange={(checked) => setSocialProofForm((current) => ({ ...current, isActive: checked }))} />
              </div>

              <Button onClick={() => void handleSaveSocialProof()} disabled={upsertSocialProof.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {socialProofForm.id ? "Guncelle" : "Ekle"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sosyal Kanit Listesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {socialProofItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 p-3">
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() =>
                      setSocialProofForm({
                        id: item.id,
                        label: item.label,
                        value: item.value,
                        icon: item.icon ?? "",
                        description: item.description ?? "",
                        sourceType: item.sourceType,
                        isActive: item.isActive,
                        order: item.order,
                      })
                    }
                  >
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => void handleDeleteSocialProof(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

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
