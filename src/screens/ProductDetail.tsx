"use client";

import { useEffect, useState } from 'react';
import { useParams } from '@/lib/router';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/integrations/mongo/client';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingCart, Minus, Plus, Check, Truck, RefreshCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <div className="container py-6 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <div className="space-y-3 lg:sticky lg:top-24">
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="h-full w-full object-contain p-4" />
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
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-colors sm:h-20 sm:w-20 ${
                      index === activeImageIndex ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0">
            {product.brand && (
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</p>
            )}
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">{product.name}</h1>
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
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex w-full items-center justify-center gap-2 rounded-lg border px-2 sm:w-auto sm:justify-start">
                  <Button variant="ghost" size="icon" className="h-[42px] w-[42px]" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-[42px] w-[42px]" onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="lg" className="h-[42px] w-full sm:flex-1" onClick={handleAdd}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Sepete Ekle
                </Button>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-border/50">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                  <TabsTrigger value="description">Ürün Açıklaması</TabsTrigger>
                  <TabsTrigger value="delivery">Teslimat ve İade</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-6 space-y-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                    {product.description ? (
                      <p>{product.description}</p>
                    ) : (
                      <p>Bu ürün için henüz detaylı bir açıklama girilmemiş.</p>
                    )}
                  </div>
                  
                  <div className="rounded-xl border border-border/70 bg-secondary/20 p-5">
                    <h4 className="font-semibold text-foreground mb-4">Öne Çıkan Özellikler</h4>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        %100 Orijinal Ürün Garantisi
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        2 Yıl Resmi Distribütör Garantili
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        Aynı Gün Hızlı Kargo İmkanı
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        Güvenli Paketleme
                      </li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="delivery" className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col items-center text-center gap-3 p-5 rounded-xl border border-border/70 bg-card">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Hızlı Kargo</h4>
                        <p className="text-xs text-muted-foreground mt-1">Aynı gün kargoya teslim</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center text-center gap-3 p-5 rounded-xl border border-border/70 bg-card">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                        <RefreshCcw className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Kolay İade</h4>
                        <p className="text-xs text-muted-foreground mt-1">14 gün içinde koşulsuz iade</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center text-center gap-3 p-5 rounded-xl border border-border/70 bg-card">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Güvenli İşlem</h4>
                        <p className="text-xs text-muted-foreground mt-1">256-bit SSL koruması</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm leading-relaxed text-muted-foreground pt-4 border-t border-border/50">
                    <p>
                      Siparişleriniz güvenle paketlenerek en hızlı şekilde size ulaştırılır. Hafta içi saat 15:00'a kadar verilen siparişler aynı gün kargoya teslim edilir. Cumartesi veya Pazar günleri verilen siparişler, pazartesi günü kargoya verilir.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
