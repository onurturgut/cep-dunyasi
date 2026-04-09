import { isSmtpEmailConfigured, sendSmtpEmail } from "@/server/services/smtp-email";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isNewsletterEmailConfigured() {
  return isSmtpEmailConfigured();
}

export async function sendNewsletterWelcomeEmail(input: {
  email: string;
  firstName?: string | null;
  campaignSource?: string | null;
}) {
  if (!isNewsletterEmailConfigured()) {
    throw new Error("NEWSLETTER_EMAIL_NOT_CONFIGURED");
  }

  const customerName = input.firstName?.trim() || "Merhaba";
  const escapedName = escapeHtml(customerName);
  const sourceLine = input.campaignSource?.trim()
    ? `<p style="margin:0 0 18px;color:#475569;font-size:14px">Kayit kaynagi: ${escapeHtml(input.campaignSource.trim())}</p>`
    : "";

  await sendSmtpEmail({
    to: input.email,
    subject: "Cep Dünyası newsletter kaydınız alındı",
    text: `${customerName}, Cep Dünyası newsletter kaydınız alındı. Yeni kampanyalar, dikkat ceken urunler ve firsatlar e-posta adresinize ulasacak.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;padding:24px;background:#f8fafc">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;padding:32px">
          <p style="margin:0 0 8px;color:#8b0c2f;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase">Cep Dünyası</p>
          <h1 style="margin:0 0 12px;font-size:28px;color:#0f172a">Newsletter kaydin tamamlandi</h1>
          <p style="margin:0 0 16px;color:#334155">${escapedName}, yeni kampanyalar, öne çıkan telefon modelleri ve seçili fırsatlar artık e-posta kutuna ulaşacak.</p>
          ${sourceLine}
          <div style="border-radius:20px;background:#fff1f2;border:1px solid #fecdd3;padding:18px 20px">
            <p style="margin:0;color:#9f1239;font-weight:700">Ilk ogrenilecekler:</p>
            <p style="margin:10px 0 0;color:#475569">Yeni gelen modeller, seçili indirimler ve vitrindeki kampanyalar.</p>
          </div>
          <p style="margin:18px 0 0;color:#64748b;font-size:14px">Bu e-postalari almak istemezsen ileride abonelikten cikabilirsin.</p>
        </div>
      </div>
    `,
  });
}

export async function sendNewsletterCampaignEmail(input: {
  to: string;
  subject: string;
  heading: string;
  previewText?: string | null;
  bodyHtml: string;
  bodyText: string;
}) {
  if (!isNewsletterEmailConfigured()) {
    throw new Error("NEWSLETTER_EMAIL_NOT_CONFIGURED");
  }

  const preview = input.previewText?.trim();

  await sendSmtpEmail({
    to: input.to,
    subject: input.subject,
    text: input.bodyText,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;padding:24px;background:#f8fafc">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;padding:32px">
          <p style="margin:0 0 8px;color:#8b0c2f;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase">Cep Dünyası</p>
          <h1 style="margin:0 0 12px;font-size:30px;color:#0f172a">${escapeHtml(input.heading)}</h1>
          ${preview ? `<p style="margin:0 0 18px;color:#475569">${escapeHtml(preview)}</p>` : ""}
          <div style="color:#334155">${input.bodyHtml}</div>
        </div>
      </div>
    `,
  });
}

