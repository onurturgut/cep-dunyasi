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
import { useI18n } from "@/i18n/provider";
import { toast } from "sonner";

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
  const { locale } = useI18n();

  const copy =
    locale === "en"
      ? {
          badge: "Technical Service Support",
          heroTitle: "Cep Dunyasi Technical Service and Phone Repair",
          heroDescription:
            "Create a fast technical service request for phone issues. Share your device model, issue details, and optionally a photo for screen cracks, battery issues, charging port faults, camera problems, audio problems, and other phone malfunctions. Once your request reaches our technical service team, it is reviewed and you receive feedback as soon as possible.",
          sideTitle: "What we need for a phone repair request",
          sideDescription: "Share these details for faster support.",
          infoCards: [
            {
              title: "Phone model",
              description: "Example: iPhone 13, Samsung S24, Redmi Note 13 or any device model.",
            },
            {
              title: "Issue description",
              description: "Details such as a cracked screen, not charging, overheating, camera, or audio issues.",
            },
            {
              title: "Supporting photo",
              description: "If available, upload a photo showing the damage or issue to speed up the preliminary review.",
            },
          ],
          highlights: [
            {
              title: "Faster technical service intake",
              description: "The information you provide about the phone issue speeds up the first review and helps us guide you more clearly.",
            },
            {
              title: "Pre-assessment aligned with the repair process",
              description: "Your request is reviewed in detail for screen replacement, battery issues, charging socket faults, and other technical problems.",
            },
            {
              title: "Easier issue diagnosis with photos",
              description: "Upload a photo of the damage or problem to help the technical service team complete a quicker pre-review.",
            },
          ],
          faqTitle: "Frequently Asked Technical Service Questions",
          faqDescription: "Common questions about the phone repair and technical service process.",
          faqItems: [
            {
              value: "screen",
              question: "How can I create a technical service request for a broken phone screen or touch issue?",
              answer:
                "You can create a request easily by entering your device model and screen-related issue in the Cep Dunyasi technical service form. Our team will let you know whether a screen replacement, glass repair, or a more detailed inspection is needed.",
            },
            {
              value: "battery",
              question: "Can I get support for battery issues, fast battery drain, or overheating?",
              answer:
                "Yes. You can describe issues such as battery performance drops, overheating, sudden shutdowns, or charging problems in the description field. Uploading a photo can make the preliminary review easier for our technical team.",
            },
            {
              value: "camera",
              question: "Is sending the form enough for camera, speaker, or charging port faults?",
              answer:
                "It is enough for the first application. If you explain when the problem started, whether the device was dropped, and which function no longer works, the technical service process can move faster.",
            },
            {
              value: "time",
              question: "What happens after the technical service form is submitted?",
              answer:
                "After your technical service request reaches us, it is recorded in the system, appears in the admin panel, and is reviewed by the technical team. When necessary, we contact you and inform you about the next steps.",
            },
          ],
          afterTitle: "What happens after you submit the technical service form?",
          afterSteps: [
            "Your request is recorded in the system and appears as a new application in the panel.",
            "The technical team performs the first review based on your phone model and issue description.",
            "If needed, you are contacted and informed about the phone repair or next service steps.",
          ],
          formTitle: "Technical Service Form",
          formDescription: "Share your name, phone, model, issue details, and a photo to create a phone repair request.",
          firstName: "First Name",
          firstNamePlaceholder: "Your first name",
          lastName: "Last Name",
          lastNamePlaceholder: "Your last name",
          phone: "Phone Number",
          phonePlaceholder: "05xx xxx xx xx",
          model: "Phone Model",
          modelPlaceholder: "Example: iPhone 14 Pro",
          descriptionLabel: "Description",
          descriptionPlaceholder: "Describe the issue with your phone in detail.",
          photo: "Upload Photo",
          photoHint: "Adding a photo is optional. You can upload an image up to 8MB.",
          selectedFile: (fileName: string) => `Selected file: ${fileName}`,
          submitting: "Sending...",
          submit: "Submit Form",
          submitError: "Form could not be submitted",
          submitSuccess: "Your technical service form has been received",
          submitFailure: "Form submission error",
        }
      : {
          badge: "Teknik Servis Destegi",
          heroTitle: "Cep Dunyasi Teknik Servis ve Telefon Tamiri",
          heroDescription:
            "Cep telefonu arizalari icin hizli teknik servis kaydi olusturun. Ekran kirigi, batarya sorunu, sarj soketi arizasi, kamera problemi, ses problemi ve diger telefon arizalari icin cihaz modelinizi, yasadiginiz sorunu ve varsa fotografi iletin. Talebiniz teknik servis ekibimize ulastiktan sonra incelenir ve size en kisa surede geri donus saglanir.",
          sideTitle: "Telefon ariza kaydi icin gerekli bilgiler",
          sideDescription: "Hızlı teknik destek icin bu bilgileri paylasabilirsiniz.",
          infoCards: [
            {
              title: "Telefon modeli",
              description: "Ornek: iPhone 13, Samsung S24, Redmi Note 13 gibi cihaz modeli bilgisi.",
            },
            {
              title: "Telefon arizasinin aciklamasi",
              description: "Ekran kirigi, sarj almama, isinma, kamera veya ses problemi gibi detaylar.",
            },
            {
              title: "Destekleyici fotograf",
              description: "Varsa hasari veya ariza durumunu gosteren fotograf ile on incelemeyi kolaylastirin.",
            },
          ],
          highlights: [
            {
              title: "Hızlı teknik servis bilgilendirmesi",
              description: "Telefon arizasi icin ilettiginiz bilgiler ilk inceleme surecini hizlandirir ve size daha net yonlendirme yapilmasini saglar.",
            },
            {
              title: "Telefon tamiri surecine uygun on degerlendirme",
              description: "Ekran degisimi, batarya sorunu, sarj soketi arizasi veya diger teknik problemler icin kaydiniz detayli sekilde incelenir.",
            },
            {
              title: "Fotograf ile daha kolay ariza tespiti",
              description: "Cihazdaki hasari veya problemi gosteren bir fotograf yukleyerek teknik servis ekibinin on inceleme yapmasini kolaylastirabilirsiniz.",
            },
          ],
          faqTitle: "Sik Sorulan Teknik Servis Sorulari",
          faqDescription: "Telefon tamiri ve teknik servis sureciyle ilgili merak edilen sorular.",
          faqItems: [
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
                "Evet. Batarya performansinda dusus, asiri isinma, ani kapanma veya sarj problemi gibi durumlari formdaki aciklama alanina yazabilirsiniz. Fotograf yuklemeniz halinde teknik servis ekibi on degerlendirmeyi daha kolay yapabilir.",
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
          ],
          afterTitle: "Teknik servis formu gonderildikten sonra ne olur?",
          afterSteps: [
            "Teknik servis talebiniz sistemde kayit altina alinir ve panelde yeni basvuru olarak gorunur.",
            "Telefon modeli ve ariza aciklamaniza gore teknik ekip ilk incelemeyi yapar.",
            "Gerekirse size ulasilir ve telefon tamiri ya da sonraki servis sureciyle ilgili bilgilendirme yapilir.",
          ],
          formTitle: "Teknik Servis Formu",
          formDescription: "Telefon arizasi kaydi icin ad, soyad, telefon, model, aciklama ve fotograf bilgilerini iletin.",
          firstName: "Ad",
          firstNamePlaceholder: "Adiniz",
          lastName: "Soyad",
          lastNamePlaceholder: "Soyadiniz",
          phone: "Telefon Numarasi",
          phonePlaceholder: "05xx xxx xx xx",
          model: "Cep Telefonu Modeli",
          modelPlaceholder: "Ornek: iPhone 14 Pro",
          descriptionLabel: "Aciklama",
          descriptionPlaceholder: "Telefonunuzdaki sorunu detayli olarak yazin.",
          photo: "Fotograf Yukle",
          photoHint: "Fotograf eklemek opsiyoneldir. En fazla 8MB boyutunda görsel yukleyebilirsiniz.",
          selectedFile: (fileName: string) => `Secilen dosya: ${fileName}`,
          submitting: "Gonderiliyor...",
          submit: "Formu Gonder",
          submitError: "Form gonderilemedi",
          submitSuccess: "Teknik servis formunuz alindi",
          submitFailure: "Form gonderme hatasi",
        };

  const highlightIcons = [ShieldCheck, Wrench, FileImage];

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
        throw new Error(payload?.error?.message || copy.submitError);
      }

      toast.success(copy.submitSuccess);
      setForm(defaultForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.submitFailure);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(152,17,30,0.14),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.98))] py-14 dark:bg-[radial-gradient(circle_at_top_left,_rgba(152,17,30,0.22),_transparent_38%),linear-gradient(180deg,rgba(13,13,14,0.92),rgba(13,13,14,0.98))]">
        <div className="container">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
            {copy.badge}
          </Badge>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">{copy.heroTitle}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{copy.heroDescription}</p>
            </div>

            <Card className="border-primary/15 bg-card/90 shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-xl">{copy.sideTitle}</CardTitle>
                <CardDescription>{copy.sideDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {copy.infoCards.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {copy.highlights.map((item, index) => {
            const Icon = highlightIcons[index] || ShieldCheck;

            return (
              <Card key={item.title} className="rounded-3xl border-border/70 bg-card/75 p-2 sm:p-4">
                <CardHeader className="space-y-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">{item.title}</CardTitle>
                    <CardDescription className="mt-3 text-base leading-7">{item.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container relative pb-14">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-border/70">
              <CardHeader>
                <CardTitle className="text-2xl">{copy.faqTitle}</CardTitle>
                <CardDescription>{copy.faqDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {copy.faqItems.map((item) => (
                    <AccordionItem key={item.value} value={item.value}>
                      <AccordionTrigger className="text-left text-base hover:no-underline">{item.question}</AccordionTrigger>
                      <AccordionContent className="text-sm leading-6 text-muted-foreground">{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 bg-secondary/25">
              <CardHeader>
                <CardTitle className="text-xl">{copy.afterTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {copy.afterSteps.map((step) => (
                  <div key={step} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <p>{step}</p>
                  </div>
                ))}
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
                  <CardTitle className="text-2xl">{copy.formTitle}</CardTitle>
                  <CardDescription>{copy.formDescription}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{copy.firstName}</Label>
                    <Input id="firstName" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} placeholder={copy.firstNamePlaceholder} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{copy.lastName}</Label>
                    <Input id="lastName" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} placeholder={copy.lastNamePlaceholder} required />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">{copy.phone}</Label>
                    <Input
                      id="phoneNumber"
                      value={form.phoneNumber}
                      onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                      placeholder={copy.phonePlaceholder}
                      inputMode="tel"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneModel">{copy.model}</Label>
                    <Input id="phoneModel" value={form.phoneModel} onChange={(event) => setForm((current) => ({ ...current, phoneModel: event.target.value }))} placeholder={copy.modelPlaceholder} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDescription">{copy.descriptionLabel}</Label>
                  <Textarea
                    id="issueDescription"
                    value={form.issueDescription}
                    onChange={(event) => setForm((current) => ({ ...current, issueDescription: event.target.value }))}
                    placeholder={copy.descriptionPlaceholder}
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">{copy.photo}</Label>
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
                  <p className="text-xs text-muted-foreground">{copy.photoHint}</p>
                  {form.photo ? <p className="text-sm font-medium text-foreground">{copy.selectedFile(form.photo.name)}</p> : null}
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? copy.submitting : copy.submit}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}

