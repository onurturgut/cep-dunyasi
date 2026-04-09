import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { saveAdminProduct } from "@/server/services/admin-products";
import { createAuditLog } from "@/server/services/admin";

export const runtime = "nodejs";

type RequestBody = {
  productId?: string | null;
} & Record<string, unknown>;

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const adminContext = await requireAdminAccess(request, "manage_products");
    const body = (await request.json()) as RequestBody;

    const result = await saveAdminProduct(body, body.productId ?? null);
    await createAuditLog({
      actor: adminContext.sessionUser,
      actionType: body.productId ? "product.updated" : "product.created",
      entityType: "product",
      entityId: result.productId,
      message: body.productId ? "Ürün güncellendi" : "Ürün oluşturuldu",
      metadata: { productId: result.productId },
      ip: request.headers.get("x-forwarded-for"),
    });
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Ürün kaydi tamamlanamadi");
  }
}


