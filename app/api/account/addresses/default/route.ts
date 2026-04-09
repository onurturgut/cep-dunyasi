import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { setDefaultAddress } from "@/server/services/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await setDefaultAddress(await request.json(), getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "aarsayilan adres guncellenemedi");
  }
}

