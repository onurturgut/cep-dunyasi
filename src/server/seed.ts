import fs from "node:fs/promises";
import path from "node:path";
import { Category, Coupon, MissionItem, Order, OrderItem, Product, ProductVariant, SiteContent } from "@/server/models";
import { getObjectKeyFromMediaUrl, normalizeMediaUrl, uploadToR2 } from "@/server/storage/r2";

let seeded = false;
let seedPromise: Promise<void> | null = null;
const migratedProductImageCache = new Map<string, Promise<string>>();

type ProductSample = {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  brand: string;
  type: "phone" | "accessory" | "service";
  image: string;
  phoneModelKey?: IphoneModelKey;
  variant: {
    sku: string;
    attributes: Record<string, string>;
    price: number;
    stock: number;
  };
};

type CouponSample = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_amount: number;
  usage_limit: number;
  is_active: boolean;
};

type GeneratedProductTemplate = {
  namePrefix: string;
  slugPrefix: string;
  skuPrefix: string;
  description: string;
  categorySlug: string;
  brand: string;
  type: "phone" | "accessory" | "service";
  image: string;
  phoneModelKey?: IphoneModelKey;
  basePrice: number;
  baseStock: number;
};

type IphoneModelKey =
  | "iphone-15"
  | "iphone-15-plus"
  | "iphone-15-pro"
  | "iphone-15-pro-max"
  | "iphone-14-pro"
  | "iphone-14-plus"
  | "iphone-13-pro-max";

type SeedVariantRecord = {
  id: string;
  product_id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
};

type FakeSaleTemplate = {
  token: string;
  createdAt: Date;
  order: {
    guest_token: string;
    total_price: number;
    discount: number;
    shipping_price: number;
    final_price: number;
    payment_provider: string;
    payment_status: string;
    order_status: string;
    shipping_address: {
      full_name: string;
      city: string;
      district: string;
      line1: string;
      postal_code: string;
      phone: string;
    };
    created_at: Date;
    updated_at: Date;
  };
  items: Array<{
    variant_id: string;
    product_name: string;
    variant_info: string | null;
    quantity: number;
    unit_price: number;
    created_at: Date;
  }>;
};

const categorySeeds = [
  { name: "Telefon", slug: "telefon", icon: "Smartphone" },
  { name: "2. El Telefonlar", slug: "ikinci-el-telefon", icon: "Smartphone" },
  { name: "Akilli Saatler", slug: "akilli-saatler", icon: "Watch" },
  { name: "Kilif", slug: "kilif", icon: "ShieldCheck" },
  { name: "Sarj Aleti", slug: "sarj-aleti", icon: "BatteryCharging" },
  { name: "Power Bank", slug: "power-bank", icon: "Battery" },
  { name: "Teknik Servis", slug: "teknik-servis", icon: "Wrench" },
];

