import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { listAdminOrders } from "@/server/services/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_orders");
    const { searchParams } = new URL(request.url);
    const data = await listAdminOrders({
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "all",
      paymentStatus: searchParams.get("paymentStatus") ?? "all",
    });
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Siparis listesi getirilemedi");
  }
}
