import { MAX_COVER_PHOTO_BYTES } from "@/lib/eventCoverPhoto";

const MAX_IMAGE_EDGE_PX = 2400;
/** Smaller edge for fast editor preview while upload file is still compressing. */
const PREVIEW_MAX_IMAGE_EDGE_PX = 1280;
const INITIAL_JPEG_QUALITY = 0.88;
const PREVIEW_JPEG_QUALITY = 0.82;
const MIN_JPEG_QUALITY = 0.52;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not process image."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read processed image."));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image."));
    };
    img.src = objectUrl;
  });
}

function scaledDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function encodeJpegUnderLimit(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxBytes: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process image.");
  }
  ctx.drawImage(source, 0, 0, width, height);

  let quality = INITIAL_JPEG_QUALITY;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);

  while (blob.size > maxBytes && quality > MIN_JPEG_QUALITY) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  if (blob.size <= maxBytes) {
    return blob;
  }

  let edge = Math.max(width, height);
  while (blob.size > maxBytes && edge > 640) {
    edge = Math.round(edge * 0.85);
    const next = scaledDimensions(width, height, edge);
    canvas.width = next.width;
    canvas.height = next.height;
    ctx.drawImage(source, 0, 0, next.width, next.height);
    quality = INITIAL_JPEG_QUALITY;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    while (blob.size > maxBytes && quality > MIN_JPEG_QUALITY) {
      quality -= 0.07;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (blob.size <= maxBytes) {
      return blob;
    }
  }

  if (blob.size > maxBytes) {
    throw new Error(
      `Could not compress image under ${Math.round(maxBytes / (1024 * 1024))} MB. Try a smaller photo.`,
    );
  }

  return blob;
}

export type PreparedWelcomePhoto = {
  file: File;
  dataUrl: string;
};

export type PrepareWelcomePhotoOptions = {
  /** Fires with a smaller preview data URL before upload compression finishes. */
  onPreviewReady?: (dataUrl: string) => void;
};

/**
 * Resize and compress camera photos client-side before preview + upload.
 * Preserves aspect ratio; outputs JPEG suitable for Supabase upload limits.
 */
export async function prepareWelcomePhotoUploadFile(
  file: File,
  maxBytes: number = MAX_COVER_PHOTO_BYTES,
  options?: PrepareWelcomePhotoOptions,
): Promise<PreparedWelcomePhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const img = await loadImageElement(file);

  if (options?.onPreviewReady) {
    const previewDims = scaledDimensions(
      img.naturalWidth,
      img.naturalHeight,
      PREVIEW_MAX_IMAGE_EDGE_PX,
    );
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = previewDims.width;
    previewCanvas.height = previewDims.height;
    const previewCtx = previewCanvas.getContext("2d");
    if (previewCtx) {
      previewCtx.drawImage(img, 0, 0, previewDims.width, previewDims.height);
      const previewBlob = await canvasToBlob(previewCanvas, "image/jpeg", PREVIEW_JPEG_QUALITY);
      options.onPreviewReady(await blobToDataUrl(previewBlob));
    }
  }

  const firstPass = scaledDimensions(img.naturalWidth, img.naturalHeight, MAX_IMAGE_EDGE_PX);
  const blob = await encodeJpegUnderLimit(img, firstPass.width, firstPass.height, maxBytes);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "welcome-photo";
  const outFile = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
  const dataUrl = await blobToDataUrl(blob);

  return { file: outFile, dataUrl };
}
