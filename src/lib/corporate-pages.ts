import type {
  CorporateContactBlock,
  CorporateFaqItem,
  CorporatePageDefinition,
  CorporatePageKey,
  CorporatePageListItem,
  CorporatePageRecord,
  CorporatePageSection,
  CorporatePageSlug,
} from "@/types/corporate-page";

function createSection(id: string, title: string, content: string, style: "default" | "card" = "card"): CorporatePageSection {
  return { id, title, content, style };
}

function createFaq(id: string, question: string, answer: string, order: number, category?: string): CorporateFaqItem {
  return {
    id,
    question,
    answer,
    category: category ?? null,
    order,
    isActive: true,
  };
}

function createContactBlock(
  id: string,
  label: string,
  value: string,
  href?: string,
  icon?: string,
  description?: string,
): CorporateContactBlock {
  return {
    id,
    label,
    value,
    href: href ?? null,
    icon: icon ?? null,
    description: description ?? null,
  };
}

export const CORPORATE_PAGE_DEFINITIONS: Record<CorporatePageKey, CorporatePageDefinition> = {
  about: {
    key: "about",
    slug: "hakkimizda",
    template: "about",
    title: "Hakkımızda",
    metaTitle: "Hakkımızda | Cep Dünyası",
    metaDescription: "Cep Dünyası'nın marka yaklaşımını, hizmet anlayışını ve müşterilerine sunduğu güven odaklı alışveriş deneyimini keşfedin.",
    summary: "Teknoloji ürünlerinde güven, hız ve doğru yönlendirmeyi merkeze alan bir perakende deneyimi sunuyoruz.",
    content:
      "## Marka yaklaşımımız\nCep Dünyası, telefon, aksesuar ve teknik servis alanlarında güven veren bir alışveriş deneyimi sunmak için kurulmuştur.\n\n## Hizmet anlayışımız\nDoğru ürün, doğru fiyat, şeffaf bilgilendirme ve satış sonrası destek ilkeleriyle ilerleriz.\n\n## Müşteri odağımız\nHem online hem mağaza deneyiminde sade, hızlı ve çözüm odaklı bir yapı kurmayı hedefleriz.",
    sections: [
      createSection("vision", "Vizyon", "Mobil teknoloji perakendesinde güven veren ve tavsiye edilen markalardan biri olmak."),
      createSection("why-us", "Neden Bizi Tercih Etmelisiniz?", "Seçili ürün gamı, şeffaf satış süreci ve teknik servis desteğini tek noktada sunuyoruz."),
    ],
    faqItems: [],
    contactBlocks: [],
    isPublished: true,
    robotsNoindex: false,
  },
  contact: {
    key: "contact",
    slug: "iletisim",
    template: "contact",
    title: "İletişim",
    metaTitle: "İletişim | Cep Dünyası",
    metaDescription: "Cep Dünyası iletişim bilgileri, çalışma saatleri ve destek kanallarına bu sayfadan ulaşabilirsiniz.",
    summary: "Sipariş, destek, teknik servis ve mağaza bilgileri için bize kolayca ulaşabilirsiniz.",
    content:
      "## Nasıl yardımcı olabiliriz?\nSiparişleriniz, ürün seçimi, teknik servis veya kurumsal konular için doğru kanaldan bize ulaşabilirsiniz.\n\n## Destek önceliğimiz\nMesajlarınıza mümkün olan en kısa sürede dönüş yapmayı hedefliyoruz.",
    sections: [
      createSection("support", "Hızlı Destek", "Sipariş ve ürün sorularında telefon ve e-posta üzerinden hızlı destek sunuyoruz."),
      createSection("service", "Teknik Servis", "Cihaz arızaları ve servis süreçleri için teknik servis sayfamızdan başvuru oluşturabilirsiniz."),
    ],
    faqItems: [],
    contactBlocks: [
      createContactBlock("phone", "Telefon", "+90 555 123 45 67", "tel:+905551234567", "phone", "Pazartesi - Cumartesi 09:00 - 19:00"),
      createContactBlock("email", "E-posta", "info@cepdunyasi.com", "mailto:info@cepdunyasi.com", "mail", "Sipariş, destek ve kurumsal talepler"),
      createContactBlock("address", "Adres", "Muğla / Fethiye, Türkiye", "https://maps.google.com/?q=Fethiye+Mugla", "map-pin", "Mağaza ve teslim alma noktası"),
      createContactBlock("hours", "Çalışma Saatleri", "Hafta içi ve Cumartesi 09:00 - 19:00", null, "clock", "Pazar günleri kapalıyız"),
    ],
    isPublished: true,
    robotsNoindex: false,
  },
  kvkk: {
    key: "kvkk",
    slug: "kvkk",
    template: "legal",
    title: "KVKK Aydınlatma Metni",
    metaTitle: "KVKK Aydınlatma Metni | Cep Dünyası",
    metaDescription: "Cep Dünyası kişisel verilerin işlenmesi süreçlerine ilişkin KVKK aydınlatma metnine ulaşın.",
    summary: "6698 sayılı Kanun kapsamında kişisel verilerinizin hangi amaçlarla işlendiğini ve haklarınızı açık şekilde paylaşıyoruz.",
    content:
      "## Veri sorumlusu\nCep Dünyası, kişisel verilerinizin işlenmesinde veri sorumlusu olarak hareket eder.\n\n## İşlenen veriler\nAd soyad, iletişim bilgileri, sipariş ve teknik servis kayıtları gibi veriler işlenebilir.\n\n## İşleme amaçları\nSiparişlerin yürütülmesi, müşteri destek süreçleri, yasal yükümlülüklerin yerine getirilmesi ve hizmet kalitesinin artırılması amacıyla işlem yapılır.\n\n## Haklarınız\nKVKK kapsamındaki başvuru, düzeltme, silme ve itiraz haklarınızı bizimle iletişime geçerek kullanabilirsiniz.",
    sections: [],
    faqItems: [],
    contactBlocks: [],
    isPublished: true,
    robotsNoindex: false,
  },
  distance_sales_contract: {
    key: "distance_sales_contract",
    slug: "mesafeli-satis-sozlesmesi",
    template: "legal",
    title: "Mesafeli Satış Sözleşmesi",
    metaTitle: "Mesafeli Satış Sözleşmesi | Cep Dünyası",
    metaDescription: "Cep Dünyası mesafeli satış sözleşmesi metnine ve sipariş süreçlerine ilişkin yasal detaylara ulaşın.",
    summary: "Sipariş öncesi ve sonrası tarafların hak ve yükümlülüklerini açıklayan mesafeli satış sözleşmesi metni.",
    content:
      "## Taraflar\nBu sözleşme, satıcı ile alıcı arasındaki mesafeli satış işlemine ilişkin hükümleri kapsar.\n\n## Konu\nSözleşme, siparişe konu ürünün nitelikleri, satış bedeli, teslimat ve cayma hakkı süreçlerini düzenler.\n\n## Teslimat ve ifa\nÜrünler, sipariş onayı sonrası belirtilen teslimat koşullarına göre kargoya verilir.\n\n## Cayma hakkı\nAlıcı, ilgili mevzuatta belirtilen koşullar çerçevesinde cayma hakkını kullanabilir.",
    sections: [],
    faqItems: [],
    contactBlocks: [],
    isPublished: true,
    robotsNoindex: false,
  },
  return_exchange_policy: {
    key: "return_exchange_policy",
    slug: "iade-ve-degisim-politikasi",
    template: "policy",
    title: "İade ve Değişim Politikası",
    metaTitle: "İade ve Değişim Politikası | Cep Dünyası",
    metaDescription: "Cep Dünyası iade ve değişim süreçleri, süreler ve ürün bazlı koşullar hakkında detaylı bilgi alın.",
    summary: "İade ve değişim süreçlerinde hangi koşulların geçerli olduğunu açık ve sade bir dille aktarıyoruz.",
    content:
      "## Genel çerçeve\nİade ve değişim süreçleri, yürürlükteki mevzuat ve ürünün durumu dikkate alınarak değerlendirilir.\n\n## Süreler\nİade başvuruları yasal süreler içinde yapılmalıdır.\n\n## Hasarlı ürün süreci\nTeslimat sırasında hasarlı veya eksik görülen paketlerde tutanak tutulması önemlidir.\n\n## Teknik servis bağlantısı\nArızalı ürünlerde doğrudan teknik servis yönlendirmesi yapılabilir.",
    sections: [
      createSection("return-terms", "Hangi ürünlerde iade mümkündür?", "Ambalaj, aksesuar ve kullanım durumu uygun ürünlerde yasal koşullar çerçevesinde iade değerlendirilebilir."),
      createSection("exchange-terms", "Değişim nasıl işler?", "Stok uygunluğuna göre değişim süreci başlatılır ve müşteriye bilgilendirme yapılır."),
      createSection("damage-process", "Hasarlı ürünlerde süreç", "Teslimat anında hasar tespitinde kargo görevlisiyle birlikte tutanak tutulmasını öneririz."),
    ],
    faqItems: [],
    contactBlocks: [],
    isPublished: true,
    robotsNoindex: false,
  },
  privacy_policy: {
    key: "privacy_policy",
    slug: "gizlilik-politikasi",
    template: "legal",
    title: "Gizlilik Politikası",
    metaTitle: "Gizlilik Politikası | Cep Dünyası",
    metaDescription: "Cep Dünyası gizlilik politikası kapsamında toplanan veriler, kullanım amaçları ve kullanıcı hakları hakkında bilgi alın.",
    summary: "Web sitemizi kullanırken toplanan verilerin hangi amaçlarla kullanıldığını ve nasıl korunduğunu açıklıyoruz.",
    content:
      "## Toplanan veriler\nSipariş, üyelik, teknik servis ve iletişim süreçlerinde gerekli olan bilgiler toplanabilir.\n\n## Kullanım amacı\nBu veriler siparişlerin yürütülmesi, müşteri desteği, güvenlik ve hizmet geliştirme amacıyla kullanılır.\n\n## Çerezler\nSite deneyimini iyileştirmek, oturum yönetmek ve ölçümleme yapmak için çerezlerden yararlanılabilir.\n\n## Üçüncü taraf hizmetler\nÖdeme, kargo ve analiz servisleriyle sınırlı veri paylaşımı yapılabilir.\n\n## Kullanıcı hakları\nVerilerinizin kullanımı hakkında bilgi alma ve taleplerinizi iletme hakkına sahipsiniz.",
    sections: [],
    faqItems: [],
    contactBlocks: [],
    isPublished: true,
    robotsNoindex: false,
  },
  delivery_terms: {
    key: "delivery_terms",
    slug: "teslimat-kosullari",
    template: "policy",
    title: "Teslimat Koşulları",
    metaTitle: "Teslimat Koşulları | Cep Dünyası",
    metaDescription: "Sipariş hazırlık, kargo ve teslimat süreciyle ilgili koşulları Cep Dünyası teslimat sayfasında inceleyin.",
    summary: "Sipariş hazırlık süresi, kargo teslim aralığı ve teslimat sırasında dikkat edilmesi gereken başlıklar.",
    content:
      "## Sipariş hazırlık süreci\nSiparişler, stok ve onay durumuna göre mümkün olan en kısa sürede hazırlanır.\n\n## Kargo süresi\nTeslimat süresi adres, resmi tatil ve yoğunluk durumuna göre değişebilir.\n\n## Teslimat anında dikkat edilmesi gerekenler\nPaketi teslim alırken dış ambalajı kontrol etmenizi ve sorun varsa kargo görevlisiyle tutanak tutmanızı öneririz.",
    sections: [
      createSection("prep-time", "Hazırlık Süresi", "Stoktaki ürünler genellikle kısa süre içinde kargoya verilir."),
      createSection("shipping-zone", "Teslimat Bölgeleri", "Türkiye geneline teslimat yapılır; bazı bölgelerde süre farklılaşabilir."),
      createSection("holiday", "Resmi Tatiller", "Resmi tatil ve yoğun kampanya dönemlerinde teslimat süreleri uzayabilir."),
    ],
    faqItems: [],
    contactBlocks: [],
    isPublished: true,
    robotsNoindex: false,
  },
  faq: {
    key: "faq",
    slug: "sss",
    template: "faq",
    title: "Sık Sorulan Sorular",
    metaTitle: "Sık Sorulan Sorular | Cep Dünyası",
    metaDescription: "Sipariş, kargo, iade, garanti ve teknik servis süreçleri hakkında sık sorulan sorulara hızlıca ulaşın.",
    summary: "Siparişten teslimata, teknik servisten iade süreçlerine kadar en sık sorulan soruları tek sayfada topladık.",
    content: "## Yardım Merkezi\nMerak edilen konuları hızlıca bulabilmeniz için soru ve cevapları düzenli gruplar halinde sunuyoruz.",
    sections: [],
    faqItems: [
      createFaq("faq-1", "Siparişim ne zaman kargoya verilir?", "Stoktaki ürünler sipariş onayından sonra mümkün olan en kısa sürede hazırlanır ve kargoya teslim edilir.", 0, "Sipariş"),
      createFaq("faq-2", "İade süreci nasıl işler?", "İade ve değişim taleplerinizi ilgili yasal süre içinde hesabınız veya iletişim kanallarımız üzerinden iletebilirsiniz.", 1, "İade"),
      createFaq("faq-3", "Teknik servis başvurusu nasıl yapabilirim?", "Teknik servis sayfasından arıza kaydı oluşturabilir ve süreç durumunu hesabınızdan takip edebilirsiniz.", 2, "Teknik Servis"),
      createFaq("faq-4", "Kapıda ödeme var mı?", "Mevcut ödeme seçenekleri ödeme sayfasında ve sipariş akışında gösterilir.", 3, "Ödeme"),
    ],
    contactBlocks: [],
    isPublished: true,
    robotsNoindex: false,
  },
};

