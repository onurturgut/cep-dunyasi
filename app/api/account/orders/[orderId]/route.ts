import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { getMyOrderDetail } from "@/server/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    await connectToDatabase();
    const data = await getMyOrderDetail(orderId, getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Siparis detayi getirilemedi");
  }
}
