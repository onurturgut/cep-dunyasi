import { createHmac, timingSafeEqual } from "node:crypto";

import { hasAdminAccess, hasPermission as userHasPermission, type AdminPermission } from "@/lib/admin";

export type SessionUser = {
  id: string;
  email: string;
  email_verified?: boolean;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  roles: string[];
  permissions?: string[];
  is_active?: boolean;
};

type SessionPayload = {
  user: SessionUser;
  exp: number;
};

export const AUTH_COOKIE_NAME = "cep_auth_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured");
  }

  return secret;
}

function sign(data: string) {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function parseCookies(cookieHeader: string | null) {
  const result: Record<string, string> = {};

  if (!cookieHeader) {
    return result;
  }

  const entries = cookieHeader.split(";");

  for (const entry of entries) {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    if (!rawKey) {
      continue;
    }
    result[rawKey] = decodeURIComponent(rawValue.join("="));
  }

  return result;
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const [encodedPayload, incomingSignature] = token.split(".");

  if (!encodedPayload || !incomingSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  if (!safeEqual(expectedSignature, incomingSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload?.user?.id || !payload?.user?.email || !Array.isArray(payload?.user?.roles)) {
      return null;
    }

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload.user;
  } catch {
    return null;
  }
}

export function getSessionUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export function setSessionCookie(response: Response, user: SessionUser, options?: { rememberMe?: boolean }) {
  const token = createSessionToken(user);
  const secure = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (options?.rememberMe !== false) {
    cookieParts.push(`Max-Age=${SESSION_TTL_SECONDS}`);
  }

  if (secure) {
    cookieParts.push("Secure");
  }

  response.headers.append("Set-Cookie", cookieParts.join("; "));
}

export function clearSessionCookie(response: Response) {
  const secure = process.env.NODE_ENV === "production";
  const cookieParts = [`${AUTH_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];

  if (secure) {
    cookieParts.push("Secure");
  }

  response.headers.append("Set-Cookie", cookieParts.join("; "));
}

export function isAdmin(user: SessionUser | null) {
  return hasAdminAccess(user?.roles, user?.permissions, user?.is_active !== false);
}

export function hasPermission(user: SessionUser | null, permission: AdminPermission) {
  if (!user) {
    return false;
  }

  return userHasPermission(user.roles, user.permissions, permission);
}
