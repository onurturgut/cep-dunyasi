import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectToDatabase } from "@/server/mongodb";
import { subscribeToNewsletter } from "@/server/services/marketing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await subscribeToNewsletter(await request.json());
    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ data: null, error: { message: error.issues[0]?.message || "Gecersiz e-posta istegi" } }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Newsletter kaydi tamamlanamadi";
    return NextResponse.json({ data: null, error: { message } }, { status: 400 });
  }
}
