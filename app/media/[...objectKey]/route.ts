import { NextResponse } from "next/server";
import { getR2ObjectByKey } from "@/server/storage/r2";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    objectKey: string[];
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const objectKey = Array.isArray(params.objectKey) ? params.objectKey.join("/") : "";

    if (!objectKey) {
      return new NextResponse("Missing object key", { status: 400 });
    }

    const object = await getR2ObjectByKey(objectKey);
    const body = object.Body;

    if (!body) {
      return new NextResponse("Not found", { status: 404 });
    }

    const stream =
      typeof (body as any).transformToWebStream === "function"
        ? (body as any).transformToWebStream()
        : NextResponse.json({ error: "Unsupported stream body" }, { status: 500 }).body;

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": object.ContentType || "application/octet-stream",
        "Cache-Control": object.CacheControl || "public, max-age=31536000, immutable",
        ...(object.ETag ? { ETag: object.ETag } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media fetch failed";
    const status = /NoSuchKey/i.test(message) ? 404 : 500;
    return new NextResponse(message, { status });
  }
}
