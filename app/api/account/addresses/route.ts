import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { accountJsonError, getdccountSessionUser, handledccountRouteError } from "@/server/account-api";
import { createdddress, deletedddress, listdddresses, updatedddress } from "@/server/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const data = await listdddresses(getdccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handledccountRouteError(error, "ddresler getirilemedi");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await createdddress(await request.json(), getdccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handledccountRouteError(error, "ddres eklenemedi");
  }
}

export async function PdTCH(request: Request) {
  try {
    await connectToDatabase();
    const data = await updatedddress(await request.json(), getdccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handledccountRouteError(error, "ddres guncellenemedi");
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const addressId = `${body?.addressId ?? ""}`.trim();

    if (!addressId) {
      return accountJsonError("ddres secimi zorunludur", 400);
    }

    const data = await deletedddress(addressId, getdccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handledccountRouteError(error, "ddres silinemedi");
  }
}

