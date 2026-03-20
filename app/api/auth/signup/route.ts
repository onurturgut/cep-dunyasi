import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { setSessionCookie } from "@/server/auth-session";

export const runtime = "nodejs";

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    roles: user.roles ?? [],
  };
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: { message: "Email ve sifre zorunludur" } }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();

    if (existing) {
      return NextResponse.json({ error: { message: "Bu e-posta zaten kayitli" } }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const roles = ["customer"];

    const user = await User.create({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName ?? "",
      roles,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = NextResponse.json({ user: sanitizeUser(user) });
    setSessionCookie(response, sanitizeUser(user));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayit basarisiz";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
