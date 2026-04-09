import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { hashVerificationCode } from "@/server/services/auth-verification";

export const runtime = "nodejs";

const verifySchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta adresi girin"),
  code: z.string().trim().regex(/^\d{6}$/, "Dogrulama kodu 6 haneli olmali"),
});

export async function POST(request: Request) {
  try {
    const payload = verifySchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: { message: payload.error.issues[0]?.message ?? "Doğrulama bilgileri geçersiz" } },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = payload.data.email.toLowerCase();
    const codeHash = hashVerificationCode(payload.data.code);
    const user = await User.findOne({
      email: normalizedEmail,
      email_verification_token_hash: codeHash,
      email_verification_expires_at: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: "Doğrulama kodu geçersiz veya süresi dolmuş. Yeni bir kod isteyin." } },
        { status: 400 }
      );
    }

    user.email_verified = true;
    user.email_verified_at = new Date();
    user.email_verification_token_hash = null;
    user.email_verification_expires_at = null;
    user.email_verification_sent_at = null;
    user.updated_at = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      email: user.email,
      message: "E-posta adresiniz doğrulandı. Artık giriş yapabilirsiniz.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Doğrulama başarısız";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

