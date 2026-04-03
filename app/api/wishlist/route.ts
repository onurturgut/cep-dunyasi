import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { createRequestTimer } from "@/server/observability/request-timing";
import { listWishlist, toggleWishlist } from "@/server/services/wishlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const wishlistToggleRequestSchema = z.object({
  productId: z.string().trim().min(1),
});

export async function GET(request: Request) {
  const timer = createRequestTimer("GET /api/wishlist");
  try {
    await connectToDatabase();
    timer.mark("db-connect");
    const result = await listWishlist(getSessionUserFromRequest(request));
    timer.mark("load-wishlist");

    const response = NextResponse.json(
      { data: result, error: null },
      {
        headers: timer.headers({
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        }),
      }
    );

    timer.log({ count: result.productIds.length });
    return response;
  } catch (error) {
    timer.mark("error");
    const message = error instanceof Error ? error.message : "Favoriler getirilemedi";
    const status = message.includes("giris yapmaniz gerekiyor") ? 401 : 400;
    const response = NextResponse.json({ data: null, error: { message } }, { status, headers: timer.headers() });
    timer.log({ error: message });
    return response;
  }
}

export async function POST(request: Request) {
  const timer = createRequestTimer("POST /api/wishlist");
  try {
    const body = wishlistToggleRequestSchema.parse(await request.json());
    timer.mark("parse-body");
    await connectToDatabase();
    timer.mark("db-connect");
    const result = await toggleWishlist(body, getSessionUserFromRequest(request));
    timer.mark("toggle-wishlist");

    const response = NextResponse.json({ data: result, error: null }, { headers: timer.headers() });
    timer.log({ productId: result.productId, count: result.count });
    return response;
  } catch (error) {
    timer.mark("error");
    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { data: null, error: { message: error.issues[0]?.message || "Gecersiz favori istegi" } },
        { status: 400, headers: timer.headers() },
      );
      timer.log({ error: "validation" });
      return response;
    }

    const message = error instanceof Error ? error.message : "Favori islemi tamamlanamadi";
    const status = message.includes("giris yapmaniz gerekiyor") ? 401 : 400;
    const response = NextResponse.json({ data: null, error: { message } }, { status, headers: timer.headers() });
    timer.log({ error: message });
    return response;
  }
}
