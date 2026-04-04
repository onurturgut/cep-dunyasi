import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { connectToDatabase } from "@/server/mongodb";
import { getMarketingSettings, updateMarketingSettings } from "@/server/services/marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_site_content");
    const data = await getMarketingSettings();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Marketing ayarlari getirilemedi");
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_site_content");
    const data = await updateMarketingSettings(await request.json(), adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz marketing ayari" } }, { status: 400 });
    }

    return handleAdminRouteError(error, "Marketing ayarlari kaydedilemedi");
  }
}
