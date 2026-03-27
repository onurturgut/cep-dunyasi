"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/integrations/mongo/client";
import {
  createEmptyCatalogFilters,
  getCatalogFilterProfile,
  getCatalogVariantOptions,
  getDisplayVariantForCatalogProduct,
  matchesCatalogFilters,
  sortCatalogProducts,
  type CatalogFilters,
  type CatalogProductRecord,
  type ProductSortOption,
} from "@/lib/product-catalog";
import {
  SECOND_HAND_BATTERY_BUCKETS,
  SECOND_HAND_CONDITION_OPTIONS,
  SECOND_HAND_WARRANTY_OPTIONS,
} from "@/lib/second-hand";
import { getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";

const defaultCategories = [
  { id: "default-telefon", name: "Telefon", slug: "telefon", icon: "Smartphone" },
  { id: "default-ikinci-el-telefon", name: "2. El Telefonlar", slug: "ikinci-el-telefon", icon: "Smartphone" },
  { id: "default-akilli-saat", name: "Akıllı Saatler", slug: "akilli-saatler", icon: "Watch" },
  { id: "default-kilif", name: "Kılıf", slug: "kilif", icon: "ShieldCheck" },
  { id: "default-sarj", name: "Şarj Aleti", slug: "sarj-aleti", icon: "BatteryCharging" },
  { id: "default-power", name: "Power Bank", slug: "power-bank", icon: "Battery" },
  { id: "default-servis", name: "Teknik Servis", slug: "teknik-servis", icon: "Wrench" },
];

const SORT_OPTIONS: Array<{ value: ProductSortOption; label: string }> = [
  { value: "newest", label: "En Yeniler" },
  { value: "best_selling", label: "En Çok Satanlar" },
  { value: "price_asc", label: "Fiyat Artan" },
  { value: "price_desc", label: "Fiyat Azalan" },
  { value: "rating_desc", label: "Puana Göre" },
];

type FacetOption = {
  value: string;
  label: string;
  count: number;
};

type FacetSection = {
  id: string;
  title: string;
  options: FacetOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
};

type FilterPanelCardProps = {
  currentCategoryName: string;
  totalCount: number;
  activeFilterCount: number;
  search: string;
  isSecondHandIphoneCategory: boolean;
  facetSections: FacetSection[];
  filters: CatalogFilters;
  setFilters: Dispatch<SetStateAction<CatalogFilters>>;
  hasPendingChanges: boolean;
  saveFilters: () => void;
  resetFilters: () => void;
};

function isAppleBrand(value: string | null | undefined) {
  return `${value ?? ""}`.trim().toLocaleLowerCase("tr-TR") === "apple";
}

function mergeCategories(fallbackCategories: Array<Record<string, string>>, dbCategories: Array<Record<string, string>>) {
  const categoriesBySlug = new Map<string, Record<string, string>>();

  fallbackCategories.forEach((category) => {
    categoriesBySlug.set(category.slug, category);
  });

  dbCategories.forEach((category) => {
    categoriesBySlug.set(category.slug, category);
  });

  return Array.from(categoriesBySlug.values());
}

function matchesSearch(product: CatalogProductRecord, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  const searchable = [product.name, product.brand, product.description]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  return searchable.includes(normalizedSearch);
}

function toggleStringValue(values: string[] | undefined, value: string) {
  const currentValues = values ?? [];
  return currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
}

function toggleNumberValue(values: number[] | undefined, value: number) {
  const currentValues = values ?? [];
  return currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
}

function areFiltersEqual(left: CatalogFilters, right: CatalogFilters) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function FilterFacetSection({ section }: { section: FacetSection }) {
  if (section.options.length === 0) {
    return null;
  }

  const content = (
    <div className="space-y-2">
      {section.options.map((option) => {
        const inputId = `${section.id}-${option.value}`;
        const checked = section.selectedValues.includes(option.value);

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-muted/40"
          >
            <Checkbox
              id={inputId}
              checked={checked}
              onCheckedChange={() => section.onToggle(option.value)}
              className="mt-0.5 h-5 w-5 rounded-md border-border/80 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
            />
            <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="truncate text-[15px] font-medium text-foreground">{option.label}</span>
              <span className="shrink-0 text-sm text-muted-foreground">({option.count})</span>
            </span>
          </label>
        );
      })}
    </div>
  );

  return (
    <section className="border-t border-border/60 pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-[1.05rem] font-semibold leading-none tracking-tight text-foreground">{section.title}</h3>
      {section.options.length > 6 ? (
        <div className="max-h-60 overflow-y-auto pr-2 [scrollbar-color:rgba(148,163,184,0.85)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80">
          {content}
        </div>
      ) : (
        content
      )}
    </section>
  );
}

