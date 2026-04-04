# Cep Dunyasi

Next.js App Router, TypeScript, MongoDB/Mongoose, React Query, custom auth session, Iyzico ve Cloudflare R2 kullanan, admin panelli ozel e-ticaret uygulamasi.

Bu proje yalnizca urun vitrininden ibaret degildir. Kullanici tarafi, hesap alani, siparis ve odeme akislari, teknik servis, marketing modulleri ve operasyonel admin panelini ayni kod tabaninda toplar.

## One Cikan Ozellikler

### Magaza / public taraf
- Ana sayfa vitrini ve kampanya alanlari
- Urun katalogu, kategori filtreleri ve urun detay sayfalari
- Varyant secimi, favoriler ve sepet
- Checkout, kupon, taksit onizleme ve odeme sonucu sayfasi
- Yorum ve puan sistemi
- Teknik servis talep akisi
- Kurumsal ve yasal sayfalar

### Hesap alani
- Kayit / giris / cikis
- Profil, adresler ve sifre degistirme
- Siparis gecmisi ve siparis detayi
- Favoriler
- Iade / talep alanlari
- Teknik servis gecmisi
- Loyalty / referral ozeti

### Odeme ve siparis
- Iyzico checkout form baslatma
- Callback ile odeme sonucunu isleme
- Retry payment endpointi
- Payment status endpointi
- Coklu payment method yapisi
- Billing info snapshot ve order status history
- Bildirim altyapisi icin email/SMS future-ready servis katmani

### Marketing ve donusum
- Hero / campaign / popup banner alanlari
- Newsletter aboneligi
- Social proof bloklari
- Featured reviews
- WhatsApp ve canli destek ayarlari
- Referral ve loyalty altyapisi
- Marketing event tracking

### Admin panel
- Dashboard ve raporlar
- Urun, kategori, kupon ve banner yonetimi
- Marketing ayarlari ve newsletter listesi
- Siparis, shipment ve teknik servis operasyonlari
- Review moderasyonu
- Kullanici, rol ve yetki yonetimi
- Audit loglari
- Import / export

## Teknoloji Yigini

### Uygulama
- Next.js 16
- React 18
- TypeScript

### UI
- Tailwind CSS
- Radix UI
- shadcn/ui yapisi
- Framer Motion
- Embla Carousel
- Recharts
- Sonner

### Veri ve durum
- MongoDB
- Mongoose
- TanStack React Query
- Zustand
- React Hook Form
- Zod

### Entegrasyonlar
- Iyzico / iyzipay
- Cloudflare R2
- AWS S3 SDK

### Kalite
- ESLint
- Vitest

## Proje Yapisi

```text
app/
  Next.js sayfa route'lari ve API route handler'lari

src/screens/
  Sayfa seviyesinde ekran bilesenleri

src/components/
  Ortak UI, layout, home, reviews, marketing vb. bilesenler

src/hooks/
  React Query ve client-side hook'lar

src/lib/
  Tipler, formatter'lar, client helper'lari, marketing ve checkout yardimcilari

src/server/
  Mongo baglantisi, modeller, servisler, auth/session, storage ve backend mantigi

src/test/
  Vitest testleri
```

## Kritik Servis Katmani

Server tarafinda ayri servisler bulunur:

- `src/server/services/home-page.ts`
- `src/server/services/catalog-products.ts`
- `src/server/services/product-detail.ts`
- `src/server/services/checkout.ts`
- `src/server/services/iyzico.ts`
- `src/server/services/account.ts`
- `src/server/services/admin.ts`
- `src/server/services/admin-products.ts`
- `src/server/services/admin-categories.ts`
- `src/server/services/reviews.ts`
- `src/server/services/marketing.ts`
- `src/server/services/order-notifications.ts`
- `src/server/services/site-config.ts`
- `src/server/services/wishlist.ts`

Bu servisler, route handler ve ekran mantigini tek yerde toplamak yerine domain bazli ayirmaya baslanmis bir yapi saglar.

