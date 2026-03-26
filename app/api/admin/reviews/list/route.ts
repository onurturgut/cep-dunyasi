import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest, isAdmin } from "@/server/auth-session";
import { listReviews } from "@/server/services/reviews";

export const runtime = "nodejs";

const adminListReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["all", "pending", "approved"]).default("pending"),
  productId: z.string().trim().min(1).optional(),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "highest", "lowest", "most_helpful"]).default("newest"),
});

function forbidden() {
  return NextResponse.json({ data: null, error: { message: "Bu islem icin admin yetkisi gerekiyor" } }, { status: 403 });
}

export async function GET(request: Request) {
  try {
    if (!isAdmin(getSessionUserFromRequest(request))) {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const params = adminListReviewsQuerySchema.parse({
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "20",
      status: searchParams.get("status") ?? "pending",
      productId: searchParams.get("productId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? "newest",
    });

    await connectToDatabase();
    const result = await listReviews({ ...params, admin: true }, getSessionUserFromRequest(request));
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz filtreler" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Admin yorumlari getirilemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
