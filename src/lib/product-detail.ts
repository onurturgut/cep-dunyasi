type DeliveryEstimateInput = {
  stock: number;
  now?: Date;
};

export type DeliveryEstimateInfo = {
  badge: string;
  primary: string;
  secondary: string;
  shippingWindow: string;
  deliveryWindow: string;
  isPreorder: boolean;
};

export type InstallmentOption = {
  months: number;
  commissionRate: number;
  totalAmount: number;
  monthlyAmount: number;
};

export type ProductFaqItem = {
  question: string;
  answer: string;
};

export type PolicyHighlight = {
  title: string;
  description: string;
};

export type BreadcrumbSchemaItem = {
  name: string;
  item: string;
};

function formatShortDate(value: Date) {
  return value.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

function addBusinessDays(startDate: Date, dayCount: number) {
  const nextDate = new Date(startDate);
  let addedDays = 0;

  while (addedDays < dayCount) {
    nextDate.setDate(nextDate.getDate() + 1);
    const day = nextDate.getDay();

    if (day !== 0 && day !== 6) {
      addedDays += 1;
    }
  }

  return nextDate;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildDeliveryEstimate({ stock, now = new Date() }: DeliveryEstimateInput): DeliveryEstimateInfo {
  const orderCutoffHour = 15;
  const beforeCutoff = now.getHours() < orderCutoffHour;

  if (stock <= 0) {
    const dispatchStart = addBusinessDays(now, 3);
    const dispatchEnd = addBusinessDays(now, 5);

    return {
      badge: "On Siparis",
      primary: "Bu varyant su an stokta degil, tedarik sureciyle gonderilir.",
      secondary: "Stok yenilendiginde siraya alinip en kisa surede kargolanir.",
      shippingWindow: `${formatShortDate(dispatchStart)} - ${formatShortDate(dispatchEnd)}`,
      deliveryWindow: "Tahmini teslimat: 4-7 is gunu",
      isPreorder: true,
    };
  }

  const shippingDate = beforeCutoff ? now : addBusinessDays(now, 1);
  const deliveryStart = addBusinessDays(shippingDate, 1);
  const deliveryEnd = addBusinessDays(shippingDate, 3);

  return {
    badge: stock <= 5 ? `Son ${stock} Adet` : "Hizli Teslimat",
    primary: beforeCutoff ? "Bugun siparis verirseniz yarin kargoda." : "Siparisiniz ilk is gununde kargoya teslim edilir.",
    secondary: stock <= 5 ? "Secili varyant sinirli stokta, siparisinizi geciktirmeden tamamlayin." : "Sigortali paketleme ve guvenli teslimat ile gonderilir.",
    shippingWindow: `Kargoya verilis: ${formatShortDate(shippingDate)}`,
    deliveryWindow: `Tahmini teslimat: ${formatShortDate(deliveryStart)} - ${formatShortDate(deliveryEnd)}`,
    isPreorder: false,
  };
}

export function buildInstallmentOptions(price: number, commissionOverrides?: Partial<Record<number, number>>): InstallmentOption[] {
  const installmentCounts = [2, 3, 6, 9, 12] as const;
  const defaultCommissionRates: Record<number, number> = {
    2: 0,
    3: 0,
    6: 0.04,
    9: 0.075,
    12: 0.11,
  };

  return installmentCounts.map((months) => {
    const commissionRate = commissionOverrides?.[months] ?? defaultCommissionRates[months] ?? 0;
    const totalAmount = roundCurrency(price * (1 + commissionRate));

    return {
      months,
      commissionRate,
      totalAmount,
      monthlyAmount: roundCurrency(totalAmount / months),
    };
  });
}

export function buildPolicyHighlights(brand?: string | null): PolicyHighlight[] {
  return [
    {
      title: "2 Yil Garanti",
      description: brand ? `${brand} urunlerinde resmi veya ithalatci garantisiyle korunur.` : "Tum cihazlarda resmi veya ithalatci garanti destegi sunulur.",
    },
    {
      title: "14 Gun Iade",
      description: "Teslimattan sonra 14 gun icinde cayma hakki kapsaminda iade talebi olusturabilirsiniz.",
    },
    {
      title: "Teknik Servis Destegi",
      description: "Kurulum, ariza ve servis sureclerinde uzman teknik servis ekibimiz destek verir.",
    },
  ];
}

export function buildProductFaqItems(input: {
  productName: string;
  brand?: string | null;
  categoryName?: string | null;
  stock: number;
}): ProductFaqItem[] {
  const categoryLabel = input.categoryName || "urun";
  const guaranteeLabel = input.brand ? `${input.brand} icin resmi veya ithalatci garanti kapsaminda` : "garanti kapsaminda";

  return [
    {
      question: `${input.productName} ne kadar surede teslim edilir?`,
      answer:
        input.stock > 0
          ? "Stokta olan varyantlar genellikle ayni gun veya sonraki ilk is gununde kargoya teslim edilir. Teslimat bolgenize gore 1-3 is gunu surer."
          : "Stokta olmayan varyantlar tedarik surecine alinir. Guncel teslimat tahmini urun detayinda ve siparis oncesi asamada gosterilir.",
    },
    {
      question: `${categoryLabel} garantili mi?`,
      answer: `${input.productName} ${guaranteeLabel} satisa sunulur. Garanti detaylari kutu icerigi ve fatura ile birlikte paylasilir.`,
    },
    {
      question: "Iade ve degisim sartlari nelerdir?",
      answer:
        "Teslimattan sonraki 14 gun icinde, kullanici hatasi veya fiziksel zarar bulunmayan urunlerde iade veya degisim talebi olusturabilirsiniz. Hijyen ve aktivasyon kosullari uygulanan urunlerde ilgili mevzuat gecerlidir.",
    },
    {
      question: "Teknik servis destegi sunuluyor mu?",
      answer:
        "Evet. Teknik servis talep formu uzerinden cihaz bilgilerinizi paylasabilir, servis sureci boyunca ekibimizden destek alabilirsiniz.",
    },
  ];
}

export function buildFaqStructuredData(items: ProductFaqItem[]) {
  if (items.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbStructuredData(items: BreadcrumbSchemaItem[]) {
  if (items.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}
