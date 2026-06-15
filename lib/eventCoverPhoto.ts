import { normalizeCoverPhotoTransform } from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform, EventSettings } from "@/types/planning";

export const EVENT_COVER_PHOTO_BUCKET = "event-cover-photos";
export const COVER_PHOTO_CAPABILITY = "event:cover-photo:write" as const;
export const MAX_COVER_PHOTO_BYTES = 2_800_000;

const ALLOWED_COVER_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedCoverPhotoMimeType(mimeType: string): boolean {
  return ALLOWED_COVER_PHOTO_MIME_TYPES.has(mimeType);
}

export function coverPhotoExtensionForMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] ?? "jpg";
}

export function buildEventCoverPhotoStoragePath(eventId: string, mimeType: string): string {
  const extension = coverPhotoExtensionForMimeType(mimeType);
  return `${eventId}/welcome.${extension}`;
}

export function isPersistedCoverPhotoUrl(value?: string): boolean {
  return Boolean(value?.trim().startsWith("http://") || value?.trim().startsWith("https://"));
}

export function getEventCoverPhotoPublicUrl(
  storagePath: string | null | undefined,
): string | undefined {
  const path = storagePath?.trim();
  if (!path) return undefined;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return undefined;

  return `${base}/storage/v1/object/public/${EVENT_COVER_PHOTO_BUCKET}/${path}`;
}

export function parseCoverPhotoTransformFromDb(value: unknown): CoverPhotoTransform | undefined {
  return normalizeCoverPhotoTransform(value as CoverPhotoTransform | null | undefined);
}

export function coverPhotoFieldsFromDbRow(row: {
  coverPhotoStoragePath?: string | null;
  coverPhotoTransform?: unknown;
}): Pick<EventSettings, "coverPhotoDataUrl" | "coverPhotoStoragePath" | "coverPhotoTransform"> {
  const storagePath = row.coverPhotoStoragePath?.trim() || undefined;
  const publicUrl = getEventCoverPhotoPublicUrl(storagePath);

  return {
    coverPhotoStoragePath: storagePath,
    coverPhotoDataUrl: publicUrl,
    coverPhotoTransform: parseCoverPhotoTransformFromDb(row.coverPhotoTransform),
  };
}

export function assertCoverPhotoStoragePathForEvent(eventId: string, storagePath: string): void {
  const normalized = storagePath.trim();
  const prefix = `${eventId}/`;
  if (!normalized.startsWith(prefix)) {
    throw new Error("Cover photo storage path does not match event.");
  }
}

export function coverPhotoMimeTypeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}
