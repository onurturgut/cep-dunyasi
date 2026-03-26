import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { listLowStockProducts } from "@/server/services/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_products");
    const { searchParams } = new URL(request.url);
    const filter = `${searchParams.get("filter") ?? "all"}` as Parameters<typeof listLowStockProducts>[0];
    const threshold = Number(searchParams.get("threshold") ?? 5);
    const limit = searchParams.get("limit");
    const data = await listLowStockProducts(filter, threshold, limit ? Number(limit) : undefined);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Dusuk stok verileri getirilemedi");
  }
}
