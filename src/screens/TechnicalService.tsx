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
    title: "Hizli teknik servis bilgilendirmesi",
    description: "Telefon arizasi icin ilettiginiz bilgiler ilk inceleme surecini hizlandirir ve size daha net yonlendirme yapilmasini saglar.",
    icon: ShieldCheck,
  },
  {
    title: "Telefon tamiri surecine uygun on degerlendirme",
    description: "Ekran degisimi, batarya sorunu, sarj soketi arizasi veya diger teknik problemler icin kaydiniz detayli sekilde incelenir.",
    icon: Wrench,
  },
  {
    title: "Fotograf ile daha kolay ariza tespiti",
    description: "Cihazdaki hasari veya problemi gosteren bir fotograf yukleyerek teknik servis ekibinin on inceleme yapmasini kolaylastirabilirsiniz.",
    icon: FileImage,
  },
];

const faqItems = [
  {
    value: "screen",
    question: "Telefon ekran kirigi veya dokunmatik sorunu icin teknik servis kaydi nasil olusturabilirim?",
    answer:
      "Cep Dunyasi teknik servis formunda cihaz modelinizi ve ekranla ilgili sorunu yazarak kolayca kayit olusturabilirsiniz. Teknik ekibimiz ekran degisimi, cam islemi veya detayli inceleme gerekip gerekmedigi konusunda size bilgi verir.",
  },
  {
    value: "battery",
    question: "Batarya sorunu, sarj cabuk bitmesi veya telefon isinmasi icin destek alabilir miyim?",
    answer:
      "Evet. Batarya performansi dusmesi, asiri isinma, ani kapanma veya sarj problemi gibi durumlari formdaki aciklama alanina yazabilirsiniz. Fotograf yuklemeniz halinde teknik servis ekibi on degerlendirmeyi daha kolay yapabilir.",
  },
  {
    value: "camera",
    question: "Kamera, hoparlor veya sarj soketi arizalari icin form gondermek yeterli mi?",
    answer:
      "Ilk basvuru icin yeterlidir. Sorunun ne zaman basladigini, cihazin darbe alip almadigini ve hangi ozelligin calismadigini yazarsaniz teknik servis sureci daha hizli ilerler.",
  },
  {
    value: "time",
    question: "Teknik servis formu gonderildikten sonra surec nasil ilerliyor?",
    answer:
      "Teknik servis talebiniz bize ulastiktan sonra sistemde kayit altina alinir, admin panelinde goruntulenir ve teknik ekip tarafindan incelenir. Gerekli durumlarda size ulasilir ve sonraki adimlar hakkinda bilgilendirme yapilir.",
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
        throw new Error(payload?.error?.message || "Form gonderilemedi");
      }

      toast.success("Teknik servis formunuz alindi");
      setForm(defaultForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Form gonderme hatasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(152,17,30,0.14),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.98))] py-14 dark:bg-[radial-gradient(circle_at_top_left,_rgba(152,17,30,0.22),_transparent_38%),linear-gradient(180deg,rgba(13,13,14,0.92),rgba(13,13,14,0.98))]">
        <div className="container">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
            Teknik Servis Destegi
          </Badge>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Cep Dunyasi Teknik Servis ve Telefon Tamiri
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Cep telefonu arizalari icin hizli teknik servis kaydi olusturun. Ekran kirigi, batarya sorunu, sarj soketi
                arizasi, kamera problemi, ses problemi ve diger telefon arizalari icin cihaz modelinizi, yasadiginiz sorunu
                ve varsa fotografi iletin. Talebiniz teknik servis ekibimize ulastiktan sonra incelenir ve size en kisa
                surede geri donus saglanir.
              </p>
            </div>

            <Card className="border-primary/15 bg-card/90 shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-xl">Telefon ariza kaydi icin gerekli bilgiler</CardTitle>
                <CardDescription>Hizli teknik destek icin bu bilgileri paylasabilirsiniz.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">Telefon modeli</p>
                  <p className="mt-1 text-sm text-muted-foreground">Ornek: iPhone 13, Samsung S24, Redmi Note 13 gibi cihaz modeli bilgisi.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">Telefon arizasinin aciklamasi</p>
                  <p className="mt-1 text-sm text-muted-foreground">Ekran kirigi, sarj almama, isinma, kamera veya ses problemi gibi detaylar.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">Destekleyici fotograf</p>
                  <p className="mt-1 text-sm text-muted-foreground">Varsa hasari veya ariza durumunu gosteren fotograf ile on incelemeyi kolaylastirin.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {serviceHighlights.map((item) => (
            <Card key={item.title} className="rounded-3xl border-border/70 bg-card/75">
              <CardHeader className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="mt-2 leading-6">{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-14">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-border/70">
              <CardHeader>
                <CardTitle className="text-2xl">Sik Sorulan Teknik Servis Sorulari</CardTitle>
                <CardDescription>Telefon tamiri ve teknik servis sureciyle ilgili merak edilen sorular.</CardDescription>
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
                <CardTitle className="text-xl">Teknik servis formu gonderildikten sonra ne olur?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Teknik servis talebiniz sistemde kayit altina alinir ve panelde yeni basvuru olarak gorunur.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Telefon modeli ve ariza aciklamaniza gore teknik ekip ilk incelemeyi yapar.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Gerekirse size ulasilir ve telefon tamiri ya da sonraki servis sureciyle ilgili bilgilendirme yapilir.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2rem] border-border/70 shadow-lg shadow-black/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Teknik Servis Formu</CardTitle>
                  <CardDescription>Telefon arizasi kaydi icin ad, soyad, telefon, model, aciklama ve fotograf bilgilerini iletin.</CardDescription>
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
                      placeholder="Adiniz"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                      placeholder="Soyadiniz"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Telefon Numarasi</Label>
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
                      placeholder="Ornek: iPhone 14 Pro"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDescription">Aciklama</Label>
                  <Textarea
                    id="issueDescription"
                    value={form.issueDescription}
                    onChange={(event) => setForm((current) => ({ ...current, issueDescription: event.target.value }))}
                    placeholder="Telefonunuzdaki sorunu detayli olarak yazin."
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Fotograf Yukle</Label>
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
                    Fotograf eklemek opsiyoneldir. En fazla 8MB boyutunda gorsel yukleyebilirsiniz.
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
