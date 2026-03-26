import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { getAdminDashboardData } from "@/server/services/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "view_reports");
    const { searchParams } = new URL(request.url);
    const preset = `${searchParams.get("preset") ?? "30d"}` as Parameters<typeof getAdminDashboardData>[0]["preset"];
    const data = await getAdminDashboardData({
      preset,
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Dashboard verileri getirilemedi");
  }
}
