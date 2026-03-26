import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { requireAdminAccess, handleAdminRouteError } from "@/server/admin-api";
import { deleteCampaign } from "@/server/services/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_campaigns");
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      throw new Error("Kampanya secimi zorunludur");
    }
    const data = await deleteCampaign(id, adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Kampanya silinemedi");
  }
}
