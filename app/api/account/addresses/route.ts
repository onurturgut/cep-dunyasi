import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { accountJsonError, getAccountSessionUser, handleAccountRouteError } from "@/server/account-api";
import { createAddress, deleteAddress, listAddresses, updateAddress } from "@/server/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const data = await listAddresses(getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Adresler getirilemedi");
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await createAddress(await request.json(), getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Adres eklenemedi");
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const data = await updateAddress(await request.json(), getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Adres guncellenemedi");
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const addressId = `${body?.addressId ?? ""}`.trim();

    if (!addressId) {
      return accountJsonError("Adres secimi zorunludur", 400);
    }

    const data = await deleteAddress(addressId, getAccountSessionUser(request));
    return NextResponse.json({ data, error: null });
  } catch (error) {
    return handleAccountRouteError(error, "Adres silinemedi");
  }
}
