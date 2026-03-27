import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { requireAdminAccess, handleAdminRouteError } from "@/server/admin-api";
import { listCorporatePages } from "@/server/services/corporate-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_site_content");
    const data = await listCorporatePages();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Kurumsal sayfalar getirilemedi");
  }
}
