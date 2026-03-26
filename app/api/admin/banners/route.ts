import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { deleteBannerCampaign, listBannerCampaigns, upsertBannerCampaign } from "@/server/services/admin";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_campaigns");
    const data = await listBannerCampaigns();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Bannerlar getirilemedi");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_campaigns");
    const data = await upsertBannerCampaign(await request.json(), adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Banner kaydi tamamlanamadi");
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_campaigns");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      throw new Error("Banner secimi zorunludur");
    }
    const data = await deleteBannerCampaign(id, adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Banner silinemedi");
  }
}
