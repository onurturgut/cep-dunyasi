import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUserFromRequest, type SessionUser } from "@/server/auth-session";

export function getAccountSessionUser(request: Request): SessionUser | null {
  return getSessionUserFromRequest(request);
}

export function accountJsonError(message: string, status = 400) {
  return NextResponse.json({ data: null, error: { message } }, { status });
}

export function handleAccountRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return accountJsonError(error.issues[0]?.message || "Gecersiz istek", 400);
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = message.includes("giris yapmaniz gerekiyor") ? 401 : message.includes("bulunamadi") ? 404 : 400;
  return accountJsonError(message, status);
}
