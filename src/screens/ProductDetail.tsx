"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/integrations/mongo/client";
import { useCartStore } from "@/lib/cart-store";
import { ShoppingCart, Minus, Plus, Check, Truck, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, toPriceNumber } from "@/lib/utils";
import {
  findProductVariantBySelection,
  getDefaultProductVariant,
  getRamOptions,
  getStorageOptions,
  getVariantGallery,
  getVariantLabel,
  getVariantSwatches,
  normalizeProductVariants,
  type ProductVariantRecord,
} from "@/lib/product-variants";

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  description?: string | null;
  images: string[];
  categories?: { name?: string; slug?: string } | null;
  product_variants: ProductVariantRecord[];
};

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await db.from("products").select("*, product_variants(*), categories(name, slug)").eq("slug", slug).single();

      if (data) {
        const nextProduct = {
          ...(data as ProductRecord),
          images: Array.isArray(data.images) ? data.images : [],
          product_variants: normalizeProductVariants(data.product_variants || []),
        };
        const nextVariants = nextProduct.product_variants;
        const initialVariant =
          findProductVariantBySelection(nextVariants, initialSelection) || getDefaultProductVariant(nextVariants);

        setProduct(nextProduct);
        setVariants(nextVariants);
        setSelectedVariantId(initialVariant?.id || null);
        setActiveImageIndex(0);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [initialSelection, slug]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) || getDefaultProductVariant(variants) || null,
    [selectedVariantId, variants]
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

  const galleryImages = useMemo(() => getVariantGallery(selectedVariant, product?.images || []), [product?.images, selectedVariant]);
  const selectedImage = galleryImages[activeImageIndex] ?? galleryImages[0];
  const swatches = useMemo(() => getVariantSwatches(variants), [variants]);
  const storageOptions = useMemo(() => getStorageOptions(variants, selectedVariant?.color_name), [selectedVariant?.color_name, variants]);
  const ramOptions = useMemo(() => getRamOptions(variants, selectedVariant?.color_name, selectedVariant?.storage), [selectedVariant?.color_name, selectedVariant?.storage, variants]);

  const selectVariant = (variant: ProductVariantRecord | null) => {
    setSelectedVariantId(variant?.id || null);
    setQuantity(1);
    setActiveImageIndex(0);
  };

  const handleColorSelect = (colorName: string) => {
    const nextVariant =
      findProductVariantBySelection(variants, {
        colorName,
        storage: selectedVariant?.storage,
        ram: selectedVariant?.ram,
      }) ||
      findProductVariantBySelection(variants, {
        colorName,
        storage: selectedVariant?.storage,
      }) ||
      findProductVariantBySelection(variants, { colorName });

    selectVariant(nextVariant);
  };

  const handleStorageSelect = (storage: string) => {
    const nextVariant =
      findProductVariantBySelection(variants, {
        colorName: selectedVariant?.color_name,
        storage,
        ram: selectedVariant?.ram,
      }) ||
      findProductVariantBySelection(variants, {
        colorName: selectedVariant?.color_name,
        storage,
      });

    selectVariant(nextVariant);
  };

  const handleRamSelect = (ram: string) => {
    const normalizedRam = ram === "Standart" ? null : ram;
    const nextVariant = findProductVariantBySelection(variants, {
      colorName: selectedVariant?.color_name,
      storage: selectedVariant?.storage,
      ram: normalizedRam,
    });

    selectVariant(nextVariant);
  };

  const handleAdd = () => {
    if (!product || !selectedVariant) {
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
          <p className="text-muted-foreground">Urun bulunamadi.</p>
        </div>
      </Layout>
    );
  }

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
                {galleryImages.map((image, index) => (
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
            {product.brand && <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</p>}
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">{product.name}</h1>
            {product.categories?.name && (
              <Badge variant="secondary" className="mt-2">
                {product.categories.name}
              </Badge>
            )}

            {selectedVariant ? (
              <>
                <div className="mt-6">
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-primary">{formatCurrency(selectedVariant.price)}</span>
                    {selectedVariant.compare_at_price && (
                      <span className="pb-1 text-sm text-muted-foreground line-through">{formatCurrency(selectedVariant.compare_at_price)}</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    {selectedVariant.stock > 0 ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        <span>Stokta ({selectedVariant.stock} adet)</span>
                      </>
                    ) : (
                      <span className="text-destructive">Tukendi</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Secilen varyant: {getVariantLabel(selectedVariant)}</p>
                </div>

                {swatches.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold">Renk</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {swatches.map((swatch) => (
                        <button
                          key={swatch.label}
                          type="button"
                          onClick={() => handleColorSelect(swatch.label)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                            selectedVariant.color_name === swatch.label ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"
                          }`}
                        >
                          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: swatch.colorCode || "#E5E7EB" }} />
                          {swatch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {storageOptions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold">Depolama</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {storageOptions.map((option) => (
                        <Button key={option.value} variant={selectedVariant.storage === option.value ? "default" : "outline"} size="sm" onClick={() => handleStorageSelect(option.value)}>
                          {option.value}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {ramOptions.length > 1 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold">RAM</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ramOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={(selectedVariant.ram || "Standart") === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRamSelect(option.value)}
                        >
                          {option.value}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex w-full items-center justify-center gap-2 rounded-lg border px-2 sm:w-auto sm:justify-start">
                    <Button variant="ghost" size="icon" className="h-[42px] w-[42px]" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={selectedVariant.stock <= 0}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-[42px] w-[42px]"
                      onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                      disabled={selectedVariant.stock <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="lg" className="h-[42px] w-full sm:flex-1" onClick={handleAdd} disabled={selectedVariant.stock <= 0}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {selectedVariant.stock > 0 ? "Sepete Ekle" : "Tukendi"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-muted-foreground">
                Bu urun icin aktif varyant bulunamadi.
              </div>
            )}

            <div className="mt-10 border-t border-border/50 pt-6">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                  <TabsTrigger value="description">Urun Aciklamasi</TabsTrigger>
                  <TabsTrigger value="delivery">Teslimat ve Iade</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6 space-y-6">
                  <div className="prose prose-sm max-w-none leading-relaxed text-muted-foreground dark:prose-invert">
                    {product.description ? <p>{product.description}</p> : <p>Bu urun icin henuz detayli bir aciklama girilmemis.</p>}
                  </div>

                  <div className="rounded-xl border border-border/70 bg-secondary/20 p-5">
                    <h4 className="mb-4 font-semibold text-foreground">One Cikan Ozellikler</h4>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        %100 Orijinal Urun Garantisi
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        2 Yil Resmi Distributor Garantili
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        Ayni Gun Hizli Kargo Imkani
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        Guvenli Paketleme
                      </li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="delivery" className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/70 bg-card p-5 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Hizli Kargo</h4>
                        <p className="mt-1 text-xs text-muted-foreground">Ayni gun kargoya teslim</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/70 bg-card p-5 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <RefreshCcw className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Kolay Iade</h4>
                        <p className="mt-1 text-xs text-muted-foreground">14 gun icinde kosulsuz iade</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/70 bg-card p-5 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Guvenli Islem</h4>
                        <p className="mt-1 text-xs text-muted-foreground">256-bit SSL korumasi</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 text-sm leading-relaxed text-muted-foreground">
                    <p>
                      Siparisleriniz guvenle paketlenerek en hizli sekilde size ulastirilir. Hafta ici saat 15:00'a kadar verilen siparisler ayni gun
                      kargoya teslim edilir.
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