## Public Sayfalar

- `/`
- `/products`
- `/product/[slug]`
- `/cart`
- `/checkout`
- `/checkout/result`
- `/favorites`
- `/auth`
- `/technical-service`
- `/hakkimizda`
- `/iletisim`
- `/sss`
- `/gizlilik-politikasi`
- `/kvkk`
- `/iade-ve-degisim-politikasi`
- `/mesafeli-satis-sozlesmesi`
- `/teslimat-kosullari`

## Hesap Sayfalari

- `/account`
- `/account/profile`
- `/account/addresses`
- `/account/orders`
- `/account/orders/[orderId]`
- `/account/favorites`
- `/account/security`
- `/account/returns`
- `/account/technical-service`

## Admin Sayfalari

- `/admin`
- `/admin/products`
- `/admin/categories`
- `/admin/coupons`
- `/admin/banners`
- `/admin/marketing`
- `/admin/orders`
- `/admin/reports`
- `/admin/inventory`
- `/admin/reviews`
- `/admin/users`
- `/admin/roles`
- `/admin/logs`
- `/admin/site-content`
- `/admin/mission`
- `/admin/technical-service`
- `/admin/import-export`

## Onemli API Route'lari

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/auth/session`

### Urun ve katalog
- `POST /api/products/catalog`
- `GET /api/campaigns`
- `GET /api/pages/[slug]`

### Checkout ve odeme
- `POST /api/checkout`
- `POST /api/checkout/coupon-preview`
- `POST /api/checkout/installments-preview`
- `GET /api/checkout/payment-methods`
- `POST /api/checkout/retry-payment`
- `POST /api/payments/iyzico/checkout-form`
- `POST /api/payments/iyzico/callback`
- `GET /api/orders/[orderId]/payment-status`
- `GET /api/site-config/shipping`

### Account
- `GET/POST /api/account/addresses`
- `GET /api/account/orders`
- `GET /api/account/orders/[orderId]`
- `GET/PATCH /api/account/profile`
- `POST /api/account/security/change-password`
- `GET /api/account/favorites`
- `GET /api/account/marketing`

### Reviews
- `GET /api/reviews/list`
- `POST /api/reviews/create`
- `POST /api/reviews/helpful`
- `GET /api/reviews/featured`

### Marketing
- `GET /api/social-proof`
- `GET /api/marketing/settings`
- `POST /api/newsletter/subscribe`
- `POST /api/events/track`
- `GET /api/referral/resolve`
- `POST /api/referral/register`

### Admin
- `GET /api/admin/dashboard/summary`
- `GET /api/admin/reports`
- `GET /api/admin/orders/list`
- `GET /api/admin/orders/[orderId]`
- `POST /api/admin/orders/status`
- `POST /api/admin/shipments`
- `GET/POST /api/admin/products`
- `POST /api/admin/products/bulk`
- `POST /api/admin/products/import`
- `GET /api/admin/products/export`
- `GET/POST /api/admin/categories`
- `PATCH/DELETE /api/admin/categories/[categoryId]`
- `GET/POST/DELETE /api/admin/banners`
- `GET/PUT /api/admin/marketing/settings`
- `GET /api/admin/newsletter`
- `GET/POST/DELETE /api/admin/social-proof`
- `GET /api/admin/reviews/list`
- `POST /api/admin/reviews/approve`
- `POST /api/admin/reviews/reply`
- `POST /api/admin/reviews/delete`
- `GET/PATCH /api/admin/users`
- `GET/PATCH /api/admin/roles`
- `GET /api/admin/logs`

## Veri Modeli Ozet

Mongoose model katmani su ana alanlari kapsar:

- users
- products
- product_variants
- categories
- orders
- order_items
- shipments
- coupons
- site_contents / pages
- product_reviews
- audit_logs
- newsletter_subscribers
- marketing_settings
- marketing_events
- loyalty_transactions
- referrals
- payment_attempts
- notifications
- technical_service_requests

Model tanimlari su dosyada toplanir:
- [src/server/models/index.ts](/c:/Users/onurt/OneDrive/Masaüstü/cep_dunyasi/src/server/models/index.ts)

## Ortam Degiskenleri

`.env.local` dosyasini repo kokunde kendin olusturman gerekir.

### Zorunlu / ana degiskenler
- `MONGODB_URI`
- `AUTH_SESSION_SECRET`
- `IYZICO_API_KEY`
- `IYZICO_SECRET_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Mongo baglanti ayarlari
- `MONGODB_SERVER_SELECTION_TIMEOUT_MS`
- `MONGODB_DNS_SERVERS`
- `MONGODB_CONNECT_RETRIES`

