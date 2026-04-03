"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/mongo/client";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsToolbar } from "@/components/admin/BulkActionsToolbar";
import { deleteMediaUrls, diffRemovedMediaUrls } from "@/lib/admin-media";
import { sanitizeSlug } from "@/lib/utils";
import { getProductVariantAxes, type VariantAxisDefinition } from "@/lib/product-variant-config";
import { getVariantLabel, normalizeProductVariants, type ProductVariantRecord } from "@/lib/product-variants";
import type { ProductSpecs } from "@/lib/product-specs";
import { useBulkProductActions } from "@/hooks/use-admin";
import {
  SECOND_HAND_CHECK_OPTIONS,
  SECOND_HAND_CONDITION_OPTIONS,
  SECOND_HAND_WARRANTY_OPTIONS,
  type SecondHandCheckStatus,
  type SecondHandCondition,
  type SecondHandDetails,
  type SecondHandWarrantyType,
} from "@/lib/second-hand";

type ProductType = "phone" | "accessory" | "service";

type ProductVariantForm = {
  id?: string;
  color_name: string;
  color_code: string;
  storage: string;
  ram: string;
  attributes: Record<string, string>;
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
  subcategory_id: string;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  specs: ProductSpecs;
  second_hand: {
    condition: SecondHandCondition | null;
    battery_health: string;
    warranty_type: SecondHandWarrantyType | null;
    warranty_remaining_months: string;
    includes_box: boolean;
    includes_invoice: boolean;
    included_accessories: string;
    face_id_status: SecondHandCheckStatus | null;
    true_tone_status: SecondHandCheckStatus | null;
    battery_changed: boolean | null;
    changed_parts: string;
    cosmetic_notes: string;
    inspection_summary: string;
    inspection_date: string;
    imei: string;
    serial_number: string;
  };
  variants: ProductVariantForm[];
};

type AdminCategory = {
  id: string;
  name: string;
  slug?: string;
  parent_category_id?: string | null;
};

type AdminProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  type: ProductType;
  category_id: string | null;
  subcategory_id?: string | null;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  specs?: ProductSpecs | null;
  second_hand?: SecondHandDetails | null;
  product_variants: ProductVariantRecord[];
  categories?: { name?: string } | null;
};

type AdminProductListItem = Omit<AdminProductRecord, "description" | "specs" | "second_hand"> & {
  description?: string;
  specs?: ProductSpecs | null;
  second_hand?: SecondHandDetails | null;
};

function mapSecondHandToForm(details?: SecondHandDetails | null): ProductForm["second_hand"] {
  const normalizedInspectionDate = details?.inspection_date ? new Date(details.inspection_date) : null;
  const inspectionDateValue =
    normalizedInspectionDate && !Number.isNaN(normalizedInspectionDate.getTime())
      ? normalizedInspectionDate.toISOString().slice(0, 10)
      : "";

  return {
    condition: details?.condition ?? null,
    battery_health: details?.battery_health != null ? `${details.battery_health}` : "",
    warranty_type: details?.warranty_type ?? null,
    warranty_remaining_months: details?.warranty_remaining_months != null ? `${details.warranty_remaining_months}` : "",
    includes_box: Boolean(details?.includes_box),
    includes_invoice: Boolean(details?.includes_invoice),
    included_accessories: details?.included_accessories?.join(", ") || "",
    face_id_status: details?.face_id_status ?? null,
    true_tone_status: details?.true_tone_status ?? null,
    battery_changed: details?.battery_changed ?? null,
    changed_parts: details?.changed_parts?.join(", ") || "",
    cosmetic_notes: details?.cosmetic_notes || "",
    inspection_summary: details?.inspection_summary || "",
    inspection_date: inspectionDateValue,
    imei: details?.imei || "",
    serial_number: details?.serial_number || "",
  };
}

