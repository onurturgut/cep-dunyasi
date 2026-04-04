import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { setSessionCookie } from "@/server/auth-session";
import { ensureUserMarketingProfile, registerReferralForNewUser } from "@/server/services/marketing";

export const runtime = "nodejs";

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    phone: user.phone ?? "",
    roles: user.roles ?? [],
    permissions: user.permissions ?? [],
    is_active: user.is_active !== false,
  };
}

function splitFullName(fullName: string) {
  const pieces = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: pieces[0] || "",
    lastName: pieces.slice(1).join(" "),
  };
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName, referralCode } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: { message: "Email ve sifre zorunludur" } }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();

    if (existing) {
      return NextResponse.json({ error: { message: "Bu e-posta zaten kayıtli" } }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const roles = ["customer"];
    const names = splitFullName(`${fullName ?? ""}`);

    const user = await User.create({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName ?? "",
      first_name: names.firstName,
      last_name: names.lastName,
      roles,
      permissions: [],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await ensureUserMarketingProfile(user.id as string);
    await registerReferralForNewUser(typeof referralCode === "string" ? referralCode : null, user.id as string);

    const response = NextResponse.json({ user: sanitizeUser(user) });
    setSessionCookie(response, sanitizeUser(user));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayit basarisiz";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
