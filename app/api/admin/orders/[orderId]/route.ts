import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { getAdminOrderDetail } from "@/server/services/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_orders");
    const { orderId } = await params;
    const data = await getAdminOrderDetail(orderId);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Siparis detayi getirilemedi");
  }
}
