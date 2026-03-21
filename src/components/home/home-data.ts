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
  explore_section_title: string;
  featured_section_title: string;
  featured_section_cta_label: string;
  featured_section_cta_href: string;
};

export const defaultCategories: HomeCategory[] = [
  { id: 'default-telefon', name: 'Telefon', slug: 'telefon', icon: 'Smartphone', description: '', image_url: '' },
  { id: 'default-ikinci-el-telefon', name: '2. El Telefonlar', slug: 'ikinci-el-telefon', icon: 'Smartphone', description: '', image_url: '' },
  { id: 'default-akilli-saat', name: 'Akilli Saatler', slug: 'akilli-saatler', icon: 'Watch', description: '', image_url: '' },
  { id: 'default-kilif', name: 'Kilif', slug: 'kilif', icon: 'ShieldCheck', description: '', image_url: '' },
  { id: 'default-sarj', name: 'Sarj Aleti', slug: 'sarj-aleti', icon: 'BatteryCharging', description: '', image_url: '' },
  { id: 'default-power', name: 'Power Bank', slug: 'power-bank', icon: 'Battery', description: '', image_url: '' },
  { id: 'default-servis', name: 'Teknik Servis', slug: 'teknik-servis', icon: 'Wrench', description: '', image_url: '' },
];

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
    categoriesBySlug.set(category.slug, category);
  });

  return Array.from(categoriesBySlug.values());
}

export const defaultSiteContent: HomeSiteContent = {
  hero_title_prefix: 'Teknolojinin',
  hero_title_highlight: 'Gucunu',
  hero_title_suffix: 'ile kesfet',
  hero_subtitle: 'Premium telefon ve aksesuarlar',
  hero_logo_light_url: '/images/cep-dunyasi-logo-black-v3-tight.png',
  hero_logo_dark_url: '/images/cep-dunyasi-logo-dark-v3-tight.png',
  hero_cta_label: 'Urunleri Incele',
  hero_cta_href: '/products',
  hero_slides: [
    { id: 'slide-iphone', image_url: '/images/iphone15.png', alt: 'iPhone 15' },
    { id: 'slide-s24', image_url: '/images/samsung s24.png', alt: 'Samsung S24' },
    { id: 'slide-kilif', image_url: '/images/kılıf.png', alt: 'Telefon Kilifi' },
    { id: 'slide-airpods', image_url: '/images/airpods.png', alt: 'AirPods' },
  ],
  hero_benefits: [
    { icon: 'Truck', title: 'Ayni gun kargo', desc: 'Hizli ve guvenli teslimat' },
    { icon: 'ShieldCheck', title: 'Orijinal urunler', desc: 'Yetkili distributor garantili' },
    { icon: 'CreditCard', title: '2 yil garanti', desc: 'Tum cihazlarda gecerli' },
  ],
  category_section_title: 'Kategoriler',
  category_section_description: '',
  explore_section_title: 'Kategorileri Kesfet',
  featured_section_title: 'One Cikan Urunler',
  featured_section_cta_label: 'Tum Urunleri Gor',
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
