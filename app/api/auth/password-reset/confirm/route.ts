import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { hashPasswordResetCode } from "@/server/services/password-reset";

export const runtime = "nodejs";

const confirmPasswordResetSchema = z
  .object({
    email: z.string().trim().email("Gecerli bir e-posta adresi girin"),
    code: z.string().trim().regex(/^\d{6}$/, "Dogrulama kodu 6 haneli olmali"),
    password: z.string().min(8, "Sifre en az 8 karakter olmali").max(72, "Sifre en fazla 72 karakter olabilir"),
    confirmPassword: z.string().min(8, "Sifre tekrari zorunlu"),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Sifreler eslesmiyor",
  });

export async function POST(request: Request) {
  try {
    const payload = confirmPasswordResetSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: { message: payload.error.issues[0]?.message ?? "Şifre sıfırlama bilgileri geçersiz" } },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = payload.data.email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "Bu e-posta adresi ile kayıtlı bir hesap bulunamadı." } },
        { status: 404 }
      );
    }

    if (!user.password_reset_code_hash || !user.password_reset_expires_at) {
      return NextResponse.json(
        { error: { code: "RESET_CODE_NOT_FOUND", message: "Geçerli bir şifre sıfırlama kodu bulunamadı. Lütfen yeniden kod isteyin." } },
        { status: 400 }
      );
    }

    if (new Date(user.password_reset_expires_at).getTime() <= Date.now()) {
      user.password_reset_code_hash = null;
      user.password_reset_expires_at = null;
      user.password_reset_sent_at = null;
      user.updated_at = new Date();
      await user.save();

      return NextResponse.json(
        { error: { code: "RESET_CODE_EXPIRED", message: "Dogrulama kodunun suresi doldu. Lutfen yeni kod isteyin." } },
        { status: 400 }
      );
    }

    const hashedCode = hashPasswordResetCode(payload.data.code);

    if (hashedCode !== user.password_reset_code_hash) {
      return NextResponse.json(
        { error: { code: "RESET_CODE_INVALID", message: "Girdiginiz kod hatali. Lutfen tekrar kontrol edin." } },
        { status: 400 }
      );
    }

    user.password_hash = await bcrypt.hash(payload.data.password, 10);
    user.password_reset_code_hash = null;
    user.password_reset_expires_at = null;
    user.password_reset_sent_at = null;
    user.updated_at = new Date();
    await user.save();

    return NextResponse.json({
      message: "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
      email: normalizedEmail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şifre güncellenemedi";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

