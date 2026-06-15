"use server";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  COVER_PHOTO_CAPABILITY,
  EVENT_COVER_PHOTO_BUCKET,
  MAX_COVER_PHOTO_BYTES,
  assertCoverPhotoStoragePathForEvent,
  buildEventCoverPhotoStoragePath,
  getEventCoverPhotoPublicUrl,
  isAllowedCoverPhotoMimeType,
  parseCoverPhotoTransformFromDb,
} from "@/lib/eventCoverPhoto";
import { normalizeCoverPhotoTransform } from "@/lib/coverPhotoTransform";
import { authorizeEventMutation } from "@/lib/eventAccess/authorize";
import { createServiceRoleClient, describeSupabaseServiceRoleConfigError, isSupabaseServiceRoleConfigured } from "@/lib/supabase/admin";
import type { CoverPhotoTransform } from "@/types/planning";

export type SavedEventCoverPhoto = {
  storagePath: string;
  publicUrl: string;
  transform?: CoverPhotoTransform;
};

export async function deleteEventCoverPhotoStorageByPath(
  storagePath: string | null | undefined,
): Promise<void> {
  const path = storagePath?.trim();
  if (!path || !isSupabaseServiceRoleConfigured()) return;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(EVENT_COVER_PHOTO_BUCKET).remove([path]);
  if (error) {
    console.warn("[event-cover] failed to delete storage object", { path, error });
  }
}

export async function saveEventCoverPhotoFromUpload(
  eventId: string,
  fileBytes: Uint8Array,
  mimeType: string,
  transform?: CoverPhotoTransform,
): Promise<SavedEventCoverPhoto> {
  await authorizeEventMutation(eventId, COVER_PHOTO_CAPABILITY);

  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error(describeSupabaseServiceRoleConfigError());
  }

  if (!isAllowedCoverPhotoMimeType(mimeType)) {
    throw new Error("Unsupported image type.");
  }

  if (fileBytes.byteLength <= 0 || fileBytes.byteLength > MAX_COVER_PHOTO_BYTES) {
    throw new Error("Cover photo must be under 3 MB.");
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { coverPhotoStoragePath: true },
  });

  if (!existing) {
    throw new Error("Event not found.");
  }

  const storagePath = buildEventCoverPhotoStoragePath(eventId, mimeType);
  assertCoverPhotoStoragePathForEvent(eventId, storagePath);

  const supabase = createServiceRoleClient();
  const { error: uploadError } = await supabase.storage
    .from(EVENT_COVER_PHOTO_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: mimeType,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[event-cover] upload failed", uploadError);
    const message = uploadError.message?.toLowerCase() ?? "";
    if (message.includes("bucket") && (message.includes("not found") || message.includes("does not exist"))) {
      throw new Error(
        `Supabase Storage bucket "${EVENT_COVER_PHOTO_BUCKET}" was not found. ` +
          `Create a public bucket named "${EVENT_COVER_PHOTO_BUCKET}" in Supabase → Storage.`,
      );
    }
    throw new Error(`Could not upload cover photo: ${uploadError.message || "unknown storage error"}.`);
  }

  const normalizedTransform = transform
    ? normalizeCoverPhotoTransform(transform)
    : undefined;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      coverPhotoStoragePath: storagePath,
      coverPhotoTransform:
        normalizedTransform === undefined
          ? Prisma.JsonNull
          : (normalizedTransform as Prisma.InputJsonValue),
    },
    select: { id: true },
  });

  if (
    existing.coverPhotoStoragePath &&
    existing.coverPhotoStoragePath !== storagePath
  ) {
    await deleteEventCoverPhotoStorageByPath(existing.coverPhotoStoragePath);
  }

  const publicUrl = getEventCoverPhotoPublicUrl(storagePath);
  if (!publicUrl) {
    throw new Error(
      "Could not resolve cover photo URL: NEXT_PUBLIC_SUPABASE_URL is not set. " +
        "Add it in Vercel → Project → Settings → Environment Variables (Production), then redeploy.",
    );
  }

  return {
    storagePath,
    publicUrl,
    transform: normalizedTransform,
  };
}

export async function removeEventCoverPhoto(eventId: string): Promise<void> {
  await authorizeEventMutation(eventId, COVER_PHOTO_CAPABILITY);

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { coverPhotoStoragePath: true },
  });

  if (!existing) {
    throw new Error("Event not found.");
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      coverPhotoStoragePath: null,
      coverPhotoTransform: Prisma.JsonNull,
    },
    select: { id: true },
  });

  await deleteEventCoverPhotoStorageByPath(existing.coverPhotoStoragePath);
}

export async function getEventCoverPhotoForRead(eventId: string): Promise<SavedEventCoverPhoto | null> {
  const row = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      coverPhotoStoragePath: true,
      coverPhotoTransform: true,
    },
  });

  if (!row?.coverPhotoStoragePath?.trim()) return null;

  const publicUrl = getEventCoverPhotoPublicUrl(row.coverPhotoStoragePath);
  if (!publicUrl) return null;

  return {
    storagePath: row.coverPhotoStoragePath,
    publicUrl,
    transform: parseCoverPhotoTransformFromDb(row.coverPhotoTransform),
  };
}
