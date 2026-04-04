import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { connectToDatabase } from "@/server/mongodb";
import { deleteSocialProofItem, listAdminSocialProofItems, upsertSocialProofItem } from "@/server/services/marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_campaigns");
    const data = await listAdminSocialProofItems();
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Sosyal kanit ogeleri getirilemedi");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_campaigns");
    const data = await upsertSocialProofItem(await request.json(), adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz sosyal kanit ogesi" } }, { status: 400 });
    }

    return handleAdminRouteError(error, "Sosyal kanit ogesi kaydedilemedi");
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_campaigns");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      throw new Error("Silinecek sosyal kanit ogesi secilmedi");
    }
    const data = await deleteSocialProofItem(id, adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Sosyal kanit ogesi silinemedi");
  }
}
