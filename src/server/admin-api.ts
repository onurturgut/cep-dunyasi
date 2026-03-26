import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUserFromRequest, type SessionUser } from "@/server/auth-session";
import { User } from "@/server/models";
import { hasAdminAccess, hasPermission, type AdminPermission } from "@/lib/admin";

type AdminUserRecord = {
  id: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  is_active?: boolean;
};

export type AdminRequestContext = {
  sessionUser: SessionUser;
  user: AdminUserRecord;
  permissions: string[];
};

export function adminJsonError(message: string, status = 400) {
  return NextResponse.json({ data: null, error: { message } }, { status });
}

export function getAdminSessionUser(request: Request) {
  return getSessionUserFromRequest(request);
}

export async function requireAdminAccess(request: Request, permission?: AdminPermission): Promise<AdminRequestContext> {
  const sessionUser = getAdminSessionUser(request);

  if (!sessionUser?.id) {
    throw new Error("Bu islem icin giris yapmaniz gerekiyor");
  }

  const user = (await User.findOne({ id: sessionUser.id }).lean()) as AdminUserRecord | null;
  const isActive = user?.is_active !== false;

  if (!user || !isActive) {
    throw new Error("Bu islem icin aktif bir admin hesabi gerekiyor");
  }

  if (!hasAdminAccess(user.roles, user.permissions, isActive)) {
    throw new Error("Bu alana erismek icin admin yetkisi gerekiyor");
  }

  if (permission && !hasPermission(user.roles, user.permissions, permission)) {
    throw new Error("Bu islem icin gerekli yetkiye sahip degilsiniz");
  }

  return {
    sessionUser: {
      ...sessionUser,
      roles: Array.isArray(user.roles) ? user.roles : sessionUser.roles,
      permissions: Array.isArray(user.permissions) ? user.permissions : sessionUser.permissions,
      is_active: isActive,
    },
    user,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
}

export function handleAdminRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return adminJsonError(error.issues[0]?.message || "Gecersiz istek", 400);
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  const normalized = message.toLocaleLowerCase("tr-TR");

  if (normalized.includes("giris yapmaniz gerekiyor")) {
    return adminJsonError(message, 401);
  }

  if (normalized.includes("gerekli yetkiye sahip degilsiniz") || normalized.includes("admin yetkisi gerekiyor")) {
    return adminJsonError(message, 403);
  }

  if (normalized.includes("bulunamadi")) {
    return adminJsonError(message, 404);
  }

  return adminJsonError(message || fallbackMessage, 400);
}