const baseProductSeeds: ProductSample[] = [
  {
    name: "iPhone 15 Pro Max",
    slug: "iphone-15-pro-max",
    description: "Titanium govdeye sahip premium iPhone modeli.",
    categorySlug: "telefon",
    brand: "Apple",
    type: "phone",
    image: "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg",
    phoneModelKey: "iphone-15-pro-max",
    variant: {
      sku: "IPHONE-15-PROMAX-256-BLK",
      attributes: { renk: "Siyah", hafiza: "256GB" },
      price: 76999,
      stock: 12,
    },
  },
  {
    name: "Hizli USB-C Sarj Aleti",
    slug: "hizli-usb-c-sarj-aleti",
    description: "65W hizli sarj adaptor",
    categorySlug: "sarj-aleti",
    brand: "Anker",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=1200&q=80",
    variant: {
      sku: "ANKER-65W-USB-C",
      attributes: { guc: "65W" },
      price: 1499,
      stock: 45,
    },
  },
  {
    name: "iPhone 15",
    slug: "iphone-15",
    description: "Yeni nesil iPhone performansi ve kamera kalitesi",
    categorySlug: "telefon",
    brand: "Apple",
    type: "phone",
    image: "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-1.jpg",
    phoneModelKey: "iphone-15",
    variant: {
      sku: "IPHONE-15-128-BLK",
      attributes: { renk: "Siyah", hafiza: "128GB" },
      price: 57999,
      stock: 10,
    },
  },
  {
    name: "Spigen Kilif AirFit",
    slug: "spigen-kilif-airfit",
    description: "iPhone 15 ile uyumlu ince ve darbe emici kilif",
    categorySlug: "kilif",
    brand: "Spigen",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=1200&q=80",
    variant: {
      sku: "SPIGEN-AIRFIT-IP15",
      attributes: { renk: "Mat Siyah", uyumluluk: "iPhone 15" },
      price: 899,
      stock: 35,
    },
  },
  {
    name: "Xiaomi Redmi Watch 4",
    slug: "xiaomi-redmi-watch-4",
    description: "AMOLED ekranli akilli saat ve uzun pil omru",
    categorySlug: "akilli-saatler",
    brand: "Xiaomi",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=1200&q=80",
    variant: {
      sku: "REDMI-WATCH-4-BLK",
      attributes: { renk: "Siyah", ekran: "1.97 AMOLED" },
      price: 5499,
      stock: 22,
    },
  },
  {
    name: "Anker 20000 mAh Power Bank",
    slug: "anker-20000-power-bank",
    description: "Hizli sarj destekli yuksek kapasiteli power bank",
    categorySlug: "power-bank",
    brand: "Anker",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1200&q=80",
    variant: {
      sku: "ANKER-PB-20000",
      attributes: { kapasite: "20000 mAh", cikis: "22.5W" },
      price: 2399,
      stock: 28,
    },
  },
  {
    name: "Yenilenmis iPhone 13",
    slug: "yenilenmis-iphone-13",
    description: "2. el kalite kontrolunden gecmis iPhone 13",
    categorySlug: "ikinci-el-telefon",
    brand: "Apple",
    type: "phone",
    image: "https://images.unsplash.com/photo-1632633173522-47456f85e6af?w=1200&q=80",
    variant: {
      sku: "REF-IPHONE-13-128-NVY",
      attributes: { durum: "Yenilenmis", hafiza: "128GB" },
      price: 30999,
      stock: 7,
    },
  },
  {
    name: "Ekran Degisim Servisi",
    slug: "ekran-degisim-servisi",
    description: "Profesyonel ekip ile hizli ekran degisim hizmeti",
    categorySlug: "teknik-servis",
    brand: "Cep Dunyasi",
    type: "service",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    variant: {
      sku: "SERVIS-EKRAN-DEGISIM",
      attributes: { sure: "Ayni Gun", garanti: "6 Ay" },
      price: 1999,
      stock: 999,
    },
  },
];

const TOTAL_PRODUCT_SEED_COUNT = 100;
const TOTAL_FAKE_SALES_COUNT = 100;

