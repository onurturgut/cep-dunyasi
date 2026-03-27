import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { requireAdminAccess, handleAdminRouteError } from "@/server/admin-api";
import { getCorporatePageByKey, parseCorporatePageKey } from "@/server/services/corporate-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ pageKey: string }> }) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_site_content");
    const { pageKey } = await context.params;
    const data = await getCorporatePageByKey(parseCorporatePageKey(pageKey));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Kurumsal sayfa getirilemedi");
  }
}
