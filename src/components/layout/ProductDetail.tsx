"use client";

import { useEffect, useState } from 'react';
import { useParams } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/integrations/mongo/client';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingCart, Minus, Plus, Check, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, toPriceNumber } from '@/lib/utils';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await db
        .from('products')
        .select('*, product_variants(*), categories(name, slug)')
        .eq('slug', slug)
        .single();

      if (data) {
        setProduct(data);
        const activeVariants = (data.product_variants || []).filter((variant: any) => variant.is_active);
        setVariants(activeVariants);
        if (activeVariants.length > 0) setSelectedVariant(activeVariants[0]);
        setActiveImageIndex(0);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  const handleAdd = () => {
    if (!selectedVariant) return;

    for (let index = 0; index < quantity; index += 1) {
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        variantInfo: JSON.stringify(selectedVariant.attributes || {}),
        price: toPriceNumber(selectedVariant.price),
        image: product.images?.[0],
        stock: selectedVariant.stock,
      });
    }

    toast.success(`${quantity} adet sepete eklendi!`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container flex items-center justify-center py-20">
          <p className="text-muted-foreground">Ürün bulunamadı.</p>
        </div>
      </Layout>
    );
  }

  const galleryImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const selectedImage = galleryImages[activeImageIndex] ?? galleryImages[0];

  return (
    <Layout>
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 opacity-20" />
                </div>
              )}
              {galleryImages.length > 1 && (
                <Badge variant="secondary" className="absolute bottom-3 right-3">
                  {activeImageIndex + 1}/{galleryImages.length}
                </Badge>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((image: string, index: number) => (
                  <button
                    key={`${product.id}-thumb-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                      index === activeImageIndex ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.brand && (
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</p>
            )}
            <h1 className="mt-1 font-display text-3xl font-bold">{product.name}</h1>
            {product.categories && (
              <Badge variant="secondary" className="mt-2">{product.categories.name}</Badge>
            )}

            {selectedVariant && (
              <div className="mt-6">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(selectedVariant.price)}
                </span>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  {selectedVariant.stock > 0 ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      <span>Stokta ({selectedVariant.stock} adet)</span>
                    </>
                  ) : (
                    <span className="text-destructive">Stokta yok</span>
                  )}
                </div>
              </div>
            )}

            {variants.length > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold">Varyantlar</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const attrs = variant.attributes as Record<string, string> | null;
                    const label = attrs ? Object.values(attrs).join(' / ') : variant.sku;

                    return (
                      <Button
                        key={variant.id}
                        variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedVariant && selectedVariant.stock > 0 && (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg border px-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="lg" className="flex-1" onClick={handleAdd}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Sepete Ekle
                </Button>
              </div>
            )}

            {product.description && (
              <div className="mt-8 space-y-2">
                <h3 className="font-display font-semibold">Açıklama</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              <span>Siparişleriniz aynı gün kargoya teslim edilir.</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