const generatedProductTemplates: GeneratedProductTemplate[] = [
  {
    namePrefix: "iPhone 15 Plus",
    slugPrefix: "iphone-15-plus",
    skuPrefix: "IPH15PLS",
    description: "Buyuk ekranli ve uzun pil omurlu iPhone modeli.",
    categorySlug: "telefon",
    brand: "Apple",
    type: "phone",
    image: "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-plus-1.jpg",
    phoneModelKey: "iphone-15-plus",
    basePrice: 61999,
    baseStock: 14,
  },
  {
    namePrefix: "iPhone 14 Pro",
    slugPrefix: "iphone-14-pro",
    skuPrefix: "IPH14PRO",
    description: "Pro kamera sistemi ve Dynamic Island ile iPhone.",
    categorySlug: "telefon",
    brand: "Apple",
    type: "phone",
    image: "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-pro-1.jpg",
    phoneModelKey: "iphone-14-pro",
    basePrice: 54999,
    baseStock: 11,
  },
  {
    namePrefix: "Yenilenmis Cihaz",
    slugPrefix: "yenilenmis-cihaz",
    skuPrefix: "REF-PH",
    description: "Kalite kontrol testlerinden gecmis, garantili yenilenmis telefon.",
    categorySlug: "ikinci-el-telefon",
    brand: "RenewTech",
    type: "phone",
    image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=1200&q=80",
    basePrice: 18999,
    baseStock: 8,
  },
  {
    namePrefix: "Pulse Watch",
    slugPrefix: "pulse-watch",
    skuPrefix: "PULSE-W",
    description: "Saglik takibi ve bildirim ozellikleriyle akilli saat.",
    categorySlug: "akilli-saatler",
    brand: "Pulse",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
    basePrice: 4299,
    baseStock: 24,
  },
  {
    namePrefix: "Armor Kilif",
    slugPrefix: "armor-kilif",
    skuPrefix: "ARMOR-K",
    description: "Gunluk kullanim icin ince, darbeye dayanikli koruyucu kilif.",
    categorySlug: "kilif",
    brand: "Armor",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=1200&q=80",
    basePrice: 649,
    baseStock: 52,
  },
  {
    namePrefix: "Turbo Sarj Aleti",
    slugPrefix: "turbo-sarj",
    skuPrefix: "TURBO-C",
    description: "PD destekli hizli sarj adaptoru ve guvenli enerji yonetimi.",
    categorySlug: "sarj-aleti",
    brand: "Turbo",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200&q=80",
    basePrice: 999,
    baseStock: 40,
  },
  {
    namePrefix: "Max Power Bank",
    slugPrefix: "max-power-bank",
    skuPrefix: "MAX-PB",
    description: "Yuksek kapasiteli, hizli sarj cikisli tasinabilir batarya.",
    categorySlug: "power-bank",
    brand: "MaxCharge",
    type: "accessory",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1200&q=80",
    basePrice: 1799,
    baseStock: 31,
  },
  {
    namePrefix: "Servis Ekran Paketi",
    slugPrefix: "servis-ekran-paketi",
    skuPrefix: "SRV-EKR",
    description: "Profesyonel ekip ile ekran onarim ve test hizmeti.",
    categorySlug: "teknik-servis",
    brand: "Cep Dunyasi",
    type: "service",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    basePrice: 1599,
    baseStock: 999,
  },
  {
    namePrefix: "Servis Batarya Paketi",
    slugPrefix: "servis-batarya-paketi",
    skuPrefix: "SRV-BAT",
    description: "Batarya degisimi, kalibrasyon ve performans testi hizmeti.",
    categorySlug: "teknik-servis",
    brand: "Cep Dunyasi",
    type: "service",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&q=80",
    basePrice: 1299,
    baseStock: 999,
  },
  {
    namePrefix: "Servis Yazilim Paketi",
    slugPrefix: "servis-yazilim-paketi",
    skuPrefix: "SRV-YAZ",
    description: "Yazilim optimizasyonu, guncelleme ve guvenlik kontrolu hizmeti.",
    categorySlug: "teknik-servis",
    brand: "Cep Dunyasi",
    type: "service",
    image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80",
    basePrice: 899,
    baseStock: 999,
  },
];

const phoneColors = ["Siyah", "Mavi", "Gumus", "Yesil"];
const storageOptions = ["128GB", "256GB", "512GB"];
const watchSizes = ["42mm", "44mm", "46mm"];
const chargingPowers = ["20W", "33W", "45W", "65W"];
const batteryCapacities = ["10000mAh", "20000mAh", "30000mAh"];
const serviceDurations = ["Ayni Gun", "24 Saat", "48 Saat"];
const fakeSaleCities = ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya", "Kayseri", "Gaziantep"];
const fakeSaleDistricts = ["Kadikoy", "Cankaya", "Bornova", "Nilufer", "Muratpasa", "Selcuklu", "Melikgazi", "Sehitkamil"];
const fakeSaleNames = [
  "Ayse Yilmaz",
  "Mehmet Demir",
  "Elif Kaya",
  "Can Acar",
  "Merve Polat",
  "Omer Sahin",
  "Sena Arslan",
  "Burak Koc",
];
const fakeOrderStatuses = ["delivered", "delivered", "delivered", "shipped", "processing", "confirmed", "pending", "cancelled"];
const iphoneModelImageSets: Record<IphoneModelKey, [string, string, string, string]> = {
  "iphone-15": [
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-1.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-2.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-3.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-4.jpg",
  ],
  "iphone-15-plus": [
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-plus-1.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-plus-2.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-plus-3.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-plus-4.jpg",
  ],
  "iphone-15-pro": [
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-1.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-2.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-3.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-4.jpg",
  ],
  "iphone-15-pro-max": [
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-2.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-3.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-4.jpg",
  ],
  "iphone-14-pro": [
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-pro-1.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-pro-2.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-pro-3.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-pro-4.jpg",
  ],
  "iphone-14-plus": [
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-plus-1.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-plus-2.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-plus-3.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-plus-4.jpg",
  ],
  "iphone-13-pro-max": [
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-13-pro-max-1.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-13-pro-max-2.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-13-pro-max-3.jpg",
    "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-13-pro-max-4.jpg",
  ],
};

