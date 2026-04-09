"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/mongo/client";
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
import {
  buildCaseVariantSku,
  CASE_FEATURE_OPTIONS,
  CASE_THEME_OPTIONS,
  CASE_TYPE_OPTIONS,
  CASE_COLOR_CODE_MAP,
  CASE_COLOR_OPTIONS,
  type CaseDetails,
  getCaseCompatibilityValue,
  IPHONE_CASE_MODELS,
  IPHONE_CASE_SERIES_GROUPS,
} from "@/lib/case-models";
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
  model: string;
  description: string;
  brand: string;
  type: ProductType;
  category_id: string;
  subcategory_id: string;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  specs: ProductSpecs;
  case_details: {
    case_type: string;
    case_theme: string;
    feature_tags: string[];
  };
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

type CaseBuilderState = {
  selectedModels: string[];
  selectedColors: string[];
  customColor: string;
  price: string;
  compare_at_price: string;
  stock: string;
  is_active: boolean;
};

type PhoneQuickBuilderState = {
  selectedColors: string[];
  selectedStorages: string[];
  customColor: string;
  customStorage: string;
  ram: string;
  price: string;
  compare_at_price: string;
  stock: string;
  is_active: boolean;
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
  model?: string | null;
  description: string;
  brand: string;
  type: ProductType;
  category_id: string | null;
  subcategory_id?: string | null;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  specs?: ProductSpecs | null;
  case_details?: CaseDetails | null;
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

function isPlaceholderVariant(variant: ProductVariantForm) {
  return (
    !variant.color_name.trim() &&
    !variant.storage.trim() &&
    !variant.ram.trim() &&
    !variant.sku.trim() &&
    !variant.price.trim() &&
    !variant.compare_at_price.trim() &&
    !variant.barcode.trim() &&
    variant.images.length === 0 &&
    Object.values(variant.attributes).every((value) => !`${value ?? ""}`.trim())
  );
}

function getMeaningfulVariants(variants: ProductVariantForm[]) {
  return variants.filter((variant) => !isPlaceholderVariant(variant));
}

function getCommonFieldValue(values: string[]) {
  const normalizedValues = values.map((value) => `${value ?? ""}`);
  return new Set(normalizedValues).size === 1 ? normalizedValues[0] || "" : "";
}

function deriveCaseBuilderFromVariants(variants: ProductVariantForm[]): CaseBuilderState {
  const meaningfulVariants = getMeaningfulVariants(variants);
  if (meaningfulVariants.length === 0) {
    return createEmptyCaseBuilder();
  }

  const selectedModels = Array.from(
    new Set(meaningfulVariants.map((variant) => getCaseCompatibilityValue(variant.attributes)).filter(Boolean)),
  );
  const selectedColors = Array.from(
    new Set(meaningfulVariants.map((variant) => variant.color_name.trim()).filter(Boolean)),
  );

  return {
    selectedModels,
    selectedColors,
    customColor: "",
    price: getCommonFieldValue(meaningfulVariants.map((variant) => variant.price)),
    compare_at_price: getCommonFieldValue(meaningfulVariants.map((variant) => variant.compare_at_price)),
    stock: getCommonFieldValue(meaningfulVariants.map((variant) => variant.stock)) || "0",
    is_active: meaningfulVariants.every((variant) => variant.is_active),
  };
}

function findDuplicateCaseVariantCombinations(variants: ProductVariantForm[]) {
  const seenKeys = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const variant of getMeaningfulVariants(variants)) {
    const compatibility = getCaseCompatibilityValue(variant.attributes).trim();
    const color = variant.color_name.trim();

    if (!compatibility || !color) {
      continue;
    }

    const key = `${compatibility.toLocaleLowerCase("tr-TR")}__${color.toLocaleLowerCase("tr-TR")}`;
    const label = `${compatibility} / ${color}`;

    if (seenKeys.has(key)) {
      duplicates.add(label);
      continue;
    }

    seenKeys.set(key, label);
  }

  return Array.from(duplicates);
}

const PHONE_COLOR_PRESETS = [
  "Siyah",
  "Beyaz",
  "Mavi",
  "Lacivert",
  "Yesil",
  "Mor",
  "Pembe",
  "Titanyum",
  "Titanyum Siyah",
  "Titanyum Beyaz",
] as const;

const PHONE_COLOR_CODE_MAP: Record<string, string> = {
  siyah: "#111111",
  beyaz: "#f5f5f5",
  mavi: "#2563eb",
  lacivert: "#1e3a8a",
  yesil: "#15803d",
  mor: "#7c3aed",
  pembe: "#ec4899",
  titanyum: "#8b8f97",
  "titanyum siyah": "#3f3f46",
  "titanyum beyaz": "#d4d4d8",
  gri: "#6b7280",
  gumus: "#c0c0c0",
  altin: "#d4a017",
  kirmizi: "#dc2626",
  sari: "#eab308",
  turuncu: "#f97316",
};

const PHONE_STORAGE_PRESETS = [
  "64 GB",
  "128 GB",
  "256 GB",
  "512 GB",
  "1 TB",
] as const;

const PHONE_CATEGORY_SLUGS = ["telefon", "ikinci-el-telefon"] as const;

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

const createEmptyCaseBuilder = (): CaseBuilderState => ({
  selectedModels: [],
  selectedColors: [],
  customColor: "",
  price: "",
  compare_at_price: "",
  stock: "0",
  is_active: true,
});

const createEmptyPhoneQuickBuilder = (): PhoneQuickBuilderState => ({
  selectedColors: [],
  selectedStorages: [],
  customColor: "",
  customStorage: "",
  ram: "",
  price: "",
  compare_at_price: "",
  stock: "0",
  is_active: true,
});

const defaultForm: ProductForm = {
  name: "",
  slug: "",
  model: "",
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
    screenSize: "",
    displayTechnology: "",
    refreshRate: "",
    resolution: "",
    processor: "",
    batteryCapacity: "",
    fastCharging: "",
    wirelessCharging: "",
    network5g: "",
    nfc: "",
    esim: "",
    dualSim: "",
    bluetooth: "",
    wifi: "",
    waterResistance: "",
    biometricSecurity: "",
  },
  case_details: {
    case_type: "",
    case_theme: "",
    feature_tags: [],
  },
  second_hand: mapSecondHandToForm(),
  variants: [createEmptyVariant(0)],
};

