"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/mongo/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteMediaUrls, diffRemovedMediaUrls } from "@/lib/admin-media";
import { getVariantLabel, normalizeProductVariants, type ProductVariantRecord } from "@/lib/product-variants";
import type { ProductSpecs } from "@/lib/product-specs";

type ProductType = "phone" | "accessory" | "service";

type ProductVariantForm = {
  id?: string;
  color_name: string;
  color_code: string;
  storage: string;
  ram: string;
  sku: string;
  price: string;
  compare_at_price: string;
  stock: string;
  images: string[];
  is_active: boolean;
  barcode: string;
  sort_order: number;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  brand: string;
  type: ProductType;
  category_id: string;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  specs: ProductSpecs;
  variants: ProductVariantForm[];
};

type AdminCategory = {
  id: string;
  name: string;
};

type AdminProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  type: ProductType;
  category_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  specs?: ProductSpecs | null;
  product_variants: ProductVariantRecord[];
  categories?: { name?: string } | null;
};

const createEmptyVariant = (sortOrder = 0): ProductVariantForm => ({
  color_name: "",
  color_code: "",
  storage: "",
  ram: "",
  sku: "",
  price: "",
  compare_at_price: "",
  stock: "0",
  images: [],
  is_active: true,
  barcode: "",
  sort_order: sortOrder,
});

const defaultForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  type: "accessory",
  category_id: "",
  is_featured: false,
  is_active: true,
  images: [],
  specs: {
    operatingSystem: "",
    internalStorage: "",
    ram: "",
    frontCamera: "",
    rearCamera: "",
  },
  variants: [createEmptyVariant(0)],
};

function mapVariantToForm(variant: ProductVariantRecord, index: number): ProductVariantForm {
  return {
    id: variant.id,
    color_name: variant.color_name,
    color_code: variant.color_code ?? "",
    storage: variant.storage,
    ram: variant.ram ?? "",
    sku: variant.sku,
    price: variant.price ? `${variant.price}` : "",
    compare_at_price: variant.compare_at_price ? `${variant.compare_at_price}` : "",
    stock: `${variant.stock}`,
    images: Array.isArray(variant.images) ? variant.images : [],
    is_active: variant.is_active,
    barcode: variant.barcode ?? "",
    sort_order: Number.isFinite(variant.sort_order) ? variant.sort_order : index,
  };
}

function mapProductToForm(product: AdminProductRecord): ProductForm {
  const variants = normalizeProductVariants(product.product_variants || []);

  return {
    name: product.name,
    slug: product.slug,
    description: product.description || "",
    brand: product.brand || "",
    type: product.type,
    category_id: product.category_id || "",
    is_featured: Boolean(product.is_featured),
    is_active: Boolean(product.is_active),
    images: Array.isArray(product.images) ? product.images : [],
    specs: {
      operatingSystem: product.specs?.operatingSystem || "",
      internalStorage: product.specs?.internalStorage || "",
      ram: product.specs?.ram || "",
      frontCamera: product.specs?.frontCamera || "",
      rearCamera: product.specs?.rearCamera || "",
    },
    variants: variants.length > 0 ? variants.map((variant, index) => mapVariantToForm(variant, index)) : [createEmptyVariant(0)],
  };
}

function getProductMediaUrls(product: AdminProductRecord | null) {
  if (!product) {
    return [];
  }

  return [
    ...(Array.isArray(product.images) ? product.images : []),
    ...normalizeProductVariants(product.product_variants || []).flatMap((variant) => variant.images),
  ];
}

