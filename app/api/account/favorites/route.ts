import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { listMyFavorites, toggleMyFavorite } from "@/server/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  productId: z.string().trim().min(1, "Ürün secimi zorunludur"),
});

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const data = await listMyFavorites(getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Favoriler getirilemedi");
  }
}

export async function POST(request: Request) {
  try {
    const payload = toggleSchema.parse(await request.json());
    await connectToDatabase();
    const data = await toggleMyFavorite(payload.productId, getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Favori islemi tamamlanamadi");
  }
}

