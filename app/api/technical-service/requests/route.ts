import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/mongodb";
import { TechnicalServiceRequest } from "@/server/models";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status });
}

function normalizeText(value: FormDataEntryValue | null) {
  return `${value ?? ""}`.trim();
}

function getSafeExtension(fileName: string, mimeType: string) {
  const extFromName = path.extname(fileName || "").toLowerCase();
  const safeFromName = extFromName.replace(/[^a-z0-9.]/g, "");

  if (safeFromName) {
    return safeFromName;
  }

  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/heic") return ".heic";

  return "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const firstName = normalizeText(formData.get("firstName"));
    const lastName = normalizeText(formData.get("lastName"));
    const phoneNumber = normalizeText(formData.get("phoneNumber"));
    const phoneModel = normalizeText(formData.get("phoneModel"));
    const issueDescription = normalizeText(formData.get("issueDescription"));
    const photo = formData.get("photo");

    if (!firstName || !lastName || !phoneNumber || !phoneModel || !issueDescription) {
      return jsonError("Lutfen zorunlu alanlari doldurun", 400);
    }

    let photoUrl = "";
    let photoName = "";

    if (photo instanceof File && photo.size > 0) {
      if (photo.size > MAX_FILE_SIZE_BYTES) {
        return jsonError("Fotograf boyutu 8MB sinirini asiyor", 400);
      }

      const mimeType = `${photo.type || ""}`.toLowerCase();
      if (!mimeType.startsWith("image/")) {
        return jsonError("Sadece fotograf yukleyebilirsiniz", 400);
      }

      const extension = getSafeExtension(photo.name, mimeType);
      const fileName = `${Date.now()}-${randomUUID()}${extension}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "technical-service", "images");
      await mkdir(uploadDir, { recursive: true });

      const targetPath = path.join(uploadDir, fileName);
      const data = Buffer.from(await photo.arrayBuffer());
      await writeFile(targetPath, data);

      photoUrl = `/uploads/technical-service/images/${fileName}`;
      photoName = photo.name;
    }

    await connectToDatabase();
    const now = new Date();

    const created = await TechnicalServiceRequest.create({
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      phone_model: phoneModel,
      issue_description: issueDescription,
      photo_url: photoUrl,
      photo_name: photoName,
      status: "new",
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
    const message = error instanceof Error ? error.message : "Teknik servis formu gonderilemedi";
    return jsonError(message, 500);
  }
}
