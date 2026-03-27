"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type CatalogProductRecord,
  type CatalogFilters,
  type ProductSortOption,
} from "@/lib/product-catalog";
import {
  SECOND_HAND_BATTERY_BUCKETS,
  SECOND_HAND_CONDITION_OPTIONS,
  SECOND_HAND_WARRANTY_OPTIONS,
  type SecondHandDetails,
} from "@/lib/second-hand";
import { getVariantGallery, getVariantLabel, normalizeProductVariants } from "@/lib/product-variants";

const defaultCategories = [
  { id: "default-telefon", name: "Telefon", slug: "telefon", icon: "Smartphone" },
  { id: "default-ikinci-el-telefon", name: "2. El Telefonlar", slug: "ikinci-el-telefon", icon: "Smartphone" },
  { id: "default-akilli-saat", name: "Ak\u0131ll\u0131 Saatler", slug: "akilli-saatler", icon: "Watch" },
  { id: "default-kilif", name: "K\u0131l\u0131f", slug: "kilif", icon: "ShieldCheck" },
  { id: "default-sarj", name: "\u015earj Aleti", slug: "sarj-aleti", icon: "BatteryCharging" },
  { id: "default-power", name: "Power Bank", slug: "power-bank", icon: "Battery" },
  { id: "default-servis", name: "Teknik Servis", slug: "teknik-servis", icon: "Wrench" },
];

const SORT_OPTIONS: Array<{ value: ProductSortOption; label: string }> = [
  { value: "newest", label: "En Yeniler" },
  { value: "best_selling", label: "En \u00c7ok Satanlar" },
  { value: "price_asc", label: "Fiyat Artan" },
  { value: "price_desc", label: "Fiyat Azalan" },
  { value: "rating_desc", label: "Puana G\u00f6re" },
];

function isAppleBrand(value: string | null | undefined) {
  return `${value ?? ""}`.trim().toLocaleLowerCase("tr-TR") === "apple";
}

