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
};

export type HomeProduct = any;

export const defaultCategories: HomeCategory[] = [
  { id: 'default-telefon', name: 'Telefon', slug: 'telefon', icon: 'Smartphone' },
  { id: 'default-ikinci-el-telefon', name: '2. El Telefonlar', slug: 'ikinci-el-telefon', icon: 'Smartphone' },
  { id: 'default-akilli-saat', name: 'Akilli Saatler', slug: 'akilli-saatler', icon: 'Watch' },
  { id: 'default-kilif', name: 'Kilif', slug: 'kilif', icon: 'ShieldCheck' },
  { id: 'default-sarj', name: 'Sarj Aleti', slug: 'sarj-aleti', icon: 'BatteryCharging' },
  { id: 'default-power', name: 'Power Bank', slug: 'power-bank', icon: 'Battery' },
  { id: 'default-servis', name: 'Teknik Servis', slug: 'teknik-servis', icon: 'Wrench' },
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

export const topBenefits = [
  { icon: Truck, title: 'Ayni gun kargo', desc: 'Hizli ve guvenli teslimat' },
  { icon: ShieldCheck, title: 'Orijinal urunler', desc: 'Yetkili distributor garantili' },
  { icon: CreditCard, title: '2 yil garanti', desc: 'Tum cihazlarda gecerli' },
];

export const heroSlides = [
  { id: 'slide-iphone', src: '/images/iphone15.png', alt: 'iPhone 15' },
  { id: 'slide-s24', src: '/images/samsung s24.png', alt: 'Samsung S24' },
  { id: 'slide-kilif', src: '/images/kılıf.png', alt: 'Telefon Kilifi' },
  { id: 'slide-airpods', src: '/images/airpods.png', alt: 'AirPods' },
];
