import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/server/auth-session";
import { connectToDatabase } from "@/server/mongodb";
import { TechnicalServiceRequest } from "@/server/models";
import { uploadToR2 } from "@/server/storage/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status });
}

function normalizeText(value: FormDataEntryValue | null) {
  return `${value ?? ""}`.trim();
}

export async function POST(request: Request) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    const formData = await request.formData();
    const firstName = normalizeText(formData.get("firstName"));
    const lastName = normalizeText(formData.get("lastName"));
    const phoneNumber = normalizeText(formData.get("phoneNumber"));
    const phoneModel = normalizeText(formData.get("phoneModel"));
    const issueDescription = normalizeText(formData.get("issueDescription"));
    const photo = formData.get("photo");

    if (!firstName || !lastName || !phoneNumber || !phoneModel || !issueDescription) {
      return jsonError("Lütfen zorunlu alanları doldurun", 400);
    }

    let photoUrl = "";
    let photoName = "";

    if (photo instanceof File && photo.size > 0) {
      if (photo.size > MAX_FILE_SIZE_BYTES) {
        return jsonError("Fotoğraf boyutu 8MB sinirini asiyor", 400);
      }

      const mimeType = `${photo.type || ""}`.toLowerCase();
      if (!mimeType.startsWith("image/")) {
        return jsonError("Sadece fotoğraf yükleyebilirsiniz", 400);
      }

      const data = Buffer.from(await photo.arrayBuffer());
      const uploaded = await uploadToR2({
        body: data,
        contentType: mimeType,
        fileName: photo.name,
        keyPrefix: "uploads/technical-service/images",
      });

      photoUrl = uploaded.url;
      photoName = photo.name;
    }

    await connectToDatabase();
    const now = new Date();

    const created = await TechnicalServiceRequest.create({
      user_id: sessionUser?.id ?? null,
      first_name: firstName,
      last_name: lastName,
      email: sessionUser?.email ?? "",
      phone_number: phoneNumber,
      phone_model: phoneModel,
      issue_description: issueDescription,
      photo_url: photoUrl,
      photo_name: photoName,
      status: "new",
      admin_note: null,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({
      data: {
        id: created.id,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Teknik servis formu gönderilemedi";
    return jsonError(message, 500);
  }
}
