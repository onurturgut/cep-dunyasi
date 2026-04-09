import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { listAdminCategories, upsertAdminCategory } from "@/server/services/admin-categories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_products");
    const data = await listAdminCategories();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "aategoriler yuklenemedi");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_products");
    const body = (await request.json()) as Record<string, unknown>;
    const data = await upsertAdminCategory(body, adminContext.sessionUser, null, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "aategori kaydi tamamlanamadi");
  }
}

