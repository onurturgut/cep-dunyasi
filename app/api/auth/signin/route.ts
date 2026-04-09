import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { setSessionCookie } from "@/server/auth-session";
import {
  createEmailVerificationState,
  getVerificationRetrySeconds,
  isVerificationEmailConfigured,
  sendVerificationEmail,
} from "@/server/services/auth-verification";

export const runtime = "nodejs";

const signInSchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta adresi girin"),
  password: z.string().min(1, "Sifre zorunludur"),
  rememberMe: z.boolean().optional().default(true),
});

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    email_verified: user.email_verified !== false,
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
    const payload = signInSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: { message: payload.error.issues[0]?.message ?? "Email ve şifre zorunludur" } },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = payload.data.email.toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    const envAdminLogin =
      Boolean(adminEmail && adminPassword) &&
      normalizedEmail === adminEmail &&
      payload.data.password === adminPassword;

    let user = await User.findOne({ email: normalizedEmail });

    if (envAdminLogin) {
      if (!user) {
        const passwordHash = await bcrypt.hash(String(adminPassword), 10);
        user = await User.create({
          email: normalizedEmail,
          password_hash: passwordHash,
          full_name: "Admin",
          roles: ["admin", "customer"],
          email_verified: true,
          email_verified_at: new Date(),
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
      return NextResponse.json({ error: { message: "E-posta veya şifre hatalı" } }, { status: 401 });
    }

    if (user.is_active === false) {
      return NextResponse.json({ error: { message: "Bu hesap pasif durumda" } }, { status: 403 });
    }

    const valid = envAdminLogin ? true : await bcrypt.compare(payload.data.password, user.password_hash);

    if (!valid) {
      return NextResponse.json({ error: { message: "E-posta veya şifre hatalı" } }, { status: 401 });
    }

    if (!envAdminLogin && user.email_verified === false) {
      if (!isVerificationEmailConfigured()) {
        return NextResponse.json(
          {
            error: {
              code: "EMAIL_VERIFICATION_NOT_CONFIGURED",
              message: "Doğrulama mail servisi şu anda hazır değil. Lütfen daha sonra tekrar deneyin.",
            },
          },
          { status: 503 }
        );
      }

      const retryAfter = getVerificationRetrySeconds(user.email_verification_sent_at);

      if (retryAfter <= 0 || !user.email_verification_token_hash || !user.email_verification_expires_at || new Date(user.email_verification_expires_at).getTime() <= Date.now()) {
        const verification = createEmailVerificationState();
        user.email_verification_token_hash = verification.codeHash;
        user.email_verification_expires_at = verification.expiresAt;
        user.email_verification_sent_at = verification.sentAt;
        user.updated_at = new Date();
        await user.save();

        await sendVerificationEmail({
          email: normalizedEmail,
          fullName: user.full_name ?? normalizedEmail,
          code: verification.code,
        });
      }

      return NextResponse.json(
        {
          error: {
            code: "EMAIL_NOT_VERIFIED",
            message: "Hesabınız doğrulanmamış. E-posta adresinize hesap doğrulama kodu gönderildi.",
            email: normalizedEmail,
            retryAfter: Math.max(getVerificationRetrySeconds(user.email_verification_sent_at), 0),
          },
        },
        { status: 403 }
      );
    }

    if (user.email_verified == null) {
      user.email_verified = true;
      user.email_verified_at = user.email_verified_at ?? new Date();
    }

    user.last_login_at = new Date();
    user.updated_at = new Date();
    await user.save();

    const response = NextResponse.json({ user: sanitizeUser(user) });
    setSessionCookie(response, sanitizeUser(user), { rememberMe: payload.data.rememberMe });
    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Giriş başarısız";
    const message =
      rawMessage.toLowerCase().includes("querysrv") || rawMessage.toLowerCase().includes("econnrefused")
        ? "Veritabani baglantisi su anda kurulamiyor. Lutfen ag ayarlarinizi veya sunucu erisimini kontrol edip tekrar deneyin."
        : rawMessage;
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

