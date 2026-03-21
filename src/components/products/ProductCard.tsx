import { Link } from '@/lib/router';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/cart-store';
import { toast } from 'sonner';
import { formatCurrency, toPriceNumber } from '@/lib/utils';

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
  stock?: number;
  category?: string;
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
  stock = 0,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const normalizedPrice = toPriceNumber(price);
  const normalizedOriginalPrice = toPriceNumber(originalPrice);
  const galleryImages = Array.from(new Set([...(images || []), image].filter(Boolean) as string[]));
  const primaryImage = galleryImages[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variantId) return;
    addItem({
      variantId,
      productId: id,
      productName: name,
      variantInfo: brand || '',
      price: normalizedPrice,
      image: primaryImage,
      stock,
    });
    toast.success('Sepete eklendi!', { description: name });
  };

  return (
    <div className="h-full">
      <Link to={`/product/${slug}`} className="block h-full">
        <Card className="group flex h-full flex-col overflow-hidden border bg-card transition-shadow hover:shadow-lg">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {galleryImages.length > 0 ? (
              <>
                <div className="h-full w-full snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                  <div className="grid h-full grid-flow-col auto-cols-[100%]">
                    {galleryImages.map((galleryImage, index) => (
                      <div key={`${id}-image-${index}`} className="h-full w-full snap-start">
                        <img
                          src={galleryImage}
                          alt={`${name} - ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {galleryImages.length > 1 && (
                  <Badge className="absolute bottom-2 right-2 bg-background/85 text-foreground hover:bg-background/85">
                    {galleryImages.length} foto
                  </Badge>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 opacity-20" />
              </div>
            )}
            {normalizedOriginalPrice > normalizedPrice && (
              <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">
                %{Math.round(((normalizedOriginalPrice - normalizedPrice) / normalizedOriginalPrice) * 100)} İndirim
              </Badge>
            )}
            {stock !== undefined && stock <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Badge variant="secondary">Tukendi</Badge>
              </div>
            )}
          </div>
          <CardContent className="flex h-full flex-col p-4">
            {brand && <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{brand}</p>}
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{name}</h3>
            {description ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{description}</p> : null}
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-lg font-bold text-primary">{formatCurrency(normalizedPrice)}</span>
                {normalizedOriginalPrice > normalizedPrice && (
                  <span className="text-xs text-muted-foreground line-through">{formatCurrency(normalizedOriginalPrice)}</span>
                )}
              </div>
              {variantId && stock > 0 && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 shrink-0 rounded-full opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