function isSecondHandWarrantyValue(value: string): value is NonNullable<SecondHandDetails["warranty_type"]> {
  return value === "magaza" || value === "distributor" || value === "none";
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

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogProductRecord[]>([]);
  const [categories, setCategories] = useState<Array<Record<string, string>>>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ProductSortOption>("newest");
  const [filters, setFilters] = useState<CatalogFilters>(createEmptyCatalogFilters);

  const activeCategory = searchParams.get("category");
  const filterProfile = useMemo(() => getCatalogFilterProfile(activeCategory), [activeCategory]);
  const isSecondHandIphoneCategory = activeCategory === "ikinci-el-telefon";

  useEffect(() => {
    setFilters(createEmptyCatalogFilters());
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

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    const matchedProducts = products.filter((product) => {
      const searchable = [product.name, product.brand, product.description].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");

      if (normalizedSearch && !searchable.includes(normalizedSearch)) {
        return false;
      }

      return matchesCatalogFilters(product, filters, filterProfile);
    });

    return sortCatalogProducts(matchedProducts, filters, sortBy, filterProfile);
  }, [filterProfile, filters, products, search, sortBy]);

  const activeFilterCount = useMemo(() => {
    return [
      isSecondHandIphoneCategory ? null : filters.brand,
      filters.color,
      filters.storage,
      filters.ram,
      ...Object.values(filters.attributeFilters ?? {}),
      filters.secondHandCondition,
      filters.batteryHealthMin != null ? "battery" : null,
      filters.warrantyType,
      filters.includesBoxOnly ? "box" : null,
      filters.faceIdWorkingOnly ? "faceId" : null,
      filters.trueToneWorkingOnly ? "trueTone" : null,
      filters.inStockOnly ? "stock" : null,
      filters.minPrice != null ? "min" : null,
      filters.maxPrice != null ? "max" : null,
    ].filter(Boolean).length;
  }, [filters, isSecondHandIphoneCategory]);

  const resetFilters = () => {
    setFilters(createEmptyCatalogFilters());
    setSortBy("newest");
    setSearch("");
  };

  if (activeCategory === "teknik-servis") {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="w-full space-y-5 rounded-3xl border border-border/60 bg-card/55 p-4 backdrop-blur-xl sm:p-5 lg:sticky lg:top-24 lg:w-80 lg:shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="\u00dcr\u00fcn ara..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Kategoriler</h3>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                <Button variant={!activeCategory ? "default" : "ghost"} size="sm" className="shrink-0 justify-start" onClick={() => setSearchParams({})}>
                  T\u00fcm\u00fc
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

            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Filtreler</h3>
                </div>
                {activeFilterCount > 0 || search ? (
                  <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={resetFilters}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Temizle
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3">
                {!isSecondHandIphoneCategory ? (
                  <Select value={filters.brand || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, brand: value === "all" ? null : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Marka se\u00e7in" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">T\u00fcm Markalar</SelectItem>
                      {catalogOptions.brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm text-foreground/85">
                    Marka: <span className="font-semibold">Apple / iPhone</span>
                  </div>
                )}

                {isSecondHandIphoneCategory ? (
                  <>
                    <Select
                      value={filters.secondHandCondition || "all"}
                      onValueChange={(value) =>
                        setFilters((current) => ({
                          ...current,
                          secondHandCondition: value === "all" ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kondisyon se\u00e7in" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">T\u00fcm Kondisyonlar</SelectItem>
                        {SECOND_HAND_CONDITION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        value={filters.batteryHealthMin != null ? `${filters.batteryHealthMin}` : "all"}
                        onValueChange={(value) =>
                          setFilters((current) => ({
                            ...current,
                            batteryHealthMin: value === "all" ? null : Number(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pil sa\u011fl\u0131\u011f\u0131" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">T\u00fcm Pil Sa\u011fl\u0131klar\u0131</SelectItem>
                          {SECOND_HAND_BATTERY_BUCKETS.map((option) => (
                            <SelectItem key={option.value} value={`${option.value}`}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.warrantyType || "all"}
                        onValueChange={(value) =>
                          setFilters((current) => ({
                            ...current,
                            warrantyType: value === "all" || !isSecondHandWarrantyValue(value) ? null : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Garanti se\u00e7in" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">T\u00fcm Garantiler</SelectItem>
                          {SECOND_HAND_WARRANTY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      <Button
                        variant={filters.includesBoxOnly ? "default" : "outline"}
                        size="sm"
                        className="h-auto min-h-9 justify-start whitespace-normal break-words px-3 py-2 text-left leading-tight"
                        onClick={() => setFilters((current) => ({ ...current, includesBoxOnly: !current.includesBoxOnly }))}
                      >
                        Kutulu
                      </Button>
                      <Button
                        variant={filters.faceIdWorkingOnly ? "default" : "outline"}
                        size="sm"
                        className="h-auto min-h-9 justify-start whitespace-normal break-words px-3 py-2 text-left leading-tight"
                        onClick={() => setFilters((current) => ({ ...current, faceIdWorkingOnly: !current.faceIdWorkingOnly }))}
                      >
                        Face ID OK
                      </Button>
                      <Button
                        variant={filters.trueToneWorkingOnly ? "default" : "outline"}
                        size="sm"
                        className="h-auto min-h-9 justify-start whitespace-normal break-words px-3 py-2 text-left leading-tight"
                        onClick={() => setFilters((current) => ({ ...current, trueToneWorkingOnly: !current.trueToneWorkingOnly }))}
                      >
                        True Tone OK
                      </Button>
                    </div>
                  </>
                ) : null}

                {filterProfile.showColor ? (
                  <Select value={filters.color || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, color: value === "all" ? null : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Renk se\u00e7in" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">T\u00fcm Renkler</SelectItem>
                      {catalogOptions.colors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                {filterProfile.showStorage || filterProfile.showRam ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filterProfile.showStorage ? (
                      <Select value={filters.storage || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, storage: value === "all" ? null : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Depolama" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">T\u00fcm Depolama</SelectItem>
                          {catalogOptions.storages.map((storage) => (
                            <SelectItem key={storage} value={storage}>
                              {storage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : <div className="hidden sm:block" />}

                    {filterProfile.showRam ? (
                      <Select value={filters.ram || "all"} onValueChange={(value) => setFilters((current) => ({ ...current, ram: value === "all" ? null : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="RAM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">T\u00fcm RAM</SelectItem>
                          {catalogOptions.ramOptions.map((ram) => (
                            <SelectItem key={ram} value={ram}>
                              {ram}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : <div className="hidden sm:block" />}
                  </div>
                ) : null}

                {filterProfile.attributeFilters.map((definition) => (
                  <Select
                    key={definition.id}
                    value={filters.attributeFilters?.[definition.id] || "all"}
                    onValueChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        attributeFilters: {
                          ...(current.attributeFilters ?? {}),
                          [definition.id]: value === "all" ? null : value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={definition.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">T\u00fcm {definition.label}</SelectItem>
                      {(catalogOptions.attributeOptions[definition.id] || []).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}

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

                <Button
                  variant={filters.inStockOnly ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  onClick={() => setFilters((current) => ({ ...current, inStockOnly: !current.inStockOnly }))}
                >
                  Sadece stokta olanlar
                </Button>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                  {activeCategory ? categories.find((category) => category.slug === activeCategory)?.name || "\u00dcr\u00fcnler" : "T\u00fcm \u00dcr\u00fcnler"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeCategory === "ikinci-el-telefon"
                    ? "Bu kategoride yaln\u0131zca Apple / iPhone ikinci el \u00fcr\u00fcnleri listelenir."
                    : filterProfile.helperText}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-fit">
                  {filteredProducts.length} \u00fcr\u00fcn
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
                <h3 className="mt-4 font-display font-semibold">\u00dcr\u00fcn bulunamad\u0131</h3>
                <p className="mt-1 text-sm text-muted-foreground">Filtrelerinizi gev\u015fetip tekrar deneyin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const variant = getDisplayVariantForCatalogProduct(product, filters, filterProfile);

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
