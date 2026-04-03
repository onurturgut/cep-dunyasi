"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Minus, Plus, RefreshCcw, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { useSearchParams, Link } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGallery } from "@/components/product-detail/ProductGallery";
import { VariantSelector } from "@/components/product-detail/VariantSelector";
import { StockStatusBadge } from "@/components/product-detail/StockStatusBadge";
import { ProductSpecsTable } from "@/components/product-detail/ProductSpecsTable";
import { DeliveryEstimate } from "@/components/product-detail/DeliveryEstimate";
import { InstallmentCalculator } from "@/components/product-detail/InstallmentCalculator";
import { StickyBuyBar } from "@/components/product-detail/StickyBuyBar";
import { SecondHandInfo } from "@/components/product-detail/SecondHandInfo";
import { WarrantyReturnInfo } from "@/components/product-detail/WarrantyReturnInfo";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { useI18n } from "@/i18n/provider";
import { getLocalizedCategoryLabel } from "@/i18n/category-labels";
import { db } from "@/integrations/mongo/client";
import { useCartStore } from "@/lib/cart-store";
import { addRecentlyViewedProduct } from "@/lib/recently-viewed";
import { useStickyBuyBarVisibility } from "@/hooks/use-sticky-buy-bar-visibility";
import {
  buildBreadcrumbStructuredData,
} from "@/lib/product-detail";
import { type ProductSpecs } from "@/lib/product-specs";
import { getBatteryHealthBucketLabel, getSecondHandConditionLabel, normalizeSecondHandDetails, type SecondHandDetails } from "@/lib/second-hand";
import { cn, formatCurrency, toPriceNumber } from "@/lib/utils";
import {
  findProductVariantBySelection,
  getDefaultProductVariant,
  getVariantGallery,
  getVariantLabel,
  normalizeProductVariants,
  type ProductVariantRecord,
} from "@/lib/product-variants";
import { toast } from "sonner";
import type { ProductDetailRecord } from "@/types/product-detail";

type ProductRecord = ProductDetailRecord;

type ProductDetailProps = {
  slug: string;
  initialProduct?: ProductRecord | null;
};

const ReviewsSection = dynamic(
  () => import("@/components/reviews/ReviewsSection").then((module) => module.ReviewsSection),
  {
    ssr: false,
    loading: () => (
      <section className="mt-10 border-t border-border/50 pt-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </section>
    ),
  },
);

function resolveProductState(product: ProductRecord | null, initialSelection: { variantId: string | null; colorName: string | null; storage: string | null; ram: string | null }) {
  const variants = product ? normalizeProductVariants(product.product_variants || []) : [];
  const initialVariant = findProductVariantBySelection(variants, initialSelection) || getDefaultProductVariant(variants);

  return {
    product,
    variants,
    selectedVariantId: initialVariant?.id || null,
  };
}

function buildOfferAvailability(stock: number) {
  if (stock <= 0) {
    return "https://schema.org/PreOrder" as const;
  }

  return "https://schema.org/InStock" as const;
}

