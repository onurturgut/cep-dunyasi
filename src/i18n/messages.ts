export type LocaleMessages = {
  common: {
    language: string;
    locales: {
      tr: { short: string; label: string };
      en: { short: string; label: string };
    };
  };
  header: {
    brandAlt: string;
    mobileNavLinks: Array<{ label: string; href: string }>;
    actions: {
      search: string;
      cart: string;
      favorites: string;
      admin: string;
      adminPanel: string;
      account: string;
      accountMenu: string;
      signOut: string;
      signOutMobile: string;
      signIn: string;
      theme: string;
      switchToLight: string;
      switchToDark: string;
      menu: string;
    };
  };
  footer: {
    brandName: string;
    description: string;
    sections: {
      categories: string;
      services: string;
      corporate: string;
      legal: string;
    };
    links: {
      phones: string;
      secondHandPhones: string;
      smartWatches: string;
      cases: string;
      chargers: string;
      powerBanks: string;
      technicalService: string;
      createAccount: string;
      about: string;
      contact: string;
      faq: string;
      kvkk: string;
      privacy: string;
      distanceSales: string;
      returnPolicy: string;
      deliveryTerms: string;
    };
    contact: {
      viewLocation: string;
      rightsReserved: string;
    };
  };
  account: {
    nav: {
      profile: string;
      addresses: string;
      orders: string;
      favorites: string;
      returns: string;
      technicalService: string;
      security: string;
    };
    mobileNavPlaceholder: string;
    technicalService: {
      title: string;
      description: string;
      newRequest: string;
      loadError: string;
      emptyTitle: string;
      emptyDescription: string;
      requestCard: {
        recordLabel: string;
        issueSummary: string;
        image: string;
        uploaded: string;
        none: string;
        serviceNote: string;
        available: string;
        pending: string;
        latestNote: string;
      };
      statuses: {
        new: string;
        reviewing: string;
        repairing: string;
        ready: string;
        delivered: string;
      };
    };
  };
  notFound: {
    title: string;
    backHome: string;
  };
};

export const trMessages: LocaleMessages = {
  common: {
    language: "Dil",
    locales: {
      tr: { short: "TR", label: "Turkce" },
      en: { short: "EN", label: "English" },
    },
  },
  header: {
    brandAlt: "Cep Dunyasi",
    mobileNavLinks: [
      { label: "Ana Sayfa", href: "/" },
      { label: "Telefonlar", href: "/products?category=telefon" },
      { label: "2. El Telefonlar", href: "/products?category=ikinci-el-telefon" },
      { label: "Saatler", href: "/products?category=akilli-saatler" },
      { label: "Kılıflar", href: "/products?category=kilif" },
      { label: "Sarj Aleti", href: "/products?category=sarj-aleti" },
      { label: "Power Bank", href: "/products?category=power-bank" },
      { label: "Teknik Servis", href: "/technical-service" },
    ],
    actions: {
      search: "Ürünleri ara",
      cart: "Sepeti ac",
      favorites: "Favorilere git",
      admin: "Admin",
      adminPanel: "Admin Panel",
      account: "Hesap",
      accountMenu: "Hesabim",
      signOut: "Çıkış",
      signOutMobile: "Çıkış Yap",
      signIn: "Giriş Yap",
      theme: "Tema",
      switchToLight: "Gunduz moduna gec",
      switchToDark: "Gece moduna gec",
      menu: "Menu",
    },
  },
  footer: {
    brandName: "Cep Dunyasi",
    description: "Premium telefonlar, aksesuarlar ve teknik servis cozumleriyle her ekranda hizli ve guvenilir alisveris deneyimi.",
    sections: {
      categories: "Kategoriler",
      services: "Hizmetler",
      corporate: "Kurumsal",
      legal: "Yasal",
    },
    links: {
      phones: "Telefonlar",
      secondHandPhones: "2. El Telefonlar",
      smartWatches: "Akilli Saatler",
      cases: "Kılıflar",
      chargers: "Sarj Aletleri",
      powerBanks: "Power Bank",
      technicalService: "Teknik Servis",
      createAccount: "Hesap Olustur",
      about: "Hakkimizda",
      contact: "Iletisim",
      faq: "Sik Sorulan Sorular",
      kvkk: "KVKK",
      privacy: "Gizlilik Politikasi",
      distanceSales: "Mesafeli Satis Sozlesmesi",
      returnPolicy: "İade ve Değişim Politikasi",
      deliveryTerms: "Teslimat Koşulları",
    },
    contact: {
      viewLocation: "Konumu Gör",
      rightsReserved: "Tum haklari saklidir.",
    },
  },
  account: {
    nav: {
      profile: "Profil Bilgileri",
      addresses: "Adreslerim",
      orders: "Siparislerim",
      favorites: "Favorilerim",
      returns: "İade / Değişim",
      technicalService: "Teknik Servis",
      security: "Guvenlik",
    },
    mobileNavPlaceholder: "Hesap bolumu secin",
    technicalService: {
      title: "Teknik Servis Gecmisim",
      description: "Başvurularinizin durumlarini, servis notlarini ve onceki kayitlarinizi buradan takip edin.",
      newRequest: "Yeni Başvuru",
      loadError: "Servis gecmisi yuklenemedi",
      emptyTitle: "Henuz teknik servis kaydiniz yok",
      emptyDescription: "Olusturdugunuz teknik servis basvurulari ve durum guncellemeleri burada listelenecek.",
      requestCard: {
        recordLabel: "Servis Kaydi",
        issueSummary: "Ariza Ozeti",
        image: "Görsel",
        uploaded: "Yuklendi",
        none: "Yok",
        serviceNote: "Servis Notu",
        available: "Mevcut",
        pending: "Bekleniyor",
        latestNote: "Son Not",
      },
      statuses: {
        new: "Alindi",
        reviewing: "Inceleniyor",
        repairing: "Tamirde",
        ready: "Hazir",
        delivered: "Teslim Edildi",
      },
    },
  },
  notFound: {
    title: "Sayfa bulunamadi",
    backHome: "Ana sayfaya don",
  },
};

