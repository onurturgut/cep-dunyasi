import { NextResponse } from "next/server";
import { getPublishedCorporatePageBySlug } from "@/server/services/corporate-pages";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const data = await getPublishedCorporatePageBySlug(slug);

    if (!data) {
      return NextResponse.json({ data: null, error: { message: "Sayfa bulunamadı" } }, { status: 404 });
    }

    return NextResponse.json(
      { data, error: null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sayfa getirilemedi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}

