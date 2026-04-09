import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { subscribeToNewsletter } from "@/server/services/marketing";
import { isNewsletterEmailConfigured, sendNewsletterWelcomeEmail } from "@/server/services/newsletter-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await subscribeToNewsletter(await request.json());

    if (isNewsletterEmailConfigured()) {
      try {
        await sendNewsletterWelcomeEmail({
          email: data.subscriber.email,
          firstName: data.subscriber.firstName,
          campaignSource: data.subscriber.campaignSource,
        });
      } catch (emailError) {
        console.error("Newsletter welcome email could not be sent:", emailError);
      }
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz e-posta istegi" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Newsletter kaydi tamamlanamadi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
