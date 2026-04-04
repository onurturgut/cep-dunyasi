import type { BillingInfoInput, CheckoutNotificationEvent } from "@/lib/checkout";
import { Notification } from "@/server/models";

type NotificationChannel = "email" | "sms";

type OrderNotificationRecipient = {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
};

type OrderNotificationContext = {
  orderId: string;
  finalPrice: number;
  customerName: string;
  paymentMethod: string;
  paymentStatus: string;
  billingInfo?: BillingInfoInput | null;
  paymentFailureReason?: string | null;
  trackingNumber?: string | null;
  trackingCompany?: string | null;
};

type BuiltNotification = {
  subject: string;
  message: string;
};

function buildOrderEmailTemplate(event: CheckoutNotificationEvent, context: OrderNotificationContext): BuiltNotification {
  const orderLabel = `#${context.orderId.slice(0, 8)}`;

  switch (event) {
    case "order_created":
      return {
        subject: `Siparişiniz alındı ${orderLabel}`,
        message: `${context.customerName}, siparişiniz başarıyla alındı. Toplam tutar ${context.finalPrice.toLocaleString("tr-TR")} TL. Ödeme yöntemi: ${context.paymentMethod}.`,
      };
    case "payment_succeeded":
      return {
        subject: `Ödemeniz onaylandı ${orderLabel}`,
        message: `${context.customerName}, ödemeniz başarıyla tamamlandı. Siparişiniz hazırlık sürecine alındı.`,
      };
    case "payment_failed":
      return {
        subject: `Ödemeniz tamamlanamadı ${orderLabel}`,
        message: `${context.customerName}, ödeme işleminiz tamamlanamadı.${context.paymentFailureReason ? ` Neden: ${context.paymentFailureReason}.` : ""} Sipariş detayınızdan tekrar deneyebilirsiniz.`,
      };
    case "awaiting_transfer":
      return {
        subject: `Havale bilginiz hazır ${orderLabel}`,
        message: `${context.customerName}, siparişiniz için havale/EFT talimatları hazır. Açıklama alanında sipariş numaranızı paylaşmayı unutmayın.`,
      };
    case "shipment_updated":
      return {
        subject: `Siparişiniz kargoya verildi ${orderLabel}`,
        message: `${context.customerName}, siparişiniz ${context.trackingCompany ?? "kargo"} ile gönderildi.${context.trackingNumber ? ` Takip numarası: ${context.trackingNumber}.` : ""}`,
      };
    case "delivered":
      return {
        subject: `Siparişiniz teslim edildi ${orderLabel}`,
        message: `${context.customerName}, siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.`,
      };
    default:
      return {
        subject: `Sipariş bildirimi ${orderLabel}`,
        message: `${context.customerName}, siparişinizle ilgili yeni bir güncelleme var.`,
      };
  }
}

export function buildPaymentFailureMessage(reason?: string | null) {
  return reason
    ? `Ödeme işlemi tamamlanamadı. Neden: ${reason}. Sipariş detayınızdan tekrar deneyebilirsiniz.`
    : "Ödeme işlemi tamamlanamadı. Sipariş detayınızdan tekrar deneyebilirsiniz.";
}

export function buildShipmentMessage(company?: string | null, trackingNumber?: string | null) {
  return `${company ?? "Kargo"} ile gönderiniz yola çıktı.${trackingNumber ? ` Takip numarası: ${trackingNumber}.` : ""}`.trim();
}

async function sendEmailNotification(subject: string, message: string, recipient: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    return {
      status: "skipped" as const,
      summary: { reason: "email_provider_not_configured" },
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [recipient],
      subject,
      text: message,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><p>${message}</p></div>`,
    }),
  });

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new Error(`${payload?.message ?? "E-posta gönderilemedi"}`);
  }

  return {
    status: "sent" as const,
    summary: payload,
  };
}

async function sendSmsNotification(message: string, recipient: string) {
  const smsWebhookUrl = process.env.SMS_WEBHOOK_URL;

  if (!smsWebhookUrl) {
    return {
      status: "skipped" as const,
      summary: { reason: "sms_provider_not_configured" },
    };
  }

  const response = await fetch(smsWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: recipient,
      message,
    }),
  });

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new Error(`${payload?.message ?? "SMS gönderilemedi"}`);
  }

  return {
    status: "sent" as const,
    summary: payload,
  };
}

async function persistNotification(input: {
  userId?: string | null;
  orderId: string;
  event: CheckoutNotificationEvent;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  message: string;
}) {
  const now = new Date();
  const notification = await Notification.create({
    user_id: input.userId ?? null,
    related_order_id: input.orderId,
    type: input.event,
    channel: input.channel,
    recipient: input.recipient,
    subject: input.subject,
    message: input.message,
    status: "queued",
    sent_at: null,
    error_message: null,
    provider_response_summary: null,
    created_at: now,
    updated_at: now,
  });

  return notification as {
    id: string;
    status: string;
    sent_at: Date | null;
    error_message: string | null;
    provider_response_summary: Record<string, unknown> | null;
    save: () => Promise<void>;
  };
}

export async function sendOrderNotifications(input: {
  event: CheckoutNotificationEvent;
  recipient: OrderNotificationRecipient;
  context: OrderNotificationContext;
}) {
  const results: { email: string | null; sms: string | null } = { email: null, sms: null };
  const emailTemplate = buildOrderEmailTemplate(input.event, input.context);

  if (input.recipient.email && input.recipient.emailEnabled !== false) {
    const notification = await persistNotification({
      userId: input.recipient.userId ?? null,
      orderId: input.context.orderId,
      event: input.event,
      channel: "email",
      recipient: input.recipient.email,
      subject: emailTemplate.subject,
      message: emailTemplate.message,
    });

    try {
      const emailResult = await sendEmailNotification(emailTemplate.subject, emailTemplate.message, input.recipient.email);
      notification.status = emailResult.status;
      notification.sent_at = emailResult.status === "sent" ? new Date() : null;
      notification.provider_response_summary = emailResult.summary;
      await notification.save();
      results.email = emailResult.status;
    } catch (error) {
      notification.status = "failed";
      notification.error_message = error instanceof Error ? error.message : "Email gönderilemedi";
      await notification.save();
      results.email = "failed";
    }
  }

  if (input.recipient.phone && input.recipient.smsEnabled) {
    const smsMessage =
      input.event === "shipment_updated"
        ? buildShipmentMessage(input.context.trackingCompany, input.context.trackingNumber)
        : input.event === "payment_failed"
          ? buildPaymentFailureMessage(input.context.paymentFailureReason)
          : emailTemplate.message;

    const notification = await persistNotification({
      userId: input.recipient.userId ?? null,
      orderId: input.context.orderId,
      event: input.event,
      channel: "sms",
      recipient: input.recipient.phone,
      subject: null,
      message: smsMessage,
    });

    try {
      const smsResult = await sendSmsNotification(smsMessage, input.recipient.phone);
      notification.status = smsResult.status;
      notification.sent_at = smsResult.status === "sent" ? new Date() : null;
      notification.provider_response_summary = smsResult.summary;
      await notification.save();
      results.sms = smsResult.status;
    } catch (error) {
      notification.status = "failed";
      notification.error_message = error instanceof Error ? error.message : "SMS gönderilemedi";
      await notification.save();
      results.sms = "failed";
    }
  }

  return results;
}
