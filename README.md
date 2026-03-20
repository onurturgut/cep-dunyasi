# Cep Dunyasi

Next.js 16 + MongoDB + Iyzico ile gelistirilmis, admin panelli bir e-ticaret uygulamasi.

## Ozellikler

- Urun listeleme ve urun detay sayfalari
- Kategori bazli filtreleme
- Sepet ve checkout akisi
- Kupon uygulama
- Iyzico ile odeme baslatma ve callback yonetimi
- Kullanici kayit/giris cikis
- Rol bazli admin paneli (urun, siparis, kupon)
- MongoDB tabanli veri modeli

## Teknoloji
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- Mongoose (MongoDB)
- Iyzipay Node SDK
- Zustand (sepet state)

## Proje Yapisi

- `app/`: Next.js route ve API endpointleri
- `src/screens/`: UI ekran bilesenleri
- `src/components/`: ortak UI/layout bilesenleri
- `src/server/`: Mongo baglanti, modeller, seed
- `src/integrations/mongo/client.ts`: istemci tarafi DB/Auth adapter
- `public/images/image.png`: header logosu

## Gereksinimler

- Node.js 20+
- npm
- Calisan bir MongoDB (lokalde servis ya da uzak URI)

## Kurulum

1. Bagimliliklari kur:

```bash
npm install
```

2. Ortam degiskenlerini olustur:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. `.env.local` dosyasini duzenle.

4. Gelistirme sunucusunu baslat:

```bash
npm run dev
```

Uygulama varsayilan olarak `http://localhost:3000` adresinde acilir.

## Ortam Degiskenleri

`.env.local` icin gerekli degiskenler:

- `MONGODB_URI`: Mongo baglanti adresi
- `MONGODB_SERVER_SELECTION_TIMEOUT_MS`: (Opsiyonel) Mongo baglanti bekleme suresi, milisaniye (varsayilan `10000`)
- `IYZICO_API_KEY`: Iyzico API key
- `IYZICO_SECRET_KEY`: Iyzico secret key
- `IYZICO_BASE_URL`: Genelde sandbox icin `https://sandbox-api.iyzipay.com`
- `NEXT_PUBLIC_SITE_URL`: Ornek `http://localhost:3000`

## Admin Paneli Girisi

- Admin rotasi: `/admin`
- Normal kayit olan kullanicilar varsayilan olarak `customer` olur.
- Admin girisi `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ortam degiskenleri ile yapilir.

Admin giris kodu: `app/api/auth/signin/route.ts`

## Seed (Ornek Veri)

Uygulama, DB bos/eksikse otomatik seed atar:

- Kategoriler: telefon, kilif, sarj-aleti, power-bank, teknik-servis
- Ornek urunler: toplam 100 urun (telefon, 2. el, akilli saat, kilif, sarj, power bank, teknik servis dagilimli)
- Ornek kuponlar:
  - HOSGELDIN10 (%10, min sepet 2000)
  - SEPET500 (500 TL, min sepet 10000)
- Ornek satis verisi: 100 adet sahte siparis + siparis kalemi (dashboard analizleri icin)
- Tetiklenme: ilk `POST /api/db/query` isteginde otomatik kontrol edilir ve eksikler eklenir.

Seed kodu: `src/server/seed.ts`

## Komutlar

- Gelistirme: `npm run dev`
- Build: `npm run build`
- Production baslatma: `npm run start`
- Lint: `npm run lint`
- Test: `npm run test`

## API Endpointleri (Ozet)

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `POST /api/db/query`
- `POST /api/rpc`
- `POST /api/payments/iyzico/checkout-form`
- `POST /api/payments/iyzico/callback`

## Sik Karsilasilan Sorunlar

### 1) `POST /api/auth/signup 500`

Muhtemel sebepler:

- `.env.local` yok
- `MONGODB_URI` bos/yanlis
- MongoDB Atlas IP whitelist'te mevcut public IP yok
- `next dev` yeniden baslatilmadi

Cozum:

1. `.env.local` dosyasini kontrol et
2. Mongo servisinin calistigini dogrula
3. Dev serveri kapatip tekrar ac (`npm run dev`)

### 2) "Bu e-posta zaten kayitli"

- Ayni e-posta ile tekrar kayit deneniyor.
- Farkli e-posta ile kayit ol ya da giris yap.

## Notlar

- Frontend auth oturumu localStorage uzerinden tutulur.
- Iyzico callback sonrasi siparisin `payment_status` ve `order_status` degerleri guncellenir.
- Header logosu: `public/images/image.png`
