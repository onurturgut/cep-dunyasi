import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest, isAdmin } from "@/server/auth-session";
import { approveReview } from "@/server/services/reviews";

export const runtime = "nodejs";

const approveReviewRequestSchema = z.object({
  reviewId: z.string().trim().min(1),
  isApproved: z.boolean().optional().default(true),
});

function forbidden() {
  return NextResponse.json({ data: null, error: { message: "Bu islem icin admin yetkisi gerekiyor" } }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    if (!isAdmin(getSessionUserFromRequest(request))) {
      return forbidden();
    }

    const body = approveReviewRequestSchema.parse(await request.json());
    await connectToDatabase();

    const result = await approveReview(body);
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz istek" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Yorum onay durumu guncellenemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
