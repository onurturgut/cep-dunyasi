import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Product, ProductVariant } from "@/server/models";
import {
  buildVariantAttributes,
  buildVariantOptionSignature,
  getProductStartingPrice,
  normalizeProductVariant,
} from "@/lib/product-variants";

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

const adminVariantSchema = z
  .object({
    id: optionalTrimmedStringSchema,
    color_name: z.string().trim().min(1, "Varyant renk adi zorunlu"),
    color_code: optionalTrimmedStringSchema,
    storage: z.string().trim().min(1, "Varyant depolama alani zorunlu"),
    ram: optionalTrimmedStringSchema,
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
  variants: z.array(adminVariantSchema).min(1, "En az bir varyant eklemelisiniz"),
});

export type AdminProductPayload = z.infer<typeof adminProductSchema>;

type AdminProductSaveResult = {
  productId: string;
  removedMediaUrls: string[];
};

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

function validateUniqueVariants(variants: AdminProductPayload["variants"]) {
  const skuSet = new Set<string>();
  const signatureSet = new Set<string>();

  for (const variant of variants) {
    const normalizedSku = variant.sku.trim().toLocaleUpperCase("en-US");
    const signature = buildVariantOptionSignature({
      colorName: variant.color_name,
      storage: variant.storage,
      ram: variant.ram,
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

function buildVariantDocument(productId: string, variant: AdminProductPayload["variants"][number], index: number) {
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
    }),
    attributes: buildVariantAttributes({
      colorName: variant.color_name,
      storage: variant.storage,
      ram: variant.ram,
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
  validateUniqueVariants(payload.variants);

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
  const preparedVariants = payload.variants.map((variant, index) => buildVariantDocument(provisionalProductId, variant, index));
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
      buildVariantDocument(resolvedProductId, variant, index)
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
