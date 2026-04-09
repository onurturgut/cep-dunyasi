import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import {
  createPasswordResetState,
  getPasswordResetExpiresInSeconds,
  getPasswordResetRetrySeconds,
  isSmtpEmailConfigured,
  sendPasswordResetCodeEmail,
} from "@/server/services/password-reset";

export const runtime = "nodejs";

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta adresi girin"),
});

export async function POST(request: Request) {
  try {
    if (!isSmtpEmailConfigured()) {
      return NextResponse.json(
        { error: { code: "SMTP_NOT_CONFIGURED", message: "Mail servisi şu anda hazır değil. Lütfen daha sonra tekrar deneyin." } },
        { status: 503 }
      );
    }

    const payload = requestPasswordResetSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: { message: payload.error.issues[0]?.message ?? "E-posta bilgisi geçersiz" } },
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

    if (user.is_active === false) {
      return NextResponse.json(
        { error: { code: "USER_INACTIVE", message: "Bu hesap pasif durumda olduğu için şifre sıfırlama yapılamıyor." } },
        { status: 403 }
      );
    }

    const retryAfter = getPasswordResetRetrySeconds(user.password_reset_sent_at);

    if (retryAfter > 0 && user.password_reset_expires_at && new Date(user.password_reset_expires_at).getTime() > Date.now()) {
      return NextResponse.json(
        {
          error: {
            code: "RESET_CODE_RATE_LIMITED",
            message: `Lutfen ${retryAfter} saniye sonra tekrar deneyin.`,
            retryAfter,
          },
          email: normalizedEmail,
          retryAfter,
          expiresIn: getPasswordResetExpiresInSeconds(user.password_reset_expires_at),
        },
        { status: 429 }
      );
    }

    const resetState = createPasswordResetState();

    user.password_reset_code_hash = resetState.codeHash;
    user.password_reset_expires_at = resetState.expiresAt;
    user.password_reset_sent_at = resetState.sentAt;
    user.updated_at = new Date();
    await user.save();

    await sendPasswordResetCodeEmail({
      email: normalizedEmail,
      fullName: user.full_name ?? normalizedEmail,
      code: resetState.code,
    });

    return NextResponse.json({
      email: normalizedEmail,
      retryAfter: getPasswordResetRetrySeconds(resetState.sentAt),
      expiresIn: getPasswordResetExpiresInSeconds(resetState.expiresAt),
      message: "Şifre sıfırlama kodu e-posta adresinize gönderildi.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şifre sıfırlama kodu gönderilemedi";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

