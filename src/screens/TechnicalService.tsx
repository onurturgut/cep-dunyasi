"use client";

import { useState } from "react";
import { CheckCircle2, FileImage, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const serviceHighlights = [
  {
    title: "Hızlı teknik servis bilgilendirmesi",
    description: "Telefon arızası için ilettiğiniz bilgiler ilk inceleme sürecini hızlandırır ve size daha net yönlendirme yapılmasını sağlar.",
    icon: ShieldCheck,
  },
  {
    title: "Telefon tamiri sürecine uygun ön değerlendirme",
    description: "Ekran değişimi, batarya sorunu, şarj soketi arızası veya diğer teknik problemler için kaydınız detaylı şekilde incelenir.",
    icon: Wrench,
  },
  {
    title: "Fotoğraf ile daha kolay arıza tespiti",
    description: "Cihazdaki hasarı veya problemi gösteren bir fotoğraf yükleyerek teknik servis ekibinin ön inceleme yapmasını kolaylaştırabilirsiniz.",
    icon: FileImage,
  },
];

const faqItems = [
  {
    value: "screen",
    question: "Telefon ekran kırığı veya dokunmatik sorunu için teknik servis kaydı nasıl oluşturabilirim?",
    answer:
      "Cep Dünyası teknik servis formunda cihaz modelinizi ve ekranla ilgili sorunu yazarak kolayca kayıt oluşturabilirsiniz. Teknik ekibimiz ekran değişimi, cam işlemi veya detaylı inceleme gerekip gerekmediği konusunda size bilgi verir.",
  },
  {
    value: "battery",
    question: "Batarya sorunu, şarj çabuk bitmesi veya telefon ısınması için destek alabilir miyim?",
    answer:
      "Evet. Batarya performansında düşüş, aşırı ısınma, ani kapanma veya şarj problemi gibi durumları formdaki açıklama alanına yazabilirsiniz. Fotoğraf yüklemeniz halinde teknik servis ekibi ön değerlendirmeyi daha kolay yapabilir.",
  },
  {
    value: "camera",
    question: "Kamera, hoparlör veya şarj soketi arızaları için form göndermek yeterli mi?",
    answer:
      "İlk başvuru için yeterlidir. Sorunun ne zaman başladığını, cihazın darbe alıp almadığını ve hangi özelliğin çalışmadığını yazarsanız teknik servis süreci daha hızlı ilerler.",
  },
  {
    value: "time",
    question: "Teknik servis formu gönderildikten sonra süreç nasıl ilerliyor?",
    answer:
      "Teknik servis talebiniz bize ulaştıktan sonra sistemde kayıt altına alınır, admin panelinde görüntülenir ve teknik ekip tarafından incelenir. Gerekli durumlarda size ulaşılır ve sonraki adımlar hakkında bilgilendirme yapılır.",
  },
];

type ServiceFormState = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneModel: string;
  issueDescription: string;
  photo: File | null;
};

const defaultForm: ServiceFormState = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  phoneModel: "",
  issueDescription: "",
  photo: null,
};

