import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest, isAdmin } from "@/server/auth-session";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 120 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status });
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
  if (mimeType === "video/mp4") return ".mp4";
  if (mimeType === "video/webm") return ".webm";

  return "";
}

export async function POST(request: Request) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!isAdmin(sessionUser)) {
      return jsonError("Bu islem icin admin yetkisi gerekiyor", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = `${formData.get("kind") ?? ""}`.toLowerCase();

    if (!(file instanceof File)) {
      return jsonError("Yuklenecek dosya bulunamadi", 400);
    }

    if (file.size <= 0) {
      return jsonError("Bos dosya yuklenemez", 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError("Dosya boyutu 120MB sinirini asiyor", 400);
    }

    const mimeType = `${file.type || ""}`.toLowerCase();
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      return jsonError("Sadece foto veya video dosyasi yukleyebilirsiniz", 400);
    }

    if (kind === "image" && !isImage) {
      return jsonError("Bu alan icin foto yuklemelisiniz", 400);
    }

    if (kind === "video" && !isVideo) {
      return jsonError("Bu alan icin video yuklemelisiniz", 400);
    }

    const bucket = isVideo ? "videos" : "images";
    const extension = getSafeExtension(file.name, mimeType);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "mission", bucket);
    await mkdir(uploadDir, { recursive: true });

    const targetPath = path.join(uploadDir, fileName);
    const data = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, data);

    const url = `/uploads/mission/${bucket}/${fileName}`;

    return NextResponse.json({
      data: {
        url,
        fileName,
        mimeType,
        size: file.size,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yukleme hatasi";
    return jsonError(message, 500);
  }
}
