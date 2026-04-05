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
import { normalizeMediaUrl } from "@/server/storage/r2";
import { getSessionUserFromRequest, hasPermission, isAdmin, type SessionUser } from "@/server/auth-session";
import { type AdminPermission } from "@/lib/admin";
import { normalizeProductVariants, sortProductVariants } from "@/lib/product-variants";
import { createRequestTimer } from "@/server/observability/request-timing";

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

const ADMIN_ONLY_SELECT_TABLES = new Set<DbTableName>([
  "order_items",
  "shipments",
  "technical_service_requests",
  "users",
  "product_reviews",
  "banner_campaigns",
  "audit_logs",
]);

const TABLE_PERMISSION_MAP: Partial<Record<DbTableName, AdminPermission>> = {
  products: "manage_products",
  product_variants: "manage_products",
  categories: "manage_products",
  coupons: "manage_campaigns",
  orders: "manage_orders",
  order_items: "manage_orders",
  shipments: "manage_shipments",
  mission_items: "manage_site_content",
  site_contents: "manage_site_content",
  technical_service_requests: "manage_technical_service",
  users: "manage_users",
  product_reviews: "manage_products",
  banner_campaigns: "manage_campaigns",
  audit_logs: "view_logs",
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status });
}

function hasTablePermission(table: DbTableName, sessionUser: SessionUser | null) {
  if (!isAdmin(sessionUser)) {
    return false;
  }

  const requiredPermission = TABLE_PERMISSION_MAP[table];
  if (!requiredPermission) {
    return true;
  }

  return hasPermission(sessionUser, requiredPermission);
}

function canMutate(payload: QueryPayload, sessionUser: SessionUser | null) {
  if (payload.table === "audit_logs") {
    return false;
  }

  return hasTablePermission(payload.table, sessionUser);
}

function normalizeEntity(entity: any) {
  if (!entity) {
    return entity;
  }

  if (Array.isArray(entity)) {
    return entity.map((item) => normalizeEntity(item));
  }

  if (entity instanceof Date) {
    return entity.toISOString();
  }

  if (typeof entity === "string") {
    return normalizeMediaUrl(entity);
  }

  if (typeof entity !== "object") {
    return entity;
  }

  const { _id, __v, ...rest } = entity;
  return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, normalizeEntity(value)]));
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

function getProjection(selectClause?: string) {
  const clause = `${selectClause ?? "*"}`.trim();

  if (!clause || clause === "*") {
    return null;
  }

  const projection: Record<string, 1> = {};

  for (const segment of clause.split(",")) {
    const token = segment.trim();

    if (!token || token === "*" || token.includes("(") || token.includes(")")) {
      continue;
    }

    projection[token] = 1;
  }

  return Object.keys(projection).length > 0 ? projection : null;
}