export const CORPORATE_PAGE_ORDER = Object.keys(CORPORATE_PAGE_DEFINITIONS) as CorporatePageKey[];

export function isCorporatePageKey(value: string): value is CorporatePageKey {
  return Object.prototype.hasOwnProperty.call(CORPORATE_PAGE_DEFINITIONS, value);
}

export function getCorporatePageDefinition(pageKey: CorporatePageKey) {
  return CORPORATE_PAGE_DEFINITIONS[pageKey];
}

export function getCorporatePageDefinitionBySlug(slug: string) {
  return CORPORATE_PAGE_ORDER.map((pageKey) => CORPORATE_PAGE_DEFINITIONS[pageKey]).find((item) => item.slug === slug) ?? null;
}

export function getCorporatePagePath(pageKey: CorporatePageKey) {
  return `/${CORPORATE_PAGE_DEFINITIONS[pageKey].slug}`;
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizeCorporateSections(value: unknown, fallback: CorporatePageSection[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Partial<CorporatePageSection>;
      const title = normalizeString(record.title);
      const content = normalizeString(record.content);

      if (!title && !content) {
        return null;
      }

      return {
        id: normalizeString(record.id, `section-${index + 1}`),
        title,
        content,
        style: record.style === "default" ? "default" : "card",
      } satisfies CorporatePageSection;
    })
    .filter((item): item is CorporatePageSection => Boolean(item));
}