export default function TechnicalService() {
  const [form, setForm] = useState<ServiceFormState>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = new FormData();
    body.append("firstName", form.firstName);
    body.append("lastName", form.lastName);
    body.append("phoneNumber", form.phoneNumber);
    body.append("phoneModel", form.phoneModel);
    body.append("issueDescription", form.issueDescription);

    if (form.photo) {
      body.append("photo", form.photo);
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/technical-service/requests", {
        method: "POST",
        body,
      });

      const payload = await response.json();

      if (!response.ok || payload?.error) {
        throw new Error(payload?.error?.message || "Form gönderilemedi");
      }

      toast.success("Teknik servis formunuz alındı");
      setForm(defaultForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Form gönderme hatası");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(152,17,30,0.14),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.98))] py-14 dark:bg-[radial-gradient(circle_at_top_left,_rgba(152,17,30,0.22),_transparent_38%),linear-gradient(180deg,rgba(13,13,14,0.92),rgba(13,13,14,0.98))]">
        <div className="container">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
            Teknik Servis Desteği
          </Badge>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Cep Dünyası Teknik Servis ve Telefon Tamiri
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Cep telefonu arızaları için hızlı teknik servis kaydı oluşturun. Ekran kırığı, batarya sorunu, şarj soketi
                arızası, kamera problemi, ses problemi ve diğer telefon arızaları için cihaz modelinizi, yaşadığınız sorunu
                ve varsa fotoğrafı iletin. Talebiniz teknik servis ekibimize ulaştıktan sonra incelenir ve size en kısa
                sürede geri dönüş sağlanır.
              </p>
            </div>

            <Card className="border-primary/15 bg-card/90 shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-xl">Telefon arıza kaydı için gerekli bilgiler</CardTitle>
                <CardDescription>Hızlı teknik destek için bu bilgileri paylaşabilirsiniz.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">Telefon modeli</p>
                  <p className="mt-1 text-sm text-muted-foreground">Örnek: iPhone 13, Samsung S24, Redmi Note 13 gibi cihaz modeli bilgisi.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">Telefon arızasının açıklaması</p>
                  <p className="mt-1 text-sm text-muted-foreground">Ekran kırığı, şarj almama, ısınma, kamera veya ses problemi gibi detaylar.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">Destekleyici fotoğraf</p>
                  <p className="mt-1 text-sm text-muted-foreground">Varsa hasarı veya arıza durumunu gösteren fotoğraf ile ön incelemeyi kolaylaştırın.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {serviceHighlights.map((item) => (
            <Card key={item.title} className="rounded-3xl border-border/70 bg-card/75 p-2 sm:p-4">
              <CardHeader className="space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl">{item.title}</CardTitle>
                  <CardDescription className="mt-3 text-base leading-7">{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-14 relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="space-y-6">
            <Card className="rounded-3xl border-border/70">
              <CardHeader>
                <CardTitle className="text-2xl">Sık Sorulan Teknik Servis Soruları</CardTitle>
                <CardDescription>Telefon tamiri ve teknik servis süreciyle ilgili merak edilen sorular.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item) => (
                    <AccordionItem key={item.value} value={item.value}>
                      <AccordionTrigger className="text-left text-base hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-6 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 bg-secondary/25">
              <CardHeader>
                <CardTitle className="text-xl">Teknik servis formu gönderildikten sonra ne olur?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Teknik servis talebiniz sistemde kayıt altına alınır ve panelde yeni başvuru olarak görünür.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Telefon modeli ve arıza açıklamanıza göre teknik ekip ilk incelemeyi yapar.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Gerekirse size ulaşılır ve telefon tamiri ya da sonraki servis süreciyle ilgili bilgilendirme yapılır.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="sticky top-28 z-10 rounded-[2rem] border-border/70 shadow-lg shadow-black/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Teknik Servis Formu</CardTitle>
                  <CardDescription>Telefon arızası kaydı için ad, soyad, telefon, model, açıklama ve fotoğraf bilgilerini iletin.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                      placeholder="Adınız"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                      placeholder="Soyadınız"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                    <Input
                      id="phoneNumber"
                      value={form.phoneNumber}
                      onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                      placeholder="05xx xxx xx xx"
                      inputMode="tel"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneModel">Cep Telefonu Modeli</Label>
                    <Input
                      id="phoneModel"
                      value={form.phoneModel}
                      onChange={(event) => setForm((current) => ({ ...current, phoneModel: event.target.value }))}
                      placeholder="Örnek: iPhone 14 Pro"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDescription">Açıklama</Label>
                  <Textarea
                    id="issueDescription"
                    value={form.issueDescription}
                    onChange={(event) => setForm((current) => ({ ...current, issueDescription: event.target.value }))}
                    placeholder="Telefonunuzdaki sorunu detaylı olarak yazin."
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Fotoğraf Yukle</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        photo: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Fotoğraf eklemek opsiyoneldir. En fazla 8MB boyutunda görsel yükleyebilirsiniz.
                  </p>
                  {form.photo ? (
                    <p className="text-sm font-medium text-foreground">Secilen dosya: {form.photo.name}</p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? "Gonderiliyor..." : "Formu Gonder"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
