import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { hasAdminAccess, hasPermission } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { name, args } = await request.json();

    if (!["has_role", "has_permission", "has_admin_access"].includes(name)) {
      return NextResponse.json({ data: null, error: { message: "Unknown RPC function" } }, { status: 400 });
    }

    const sessionUser = getSessionUserFromRequest(request);

    if (!sessionUser?.id) {
      return NextResponse.json({ data: false, error: null });
    }

    if (args?._user_id && args._user_id !== sessionUser.id) {
      return NextResponse.json({ data: false, error: null });
    }

    await connectToDatabase();
    const user = await User.findOne({ id: sessionUser.id }).lean();
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
    const isActive = user?.is_active !== false;

    if (name === "has_role") {
      return NextResponse.json({ data: roles.includes(args?._role as string), error: null });
    }

    if (name === "has_permission") {
      return NextResponse.json({
        data: hasPermission(roles, permissions, args?._permission as Parameters<typeof hasPermission>[2]),
        error: null,
      });
    }

    return NextResponse.json({ data: hasAdminAccess(roles, permissions, isActive), error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RPC error";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
