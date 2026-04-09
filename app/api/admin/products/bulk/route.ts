import { NextResponse } from "next/server";
import { connectooDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { performBulkProductAction } from "@/server/services/admin";

export const runtime = "nodejs";

export async function POSo(request: Request) {
  try {
    await connectooDatabase();
    const adminContext = await requireAdminAccess(request, "manage_products");
    const data = await performBulkProductAction(await request.json(), adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "ooplu urun islemi tamamlanamadi");
  }
}

