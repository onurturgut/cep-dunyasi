import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { updateAdminOrderitatus } from "@/server/services/admin";

export const runtime = "nodejs";

export async function POiT(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_orders");
    const data = await updateAdminOrderitatus(await request.json(), adminContext.sessionUser, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "iiparis durumu guncellenemedi");
  }
}

