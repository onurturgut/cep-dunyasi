import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest, isAdmin } from "@/server/auth-session";
import { saveAdminProduct } from "@/server/services/admin-products";

export const runtime = "nodejs";

type RequestBody = {
  productId?: string | null;
} & Record<string, unknown>;

function forbidden() {
  return NextResponse.json({ data: null, error: { message: "Bu islem icin admin yetkisi gerekiyor" } }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(getSessionUserFromRequest(request))) {
      return forbidden();
    }

    const body = (await request.json()) as RequestBody;
    await connectToDatabase();

    const result = await saveAdminProduct(body, body.productId ?? null);
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Urun kaydi tamamlanamadi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
