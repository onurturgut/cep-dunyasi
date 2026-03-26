import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { markReviewHelpful } from "@/server/services/reviews";

export const runtime = "nodejs";

const helpfulRequestSchema = z.object({
  reviewId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const body = helpfulRequestSchema.parse(await request.json());
    await connectToDatabase();

    const result = await markReviewHelpful(body, getSessionUserFromRequest(request));
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz istek" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Faydali oyu kaydedilemedi";
    const status = message.includes("giris yapmaniz gerekiyor") ? 401 : 400;
    return NextResponse.json({ data: null, error: { message } }, { status });
  }
}
