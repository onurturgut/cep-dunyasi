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
import { getVariantSwatches, type ProductVariantRecord } from "@/lib/product-variants";
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
  storage?: string;
  ram?: string | null;
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
  storage,
  ram,
}: ProductCardProps) {
  const [isImageHovered, setIsImageHovered] = useState(false);
  const { user } = useAuth();
  const { isFavorite, toggleWishlist, togglingProductId } = useWishlist();
  const { locale } = useI18n();
  const { mutate: trackMarketingEvent } = useTrackMarketingEvent();
  const addItem = useCartStore((state) => state.addItem);
  const normalizedPrice = toPriceNumber(price);
  const normalizedOriginalPrice = toPriceNumber(originalPrice);
  const galleryImages = Array.from(new Set([...(images || []), image].filter(Boolean) as string[]));
  const primaryImage = galleryImages[0];
  const secondaryImage = galleryImages[1] ?? null;
  const colorSwatches = getVariantSwatches(productVariants || []).slice(0, 4);
  const extraColorCount = Math.max(0, getVariantSwatches(productVariants || []).length - colorSwatches.length);
  const favorite = isFavorite(id);
  const normalizedSecondHand = normalizeSecondHandDetails(secondHand);
  const showNewBadge = isNewProduct(createdAt);
  const showBestSellerBadge = isBestSeller(salesCount);
  const showLowStockBadge = isLowStock(stock);
  const secondHandConditionLabel = getSecondHandConditionLabel(normalizedSecondHand?.condition);
  const secondHandBatteryLabel = getBatteryHealthBucketLabel(normalizedSecondHand?.battery_health);
  const secondHandWarrantyLabel = getSecondHandWarrantyLabel(
    normalizedSecondHand?.warranty_type,
    normalizedSecondHand?.warranty_remaining_months,
  );
  const discountRate =
    normalizedOriginalPrice > normalizedPrice ? Math.round(((normalizedOriginalPrice - normalizedPrice) / normalizedOriginalPrice) * 100) : 0;
  const overline = [brand, category].filter(Boolean).join(" • ");
  const detailTokens = Array.from(
    new Set(
      [
        caseDetails?.case_type || null,
        caseDetails?.case_theme && caseDetails.case_theme !== "Duz" ? caseDetails.case_theme : null,
        !storage && !ram ? variantInfo : null,
        caseDetails?.feature_tags?.[0] || null,
        secondHandConditionLabel,
        storage && storage !== "Standart" ? storage : null,
        ram ? `${ram} RAM` : null,
        normalizedSecondHand && secondHandBatteryLabel ? `Pil ${secondHandBatteryLabel}` : null,
        normalizedSecondHand && secondHandWarrantyLabel ? secondHandWarrantyLabel : null,
      ].filter(Boolean) as string[],
    ),
  ).slice(0, caseDetails ? 3 : 2);
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
          soldOut: "Tukendi",
          secondHand: "2. El",
          discount: `%${discountRate} Indirim`,
          bestSeller: "Cok Satan",
          new: "Yeni",
          lowStock: "Tukeniyor",
          favoriteAdd: "Favorilere ekle",
          favoriteRemove: "Favorilerden cikar",
          favoriteAuthRequired: "Favorilere eklemek icin giris yapmaniz gerekiyor",
          favoriteAdded: "Favorilere eklendi",
          favoriteRemoved: "Favorilerden cikarildi",
          favoriteError: "Favori islemi tamamlanamadi",
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
        <Card className="group flex h-full flex-col overflow-hidden rounded-[28px] border-border/70 bg-card shadow-[0_18px_50px_-36px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-foreground/10 hover:shadow-[0_28px_70px_-38px_rgba(15,23,42,0.45)]">
          <div className="relative aspect-[4/4.35] overflow-hidden bg-gradient-to-b from-transparent via-muted/10 to-transparent sm:aspect-[4/4.15]">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/25 to-transparent" />

            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-3 z-20 h-9 w-9 rounded-full border border-border/70 bg-background/92 text-foreground shadow-sm backdrop-blur"
              onClick={handleToggleWishlist}
              disabled={togglingProductId === id}
              aria-label={favorite ? copy.favoriteRemove : copy.favoriteAdd}
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-primary text-primary" : "text-foreground"}`} />
            </Button>

            {statusBadge ? (
              <Badge
                className={cn(
                  "absolute left-3 top-3 z-20 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-sm",
                  statusBadge.className,
                )}
              >
                {statusBadge.label}
              </Badge>
            ) : null}

            {galleryImages.length > 0 ? (
              <div className="relative h-full w-full px-3 pb-3 pt-12 sm:px-4 sm:pb-4">
                <div className="absolute inset-x-8 bottom-4 h-10 rounded-full bg-foreground/10 blur-2xl" />
                <div
                  className="relative h-full w-full overflow-hidden rounded-[22px] bg-background/5"
                  onMouseEnter={() => setIsImageHovered(true)}
                  onMouseLeave={() => setIsImageHovered(false)}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={getOptimizedImageUrl(primaryImage, { kind: "product-card" })}
                      alt={name}
                      width={720}
                      height={780}
                      sizes={getResponsiveImageSizes("product-card")}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover object-center transition-all duration-500",
                        secondaryImage && isImageHovered ? "scale-[1.02] opacity-0" : "scale-100 opacity-100 group-hover:scale-[1.05]",
                      )}
                      loading="lazy"
                      draggable={false}
                    />

                    {secondaryImage ? (
                      <Image
                        src={getOptimizedImageUrl(secondaryImage, { kind: "product-card" })}
                        alt={`${name} alternatif gorsel`}
                        width={720}
                        height={780}
                        sizes={getResponsiveImageSizes("product-card")}
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover object-center transition-all duration-500",
                          isImageHovered ? "scale-[1.03] opacity-100" : "scale-100 opacity-0",
                        )}
                        loading="lazy"
                        draggable={false}
                      />
                    ) : null}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent opacity-60" />

                  {galleryImages.length > 1 ? (
                    <div className="absolute bottom-3 left-3 z-10 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/90 backdrop-blur">
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
              <div className="absolute inset-x-0 bottom-0 border-t border-border/70 bg-background/90 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
                {copy.outOfStock}
              </div>
            ) : null}
          </div>

          <CardContent className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {overline ? <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">{overline}</p> : null}
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-[1.02rem]">{name}</h3>
              </div>

              {ratingAverage && ratingAverage > 0 ? (
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                  {ratingAverage.toFixed(1)}
                </div>
              ) : null}
            </div>

            {detailTokens.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {detailTokens.map((token) => (
                  <span key={token} className="rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {token}
                  </span>
                ))}
              </div>
            ) : description ? (
              <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{description}</p>
            ) : null}

            {colorSwatches.length > 1 ? (
              <div className="mt-3 flex items-center gap-2.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Renkler</span>
                <div className="flex items-center">
                  {colorSwatches.map((swatch, index) => (
                    <span
                      key={`${swatch.label}-${index}`}
                      className={cn(
                        "h-4 w-4 rounded-full border border-background shadow-sm ring-1 ring-border/60",
                        index > 0 ? "-ml-1.5" : "",
                        !swatch.colorCode ? "bg-slate-200" : "",
                      )}
                      style={swatch.colorCode ? { backgroundColor: swatch.colorCode } : undefined}
                      title={swatch.label}
                    />
                  ))}
                  {extraColorCount > 0 ? (
                    <span className="ml-2 text-[11px] font-medium text-muted-foreground">+{extraColorCount}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-3">
              <ProductUrgencyInfo salesCount={salesCount} stock={stock} ratingCount={ratingCount} compact />
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4 min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between sm:pt-5">
              <div className="min-w-0">
                {normalizedOriginalPrice > normalizedPrice ? (
                  <span className="block text-[11px] text-muted-foreground line-through sm:text-xs">{formatCurrency(normalizedOriginalPrice)}</span>
                ) : (
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{copy.price}</span>
                )}
                <span className="mt-1 block text-base font-bold tracking-tight text-foreground min-[380px]:text-lg sm:text-[1.35rem]">
                  {formatCurrency(normalizedPrice)}
                </span>
              </div>

              {variantId && stock > 0 ? (
                <Button
                  variant="secondary"
                  className="h-10 w-full rounded-full border border-border/70 bg-background px-4 text-xs font-semibold text-foreground shadow-sm hover:bg-foreground hover:text-background min-[480px]:w-auto min-[480px]:shrink-0"
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

            {normalizedOriginalPrice > normalizedPrice ? <p className="mt-2 text-[11px] font-medium text-emerald-700 sm:text-xs">{copy.savings}</p> : null}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
