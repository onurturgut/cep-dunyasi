import { useState } from "react";
import { ChevronDown, Heart, ShoppingCart } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { isBestSeller, isLowStock, isNewProduct } from "@/lib/product-catalog";
import { normalizeProductSpecs, type ProductSpecs } from "@/lib/product-specs";
import {
  getBatteryHealthBucketLabel,
  getSecondHandConditionLabel,
  getSecondHandWarrantyLabel,
  normalizeSecondHandDetails,
  type SecondHandDetails,
} from "@/lib/second-hand";
import { formatCurrency, toPriceNumber } from "@/lib/utils";
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
  category?: string;
  secondHand?: SecondHandDetails | null;
  specs?: ProductSpecs | null;
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
  secondHand,
  specs,
  storage,
  ram,
}: ProductCardProps) {
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const { user } = useAuth();
  const { isFavorite, toggleWishlist, togglingProductId } = useWishlist();
  const addItem = useCartStore((state) => state.addItem);
  const normalizedPrice = toPriceNumber(price);
  const normalizedOriginalPrice = toPriceNumber(originalPrice);
  const galleryImages = Array.from(new Set([...(images || []), image].filter(Boolean) as string[]));
  const primaryImage = galleryImages[0];
  const favorite = isFavorite(id);
  const normalizedSecondHand = normalizeSecondHandDetails(secondHand);
  const normalizedSpecs = normalizeProductSpecs({
    ...specs,
    internalStorage: specs?.internalStorage || storage || null,
    ram: specs?.ram || ram || null,
  });

  const specEntries = [
    { key: "operatingSystem", label: "İşletim Sistemi", value: normalizedSpecs.operatingSystem || "Belirtilmedi" },
    { key: "internalStorage", label: "Dâhili Hafıza", value: normalizedSpecs.internalStorage || "Belirtilmedi" },
    { key: "ram", label: "RAM Kapasitesi", value: normalizedSpecs.ram || "Belirtilmedi" },
    { key: "frontCamera", label: "Ön (Selfie) Kamera", value: normalizedSpecs.frontCamera || "Belirtilmedi" },
    { key: "rearCamera", label: "Arka Kamera", value: normalizedSpecs.rearCamera || "Belirtilmedi" },
  ] as const;

  const hasAnySpecs = specEntries.some((entry) => entry.value !== "Belirtilmedi");
  const showNewBadge = isNewProduct(createdAt);
  const showBestSellerBadge = isBestSeller(salesCount);
  const showLowStockBadge = isLowStock(stock);
  const secondHandConditionLabel = getSecondHandConditionLabel(normalizedSecondHand?.condition);
  const secondHandBatteryLabel = getBatteryHealthBucketLabel(normalizedSecondHand?.battery_health);
  const secondHandWarrantyLabel = getSecondHandWarrantyLabel(
    normalizedSecondHand?.warranty_type,
    normalizedSecondHand?.warranty_remaining_months,
  );

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
      image: primaryImage,
      stock,
    });

    toast.success("Sepete eklendi!", { description: name });
  };

  const handleToggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error("Favorilere eklemek için giriş yapmanız gerekiyor");
      return;
    }

    try {
      const result = await toggleWishlist(id);
      toast.success(result.isFavorite ? "Favorilere eklendi" : "Favorilerden çıkarıldı", { description: name });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Favori işlemi tamamlanamadı");
    }
  };

  return (
    <div className="h-full">
      <Link to={`/product/${slug}`} className="block h-full">
        <Card className="group flex h-full flex-col overflow-hidden border bg-card transition-shadow hover:shadow-lg">
          <div className="relative aspect-[5/4] overflow-hidden bg-muted sm:aspect-square">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-1.5 top-1.5 z-20 h-8 w-8 rounded-full bg-background/90 backdrop-blur sm:right-2 sm:top-2"
              onClick={handleToggleWishlist}
              disabled={togglingProductId === id}
              aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-primary text-primary" : "text-foreground"}`} />
            </Button>

            <div className="absolute left-1.5 top-1.5 z-20 flex max-w-[70%] flex-wrap gap-1 sm:left-2 sm:top-2">
              {normalizedOriginalPrice > normalizedPrice ? (
                <Badge className="bg-accent px-2 py-0.5 text-[10px] text-accent-foreground sm:text-xs">
                  %{Math.round(((normalizedOriginalPrice - normalizedPrice) / normalizedOriginalPrice) * 100)} İndirim
                </Badge>
              ) : null}
              {showNewBadge ? (
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] sm:text-xs">
                  Yeni
                </Badge>
              ) : null}
              {showBestSellerBadge ? (
                <Badge className="bg-primary/90 px-2 py-0.5 text-[10px] text-primary-foreground sm:text-xs">
                  Çok Satan
                </Badge>
              ) : null}
              {showLowStockBadge ? (
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] sm:text-xs">
                  Tükeniyor
                </Badge>
              ) : null}
            </div>

            {galleryImages.length > 0 ? (
              <>
                <div className="h-full w-full snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                  <div className="grid h-full grid-flow-col auto-cols-[100%]">
                    {galleryImages.map((galleryImage, index) => (
                      <div key={`${id}-image-${index}`} className="overflow-hidden">
                        <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
                          <img
                            src={galleryImage}
                            alt={`${name} - ${index + 1}`}
                            className="h-full w-full rounded-md object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {galleryImages.length > 1 ? (
                  <Badge className="absolute bottom-1.5 right-1.5 bg-background/85 px-2 py-0.5 text-[10px] text-foreground hover:bg-background/85 sm:bottom-2 sm:right-2 sm:text-xs">
                    {galleryImages.length} foto
                  </Badge>
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="h-10 w-10 opacity-20 sm:h-12 sm:w-12" />
              </div>
            )}

            {stock <= 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Badge variant="secondary">Tükendi</Badge>
              </div>
            ) : null}
          </div>

          <CardContent className="flex flex-col p-3 sm:p-4">
            {brand ? <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-wider">{brand}</p> : null}
            <h3 className="mt-1 line-clamp-2 text-xs font-semibold text-foreground sm:text-sm">{name}</h3>
            {description ? <p className="mt-1.5 line-clamp-1 text-[11px] text-muted-foreground sm:mt-2 sm:line-clamp-2 sm:text-xs">{description}</p> : null}
            {ratingAverage && ratingAverage > 0 ? (
              <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">Puan {ratingAverage.toFixed(1)}</p>
            ) : null}
            {normalizedSecondHand ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {secondHandConditionLabel ? (
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] text-primary sm:text-[11px]">
                    {secondHandConditionLabel}
                  </Badge>
                ) : null}
                {secondHandBatteryLabel ? (
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] sm:text-[11px]">
                    Pil {secondHandBatteryLabel}
                  </Badge>
                ) : null}
                {secondHandWarrantyLabel ? (
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] sm:text-[11px]">
                    {secondHandWarrantyLabel}
                  </Badge>
                ) : null}
                {normalizedSecondHand.includes_box ? (
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] sm:text-[11px]">
                    Kutulu
                  </Badge>
                ) : null}
              </div>
            ) : null}

            <div className="mt-2.5 flex items-end justify-between gap-2 sm:mt-3 sm:gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-bold text-primary sm:text-lg">{formatCurrency(normalizedPrice)}</span>
                {normalizedOriginalPrice > normalizedPrice ? (
                  <span className="text-[11px] text-muted-foreground line-through sm:text-xs">{formatCurrency(normalizedOriginalPrice)}</span>
                ) : null}
              </div>

              {variantId && stock > 0 ? (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 shrink-0 rounded-full opacity-100 transition-opacity sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              ) : null}
            </div>

            {hasAnySpecs ? (
              <>
                <div className="relative mt-3 hidden md:block">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-card via-card/85 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card via-card/85 to-transparent" />
                  <div
                    className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pr-4 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {specEntries.map((entry) => (
                      <div key={entry.key} className="min-w-[148px] shrink-0 snap-start rounded-xl border border-border/70 bg-muted/35 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{entry.label}</p>
                        <p className="mt-1 text-xs font-semibold text-foreground">{entry.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 md:hidden">
                  <Collapsible open={isSpecsOpen} onOpenChange={setIsSpecsOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        aria-expanded={isSpecsOpen}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setIsSpecsOpen((current) => !current);
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-left transition-colors hover:bg-muted/40"
                      >
                        <span className="text-[11px] font-semibold text-foreground">Ürün Özellikleri</span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isSpecsOpen ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent
                      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <div className="mt-2 space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                        {specEntries.map((entry) => (
                          <div key={entry.key} className="flex items-start justify-between gap-3 text-[11px]">
                            <span className="text-muted-foreground">{entry.label}</span>
                            <span className="text-right font-medium text-foreground">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