const categoryGalleryPools: Record<string, string[]> = {
  "ikinci-el-telefon": [
    "https://images.unsplash.com/photo-1632633173522-47456f85e6af?w=1200&q=80",
    "https://images.unsplash.com/photo-1592286927505-1def25115558?w=1200&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80",
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1200&q=80",
  ],
  "akilli-saatler": [
    "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=1200&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
    "/images/akilli-saat.jpg",
    "/images/cep_dunyasi_resim1.webp",
  ],
  kilif: [
    "https://images.unsplash.com/photo-1601593346740-925612772716?w=1200&q=80",
    "/images/kilif2.jpeg",
    "/images/image copy 3.png",
    "/images/image copy 4.png",
  ],
  "sarj-aleti": [
    "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=1200&q=80",
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200&q=80",
    "/images/sarj_aleti.webp",
    "/images/indir.jpeg",
  ],
  "power-bank": [
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1200&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&q=80",
    "/images/powerbank.jpeg",
    "/images/cep_dunyasi_resim1.webp",
  ],
  "teknik-servis": [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&q=80",
    "/images/teknik-servis.jpeg",
  ],
};

const fallbackGalleryImages = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80",
  "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1200&q=80",
  "https://images.unsplash.com/photo-1601593346740-925612772716?w=1200&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
];

