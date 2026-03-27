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
      badge: "\u00d6n Sipari\u015f",
      primary: "Bu model \u015fu an stokta de\u011fil, tedarik s\u00fcreciyle g\u00f6nderilir.",
      secondary: "Stok yenilendi\u011finde s\u0131raya al\u0131n\u0131p en k\u0131sa s\u00fcrede kargolan\u0131r.",
      shippingWindow: `${formatShortDate(dispatchStart)} - ${formatShortDate(dispatchEnd)}`,
      deliveryWindow: "Tahmini teslimat: 4-7 i\u015f g\u00fcn\u00fc",
      isPreorder: true,
    };
  }

  const shippingDate = beforeCutoff ? now : addBusinessDays(now, 1);
  const deliveryStart = addBusinessDays(shippingDate, 1);
  const deliveryEnd = addBusinessDays(shippingDate, 3);

  return {
    badge: stock <= 5 ? `Son ${stock} Adet` : "H\u0131zl\u0131 Teslimat",
    primary: beforeCutoff ? "Bug\u00fcn sipari\u015f verirseniz yar\u0131n kargoda." : "Sipari\u015finiz ilk i\u015f g\u00fcn\u00fcnde kargoya teslim edilir.",
    secondary:
      stock <= 5
        ? "Se\u00e7ili model s\u0131n\u0131rl\u0131 stokta, sipari\u015finizi geciktirmeden tamamlay\u0131n."
        : "Sigortal\u0131 paketleme ve g\u00fcvenli teslimat ile g\u00f6nderilir.",
    shippingWindow: `Kargoya verili\u015f: ${formatShortDate(shippingDate)}`,
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
      title: "2 Y\u0131l Garanti",
      description: brand ? `${brand} \u00fcr\u00fcnlerinde resmi veya ithalat\u00e7\u0131 garantisiyle korunur.` : "T\u00fcm cihazlarda resmi veya ithalat\u00e7\u0131 garanti deste\u011fi sunulur.",
    },
    {
      title: "14 G\u00fcn \u0130ade",
      description: "Teslimattan sonra 14 g\u00fcn i\u00e7inde cayma hakk\u0131 kapsam\u0131nda iade talebi olu\u015fturabilirsiniz.",
    },
    {
      title: "Teknik Servis Deste\u011fi",
      description: "Kurulum, ar\u0131za ve servis s\u00fcre\u00e7lerinde uzman teknik servis ekibimiz destek verir.",
    },
  ];
}

export function buildProductFaqItems(input: {
  productName: string;
  brand?: string | null;
  categoryName?: string | null;
  stock: number;
}): ProductFaqItem[] {
  const categoryLabel = input.categoryName || "\u00fcr\u00fcn";
  const guaranteeLabel = input.brand ? `${input.brand} i\u00e7in resmi veya ithalat\u00e7\u0131 garanti kapsam\u0131nda` : "garanti kapsam\u0131nda";

  return [
    {
      question: `${input.productName} ne kadar s\u00fcrede teslim edilir?`,
      answer:
        input.stock > 0
          ? "Stokta olan modeller genellikle ayn\u0131 g\u00fcn veya sonraki ilk i\u015f g\u00fcn\u00fcnde kargoya teslim edilir. Teslimat b\u00f6lgenize g\u00f6re 1-3 i\u015f g\u00fcn\u00fc s\u00fcrer."
          : "Stokta olmayan modeller tedarik s\u00fcrecine al\u0131n\u0131r. G\u00fcncel teslimat tahmini \u00fcr\u00fcn detay\u0131nda ve sipari\u015f \u00f6ncesi a\u015famada g\u00f6sterilir.",
    },
    {
      question: `${categoryLabel} garantili mi?`,
      answer: `${input.productName} ${guaranteeLabel} sat\u0131\u015fa sunulur. Garanti detaylar\u0131 kutu i\u00e7eri\u011fi ve fatura ile birlikte payla\u015f\u0131l\u0131r.`,
    },
    {
      question: "\u0130ade ve de\u011fi\u015fim \u015fartlar\u0131 nelerdir?",
      answer:
        "Teslimattan sonraki 14 g\u00fcn i\u00e7inde, kullan\u0131c\u0131 hatas\u0131 veya fiziksel zarar bulunmayan \u00fcr\u00fcnlerde iade veya de\u011fi\u015fim talebi olu\u015fturabilirsiniz. Hijyen ve aktivasyon ko\u015fullar\u0131 uygulanan \u00fcr\u00fcnlerde ilgili mevzuat ge\u00e7erlidir.",
    },
    {
      question: "Teknik servis deste\u011fi sunuluyor mu?",
      answer:
        "Evet. Teknik servis talep formu \u00fczerinden cihaz bilgilerinizi payla\u015fabilir, servis s\u00fcreci boyunca ekibimizden destek alabilirsiniz.",
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
