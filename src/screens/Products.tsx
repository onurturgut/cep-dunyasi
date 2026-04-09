"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { type CatalogFacetSectionData } from "@/lib/catalog-facets";
import {
  createEmptyCatalogFilters,
  getCatalogFilterProfile,
  getDisplayVariantForCatalogProduct,
  type CatalogFilters,
  type CatalogProductRecord,
  type ProductSortOption,
} from "@/lib/product-catalog";
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

const PRODUCTS_PER_PAGE = 12;

type FacetOption = {
  value: string;
  label: string;
};

type FacetSection = CatalogFacetSectionData & {
  options: FacetOption[];
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
  resetFilters: () => void;
};

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
};

type CatalogListResponse = {
  items: CatalogProductRecord[];
  facetSections: CatalogFacetSectionData[];
  totalCount: number;
};

function toggleStringValue(values: string[] | undefined, value: string) {
  const currentValues = values ?? [];
  return currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
}

function toggleNumberValue(values: number[] | undefined, value: number) {
  const currentValues = values ?? [];
  return currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];
  let startPage = Math.max(2, currentPage - 1);
  let endPage = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 3) {
    startPage = 2;
    endPage = 4;
  } else if (currentPage >= totalPages - 2) {
    startPage = totalPages - 3;
    endPage = totalPages - 1;
  }

  if (startPage > 2) {
    items.push("ellipsis-left");
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push(page);
  }

  if (endPage < totalPages - 1) {
    items.push("ellipsis-right");
  }

  items.push(totalPages);

  return items;
}

async function requestCatalog<T>(body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch("/api/products/catalog", {
    method: "POST",
    cache: "no-store",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || "Katalog verisi alinamadi");
  }

  return payload?.data as T;
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
            <span className="truncate text-[15px] font-medium text-foreground">{option.label}</span>
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
  resetFilters,
}: FilterPanelCardProps) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] ">
      <div className="border-b border-border/60 bg-muted/35 px-6 py-6">
        <p className="font-display text-[1.95rem] font-semibold tracking-tight text-foreground">{currentCategoryName}</p>
        <p className="mt-1 text-sm text-muted-foreground">Toplam {totalCount} ürün</p>
      </div>

      <div className="min-h-0 space-y-6 px-6 py-5 lg:overflow-y-auto [scrollbar-color:rgba(148,163,184,0.85)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Filtre seçimleri sonuçları otomatik olarak günceller.</p>
          <Button variant="outline" className="rounded-2xl sm:min-w-[120px]" onClick={resetFilters}>
            Tümünü Temizle
          </Button>
        </div>
      </div>
    </div>
  );
}

type ProductsProps = {
  initialCategories?: Array<Record<string, string>>;
};

