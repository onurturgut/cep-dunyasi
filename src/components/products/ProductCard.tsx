import { useState } from "react";
import Image from "next/image";
import { Heart, ShoppingCart, Star } from "lucide-react";
import type { CaseDetails } from "@/lib/case-models";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductUrgencyInfo } from "@/components/products/ProductUrgencyInfo";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useTrackMarketingEvent } from "@/hooks/use-marketing";
import { useI18n } from "@/i18n/provider";
import { isBestSeller, isLowStock, isNewProduct } from "@/lib/product-catalog";
import type { ProductSpecs } from "@/lib/product-specs";
import { getVariantSwatches, normalizeProductVariant, type ProductVariantRecord } from "@/lib/product-variants";
import {
  getBatteryHealthBucketLabel,
  getSecondHandConditionLabel,
  getSecondHandWarrantyLabel,
  normalizeSecondHandDetails,
  type SecondHandDetails,
} from "@/lib/second-hand";
import { getOptimizedImageUrl, getResponsiveImageSizes } from "@/lib/media";
import { cn, formatCurrency, toPriceNumber } from "@/lib/utils";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  image?: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  variantId?: string;
  variantInfo?: string;
  stock?: number;
  createdAt?: string | Date;
  salesCount?: number;
  ratingAverage?: number;
  ratingCount?: number;
  category?: string;
  secondHand?: SecondHandDetails | null;
  caseDetails?: CaseDetails | null;
  specs?: ProductSpecs | null;
  productVariants?: ProductVariantRecord[];
  colorName?: string | null;
  storage?: string;
  ram?: string | null;
  layout?: "default" | "compact";
}

