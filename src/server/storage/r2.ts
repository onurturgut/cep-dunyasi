import { randomUUID } from "node:crypto";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type UploadToR2Input = {
  body: Buffer;
  contentType: string;
  fileName: string;
  keyPrefix: string;
  cacheControl?: string;
};

let client: S3Client | null = null;

function getRequiredEnv(
  name:
    | "CLOUDFLARE_R2_ACCOUNT_ID"
    | "CLOUDFLARE_R2_ACCESS_KEY_ID"
    | "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
    | "CLOUDFLARE_R2_BUCKET_NAME"
    | "CLOUDFLARE_R2_PUBLIC_BASE_URL"
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getR2Client() {
  if (client) {
    return client;
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${getRequiredEnv("CLOUDFLARE_R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    },
  });

  return client;
}

export function getSafeUploadExtension(fileName: string, mimeType: string) {
  const extFromName = path.extname(fileName || "").toLowerCase();
  const safeFromName = extFromName.replace(/[^a-z0-9.]/g, "");

  if (safeFromName) {
    return safeFromName;
  }

  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/heic") return ".heic";
  if (mimeType === "video/mp4") return ".mp4";
  if (mimeType === "video/webm") return ".webm";

  return "";
}

export async function uploadToR2({ body, contentType, fileName, keyPrefix, cacheControl }: UploadToR2Input) {
  const bucketName = getRequiredEnv("CLOUDFLARE_R2_BUCKET_NAME");
  const publicBaseUrl = getRequiredEnv("CLOUDFLARE_R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
  const extension = getSafeUploadExtension(fileName, contentType);
  const objectKey = `${keyPrefix.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${randomUUID()}${extension}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl ?? "public, max-age=31536000, immutable",
    })
  );

  return {
    objectKey,
    fileName: path.basename(objectKey),
    url: `${publicBaseUrl}/${objectKey}`,
  };
}
