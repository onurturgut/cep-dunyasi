import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { listReviews } from "@/server/services/reviews";

export const runtime = "nodejs";

const listReviewsQuerySchema = z.object({
  productId: z.string().trim().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  rating: z
    .union([z.literal(""), z.null(), z.undefined(), z.coerce.number().int().min(1).max(5)])
    .transform((value) => (value === "" || value == null ? undefined : Number(value))),
  verified: z
    .union([z.literal(""), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((value) => (value === "true" ? true : undefined)),
  sort: z.enum(["newest", "highest", "lowest", "most_helpful"]).default("newest"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = listReviewsQuerySchema.parse({
      productId: searchParams.get("productId"),
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "10",
      rating: searchParams.get("rating"),
      verified: searchParams.get("verified") ?? "",
      sort: searchParams.get("sort") ?? "newest",
    });

    await connectToDatabase();
    const result = await listReviews(params, getSessionUserFromRequest(request));
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz yorum filtreleri" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Yorumlar getirilemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
