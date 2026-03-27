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
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    phone: user.phone ?? "",
    roles: user.roles ?? [],
    permissions: user.permissions ?? [],
    is_active: user.is_active !== false,
  };
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: { message: "Email ve sifre zorunludur" } }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = String(email).trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    const envAdminLogin =
      Boolean(adminEmail && adminPassword) && normalizedEmail === adminEmail && password === adminPassword;

    let user = await User.findOne({ email: normalizedEmail });

    if (envAdminLogin) {
      if (!user) {
        const passwordHash = await bcrypt.hash(String(adminPassword), 10);
        user = await User.create({
          email: normalizedEmail,
          password_hash: passwordHash,
          full_name: "Admin",
          roles: ["admin", "customer"],
          created_at: new Date(),
          updated_at: new Date(),
        });
      } else if (!Array.isArray(user.roles) || !user.roles.includes("admin")) {
        user.roles = [...new Set([...(user.roles ?? []), "admin"])];
        user.updated_at = new Date();
        await user.save();
      }
    }

    if (!user) {
      return NextResponse.json({ error: { message: "Kullanici bulunamadi" } }, { status: 404 });
    }

    if (user.is_active === false) {
      return NextResponse.json({ error: { message: "Bu hesap pasif durumda" } }, { status: 403 });
    }

    const valid = envAdminLogin ? true : await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return NextResponse.json({ error: { message: "Email veya sifre hatali" } }, { status: 401 });
    }

    user.last_login_at = new Date();
    user.updated_at = new Date();
    await user.save();

    const response = NextResponse.json({ user: sanitizeUser(user) });
    setSessionCookie(response, sanitizeUser(user));
    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Giris basarisiz";
    const message = rawMessage.toLowerCase().includes("querysrv") || rawMessage.toLowerCase().includes("econnrefused")
      ? "Veritabani baglantisi su anda kurulamiyor. Lutfen ag ayarlarinizi veya sunucu erisimini kontrol edip tekrar deneyin."
      : rawMessage;
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
