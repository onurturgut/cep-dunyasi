import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { createReview } from "@/server/services/reviews";

export const runtime = "nodejs";

const createReviewRequestSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  comment: z.string().trim().min(5).max(2000),
  images: z.array(z.string().trim().min(1)).max(4).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const body = createReviewRequestSchema.parse(await request.json());
    await connectToDatabase();

    const result = await createReview(body, getSessionUserFromRequest(request));
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz yorum verisi" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Yorum kaydedilemedi";
    const status = message.includes("giris yapmaniz gerekiyor") ? 401 : 400;
    return NextResponse.json({ data: null, error: { message } }, { status });
  }
}
