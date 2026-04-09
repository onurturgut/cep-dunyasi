import { createHash, randomInt } from "node:crypto";
import { isSmtpEmailConfigured, sendSmtpEmail } from "@/server/services/smtp-email";

const VERIFICATION_CODE_TTL_MS = 1000 * 60 * 10;
const VERIFICATION_RESEND_COOLDOWN_MS = 1000 * 30;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatVerificationCode(code: string) {
  const normalized = `${code ?? ""}`.replace(/\D/g, "").slice(0, 6);
  if (normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function isVerificationEmailConfigured() {
  return isSmtpEmailConfigured();
}

export function hashVerificationCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function createEmailVerificationState() {
  const code = `${randomInt(0, 1_000_000)}`.padStart(6, "0");

  return {
    code,
    codeHash: hashVerificationCode(code),
    expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
    sentAt: new Date(),
  };
}

export function getVerificationRetrySeconds(sentAt?: Date | string | null) {
  if (!sentAt) {
    return 0;
  }

  const sentAtTime = new Date(sentAt).getTime();
  const remainingMs = sentAtTime + VERIFICATION_RESEND_COOLDOWN_MS - Date.now();

  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function getVerificationExpiresInSeconds(expiresAt?: Date | string | null) {
  if (!expiresAt) {
    return 0;
  }

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export async function sendVerificationEmail(input: {
  email: string;
  fullName?: string | null;
  code: string;
}) {
  if (!isVerificationEmailConfigured()) {
    throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  }

  const customerName = input.fullName?.trim() || input.email;
  const escapedName = escapeHtml(customerName);
  const visualCode = formatVerificationCode(input.code);
  const escapedCode = escapeHtml(visualCode);

  return sendSmtpEmail({
    to: input.email,
    subject: "Hesap doğrulama kodunuz",
    text: `${customerName}, hesabınızı doğrulamak için kullanacağınız kod: ${visualCode}. Kod 10 dakika boyunca geçerlidir.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;padding:24px;background:#f8fafc">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;padding:32px">
          <p style="margin:0 0 8px;color:#8b0c2f;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase">Cep Dunyasi</p>
          <h1 style="margin:0 0 12px;font-size:28px;color:#0f172a">Hesap doğrulama kodunuz hazir</h1>
          <p style="margin:0 0 20px;color:#334155">${escapedName}, aşağıdaki 6 haneli kodu girerek hesabınızı doğrulayabilir ve giriş yapabilirsiniz.</p>
          <div style="margin:0 0 20px;border-radius:20px;background:#fff1f2;border:1px solid #fecdd3;padding:20px;text-align:center">
            <div style="font-size:38px;line-height:1.1;font-weight:800;letter-spacing:0.35em;color:#9f1239">${escapedCode}</div>
          </div>
          <p style="margin:0 0 8px;color:#334155">Kod 10 dakika boyunca geçerlidir.</p>
          <p style="margin:0;color:#64748b;font-size:14px">Bu islemi siz yapmadiysaniz bu e-postayi dikkate almayabilirsiniz.</p>
        </div>
      </div>
    `,
  });
}