function getVariantAxisFormValue(variant: ProductVariantForm, axis: VariantAxisDefinition) {
  if (axis.fieldKey === "color_name") {
    return variant.color_name;
  }

  if (axis.fieldKey === "storage") {
    return variant.storage;
  }

  if (axis.fieldKey === "ram") {
    return variant.ram;
  }

  return variant.attributes[axis.attributeKeys[0]] || "";
}

const createEmptyVariant = (sortOrder = 0): ProductVariantForm => ({
  color_name: "",
  color_code: "",
  storage: "",
  ram: "",
  attributes: {},
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
  subcategory_id: "",
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
  second_hand: mapSecondHandToForm(),
  variants: [createEmptyVariant(0)],
};

function mapVariantToForm(variant: ProductVariantRecord, index: number): ProductVariantForm {
  return {
    id: variant.id,
    color_name: variant.color_name,
    color_code: variant.color_code ?? "",
    storage: variant.storage,
    ram: variant.ram ?? "",
    attributes: Object.fromEntries(
      Object.entries(variant.attributes || {}).filter(([, value]) => typeof value === "string" && value.trim()),
    ),
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
    slug: sanitizeSlug(product.slug || product.name),
    description: product.description || "",
    brand: product.brand || "",
    type: product.type,
    category_id: product.category_id || "",
    subcategory_id: product.subcategory_id || "",
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
    second_hand: mapSecondHandToForm(product.second_hand),
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

function hasCustomSlug(name: string, slug: string) {
  return Boolean(slug) && slug !== sanitizeSlug(name);
}

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductRecord | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const bulkActions = useBulkProductActions();
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const topLevelCategories = useMemo(
    () => categories.filter((category) => !category.parent_category_id),
    [categories]
  );
  const selectedCategory = useMemo(
    () => topLevelCategories.find((category) => category.id === form.category_id) ?? null,
    [form.category_id, topLevelCategories]
  );
  const subcategories = useMemo(
    () => categories.filter((category) => category.parent_category_id === form.category_id),
    [categories, form.category_id]
  );
  const isSecondHandIphoneCategory = selectedCategory?.slug === "ikinci-el-telefon";
  const variantAxes = useMemo(() => getProductVariantAxes(selectedCategory?.slug), [selectedCategory?.slug]);

  const fetchProducts = async () => {
    const { data, error } = await db
      .from("products")
      .select("id, name, slug, brand, type, category_id, subcategory_id, is_featured, is_active, images, product_variants(id, sku, color_name, storage, ram, attributes, is_active, sort_order), categories(name)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }

    const nextProducts = ((data || []) as AdminProductListItem[]).map((product) => ({
      ...product,
      images: Array.isArray(product.images) ? product.images : [],
      product_variants: normalizeProductVariants(product.product_variants || []),
    }));
    setProducts(nextProducts);
  };

  const loadProductDetail = async (productId: string) => {
    const { data, error } = await db
      .from("products")
      .select("*, product_variants(*), categories(name)")
      .eq("id", productId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const product = data as AdminProductRecord | null;

    if (!product) {
      throw new Error("Urun bulunamadi");
    }

    return {
      ...product,
      images: Array.isArray(product.images) ? product.images : [],
      product_variants: normalizeProductVariants(product.product_variants || []),
    } satisfies AdminProductRecord;
  };

  useEffect(() => {
    fetchProducts();
    db.from("categories")
      .select("*")
      .then(({ data }) => setCategories((data || []) as AdminCategory[]));
  }, []);

  useEffect(() => {
    if (!isSecondHandIphoneCategory) {
      return;
    }

    setForm((current) => {
      if (current.brand === "Apple" && current.type === "phone") {
        return current;
      }

      return {
        ...current,
        brand: "Apple",
        type: "phone",
      };
    });
  }, [isSecondHandIphoneCategory]);

  useEffect(() => {
    if (!form.subcategory_id) {
      return;
    }

    const belongsToSelectedCategory = subcategories.some((category) => category.id === form.subcategory_id);

    if (!belongsToSelectedCategory) {
      setForm((current) => ({
        ...current,
        subcategory_id: "",
      }));
    }
  }, [form.subcategory_id, subcategories]);

  const resetForm = () => {
    setForm(defaultForm);
    setIsSlugManuallyEdited(false);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value;

    setForm((current) => {
      const shouldSyncSlug = !isSlugManuallyEdited || !current.slug || !hasCustomSlug(current.name, current.slug);

      return {
        ...current,
        name: nextName,
        slug: shouldSyncSlug ? sanitizeSlug(nextName) : current.slug,
      };
    });
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSlug = sanitizeSlug(event.currentTarget.value);
    event.currentTarget.value = nextSlug;
    setIsSlugManuallyEdited(hasCustomSlug(form.name, nextSlug));
    setForm((current) => ({
      ...current,
      slug: nextSlug,
    }));
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

  const handleVariantAxisValueChange = (variantIndex: number, axis: VariantAxisDefinition, value: string) => {
    if (axis.fieldKey === "color_name" || axis.fieldKey === "storage" || axis.fieldKey === "ram") {
      handleVariantChange(variantIndex, axis.fieldKey, value);
      return;
    }

    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              attributes: {
                ...variant.attributes,
                [axis.attributeKeys[0]]: value,
              },
            }
          : variant,
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
      slug: sanitizeSlug(form.slug || form.name),
      description: form.description,
      brand: form.brand,
      type: form.type,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
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
      second_hand: isSecondHandIphoneCategory
        ? {
            condition: form.second_hand.condition || null,
            battery_health: form.second_hand.battery_health || null,
            warranty_type: form.second_hand.warranty_type || null,
            warranty_remaining_months: form.second_hand.warranty_remaining_months || null,
            includes_box: form.second_hand.includes_box,
            includes_invoice: form.second_hand.includes_invoice,
            included_accessories: form.second_hand.included_accessories,
            face_id_status: form.second_hand.face_id_status || null,
            true_tone_status: form.second_hand.true_tone_status || null,
            battery_changed: form.second_hand.battery_changed,
            changed_parts: form.second_hand.changed_parts,
            cosmetic_notes: form.second_hand.cosmetic_notes || null,
            inspection_summary: form.second_hand.inspection_summary || null,
            inspection_date: form.second_hand.inspection_date || null,
            imei: form.second_hand.imei || null,
            serial_number: form.second_hand.serial_number || null,
          }
        : null,
      variants: form.variants.map((variant, index) => ({
        id: variant.id ?? null,
        color_name: variant.color_name,
        color_code: variant.color_code || null,
        storage: variant.storage,
        ram: variant.ram || null,
        attributes: Object.fromEntries(
          Object.entries(variant.attributes).filter(([, value]) => value.trim()),
        ),
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

  const handleEdit = async (productId: string) => {
    try {
      const product = await loadProductDetail(productId);
      const nextForm = mapProductToForm(product);
      setEditing(product);
      setForm(nextForm);
      setIsSlugManuallyEdited(hasCustomSlug(nextForm.name, nextForm.slug));
      setDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Urun detaylari yuklenemedi");
    }
  };

  const getProductCategoryLabel = (product: AdminProductListItem | AdminProductRecord) => {
    const mainCategoryName = product.categories?.name || categoryById.get(product.category_id || "")?.name || "Kategorisiz";
    const subcategoryName = product.subcategory_id ? categoryById.get(product.subcategory_id)?.name : null;

    return subcategoryName ? `${mainCategoryName} / ${subcategoryName}` : mainCategoryName;
  };

  const handleDelete = async (id: string) => {
    let product: AdminProductRecord | null = null;

    try {
      product = await loadProductDetail(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Urun detaylari yuklenemedi");
      return;
    }

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

  const categoryIdSet = useMemo(() => new Set(topLevelCategories.map((category) => category.id)), [topLevelCategories]);

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

    const filters = topLevelCategories.map((category) => ({
      id: category.id,
      name: category.name,
      count: counts.get(category.id) || 0,
    }));

    if (uncategorizedCount > 0) {
      filters.push({ id: "uncategorized", name: "Kategorisiz", count: uncategorizedCount });
    }

    return filters;
  }, [products, topLevelCategories, categoryIdSet]);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === "all") {
      return products;
    }

    if (activeCategoryId === "uncategorized") {
      return products.filter((product) => !product.category_id || !categoryIdSet.has(product.category_id));
    }

    return products.filter((product) => product.category_id === activeCategoryId);
  }, [activeCategoryId, products, categoryIdSet]);

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.includes(product.id));

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold">Urunler</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link to="/admin/import-export">Import / Export</Link>
          </Button>
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
              <Button className="w-full sm:w-auto">
                <Plus className="mr-1 h-4 w-4" /> Urun Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>{editing ? "Urun Duzenle" : "Yeni Urun"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Urun Adi</Label>
                  <Input value={form.name} onChange={handleNameChange} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={handleSlugChange}
                    placeholder="urun-slug-alani"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="url"
                  />
                  <p className="text-xs text-muted-foreground">Bosluk ve Turkce karakterler otomatik olarak duzeltilir.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Marka</Label>
                  <Input
                    value={form.brand}
                    disabled={isSecondHandIphoneCategory}
                    onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                  />
                  {isSecondHandIphoneCategory ? (
                    <p className="text-xs text-muted-foreground">2. El Telefonlar kategorisinde marka sabit olarak Apple kullanilir.</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Tur</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) => setForm((current) => ({ ...current, type: value as ProductType }))}
                    disabled={isSecondHandIphoneCategory}
                  >
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
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        category_id: value === "none" ? "" : value,
                        subcategory_id: "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Secin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kategorisiz</SelectItem>
                      {topLevelCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alt Kategori</Label>
                  <Select
                    value={form.subcategory_id || "none"}
                    onValueChange={(value) => setForm((current) => ({ ...current, subcategory_id: value === "none" ? "" : value }))}
                    disabled={!form.category_id || subcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={form.category_id ? "Secin" : "Once ana kategori secin"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Alt kategori yok</SelectItem>
                      {subcategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {subcategories.length > 0
                      ? "Secilen ana kategoriye bagli ikinci kategori secimi yapabilirsiniz."
                      : "Bu ana kategori icin tanimli alt kategori bulunmuyor."}
                  </p>
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
              
              <div className={"space-y-3 "+(form.type === "phone" ? "" : "hidden")}>
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

              {isSecondHandIphoneCategory ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">2. El Cihaz Bilgileri</h3>
                    <p className="text-xs text-muted-foreground">
                      Kondisyon, pil sagligi, garanti ve ekspertiz bilgileri listeleme ve urun detayinda gosterilir.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Kondisyon</Label>
                      <Select
                        value={form.second_hand.condition || "none"}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, condition: value === "none" ? null : (value as SecondHandCondition) },
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue placeholder="Secin" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Secin</SelectItem>
                          {SECOND_HAND_CONDITION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Pil Sagligi (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={form.second_hand.battery_health}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, battery_health: event.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Garanti Tipi</Label>
                      <Select
                        value={form.second_hand.warranty_type || "none-selected"}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: {
                              ...current.second_hand,
                              warranty_type: value === "none-selected" ? null : (value as SecondHandWarrantyType),
                            },
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue placeholder="Secin" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none-selected">Secin</SelectItem>
                          {SECOND_HAND_WARRANTY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Kalan Garanti (Ay)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.second_hand.warranty_remaining_months}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, warranty_remaining_months: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Face ID</Label>
                      <Select
                        value={form.second_hand.face_id_status || "none"}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, face_id_status: value === "none" ? null : (value as SecondHandCheckStatus) },
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue placeholder="Secin" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Secin</SelectItem>
                          {SECOND_HAND_CHECK_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>True Tone</Label>
                      <Select
                        value={form.second_hand.true_tone_status || "none"}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, true_tone_status: value === "none" ? null : (value as SecondHandCheckStatus) },
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue placeholder="Secin" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Secin</SelectItem>
                          {SECOND_HAND_CHECK_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Batarya Degisimi</Label>
                      <Select
                        value={
                          form.second_hand.battery_changed == null ? "unknown" : form.second_hand.battery_changed ? "yes" : "no"
                        }
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: {
                              ...current.second_hand,
                              battery_changed: value === "unknown" ? null : value === "yes",
                            },
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Belirtilmedi</SelectItem>
                          <SelectItem value="yes">Degismis</SelectItem>
                          <SelectItem value="no">Orijinal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Dahil Aksesuarlar</Label>
                      <Input
                        placeholder="Kutusu, Sarj Kablosu, Adapter"
                        value={form.second_hand.included_accessories}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, included_accessories: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degisen Parcalar</Label>
                      <Input
                        placeholder="Batarya, ekran, kamera"
                        value={form.second_hand.changed_parts}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, changed_parts: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>IMEI / Seri Takibi</Label>
                      <Input
                        placeholder="IMEI veya takip kodu"
                        value={form.second_hand.imei}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, imei: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Seri Numarasi</Label>
                      <Input
                        placeholder="Seri numarasi"
                        value={form.second_hand.serial_number}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, serial_number: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-sm">
                      <Checkbox
                        checked={form.second_hand.includes_box}
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, includes_box: checked === true },
                          }))
                        }
                      />
                      Kutusu Var
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-sm">
                      <Checkbox
                        checked={form.second_hand.includes_invoice}
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, includes_invoice: checked === true },
                          }))
                        }
                      />
                      Faturasi Var
                    </label>
                    <div className="space-y-2">
                      <Label>Son Kontrol Tarihi</Label>
                      <Input
                        type="date"
                        value={form.second_hand.inspection_date}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            second_hand: { ...current.second_hand, inspection_date: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Kozmetik Durum Notu</Label>
                    <Textarea
                      value={form.second_hand.cosmetic_notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          second_hand: { ...current.second_hand, cosmetic_notes: event.target.value },
                        }))
                      }
                      placeholder="Ekran, kasa, cerceve ve kamera cevresi hakkinda kisa durum notu"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ekspertiz Ozeti</Label>
                    <Textarea
                      value={form.second_hand.inspection_summary}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          second_hand: { ...current.second_hand, inspection_summary: event.target.value },
                        }))
                      }
                      placeholder="Cihaz kontrol sonucu, onemli avantajlar ve guven notlari"
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Modeller</h3>
                    <p className="text-xs text-muted-foreground">
                      {variantAxes.map((axis) => axis.label).join(", ") || "Temel model bilgileri"} bazli secenekleri fiyat, stok ve gorsellerle birlikte yonetin.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={addVariant}>
                    <Plus className="mr-1 h-4 w-4" /> Model Ekle
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.variants.map((variant, variantIndex) => (
                    <Card key={variant.id || `new-variant-${variantIndex}`} className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">
                            {getVariantLabel({
                              color_name: variant.color_name,
                              storage: variant.storage,
                              ram: variant.ram,
                              attributes: variant.attributes,
                              sku: variant.sku,
                            }) || "Yeni model"}
                          </p>
                          <p className="text-xs text-muted-foreground">{variant.sku || `Model #${variantIndex + 1}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={variant.is_active ? "default" : "secondary"}>{variant.is_active ? "Aktif" : "Pasif"}</Badge>
                          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeVariant(variantIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {variantAxes.map((axis) => (
                          <div key={`${variantIndex}-${axis.id}`} className="space-y-1">
                            <Label className="text-xs">
                              {axis.label}
                              {axis.required ? " *" : ""}
                            </Label>
                            <Input
                              value={getVariantAxisFormValue(variant, axis)}
                              onChange={(event) => handleVariantAxisValueChange(variantIndex, axis, event.target.value)}
                              placeholder={axis.placeholder}
                            />
                          </div>
                        ))}
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

                      <div className={`mt-3 grid gap-3 ${variantAxes.some((axis) => axis.id === "color_name") ? "md:grid-cols-[120px_minmax(0,1fr)]" : "md:grid-cols-1"}`}>
                        {variantAxes.some((axis) => axis.id === "color_name") ? (
                          <div className="space-y-1">
                            <Label className="text-xs">Renk Kodu</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={variant.color_code || "#000000"} onChange={(event) => handleVariantChange(variantIndex, "color_code", event.target.value)} className="h-10 w-14 p-1" />
                              <Input value={variant.color_code} onChange={(event) => handleVariantChange(variantIndex, "color_code", event.target.value)} placeholder="#000000" />
                            </div>
                          </div>
                        ) : null}
                        <div className="space-y-2">
                          <Label className="text-xs">Model Gorselleri</Label>
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

      <BulkActionsToolbar
        selectedCount={selectedProductIds.length}
        onApply={async (payload) => {
          try {
            const result = await bulkActions.mutateAsync({
              productIds: selectedProductIds,
              action: payload.action,
              value: payload.value,
            });
            toast.success(result.message);
            setSelectedProductIds([]);
            fetchProducts();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Toplu islem tamamlanamadi");
          }
        }}
      />

      <div className="mt-6 space-y-3 md:hidden">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedProductIds.includes(product.id)}
                    onCheckedChange={(checked) =>
                      setSelectedProductIds((current) =>
                        checked ? Array.from(new Set([...current, product.id])) : current.filter((id) => id !== product.id),
                      )
                    }
                  />
                  <div className="min-w-0">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                </label>
                <Badge variant="secondary">{product.type}</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={product.is_active ? "default" : "secondary"}>{product.is_active ? "Aktif" : "Pasif"}</Badge>
                <Badge variant={product.is_featured ? "default" : "secondary"}>{product.is_featured ? "One Cikan" : "Standart"}</Badge>
                <Badge variant="outline">{getProductCategoryLabel(product)}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Varyantlar</p>
                <div className="flex flex-wrap gap-1">
                  {product.product_variants.slice(0, 3).map((variant) => (
                    <Badge key={variant.id || variant.sku} variant="outline" className="max-w-full truncate">
                      {getVariantLabel(variant)}
                    </Badge>
                  ))}
                  {product.product_variants.length > 3 ? <Badge variant="outline">+{product.product_variants.length - 3}</Badge> : null}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => void handleEdit(product.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Duzenle
                </Button>
                <Button variant="outline" className="flex-1 text-destructive" onClick={() => void handleDelete(product.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Bu kategoride urun yok.</CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="mt-6 hidden overflow-hidden md:block">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={(checked) =>
                    setSelectedProductIds((current) =>
                      checked
                        ? Array.from(new Set([...current, ...filteredProducts.map((product) => product.id)]))
                        : current.filter((id) => !filteredProducts.some((product) => product.id === id)),
                    )
                  }
                />
              </TableHead>
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
                  <Checkbox
                    checked={selectedProductIds.includes(product.id)}
                    onCheckedChange={(checked) =>
                      setSelectedProductIds((current) =>
                        checked ? Array.from(new Set([...current, product.id])) : current.filter((id) => id !== product.id),
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                </TableCell>
                <TableCell>{getProductCategoryLabel(product)}</TableCell>
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
                    <Button variant="ghost" size="icon" onClick={() => void handleEdit(product.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => void handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
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