function FilterPanelCard({
  currentCategoryName,
  totalCount,
  activeFilterCount,
  search,
  isSecondHandIphoneCategory,
  facetSections,
  filters,
  setFilters,
  hasPendingChanges,
  saveFilters,
  resetFilters,
}: FilterPanelCardProps) {
  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)]">
      <div className="border-b border-border/60 bg-muted/35 px-6 py-6">
        <p className="font-display text-[1.95rem] font-semibold tracking-tight text-foreground">{currentCategoryName}</p>
        <p className="mt-1 text-sm text-muted-foreground">Toplam {totalCount} ürün</p>
      </div>

      <div className="space-y-6 overflow-y-auto px-6 py-5 [scrollbar-color:rgba(148,163,184,0.85)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            Filtreler
          </div>
          {activeFilterCount > 0 || search ? (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={resetFilters}>
              <X className="mr-1 h-3.5 w-3.5" />
              Temizle
            </Button>
          ) : null}
        </div>

        <div className="space-y-5">
          {isSecondHandIphoneCategory ? (
            <div className="rounded-2xl border border-border/60 bg-muted/25 px-4 py-3 text-sm text-foreground/85">
              Marka: <span className="font-semibold">Apple / iPhone</span>
            </div>
          ) : null}

          {facetSections.map((section) => (
            <FilterFacetSection key={section.id} section={section} />
          ))}

          <section className="border-t border-border/60 pt-5">
            <h3 className="mb-3 text-[1.05rem] font-semibold leading-none tracking-tight text-foreground">Fiyat Aralığı</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                min="0"
                placeholder="Min fiyat"
                value={filters.minPrice ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    minPrice: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              />
              <Input
                type="number"
                min="0"
                placeholder="Max fiyat"
                value={filters.maxPrice ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    maxPrice: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              />
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button className="flex-1 rounded-2xl" onClick={saveFilters} disabled={!hasPendingChanges}>
            Kaydet
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={resetFilters}>
            Temizle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogProductRecord[]>([]);
  const [categories, setCategories] = useState<Array<Record<string, string>>>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ProductSortOption>("newest");
  const [draftFilters, setDraftFilters] = useState<CatalogFilters>(createEmptyCatalogFilters);
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilters>(createEmptyCatalogFilters);

  const activeCategory = searchParams.get("category");
  const filterProfile = useMemo(() => getCatalogFilterProfile(activeCategory), [activeCategory]);
  const isSecondHandIphoneCategory = activeCategory === "ikinci-el-telefon";
  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

  useEffect(() => {
    const nextFilters = createEmptyCatalogFilters();
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }, [activeCategory]);

  useEffect(() => {
    if (activeCategory === "teknik-servis") {
      navigate("/technical-service", { replace: true });
    }
  }, [activeCategory, navigate]);

  useEffect(() => {
    db.from("categories")
      .select("*")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(mergeCategories(defaultCategories, data));
        }
      });
  }, []);

  useEffect(() => {
    if (activeCategory === "teknik-servis") {
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      let query = db.from("products").select("*, product_variants(*), categories(name, slug)").eq("is_active", true);

      if (activeCategory) {
        const { data: category } = await db.from("categories").select("id").eq("slug", activeCategory).single();

        if (!category) {
          setProducts([]);
          setLoading(false);
          return;
        }

        query = query.eq("category_id", category.id);
      }

      const { data } = await query.order("created_at", { ascending: false });
      const normalizedProducts = Array.isArray(data)
        ? data.map((product) => ({
            ...(product as CatalogProductRecord),
            images: Array.isArray(product.images) ? product.images : [],
            product_variants: normalizeProductVariants(product.product_variants || []),
          }))
        : [];

      setProducts(
        activeCategory === "ikinci-el-telefon"
          ? normalizedProducts.filter((product) => isAppleBrand(product.brand))
          : normalizedProducts
      );
      setLoading(false);
    };

    fetchProducts();
  }, [activeCategory]);

  const catalogOptions = useMemo(() => getCatalogVariantOptions(products, filterProfile), [filterProfile, products]);

  const searchFilteredProducts = useMemo(
    () => products.filter((product) => matchesSearch(product, normalizedSearch)),
    [normalizedSearch, products],
  );

  const filteredProducts = useMemo(() => {
    const matchedProducts = searchFilteredProducts.filter((product) => matchesCatalogFilters(product, appliedFilters, filterProfile));
    return sortCatalogProducts(matchedProducts, appliedFilters, sortBy, filterProfile);
  }, [appliedFilters, filterProfile, searchFilteredProducts, sortBy]);

  const currentCategoryName = useMemo(() => {
    if (!activeCategory) {
      return "Tüm Ürünler";
    }

    return categories.find((category) => category.slug === activeCategory)?.name || "Ürünler";
  }, [activeCategory, categories]);

  const activeFilterCount = useMemo(() => {
    const attributeFilterCount = Object.values(draftFilters.attributeFilters ?? {}).reduce((total, values) => total + (values?.length ?? 0), 0);

    return (
      (isSecondHandIphoneCategory ? 0 : draftFilters.brand?.length ?? 0) +
      (draftFilters.color?.length ?? 0) +
      (draftFilters.storage?.length ?? 0) +
      (draftFilters.ram?.length ?? 0) +
      attributeFilterCount +
      (draftFilters.secondHandCondition?.length ?? 0) +
      (draftFilters.batteryHealthMin?.length ?? 0) +
      (draftFilters.warrantyType?.length ?? 0) +
      (draftFilters.includesBoxOnly ? 1 : 0) +
      (draftFilters.faceIdWorkingOnly ? 1 : 0) +
      (draftFilters.trueToneWorkingOnly ? 1 : 0) +
      (draftFilters.inStockOnly ? 1 : 0) +
      (draftFilters.minPrice != null ? 1 : 0) +
      (draftFilters.maxPrice != null ? 1 : 0)
    );
  }, [draftFilters, isSecondHandIphoneCategory]);

  const resetFilters = () => {
    const nextFilters = createEmptyCatalogFilters();
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setSortBy("newest");
    setSearch("");
  };

  const saveFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const hasPendingFilterChanges = useMemo(
    () => !areFiltersEqual(draftFilters, appliedFilters),
    [appliedFilters, draftFilters],
  );

  const totalVisibleCount = searchFilteredProducts.length;

  const facetSections = useMemo(() => {
    const countMatchingProducts = (nextFilters: CatalogFilters) =>
      searchFilteredProducts.filter((product) => matchesCatalogFilters(product, nextFilters, filterProfile)).length;

    const sections: FacetSection[] = [];

    const buildFacetOptions = (options: Array<{ value: string; label: string }>, nextFilters: (value: string) => CatalogFilters, selectedValues: string[]) =>
      options
        .map((option) => ({
          value: option.value,
          label: option.label,
          count: countMatchingProducts(nextFilters(option.value)),
        }))
        .filter((option) => option.count > 0 || selectedValues.includes(option.value));

    if (!isSecondHandIphoneCategory) {
      const selectedValues = draftFilters.brand ?? [];
      const options = buildFacetOptions(
        catalogOptions.brands.map((brand) => ({ value: brand, label: brand })),
        (value) => ({ ...draftFilters, brand: [value] }),
        selectedValues,
      );

      sections.push({
        id: "brand",
        title: "Marka",
        options,
        selectedValues,
        onToggle: (value) => setDraftFilters((current) => ({ ...current, brand: toggleStringValue(current.brand, value) })),
      });
    }

    if (isSecondHandIphoneCategory) {
      const conditionValues = draftFilters.secondHandCondition ?? [];
      sections.push({
        id: "condition",
        title: "Kondisyon",
        options: buildFacetOptions(
          SECOND_HAND_CONDITION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
          (value) => ({ ...draftFilters, secondHandCondition: [value] }),
          conditionValues,
        ),
        selectedValues: conditionValues,
        onToggle: (value) =>
          setDraftFilters((current) => ({
            ...current,
            secondHandCondition: toggleStringValue(current.secondHandCondition, value),
          })),
      });

      const batteryValues = (draftFilters.batteryHealthMin ?? []).map(String);
      sections.push({
        id: "battery",
        title: "Pil Sağlığı",
        options: SECOND_HAND_BATTERY_BUCKETS.map((option) => ({
          value: `${option.value}`,
          label: option.label,
          count: countMatchingProducts({ ...draftFilters, batteryHealthMin: [option.value] }),
        })).filter((option) => option.count > 0 || batteryValues.includes(option.value)),
        selectedValues: batteryValues,
        onToggle: (value) =>
          setDraftFilters((current) => ({
            ...current,
            batteryHealthMin: toggleNumberValue(current.batteryHealthMin, Number(value)),
          })),
      });

      const warrantyValues = draftFilters.warrantyType ?? [];
      sections.push({
        id: "warranty",
        title: "Garanti",
        options: buildFacetOptions(
          SECOND_HAND_WARRANTY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
          (value) => ({ ...draftFilters, warrantyType: [value] }),
          warrantyValues,
        ),
        selectedValues: warrantyValues,
        onToggle: (value) =>
          setDraftFilters((current) => ({
            ...current,
            warrantyType: toggleStringValue(current.warrantyType, value),
          })),
      });

      const featureValues = [
        draftFilters.includesBoxOnly ? "includesBoxOnly" : null,
        draftFilters.faceIdWorkingOnly ? "faceIdWorkingOnly" : null,
        draftFilters.trueToneWorkingOnly ? "trueToneWorkingOnly" : null,
        draftFilters.inStockOnly ? "inStockOnly" : null,
      ].filter(Boolean) as string[];

      sections.push({
        id: "features",
        title: "Ek Özellikler",
        options: [
          { value: "includesBoxOnly", label: "Kutulu", count: countMatchingProducts({ ...draftFilters, includesBoxOnly: true }) },
          { value: "faceIdWorkingOnly", label: "Face ID OK", count: countMatchingProducts({ ...draftFilters, faceIdWorkingOnly: true }) },
          { value: "trueToneWorkingOnly", label: "True Tone OK", count: countMatchingProducts({ ...draftFilters, trueToneWorkingOnly: true }) },
          { value: "inStockOnly", label: "Sadece stokta olanlar", count: countMatchingProducts({ ...draftFilters, inStockOnly: true }) },
        ].filter((option) => option.count > 0 || featureValues.includes(option.value)),
        selectedValues: featureValues,
        onToggle: (value) =>
          setDraftFilters((current) => ({
            ...current,
            includesBoxOnly: value === "includesBoxOnly" ? !current.includesBoxOnly : current.includesBoxOnly,
            faceIdWorkingOnly: value === "faceIdWorkingOnly" ? !current.faceIdWorkingOnly : current.faceIdWorkingOnly,
            trueToneWorkingOnly: value === "trueToneWorkingOnly" ? !current.trueToneWorkingOnly : current.trueToneWorkingOnly,
            inStockOnly: value === "inStockOnly" ? !current.inStockOnly : current.inStockOnly,
          })),
      });
    } else if (draftFilters.inStockOnly || countMatchingProducts({ ...draftFilters, inStockOnly: true }) > 0) {
      sections.push({
        id: "stock",
        title: "Stok Durumu",
        options: [
          {
            value: "inStockOnly",
            label: "Sadece stokta olanlar",
            count: countMatchingProducts({ ...draftFilters, inStockOnly: true }),
          },
        ],
        selectedValues: draftFilters.inStockOnly ? ["inStockOnly"] : [],
        onToggle: () => setDraftFilters((current) => ({ ...current, inStockOnly: !current.inStockOnly })),
      });
    }

    if (filterProfile.showColor) {
      const selectedValues = draftFilters.color ?? [];
      sections.push({
        id: "color",
        title: "Renk",
        options: buildFacetOptions(
          catalogOptions.colors.map((color) => ({ value: color, label: color })),
          (value) => ({ ...draftFilters, color: [value] }),
          selectedValues,
        ),
        selectedValues,
        onToggle: (value) => setDraftFilters((current) => ({ ...current, color: toggleStringValue(current.color, value) })),
      });
    }

    if (filterProfile.showStorage) {
      const selectedValues = draftFilters.storage ?? [];
      sections.push({
        id: "storage",
        title: "Depolama",
        options: buildFacetOptions(
          catalogOptions.storages.map((storage) => ({ value: storage, label: storage })),
          (value) => ({ ...draftFilters, storage: [value] }),
          selectedValues,
        ),
        selectedValues,
        onToggle: (value) => setDraftFilters((current) => ({ ...current, storage: toggleStringValue(current.storage, value) })),
      });
    }

    if (filterProfile.showRam) {
      const selectedValues = draftFilters.ram ?? [];
      sections.push({
        id: "ram",
        title: "RAM",
        options: buildFacetOptions(
          catalogOptions.ramOptions.map((ram) => ({ value: ram, label: ram })),
          (value) => ({ ...draftFilters, ram: [value] }),
          selectedValues,
        ),
        selectedValues,
        onToggle: (value) => setDraftFilters((current) => ({ ...current, ram: toggleStringValue(current.ram, value) })),
      });
    }

    for (const definition of filterProfile.attributeFilters) {
      const selectedValues = draftFilters.attributeFilters?.[definition.id] ?? [];
      sections.push({
        id: definition.id,
        title: definition.label,
        options: buildFacetOptions(
          (catalogOptions.attributeOptions[definition.id] || []).map((option) => ({ value: option, label: option })),
          (value) => ({
            ...draftFilters,
            attributeFilters: {
              ...(draftFilters.attributeFilters ?? {}),
              [definition.id]: [value],
            },
          }),
          selectedValues,
        ),
        selectedValues,
        onToggle: (value) =>
          setDraftFilters((current) => ({
            ...current,
            attributeFilters: {
              ...(current.attributeFilters ?? {}),
              [definition.id]: toggleStringValue(current.attributeFilters?.[definition.id], value),
            },
          })),
      });
    }

    return sections.filter((section) => section.options.length > 0);
  }, [catalogOptions, draftFilters, filterProfile, isSecondHandIphoneCategory, searchFilteredProducts]);

  if (activeCategory === "teknik-servis") {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="hidden w-full space-y-5 lg:sticky lg:top-24 lg:block lg:w-[340px] lg:shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Ürün ara..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>

            <div className="space-y-2 rounded-[28px] border border-border/60 bg-card/55 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Kategoriler</h3>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                <Button variant={!activeCategory ? "default" : "ghost"} size="sm" className="shrink-0 justify-start" onClick={() => setSearchParams({})}>
                  Tümü
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.slug ? "default" : "ghost"}
                    size="sm"
                    className="shrink-0 justify-start"
                    onClick={() => {
                      if (category.slug === "teknik-servis") {
                        navigate("/technical-service");
                        return;
                      }

                      setSearchParams({ category: category.slug });
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <FilterPanelCard
              currentCategoryName={currentCategoryName}
              totalCount={totalVisibleCount}
              activeFilterCount={activeFilterCount}
              search={search}
              isSecondHandIphoneCategory={isSecondHandIphoneCategory}
              facetSections={facetSections}
              filters={draftFilters}
              setFilters={setDraftFilters}
              hasPendingChanges={hasPendingFilterChanges}
              saveFilters={saveFilters}
              resetFilters={resetFilters}
            />
          </aside>

          <div className="flex-1">
            <div className="mb-4 space-y-4 lg:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Ürün ara..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>

              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <Button variant={!activeCategory ? "default" : "outline"} size="sm" className="shrink-0 rounded-full" onClick={() => setSearchParams({})}>
                  Tümü
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.slug ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => {
                      if (category.slug === "teknik-servis") {
                        navigate("/technical-service");
                        return;
                      }

                      setSearchParams({ category: category.slug });
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-between rounded-2xl border-border/70 bg-card px-4 py-5 text-left">
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtreler
                      </span>
                      {activeFilterCount > 0 ? <span className="text-xs text-muted-foreground">{activeFilterCount} seçili</span> : null}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[92vw] max-w-none overflow-y-auto border-border/60 bg-background p-4 sm:max-w-md">
                    <SheetHeader className="mb-4">
                      <SheetTitle>Filtreler</SheetTitle>
                    </SheetHeader>
                    <FilterPanelCard
                      currentCategoryName={currentCategoryName}
                      totalCount={totalVisibleCount}
                      activeFilterCount={activeFilterCount}
                      search={search}
                      isSecondHandIphoneCategory={isSecondHandIphoneCategory}
                      facetSections={facetSections}
                      filters={draftFilters}
                      setFilters={setDraftFilters}
                      hasPendingChanges={hasPendingFilterChanges}
                      saveFilters={saveFilters}
                      resetFilters={resetFilters}
                    />
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as ProductSortOption)}>
                  <SelectTrigger className="w-[170px] rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{currentCategoryName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeCategory === "ikinci-el-telefon"
                    ? "Bu kategoride yalnızca Apple / iPhone ikinci el ürünleri listelenir."
                    : filterProfile.helperText}
                </p>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <Badge variant="secondary" className="w-fit">
                  {filteredProducts.length} ürün
                </Badge>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as ProductSortOption)}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <SlidersHorizontal className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-display font-semibold">Ürün bulunamadı</h3>
                <p className="mt-1 text-sm text-muted-foreground">Filtrelerinizi gevşetip tekrar deneyin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const variant = getDisplayVariantForCatalogProduct(product, appliedFilters, filterProfile);

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      brand={product.brand}
                      description={product.description}
                      images={getVariantGallery(variant, product.images)}
                      price={variant?.price || 0}
                      originalPrice={variant?.compare_at_price || undefined}
                      variantId={variant?.id}
                      variantInfo={variant ? getVariantLabel(variant) : undefined}
                      createdAt={product.created_at}
                      salesCount={product.sales_count}
                      ratingAverage={product.rating_average}
                      secondHand={product.second_hand}
                      specs={product.specs as Record<string, string | null> | null}
                      storage={variant?.storage}
                      ram={variant?.ram}
                      stock={variant?.stock || 0}
                      category={product.categories?.name}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
