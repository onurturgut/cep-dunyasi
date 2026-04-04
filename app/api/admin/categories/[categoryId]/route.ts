import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { deleteAdminCategory, upsertAdminCategory } from "@/server/services/admin-categories";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    categoryId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_products");
    const { categoryId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const data = await upsertAdminCategory(body, adminContext.sessionUser, categoryId, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Kategori guncellenemedi");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_products");
    const { categoryId } = await context.params;
    const data = await deleteAdminCategory(categoryId, adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Kategori silinemedi");
  }
}
