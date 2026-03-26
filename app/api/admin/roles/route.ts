import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { getRoleAndPermissionMatrix, listAdminUsers, updateAdminUserAccess } from "@/server/services/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_roles");
    const users = await listAdminUsers({ page: 1, limit: 100, status: "all" });
    const matrix = getRoleAndPermissionMatrix();
    return NextResponse.json({ data: { ...matrix, users: users.items }, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Rol ve yetki matrisi getirilemedi");
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_roles");
    const data = await updateAdminUserAccess(await request.json(), adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Rol atama islemi basarisiz oldu");
  }
}
