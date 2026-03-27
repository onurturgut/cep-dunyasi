import {
  Battery,
  BatteryCharging,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Truck,
  Watch,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  image_url?: string;
};

export type HomeProduct = any;

export type HomeSiteContent = {
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_title_suffix: string;
  hero_subtitle: string;
  hero_logo_light_url: string;
  hero_logo_dark_url: string;
  hero_cta_label: string;
  hero_cta_href: string;
  hero_slides: Array<{ id: string; image_url: string; alt: string }>;
  hero_benefits: Array<{ icon: string; title: string; desc: string }>;
  category_section_title: string;
  category_section_description: string;
  category_banner_enabled: boolean;
  category_banner_main_image: string;
  category_banner_video: string;
  category_banner_video_link: string;
  category_banner_badge_text: string;
  category_banner_intro_text: string;
  category_banner_brand_title: string;
  category_banner_stat_1_label: string;
  category_banner_stat_1_value: string;
  category_banner_stat_2_label: string;
  category_banner_stat_2_value: string;
  category_banner_highlight_label: string;
  category_banner_brand_desc_1: string;
  category_banner_brand_desc_2: string;
  category_banner_brand_desc_3: string;
  category_banner_slots: string[];
  explore_section_title: string;
  featured_section_title: string;
  featured_section_cta_label: string;
  featured_section_cta_href: string;
};

export const defaultCategories: HomeCategory[] = [
  { id: 'default-telefon', name: 'Telefon', slug: 'telefon', icon: 'Smartphone', description: '', image_url: '/images/kategorileri_kesfet/telefon.png' },
  { id: 'default-ikinci-el-telefon', name: '2. El Telefonlar', slug: 'ikinci-el-telefon', icon: 'Smartphone', description: '', image_url: '/images/kategorileri_kesfet/2.el_telefon.png' },
  { id: 'default-akilli-saat', name: 'Akıllı Saatler', slug: 'akilli-saatler', icon: 'Watch', description: '', image_url: '/images/kategorileri_kesfet/saat.png' },
  { id: 'default-kilif', name: 'Kılıf', slug: 'kilif', icon: 'ShieldCheck', description: '', image_url: '/images/kategorileri_kesfet/kilif.png' },
  { id: 'default-sarj', name: 'Şarj Aleti', slug: 'sarj-aleti', icon: 'BatteryCharging', description: '', image_url: '/images/sarj_aleti.webp' },
  { id: 'default-power', name: 'Power Bank', slug: 'power-bank', icon: 'Battery', description: '', image_url: '/images/kategorileri_kesfet/powerbank.png' },
  { id: 'default-servis', name: 'Teknik Servis', slug: 'teknik-servis', icon: 'Wrench', description: '', image_url: '/images/kategorileri_kesfet/teknik_servis.png' },
];

export const hiddenHomeCategorySlugs = new Set([
  'telefon',
  'ikinci-el-telefon',
  'akilli-saatler',
  'kilif',
  'sarj-aleti',
  'power-bank',
  'teknik-servis',
]);

export const categorySlotImages = ['image copy 2.png', 'image copy 3.png', 'image copy 4.png'];

export const categoryIcons: Record<string, LucideIcon> = {
  Smartphone,
  ShieldCheck,
  BatteryCharging,
  Battery,
  Wrench,
  Watch,
};

export function mergeCategories(fallbackCategories: HomeCategory[], dbCategories: HomeCategory[]) {
  const categoriesBySlug = new Map<string, HomeCategory>();

  fallbackCategories.forEach((category) => {
    categoriesBySlug.set(category.slug, category);
  });

  dbCategories.forEach((category) => {
    const fallback = categoriesBySlug.get(category.slug);
    categoriesBySlug.set(category.slug, {
      ...fallback,
      ...category,
      icon: category.icon || fallback?.icon || 'Smartphone',
      description: category.description || fallback?.description || '',
      image_url: category.image_url || fallback?.image_url || '',
    });
  });

  return Array.from(categoriesBySlug.values());
}

export const defaultSiteContent: HomeSiteContent = {
  hero_title_prefix: 'Teknolojinin',
  hero_title_highlight: 'Gücünü',
  hero_title_suffix: 'ile keşfet',
  hero_subtitle: 'Premium telefon ve aksesuarlar',
  hero_logo_light_url: '/images/cep-dunyasi-logo-black-v3-tight.png',
  hero_logo_dark_url: '/images/cep-dunyasi-logo-dark-v3-tight.png',
  hero_cta_label: 'Ürünleri İncele',
  hero_cta_href: '/products',
  hero_slides: [
    { id: 'slide-iphone', image_url: '/images/iphone15.png', alt: 'iPhone 15' },
    { id: 'slide-s24', image_url: '/images/samsung s24.png', alt: 'Samsung S24' },
    { id: 'slide-kilif', image_url: '/images/kilif.png', alt: 'Telefon Kılıfı' },
    { id: 'slide-airpods', image_url: '/images/airpods.png', alt: 'AirPods' },
  ],
  hero_benefits: [
    { icon: 'Truck', title: 'Aynı gün kargo', desc: 'Hızlı ve güvenli teslimat' },
    { icon: 'ShieldCheck', title: 'Orijinal ürünler', desc: 'Yetkili distribütör garantili' },
    { icon: 'CreditCard', title: '2 yıl garanti', desc: 'Tüm cihazlarda geçerli' },
  ],
  category_section_title: 'Kategoriler',
  category_section_description: '',
  category_banner_enabled: true,
  category_banner_main_image: 'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev/banner/image-copy.png',
  category_banner_video: 'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev/banner/afis1.mp4',
  category_banner_video_link: '/products?category=telefon',
  category_banner_badge_text: 'Brand Finance 2025',
  category_banner_intro_text: 'Premium teknoloji vitrini, güven veren marka konumlanması ve temiz bir sunum diliyle desteklenir.',
  category_banner_brand_title: 'Türkiye\'nin En Değerli Markaları Arasında!',
  category_banner_stat_1_label: 'Odak',
  category_banner_stat_1_value: 'Premium mobil deneyim',
  category_banner_stat_2_label: 'Konum',
  category_banner_stat_2_value: 'Güçlü marka algısı',
  category_banner_highlight_label: 'Öne Çıkan Vurgu',
  category_banner_brand_desc_1: 'Uluslararası marka değerlendirme kuruluşu Brand Finance\'in "Türkiye 2025" raporunda Reeder, ülkemizin en değerli ve en güçlü markaları arasında yerini aldı.',
  category_banner_brand_desc_2: 'Brand Finance "Türkiye 2025" listesinde',
  category_banner_brand_desc_3: 'Reeder, Türkiye\'nin en değerli 3. cihaz üreticisi konumunda.',
  category_banner_slots: [
    'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev/banner/image-copy-2.png',
    'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev/banner/image-copy-3.png',
    'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev/banner/image-copy-4.png',
    'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev/banner/image-copy-2.png',
    'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev/banner/image-copy-3.png'
  ],
  explore_section_title: 'Kategorileri Keşfet',
  featured_section_title: 'Öne Çıkan Ürünler',
  featured_section_cta_label: 'Tüm Ürünleri Gör',
  featured_section_cta_href: '/products',
};

export const sectionReveal = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export const benefitIcons: Record<string, LucideIcon> = {
  Truck,
  ShieldCheck,
  CreditCard,
  Smartphone,
  BatteryCharging,
  Battery,
  Wrench,
  Watch,
};