function uniqueImages(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildSeedGalleryImages(sample: Pick<ProductSample, "categorySlug" | "image" | "phoneModelKey">) {
  if (sample.categorySlug === "telefon") {
    const modelKey = sample.phoneModelKey ?? "iphone-15";
    return iphoneModelImageSets[modelKey];
  }

  const categoryImages = categoryGalleryPools[sample.categorySlug] ?? fallbackGalleryImages;
  const combined = uniqueImages([sample.image, ...categoryImages]);

  if (combined.length >= 4) {
    return combined.slice(0, 4);
  }

  return uniqueImages([...combined, ...fallbackGalleryImages]).slice(0, 4);
}

function areSameImageSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function buildGeneratedAttributes(template: GeneratedProductTemplate, sequence: number) {
  if (template.type === "phone") {
    return {
      renk: phoneColors[sequence % phoneColors.length],
      hafiza: storageOptions[sequence % storageOptions.length],
    };
  }

  if (template.type === "service") {
    return {
      sure: serviceDurations[sequence % serviceDurations.length],
      garanti: "6 Ay",
    };
  }

  if (template.categorySlug === "akilli-saatler") {
    return {
      kasa: watchSizes[sequence % watchSizes.length],
      baglanti: "Bluetooth",
    };
  }

  if (template.categorySlug === "sarj-aleti") {
    return {
      guc: chargingPowers[sequence % chargingPowers.length],
      giris: "USB-C",
    };
  }

  if (template.categorySlug === "power-bank") {
    return {
      kapasite: batteryCapacities[sequence % batteryCapacities.length],
      cikis: "PD",
    };
  }

  return {
    materyal: "TPU",
    uyumluluk: "Evrensel",
  };
}

function formatVariantInfo(attributes: Record<string, string> | undefined) {
  if (!attributes) {
    return null;
  }

  const entries = Object.entries(attributes);
  if (entries.length === 0) {
    return null;
  }

  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}

function clampPrice(value: number) {
  return Math.max(0, Math.round(value));
}

function buildFakeSaleTemplates(variants: SeedVariantRecord[], productNameById: Map<string, string>) {
  if (variants.length === 0) {
    return [];
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return Array.from({ length: TOTAL_FAKE_SALES_COUNT }, (_, index): FakeSaleTemplate => {
    const sequence = index + 1;
    const token = `seed-sale-${String(sequence).padStart(3, "0")}`;
    const createdAt = new Date(now - (TOTAL_FAKE_SALES_COUNT - sequence) * dayMs);

    const firstVariant = variants[index % variants.length];
    const secondVariant = variants[(index * 7 + 11) % variants.length];
    const includeSecondItem = index % 3 === 0 && secondVariant.id !== firstVariant.id;

    const itemBlueprints = [
      {
        variant: firstVariant,
        quantity: 1 + (index % 2),
      },
      ...(includeSecondItem
        ? [
            {
              variant: secondVariant,
              quantity: 1,
            },
          ]
        : []),
    ];

    const items = itemBlueprints.map((entry) => ({
      variant_id: entry.variant.id,
      product_name: productNameById.get(entry.variant.product_id) ?? "Urun",
      variant_info: formatVariantInfo(entry.variant.attributes),
      quantity: entry.quantity,
      unit_price: clampPrice(entry.variant.price),
      created_at: createdAt,
    }));

    const totalPrice = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const discount = index % 10 === 0 ? clampPrice(totalPrice * 0.12) : index % 6 === 0 ? 250 : 0;
    const shippingPrice = totalPrice - discount >= 3000 ? 0 : 89;
    const finalPrice = clampPrice(totalPrice - discount + shippingPrice);
    const orderStatus = fakeOrderStatuses[index % fakeOrderStatuses.length];
    const paymentStatus = orderStatus === "cancelled" ? "failed" : index % 7 === 0 ? "pending" : "paid";

    return {
      token,
      createdAt,
      order: {
        guest_token: token,
        total_price: clampPrice(totalPrice),
        discount,
        shipping_price: shippingPrice,
        final_price: finalPrice,
        payment_provider: "iyzico",
        payment_status: paymentStatus,
        order_status: orderStatus,
        shipping_address: {
          full_name: fakeSaleNames[index % fakeSaleNames.length],
          city: fakeSaleCities[index % fakeSaleCities.length],
          district: fakeSaleDistricts[index % fakeSaleDistricts.length],
          line1: `Ataturk Cad. No:${(index % 94) + 1}`,
          postal_code: `${34000 + (index % 600)}`,
          phone: `+90 5${String(100000000 + index).slice(0, 9)}`,
        },
        created_at: createdAt,
        updated_at: createdAt,
      },
      items,
    };
  });
}

const generatedProductCount = Math.max(0, TOTAL_PRODUCT_SEED_COUNT - baseProductSeeds.length);

const generatedProductSeeds: ProductSample[] = Array.from({ length: generatedProductCount }, (_, index) => {
  const template = generatedProductTemplates[index % generatedProductTemplates.length];
  const sequence = Math.floor(index / generatedProductTemplates.length) + 1;
  const modelCode = String(sequence).padStart(2, "0");
  const step = (index % generatedProductTemplates.length) * 25;

  return {
    name: `${template.namePrefix} ${modelCode}`,
    slug: `${template.slugPrefix}-${sequence}`,
    description: template.description,
    categorySlug: template.categorySlug,
    brand: template.brand,
    type: template.type,
    image: template.image,
    phoneModelKey: template.phoneModelKey,
    variant: {
      sku: `${template.skuPrefix}-${String(sequence).padStart(3, "0")}`,
      attributes: buildGeneratedAttributes(template, sequence),
      price: template.basePrice + sequence * 45 + step,
      stock: template.type === "service" ? 999 : Math.max(5, template.baseStock + (sequence % 9) - 2),
    },
  };
});

const productSeeds: ProductSample[] = [...baseProductSeeds, ...generatedProductSeeds];

const couponSeeds: CouponSample[] = [
  {
    code: "HOSGELDIN10",
    type: "percentage",
    value: 10,
    min_order_amount: 2000,
    usage_limit: 500,
    is_active: true,
  },
  {
    code: "SEPET500",
    type: "fixed",
    value: 500,
    min_order_amount: 10000,
    usage_limit: 200,
    is_active: true,
  },
];

const missionItemSeeds = [
  {
    label: "B",
    title: "Hizli Teknik Servis",
    description: "Ariza tespit ve onarim surecinde anlik bilgilendirme.",
    media_type: "video",
    media_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    media_poster: "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg",
    list_items: ["Ekran Degisimi", "Batarya", "Sarj Soketi", "Yazilim Guncelleme", "Test Raporu"],
    sort_order: 2,
    is_active: true,
  },
  {
    label: "C",
    title: "Guvenli Teslimat",
    description: "Siparisin hazirliktan teslimata kadar takip edilebilir.",
    media_type: "image",
    media_url: "https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg",
    media_poster: "",
    list_items: ["Ayni Gun Kargo", "Sigortali Paket", "Canli Takip", "Kolay Iade", "Musteri Bildirimi"],
    sort_order: 3,
    is_active: true,
  },
];

function isR2Url(value: string) {
  return Boolean(getObjectKeyFromMediaUrl(value));
}

function getMimeTypeFromFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".heic") return "image/heic";
  return "application/octet-stream";
}