export const enMessages: LocaleMessages = {
  common: {
    language: "Language",
    locales: {
      tr: { short: "TR", label: "Turkish" },
      en: { short: "EN", label: "English" },
    },
  },
  header: {
    brandAlt: "Cep Dunyasi",
    mobileNavLinks: [
      { label: "Home", href: "/" },
      { label: "Phones", href: "/products?category=telefon" },
      { label: "Second-Hand Phones", href: "/products?category=ikinci-el-telefon" },
      { label: "Watches", href: "/products?category=akilli-saatler" },
      { label: "Cases", href: "/products?category=kilif" },
      { label: "Chargers", href: "/products?category=sarj-aleti" },
      { label: "Power Banks", href: "/products?category=power-bank" },
      { label: "Technical Service", href: "/technical-service" },
    ],
    actions: {
      search: "Search products",
      cart: "Open cart",
      favorites: "Go to favorites",
      admin: "Admin",
      adminPanel: "Admin Panel",
      account: "Account",
      accountMenu: "My Account",
      signOut: "Sign Out",
      signOutMobile: "Sign Out",
      signIn: "Sign In",
      theme: "Theme",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
      menu: "Menu",
    },
  },
  footer: {
    brandName: "Cep Dunyasi",
    description: "A fast and reliable shopping experience for premium phones, accessories, and technical service solutions.",
    sections: {
      categories: "Categories",
      services: "Services",
      corporate: "Corporate",
      legal: "Legal",
    },
    links: {
      phones: "Phones",
      secondHandPhones: "Second-Hand Phones",
      smartWatches: "Smart Watches",
      cases: "Cases",
      chargers: "Chargers",
      powerBanks: "Power Banks",
      technicalService: "Technical Service",
      createAccount: "Create Account",
      about: "About Us",
      contact: "Contact",
      faq: "FAQ",
      kvkk: "KVKK",
      privacy: "Privacy Policy",
      distanceSales: "Distance Sales Agreement",
      returnPolicy: "Return and Exchange Policy",
      deliveryTerms: "Delivery Terms",
    },
    contact: {
      viewLocation: "View Location",
      rightsReserved: "All rights reserved.",
    },
  },
  account: {
    nav: {
      profile: "Profile",
      addresses: "Addresses",
      orders: "Orders",
      favorites: "Favorites",
      returns: "Returns / Exchanges",
      technicalService: "Technical Service",
      security: "Security",
    },
    mobileNavPlaceholder: "Select account section",
    technicalService: {
      title: "Technical Service History",
      description: "Track your request statuses, service notes, and previous records here.",
      newRequest: "New Request",
      loadError: "Service history could not be loaded",
      emptyTitle: "You do not have a technical service request yet",
      emptyDescription: "The technical service requests and status updates you create will appear here.",
      requestCard: {
        recordLabel: "Service Record",
        issueSummary: "Issue Summary",
        image: "Image",
        uploaded: "Uploaded",
        none: "None",
        serviceNote: "Service Note",
        available: "Available",
        pending: "Pending",
        latestNote: "Latest Note",
      },
      statuses: {
        new: "Received",
        reviewing: "Reviewing",
        repairing: "Repairing",
        ready: "Ready",
        delivered: "Delivered",
      },
    },
  },
  notFound: {
    title: "Page not found",
    backHome: "Back to home",
  },
};

export const localeMessages = {
  tr: trMessages,
  en: enMessages,
} as const;