function mapCaseDetailsToForm(details?: CaseDetails | null): ProductForm["case_details"] {
  return {
    case_type: details?.case_type || "",
    case_theme: details?.case_theme || "",
    feature_tags: Array.isArray(details?.feature_tags) ? details!.feature_tags.filter(Boolean) : [],
  };
}

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
    model: product.model || "",
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
      screenSize: product.specs?.screenSize || "",
      displayTechnology: product.specs?.displayTechnology || "",
      refreshRate: product.specs?.refreshRate || "",
      resolution: product.specs?.resolution || "",
      processor: product.specs?.processor || "",
      batteryCapacity: product.specs?.batteryCapacity || "",
      fastCharging: product.specs?.fastCharging || "",
      wirelessCharging: product.specs?.wirelessCharging || "",
      network5g: product.specs?.network5g || "",
      nfc: product.specs?.nfc || "",
      esim: product.specs?.esim || "",
      dualSim: product.specs?.dualSim || "",
      bluetooth: product.specs?.bluetooth || "",
      wifi: product.specs?.wifi || "",
      waterResistance: product.specs?.waterResistance || "",
      biometricSecurity: product.specs?.biometricSecurity || "",
    },
    case_details: mapCaseDetailsToForm(product.case_details),
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

function extractDigits(value: string) {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function formatSpecWithUnit(value: string, unit: string) {
  const digits = extractDigits(value);
  return digits ? `${digits} ${unit}` : "";
}

function serializeVariantDrafts(variants: ProductVariantForm[]) {
  return JSON.stringify(
    variants.map((variant) => ({
      id: variant.id ?? null,
      color_name: variant.color_name,
      color_code: variant.color_code,
      storage: variant.storage,
      ram: variant.ram,
      sku: variant.sku,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      stock: variant.stock,
      images: [...variant.images].sort(),
      is_active: variant.is_active,
      barcode: variant.barcode,
      sort_order: variant.sort_order,
    })),
  );
}

function buildPhoneVariantsFromBuilderState(sourceForm: ProductForm, phoneBuilder: PhoneQuickBuilderState) {
  const selectedColors = getNonEmptyDistinctValues(phoneBuilder.selectedColors);
  const selectedStorages = getNonEmptyDistinctValues(phoneBuilder.selectedStorages);

  if (selectedColors.length === 0 || selectedStorages.length === 0) {
    return [];
  }

  const existingVariants = new Map(
    getMeaningfulVariants(sourceForm.variants).map((variant) => [
      `${variant.color_name.trim()}__${variant.storage.trim()}__${variant.ram.trim()}`,
      variant,
    ]),
  );

  const nextVariants: ProductVariantForm[] = [];
  let sortOrder = 0;

  for (const color of selectedColors) {
    for (const storage of selectedStorages) {
      const key = `${color}__${storage}__${phoneBuilder.ram.trim()}`;
      const existingVariant = existingVariants.get(key);

      nextVariants.push({
        id: existingVariant?.id,
        color_name: color,
        color_code: existingVariant?.color_code || resolvePhoneColorCode(color),
        storage,
        ram: existingVariant?.ram || phoneBuilder.ram.trim(),
        attributes: existingVariant?.attributes || {},
        sku:
          existingVariant?.sku ||
          buildPhoneVariantSku({
            brand: sourceForm.brand,
            productName: sourceForm.model || sourceForm.name,
            color,
            storage,
            ram: phoneBuilder.ram.trim(),
          }),
        price: existingVariant?.price || phoneBuilder.price || "",
        compare_at_price: existingVariant?.compare_at_price || phoneBuilder.compare_at_price || "",
        stock: existingVariant?.stock || phoneBuilder.stock || "0",
        images: existingVariant?.images || [],
        is_active: existingVariant?.is_active ?? phoneBuilder.is_active,
        barcode: existingVariant?.barcode || "",
        sort_order: sortOrder,
      });
      sortOrder += 1;
    }
  }

  return nextVariants;
}

function getNonEmptyDistinctValues(values: string[]) {
  return Array.from(new Set(values.map((value) => `${value ?? ""}`.trim()).filter(Boolean)));
}

function resolvePhoneColorCode(colorName: string) {
  const normalizedColor = `${colorName ?? ""}`.trim().toLocaleLowerCase("tr-TR");

  if (!normalizedColor) {
    return "";
  }

  if (PHONE_COLOR_CODE_MAP[normalizedColor]) {
    return PHONE_COLOR_CODE_MAP[normalizedColor];
  }

  const keywordMatch = Object.entries(PHONE_COLOR_CODE_MAP).find(([keyword]) => normalizedColor.includes(keyword));
  return keywordMatch?.[1] || "";
}

function isPhoneQuickBuilderDirty(builder: PhoneQuickBuilderState) {
  return (
    builder.selectedColors.length > 0 ||
    builder.selectedStorages.length > 0 ||
    Boolean(builder.customColor.trim()) ||
    Boolean(builder.customStorage.trim()) ||
    Boolean(builder.ram.trim()) ||
    Boolean(builder.price.trim()) ||
    Boolean(builder.compare_at_price.trim()) ||
    builder.stock !== "0" ||
    builder.is_active !== true
  );
}

function derivePhoneQuickBuilderFromVariants(variants: ProductVariantForm[]): PhoneQuickBuilderState {
  const meaningfulVariants = getMeaningfulVariants(variants);

  if (meaningfulVariants.length === 0) {
    return createEmptyPhoneQuickBuilder();
  }

  return {
    selectedColors: getNonEmptyDistinctValues(meaningfulVariants.map((variant) => variant.color_name)),
    selectedStorages: getNonEmptyDistinctValues(meaningfulVariants.map((variant) => variant.storage)),
    customColor: "",
    customStorage: "",
    ram: getCommonFieldValue(meaningfulVariants.map((variant) => variant.ram)),
    price: getCommonFieldValue(meaningfulVariants.map((variant) => variant.price)),
    compare_at_price: getCommonFieldValue(meaningfulVariants.map((variant) => variant.compare_at_price)),
    stock: getCommonFieldValue(meaningfulVariants.map((variant) => variant.stock)) || "0",
    is_active: meaningfulVariants.every((variant) => variant.is_active),
  };
}

function buildPhoneSkuSegment(value: string) {
  return sanitizeSlug(value)
    .split("-")
    .map((segment) => segment.toLocaleUpperCase("en-US"))
    .join("");
}

function buildPhoneVariantSku(input: {
  brand: string;
  productName: string;
  color: string;
  storage: string;
  ram: string;
}) {
  return [
    buildPhoneSkuSegment(input.brand),
    buildPhoneSkuSegment(input.productName),
    buildPhoneSkuSegment(input.color),
    buildPhoneSkuSegment(input.storage),
    buildPhoneSkuSegment(input.ram),
  ]
    .filter(Boolean)
    .join("-");
}

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductRecord | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [caseBuilder, setCaseBuilder] = useState<CaseBuilderState>(createEmptyCaseBuilder);
  const [phoneQuickBuilder, setPhoneQuickBuilder] = useState<PhoneQuickBuilderState>(createEmptyPhoneQuickBuilder);
  const [caseModelSearch, setCaseModelSearch] = useState("");
  const [showCaseAdvancedEditor, setShowCaseAdvancedEditor] = useState(false);
  const [showPhoneAdvancedEditor, setShowPhoneAdvancedEditor] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const bulkActions = useBulkProductActions();
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const categoryBySlug = useMemo(
    () => new Map(categories.filter((category) => category.slug).map((category) => [category.slug as string, category])),
    [categories]
  );
  const topLevelCategories = useMemo(
    () => categories.filter((category) => !category.parent_category_id && category.slug !== "teknik-servis"),
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
  const isCaseCategory = selectedCategory?.slug === "kilif";
  const isPhoneCategory = selectedCategory?.slug != null && PHONE_CATEGORY_SLUGS.includes(selectedCategory.slug as (typeof PHONE_CATEGORY_SLUGS)[number]);
  const isPhoneQuickEntry = isPhoneCategory && !isCaseCategory;
  const variantAxes = useMemo(() => getProductVariantAxes(selectedCategory?.slug), [selectedCategory?.slug]);
  const filteredCaseModels = useMemo(() => {
    const normalizedSearch = caseModelSearch.trim().toLocaleLowerCase("tr-TR");
    if (!normalizedSearch) {
      return [...IPHONE_CASE_MODELS];
    }

    return IPHONE_CASE_MODELS.filter((model) => model.toLocaleLowerCase("tr-TR").includes(normalizedSearch));
  }, [caseModelSearch]);
  const caseGeneratedVariants = useMemo(() => getMeaningfulVariants(form.variants), [form.variants]);
  const phonePreviewVariantCount = phoneQuickBuilder.selectedColors.length * phoneQuickBuilder.selectedStorages.length;
  const technicalServiceCategoryId = categoryBySlug.get("teknik-servis")?.id || "";
  const visibleProducts = useMemo(
    () => products.filter((product) => !technicalServiceCategoryId || product.category_id !== technicalServiceCategoryId),
    [products, technicalServiceCategoryId]
  );

  const fetchProducts = async () => {
    const { data, error } = await db
      .from("products")
      .select("id, name, slug, model, brand, type, category_id, subcategory_id, is_featured, is_active, images, product_variants(id, sku, color_name, storage, ram, attributes, is_active, sort_order), categories(name)")
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
      throw new Error("Ürün bulunamadı");
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

  useEffect(() => {
    if (!isCaseCategory) {
      setCaseModelSearch("");
      setShowCaseAdvancedEditor(false);
      return;
    }

    setCaseBuilder((current) => {
      if (
        current.selectedModels.length > 0 ||
        current.selectedColors.length > 0 ||
        current.price ||
        current.compare_at_price ||
        current.stock !== "0"
      ) {
        return current;
      }

      return deriveCaseBuilderFromVariants(form.variants);
    });
  }, [form.variants, isCaseCategory]);

  useEffect(() => {
    if (!isPhoneQuickEntry) {
      setShowPhoneAdvancedEditor(false);
      return;
    }

    setPhoneQuickBuilder((current) => {
      if (isPhoneQuickBuilderDirty(current)) {
        return current;
      }

      return derivePhoneQuickBuilderFromVariants(form.variants);
    });
  }, [form.variants, isPhoneQuickEntry]);

  useEffect(() => {
    if (!isPhoneQuickEntry || showPhoneAdvancedEditor) {
      return;
    }

    const hasRequiredSelections =
      phoneQuickBuilder.selectedColors.length > 0 &&
      phoneQuickBuilder.selectedStorages.length > 0;

    if (!hasRequiredSelections) {
      return;
    }

    const nextVariants = buildPhoneVariantsFromBuilderState(form, phoneQuickBuilder);
    const currentVariants = getMeaningfulVariants(form.variants);

    if (serializeVariantDrafts(currentVariants) === serializeVariantDrafts(nextVariants)) {
      return;
    }

    setForm((current) => ({
      ...current,
      variants: buildPhoneVariantsFromBuilderState(current, phoneQuickBuilder),
      specs: {
        ...current.specs,
        internalStorage: current.specs.internalStorage || (phoneQuickBuilder.selectedStorages.length === 1 ? phoneQuickBuilder.selectedStorages[0] : ""),
        ram: current.specs.ram || phoneQuickBuilder.ram,
      },
    }));
  }, [form, isPhoneQuickEntry, phoneQuickBuilder, showPhoneAdvancedEditor]);

  const resetForm = () => {
    setForm(defaultForm);
    setCaseBuilder(createEmptyCaseBuilder());
    setPhoneQuickBuilder(createEmptyPhoneQuickBuilder());
    setCaseModelSearch("");
    setShowCaseAdvancedEditor(false);
    setShowPhoneAdvancedEditor(false);
    setIsSlugManuallyEdited(false);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value;

    setForm((current) => {
      const shouldSyncSlug = !isSlugManuallyEdited || !current.slug || !hasCustomSlug(current.name, current.slug);
      const shouldSyncModel = current.type === "phone" && (!current.model.trim() || current.model.trim() === current.name.trim());

      return {
        ...current,
        name: nextName,
        slug: shouldSyncSlug ? sanitizeSlug(nextName) : current.slug,
        model: shouldSyncModel ? nextName : current.model,
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
      throw new Error(payload?.error?.message || "Foto yüklenemedi");
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
              ...(field === "color_name" && current.type === "phone" && typeof value === "string"
                ? (() => {
                    const previousAutoColorCode = resolvePhoneColorCode(variant.color_name);
                    const nextAutoColorCode = resolvePhoneColorCode(value);
                    const shouldAutofillColorCode = !variant.color_code || variant.color_code === previousAutoColorCode;

                    return shouldAutofillColorCode && nextAutoColorCode
                      ? { color_code: nextAutoColorCode }
                      : {};
                  })()
                : {}),
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

  const handleToggleCaseModel = (model: string) => {
    setCaseBuilder((current) => ({
      ...current,
      selectedModels: current.selectedModels.includes(model)
        ? current.selectedModels.filter((item) => item !== model)
        : [...current.selectedModels, model],
    }));
  };

  const handleApplyCaseSeries = (models: readonly string[]) => {
    setCaseBuilder((current) => ({
      ...current,
      selectedModels: Array.from(new Set([...current.selectedModels, ...models])),
    }));
  };

  const handleClearCaseModels = () => {
    setCaseBuilder((current) => ({
      ...current,
      selectedModels: [],
    }));
  };

  const handleToggleCaseColor = (color: string) => {
    setCaseBuilder((current) => ({
      ...current,
      selectedColors: current.selectedColors.includes(color)
        ? current.selectedColors.filter((item) => item !== color)
        : [...current.selectedColors, color],
    }));
  };

  const handleAddCustomCaseColor = () => {
    const normalizedColor = caseBuilder.customColor.trim();
    if (!normalizedColor) {
      return;
    }

    setCaseBuilder((current) => ({
      ...current,
      selectedColors: current.selectedColors.includes(normalizedColor)
        ? current.selectedColors
        : [...current.selectedColors, normalizedColor],
      customColor: "",
    }));
  };

  const handleToggleCaseFeature = (feature: string) => {
    setForm((current) => ({
      ...current,
      case_details: {
        ...current.case_details,
        feature_tags: current.case_details.feature_tags.includes(feature)
          ? current.case_details.feature_tags.filter((item) => item !== feature)
          : [...current.case_details.feature_tags, feature],
      },
    }));
  };

  const buildPhoneVariantsFromBuilder = (sourceForm: ProductForm) => {
    return buildPhoneVariantsFromBuilderState(sourceForm, phoneQuickBuilder);
  };

  const handleTogglePhoneColor = (color: string) => {
    setPhoneQuickBuilder((current) => ({
      ...current,
      selectedColors: current.selectedColors.includes(color)
        ? current.selectedColors.filter((item) => item !== color)
        : [...current.selectedColors, color],
    }));
  };

  const handleTogglePhoneStorage = (storage: string) => {
    setPhoneQuickBuilder((current) => ({
      ...current,
      selectedStorages: current.selectedStorages.includes(storage)
        ? current.selectedStorages.filter((item) => item !== storage)
        : [...current.selectedStorages, storage],
    }));
  };

  const handleAddCustomPhoneColor = () => {
    const normalizedColor = phoneQuickBuilder.customColor.trim();
    if (!normalizedColor) {
      return;
    }

    setPhoneQuickBuilder((current) => ({
      ...current,
      selectedColors: current.selectedColors.includes(normalizedColor)
        ? current.selectedColors
        : [...current.selectedColors, normalizedColor],
      customColor: "",
    }));
  };

  const handleAddCustomPhoneStorage = () => {
    const normalizedStorage = phoneQuickBuilder.customStorage.trim();
    if (!normalizedStorage) {
      return;
    }

    setPhoneQuickBuilder((current) => ({
      ...current,
      selectedStorages: current.selectedStorages.includes(normalizedStorage)
        ? current.selectedStorages
        : [...current.selectedStorages, normalizedStorage],
      customStorage: "",
    }));
  };

  const handleGeneratePhoneVariants = () => {
    if (phoneQuickBuilder.selectedColors.length === 0) {
      toast.error("En az bir renk secin");
      return;
    }

    if (phoneQuickBuilder.selectedStorages.length === 0) {
      toast.error("En az bir depolama secin");
      return;
    }

    const generatedVariants = buildPhoneVariantsFromBuilder(form);
    setForm((current) => ({
      ...current,
      variants: generatedVariants,
      specs: {
        ...current.specs,
        internalStorage: current.specs.internalStorage || (phoneQuickBuilder.selectedStorages.length === 1 ? phoneQuickBuilder.selectedStorages[0] : ""),
        ram: current.specs.ram || phoneQuickBuilder.ram,
      },
    }));
    setShowPhoneAdvancedEditor(false);
    toast.success(`${generatedVariants.length} telefon seçeneği hazırlandı`);
  };

  const buildCaseVariantsFromBuilder = (sourceForm: ProductForm) => {
    const existingVariants = new Map(
      getMeaningfulVariants(sourceForm.variants).map((variant) => [
        `${getCaseCompatibilityValue(variant.attributes)}__${variant.color_name.trim()}`,
        variant,
      ]),
    );

    const nextVariants: ProductVariantForm[] = [];
    let sortOrder = 0;

    for (const model of caseBuilder.selectedModels) {
      for (const color of caseBuilder.selectedColors) {
        const existingVariant = existingVariants.get(`${model}__${color}`);
        nextVariants.push({
          id: existingVariant?.id,
          color_name: color,
          color_code: existingVariant?.color_code || CASE_COLOR_CODE_MAP[color] || "",
          storage: "",
          ram: "",
          attributes: {
            ...(existingVariant?.attributes || {}),
            uyumluluk: model,
          },
          sku:
            existingVariant?.sku ||
            buildCaseVariantSku({
              brand: sourceForm.brand,
              productName: sourceForm.name,
              model,
              color,
            }),
          price: existingVariant?.price || caseBuilder.price || "",
          compare_at_price: existingVariant?.compare_at_price || caseBuilder.compare_at_price || "",
          stock: existingVariant?.stock || caseBuilder.stock || "0",
          images: existingVariant?.images || [],
          is_active: existingVariant?.is_active ?? caseBuilder.is_active,
          barcode: existingVariant?.barcode || "",
          sort_order: sortOrder,
        });
        sortOrder += 1;
      }
    }

    return nextVariants;
  };

  const handleGenerateCaseVariants = () => {
    if (caseBuilder.selectedModels.length === 0) {
      toast.error("Once uyumlu telefon modellerini secin");
      return;
    }

    if (caseBuilder.selectedColors.length === 0) {
      toast.error("En az bir renk secin");
      return;
    }

    const generatedVariants = buildCaseVariantsFromBuilder(form);
    setForm((current) => ({
      ...current,
      variants: generatedVariants,
    }));
    setShowCaseAdvancedEditor(false);
    toast.success(`${generatedVariants.length} ürün seçeneği hazırlandı`);
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
        toast.error("Ürün icin en az bir varyant kalmali");
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
    const effectiveVariants = isCaseCategory
      ? (() => {
          const meaningfulVariants = getMeaningfulVariants(form.variants);
          return meaningfulVariants.length > 0 ? meaningfulVariants : buildCaseVariantsFromBuilder(form);
        })()
      : isPhoneQuickEntry
        ? (() => {
            const meaningfulVariants = getMeaningfulVariants(form.variants);
            return meaningfulVariants.length > 0 ? meaningfulVariants : buildPhoneVariantsFromBuilder(form);
          })()
        : getMeaningfulVariants(form.variants);

    if (isCaseCategory && effectiveVariants.length === 0) {
      toast.error("Kılıf ürünü için önce uyumlu modelleri ve renkleri seçin");
      return;
    }

    if (isCaseCategory) {
      const duplicateCombinations = findDuplicateCaseVariantCombinations(effectiveVariants);
      if (duplicateCombinations.length > 0) {
        const duplicatePreview = duplicateCombinations.slice(0, 2).join(", ");
        const remainingCount = Math.max(0, duplicateCombinations.length - 2);
        toast.error(
          remainingCount > 0
            ? `Ayni model ve renk tekrar ediyor: ${duplicatePreview} ve ${remainingCount} secenek daha`
            : `Ayni model ve renk tekrar ediyor: ${duplicatePreview}`,
        );
        return;
      }
    }

    if (isPhoneQuickEntry && effectiveVariants.length === 0) {
      toast.error("Telefon icin once renk ve depolama secin");
      return;
    }

    const payload = {
      productId: editing?.id ?? null,
      name: form.name,
      slug: sanitizeSlug(form.slug || form.name),
      model: form.type === "phone" ? (form.model || form.name) : form.model || null,
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
        screenSize: form.specs.screenSize || null,
        displayTechnology: form.specs.displayTechnology || null,
        refreshRate: form.specs.refreshRate || null,
        resolution: form.specs.resolution || null,
        processor: form.specs.processor || null,
        batteryCapacity: form.specs.batteryCapacity || null,
        fastCharging: form.specs.fastCharging || null,
        wirelessCharging: form.specs.wirelessCharging || null,
        network5g: form.specs.network5g || null,
        nfc: form.specs.nfc || null,
        esim: form.specs.esim || null,
        dualSim: form.specs.dualSim || null,
        bluetooth: form.specs.bluetooth || null,
        wifi: form.specs.wifi || null,
        waterResistance: form.specs.waterResistance || null,
        biometricSecurity: form.specs.biometricSecurity || null,
      },
      case_details: isCaseCategory
        ? {
            case_type: form.case_details.case_type || null,
            case_theme: form.case_details.case_theme || null,
            feature_tags: form.case_details.feature_tags,
          }
        : null,
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
      variants: effectiveVariants.map((variant, index) => ({
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
      toast.error(result?.error?.message || "Ürün kaydedilemedi");
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

    toast.success(editing ? "Ürün güncellendi" : "Ürün eklendi");
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
      setCaseBuilder(deriveCaseBuilderFromVariants(nextForm.variants));
      setPhoneQuickBuilder(derivePhoneQuickBuilderFromVariants(nextForm.variants));
      setCaseModelSearch("");
      setShowCaseAdvancedEditor(false);
      setShowPhoneAdvancedEditor(false);
      setIsSlugManuallyEdited(hasCustomSlug(nextForm.name, nextForm.slug));
      setDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ürün detayları yüklenemedi");
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
      toast.error(error instanceof Error ? error.message : "Ürün detayları yüklenemedi");
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
        toast.error(cleanupError instanceof Error ? cleanupError.message : "Ürün medyasi silinemedi");
      }
    }

    toast.success("Ürün silindi");
    fetchProducts();
  };

  const categoryIdSet = useMemo(() => new Set(topLevelCategories.map((category) => category.id)), [topLevelCategories]);

  const categoryFilters = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorizedCount = 0;

    visibleProducts.forEach((product) => {
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
  }, [visibleProducts, topLevelCategories, categoryIdSet]);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === "all") {
      return visibleProducts;
    }

    if (activeCategoryId === "uncategorized") {
      return visibleProducts.filter((product) => !product.category_id || !categoryIdSet.has(product.category_id));
    }

    return visibleProducts.filter((product) => product.category_id === activeCategoryId);
  }, [activeCategoryId, visibleProducts, categoryIdSet]);

  const effectiveVariants = (() => {
    if (isCaseCategory) {
      const meaningfulVariants = getMeaningfulVariants(form.variants);
      return meaningfulVariants.length > 0 ? meaningfulVariants : buildCaseVariantsFromBuilder(form);
    }

    if (isPhoneQuickEntry) {
      const meaningfulVariants = getMeaningfulVariants(form.variants);
      return meaningfulVariants.length > 0 ? meaningfulVariants : buildPhoneVariantsFromBuilder(form);
    }

    return getMeaningfulVariants(form.variants);
  })();

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
        <h1 className="font-display text-2xl font-bold">Ürünler</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
                <Plus className="mr-1 h-4 w-4" /> Ürün Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>{editing ? "Ürün Düzenle" : "Yeni Ürün"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ürün Adi</Label>
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

              <div className={"space-y-2 " + (isPhoneCategory ? "" : "hidden")}>
                <Label>Telefon Modeli</Label>
                <Input
                  value={form.model}
                  onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
                  placeholder="iPhone 16 Pro"
                />
                <p className="text-xs text-muted-foreground">Filtrelemede kullanılır. Boş bırakırsan sistem ürün adını model olarak kullanır.</p>
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
                    disabled={isSecondHandIphoneCategory || isPhoneCategory}
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
                      setForm((current) => {
                        const nextCategoryId = value === "none" ? "" : value;
                        const nextCategory = topLevelCategories.find((category) => category.id === nextCategoryId) ?? null;
                        const nextCategorySlug = nextCategory?.slug || "";

                        return {
                          ...current,
                          category_id: nextCategoryId,
                          subcategory_id: "",
                          type: PHONE_CATEGORY_SLUGS.includes(nextCategorySlug as (typeof PHONE_CATEGORY_SLUGS)[number]) ? "phone" : current.type,
                        };
                      })
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
                <Label>Ürün Fotoğrafları</Label>
                <Input type="file" accept="image/*" multiple onChange={handleImageFilesChange} disabled={uploadingImages} />
                <p className="text-xs text-muted-foreground">
                  {uploadingImages ? "Fotograflar yukleniyor..." : "Bu galerideki görseller varyantta görsel yoksa fallback olarak kullanilir."}
                </p>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {form.images.map((imageUrl) => (
                      <div key={imageUrl} className="relative overflow-hidden rounded-md border">
                        <img src={imageUrl} alt="Ürün fotografi" className="h-20 w-full object-cover" />
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
              
                <div className={"space-y-3 "+(isPhoneCategory ? "" : "hidden")}>
                  <div>
                    <h3 className="text-sm font-semibold">Ürün Özellikleri</h3>
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
                            specs: { ...current.specs, internalStorage: formatSpecWithUnit(event.target.value, "GB") },
                          }))
                        }
                        placeholder="256"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">RAM Kapasitesi</Label>
                      <Input
                        value={form.specs.ram || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, ram: formatSpecWithUnit(event.target.value, "GB") },
                          }))
                        }
                        placeholder="8"
                        inputMode="numeric"
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
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold">Gelişmiş Teknik Özellikler</h4>
                    <p className="text-xs text-muted-foreground">Detay sayfasında profesyonel teknik tablo olarak gösterilir.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Ekran Boyutu</Label>
                      <Input
                        value={form.specs.screenSize || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, screenSize: event.target.value },
                          }))
                        }
                        placeholder='6.7"'
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ekran Teknolojisi</Label>
                      <Input
                        value={form.specs.displayTechnology || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, displayTechnology: event.target.value },
                          }))
                        }
                        placeholder="LTPO OLED"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Yenileme Hızı</Label>
                      <Input
                        value={form.specs.refreshRate || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, refreshRate: event.target.value },
                          }))
                        }
                        placeholder="120 Hz"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Çözünürlük</Label>
                      <Input
                        value={form.specs.resolution || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, resolution: event.target.value },
                          }))
                        }
                        placeholder="2796 x 1290"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">İşlemci</Label>
                      <Input
                        value={form.specs.processor || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, processor: event.target.value },
                          }))
                        }
                        placeholder="A18 Pro"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Batarya Kapasitesi</Label>
                      <Input
                        value={form.specs.batteryCapacity || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, batteryCapacity: event.target.value },
                          }))
                        }
                        placeholder="4685 mAh"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hızlı Şarj</Label>
                      <Input
                        value={form.specs.fastCharging || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, fastCharging: event.target.value },
                          }))
                        }
                        placeholder="20W kablolu"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Kablosuz Şarj</Label>
                      <Input
                        value={form.specs.wirelessCharging || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, wirelessCharging: event.target.value },
                          }))
                        }
                        placeholder="MagSafe 15W"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">5G</Label>
                      <Input
                        value={form.specs.network5g || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, network5g: event.target.value },
                          }))
                        }
                        placeholder="Destekliyor"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">NFC</Label>
                      <Input
                        value={form.specs.nfc || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, nfc: event.target.value },
                          }))
                        }
                        placeholder="Var"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">eSIM</Label>
                      <Input
                        value={form.specs.esim || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, esim: event.target.value },
                          }))
                        }
                        placeholder="Var"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Çift Hat</Label>
                      <Input
                        value={form.specs.dualSim || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, dualSim: event.target.value },
                          }))
                        }
                        placeholder="Nano SIM + eSIM"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bluetooth</Label>
                      <Input
                        value={form.specs.bluetooth || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, bluetooth: event.target.value },
                          }))
                        }
                        placeholder="Bluetooth 5.3"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Wi‑Fi</Label>
                      <Input
                        value={form.specs.wifi || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, wifi: event.target.value },
                          }))
                        }
                        placeholder="Wi‑Fi 6E"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Suya Dayanıklılık</Label>
                      <Input
                        value={form.specs.waterResistance || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, waterResistance: event.target.value },
                          }))
                        }
                        placeholder="IP68"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Biyometrik Güvenlik</Label>
                      <Input
                        value={form.specs.biometricSecurity || ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specs: { ...current.specs, biometricSecurity: event.target.value },
                          }))
                        }
                        placeholder="Face ID"
                      />
                    </div>
                  </div>
                </div>

              {isSecondHandIphoneCategory ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">2. El Cihaz Bilgileri</h3>
                    <p className="text-xs text-muted-foreground">
                      Kondisyon, pil sağlığı, garanti ve ekspertiz bilgileri listeleme ve ürün detayında gösterilir.
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
                      <Label>Pil Sağlığı (%)</Label>
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
                      <Label>Batarya Değişimi</Label>
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
                      placeholder="Cihaz kontrol sonucu, önemli avantajlar ve güven notları"
                    />
                  </div>
                </div>
              ) : null}

              {isCaseCategory ? (
                <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">Kılıf Bilgileri</h3>
                    <p className="text-xs text-muted-foreground">
                      Ürünün tarzını seçin. Bunlar teknik ayar değil; ürünü daha kolay ayırt etmek ve filtrelemek için kullanılır.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Kılıf Tipi</Label>
                      <Select
                        value={form.case_details.case_type || "none"}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            case_details: {
                              ...current.case_details,
                              case_type: value === "none" ? "" : value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Secin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Secin</SelectItem>
                          {CASE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tema / Seri</Label>
                      <Select
                        value={form.case_details.case_theme || "none"}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            case_details: {
                              ...current.case_details,
                              case_theme: value === "none" ? "" : value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Secin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Secin</SelectItem>
                          {CASE_THEME_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ek Özellikler</Label>
                    <div className="flex flex-wrap gap-2">
                      {CASE_FEATURE_OPTIONS.map((feature) => (
                        <Button
                          key={feature}
                          type="button"
                          size="sm"
                          variant={form.case_details.feature_tags.includes(feature) ? "default" : "outline"}
                          onClick={() => handleToggleCaseFeature(feature)}
                        >
                          {feature}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{isCaseCategory ? "Ürün Seçenekleri" : isPhoneQuickEntry ? "Telefon Varyantlari" : "Modeller"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isCaseCategory
                        ? "Kılıf ürünlerinde teknik varyant yerine uyumlu modelleri, renkleri ve ortak fiyat bilgisini seçin."
                        : isPhoneQuickEntry
                          ? "Telefon ekleme sihirbazı ile renk, hafıza ve fiyat kombinasyonlarını hızlı kurun; isterseniz her varyantı tek tek ince ayar yapın."
                          : `${variantAxes.map((axis) => axis.label).join(", ") || "Temel model bilgileri"} bazli secenekleri fiyat, stok ve görsellerle birlikte yonetin.`}
                    </p>
                  </div>
                  {isCaseCategory ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setShowCaseAdvancedEditor((current) => !current)}
                    >
                      {showCaseAdvancedEditor ? "Kolay Moda Don" : "Gelismis Düzenleme"}
                    </Button>
                  ) : isPhoneQuickEntry ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setShowPhoneAdvancedEditor((current) => !current)}
                    >
                      {showPhoneAdvancedEditor ? "Varyant Sihirbazina Don" : "Gelismis Varyant Editoru"}
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={addVariant}>
                      <Plus className="mr-1 h-4 w-4" /> Model Ekle
                    </Button>
                  )}
                </div>

                {isCaseCategory ? (
                  <Card className="border-border/70 bg-muted/15 p-4">
                    <div className="space-y-4">
                      <div className="grid gap-4 xl:grid-cols-[1.25fr_minmax(0,1fr)]">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Uyumlu Telefon Modelleri</Label>
                            <Input
                              value={caseModelSearch}
                              onChange={(event) => setCaseModelSearch(event.target.value)}
                              placeholder="Model ara: iPhone 15 Pro"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {IPHONE_CASE_SERIES_GROUPS.map((group) => (
                              <Button key={group.id} type="button" variant="outline" size="sm" onClick={() => handleApplyCaseSeries(group.models)}>
                                {group.label}
                              </Button>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => setCaseBuilder((current) => ({ ...current, selectedModels: [...IPHONE_CASE_MODELS] }))}>
                              Tümünu Sec
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={handleClearCaseModels}>
                              Temizle
                            </Button>
                          </div>

                          <div className="max-h-72 overflow-y-auto rounded-2xl border border-border/70 bg-background/80 p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              {filteredCaseModels.map((model) => (
                                <label key={model} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm">
                                  <Checkbox checked={caseBuilder.selectedModels.includes(model)} onCheckedChange={() => handleToggleCaseModel(model)} />
                                  <span>{model}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{caseBuilder.selectedModels.length} model secildi</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Renkler</Label>
                            <div className="flex flex-wrap gap-2">
                              {CASE_COLOR_OPTIONS.map((color) => (
                                <Button
                                  key={color}
                                  type="button"
                                  size="sm"
                                  variant={caseBuilder.selectedColors.includes(color) ? "default" : "outline"}
                                  onClick={() => handleToggleCaseColor(color)}
                                >
                                  {color}
                                </Button>
                              ))}
                              {caseBuilder.selectedColors
                                .filter((color) => !CASE_COLOR_OPTIONS.includes(color as (typeof CASE_COLOR_OPTIONS)[number]))
                                .map((color) => (
                                  <Button key={color} type="button" size="sm" variant="default" onClick={() => handleToggleCaseColor(color)}>
                                    {color}
                                  </Button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={caseBuilder.customColor}
                                onChange={(event) => setCaseBuilder((current) => ({ ...current, customColor: event.target.value }))}
                                placeholder="Ozel renk ekle"
                              />
                              <Button type="button" variant="outline" onClick={handleAddCustomCaseColor}>
                                Ekle
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Ortak Fiyat (TL)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={caseBuilder.price}
                                onChange={(event) => setCaseBuilder((current) => ({ ...current, price: event.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Indirimli Fiyat</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={caseBuilder.compare_at_price}
                                onChange={(event) => setCaseBuilder((current) => ({ ...current, compare_at_price: event.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Ortak Stok</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={caseBuilder.stock}
                                onChange={(event) => setCaseBuilder((current) => ({ ...current, stock: event.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Yayin Durumu</Label>
                              <Select
                                value={caseBuilder.is_active ? "true" : "false"}
                                onValueChange={(value) => setCaseBuilder((current) => ({ ...current, is_active: value === "true" }))}
                              >
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

                          <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-3 text-sm">
                            <p className="font-medium">Hazırlanacak ürün seçenekleri</p>
                            <p className="mt-1 text-muted-foreground">
                              {caseBuilder.selectedModels.length} model x {caseBuilder.selectedColors.length} renk ={" "}
                              {caseBuilder.selectedModels.length * caseBuilder.selectedColors.length || 0} secenek
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {caseGeneratedVariants.slice(0, 6).map((variant) => (
                                <Badge key={`${variant.sku}-${variant.sort_order}`} variant="outline" className="max-w-full truncate">
                                  {getCaseCompatibilityValue(variant.attributes)} / {variant.color_name}
                                </Badge>
                              ))}
                              {caseGeneratedVariants.length > 6 ? <Badge variant="outline">+{caseGeneratedVariants.length - 6}</Badge> : null}
                            </div>
                          </div>

                          <Button type="button" className="w-full" onClick={handleGenerateCaseVariants}>
                            Seçilen modeller için ürün seçeneklerini oluştur
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : null}

                {isPhoneQuickEntry ? (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="space-y-5 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">Telefon Varyant Sihirbazi</h4>
                          <p className="text-xs text-muted-foreground">
                            Renk ve depolama sec. Sistem varyantlari otomatik kursun; sonra fiyat, stok ve fotograflari hizlica dagit.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{phonePreviewVariantCount || effectiveVariants.length} varyant hazır</Badge>
                          <Badge variant="secondary">{showPhoneAdvancedEditor ? "Gelismis mod" : "Hizli mod"}</Badge>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[1.15fr_minmax(0,0.85fr)]">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Renk Secenekleri</Label>
                            <div className="flex flex-wrap gap-2">
                              {PHONE_COLOR_PRESETS.map((color) => (
                                <Button
                                  key={color}
                                  type="button"
                                  size="sm"
                                  variant={phoneQuickBuilder.selectedColors.includes(color) ? "default" : "outline"}
                                  onClick={() => handleTogglePhoneColor(color)}
                                >
                                  {color}
                                </Button>
                              ))}
                              {phoneQuickBuilder.selectedColors
                                .filter((color) => !PHONE_COLOR_PRESETS.includes(color as (typeof PHONE_COLOR_PRESETS)[number]))
                                .map((color) => (
                                  <Button key={color} type="button" size="sm" variant="default" onClick={() => handleTogglePhoneColor(color)}>
                                    {color}
                                  </Button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={phoneQuickBuilder.customColor}
                                onChange={(event) => setPhoneQuickBuilder((current) => ({ ...current, customColor: event.target.value }))}
                                placeholder="Ozel renk ekle"
                              />
                              <Button type="button" variant="outline" onClick={handleAddCustomPhoneColor}>
                                Renk Ekle
                              </Button>
                            </div>
                            {phoneQuickBuilder.selectedColors.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {phoneQuickBuilder.selectedColors.map((color) => (
                                  <Badge key={color} variant="secondary" className="gap-1">
                                    {color}
                                    <button type="button" onClick={() => handleTogglePhoneColor(color)} aria-label={`${color} rengini kaldir`}>
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">En az bir renk secerek telefonun vitrin seceneklerini belirleyin.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Dahili Hafiza Secenekleri</Label>
                            <div className="flex flex-wrap gap-2">
                              {PHONE_STORAGE_PRESETS.map((storage) => (
                                <Button
                                  key={storage}
                                  type="button"
                                  size="sm"
                                  variant={phoneQuickBuilder.selectedStorages.includes(storage) ? "default" : "outline"}
                                  onClick={() => handleTogglePhoneStorage(storage)}
                                >
                                  {storage}
                                </Button>
                              ))}
                              {phoneQuickBuilder.selectedStorages
                                .filter((storage) => !PHONE_STORAGE_PRESETS.includes(storage as (typeof PHONE_STORAGE_PRESETS)[number]))
                                .map((storage) => (
                                  <Button key={storage} type="button" size="sm" variant="default" onClick={() => handleTogglePhoneStorage(storage)}>
                                    {storage}
                                  </Button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={phoneQuickBuilder.customStorage}
                                onChange={(event) => setPhoneQuickBuilder((current) => ({ ...current, customStorage: formatSpecWithUnit(event.target.value, "GB") }))}
                                placeholder="Ozel hafiza ekle"
                                inputMode="numeric"
                              />
                              <Button type="button" variant="outline" onClick={handleAddCustomPhoneStorage}>
                                Hafiza Ekle
                              </Button>
                            </div>
                            {phoneQuickBuilder.selectedStorages.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {phoneQuickBuilder.selectedStorages.map((storage) => (
                                  <Badge key={storage} variant="secondary" className="gap-1">
                                    {storage}
                                    <button type="button" onClick={() => handleTogglePhoneStorage(storage)} aria-label={`${storage} secenegini kaldir`}>
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Hafiza secenekleri filtreleme ve varyant fiyatlandirma icin kullanilir.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Varyant Ozeti</p>
                              <p className="text-xs text-muted-foreground">Renk ve hafiza secimlerini burada kur. Fiyat, stok, durum ve RAM alanlarini alttaki hizli varyant kartlarindan yonet.</p>
                            </div>

                            <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                              {phonePreviewVariantCount > 0
                                ? `${phoneQuickBuilder.selectedColors.length} renk x ${phoneQuickBuilder.selectedStorages.length} hafiza = ${phonePreviewVariantCount} varyant.`
                                : "Renk ve hafıza seçildiğinde varyantlar anında hazırlanır."}
                              <br />
                              Varyant fotoğrafı yüklemezsen sistem ana ürün fotoğraflarını kullanmaya devam eder.
                            </div>

                            <div className="mt-4">
                              <Button type="button" className="w-full" onClick={handleGeneratePhoneVariants}>
                                Varyantlari Yeniden Olustur
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {!isCaseCategory && !isPhoneQuickEntry ? (
                  <p className="text-xs text-muted-foreground">
                    Her modeli tek tek girebilir veya telefonda hızlı giriş alanını kullanabilirsiniz.
                  </p>
                ) : null}

                {(!isCaseCategory || showCaseAdvancedEditor) && (!isPhoneQuickEntry || showPhoneAdvancedEditor) ? (
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
                            <Label className="text-xs">Model Görselleri</Label>
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
                ) : null}

                {isPhoneQuickEntry && !showPhoneAdvancedEditor ? (
                  <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Hazirlanan Telefon Secenekleri</p>
                        <p className="text-xs text-muted-foreground">
                          Hızlı modda her varyantın fiyatını, stokunu ve görselini tek ekranda yönetebilirsin. Daha derin alanlar için gelişmiş editör hazır.
                        </p>
                      </div>
                      <Badge variant="outline">{effectiveVariants.length} varyant</Badge>
                    </div>

                    {form.variants.length > 0 ? (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {form.variants.map((variant, variantIndex) => (
                          <Card key={variant.id || `quick-variant-${variantIndex}`} className="border-border/70 bg-background/90 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-2">
                                <p className="font-medium">
                                  {getVariantLabel({
                                    color_name: variant.color_name,
                                    storage: variant.storage,
                                    ram: variant.ram,
                                    attributes: variant.attributes,
                                    sku: variant.sku,
                                  }) || `Varyant #${variantIndex + 1}`}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {variant.color_name ? <Badge variant="secondary">{variant.color_name}</Badge> : null}
                                  {variant.storage ? <Badge variant="secondary">{variant.storage}</Badge> : null}
                                  {variant.ram ? <Badge variant="secondary">{variant.ram}</Badge> : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={variant.is_active ? "default" : "secondary"}>{variant.is_active ? "Aktif" : "Pasif"}</Badge>
                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeVariant(variantIndex)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">SKU</Label>
                                <Input value={variant.sku} onChange={(event) => handleVariantChange(variantIndex, "sku", event.target.value)} placeholder="SKU otomatik gelir" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Barcode</Label>
                                <Input value={variant.barcode} onChange={(event) => handleVariantChange(variantIndex, "barcode", event.target.value)} placeholder="Barkod" />
                              </div>
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
                              <div className="space-y-1">
                                <Label className="text-xs">RAM</Label>
                                <Input
                                  value={variant.ram}
                                  onChange={(event) => handleVariantChange(variantIndex, "ram", formatSpecWithUnit(event.target.value, "GB"))}
                                  placeholder="8"
                                  inputMode="numeric"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Renk Kodu</Label>
                                <div className="flex gap-2">
                                  <Input type="color" value={variant.color_code || "#000000"} onChange={(event) => handleVariantChange(variantIndex, "color_code", event.target.value)} className="h-10 w-14 p-1" />
                                  <Input value={variant.color_code} onChange={(event) => handleVariantChange(variantIndex, "color_code", event.target.value)} placeholder="#000000" />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <Label className="text-xs">Varyant Gorselleri</Label>
                              <Input type="file" accept="image/*" multiple onChange={(event) => handleVariantImageFilesChange(variantIndex, event)} disabled={uploadingImages} />
                              {variant.images.length > 0 ? (
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
                              ) : (
                                <p className="text-xs text-muted-foreground">Bu varyanta fotoğraf yüklemezsen sistem ana ürün görsellerini kullanır.</p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Henuz varyant olusmadi. Renk ve depolama secince sistem bu alani otomatik doldurur.</p>
                    )}
                  </div>
                ) : null}
              </div>

              <Button className="w-full" onClick={handleSave}>
                {editing ? "Güncelle" : "Kaydet"}
              </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" variant={activeCategoryId === "all" ? "default" : "outline"} onClick={() => setActiveCategoryId("all")}>
          Tümü
          <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{visibleProducts.length}</span>
        </Button>
        {categoryFilters.map((category) => (
          <Button key={category.id} size="sm" variant={activeCategoryId === category.id ? "default" : "outline"} onClick={() => setActiveCategoryId(category.id)}>
            {category.name}
            <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">{category.count}</span>
          </Button>
        ))}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {activeCategoryLabel}: {filteredProducts.length} ürün
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
                  Düzenle
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
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Bu kategoride ürün yok.</CardContent>
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
              <TableHead>Ürün</TableHead>
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
                  Bu kategoride ürün yok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