function buildDiscountRate(compareAtPrice: number | null, price: number) {
  if (!compareAtPrice || compareAtPrice <= price) {
    return null;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export default function ProductDetail({ slug, initialProduct = null }: ProductDetailProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialSelection] = useState(() => ({
    variantId: searchParams.get("variant"),
    colorName: searchParams.get("color"),
    storage: searchParams.get("storage"),
    ram: searchParams.get("ram"),
  }));
  const initialResolvedState = useMemo(() => resolveProductState(initialProduct, initialSelection), [initialProduct, initialSelection]);
  const [product, setProduct] = useState<ProductRecord | null>(initialResolvedState.product);
  const [variants, setVariants] = useState<ProductVariantRecord[]>(initialResolvedState.variants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialResolvedState.selectedVariantId);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const purchasePanelRef = useRef<HTMLDivElement | null>(null);
  const stickyVisible = useStickyBuyBarVisibility(purchasePanelRef, Boolean(product));
  const { locale } = useI18n();
  const copy =
    locale === "en"
      ? {
          productLoadError: "Product details could not be loaded",
          productNotFound: "Product not found",
          home: "Home",
          products: "Products",
          chooseModel: "Please choose a valid model",
          outOfStockSelection: "The selected model is currently out of stock",
          addedToCart: (count: number) => `${count} item(s) added to cart`,
          backToProducts: "Back to products",
          unavailableDescription: "The product you are looking for could not be found or is temporarily unavailable.",
          unavailableModel: "This model is temporarily unavailable.",
          lowStock: (count: number) => `Only ${count} left for the selected model.`,
          readyStock: (count: number) => `${count} units available and ready to order.`,
          supportReport: "Condition report included",
          supportWarranty: "Device-specific warranty info",
          supportStandard: "Apple standard support",
          reviews: (count: number) => `${count} reviews`,
          selectedModel: "Selected model",
          standardSelection: "Standard selection",
          savings: (rate: number) => `${rate}% savings`,
          secureShipping: "Ships with secure payment and fast delivery.",
          delivery: "Delivery",
          support: "Support",
          returns: "Returns",
          fastShipping: "Fast shipping available",
          warrantySpecified: "Warranty status specified",
          warrantyAvailable: "Device-specific warranty info available",
          supportYears: "2 years of support",
          easyReturn: "14-day easy return",
          addToCart: "Add to Cart",
          noStock: "Out of Stock",
          freeShippingTitle: "Free shipping option",
          freeShippingDescription: "No extra delivery fee is applied for eligible campaign totals.",
          securePaymentTitle: "Secure payment",
          securePaymentDescription: "All payments are processed through encrypted infrastructure and secure connections.",
          easyReturnTitle: "Easy returns",
          easyReturnDescription: "You can start the return process online after your order is delivered.",
          overviewTitle: "Product Overview",
          overviewFallback: "A detailed product introduction has not been added yet. You can review all model-specific details from the section above.",
        }
      : {
          productLoadError: "Urun detayi yuklenemedi",
          productNotFound: "Urun bulunamadi",
          home: "Ana Sayfa",
          products: "Urunler",
          chooseModel: "Lutfen gecerli bir model secin",
          outOfStockSelection: "Secilen model su an stokta yok",
          addedToCart: (count: number) => `${count} adet sepete eklendi`,
          backToProducts: "Urunlere don",
          unavailableDescription: "Aradiginiz urun bulunamadi ya da gecici olarak erisilemiyor.",
          unavailableModel: "Bu model gecici olarak stokta bulunmuyor.",
          lowStock: (count: number) => `Secili modelde son ${count} adet kaldi.`,
          readyStock: (count: number) => `${count} adet stokla siparise hazir.`,
          supportReport: "Durum raporu paylasilir",
          supportWarranty: "Cihaza ozel garanti bilgisi",
          supportStandard: "Apple standart destek",
          reviews: (count: number) => `${count} yorum`,
          selectedModel: "Secili model",
          standardSelection: "Standart secim",
          savings: (rate: number) => `%${rate} fiyat avantaji`,
          secureShipping: "Guvenli odeme ve hizli kargo ile gonderilir.",
          delivery: "Teslimat",
          support: "Destek",
          returns: "Iade",
          fastShipping: "Hizli kargo uygun",
          warrantySpecified: "Garanti durumu belirtilmis",
          warrantyAvailable: "Cihaza ozel garanti bilgisi mevcut",
          supportYears: "2 yil destek",
          easyReturn: "14 gun kosulsuz",
          addToCart: "Sepete Ekle",
          noStock: "Stokta Yok",
          freeShippingTitle: "Ucretsiz kargo secenegi",
          freeShippingDescription: "Uygun kampanyali tutarlarda ek teslimat bedeli yansimaz.",
          securePaymentTitle: "Guvenli odeme",
          securePaymentDescription: "Tum odemeler sifrelenmis altyapi ve guvenli baglanti ile islenir.",
          easyReturnTitle: "Kolay iade",
          easyReturnDescription: "Siparisiniz size ulastiktan sonra iade surecini online olarak baslatabilirsiniz.",
          overviewTitle: "Urune Genel Bakis",
          overviewFallback: "Bu urun icin henuz detayli bir tanitim metni eklenmemis. Secili modele ait tum detaylari yukaridaki alandan inceleyebilirsiniz.",
        };

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialResolvedState.product);
      setVariants(initialResolvedState.variants);
      setSelectedVariantId(initialResolvedState.selectedVariantId);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: requestError } = await db
          .from("products")
          .select("*, product_variants(*), categories(name, slug)")
          .eq("slug", slug)
          .single();

        if (requestError) {
          throw new Error(requestError.message || "Ürün bilgileri yüklenemedi");
        }

        if (!data) {
          throw new Error("Ürün bulunamadı");
        }

        const nextProduct: ProductRecord = {
          id: `${data.id ?? ""}`,
          name: `${data.name ?? ""}`,
          slug: `${data.slug ?? ""}`,
          brand: data.brand ?? null,
          description: data.description ?? null,
          images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
          starting_price: toPriceNumber(data.starting_price),
          created_at: data.created_at,
          sales_count: Number(data.sales_count ?? 0),
          rating_average: Number(data.rating_average ?? 0),
          rating_count: Number(data.rating_count ?? 0),
          rating_distribution:
            data.rating_distribution && typeof data.rating_distribution === "object"
              ? (data.rating_distribution as Record<string, number>)
              : null,
          specs: (data.specs as ProductSpecs | null | undefined) ?? null,
          second_hand: (data.second_hand as SecondHandDetails | null | undefined) ?? null,
          categories:
            data.categories && typeof data.categories === "object"
              ? {
                  name: `${(data.categories as { name?: string }).name ?? ""}`.trim() || undefined,
                  slug: `${(data.categories as { slug?: string }).slug ?? ""}`.trim() || undefined,
                }
              : null,
          product_variants: normalizeProductVariants(data.product_variants || []),
        };

        const nextVariants = nextProduct.product_variants;
        const initialVariant =
          findProductVariantBySelection(nextVariants, initialSelection) || getDefaultProductVariant(nextVariants);

        if (!isMounted) {
          return;
        }

        setProduct(nextProduct);
        setVariants(nextVariants);
        setSelectedVariantId(initialVariant?.id || null);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Ürün bilgileri yüklenemedi");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [initialProduct, initialResolvedState, initialSelection, slug]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) || getDefaultProductVariant(variants) || null,
    [selectedVariantId, variants],
  );

  useEffect(() => {
    if (!selectedVariant) {
      return;
    }

    setSearchParams(
      {
        variant: selectedVariant.id,
        color: selectedVariant.color_name,
        storage: selectedVariant.storage,
        ram: selectedVariant.ram || undefined,
      },
      { replace: true },
    );
  }, [selectedVariant, setSearchParams]);

  useEffect(() => {
    if (!product) {
      return;
    }

    addRecentlyViewedProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      description: product.description,
      images: product.images,
      created_at: product.created_at,
      sales_count: product.sales_count,
      rating_average: product.rating_average,
      second_hand: product.second_hand,
      specs: product.specs,
      categories: product.categories,
      product_variants: variants,
      selected_variant_id: selectedVariant?.id || null,
    });
  }, [product, selectedVariant?.id, variants]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [selectedVariant?.id]);

  const galleryImages = useMemo(
    () => getVariantGallery(selectedVariant, product?.images || []),
    [product?.images, selectedVariant],
  );

  const selectedPrice = toPriceNumber(selectedVariant?.price ?? product?.starting_price ?? 0);
  const selectedComparePriceRaw = toPriceNumber(selectedVariant?.compare_at_price ?? 0);
  const selectedComparePrice = selectedComparePriceRaw > selectedPrice ? selectedComparePriceRaw : null;
  const discountRate = buildDiscountRate(selectedComparePrice, selectedPrice);
  const selectedStock = selectedVariant?.stock ?? 0;
  const selectedVariantSummary = selectedVariant ? getVariantLabel(selectedVariant) : "";
  const secondHandDetails = normalizeSecondHandDetails(product?.second_hand);
  const secondHandConditionLabel = getSecondHandConditionLabel(secondHandDetails?.condition);
  const secondHandBatteryLabel = getBatteryHealthBucketLabel(secondHandDetails?.battery_health);

  const breadcrumbSchema = useMemo(() => {
    if (!product || !currentUrl) {
      return null;
    }

    try {
      const current = new URL(currentUrl);
      const categoryPath = product.categories?.slug ? `/products?category=${encodeURIComponent(product.categories.slug)}` : "/products";

      return buildBreadcrumbStructuredData([
        { name: "Ana Sayfa", item: `${current.origin}/` },
        { name: "Ürünler", item: `${current.origin}/products` },
        ...(product.categories?.name
          ? [{ name: product.categories.name, item: `${current.origin}${categoryPath}` }]
          : []),
        { name: product.name, item: currentUrl },
      ]);
    } catch {
      return null;
    }
  }, [currentUrl, product]);

  const schemaPayload = useMemo(
    () => [breadcrumbSchema].filter(Boolean),
    [breadcrumbSchema],
  );

  const handleSelectVariant = (variant: ProductVariantRecord | null) => {
    const fallbackVariant = variant || getDefaultProductVariant(variants) || null;
    setSelectedVariantId(fallbackVariant?.id || null);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      toast.error("Lütfen geçerli bir model seçin");
      return;
    }

    if (selectedVariant.stock <= 0) {
      toast.error("Seçilen model şu an stokta yok");
      return;
    }

    for (let index = 0; index < quantity; index += 1) {
      addItem({
        variantId: selectedVariant.id || "",
        productId: product.id,
        productName: product.name,
        variantInfo: getVariantLabel(selectedVariant),
        price: toPriceNumber(selectedVariant.price),
        originalPrice: selectedComparePrice ?? undefined,
        image: galleryImages[0],
        stock: selectedVariant.stock,
      });
    }

    toast.success(`${quantity} adet sepete eklendi`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 sm:py-10">
          <div className="space-y-3">
            <Skeleton className="h-5 w-52" />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <Skeleton className="aspect-square w-full rounded-[2rem]" />
              <div className="space-y-5">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-24 w-full rounded-3xl" />
                <Skeleton className="h-16 w-full rounded-3xl" />
                <Skeleton className="h-16 w-full rounded-3xl" />
                <Skeleton className="h-52 w-full rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container py-16">
          <Card className="mx-auto max-w-2xl border-border/70 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)]">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <p className="font-display text-2xl font-semibold text-foreground">Ürün detayı yüklenemedi</p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">{error || "Aradığınız ürün bulunamadı ya da geçici olarak erişilemiyor."}</p>
              <Button asChild>
                <Link to="/products">Ürünlere dön</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const canAddToCart = Boolean(selectedVariant && selectedStock > 0);
  const lowStockMessage =
    selectedStock <= 0
      ? "Bu model geçici olarak stokta bulunmuyor."
      : selectedStock <= 5
        ? `Seçili modelde son ${selectedStock} adet kaldı.`
        : `${selectedStock} adet stokla siparişe hazır.`;

  const supportMessage =
    secondHandDetails
      ? secondHandDetails.warranty_type === "none"
        ? "Durum raporu paylasilir"
        : "Cihaza ozel garanti bilgisi"
      : "Apple standart destek";

  return (
    <Layout>
      <div className="container space-y-10 py-6 sm:py-8 lg:space-y-12">
        {schemaPayload.length > 0 ? (
          <Script id={`product-detail-schema-${product.id}`} type="application/ld+json" strategy="afterInteractive">
            {JSON.stringify(schemaPayload)}
          </Script>
        ) : null}

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Ana Sayfa</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/products">Ürünler</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {product.categories?.name ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/products?category=${encodeURIComponent(product.categories.slug || "")}`}>{product.categories.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            ) : null}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          <div className="space-y-7">
            <div className="space-y-5">
              {product.brand ? <p className="text-[12px] font-medium uppercase tracking-[0.34em] text-white/58">{product.brand}</p> : null}

              <div className="space-y-3">
                <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-[3.35rem] sm:leading-[1.02]">{product.name}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/72">
                  <div className="flex items-center gap-2">
                    <ReviewStars rating={product.rating_average ?? 0} showValue />
                    <a href="#reviews" className="transition-colors hover:text-white">
                      {product.rating_count ?? 0} yorum
                    </a>
                  </div>

                  {selectedVariant?.sku ? (
                    <>
                      <span className="hidden text-white/20 sm:inline">/</span>
                      <span>SKU: {selectedVariant.sku}</span>
                    </>
                  ) : null}
                </div>
              </div>

              {product.description ? (
                <p className="max-w-2xl text-[15px] leading-7 text-white/64">{product.description}</p>
              ) : null}
            </div>

            <Card
              ref={purchasePanelRef}
              className="overflow-hidden rounded-[2rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] text-slate-950 shadow-[0_36px_80px_-46px_rgba(15,23,42,0.42)]"
            >
              <CardContent className="space-y-7 p-6 sm:p-8">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StockStatusBadge stock={selectedStock} />
                        {secondHandConditionLabel ? (
                          <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-slate-600">
                            {secondHandConditionLabel}
                          </Badge>
                        ) : null}
                        {secondHandBatteryLabel ? (
                          <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-slate-600">
                            Pil {secondHandBatteryLabel}
                          </Badge>
                        ) : null}
                    </div>

                      <div className="space-y-2">
                    <div className="flex flex-wrap items-end gap-3">
                      <span className="text-[2.4rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[3rem]">{formatCurrency(selectedPrice)}</span>
                      {selectedComparePrice ? (
                        <span className="pb-2 text-sm text-slate-400 line-through">{formatCurrency(selectedComparePrice)}</span>
                      ) : null}
                    </div>

                    <p className="text-sm leading-6 text-slate-500">
                      Seçili model: <span className="font-medium text-slate-950">{selectedVariantSummary || "Standart seçim"}</span>
                    </p>
                    {discountRate ? <p className="text-sm font-medium text-emerald-700">%{discountRate} fiyat avantaji</p> : null}
                      </div>
                  </div>

                  <div className="min-w-[220px] rounded-[1.4rem] border border-slate-200/80 bg-white/80 px-5 py-4 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.24)]">
                    <p className="text-sm font-medium text-slate-900">{lowStockMessage}</p>
                    <div className="mt-1 text-slate-300">Güvenli ödeme ve hızlı kargo ile gönderilir.</div>
                  </div>
                </div>

                <div className="grid gap-3 rounded-[1.65rem] border border-slate-200 bg-slate-50/75 p-3 sm:grid-cols-3">
                  <div className="rounded-[1.15rem] bg-white px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Teslimat</div>
                    <div className="mt-2 text-sm font-medium text-slate-900">Hizli kargo uygun</div>
                  </div>
                  <div className="rounded-[1.15rem] bg-white px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Destek</div>
                    <div className="mt-2 text-sm font-medium text-slate-900">{supportMessage}</div>
                  </div>
                  <div className="rounded-[1.15rem] bg-white px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Iade</div>
                    <div className="mt-2 text-sm font-medium text-slate-900">14 gun kosulsuz</div>
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                <VariantSelector
                  variants={variants}
                  selectedVariant={selectedVariant}
                  categorySlug={product.categories?.slug}
                  onVariantSelect={handleSelectVariant}
                />

                <div className="hidden grid gap-3 rounded-3xl border border-border/70 bg-muted/10 p-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Teslimat</div>
                    <div className="mt-2 text-sm font-medium text-white">Hızlı kargo uygun</div>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Garanti</div>
                    <div className="mt-2 text-sm font-medium text-white">
                      {secondHandDetails
                        ? secondHandDetails.warranty_type === "none"
                          ? "Garanti durumu belirtilmiş"
                          : "Cihaza özel garanti bilgisi mevcut"
                        : "2 yıl destek"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">İade</div>
                    <div className="mt-2 text-sm font-medium text-white">14 gün koşulsuz</div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-2 py-1 sm:w-auto sm:min-w-[156px]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-slate-700"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={!selectedVariant || selectedStock <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <span className="min-w-[32px] text-center text-sm font-semibold text-slate-950">{quantity}</span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full text-slate-700"
                      onClick={() => setQuantity((current) => Math.min(selectedStock || 1, current + 1))}
                      disabled={!selectedVariant || selectedStock <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    className="h-14 flex-1 rounded-full bg-slate-950 text-base font-medium text-white hover:bg-slate-900"
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {canAddToCart ? "Sepete Ekle" : "Stokta Yok"}
                  </Button>
                </div>
              </div>
              </CardContent>
            </Card>

            <DeliveryEstimate stock={selectedStock} />
            <InstallmentCalculator price={selectedPrice} />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Truck className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">Ücretsiz kargo seçeneği</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Uygun kampanyalı tutarlarda ek teslimat bedeli yansımaz.</p>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">Güvenli ödeme</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Tüm ödemeler şifrelenmiş altyapı ve güvenli bağlantı ile işlenir.</p>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <RefreshCcw className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">Kolay iade</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Siparişiniz size ulaştıktan sonra iade sürecini online olarak başlatabilirsiniz.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 lg:space-y-12">
          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Ürüne Genel Bakış</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {product.description || "Bu ürün için henüz detaylı bir tanıtım metni eklenmemiş. Seçili modele ait tüm detayları yukarıdaki alandan inceleyebilirsiniz."}
              </p>
            </div>
          </section>

          <ProductSpecsTable
            specs={product.specs}
            variant={selectedVariant}
            context={{
              brand: product.brand,
              categoryName: product.categories?.name,
              categorySlug: product.categories?.slug,
              sku: selectedVariant?.sku,
              color: selectedVariant?.color_name,
              variantSummary: selectedVariantSummary,
            }}
          />

          <SecondHandInfo details={secondHandDetails} />

          <WarrantyReturnInfo productName={product.name} brand={product.brand} />

          <ReviewsSection
            productId={product.id}
            productName={product.name}
            brand={product.brand}
            description={product.description}
            images={galleryImages}
            price={selectedPrice}
            compareAtPrice={selectedComparePrice}
            sku={selectedVariant?.sku || null}
            availability={buildOfferAvailability(selectedStock)}
            url={currentUrl}
          />
        </div>
      </div>

      <StickyBuyBar
        visible={stickyVisible}
        productName={product.name}
        variantSummary={selectedVariantSummary}
        price={selectedPrice}
        stock={selectedStock}
        onAddToCart={handleAddToCart}
        disabled={!selectedVariant}
      />
    </Layout>
  );
}
