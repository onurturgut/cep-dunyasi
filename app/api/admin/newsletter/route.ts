import { NextResponse } from "next/server";
import { z } from "zod";
import { handleAdminRouteError, requireAdminAccess } from "@/server/admin-api";
import { connectToDatabase } from "@/server/mongodb";
import { listNewsletterSubscribers } from "@/server/services/marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireAdminAccess(request, "manage_campaigns");
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "20",
      search: searchParams.get("search"),
    });
    const data = await listNewsletterSubscribers(params);
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAdminRouteError(error, "Newsletter aboneleri getirilemedi");
  }
}
