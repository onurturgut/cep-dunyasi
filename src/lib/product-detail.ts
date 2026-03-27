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
      badge: "Ön Sipariş",
      primary: "Bu model şu an stokta değil, tedarik süreciyle gönderilir.",
      secondary: "Stok yenilendiğinde sıraya alınıp en kısa sürede kargolanır.",
      shippingWindow: `${formatShortDate(dispatchStart)} - ${formatShortDate(dispatchEnd)}`,
      deliveryWindow: "Tahmini teslimat: 4-7 iş günü",
      isPreorder: true,
    };
  }

  const shippingDate = beforeCutoff ? now : addBusinessDays(now, 1);
  const deliveryStart = addBusinessDays(shippingDate, 1);
  const deliveryEnd = addBusinessDays(shippingDate, 3);

  return {
    badge: stock <= 5 ? `Son ${stock} Adet` : "Hızlı Teslimat",
    primary: beforeCutoff ? "Bugün sipariş verirseniz yarın kargoda." : "Siparişiniz ilk iş gününde kargoya teslim edilir.",
    secondary:
      stock <= 5
        ? "Seçili model sınırlı stokta, siparişinizi geciktirmeden tamamlayın."
        : "Sigortalı paketleme ve güvenli teslimat ile gönderilir.",
    shippingWindow: `Kargoya veriliş: ${formatShortDate(shippingDate)}`,
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
      title: "2 Yıl Garanti",
      description: brand ? `${brand} ürünlerinde resmi veya ithalatçı garantisiyle korunur.` : "Tüm cihazlarda resmi veya ithalatçı garanti desteği sunulur.",
    },
    {
      title: "14 Gün İade",
      description: "Teslimattan sonra 14 gün içinde cayma hakkı kapsamında iade talebi oluşturabilirsiniz.",
    },
    {
      title: "Teknik Servis Desteği",
      description: "Kurulum, arıza ve servis süreçlerinde uzman teknik servis ekibimiz destek verir.",
    },
  ];
}

export function buildProductFaqItems(input: {
  productName: string;
  brand?: string | null;
  categoryName?: string | null;
  stock: number;
}): ProductFaqItem[] {
  const categoryLabel = input.categoryName || "ürün";
  const guaranteeLabel = input.brand ? `${input.brand} için resmi veya ithalatçı garanti kapsamında` : "garanti kapsamında";

  return [
    {
      question: `${input.productName} ne kadar sürede teslim edilir?`,
      answer:
        input.stock > 0
          ? "Stokta olan modeller genellikle aynı gün veya sonraki ilk iş gününde kargoya teslim edilir. Teslimat bölgenize göre 1-3 iş günü sürer."
          : "Stokta olmayan modeller tedarik sürecine alınır. Güncel teslimat tahmini ürün detayında ve sipariş öncesi aşamada gösterilir.",
    },
    {
      question: `${categoryLabel} garantili mi?`,
      answer: `${input.productName} ${guaranteeLabel} satışa sunulur. Garanti detayları kutu içeriği ve fatura ile birlikte paylaşılır.`,
    },
    {
      question: "İade ve değişim şartları nelerdir?",
      answer:
        "Teslimattan sonraki 14 gün içinde, kullanıcı hatası veya fiziksel zarar bulunmayan ürünlerde iade veya değişim talebi oluşturabilirsiniz. Hijyen ve aktivasyon koşulları uygulanan ürünlerde ilgili mevzuat geçerlidir.",
    },
    {
      question: "Teknik servis desteği sunuluyor mu?",
      answer:
        "Evet. Teknik servis talep formu üzerinden cihaz bilgilerinizi paylaşabilir, servis süreci boyunca ekibimizden destek alabilirsiniz.",
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
