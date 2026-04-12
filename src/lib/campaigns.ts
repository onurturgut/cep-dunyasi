export type CampaignRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  badgeText: string | null;
  badgeColor: string | null;
  isActive: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignFormValues = {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  mobileImageUrl: string;
  ctaText: string;
  ctaLink: string;
  badgeText: string;
  badgeColor: string;
  isActive: boolean;
  order: number;
  startDate: string;
  endDate: string;
};

export type CampaignCategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string | null;
};

export type CampaignCtaOption = {
  value: string;
  label: string;
  href: string;
  kind: "none" | "preset" | "category" | "custom";
};

export const defaultCampaignFormValues: CampaignFormValues = {
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  mobileImageUrl: "",
  ctaText: "",
  ctaLink: "",
  badgeText: "",
  badgeColor: "#111827",
  isActive: true,
  order: 0,
  startDate: "",
  endDate: "",
};

export const campaignBadgePresets = [
  { label: "Gece", value: "#111827" },
  { label: "Kirmizi", value: "#be123c" },
  { label: "Lacivert", value: "#1d4ed8" },
  { label: "Zumrut", value: "#047857" },
  { label: "Altin", value: "#b45309" },
] as const;

function buildCategoryTrail(category: CampaignCategoryOption, categoryById: Map<string, CampaignCategoryOption>) {
  const visited = new Set<string>();
  const parts = [category.name];
  let currentParentId = category.parentCategoryId ?? null;

  while (currentParentId && !visited.has(currentParentId)) {
    visited.add(currentParentId);
    const parent = categoryById.get(currentParentId);
    if (!parent) {
      break;
    }
    parts.unshift(parent.name);
    currentParentId = parent.parentCategoryId ?? null;
  }

  return parts.join(" / ");
}

export function buildCampaignCtaOptions(categories: CampaignCategoryOption[]): CampaignCtaOption[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const categoryOptions = [...categories]
    .sort((left, right) => buildCategoryTrail(left, categoryById).localeCompare(buildCategoryTrail(right, categoryById), "tr"))
    .map((category) => ({
      value: `category:${category.slug}`,
      label: `Kategori: ${buildCategoryTrail(category, categoryById)}`,
      href: `/products?category=${category.slug}`,
      kind: "category" as const,
    }));

  return [
    { value: "none", label: "Yonlendirme yok", href: "", kind: "none" },
    { value: "products", label: "Tum urunler", href: "/products", kind: "preset" },
    { value: "technical-service", label: "Teknik servis", href: "/technical-service", kind: "preset" },
    { value: "contact", label: "Iletisim", href: "/iletisim", kind: "preset" },
    ...categoryOptions,
    { value: "custom", label: "Ozel baglanti", href: "", kind: "custom" },
  ];
}

export function resolveCampaignCtaSelection(ctaLink: string, options: CampaignCtaOption[]) {
  const normalizedLink = ctaLink.trim();
  if (!normalizedLink) {
    return "none";
  }

  const matchedOption = options.find((option) => option.kind !== "custom" && option.href === normalizedLink);
  return matchedOption?.value ?? "custom";
}

function expandHexColor(value: string) {
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }

  return value;
}

function isLightHexColor(value: string) {
  const normalized = expandHexColor(value).replace("#", "");
  if (normalized.length !== 6) {
    return false;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return false;
  }

  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 160;
}

export function getCampaignBadgeStyle(color: string | null | undefined) {
  const normalized = `${color ?? ""}`.trim();

  if (!normalized) {
    return {
      backgroundColor: "rgba(17, 24, 39, 0.88)",
      color: "#ffffff",
    };
  }

  return {
    backgroundColor: normalized,
    color: isLightHexColor(normalized) ? "#111827" : "#ffffff",
  };
}

export function toCampaignFormValues(campaign: CampaignRecord): CampaignFormValues {
  return {
    id: campaign.id,
    title: campaign.title,
    subtitle: campaign.subtitle ?? "",
    description: campaign.description ?? "",
    imageUrl: campaign.imageUrl,
    mobileImageUrl: campaign.mobileImageUrl ?? "",
    ctaText: campaign.ctaText ?? "",
    ctaLink: campaign.ctaLink ?? "",
    badgeText: campaign.badgeText ?? "",
    badgeColor: campaign.badgeColor ?? "#111827",
    isActive: campaign.isActive,
    order: campaign.order,
    startDate: campaign.startDate ? campaign.startDate.slice(0, 16) : "",
    endDate: campaign.endDate ? campaign.endDate.slice(0, 16) : "",
  };
}
