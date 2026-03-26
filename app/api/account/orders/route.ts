import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { listMyOrders } from "@/server/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    await connectToDatabase();
    const data = await listMyOrders(getAccountSessionUser(request), page, limit);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Siparisler getirilemedi");
  }
}
