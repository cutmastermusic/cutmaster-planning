export const STAFF_PROFILE_PHOTO_BUCKET = "staff-profile-photos";
export const MAX_STAFF_PROFILE_PHOTO_BYTES = 2_800_000;

export type StaffProfilePhotoTransform = {
  scale: number;
  positionX: number;
  positionY: number;
};

export const DEFAULT_STAFF_PROFILE_PHOTO_TRANSFORM: StaffProfilePhotoTransform = {
  scale: 1,
  positionX: 50,
  positionY: 50,
};

const ALLOWED_STAFF_PROFILE_PHOTO_MIME_TYPES = new Set([
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

export function isAllowedStaffProfilePhotoMimeType(mimeType: string): boolean {
  return ALLOWED_STAFF_PROFILE_PHOTO_MIME_TYPES.has(mimeType);
}

export function staffProfilePhotoExtensionForMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] ?? "jpg";
}

export function buildStaffProfilePhotoStoragePath(staffKey: string, mimeType: string): string {
  const safeKey = staffKey.replace(/[^a-zA-Z0-9_-]/g, "-");
  const extension = staffProfilePhotoExtensionForMimeType(mimeType);
  return `${safeKey}/profile-${Date.now()}.${extension}`;
}

export function getStaffProfilePhotoPublicUrl(
  storagePath: string | null | undefined,
): string | undefined {
  const path = storagePath?.trim();
  if (!path) return undefined;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return undefined;

  return `${base}/storage/v1/object/public/${STAFF_PROFILE_PHOTO_BUCKET}/${path}`;
}

export function withStaffProfilePhotoCacheBust(publicUrl: string): string {
  const trimmed = publicUrl.trim();
  if (!trimmed) return trimmed;
  const token = Date.now();
  return `${trimmed}${trimmed.includes("?") ? "&" : "?"}v=${token}`;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function normalizeStaffProfilePhotoTransform(
  value: Partial<StaffProfilePhotoTransform> | null | undefined,
): StaffProfilePhotoTransform {
  return {
    scale: clampNumber(value?.scale, DEFAULT_STAFF_PROFILE_PHOTO_TRANSFORM.scale, 1, 1.8),
    positionX: clampNumber(value?.positionX, DEFAULT_STAFF_PROFILE_PHOTO_TRANSFORM.positionX, 0, 100),
    positionY: clampNumber(value?.positionY, DEFAULT_STAFF_PROFILE_PHOTO_TRANSFORM.positionY, 0, 100),
  };
}

export function staffProfilePhotoTransformFromDb(value: unknown): StaffProfilePhotoTransform | undefined {
  if (!value || typeof value !== "object") return undefined;
  return normalizeStaffProfilePhotoTransform(value as Partial<StaffProfilePhotoTransform>);
}
