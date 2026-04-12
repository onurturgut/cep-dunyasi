export type UploadImagePreset =
  | "campaign-main"
  | "campaign-mobile"
  | "banner-main"
  | "banner-mobile"
  | "popup-main";

type ImagePresetDefinition = {
  width: number;
  height: number;
  mode: "contain" | "cover";
  quality?: number;
};

const uploadImagePresets: Record<UploadImagePreset, ImagePresetDefinition> = {
  "campaign-main": { width: 1600, height: 1600, mode: "contain", quality: 0.92 },
  "campaign-mobile": { width: 1200, height: 1500, mode: "contain", quality: 0.92 },
  "banner-main": { width: 1600, height: 900, mode: "cover", quality: 0.92 },
  "banner-mobile": { width: 1200, height: 1500, mode: "cover", quality: 0.92 },
  "popup-main": { width: 1200, height: 1500, mode: "cover", quality: 0.92 },
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gorsel okunamadi"));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gorsel blob olarak olusturulamadi"));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

function drawContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

export async function resizeImageForUpload(file: File, preset: UploadImagePreset) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const definition = uploadImagePresets[preset];
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = definition.width;
  canvas.height = definition.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Gorsel yeniden boyutlandirilamadi");
  }

  if (definition.mode === "cover") {
    drawCover(context, image, definition.width, definition.height);
  } else {
    drawContain(context, image, definition.width, definition.height);
  }

  const blob = await canvasToBlob(canvas, definition.quality);
  const nextName = file.name.replace(/\.[^.]+$/, "") || "upload";
  return new File([blob], `${nextName}-${preset}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
