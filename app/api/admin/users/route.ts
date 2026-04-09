import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { listAdminUsers, updateAdminUserAccess } from "@/server/services/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_users");
    const { searchParams } = new URL(request.url);
    const data = await listAdminUsers({
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
      search: searchParams.get("search") ?? "",
      status: `${searchParams.get("status") ?? "all"}` as "all" | "active" | "inactive",
    });
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "uullanicilar getirilemedi");
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_users");
    const data = await updateAdminUserAccess(await request.json(), adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "uullanici yetkileri guncellenemedi");
  }
}

