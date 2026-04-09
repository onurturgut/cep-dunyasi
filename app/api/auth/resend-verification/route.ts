import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import {
  createEmailVerificationState,
  getVerificationExpiresInSeconds,
  getVerificationRetrySeconds,
  isVerificationEmailConfigured,
  sendVerificationEmail,
} from "@/server/services/auth-verification";

export const runtime = "nodejs";

const resendSchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta adresi girin"),
});

export async function POST(request: Request) {
  try {
    if (!isVerificationEmailConfigured()) {
      return NextResponse.json(
        { error: { message: "Doğrulama e-postası servisi şu anda hazır değil. Lütfen daha sonra tekrar deneyin." } },
        { status: 503 }
      );
    }

    const payload = resendSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: { message: payload.error.issues[0]?.message ?? "E-posta zorunludur" } },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = payload.data.email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({ error: { message: "Bu e-posta ile hesap bulunamadı." } }, { status: 404 });
    }

    if (user.email_verified !== false) {
      return NextResponse.json({ success: true, alreadyVerified: true, message: "Bu hesap zaten dogrulanmis." });
    }

    const retryAfter = getVerificationRetrySeconds(user.email_verification_sent_at);

    if (retryAfter > 0) {
      return NextResponse.json(
        {
          error: {
            code: "RESEND_RATE_LIMITED",
            message: `Yeni bir e-posta icin ${retryAfter} saniye bekleyin.`,
            retryAfter,
          },
          retryAfter,
          expiresIn: getVerificationExpiresInSeconds(user.email_verification_expires_at),
        },
        { status: 429 }
      );
    }

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

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      retryAfter: getVerificationRetrySeconds(verification.sentAt),
      expiresIn: getVerificationExpiresInSeconds(verification.expiresAt),
      message: "Hesap doğrulama kodu tekrar gönderildi.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Doğrulama e-postası gönderilemedi";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