export function normalizeCorporateFaqItems(value: unknown, fallback: CorporateFaqItem[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Partial<CorporateFaqItem>;
      const question = normalizeString(record.question);
      const answer = normalizeString(record.answer);

      if (!question || !answer) {
        return null;
      }

      return {
        id: normalizeString(record.id, `faq-${index + 1}`),
        question,
        answer,
        category: normalizeString(record.category ?? null, "") || null,
        order: typeof record.order === "number" ? record.order : index,
        isActive: record.isActive !== false,
      } satisfies CorporateFaqItem;
    })
    .filter((item): item is CorporateFaqItem => Boolean(item))
    .sort((left, right) => left.order - right.order)
    .filter((item) => item.isActive);
}

export function normalizeCorporateContactBlocks(value: unknown, fallback: CorporateContactBlock[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Partial<CorporateContactBlock>;
      const label = normalizeString(record.label);
      const displayValue = normalizeString(record.value);

      if (!label || !displayValue) {
        return null;
      }

      return {
        id: normalizeString(record.id, `contact-${index + 1}`),
        label,
        value: displayValue,
        href: normalizeString(record.href ?? null, "") || null,
        icon: normalizeString(record.icon ?? null, "") || null,
        description: normalizeString(record.description ?? null, "") || null,
      } satisfies CorporateContactBlock;
    })
    .filter((item): item is CorporateContactBlock => Boolean(item));
}