async function uploadProductImageSourceToR2(sourceUrl: string) {
  if (!sourceUrl) {
    return sourceUrl;
  }

  if (isR2Url(sourceUrl)) {
    return normalizeMediaUrl(sourceUrl);
  }

  const cachedPromise = migratedProductImageCache.get(sourceUrl);
  if (cachedPromise) {
    return cachedPromise;
  }

  const migrationPromise = (async () => {
    if (sourceUrl.startsWith("/")) {
      const relativePath = decodeURIComponent(sourceUrl).replace(/^\/+/, "");
      const localFilePath = path.join(process.cwd(), "public", relativePath);
      const body = await fs.readFile(localFilePath);
      const fileName = path.basename(localFilePath);
      const contentType = getMimeTypeFromFileName(fileName);
      const uploaded = await uploadToR2({
        body,
        contentType,
        fileName,
        keyPrefix: "uploads/products/images/seeded",
      });
      return uploaded.url;
    }

    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch product image: ${sourceUrl}`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || getMimeTypeFromFileName(sourceUrl);
    const arrayBuffer = await response.arrayBuffer();
    const fileNameFromUrl = path.basename(new URL(sourceUrl).pathname) || "product-image";
    const uploaded = await uploadToR2({
      body: Buffer.from(arrayBuffer),
      contentType,
      fileName: fileNameFromUrl,
      keyPrefix: "uploads/products/images/seeded",
    });
    return uploaded.url;
  })();

  migratedProductImageCache.set(sourceUrl, migrationPromise);
  return migrationPromise;
}

async function migrateProductImageListToR2(imageUrls: string[]) {
  const migrated = await Promise.all(
    imageUrls.filter(Boolean).map(async (imageUrl) => {
      try {
        return await uploadProductImageSourceToR2(imageUrl);
      } catch {
        return null;
      }
    })
  );

  return Array.from(new Set(migrated.filter(Boolean)));
}

const defaultSiteContent = {
  key: "home",
  hero_title_prefix: "Teknolojinin",
  hero_title_highlight: "Gucunu",
  hero_title_suffix: "ile kesfet",
  hero_subtitle: "Premium telefon ve aksesuarlar",
  hero_logo_light_url: "/images/cep-dunyasi-logo-black-v3-tight.png",
  hero_logo_dark_url: "/images/cep-dunyasi-logo-dark-v3-tight.png",
  hero_cta_label: "Urunleri Incele",
  hero_cta_href: "/products",
  hero_slides: [
    { id: "slide-iphone", image_url: "/images/iphone15.png", alt: "iPhone 15" },
    { id: "slide-s24", image_url: "/images/samsung s24.png", alt: "Samsung S24" },
    { id: "slide-kilif", image_url: "/images/kılıf.png", alt: "Telefon Kilifi" },
    { id: "slide-airpods", image_url: "/images/airpods.png", alt: "AirPods" },
  ],
  hero_benefits: [
    { icon: "Truck", title: "Ayni gun kargo", desc: "Hizli ve guvenli teslimat" },
    { icon: "ShieldCheck", title: "Orijinal urunler", desc: "Yetkili distributor garantili" },
    { icon: "CreditCard", title: "2 yil garanti", desc: "Tum cihazlarda gecerli" },
  ],
  category_section_title: "Kategoriler",
  category_section_description: "",
  explore_section_title: "Kategorileri Kesfet",
  featured_section_title: "One Cikan Urunler",
  featured_section_cta_label: "Tum Urunleri Gor",
  featured_section_cta_href: "/products",
};

export async function ensureSeedData() {
  if (seeded) {
    return;
  }

  if (!seedPromise) {
    seedPromise = (async () => {
      const seedCategorySlugs = categorySeeds.map((category) => category.slug);
      const existingCategories = await Category.find({}).lean();
      const existingCategoryBySlug = new Map<string, any>(
        existingCategories.map((category: any) => [category.slug, category])
      );

      const categoriesToInsert = categorySeeds.filter((category) => !existingCategoryBySlug.has(category.slug));
      if (categoriesToInsert.length > 0) {
        await Category.insertMany(categoriesToInsert);
      }

      const categoriesToUpdate = categorySeeds
        .map((category) => {
          const existing = existingCategoryBySlug.get(category.slug);
          if (!existing) {
            return null;
          }

          const currentIcon = existing.icon ?? null;
          const nextIcon = category.icon ?? null;
          const hasDiff = existing.name !== category.name || currentIcon !== nextIcon;
          if (!hasDiff) {
            return null;
          }

          return { id: existing.id, name: category.name, icon: nextIcon };
        })
        .filter(Boolean) as Array<{ id: string; name: string; icon: string | null }>;

      if (categoriesToUpdate.length > 0) {
        await Promise.all(
          categoriesToUpdate.map((category) =>
            Category.updateOne(
              { id: category.id },
              {
                $set: {
                  name: category.name,
                  icon: category.icon,
                },
              }
            )
          )
        );
      }

      const categories = await Category.find({ slug: { $in: seedCategorySlugs } }).lean();
      const categoryBySlug = new Map<string, string>(
        categories.map((category: any) => [category.slug, category.id])
      );
      const phoneCategoryId = categoryBySlug.get("telefon");

      if (phoneCategoryId) {
        await Product.updateMany(
          {
            category_id: phoneCategoryId,
            $or: [{ slug: "galaxy-s24" }, { slug: { $regex: /^orion-telefon-/ } }, { slug: { $regex: /^atlas-telefon-/ } }],
          },
          {
            $set: {
              is_active: false,
              updated_at: new Date(),
            },
          }
        );
      }

      const seedSlugs = productSeeds.map((item) => item.slug);
      const existingProducts = await Product.find({ slug: { $in: seedSlugs } }).lean();
      const existingSlugSet = new Set(existingProducts.map((item: any) => item.slug));
      const seedImagesBySlug = new Map<string, string[]>(
        await Promise.all(
          productSeeds.map(
            async (sample): Promise<[string, string[]]> => [
              sample.slug,
              await migrateProductImageListToR2(buildSeedGalleryImages(sample)),
            ]
          )
        )
      );

      const productsToInsert = productSeeds
        .filter((sample) => !existingSlugSet.has(sample.slug))
        .map((sample) => ({
          name: sample.name,
          slug: sample.slug,
          description: sample.description,
          category_id: categoryBySlug.get(sample.categorySlug) ?? null,
          brand: sample.brand,
          type: sample.type,
          images: seedImagesBySlug.get(sample.slug) ?? [sample.image],
          is_featured: ["iphone-15-pro-max", "iphone-15", "hizli-usb-c-sarj-aleti", "iphone-15-dayanikli-kilif"].includes(sample.slug),
          is_active: true,
        }));

      if (productsToInsert.length > 0) {
        await Product.insertMany(productsToInsert);
      }

      const seedProducts = await Product.find({ slug: { $in: seedSlugs } }).lean();
      const productsToUpdateImages = seedProducts.filter((product: any) => {
        const targetImages = seedImagesBySlug.get(product.slug) ?? [];
        const currentImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

        // Keep admin-edited product galleries. Seed only fills empty image lists.
        return currentImages.length === 0 && targetImages.length > 0;
      });

      if (productsToUpdateImages.length > 0) {
        await Promise.all(
          productsToUpdateImages.map((product: any) =>
            Product.updateOne(
              { id: product.id },
              {
                $set: {
                  images: seedImagesBySlug.get(product.slug) ?? [],
                  updated_at: new Date(),
                },
              }
            )
          )
        );
      }

      const allProducts = await Product.find({}).lean();
      const productsWithNonR2Images = allProducts.filter((product: any) => {
        const currentImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
        return currentImages.some((imageUrl: string) => !isR2Url(imageUrl));
      });

      if (productsWithNonR2Images.length > 0) {
        await Promise.all(
          productsWithNonR2Images.map(async (product: any) => {
            const currentImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
            const migratedImages = await migrateProductImageListToR2(currentImages);

            if (migratedImages.length === 0) {
              return;
            }

            const isSameList =
              migratedImages.length === currentImages.length &&
              migratedImages.every((imageUrl, index) => imageUrl === currentImages[index]);

            if (isSameList) {
              return;
            }

            await Product.updateOne(
              { id: product.id },
              {
                $set: {
                  images: migratedImages,
                  updated_at: new Date(),
                },
              }
            );
          })
        );
      }

      const homeSiteContent = await SiteContent.findOne({ key: "home" }).lean();
      if (!homeSiteContent) {
        await SiteContent.create(defaultSiteContent);
      }

      const productBySlug = new Map<string, string>(seedProducts.map((item: any) => [item.slug, item.id]));

      const seedSkus = productSeeds.map((item) => item.variant.sku);
      const existingVariants = await ProductVariant.find({ sku: { $in: seedSkus } }).lean();
      const existingSkuSet = new Set(existingVariants.map((item: any) => item.sku));

      const variantsToInsert = productSeeds
        .filter((sample) => !existingSkuSet.has(sample.variant.sku))
        .map((sample) => ({
          product_id: productBySlug.get(sample.slug),
          sku: sample.variant.sku,
          attributes: sample.variant.attributes,
          price: sample.variant.price,
          stock: sample.variant.stock,
          is_active: true,
        }))
        .filter((sample) => Boolean(sample.product_id));

      if (variantsToInsert.length > 0) {
        await ProductVariant.insertMany(variantsToInsert);
      }

      const seedVariants = (await ProductVariant.find({ sku: { $in: seedSkus } }).lean()) as SeedVariantRecord[];
      const productNameById = new Map<string, string>(seedProducts.map((item: any) => [item.id, item.name]));
      const fakeSaleTemplates = buildFakeSaleTemplates(seedVariants, productNameById);

      if (fakeSaleTemplates.length > 0) {
        const fakeSaleTokens = fakeSaleTemplates.map((template) => template.token);
        const existingSeedOrders = await Order.find({ guest_token: { $in: fakeSaleTokens } }).lean();
        const existingTokenSet = new Set(existingSeedOrders.map((order: any) => order.guest_token));
        const ordersToInsert = fakeSaleTemplates
          .filter((template) => !existingTokenSet.has(template.token))
          .map((template) => template.order);

        if (ordersToInsert.length > 0) {
          await Order.insertMany(ordersToInsert);
        }

        const seedOrders = await Order.find({ guest_token: { $in: fakeSaleTokens } }).lean();
        const orderByToken = new Map<string, any>(
          seedOrders.map((order: any) => [order.guest_token, order])
        );
        const seedOrderIds = seedOrders.map((order: any) => order.id);

        if (seedOrderIds.length > 0) {
          const existingOrderItems = await OrderItem.find({ order_id: { $in: seedOrderIds } }).lean();
          const orderIdsWithItems = new Set(existingOrderItems.map((item: any) => item.order_id));
          const orderItemsToInsert = fakeSaleTemplates
            .filter((template) => {
              const order = orderByToken.get(template.token);
              return Boolean(order?.id) && !orderIdsWithItems.has(order.id);
            })
            .flatMap((template) => {
              const order = orderByToken.get(template.token);
              if (!order?.id) {
                return [];
              }

              return template.items.map((item) => ({
                order_id: order.id,
                variant_id: item.variant_id,
                product_name: item.product_name,
                variant_info: item.variant_info,
                quantity: item.quantity,
                unit_price: item.unit_price,
                created_at: item.created_at,
              }));
            });

          if (orderItemsToInsert.length > 0) {
            await OrderItem.insertMany(orderItemsToInsert);
          }
        }
      }

      const existingCoupons = await Coupon.find({ code: { $in: couponSeeds.map((coupon) => coupon.code) } }).lean();
      const existingCouponCodeSet = new Set(existingCoupons.map((coupon: any) => coupon.code));
      const couponsToInsert = couponSeeds.filter((coupon) => !existingCouponCodeSet.has(coupon.code));

      if (couponsToInsert.length > 0) {
        await Coupon.insertMany(couponsToInsert);
      }

      const existingMissionItems = await MissionItem.find({ label: { $in: missionItemSeeds.map((item) => item.label) } }).lean();
      const existingMissionLabelSet = new Set(existingMissionItems.map((item: any) => item.label));
      const missionItemsToInsert = missionItemSeeds.filter((item) => !existingMissionLabelSet.has(item.label));

      if (missionItemsToInsert.length > 0) {
        await MissionItem.insertMany(missionItemsToInsert);
      }

      seeded = true;
    })();
  }

  await seedPromise;
}
