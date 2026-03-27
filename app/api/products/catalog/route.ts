import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import {
  countCatalogProducts,
  listCatalogProducts,
  normalizeCatalogFilters,
  type CatalogProductsQuery,
} from "@/server/services/catalog-products";

export const runtime = "nodejs";

const requestSchema = z.object({
  mode: z.enum(["list", "count"]).default("list"),
  activeCategory: z.string().trim().nullable().optional().default(null),
  search: z.string().optional().default(""),
  sortBy: z.enum(["newest", "best_selling", "price_asc", "price_desc", "rating_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  filters: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = requestSchema.parse(await request.json());

    const query: CatalogProductsQuery = {
      activeCategory: body.activeCategory,
      search: body.search,
      sortBy: body.sortBy,
      page: body.page,
      limit: body.limit,
      filters: normalizeCatalogFilters(body.filters),
    };

    if (body.mode === "count") {
      const data = await countCatalogProducts(query);
      return NextResponse.json({ data, error: null });
    }

    const data = await listCatalogProducts(query);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Katalog sorgusu tamamlanamadi";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
