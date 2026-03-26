import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { listWishlist, toggleWishlist } from "@/server/services/wishlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const wishlistToggleRequestSchema = z.object({
  productId: z.string().trim().min(1),
});

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const result = await listWishlist(getSessionUserFromRequest(request));
    return NextResponse.json(
      { data: result, error: null },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Favoriler getirilemedi";
    const status = message.includes("giris yapmaniz gerekiyor") ? 401 : 400;
    return NextResponse.json({ data: null, error: { message } }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = wishlistToggleRequestSchema.parse(await request.json());
    await connectToDatabase();
    const result = await toggleWishlist(body, getSessionUserFromRequest(request));
    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz favori istegi" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Favori islemi tamamlanamadi";
    const status = message.includes("giris yapmaniz gerekiyor") ? 401 : 400;
    return NextResponse.json({ data: null, error: { message } }, { status });
  }
}
