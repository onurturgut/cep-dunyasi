import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { getSessionUserFromRequest } from "@/server/auth-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { name, args } = await request.json();

    if (name !== "has_role") {
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
    const hasRole = Array.isArray(user?.roles) ? user.roles.includes(args?._role) : false;

    return NextResponse.json({ data: hasRole, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RPC error";
    return NextResponse.json({ data: null, error: { message } }, { status: 500 });
  }
}
