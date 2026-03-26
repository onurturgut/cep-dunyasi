import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { exportProductsCsv } from "@/server/services/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_import_export");
    const csv = await exportProductsCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="products-export.csv"',
        "Cache-Control": "no-store",
        "X-Export-Actor": adminContext.sessionUser.id,
      },
    });
  } catch (error) {
    return handleAdminRouteError(error, "CSV disa aktarma tamamlanamadi");
  }
}
