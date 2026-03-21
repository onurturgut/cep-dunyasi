import { NextResponse } from "next/server";
import { getSessionUserFromRequest, isAdmin } from "@/server/auth-session";
import { deleteFromR2ByObjectKey, deleteFromR2ByUrl, uploadToR2 } from "@/server/storage/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 120 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ data: null, error: { message } }, { status });
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
    const scope = `${formData.get("scope") ?? "mission"}`.toLowerCase();

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

    if (!["mission", "products", "categories", "site-content"].includes(scope)) {
      return jsonError("Gecersiz upload alani", 400);
    }

    const data = Buffer.from(await file.arrayBuffer());
    const mediaFolder = isVideo ? "videos" : "images";
    const uploaded = await uploadToR2({
      body: data,
      contentType: mimeType,
      fileName: file.name,
      keyPrefix: `uploads/${scope}/${mediaFolder}`,
    });

    return NextResponse.json({
      data: {
        url: uploaded.url,
        fileName: uploaded.fileName,
        objectKey: uploaded.objectKey,
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

export async function DELETE(request: Request) {
  try {
    const sessionUser = getSessionUserFromRequest(request);
    if (!isAdmin(sessionUser)) {
      return jsonError("Bu islem icin admin yetkisi gerekiyor", 403);
    }

    const body = await request.json().catch(() => null);
    const urls = Array.isArray(body?.urls) ? body.urls.map((value: unknown) => `${value ?? ""}`.trim()).filter(Boolean) : [];
    const objectKeys = Array.isArray(body?.objectKeys)
      ? body.objectKeys.map((value: unknown) => `${value ?? ""}`.trim()).filter(Boolean)
      : [];

    if (urls.length === 0 && objectKeys.length === 0) {
      return jsonError("Silinecek medya bulunamadi", 400);
    }

    for (const objectKey of objectKeys) {
      await deleteFromR2ByObjectKey(objectKey);
    }

    for (const url of urls) {
      await deleteFromR2ByUrl(url);
    }

    return NextResponse.json({ data: { deleted: urls.length + objectKeys.length }, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Silme hatasi";
    return jsonError(message, 500);
  }
}