async function attachProductRelations(products: any[], selectClause: string, admin: boolean) {
  if (products.length === 0) {
    return products;
  }

  const withVariants = selectClause.includes("product_variants");
  const withCategories = selectClause.includes("categories");

  let variantsByProductId = new Map<string, any[]>();
  let categoriesById = new Map<string, any>();

  if (withVariants) {
    const productIds = products.map((product) => product.id);
    const rawVariants = normalizeEntity(await ProductVariant.find({ product_id: { $in: productIds } }).lean());
    const variants = sortProductVariants(normalizeProductVariants(rawVariants)).filter((variant) =>
      admin ? true : variant.is_active
    );
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

  if (
    table === "products" ||
    table === "product_variants" ||
    table === "shipments" ||
    table === "mission_items" ||
    table === "site_contents" ||
    table === "categories" ||
    table === "technical_service_requests"
  ) {
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
  if (["products", "product_variants", "orders", "shipments", "mission_items", "site_contents", "categories", "technical_service_requests"].includes(table)) {
    return {
      ...data,
      updated_at: new Date(),
    };
  }

  return data;
}

export async function POST(request: Request) {
  const timer = createRequestTimer("POST /api/db/query");
  let payload: QueryPayload | null = null;

  try {
    payload = (await request.json()) as QueryPayload;
    timer.mark("parse-body");

    if (!payload?.table || !payload?.action) {
      const response = NextResponse.json({ data: null, error: { message: "Invalid query payload" } }, { status: 400, headers: timer.headers() });
      timer.log({ error: "invalid-payload" });
      return response;
    }

    const sessionUser = getSessionUserFromRequest(request);
    const admin = isAdmin(sessionUser);
    timer.mark("resolve-auth");

    if (payload.action !== "select" && !canMutate(payload, sessionUser)) {
      const response = jsonError("Bu işlem için admin yetkisi gerekiyor", 403);
      response.headers.set("Server-Timing", timer.toServerTimingValue());
      timer.log({ table: payload.table, action: payload.action, error: "forbidden" });
      return response;
    }

    if (payload.action === "select" && ADMIN_ONLY_SELECT_TABLES.has(payload.table) && !hasTablePermission(payload.table, sessionUser)) {
      const response = jsonError("Bu veriye erisim yetkiniz yok", 403);
      response.headers.set("Server-Timing", timer.toServerTimingValue());
      timer.log({ table: payload.table, action: payload.action, error: "forbidden-select" });
      return response;
    }

    await connectToDatabase();
    timer.mark("db-connect");

    const model = tableModelMap[payload.table];

    if (!model) {
      const response = NextResponse.json({ data: null, error: { message: "Table is not supported" } }, { status: 400, headers: timer.headers() });
      timer.log({ table: payload.table, action: payload.action, error: "unsupported-table" });
      return response;
    }

    const filters = payload.filters ?? [];
    const mongoQuery = buildMongoQuery(filters);

    if (payload.table === "orders" && payload.action === "select" && !admin) {
      if (!sessionUser?.id) {
        const response = jsonError("Siparişleri görmek için giriş yapmanız gerekiyor", 401);
        response.headers.set("Server-Timing", timer.toServerTimingValue());
        timer.log({ table: payload.table, action: payload.action, error: "unauthorized-orders" });
        return response;
      }

      mongoQuery.user_id = sessionUser.id;
    }

    if (payload.action === "select") {
      const shouldReturnCount = payload.count === "exact";
      const count = shouldReturnCount ? await model.countDocuments(mongoQuery) : null;
      if (shouldReturnCount) {
        timer.mark("count-documents");
      }

      if (payload.head) {
        const response = NextResponse.json({ data: null, error: null, count }, { headers: timer.headers() });
        timer.log({ table: payload.table, action: payload.action, head: true, filters: filters.length });
        return response;
      }

      const projection = getProjection(payload.select);
      let query = model.find(mongoQuery, projection);

      if (payload.order?.field) {
        query = query.sort({ [payload.order.field]: payload.order.ascending ? 1 : -1 });
      }

      if (typeof payload.limit === "number") {
        query = query.limit(payload.limit);
      }

      let data = normalizeEntity(await query.lean());
      timer.mark("find-documents");

      if (payload.table === "products") {
        data = await attachProductRelations(data, payload.select ?? "*", admin);
        timer.mark("attach-product-relations");
      }

      if (payload.table === "product_variants") {
        const normalizedVariants = sortProductVariants(normalizeProductVariants(data));
        data = admin ? normalizedVariants : normalizedVariants.filter((variant) => variant.is_active);
        timer.mark("normalize-variants");
      }

      if (payload.table === "orders") {
        data = await attachOrderRelations(data, payload.select ?? "*");
        timer.mark("attach-order-relations");
      }

      if (payload.single) {
        data = data[0] ?? null;
      }

      const response = NextResponse.json({ data, error: null, count }, { headers: timer.headers() });
      timer.log({ table: payload.table, action: payload.action, filters: filters.length, single: Boolean(payload.single) });
      return response;
    }

    if (payload.action === "insert") {
      const inputItems = Array.isArray(payload.data) ? payload.data : [payload.data];
      const docsToInsert = inputItems.filter(Boolean).map((item) => withDefaults(payload.table, item));

      if (docsToInsert.length === 0) {
        const response = NextResponse.json({ data: null, error: { message: "Insert payload is empty" } }, { status: 400, headers: timer.headers() });
        timer.log({ table: payload.table, action: payload.action, error: "empty-insert" });
        return response;
      }

      const inserted = normalizeEntity(await model.insertMany(docsToInsert));
      timer.mark("insert-many");
      const prepared = Array.isArray(payload.data) ? inserted : inserted[0] ?? null;

      if (payload.single) {
        const response = NextResponse.json({ data: Array.isArray(prepared) ? prepared[0] ?? null : prepared, error: null }, { headers: timer.headers() });
        timer.log({ table: payload.table, action: payload.action, count: docsToInsert.length, single: true });
        return response;
      }

      const response = NextResponse.json({ data: prepared, error: null }, { headers: timer.headers() });
      timer.log({ table: payload.table, action: payload.action, count: docsToInsert.length });
      return response;
    }

    if (payload.action === "update") {
      const updatePayload = withUpdatedAt(payload.table, payload.data ?? {});
      await model.updateMany(mongoQuery, { $set: updatePayload });
      timer.mark("update-many");

      const updatedRows = normalizeEntity(await model.find(mongoQuery).lean());
      timer.mark("load-updated-rows");
      const data = payload.single ? updatedRows[0] ?? null : updatedRows;

      const response = NextResponse.json({ data, error: null }, { headers: timer.headers() });
      timer.log({ table: payload.table, action: payload.action, single: Boolean(payload.single) });
      return response;
    }

    if (payload.action === "delete") {
      const deletingRows = normalizeEntity(await model.find(mongoQuery).lean());
      timer.mark("load-deleting-rows");
      await model.deleteMany(mongoQuery);
      timer.mark("delete-many");

      if (payload.table === "products") {
        const productIds = deletingRows.map((row: any) => row.id);
        if (productIds.length > 0) {
          await ProductVariant.deleteMany({ product_id: { $in: productIds } });
          timer.mark("delete-product-variants");
        }
      }

      if (payload.table === "orders") {
        const orderIds = deletingRows.map((row: any) => row.id);
        if (orderIds.length > 0) {
          await OrderItem.deleteMany({ order_id: { $in: orderIds } });
          await Shipment.deleteMany({ order_id: { $in: orderIds } });
          timer.mark("delete-order-relations");
        }
      }

      const response = NextResponse.json({ data: deletingRows, error: null }, { headers: timer.headers() });
      timer.log({ table: payload.table, action: payload.action, count: deletingRows.length });
      return response;
    }

    const response = NextResponse.json({ data: null, error: { message: "Unsupported action" } }, { status: 400, headers: timer.headers() });
    timer.log({ table: payload.table, action: payload.action, error: "unsupported-action" });
    return response;
  } catch (error) {
    timer.mark("error");
    const message = error instanceof Error ? error.message : "Unknown database error";
    const response = NextResponse.json({ data: null, error: { message } }, { status: 500, headers: timer.headers() });
    timer.log({ table: payload?.table ?? "unknown", action: payload?.action ?? "unknown", error: message });
    return response;
  }
}