export default function Products({ initialCategories = defaultCategories }: ProductsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogProductRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facetSectionData, setFacetSectionData] = useState<CatalogFacetSectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ProductSortOption>("newest");
  const [draftFilters, setDraftFilters] = useState<CatalogFilters>(createEmptyCatalogFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const listingTopRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);

  const activeCategory = searchParams.get("category");
  const filterProfile = useMemo(() => getCatalogFilterProfile(activeCategory), [activeCategory]);
  const isSecondHandIphoneCategory = activeCategory === "ikinci-el-telefon";
  const deferredSearch = useDeferredValue(search);
  const categories = initialCategories.length > 0 ? initialCategories : defaultCategories;

  useEffect(() => {
    const nextFilters = createEmptyCatalogFilters();
    setDraftFilters(nextFilters);
    setCurrentPage(1);
    setFacetSectionData([]);
    setTotalCount(0);
  }, [activeCategory]);

  useEffect(() => {
    if (activeCategory === "teknik-servis") {
      navigate("/technical-service", { replace: true });
    }
  }, [activeCategory, navigate]);

  useEffect(() => {
    if (activeCategory === "teknik-servis") {
      return;
    }

    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);

      try {
        const data = await requestCatalog<CatalogListResponse>(
          {
            mode: "list",
            activeCategory,
            search: deferredSearch,
            sortBy,
            page: currentPage,
            limit: PRODUCTS_PER_PAGE,
            filters: draftFilters,
          },
          controller.signal,
        );

        setProducts(
          data.items.map((product) => ({
            ...product,
            images: Array.isArray(product.images) ? product.images : [],
            product_variants: normalizeProductVariants(product.product_variants || []),
          })),
        );
        setTotalCount(data.totalCount);
        setFacetSectionData(data.facetSections);
      } catch (error) {
        if (!controller.signal.aborted) {
          setProducts([]);
          setTotalCount(0);
          setFacetSectionData([]);
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [activeCategory, currentPage, deferredSearch, draftFilters, sortBy]);

  const currentCategoryName = useMemo(() => {
    if (!activeCategory) {
      return "Tüm Ürünler";
    }

    return categories.find((category) => category.slug === activeCategory)?.name || "Ürünler";
  }, [activeCategory, categories]);

  const activeFilterCount = useMemo(() => {
    const attributeFilterCount = Object.values(draftFilters.attributeFilters ?? {}).reduce((total, values) => total + (values?.length ?? 0), 0);

    return (
      (draftFilters.subcategory?.length ?? 0) +
      (isSecondHandIphoneCategory ? 0 : draftFilters.brand?.length ?? 0) +
      (draftFilters.model?.length ?? 0) +
      (draftFilters.color?.length ?? 0) +
      (draftFilters.storage?.length ?? 0) +
      (draftFilters.ram?.length ?? 0) +
      (draftFilters.caseType?.length ?? 0) +
      (draftFilters.caseTheme?.length ?? 0) +
      (draftFilters.caseFeature?.length ?? 0) +
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
    setCurrentPage(1);
    setSortBy("newest");
    setSearch("");
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE));
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, totalPages), [currentPage, totalPages]);
  const pageStart = totalCount === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const pageEnd = totalCount === 0 ? 0 : Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + products.length, totalCount);

  useEffect(() => {
    setCurrentPage(1);
  }, [draftFilters, deferredSearch, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    listingTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const facetSections = useMemo(() => {
    const buildToggleHandler = (sectionId: string) => {
      if (sectionId === "subcategory") {
        return (value: string) =>
          setDraftFilters((current) => ({
            ...current,
            subcategory: toggleStringValue(current.subcategory, value),
          }));
      }

      if (sectionId === "brand") {
        return (value: string) => setDraftFilters((current) => ({ ...current, brand: toggleStringValue(current.brand, value) }));
      }

      if (sectionId === "model") {
        return (value: string) => setDraftFilters((current) => ({ ...current, model: toggleStringValue(current.model, value) }));
      }

      if (sectionId === "condition") {
        return (value: string) =>
          setDraftFilters((current) => ({
            ...current,
            secondHandCondition: toggleStringValue(current.secondHandCondition, value),
          }));
      }

      if (sectionId === "battery") {
        return (value: string) =>
          setDraftFilters((current) => ({
            ...current,
            batteryHealthMin: toggleNumberValue(current.batteryHealthMin, Number(value)),
          }));
      }

      if (sectionId === "warranty") {
        return (value: string) =>
          setDraftFilters((current) => ({
            ...current,
            warrantyType: toggleStringValue(current.warrantyType, value),
          }));
      }

      if (sectionId === "features" || sectionId === "stock") {
        return (value: string) =>
          setDraftFilters((current) => ({
            ...current,
            includesBoxOnly: value === "includesBoxOnly" ? !current.includesBoxOnly : current.includesBoxOnly,
            faceIdWorkingOnly: value === "faceIdWorkingOnly" ? !current.faceIdWorkingOnly : current.faceIdWorkingOnly,
            trueToneWorkingOnly: value === "trueToneWorkingOnly" ? !current.trueToneWorkingOnly : current.trueToneWorkingOnly,
            inStockOnly: value === "inStockOnly" ? !current.inStockOnly : current.inStockOnly,
          }));
      }

      if (sectionId === "color") {
        return (value: string) => setDraftFilters((current) => ({ ...current, color: toggleStringValue(current.color, value) }));
      }

      if (sectionId === "storage") {
        return (value: string) => setDraftFilters((current) => ({ ...current, storage: toggleStringValue(current.storage, value) }));
      }

      if (sectionId === "ram") {
        return (value: string) => setDraftFilters((current) => ({ ...current, ram: toggleStringValue(current.ram, value) }));
      }

      if (sectionId === "caseType") {
        return (value: string) => setDraftFilters((current) => ({ ...current, caseType: toggleStringValue(current.caseType, value) }));
      }

      if (sectionId === "caseTheme") {
        return (value: string) => setDraftFilters((current) => ({ ...current, caseTheme: toggleStringValue(current.caseTheme, value) }));
      }

      if (sectionId === "caseFeature") {
        return (value: string) =>
          setDraftFilters((current) => ({
            ...current,
            caseFeature: toggleStringValue(current.caseFeature, value),
          }));
      }

      return (value: string) =>
        setDraftFilters((current) => ({
          ...current,
          attributeFilters: {
            ...(current.attributeFilters ?? {}),
            [sectionId]: toggleStringValue(current.attributeFilters?.[sectionId], value),
          },
        }));
    };

    return facetSectionData.map((section) => ({
      ...section,
      onToggle: buildToggleHandler(section.id),
    }));
  }, [facetSectionData]);

  if (activeCategory === "teknik-servis") {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="hidden w-full space-y-5 lg:block lg:w-[340px] lg:shrink-0 lg:self-start">
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

            <div className="lg:sticky lg:top-24">
              <FilterPanelCard
                currentCategoryName={currentCategoryName}
                totalCount={totalCount}
                activeFilterCount={activeFilterCount}
                search={search}
                isSecondHandIphoneCategory={isSecondHandIphoneCategory}
                facetSections={facetSections}
                filters={draftFilters}
                setFilters={setDraftFilters}
                resetFilters={resetFilters}
              />
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 space-y-4 lg:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Ürün ara..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>

              <div className="rounded-[24px] border border-border/60 bg-card/90 p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.28)]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Kategoriler</h3>
                  <span className="text-xs text-muted-foreground">Hızlı geçiş</span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Button variant={!activeCategory ? "default" : "outline"} size="sm" className="h-10 justify-center rounded-2xl" onClick={() => setSearchParams({})}>
                  Tümü
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.slug ? "default" : "outline"}
                    size="sm"
                    className="h-10 justify-center rounded-2xl px-3 text-center"
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
                      totalCount={totalCount}
                      activeFilterCount={activeFilterCount}
                      search={search}
                      isSecondHandIphoneCategory={isSecondHandIphoneCategory}
                      facetSections={facetSections}
                      filters={draftFilters}
                      setFilters={setDraftFilters}
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

            <div ref={listingTopRef} className="scroll-mt-28" />

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
                  {totalCount} ürün
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

            {!loading && totalCount > 0 ? (
              <div className="mb-4 flex flex-col gap-2 rounded-3xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {pageStart}-{pageEnd} arası gösteriliyor
                </span>
                <span>Toplam {totalCount} sonuç</span>
              </div>
            ) : null}

            {loading ? (
              <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <SlidersHorizontal className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-display font-semibold">Ürün bulunamadı</h3>
                <p className="mt-1 text-sm text-muted-foreground">Filtrelerinizi gevşetip tekrar deneyin.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {products.map((product) => {
                    const variant = getDisplayVariantForCatalogProduct(product, draftFilters, filterProfile);

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
                        caseDetails={product.case_details}
                        specs={product.specs as Record<string, string | null> | null}
                        productVariants={product.product_variants}
                        colorName={variant?.color_name}
                        storage={variant?.storage}
                        ram={variant?.ram}
                        stock={variant?.stock || 0}
                        category={product.categories?.name}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 ? (
                  <Pagination className="mt-8 justify-center">
                    <PaginationContent className="flex-wrap justify-center gap-2">
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          size="default"
                          className="rounded-2xl px-4"
                          aria-label="Önceki sayfa"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                        >
                          Önceki
                        </PaginationLink>
                      </PaginationItem>

                      {paginationItems.map((item) => (
                        <PaginationItem key={item}>
                          {typeof item === "number" ? (
                            <PaginationLink
                              href="#"
                              isActive={item === currentPage}
                              className="rounded-2xl"
                              onClick={(event) => {
                                event.preventDefault();
                                setCurrentPage(item);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          ) : (
                            <PaginationEllipsis />
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          size="default"
                          className="rounded-2xl px-4"
                          aria-label="Sonraki sayfa"
                          onClick={(event) => {
                            event.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                        >
                          Sonraki
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