### Iyzico
- `IYZICO_BASE_URL`

### Admin girisi
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Cloudflare R2
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_PUBLIC_BASE_URL`

### Checkout / banka havalesi
- `BANK_TRANSFER_IBAN`
- `BANK_TRANSFER_ACCOUNT_HOLDER`
- `BANK_TRANSFER_BANK_NAME`
- `BANK_TRANSFER_BRANCH_NAME`

### Checkout feature flags
- `NEXT_PUBLIC_ENABLE_BANK_TRANSFER`
- `NEXT_PUBLIC_ENABLE_CASH_ON_DELIVERY`
- `NEXT_PUBLIC_ENABLE_PAY_AT_STORE`

### Bildirimler
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SMS_WEBHOOK_URL`

### Gozlemlenebilirlik
- `ENABLE_SERVER_TIMING_LOGS`

## Kurulum

1. Bagimliliklari kur:

```bash
npm install
```

2. `.env.local` dosyasini repo kokunde olustur.

3. Gelistirme sunucusunu baslat:

```bash
npm run dev
```

4. Uygulamayi ac:

```text
http://localhost:3000
```

## Komutlar

- Gelistirme: `npm run dev`
- Build: `npm run build`
- Production baslatma: `npm run start`
- Lint: `npm run lint`
- Test: `npm run test`
- Watch mod test: `npm run test:watch`

## Dosya Yukleme ve Cloudflare R2

Aktif upload akislarinda R2 kullanilir:
- urun gorselleri
- teknik servis gorselleri
- site content / mission medya
- review ve diger belirli medya alanlari

Public medya akisinda:
- `app/media/[...objectKey]/route.ts`
- `src/server/storage/r2.ts`
- `src/lib/media.ts`

R2 public domain ve bucket ayarlari dogru degilse upload ve medya URL'leri calismaz.

## Seed ve Demo Veri

Uygulama bos veritabaniyla acildiginda ornek veri uretebilen seed mantigina sahiptir.

Icerik olarak tipik olarak:
- kategoriler
- ornek urunler
- kuponlar
- dashboard icin satis verisi
uretimi bulunur.

Ana seed dosyasi:
- `src/server/seed.ts`

## Bilinen Teknik Notlar

- Projede service-first yone gecis var ama `POST /api/db/query` gibi legacy generic veri erisim noktasi halen tamamen kapanmis degil.
- Admin ve marketing tarafi son donemde genisletildi; eski dokumanlar bunlari eksik anlatabilir.
- README bu dosya ile birlikte bugunku kod tabanina gore guncellenmistir.

## Gelistirme Oncelikleri

Orta vadede en mantikli teknik adimlar:
- generic `/api/db/query` bagimliligini daha da azaltmak
- promosyon / indirim kurallari icin ayri bir promotion engine kurmak
- test coverage'i checkout, catalog ve admin operasyonlarinda genisletmek
- production observability ve error tracking katmanini sertlestirmek

## Lisans / Not

Bu repo ozel gelistirme projesidir. Ticari kullanim, devir veya ajans teslimi yapilacaksa;
env yonetimi, odeme anahtarlari, medya erisimleri ve operasyonel guvenlik ayrica gozden gecirilmelidir.
