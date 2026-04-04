import { z } from "zod";
import { Category } from "@/server/models";
import type { AdminActor } from "@/lib/admin";
import { sanitizeSlug } from "@/lib/utils";
import { createAuditLog } from "@/server/services/admin";

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parent_category_id?: string | null;
  icon?: string | null;
  description?: string | null;
  image_url?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
};

const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Kategori adi zorunlu").max(120, "Kategori adi en fazla 120 karakter olabilir"),
  slug: z.string().trim().max(160, "Slug en fazla 160 karakter olabilir").optional().default(""),
  parent_category_id: z.string().trim().optional().nullable(),
  icon: z.string().trim().max(80, "Ikon adi en fazla 80 karakter olabilir").optional().nullable(),
  description: z.string().trim().max(1000, "Aciklama en fazla 1000 karakter olabilir").optional().nullable(),
  image_url: z.string().trim().max(2048, "Gorsel URL en fazla 2048 karakter olabilir").optional().nullable(),
});

function toIsoString(value: string | Date | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function mapCategoryRecord(category: CategoryRecord) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent_category_id: category.parent_category_id ?? null,
    icon: category.icon ?? null,
    description: category.description ?? null,
    image_url: category.image_url ?? null,
    created_at: toIsoString(category.created_at),
    updated_at: toIsoString(category.updated_at),
  };
}

export async function listAdminCategories() {
  const categories = (await Category.find().sort({ created_at: -1 }).lean()) as CategoryRecord[];
  return categories.map(mapCategoryRecord);
}

export async function upsertAdminCategory(
  input: z.input<typeof categoryInputSchema>,
  actor: AdminActor,
  categoryId?: string | null,
  ip?: string | null,
) {
  const payload = categoryInputSchema.parse(input);
  const normalizedSlug = sanitizeSlug(payload.slug || payload.name);
  const parentCategoryId = payload.parent_category_id?.trim() ? payload.parent_category_id.trim() : null;
  const now = new Date();

  if (!normalizedSlug) {
    throw new Error("Kategori icin gecerli bir slug olusturulamadi");
  }

  if (categoryId && parentCategoryId === categoryId) {
    throw new Error("Kategori kendisine baglanamaz");
  }

  const existingCategory = categoryId ? ((await Category.findOne({ id: categoryId }).lean()) as CategoryRecord | null) : null;
  if (categoryId && !existingCategory) {
    throw new Error("Kategori bulunamadi");
  }

  const conflictingCategory = (await Category.findOne({
    slug: normalizedSlug,
    ...(categoryId ? { id: { $ne: categoryId } } : {}),
  }).lean()) as CategoryRecord | null;

  if (conflictingCategory) {
    throw new Error("Bu slug baska bir kategori tarafindan kullaniliyor");
  }

  if (parentCategoryId) {
    const parentCategory = (await Category.findOne({ id: parentCategoryId }).lean()) as CategoryRecord | null;

    if (!parentCategory) {
      throw new Error("Secilen ana kategori bulunamadi");
    }

    if (parentCategory.parent_category_id) {
      throw new Error("Alt kategori icin sadece ust seviye bir ana kategori secilebilir");
    }
  }

  if (categoryId && parentCategoryId) {
    const hasChildren = await Category.exists({ parent_category_id: categoryId });
    if (hasChildren) {
      throw new Error("Alt kategorileri olan bir ana kategori, alt kategoriye donusturulemez");
    }
  }

  const updatePayload = {
    name: payload.name.trim(),
    slug: normalizedSlug,
    parent_category_id: parentCategoryId,
    icon: payload.icon?.trim() || null,
    description: payload.description?.trim() || "",
    image_url: payload.image_url?.trim() || "",
    updated_at: now,
  };

  let entityId = categoryId ?? null;
  if (categoryId) {
    await Category.updateOne({ id: categoryId }, { $set: updatePayload });
  } else {
    const created = await Category.create({ ...updatePayload, created_at: now });
    entityId = created.id as string;
  }

  await createAuditLog({
    actor,
    actionType: categoryId ? "category.updated" : "category.created",
    entityType: "category",
    entityId,
    message: categoryId ? "Kategori guncellendi" : "Kategori olusturuldu",
    metadata: {
      name: updatePayload.name,
      slug: updatePayload.slug,
      parentCategoryId: updatePayload.parent_category_id,
    },
    ip,
  });

  return listAdminCategories();
}

export async function deleteAdminCategory(id: string, actor: AdminActor, ip?: string | null) {
  const category = (await Category.findOne({ id }).lean()) as CategoryRecord | null;

  if (!category) {
    throw new Error("Kategori bulunamadi");
  }

  const hasChildren = await Category.exists({ parent_category_id: id });
  if (hasChildren) {
    throw new Error("Bu kategoriye bagli alt kategoriler var. Once alt kategorileri silin veya tasiyin.");
  }

  await Category.deleteOne({ id });

  await createAuditLog({
    actor,
    actionType: "category.deleted",
    entityType: "category",
    entityId: id,
    message: "Kategori silindi",
    metadata: {
      name: category.name,
      slug: category.slug,
    },
    ip,
  });

  return { deleted: true };
}
