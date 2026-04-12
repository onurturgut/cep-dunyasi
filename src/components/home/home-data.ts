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
} from "lucide-react";

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
  shipping_fee: number;
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

export const defaultCategories: HomeCategory[] = [];

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
      icon: category.icon || fallback?.icon || "Smartphone",
      description: category.description || fallback?.description || "",
      image_url: category.image_url || fallback?.image_url || "",
    });
  });

  return Array.from(categoriesBySlug.values());
}

export const defaultSiteContent: HomeSiteContent = {
  hero_title_prefix: "",
  hero_title_highlight: "",
  hero_title_suffix: "",
  hero_subtitle: "",
  hero_logo_light_url: "",
  hero_logo_dark_url: "",
  hero_cta_label: "",
  hero_cta_href: "",
  shipping_fee: 0,
  hero_slides: [],
  hero_benefits: [],
  category_section_title: "",
  category_section_description: "",
  category_banner_enabled: false,
  category_banner_main_image: "",
  category_banner_video: "",
  category_banner_video_link: "",
  category_banner_badge_text: "",
  category_banner_intro_text: "",
  category_banner_brand_title: "",
  category_banner_stat_1_label: "",
  category_banner_stat_1_value: "",
  category_banner_stat_2_label: "",
  category_banner_stat_2_value: "",
  category_banner_highlight_label: "",
  category_banner_brand_desc_1: "",
  category_banner_brand_desc_2: "",
  category_banner_brand_desc_3: "",
  category_banner_slots: ["", "", "", "", ""],
  explore_section_title: "",
  featured_section_title: "",
  featured_section_cta_label: "",
  featured_section_cta_href: "",
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
