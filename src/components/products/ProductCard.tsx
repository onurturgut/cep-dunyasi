import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { isBestSeller, isLowStock, isNewProduct } from "@/lib/product-catalog";
import type { ProductSpecs } from "@/lib/product-specs";
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
  category,
  secondHand,
  specs,
  storage,
  ram,
}: ProductCardProps) {
  const { user } = useAuth();
  const { isFavorite, toggleWishlist, togglingProductId } = useWishlist();
  const addItem = useCartStore((state) => state.addItem);
  const normalizedPrice = toPriceNumber(price);
  const normalizedOriginalPrice = toPriceNumber(originalPrice);
  const galleryImages = Array.from(new Set([...(images || []), image].filter(Boolean) as string[]));
  const primaryImage = galleryImages[0];
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
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
