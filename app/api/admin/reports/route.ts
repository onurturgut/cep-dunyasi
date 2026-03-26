import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { getSalesReport } from "@/server/services/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "view_reports");
    const { searchParams } = new URL(request.url);
    const data = await getSalesReport({
      preset: `${searchParams.get("preset") ?? "30d"}` as Parameters<typeof getSalesReport>[0]["preset"],
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Rapor verileri getirilemedi");
  }
}
