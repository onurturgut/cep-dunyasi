import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Category, Product, ProductVariant } from "@/server/models";
import {
  buildVariantAttributes,
  buildVariantOptionSignature,
  getProductStartingPrice,
  normalizeProductVariant,
} from "@/lib/product-variants";
import { getProductVariantAxes } from "@/lib/product-variant-config";
import { normalizeSecondHandDetails } from "@/lib/second-hand";

const optionalTrimmedStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const normalized = `${value ?? ""}`.trim();
    return normalized || null;
  });

const imageArraySchema = z.array(z.string().trim().min(1)).default([]);
const specsSchema = z
  .object({
    operatingSystem: optionalTrimmedStringSchema,
    internalStorage: optionalTrimmedStringSchema,
    ram: optionalTrimmedStringSchema,
    frontCamera: optionalTrimmedStringSchema,
    rearCamera: optionalTrimmedStringSchema,
  })
  .default({
    operatingSystem: null,
    internalStorage: null,
    ram: null,
    frontCamera: null,
    rearCamera: null,
  });

const booleanOrNullSchema = z
  .union([z.boolean(), z.null(), z.undefined(), z.literal(""), z.literal("true"), z.literal("false")])
  .transform((value) => {
    if (value === "" || value == null) {
      return null;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return value === "true";
  });

const stringArrayOrNullSchema = z
  .union([z.array(z.string()), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (Array.isArray(value)) {
      return value.map((item) => item.trim()).filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  });

const variantAttributesSchema = z
  .record(z.string(), optionalTrimmedStringSchema)
  .default({})
  .transform((value) =>
    Object.fromEntries(
      Object.entries(value).filter(([key, item]) => key.trim() && typeof item === "string" && item.trim()),
    ),
  );

const secondHandSchema = z.object({
  condition: z.enum(["mukemmel", "cok_iyi", "iyi"]).nullable().optional().default(null),
  battery_health: z
    .union([z.coerce.number().int().min(0).max(100), z.null(), z.undefined(), z.literal("")])
    .transform((value) => (value === "" || value == null ? null : Number(value))),
  warranty_type: z.enum(["magaza", "distributor", "none"]).nullable().optional().default(null),
  warranty_remaining_months: z
    .union([z.coerce.number().int().min(0), z.null(), z.undefined(), z.literal("")])
    .transform((value) => (value === "" || value == null ? null : Number(value))),
  includes_box: z.boolean().default(false),
  includes_invoice: z.boolean().default(false),
  included_accessories: stringArrayOrNullSchema,
  face_id_status: z.enum(["working", "not_working", "not_applicable"]).nullable().optional().default(null),
  true_tone_status: z.enum(["working", "not_working", "not_applicable"]).nullable().optional().default(null),
  battery_changed: booleanOrNullSchema,
  changed_parts: stringArrayOrNullSchema,
  cosmetic_notes: optionalTrimmedStringSchema,
  inspection_summary: optionalTrimmedStringSchema,
  inspection_date: optionalTrimmedStringSchema,
  imei: optionalTrimmedStringSchema,
  serial_number: optionalTrimmedStringSchema,
});

const adminVariantSchema = z
  .object({
    id: optionalTrimmedStringSchema,
    color_name: optionalTrimmedStringSchema,
    color_code: optionalTrimmedStringSchema,
    storage: optionalTrimmedStringSchema,
    ram: optionalTrimmedStringSchema,
    attributes: variantAttributesSchema,
    sku: z.string().trim().min(1, "Varyant SKU zorunlu"),
    price: z.coerce.number().finite().positive("Varyant fiyati 0'dan buyuk olmali"),
    compare_at_price: z
      .union([z.coerce.number().finite().positive(), z.null(), z.undefined(), z.literal("")])
      .transform((value) => {
        if (value === "" || value == null) {
          return null;
        }

        return Number(value);
      }),
    stock: z.coerce.number().int().min(0, "Stok negatif olamaz"),
    images: imageArraySchema,
    is_active: z.boolean().default(true),
    barcode: optionalTrimmedStringSchema,
    sort_order: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((variant, ctx) => {
    if (variant.compare_at_price !== null && variant.compare_at_price <= variant.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indirimli fiyat, satis fiyatindan buyuk olmali",
        path: ["compare_at_price"],
      });
    }
  });

const adminProductSchema = z.object({
  name: z.string().trim().min(1, "Urun adi zorunlu"),
  slug: optionalTrimmedStringSchema,
  description: z.string().trim().default(""),
  brand: z.string().trim().default(""),
  type: z.enum(["phone", "accessory", "service"]),
  category_id: optionalTrimmedStringSchema,
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  images: imageArraySchema,
  specs: specsSchema,
  second_hand: secondHandSchema.nullable().optional().default(null),
  variants: z.array(adminVariantSchema).min(1, "En az bir varyant eklemelisiniz"),
});

export type AdminProductPayload = z.infer<typeof adminProductSchema>;

type AdminProductSaveResult = {
  productId: string;
  removedMediaUrls: string[];
};

type CategoryMeta = {
  slug?: string | null;
  name?: string | null;
};

const SECOND_HAND_IPHONE_CATEGORY_SLUG = "ikinci-el-telefon";
const REQUIRED_SECOND_HAND_BRAND = "Apple";

function slugifyProductName(value: string) {
  return value
    .toLocaleLowerCase("en-US")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFirstIssueMessage(error: z.ZodError) {
  return error.issues[0]?.message || "Gecersiz urun verisi";
}

function normalizeBrandValue(value: string | null | undefined) {
  return `${value ?? ""}`.trim().toLocaleLowerCase("tr-TR");
}

async function validateSecondHandIphoneRules(payload: AdminProductPayload) {
  if (!payload.category_id) {
    return;
  }

  const matchedCategory = (await Category.findOne({ id: payload.category_id }).select("slug name").lean()) as
    | { slug?: string | null; name?: string | null }
    | null;

  if (matchedCategory?.slug !== SECOND_HAND_IPHONE_CATEGORY_SLUG) {
    return;
  }

  if (payload.type !== "phone") {
    throw new Error("2. El Telefonlar kategorisinde sadece telefon turundeki urunler kaydedilebilir");
  }

  if (normalizeBrandValue(payload.brand) !== normalizeBrandValue(REQUIRED_SECOND_HAND_BRAND)) {
    throw new Error("2. El Telefonlar kategorisinde sadece Apple / iPhone urunleri yer alabilir");
  }
}

async function getCategoryMeta(categoryId: string | null | undefined): Promise<CategoryMeta | null> {
  if (!categoryId) {
    return null;
  }

  return (await Category.findOne({ id: categoryId }).select("slug name").lean()) as CategoryMeta | null;
}

function validateUniqueVariants(variants: AdminProductPayload["variants"], categorySlug?: string | null) {
  const skuSet = new Set<string>();
  const signatureSet = new Set<string>();

  for (const variant of variants) {
    const normalizedSku = variant.sku.trim().toLocaleUpperCase("en-US");
    const signature = buildVariantOptionSignature({
      colorName: variant.color_name,
      storage: variant.storage,
      ram: variant.ram,
      attributes: variant.attributes,
      categorySlug,
    });

    if (skuSet.has(normalizedSku)) {
      throw new Error(`SKU tekrarlaniyor: ${variant.sku}`);
    }

    if (signatureSet.has(signature)) {
      throw new Error(`Ayni varyant kombinasyonu birden fazla kez eklenmis: ${variant.color_name} / ${variant.storage}`);
    }

    skuSet.add(normalizedSku);
    signatureSet.add(signature);
  }
}

function validateCategoryVariantRequirements(variants: AdminProductPayload["variants"], categorySlug?: string | null) {
  const requiredAxes = getProductVariantAxes(categorySlug).filter((axis) => axis.required);

  for (const variant of variants) {
    for (const axis of requiredAxes) {
      const value =
        axis.fieldKey === "color_name"
          ? variant.color_name
          : axis.fieldKey === "storage"
            ? variant.storage
            : axis.fieldKey === "ram"
              ? variant.ram
              : variant.attributes[axis.attributeKeys[0]];

      if (`${value ?? ""}`.trim()) {
        continue;
      }

      throw new Error(`${axis.label} alani secili kategori icin zorunludur`);
    }
  }
}

function buildVariantDocument(
  productId: string,
  variant: AdminProductPayload["variants"][number],
  index: number,
  categorySlug?: string | null,
) {
  const normalized = normalizeProductVariant({
    id: variant.id,
    product_id: productId,
    sku: variant.sku.trim().toLocaleUpperCase("en-US"),
    price: variant.price,
    compare_at_price: variant.compare_at_price,
    stock: variant.stock,
    images: variant.images,
    is_active: variant.is_active,
    color_name: variant.color_name,
    color_code: variant.color_code,
    storage: variant.storage,
    ram: variant.ram,
    barcode: variant.barcode,
    sort_order: variant.sort_order ?? index,
    option_signature: buildVariantOptionSignature({
      colorName: variant.color_name,
      storage: variant.storage,
      ram: variant.ram,
      attributes: variant.attributes,
      categorySlug,
    }),
    attributes: buildVariantAttributes({
      colorName: variant.color_name,
      storage: variant.storage,
      ram: variant.ram,
      attributes: variant.attributes,
      categorySlug,
    }),
  });

  return {
    sku: normalized.sku,
    price: normalized.price,
    compare_at_price: normalized.compare_at_price,
    stock: normalized.stock,
    images: normalized.images,
    is_active: normalized.is_active,
    color_name: normalized.color_name,
    color_code: normalized.color_code,
    storage: normalized.storage,
    ram: normalized.ram,
    barcode: normalized.barcode,
    sort_order: normalized.sort_order,
    option_signature: normalized.option_signature,
    attributes: normalized.attributes,
    updated_at: new Date(),
  };
}

async function ensureUniqueProductSlug(slug: string, productId?: string | null) {
  const existingProduct = await Product.findOne({ slug }).lean();
  if (existingProduct && existingProduct.id !== productId) {
    throw new Error("Bu urun slug'i zaten kullaniliyor");
  }
}

async function ensureUniqueVariantSkus(variants: AdminProductPayload["variants"], productId?: string | null) {
  const normalizedSkus = variants.map((variant) => variant.sku.trim().toLocaleUpperCase("en-US"));
  const submittedIds = new Set(variants.map((variant) => variant.id).filter(Boolean));
  const existingVariants = await ProductVariant.find({ sku: { $in: normalizedSkus } }).lean();

  for (const existingVariant of existingVariants) {
    if (submittedIds.has(existingVariant.id)) {
      continue;
    }

    if (existingVariant.product_id !== productId) {
      throw new Error(`SKU zaten kullaniliyor: ${existingVariant.sku}`);
    }
  }
}

export async function saveAdminProduct(rawPayload: unknown, productId?: string | null): Promise<AdminProductSaveResult> {
  const parsedPayload = adminProductSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    throw new Error(getFirstIssueMessage(parsedPayload.error));
  }

  const payload = parsedPayload.data;
  const matchedCategory = await getCategoryMeta(payload.category_id);
  const categorySlug = matchedCategory?.slug ?? null;
  validateCategoryVariantRequirements(payload.variants, categorySlug);
  validateUniqueVariants(payload.variants, categorySlug);
  await validateSecondHandIphoneRules(payload);

  const slug = payload.slug || slugifyProductName(payload.name);
  if (!slug) {
    throw new Error("Urun icin gecerli bir slug olusturulamadi");
  }

  await ensureUniqueProductSlug(slug, productId);
  await ensureUniqueVariantSkus(payload.variants, productId);

  const existingProduct = productId ? await Product.findOne({ id: productId }).lean() : null;
  if (productId && !existingProduct) {
    throw new Error("Urun bulunamadi");
  }

  const existingVariants = productId ? await ProductVariant.find({ product_id: productId }).lean() : [];
  const existingVariantIds = new Set(existingVariants.map((variant: { id: string }) => variant.id));

  for (const variant of payload.variants) {
    if (variant.id && !existingVariantIds.has(variant.id)) {
      throw new Error("Guncellenmek istenen varyant bulunamadi");
    }
  }

  const provisionalProductId = productId || randomUUID();
  const preparedVariants = payload.variants.map((variant, index) => buildVariantDocument(provisionalProductId, variant, index, categorySlug));
  const startingPrice = getProductStartingPrice(preparedVariants) || preparedVariants[0]?.price || 0;
  const now = new Date();

  const productPayload = {
    name: payload.name,
    slug,
    description: payload.description,
    brand: payload.brand,
    type: payload.type,
    category_id: payload.category_id,
    is_featured: payload.is_featured,
    is_active: payload.is_active,
    images: payload.images,
    specs: Object.values(payload.specs).some(Boolean) ? payload.specs : null,
    second_hand: normalizeSecondHandDetails(payload.second_hand),
    starting_price: startingPrice,
    updated_at: now,
  };

  let resolvedProductId = productId;

  try {
    if (productId) {
      await Product.updateOne({ id: productId }, { $set: productPayload });
    } else {
      const createdProduct = await Product.create({
        ...productPayload,
        created_at: now,
      });
      resolvedProductId = createdProduct.id as string;
    }

    if (!resolvedProductId) {
      throw new Error("Urun kaydi tamamlanamadi");
    }

    const preparedVariantsForSave = payload.variants.map((variant, index) =>
      buildVariantDocument(resolvedProductId, variant, index, categorySlug)
    );

    const removedVariants = existingVariants.filter(
      (existingVariant: { id: string }) => !payload.variants.some((variant) => variant.id === existingVariant.id)
    );

    if (removedVariants.length > 0) {
      await ProductVariant.deleteMany({ id: { $in: removedVariants.map((variant: { id: string }) => variant.id) } });
    }

    for (let index = 0; index < payload.variants.length; index += 1) {
      const variantInput = payload.variants[index];
      const variantPayload = preparedVariantsForSave[index];

      if (variantInput.id) {
        await ProductVariant.updateOne({ id: variantInput.id, product_id: resolvedProductId }, { $set: variantPayload });
      } else {
        await ProductVariant.create({
          product_id: resolvedProductId,
          ...variantPayload,
          created_at: now,
        });
      }
    }

    return {
      productId: resolvedProductId,
      removedMediaUrls: removedVariants.flatMap((variant: { images?: string[] }) => variant.images ?? []),
    };
  } catch (error) {
    if (!productId && resolvedProductId) {
      await ProductVariant.deleteMany({ product_id: resolvedProductId });
      await Product.deleteOne({ id: resolvedProductId });
    }

    const message = error instanceof Error ? error.message : "Urun kaydi tamamlanamadi";

    if (message.includes("duplicate key")) {
      if (message.includes("sku")) {
        throw new Error("Bu SKU zaten kullaniliyor");
      }

      if (message.includes("option_signature")) {
        throw new Error("Ayni urun icin ayni varyant kombinasyonu tekrar edemez");
      }

      if (message.includes("slug")) {
        throw new Error("Bu urun slug'i zaten kullaniliyor");
      }
    }

    throw error;
  }
}