function getFormMediaUrls(form: ProductForm) {
  return [...form.images, ...form.variants.flatMap((variant) => variant.images)];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductRecord | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [form, setForm] = useState<ProductForm>(defaultForm);

  const fetchProducts = async () => {
    const { data, error } = await db.from("products").select("*, product_variants(*), categories(name)").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }

    const nextProducts = ((data || []) as AdminProductRecord[]).map((product) => ({
      ...product,
      images: Array.isArray(product.images) ? product.images : [],
      product_variants: normalizeProductVariants(product.product_variants || []),
    }));
    setProducts(nextProducts);
  };

  useEffect(() => {
    fetchProducts();
    db.from("categories")
      .select("*")
      .then(({ data }) => setCategories((data || []) as AdminCategory[]));
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
  };

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", "image");
    body.append("scope", "products");

    const response = await fetch("/api/upload", {
      method: "POST",
      body,
    });

    const payload = await response.json();

    if (!response.ok || payload?.error) {
      throw new Error(payload?.error?.message || "Foto yuklenemedi");
    }

    const url = payload?.data?.url;
    if (!url) {
      throw new Error("Yukleme tamamlandi ama URL donmedi");
    }

    return `${url}`;
  };

  const handleImageFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    try {
      setUploadingImages(true);
      const uploadedUrls = await Promise.all(files.map((file) => uploadImage(file)));
      setForm((current) => ({
        ...current,
        images: Array.from(new Set([...current.images, ...uploadedUrls])),
      }));
      toast.success(`${uploadedUrls.length} foto yuklendi`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Foto yukleme hatasi");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleVariantImageFilesChange = async (variantIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    try {
      setUploadingImages(true);
      const uploadedUrls = await Promise.all(files.map((file) => uploadImage(file)));
      setForm((current) => ({
        ...current,
        variants: current.variants.map((variant, index) =>
          index === variantIndex
            ? {
                ...variant,
                images: Array.from(new Set([...variant.images, ...uploadedUrls])),
              }
            : variant
        ),
      }));
      toast.success(`${uploadedUrls.length} varyant fotosu yuklendi`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Foto yukleme hatasi");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((url) => url !== imageUrl),
    }));
  };

  const handleRemoveVariantImage = (variantIndex: number, imageUrl: string) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              images: variant.images.filter((url) => url !== imageUrl),
            }
          : variant
      ),
    }));
  };

  const handleVariantChange = (variantIndex: number, field: keyof ProductVariantForm, value: string | boolean | number) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      ),
    }));
  };

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, createEmptyVariant(current.variants.length)],
    }));
  };

  const removeVariant = (variantIndex: number) => {
    setForm((current) => {
      if (current.variants.length === 1) {
        toast.error("Urun icin en az bir varyant kalmali");
        return current;
      }

      return {
        ...current,
        variants: current.variants
          .filter((_, index) => index !== variantIndex)
          .map((variant, index) => ({
            ...variant,
            sort_order: index,
          })),
      };
    });
  };

  const handleSave = async () => {
    const payload = {
      productId: editing?.id ?? null,
      name: form.name,
      slug: form.slug,
      description: form.description,
      brand: form.brand,
      type: form.type,
      category_id: form.category_id || null,
      is_featured: form.is_featured,
      is_active: form.is_active,
      images: form.images,
      specs: {
        operatingSystem: form.specs.operatingSystem || null,
        internalStorage: form.specs.internalStorage || null,
        ram: form.specs.ram || null,
        frontCamera: form.specs.frontCamera || null,
        rearCamera: form.specs.rearCamera || null,
      },
      variants: form.variants.map((variant, index) => ({
        id: variant.id ?? null,
        color_name: variant.color_name,
        color_code: variant.color_code || null,
        storage: variant.storage,
        ram: variant.ram || null,
        sku: variant.sku,
        price: variant.price,
        compare_at_price: variant.compare_at_price || null,
        stock: variant.stock,
        images: variant.images,
        is_active: variant.is_active,
        barcode: variant.barcode || null,
        sort_order: index,
      })),
    };

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || result?.error) {
      toast.error(result?.error?.message || "Urun kaydedilemedi");
      return;
    }

    const removedImages = diffRemovedMediaUrls(getProductMediaUrls(editing), getFormMediaUrls(form));
    const removedVariantImages = Array.isArray(result?.data?.removedMediaUrls) ? result.data.removedMediaUrls : [];
    const cleanupTargets = Array.from(new Set([...removedImages, ...removedVariantImages]));

    if (cleanupTargets.length > 0) {
      try {
        await deleteMediaUrls(cleanupTargets);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Eski medya dosyalari silinemedi");
      }
    }

    toast.success(editing ? "Urun guncellendi" : "Urun eklendi");
    setDialogOpen(false);
    setEditing(null);
    resetForm();
    fetchProducts();
  };

  const handleEdit = (product: AdminProductRecord) => {
    setEditing(product);
    setForm(mapProductToForm(product));
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const product = products.find((item) => item.id === id) || null;
    const { error } = await db.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }

    const mediaUrls = getProductMediaUrls(product);
    if (mediaUrls.length > 0) {
      try {
        await deleteMediaUrls(mediaUrls);
      } catch (cleanupError) {
        toast.error(cleanupError instanceof Error ? cleanupError.message : "Urun medyasi silinemedi");
      }
    }

    toast.success("Urun silindi");
    fetchProducts();
  };

  const categoryIdSet = useMemo(() => new Set(categories.map((category) => category.id)), [categories]);

  const categoryFilters = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorizedCount = 0;

    products.forEach((product) => {
      const categoryId = product.category_id;
      if (!categoryId || !categoryIdSet.has(categoryId)) {
        uncategorizedCount += 1;
        return;
      }

      counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
    });

    const filters = categories.map((category) => ({
      id: category.id,
      name: category.name,
      count: counts.get(category.id) || 0,
    }));

    if (uncategorizedCount > 0) {
      filters.push({ id: "uncategorized", name: "Kategorisiz", count: uncategorizedCount });
    }

    return filters;
  }, [products, categories, categoryIdSet]);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === "all") {
      return products;
    }

    if (activeCategoryId === "uncategorized") {
      return products.filter((product) => !product.category_id || !categoryIdSet.has(product.category_id));
    }

    return products.filter((product) => product.category_id === activeCategoryId);
  }, [activeCategoryId, products, categoryIdSet]);

  const activeCategoryLabel = useMemo(() => {
    if (activeCategoryId === "all") return "Tum Kategoriler";
    if (activeCategoryId === "uncategorized") return "Kategorisiz";
    return categoryFilters.find((category) => category.id === activeCategoryId)?.name || "Kategori";
  }, [activeCategoryId, categoryFilters]);

  useEffect(() => {
    if (activeCategoryId === "all") return;
    const exists = categoryFilters.some((category) => category.id === activeCategoryId);
    if (!exists) {
      setActiveCategoryId("all");
    }
  }, [activeCategoryId, categoryFilters]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Urunler</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Urun Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Urun Duzenle" : "Yeni Urun"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Urun Adi</Label>
                  <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="Bos birakilirsa isimden uretilir"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Marka</Label>
                  <Input value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tur</Label>
                  <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value as ProductType }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Telefon</SelectItem>
                      <SelectItem value="accessory">Aksesuar</SelectItem>
                      <SelectItem value="service">Servis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={form.category_id || "none"}
                    onValueChange={(value) => setForm((current) => ({ ...current, category_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Secin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kategorisiz</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ana Sayfada Goster</Label>
                  <Select value={form.is_featured ? "true" : "false"} onValueChange={(value) => setForm((current) => ({ ...current, is_featured: value === "true" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">One Cikan</SelectItem>
                      <SelectItem value="false">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Yayin Durumu</Label>
                  <Select value={form.is_active ? "true" : "false"} onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === "true" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Urun Fotograflari</Label>
                <Input type="file" accept="image/*" multiple onChange={handleImageFilesChange} disabled={uploadingImages} />
                <p className="text-xs text-muted-foreground">
                  {uploadingImages ? "Fotograflar yukleniyor..." : "Bu galerideki gorseller varyantta gorsel yoksa fallback olarak kullanilir."}
                </p>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {form.images.map((imageUrl) => (
                      <div key={imageUrl} className="relative overflow-hidden rounded-md border">
                        <img src={imageUrl} alt="Urun fotografi" className="h-20 w-full object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute right-1 top-1 h-6 w-6" onClick={() => handleRemoveImage(imageUrl)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Aciklama</Label>
                <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">Urun Ozellikleri</h3>
                  <p className="text-xs text-muted-foreground">Kartta gosterilecek teknik ozellikleri buradan girebilirsiniz.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Isletim Sistemi</Label>
                    <Input
                      value={form.specs.operatingSystem || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specs: { ...current.specs, operatingSystem: event.target.value },
                        }))
                      }
                      placeholder="iOS 18"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Dahili Hafiza</Label>
                    <Input
                      value={form.specs.internalStorage || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specs: { ...current.specs, internalStorage: event.target.value },
                        }))
                      }
                      placeholder="256 GB"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">RAM Kapasitesi</Label>
                    <Input
                      value={form.specs.ram || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specs: { ...current.specs, ram: event.target.value },
                        }))
                      }
                      placeholder="8 GB"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">On (Selfie) Kamera</Label>
                    <Input
                      value={form.specs.frontCamera || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specs: { ...current.specs, frontCamera: event.target.value },
                        }))
                      }
                      placeholder="12 MP"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arka Kamera</Label>
                    <Input
                      value={form.specs.rearCamera || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specs: { ...current.specs, rearCamera: event.target.value },
                        }))
                      }
                      placeholder="48 MP + 12 MP"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Varyantlar</h3>
                    <p className="text-xs text-muted-foreground">Renk, depolama, RAM, fiyat, stok ve gorselleri varyant bazli yonetin.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-1 h-4 w-4" /> Varyant Ekle
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.variants.map((variant, variantIndex) => (
                    <Card key={variant.id || `new-variant-${variantIndex}`} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{variant.color_name || "Yeni varyant"}</p>
                          <p className="text-xs text-muted-foreground">{variant.sku || `Varyant #${variantIndex + 1}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={variant.is_active ? "default" : "secondary"}>{variant.is_active ? "Aktif" : "Pasif"}</Badge>
                          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeVariant(variantIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Renk Adi</Label>
                          <Input value={variant.color_name} onChange={(event) => handleVariantChange(variantIndex, "color_name", event.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Depolama</Label>
                          <Input value={variant.storage} onChange={(event) => handleVariantChange(variantIndex, "storage", event.target.value)} placeholder="128 GB" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">RAM</Label>
                          <Input value={variant.ram} onChange={(event) => handleVariantChange(variantIndex, "ram", event.target.value)} placeholder="8 GB" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">SKU</Label>
                          <Input value={variant.sku} onChange={(event) => handleVariantChange(variantIndex, "sku", event.target.value)} />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="space-y-1">
                          <Label className="text-xs">Fiyat (TL)</Label>
                          <Input type="number" min="0" step="0.01" value={variant.price} onChange={(event) => handleVariantChange(variantIndex, "price", event.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Indirimli Fiyat</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.compare_at_price}
                            onChange={(event) => handleVariantChange(variantIndex, "compare_at_price", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Stok</Label>
                          <Input type="number" min="0" step="1" value={variant.stock} onChange={(event) => handleVariantChange(variantIndex, "stock", event.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Barcode</Label>
                          <Input value={variant.barcode} onChange={(event) => handleVariantChange(variantIndex, "barcode", event.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Durum</Label>
                          <Select value={variant.is_active ? "true" : "false"} onValueChange={(value) => handleVariantChange(variantIndex, "is_active", value === "true")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Aktif</SelectItem>
                              <SelectItem value="false">Pasif</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                        <div className="space-y-1">
                          <Label className="text-xs">Renk Kodu</Label>
                          <div className="flex gap-2">
                            <Input type="color" value={variant.color_code || "#000000"} onChange={(event) => handleVariantChange(variantIndex, "color_code", event.target.value)} className="h-10 w-14 p-1" />
                            <Input value={variant.color_code} onChange={(event) => handleVariantChange(variantIndex, "color_code", event.target.value)} placeholder="#000000" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Varyant Gorselleri</Label>
                          <Input type="file" accept="image/*" multiple onChange={(event) => handleVariantImageFilesChange(variantIndex, event)} disabled={uploadingImages} />
                          {variant.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {variant.images.map((imageUrl) => (
                                <div key={imageUrl} className="relative overflow-hidden rounded-md border">
                                  <img src={imageUrl} alt="Varyant fotografi" className="h-20 w-full object-cover" />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute right-1 top-1 h-6 w-6"
                                    onClick={() => handleRemoveVariantImage(variantIndex, imageUrl)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleSave}>
                {editing ? "Guncelle" : "Kaydet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" variant={activeCategoryId === "all" ? "default" : "outline"} onClick={() => setActiveCategoryId("all")}>
          Tumu
          <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{products.length}</span>
        </Button>
        {categoryFilters.map((category) => (
          <Button key={category.id} size="sm" variant={activeCategoryId === category.id ? "default" : "outline"} onClick={() => setActiveCategoryId(category.id)}>
            {category.name}
            <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{category.count}</span>
          </Button>
        ))}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {activeCategoryLabel}: {filteredProducts.length} urun
      </div>

      <Card className="mt-6 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Urun</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Varyantlar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>One Cikan</TableHead>
              <TableHead className="text-right">Islem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                </TableCell>
                <TableCell>{product.categories?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{product.product_variants.length} varyant</p>
                    <div className="flex flex-wrap gap-1">
                      {product.product_variants.slice(0, 3).map((variant) => (
                        <Badge key={variant.id || variant.sku} variant="outline" className="max-w-[180px] truncate">
                          {getVariantLabel(variant)}
                        </Badge>
                      ))}
                      {product.product_variants.length > 3 && <Badge variant="outline">+{product.product_variants.length - 3}</Badge>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>{product.is_active ? "Aktif" : "Pasif"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_featured ? "default" : "secondary"}>{product.is_featured ? "Evet" : "Hayir"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Bu kategoride urun yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
