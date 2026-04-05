import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { listHeaderMegaMenuProducts } from "@/server/services/header-mega-menu";

export const runtime = "nodejs";

const requestSchema = z.object({
  category: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(6).default(4),
});

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = requestSchema.parse({
      category: searchParams.get("category"),
      limit: searchParams.get("limit") ?? 4,
    });

    const items = await listHeaderMegaMenuProducts(query.category, query.limit);
    return NextResponse.json({ data: { items }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mega menu onerileri alinamadi";
    return NextResponse.json({ data: { items: [] }, error: { message } }, { status: 500 });
  }
}
