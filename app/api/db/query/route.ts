import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import {
  Category,
  OrderItem,
  ProductVariant,
  Shipment,
  tableModelMap,
  type DbTableName,
} from "@/server/models";
import { ensureSeedData } from "@/server/seed";
import { getSessionUserFromRequest, isAdmin } from "@/server/auth-session";

export const runtime = "nodejs";

type QueryFilter = {
  operator: "eq" | "ilike" | "lt";
  field: string;
  value: unknown;
};

type QueryPayload = {
  table: DbTableName;
  action: "select" | "insert" | "update" | "delete";
  select?: string;
  count?: "exact";
  head?: boolean;
  single?: boolean;
  returning?: boolean;
  filters?: QueryFilter[];
  order?: { field: string; ascending: boolean };
  limit?: number;
  data?: any;
};

const ADMIN_ONLY_SELECT_TABLES = new Set<DbTableName>(["order_items", "shipments"]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status });
}

function canMutate(payload: QueryPayload, admin: boolean) {
  return admin;
}

function normalizeEntity(entity: any) {
  if (!entity) {
    return entity;
  }

  if (Array.isArray(entity)) {
    return entity.map((item) => normalizeEntity(item));
  }

  const { _id, __v, ...rest } = entity;
  return rest;
}

function likePatternToRegex(value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

function buildMongoQuery(filters: QueryFilter[]) {
  const query: Record<string, any> = {};

  for (const filter of filters) {
    if (filter.operator === "eq") {
      query[filter.field] = filter.value;
    }

    if (filter.operator === "ilike") {
      query[filter.field] = { $regex: likePatternToRegex(String(filter.value ?? "")) };
    }

    if (filter.operator === "lt") {
      query[filter.field] = {
        ...(query[filter.field] ?? {}),
        $lt: filter.value,
      };
    }
  }

  return query;
}

async function attachProductRelations(products: any[], selectClause: string) {
  if (products.length === 0) {
    return products;
  }

  const withVariants = selectClause.includes("product_variants");
  const withCategories = selectClause.includes("categories");

  let variantsByProductId = new Map<string, any[]>();
  let categoriesById = new Map<string, any>();

  if (withVariants) {
    const productIds = products.map((product) => product.id);
    const variants = normalizeEntity(await ProductVariant.find({ product_id: { $in: productIds } }).lean());
    variantsByProductId = new Map<string, any[]>();

    for (const variant of variants) {
      const arr = variantsByProductId.get(variant.product_id) ?? [];
      arr.push(variant);
      variantsByProductId.set(variant.product_id, arr);
    }
  }

  if (withCategories) {
    const categoryIds = [...new Set(products.map((product) => product.category_id).filter(Boolean))];
    const categories = normalizeEntity(await Category.find({ id: { $in: categoryIds } }).lean());
    categoriesById = new Map<string, any>(categories.map((category: any) => [category.id, category]));
  }

  return products.map((product) => ({
    ...product,
    ...(withVariants ? { product_variants: variantsByProductId.get(product.id) ?? [] } : {}),
    ...(withCategories ? { categories: categoriesById.get(product.category_id) ?? null } : {}),
  }));
}

async function attachOrderRelations(orders: any[], selectClause: string) {
  if (orders.length === 0 || !selectClause.includes("order_items")) {
    return orders;
  }

  const orderIds = orders.map((order) => order.id);
  const orderItems = normalizeEntity(await OrderItem.find({ order_id: { $in: orderIds } }).lean());
  const itemsByOrderId = new Map<string, any[]>();

  for (const item of orderItems) {
    const arr = itemsByOrderId.get(item.order_id) ?? [];
    arr.push(item);
    itemsByOrderId.set(item.order_id, arr);
  }

  return orders.map((order) => ({
    ...order,
    order_items: itemsByOrderId.get(order.id) ?? [],
  }));
}

function withDefaults(table: DbTableName, data: Record<string, any>) {
  const now = new Date();

  if (table === "orders") {
    return {
      payment_provider: "iyzico",
      payment_status: "pending",
      order_status: "pending",
      created_at: now,
      updated_at: now,
      ...data,
    };
  }

  if (table === "products" || table === "product_variants" || table === "shipments" || table === "mission_items") {
    return {
      created_at: now,
      updated_at: now,
      ...data,
    };
  }

  return {
    created_at: now,
    ...data,
  };
}

function withUpdatedAt(table: DbTableName, data: Record<string, any>) {
  if (["products", "product_variants", "orders", "shipments", "mission_items"].includes(table)) {
    return {
      ...data,
      updated_at: new Date(),
    };
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as QueryPayload;

    if (!payload?.table || !payload?.action) {
      return NextResponse.json({ data: null, error: { message: "Invalid query payload" } }, { status: 400 });
    }

    const sessionUser = getSessionUserFromRequest(request);
    const admin = isAdmin(sessionUser);

    if (payload.action !== "select" && !canMutate(payload, admin)) {
      return jsonError("Bu islem icin admin yetkisi gerekiyor", 403);
    }

    if (payload.action === "select" && ADMIN_ONLY_SELECT_TABLES.has(payload.table) && !admin) {
      return jsonError("Bu veriye erisim yetkiniz yok", 403);
    }

    await connectToDatabase();
    await ensureSeedData();

    const model = tableModelMap[payload.table];

    if (!model) {
      return NextResponse.json({ data: null, error: { message: "Table is not supported" } }, { status: 400 });
    }

    const filters = payload.filters ?? [];
    const mongoQuery = buildMongoQuery(filters);

    if (payload.table === "orders" && payload.action === "select" && !admin) {
      if (!sessionUser?.id) {
        return jsonError("Siparisleri gormek icin giris yapmaniz gerekiyor", 401);
      }

      mongoQuery.user_id = sessionUser.id;
    }

    if (payload.action === "select") {
      const shouldReturnCount = payload.count === "exact";
      const count = shouldReturnCount ? await model.countDocuments(mongoQuery) : null;

      if (payload.head) {
        return NextResponse.json({ data: null, error: null, count });
      }

      let query = model.find(mongoQuery);

      if (payload.order?.field) {
        query = query.sort({ [payload.order.field]: payload.order.ascending ? 1 : -1 });
      }

      if (typeof payload.limit === "number") {
        query = query.limit(payload.limit);
      }

      let data = normalizeEntity(await query.lean());

      if (payload.table === "products") {
        data = await attachProductRelations(data, payload.select ?? "*");
      }

      if (payload.table === "orders") {
        data = await attachOrderRelations(data, payload.select ?? "*");
      }

      if (payload.single) {
        data = data[0] ?? null;
      }

      return NextResponse.json({ data, error: null, count });
    }

    if (payload.action === "insert") {
      const inputItems = Array.isArray(payload.data) ? payload.data : [payload.data];
      const docsToInsert = inputItems.filter(Boolean).map((item) => withDefaults(payload.table, item));

      if (docsToInsert.length === 0) {
        return NextResponse.json({ data: null, error: { message: "Insert payload is empty" } }, { status: 400 });
      }

      const inserted = normalizeEntity(await model.insertMany(docsToInsert));
      const prepared = Array.isArray(payload.data) ? inserted : inserted[0] ?? null;

      if (payload.single) {
        return NextResponse.json({ data: Array.isArray(prepared) ? prepared[0] ?? null : prepared, error: null });
      }

      return NextResponse.json({ data: prepared, error: null });
    }

    if (payload.action === "update") {
      const updatePayload = withUpdatedAt(payload.table, payload.data ?? {});
      await model.updateMany(mongoQuery, { $set: updatePayload });

      const updatedRows = normalizeEntity(await model.find(mongoQuery).lean());
      const data = payload.single ? updatedRows[0] ?? null : updatedRows;

      return NextResponse.json({ data, error: null });
    }

    if (payload.action === "delete") {
      const deletingRows = normalizeEntity(await model.find(mongoQuery).lean());
      await model.deleteMany(mongoQuery);

      if (payload.table === "products") {
        const productIds = deletingRows.map((row: any) => row.id);
        if (productIds.length > 0) {
          await ProductVariant.deleteMany({ product_id: { $in: productIds } });
        }
      }

      if (payload.table === "orders") {
        const orderIds = deletingRows.map((row: any) => row.id);
        if (orderIds.length > 0) {
          await OrderItem.deleteMany({ order_id: { $in: orderIds } });
          await Shipment.deleteMany({ order_id: { $in: orderIds } });
        }
      }

      return NextResponse.json({ data: deletingRows, error: null });
    }

    return NextResponse.json({ data: null, error: { message: "Unsupported action" } }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
