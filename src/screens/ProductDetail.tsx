"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Minus, Plus, RefreshCcw, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { useParams, useSearchParams, Link } from "@/lib/router";
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
import { ProductFaqSection } from "@/components/product-detail/ProductFaqSection";
import { StickyBuyBar } from "@/components/product-detail/StickyBuyBar";
import { SecondHandInfo } from "@/components/product-detail/SecondHandInfo";
import { WarrantyReturnInfo } from "@/components/product-detail/WarrantyReturnInfo";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { db } from "@/integrations/mongo/client";
import { useCartStore } from "@/lib/cart-store";
import { addRecentlyViewedProduct } from "@/lib/recently-viewed";
import { useStickyBuyBarVisibility } from "@/hooks/use-sticky-buy-bar-visibility";
import {
  buildBreadcrumbStructuredData,
  buildFaqStructuredData,
  buildProductFaqItems,
  type ProductFaqItem,
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

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images: string[];
  starting_price?: number;
  created_at?: string | Date;
  sales_count?: number;
  rating_average?: number;
  rating_count?: number;
  rating_distribution?: Record<string, number> | null;
  specs?: ProductSpecs | null;
  second_hand?: SecondHandDetails | null;
  categories?: { name?: string; slug?: string } | null;
  product_variants: ProductVariantRecord[];
};

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

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialSelection] = useState(() => ({
    variantId: searchParams.get("variant"),
    colorName: searchParams.get("color"),
    storage: searchParams.get("storage"),
    ram: searchParams.get("ram"),
  }));
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [variants, setVariants] = useState<ProductVariantRecord[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const purchasePanelRef = useRef<HTMLDivElement | null>(null);
  const stickyVisible = useStickyBuyBarVisibility(purchasePanelRef, Boolean(product));

  useEffect(() => {
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
          throw new Error(requestError.message || "\u00dcr\u00fcn bilgileri y\u00fcklenemedi");
        }

        if (!data) {
          throw new Error("\u00dcr\u00fcn bulunamad\u0131");
        }

        const nextProduct: ProductRecord = {
          ...(data as ProductRecord),
          images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
          starting_price: toPriceNumber(data.starting_price),
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

        setError(fetchError instanceof Error ? fetchError.message : "\u00dcr\u00fcn bilgileri y\u00fcklenemedi");
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
  }, [initialSelection, slug]);

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
  const productFaqItems = useMemo<ProductFaqItem[]>(
    () =>
      product
        ? buildProductFaqItems({
            productName: product.name,
            brand: product.brand,
            categoryName: product.categories?.name,
            stock: selectedStock,
          })
        : [],
    [product, selectedStock],
  );

  const breadcrumbSchema = useMemo(() => {
    if (!product || !currentUrl) {
      return null;
    }

    try {
      const current = new URL(currentUrl);
      const categoryPath = product.categories?.slug ? `/products?category=${encodeURIComponent(product.categories.slug)}` : "/products";

      return buildBreadcrumbStructuredData([
        { name: "Ana Sayfa", item: `${current.origin}/` },
        { name: "\u00dcr\u00fcnler", item: `${current.origin}/products` },
        ...(product.categories?.name
          ? [{ name: product.categories.name, item: `${current.origin}${categoryPath}` }]
          : []),
        { name: product.name, item: currentUrl },
      ]);
    } catch {
      return null;
    }
  }, [currentUrl, product]);

  const faqSchema = useMemo(() => buildFaqStructuredData(productFaqItems), [productFaqItems]);
  const schemaPayload = useMemo(
    () => [breadcrumbSchema, faqSchema].filter(Boolean),
    [breadcrumbSchema, faqSchema],
  );

  const handleSelectVariant = (variant: ProductVariantRecord | null) => {
    const fallbackVariant = variant || getDefaultProductVariant(variants) || null;
    setSelectedVariantId(fallbackVariant?.id || null);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      toast.error("L\u00fctfen ge\u00e7erli bir model se\u00e7in");
      return;
    }

    if (selectedVariant.stock <= 0) {
      toast.error("Se\u00e7ilen model \u015fu an stokta yok");
      return;
    }

    for (let index = 0; index < quantity; index += 1) {
      addItem({
        variantId: selectedVariant.id || "",
        productId: product.id,
        productName: product.name,
        variantInfo: getVariantLabel(selectedVariant),
        price: toPriceNumber(selectedVariant.price),
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
              <p className="font-display text-2xl font-semibold text-foreground">\u00dcr\u00fcn detay\u0131 y\u00fcklenemedi</p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">{error || "Arad\u0131\u011f\u0131n\u0131z \u00fcr\u00fcn bulunamad\u0131 ya da ge\u00e7ici olarak eri\u015filemiyor."}</p>
              <Button asChild>
                <Link to="/products">\u00dcr\u00fcnlere d\u00f6n</Link>
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
      ? "Bu model ge\u00e7ici olarak stokta bulunmuyor."
      : selectedStock <= 5
        ? `Se\u00e7ili modelde son ${selectedStock} adet kald\u0131.`
        : `${selectedStock} adet stokla sipari\u015fe haz\u0131r.`;

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
                <Link to="/products">\u00dcr\u00fcnler</Link>
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              {product.brand ? <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">{product.brand}</p> : null}

              <div className="space-y-3">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ReviewStars rating={product.rating_average ?? 0} showValue />
                    <a href="#reviews" className="transition-colors hover:text-foreground">
                      {product.rating_count ?? 0} yorum
                    </a>
                  </div>

                  {selectedVariant?.sku ? (
                    <>
                      <span className="hidden text-border sm:inline">/</span>
                      <span>SKU: {selectedVariant.sku}</span>
                    </>
                  ) : null}
                </div>
              </div>

              {product.description ? (
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">{product.description}</p>
              ) : null}
            </div>

            <Card
              ref={purchasePanelRef}
              className="overflow-hidden border-border/70 bg-gradient-to-br from-white via-white to-muted/15 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48)]"
            >
              <CardContent className="space-y-6 p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StockStatusBadge stock={selectedStock} />
                        {secondHandConditionLabel ? (
                          <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                            {secondHandConditionLabel}
                          </Badge>
                        ) : null}
                        {secondHandBatteryLabel ? (
                          <Badge variant="outline" className="rounded-full px-3 py-1">
                            Pil {secondHandBatteryLabel}
                          </Badge>
                        ) : null}
                        {discountRate ? (
                          <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                            %{discountRate} indirim
                          </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                      <span className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{formatCurrency(selectedPrice)}</span>
                      {selectedComparePrice ? (
                        <span className="pb-1 text-sm text-muted-foreground line-through">{formatCurrency(selectedComparePrice)}</span>
                      ) : null}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Se\u00e7ili model: <span className="font-medium text-foreground">{selectedVariantSummary || "Standart se\u00e7im"}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm shadow-sm">
                    <div className="font-medium text-foreground">{lowStockMessage}</div>
                    <div className="mt-1 text-muted-foreground">G\u00fcvenli \u00f6deme ve h\u0131zl\u0131 kargo ile g\u00f6nderilir.</div>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                <VariantSelector
                  variants={variants}
                  selectedVariant={selectedVariant}
                  categorySlug={product.categories?.slug}
                  onVariantSelect={handleSelectVariant}
                />

                <div className="grid gap-3 rounded-3xl border border-border/70 bg-muted/10 p-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Teslimat</div>
                    <div className="mt-2 text-sm font-medium text-foreground">H\u0131zl\u0131 kargo uygun</div>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Garanti</div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {secondHandDetails
                        ? secondHandDetails.warranty_type === "none"
                          ? "Garanti durumu belirtilmi\u015f"
                          : "Cihaza \u00f6zel garanti bilgisi mevcut"
                        : "2 y\u0131l destek"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-card px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">\u0130ade</div>
                    <div className="mt-2 text-sm font-medium text-foreground">14 g\u00fcn ko\u015fulsuz</div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-2 py-1 sm:w-auto sm:min-w-[148px]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={!selectedVariant || selectedStock <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <span className="min-w-[32px] text-center text-sm font-semibold text-foreground">{quantity}</span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      onClick={() => setQuantity((current) => Math.min(selectedStock || 1, current + 1))}
                      disabled={!selectedVariant || selectedStock <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    className="h-12 flex-1 rounded-2xl text-base font-medium"
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {canAddToCart ? "Sepete Ekle" : "Stokta Yok"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <DeliveryEstimate stock={selectedStock} />
            <InstallmentCalculator price={selectedPrice} />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">\u00dccretsiz kargo se\u00e7ene\u011fi</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Uygun kampanyal\u0131 tutarlarda ek teslimat bedeli yans\u0131maz.</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">G\u00fcvenli \u00f6deme</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">T\u00fcm \u00f6demeler \u015fifrelenmi\u015f altyap\u0131 ve g\u00fcvenli ba\u011flant\u0131 ile i\u015flenir.</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <RefreshCcw className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">Kolay iade</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Sipari\u015finiz size ula\u015ft\u0131ktan sonra iade s\u00fcrecini online olarak ba\u015flatabilirsiniz.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 lg:space-y-12">
          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">\u00dcr\u00fcne Genel Bak\u0131\u015f</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {product.description || "Bu \u00fcr\u00fcn i\u00e7in hen\u00fcz detayl\u0131 bir tan\u0131t\u0131m metni eklenmemi\u015f. Se\u00e7ili modele ait t\u00fcm detaylar\u0131 yukar\u0131daki alandan inceleyebilirsiniz."}
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

          <ProductFaqSection items={productFaqItems} />
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
