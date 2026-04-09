import nodemailer from "nodemailer";

function parseSmtpPort(value?: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
}

function parseSmtpSecure(value?: string | null, port?: number) {
  if (!value) {
    return port === 465;
  }

  return ["true", "1", "yes"].includes(value.trim().toLowerCase());
}

export function isSmtpEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM_EMAIL
  );
}

function createTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const port = parseSmtpPort(process.env.SMTP_PORT);
  const secure = parseSmtpSecure(process.env.SMTP_SECURE, port);

  if (!host || !user || !pass || !fromEmail) {
    throw new Error("SMTP_EMAIL_NOT_CONFIGURED");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function buildFromAddress() {
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const fromName = process.env.SMTP_FROM_NAME?.trim();

  if (!fromEmail) {
    throw new Error("SMTP_EMAIL_NOT_CONFIGURED");
  }

  return fromName ? `"${fromName.replace(/"/g, "")}" <${fromEmail}>` : fromEmail;
}

export async function sendSmtpEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: buildFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