export function ProductCard({
  id,
  name,
  slug,
  brand,
  description,
  image,
  images,
  price,
  originalPrice,
  variantId,
  variantInfo,
  stock = 0,
  createdAt,
  salesCount,
  ratingAverage,
  ratingCount,
  category,
  secondHand,
  caseDetails,
  specs,
  productVariants,
  colorName,
  storage,
  ram,
  layout = "default",
}: ProductCardProps) {
  const [isImageHovered, setIsImageHovered] = useState(false);
  const { user } = useAuth();
  const { isFavorite, toggleWishlist, togglingProductsd } = useWishlist();
  const { locale } = useI18n();
  const { mutate: trackMarketingEvent } = useTrackMarketingEvent();
  const addItem = useCartStore((state) => state.addItem);
  const normalizedPrice = toPriceNumber(price);
  const normalizedOriginalPrice = toPriceNumber(originalPrice);
  const galleryImages = Array.from(new Set([...(images || []), image].filter(Boolean) as string[]));
  const primaryImage = galleryImages[0];
  const secondaryImage = galleryImages[1] ?? null;
  const allColorSwatches = getVariantSwatches(productVariants || []);
  const colorSwatches = allColorSwatches.slice(0, 4);
  const extraColorCount = Math.max(0, allColorSwatches.length - colorSwatches.length);
  const isCaseProduct = Boolean(caseDetails);
  const activeColorName = colorName || colorSwatches[0]?.label || null;
  const compatibilityLabel =
    isCaseProduct && variantInfo
      ? variantInfo
          .split(" / ")
          .map((item) => item.trim())
          .filter(Boolean)[0] || null
      : null;
  const compatibilityCount = isCaseProduct
    ? new Set(
        (productVariants || [])
          .map((variant) => normalizeProductVariant(variant))
          .filter((variant) => variant.is_active)
          .map((variant) => variant.attributes.uyumluluk || variant.attributes.compatibility || null)
          .filter(Boolean),
      ).size
    : 0;
  const favorite = isFavorite(id);
  const normalizedSecondHand = normalizeSecondHandDetails(secondHand);
  const showNewBadge = isNewProduct(createdAt);
  const showBestSellerBadge = isBestSeller(salesCount);
  const showLowStockBadge = isLowStock(stock);
  const isCompact = layout === "compact";
  const secondHandConditionLabel = getSecondHandConditionLabel(normalizedSecondHand?.condition);
  const secondHandBatteryLabel = getBatteryHealthBucketLabel(normalizedSecondHand?.battery_health);
  const secondHandWarrantyLabel = getSecondHandWarrantyLabel(
    normalizedSecondHand?.warranty_type,
    normalizedSecondHand?.warranty_remaining_months,
  );
  const discountRate =
    normalizedOriginalPrice > normalizedPrice ? Math.round(((normalizedOriginalPrice - normalizedPrice) / normalizedOriginalPrice) * 100) : 0;
  const overline = [brand, category].filter(Boolean).join(" â€¢ ");
  const detailTokens = Array.from(
    new Set(
      [
        caseDetails?.case_type || null,
        caseDetails?.case_theme && caseDetails.case_theme !== "Duz" ? caseDetails.case_theme : null,
        !isCaseProduct && !storage && !ram ? variantInfo : null,
        caseDetails?.feature_tags?.[0] || null,
        secondHandConditionLabel,
        storage && storage !== "Standart" ? storage : null,
        ram ? `${ram} RAM` : null,
        normalizedSecondHand && secondHandBatteryLabel ? `Pil ${secondHandBatteryLabel}` : null,
        normalizedSecondHand && secondHandWarrantyLabel ? secondHandWarrantyLabel : null,
      ].filter(Boolean) as string[],
    ),
  ).slice(0, caseDetails ? 3 : 2);
  const supportingText =
    (compatibilityLabel ? `${compatibilityLabel} ile uyumlu` : null) ||
    detailTokens[0] ||
    description ||
    variantInfo ||
    null;
  const copy =
    locale === "en"
      ? {
          soldOut: "Sold Out",
          secondHand: "Second-Hand",
          discount: `${discountRate}% Off`,
          bestSeller: "Best Seller",
          new: "New",
          lowStock: "Running Low",
          favoriteAdd: "Add to favorites",
          favoriteRemove: "Remove from favorites",
          favoriteAuthRequired: "You need to sign in to add favorites",
          favoriteAdded: "Added to favorites",
          favoriteRemoved: "Removed from favorites",
          favoriteError: "Favorite action could not be completed",
          outOfStock: "Out of stock",
          price: "Price",
          addToCart: "Add to cart",
          addedToCart: "Added to cart!",
          savings: `${discountRate}% savings`,
        }
      : {
          soldOut: "Tükendi",
          secondHand: "2. El",
          discount: `%${discountRate} İndirim`,
          bestSeller: "Çok Satan",
          new: "Yeni",
          lowStock: "Tükeniyor",
          favoriteAdd: "Favorilere ekle",
          favoriteRemove: "Favorilerden çıkar",
          favoriteAuthRequired: "Favorilere eklemek için giriş yapmanız gerekiyor",
          favoriteAdded: "Favorilere eklendi",
          favoriteRemoved: "Favorilerden çıkarildi",
          favoriteError: "Favori işlemi tamamlanamadı",
          outOfStock: "Stokta yok",
          price: "Fiyat",
          addToCart: "Sepete ekle",
          addedToCart: "Sepete eklendi!",
          savings: `${discountRate}% fiyat avantaji`,
        };
  const statusBadge =
    stock <= 0
      ? { label: copy.soldOut, className: "bg-foreground text-background" }
      : normalizedSecondHand
        ? { label: secondHandConditionLabel || copy.secondHand, className: "border border-border/70 bg-background/92 text-foreground" }
        : discountRate > 0
          ? { label: copy.discount, className: "bg-foreground text-background" }
          : showBestSellerBadge
            ? { label: copy.bestSeller, className: "bg-primary text-primary-foreground" }
            : showNewBadge
              ? { label: copy.new, className: "border border-border/70 bg-background/92 text-foreground" }
              : showLowStockBadge
                ? { label: copy.lowStock, className: "border border-amber-200 bg-amber-100 text-amber-900" }
                : null;

  void specs;

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!variantId) {
      return;
    }

    addItem({
      variantId,
      productId: id,
      productName: name,
      variantInfo: variantInfo || brand || "",
      price: normalizedPrice,
      originalPrice: normalizedOriginalPrice > normalizedPrice ? normalizedOriginalPrice : undefined,
      image: primaryImage,
      stock,
    });

    toast.success(copy.addedToCart, { description: name });
    void trackMarketingEvent({
      eventType: "add_to_cart",
      entityType: "product",
      entityId: id,
      pagePath: typeof window !== "undefined" ? window.location.pathname : "/products",
      metadata: {
        variantId: variantId || null,
        quantity: 1,
      },
    });
  };

  const handleToggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error(copy.favoriteAuthRequired);
      return;
    }

    try {
      const result = await toggleWishlist(id);
      toast.success(result.isFavorite ? copy.favoriteAdded : copy.favoriteRemoved, { description: name });
      void trackMarketingEvent({
        eventType: "add_to_favorites",
        entityType: "product",
        entityId: id,
        pagePath: typeof window !== "undefined" ? window.location.pathname : "/products",
        metadata: {
          isFavorite: result.isFavorite,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.favoriteError);
    }
  };

  return (
    <div className="h-full">
      <Link to={`/product/${slug}`} className="block h-full">
        <Card
          className={cn(
            "group flex h-full flex-col overflow-hidden border-border/70 bg-card transition-all duration-300",
            isCompact
              ? "rounded-[24px] shadow-[0_18px_44px_-36px_rgba(15,23,42,0.45)] sm:hover:-translate-y-1 sm:hover:border-foreground/10 sm:hover:shadow-[0_24px_54px_-36px_rgba(15,23,42,0.45)]"
              : "rounded-[22px] shadow-[0_18px_50px_-36px_rgba(15,23,42,0.4)] sm:rounded-[28px] sm:hover:-translate-y-1 sm:hover:border-foreground/10 sm:hover:shadow-[0_28px_70px_-38px_rgba(15,23,42,0.45)]",
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden bg-gradient-to-b from-transparent via-muted/10 to-transparent",
              isCompact ? "aspect-[4/4.35]" : "aspect-[4/4.1] sm:aspect-[4/4.15]",
            )}
          >
            <div className={cn("absolute inset-x-0 top-0 bg-gradient-to-b from-background/25 to-transparent", isCompact ? "h-16" : "h-20 sm:h-24")} />

            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn(
                "absolute z-20 rounded-full border border-border/70 bg-background/92 text-foreground shadow-sm backdrop-blur",
                isCompact ? "right-2.5 top-2.5 h-7 w-7" : "right-2.5 top-2.5 h-8 w-8 sm:right-3 sm:top-3 sm:h-9 sm:w-9",
              )}
              onClick={handleToggleWishlist}
              disabled={togglingProductsd === id}
              aria-label={favorite ? copy.favoriteRemove : copy.favoriteAdd}
            >
              <Heart className={cn("h-4 w-4", favorite ? "fill-primary text-primary" : "text-foreground", isCompact && "h-3.5 w-3.5")} />
            </Button>

            {statusBadge ? (
              <Badge
                className={cn(
                    "absolute left-2.5 top-2.5 z-20 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] shadow-sm",
                  !isCompact && "sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]",
                    statusBadge.className,
                  )}
              >
                {statusBadge.label}
              </Badge>
            ) : null}

            {galleryImages.length > 0 ? (
                <div className={cn("relative h-full w-full", isCompact ? "px-2.5 pb-2.5 pt-8" : "px-2.5 pb-2.5 pt-10 sm:px-4 sm:pb-4 sm:pt-12")}>
                  <div className={cn("absolute rounded-full bg-foreground/10 blur-2xl", isCompact ? "inset-x-5 bottom-2.5 h-7" : "inset-x-6 bottom-3 h-8 sm:inset-x-8 sm:bottom-4 sm:h-10")} />
                  <div
                    className={cn("relative h-full w-full overflow-hidden bg-background/5", isCompact ? "rounded-[16px]" : "rounded-[18px] sm:rounded-[22px]")}
                    onMouseEnter={() => setIsImageHovered(true)}
                    onMouseLeave={() => setIsImageHovered(false)}
                  >
                  <div className="relative h-full w-full">
                    <div className="relative h-full w-full">
                      <Image
                        src={getOptimizedImageUrl(primaryImage, { kind: "product-card" })}
                        alt={name}
                      width={720}
                      height={780}
                      sizes={getResponsiveImageSizes("product-card")}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover object-center transition-all duration-500",
                        secondaryImage && isImageHovered ? "opacity-0" : "opacity-100 sm:group-hover:scale-[1.05]",
                      )}
                      loading="lazy"
                      draggable={false}
                    />

                    {secondaryImage ? (
                      <Image
                        src={getOptimizedImageUrl(secondaryImage, { kind: "product-card" })}
                        alt={`${name} alternatif gÃ¶rsel`}
                        width={720}
                        height={780}
                        sizes={getResponsiveImageSizes("product-card")}
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover object-center transition-all duration-500",
                          isImageHovered ? "opacity-100 sm:scale-[1.03]" : "opacity-0",
                        )}
                        loading="lazy"
                        draggable={false}
                      />
                    ) : null}
                  </div>
                    </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent opacity-60" />

                  {galleryImages.length > 1 ? (
                      <div
                        className={cn(
                          "absolute bottom-2.5 left-2.5 z-10 rounded-full border border-white/20 bg-black/25 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-white/90 backdrop-blur",
                          !isCompact && "sm:bottom-3 sm:left-3 sm:px-2.5 sm:text-[10px]",
                        )}
                      >
                       {galleryImages.length} foto
                     </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="h-10 w-10 opacity-20 sm:h-12 sm:w-12" />
              </div>
            )}

            {stock <= 0 ? (
               <div className="absolute inset-x-0 bottom-0 border-t border-border/70 bg-background/90 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur sm:px-4 sm:py-3 sm:text-xs">
                 {copy.outOfStock}
               </div>
            ) : null}
          </div>

          <CardContent className={cn("flex min-w-0 flex-1 flex-col", isCompact ? "px-3 pb-3.5 pt-3" : "px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {overline ? <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">{overline}</p> : null}
                <h3 className={cn("mt-1 line-clamp-2 font-semibold leading-snug text-foreground", isCompact ? "text-[14px]" : "text-[13px] sm:text-[1.02rem]")}>{name}</h3>
              </div>

              {!isCompact && ratingAverage && ratingAverage > 0 ? (
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/70 px-2 py-1 text-[10px] font-semibold text-foreground sm:px-2.5 sm:text-[11px]">
                  <Star className="h-3 w-3 fill-current text-amber-500 sm:h-3.5 sm:w-3.5" />
                  {ratingAverage.toFixed(1)}
                </div>
              ) : null}
            </div>

            {isCompact ? (
              <>
                {supportingText ? <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[11px] leading-relaxed text-muted-foreground">{supportingText}</p> : null}

                <div className="mt-auto border-t border-border/60 pt-3">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      {normalizedOriginalPrice > normalizedPrice ? (
                        <span className="block text-[11px] text-muted-foreground line-through">{formatCurrency(normalizedOriginalPrice)}</span>
                      ) : (
                        <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{copy.price}</span>
                      )}
                      <span className="mt-1 block text-[1.1rem] font-bold tracking-tight text-foreground">{formatCurrency(normalizedPrice)}</span>
                    </div>

                    {normalizedOriginalPrice > normalizedPrice ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">%{discountRate}</span>
                    ) : null}
                  </div>

                  <span className={cn("mt-1.5 block text-[11px] font-medium", stock > 0 ? "text-emerald-700" : "text-muted-foreground")}>
                    {stock > 0 ? (stock <= 5 ? "Son ürünler, hızlı gönderim" : "Stokta, hızlı gönderim") : copy.outOfStock}
                  </span>

                  {variantId && stock > 0 ? (
                    <Button
                      variant="secondary"
                      className="mt-3 h-10 w-full rounded-full border border-border/70 bg-background text-[12px] font-semibold text-foreground shadow-sm hover:bg-foreground hover:text-background"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {copy.addToCart}
                    </Button>
                  ) : (
                    <span className="mt-3 block w-full rounded-full border border-border/70 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {copy.soldOut}
                    </span>
                  )}
                </div>
              </>
            ) : compatibilityLabel ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-foreground/10 bg-foreground px-2.5 py-1 text-[10px] font-semibold text-background sm:px-3 sm:text-[11px]">
                    {compatibilityLabel} Uyumlu
                 </span>
                 {compatibilityCount > 1 ? (
                   <span className="rounded-full border border-border/70 bg-muted/35 px-2 py-1 text-[10px] font-medium text-muted-foreground sm:px-2.5 sm:text-[11px]">
                     {compatibilityCount} model uyumlu
                   </span>
                 ) : null}
              </div>
            ) : null}

            {!isCompact && detailTokens.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {detailTokens.map((token) => (
                    <span key={token} className="rounded-full border border-border/70 bg-muted/35 px-2 py-1 text-[10px] font-medium text-muted-foreground sm:px-2.5 sm:text-[11px]">
                     {token}
                   </span>
                 ))}
                </div>
              ) : !isCompact && description ? (
                <p className="mt-2.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-[12px]">{description}</p>
              ) : null}

            {!isCompact && colorSwatches.length > 1 ? (
               <div className="mt-2.5 flex items-center gap-2">
                 <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Renkler</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                  {colorSwatches.map((swatch, index) => (
                    <span
                      key={`${swatch.label}-${index}`}
                      className={cn(
                         "h-3.5 w-3.5 rounded-full border border-background shadow-sm ring-1 ring-border/60 transition-transform duration-200 sm:h-4 sm:w-4",
                        swatch.label === activeColorName ? "ring-2 ring-foreground/55 scale-105" : "",
                        !swatch.colorCode ? "bg-slate-200" : "",
                      )}
                      style={swatch.colorCode ? { backgroundColor: swatch.colorCode } : undefined}
                      title={swatch.label}
                    />
                  ))}
                  {extraColorCount > 0 ? (
                     <span className="ml-1.5 text-[10px] font-medium text-muted-foreground sm:ml-2 sm:text-[11px]">+{extraColorCount}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!isCompact ? (
              <div className="mt-2.5">
                <ProductUrgencyInfo salesCount={salesCount} stock={stock} ratingCount={ratingCount} compact />
              </div>
            ) : null}

            {!isCompact ? (
              <div className="mt-auto flex flex-col gap-2.5 pt-3 min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between sm:gap-3 sm:pt-5">
                <div className="min-w-0">
                  {normalizedOriginalPrice > normalizedPrice ? (
                    <span className="block text-[11px] text-muted-foreground line-through sm:text-xs">{formatCurrency(normalizedOriginalPrice)}</span>
                ) : (
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.price}</span>
                )}
                 <span className="mt-1 block text-[15px] font-bold tracking-tight text-foreground min-[380px]:text-base sm:text-[1.35rem]">
                   {formatCurrency(normalizedPrice)}
                 </span>
                 <span className={cn("mt-1 block text-[11px] font-medium sm:text-xs", stock > 0 ? "text-emerald-700" : "text-muted-foreground")}>
                  {stock > 0 ? (stock <= 5 ? "Son Ã¼rÃ¼nler, hÄ±zlÄ± gÃ¶nderim" : "Stokta, hÄ±zlÄ± gÃ¶nderim") : copy.outOfStock}
                </span>
              </div>

              {variantId && stock > 0 ? (
                 <Button
                   variant="secondary"
                   className="h-9 w-full rounded-full border border-border/70 bg-background px-3 text-[11px] font-semibold text-foreground shadow-sm hover:bg-foreground hover:text-background min-[480px]:w-auto min-[480px]:shrink-0 sm:h-10 sm:px-4 sm:text-xs"
                   onClick={handleAddToCart}
                 >
                  <ShoppingCart className="h-4 w-4" />
                  {copy.addToCart}
                </Button>
              ) : (
                <span className="w-full rounded-full border border-border/70 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground min-[480px]:w-auto">
                  {copy.soldOut}
                </span>
              )}
              </div>
            ) : null}

            {!isCompact && normalizedOriginalPrice > normalizedPrice ? <p className="mt-2 text-[11px] font-medium text-emerald-700 sm:text-xs">{copy.savings}</p> : null}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}


