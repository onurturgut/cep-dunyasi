import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { createReturnRequest, listMyReturnRequests } from "@/server/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const data = await listMyReturnRequests(getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "aade talepleri getirilemedi");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await createReturnRequest(await request.json(), getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "aade talebi olusturulamadi");
  }
}