export function mergeCorporatePageRecord(
  pageKey: CorporatePageKey,
  value?: Partial<{
    slug: string | null;
    title: string | null;
    meta_title: string | null;
    meta_description: string | null;
    summary: string | null;
    content: string | null;
    sections: unknown;
    faq_items: unknown;
    contact_blocks: unknown;
    is_published: boolean;
    robots_noindex: boolean;
    updated_at: string | Date | null;
  }>,
): CorporatePageRecord {
  const definition = getCorporatePageDefinition(pageKey);

  return {
    key: definition.key,
    slug: definition.slug,
    template: definition.template,
    title: normalizeString(value?.title, definition.title),
    metaTitle: normalizeString(value?.meta_title, definition.metaTitle),
    metaDescription: normalizeString(value?.meta_description, definition.metaDescription),
    summary: normalizeString(value?.summary, definition.summary),
    content: normalizeString(value?.content, definition.content),
    sections: normalizeCorporateSections(value?.sections, definition.sections),
    faqItems: normalizeCorporateFaqItems(value?.faq_items, definition.faqItems),
    contactBlocks: normalizeCorporateContactBlocks(value?.contact_blocks, definition.contactBlocks),
    isPublished: typeof value?.is_published === "boolean" ? value.is_published : definition.isPublished,
    robotsNoindex: typeof value?.robots_noindex === "boolean" ? value.robots_noindex : definition.robotsNoindex,
    updatedAt:
      value?.updated_at instanceof Date
        ? value.updated_at.toISOString()
        : typeof value?.updated_at === "string"
          ? value.updated_at
          : null,
  };
}

export function toCorporatePageListItem(page: CorporatePageRecord): CorporatePageListItem {
  return {
    key: page.key,
    slug: page.slug,
    template: page.template,
    title: page.title,
    isPublished: page.isPublished,
    updatedAt: page.updatedAt,
  };
}
