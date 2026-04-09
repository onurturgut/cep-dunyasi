import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { User } from "@/server/models";
import { ensureUserMarketingProfile, registerReferralForNewUser } from "@/server/services/marketing";
import {
  isVerificationEmailConfigured,
} from "@/server/services/auth-verification";

export const runtime = "nodejs";

const signUpSchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(8, "Sifre en az 8 karakter olmali")
    .max(72, "Sifre en fazla 72 karakter olabilir"),
  fullName: z.string().trim().min(2, "Ad soyad zorunludur").max(120, "Ad soyad en fazla 120 karakter olabilir"),
  referralCode: z.string().trim().max(64).optional().nullable(),
});

function splitFullName(fullName: string) {
  const pieces = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: pieces[0] || "",
    lastName: pieces.slice(1).join(" "),
  };
}

export async function POST(request: Request) {
  try {
    if (!isVerificationEmailConfigured()) {
      return NextResponse.json(
        { error: { message: "Doğrulama e-postası servisi şu anda hazır değil. Lütfen daha sonra tekrar deneyin." } },
        { status: 503 }
      );
    }

    const payload = signUpSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: { message: payload.error.issues[0]?.message ?? "Kayıt bilgileri geçersiz" } },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = payload.data.email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.email_verified === false) {
        return NextResponse.json(
          {
            error: {
              code: "EMAIL_NOT_VERIFIED",
              message: "Bu e-posta ile oluşturulmuş fakat henüz doğrulanmamış bir hesap var. Giriş ekranından kod alarak hesabınızı doğrulayabilirsiniz.",
              email: normalizedEmail,
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: { message: "Bu e-posta zaten kayıtlı" } }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(payload.data.password, 10);
    const names = splitFullName(payload.data.fullName);
    const user = await User.create({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: payload.data.fullName,
      first_name: names.firstName,
      last_name: names.lastName,
      roles: ["customer"],
      permissions: [],
      is_active: true,
      email_verified: false,
      email_verified_at: null,
      email_verification_token_hash: null,
      email_verification_expires_at: null,
      email_verification_sent_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await ensureUserMarketingProfile(user.id as string);
    await registerReferralForNewUser(typeof payload.data.referralCode === "string" ? payload.data.referralCode : null, user.id as string);
    return NextResponse.json({
      verificationRequired: true,
      email: normalizedEmail,
      message: "Kaydınız tamamlandı. İlk girişte e-posta adresinize gönderilen kod ile hesabınızı doğrulayabilirsiniz.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

