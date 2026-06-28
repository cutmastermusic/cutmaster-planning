"use server";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { authorizePlatformMutation, requireAuth } from "@/lib/eventAccess/authorize";
import { createServiceRoleClient, describeSupabaseServiceRoleConfigError, isSupabaseServiceRoleConfigured } from "@/lib/supabase/admin";
import {
  MAX_STAFF_PROFILE_PHOTO_BYTES,
  STAFF_PROFILE_PHOTO_BUCKET,
  type StaffProfilePhotoTransform,
  buildStaffProfilePhotoStoragePath,
  getStaffProfilePhotoPublicUrl,
  isAllowedStaffProfilePhotoMimeType,
  normalizeStaffProfilePhotoTransform,
} from "@/lib/staffProfilePhoto";

export type SavedStaffProfilePhoto = {
  storagePath: string;
  publicUrl: string;
  transform: StaffProfilePhotoTransform;
  staffMemberId?: string;
};

async function deleteStaffProfilePhotoStorageByPath(
  storagePath: string | null | undefined,
): Promise<void> {
  const path = storagePath?.trim();
  if (!path || !isSupabaseServiceRoleConfigured()) return;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(STAFF_PROFILE_PHOTO_BUCKET).remove([path]);
  if (error) {
    console.warn("[staff-photo] failed to delete storage object", { path, error });
  }
}

export async function saveStaffProfilePhotoFromUpload(
  fileBytes: Uint8Array,
  mimeType: string,
  staffMemberId?: string,
  transform?: Partial<StaffProfilePhotoTransform>,
): Promise<SavedStaffProfilePhoto> {
  const access = staffMemberId
    ? await authorizePlatformMutation("workspace:team:write")
    : await requireAuth();

  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error(describeSupabaseServiceRoleConfigError());
  }

  if (!isAllowedStaffProfilePhotoMimeType(mimeType)) {
    throw new Error("Unsupported image type.");
  }

  if (fileBytes.byteLength <= 0 || fileBytes.byteLength > MAX_STAFF_PROFILE_PHOTO_BYTES) {
    throw new Error("Profile photo must be under 3 MB.");
  }

  let existingStoragePath: string | null | undefined;
  let storageOwnerKey = access.dbUser?.id ?? "demo";
  let teamMemberEmail: string | null | undefined;

  if (staffMemberId) {
    const row = await prisma.companyTeamMember.findUnique({
      where: { id: staffMemberId },
      select: {
        id: true,
        email: true,
        profilePhotoStoragePath: true,
      },
    });
    if (!row) {
      throw new Error("Staff member not found.");
    }
    existingStoragePath = row.profilePhotoStoragePath;
    storageOwnerKey = row.id;
    teamMemberEmail = row.email;
  } else {
    if (!access.dbUser?.id) {
      throw new Error("Sign in required.");
    }
    const row = await prisma.user.findUnique({
      where: { id: access.dbUser.id },
      select: { profilePhotoStoragePath: true },
    });
    existingStoragePath = row?.profilePhotoStoragePath;
  }

  const storagePath = buildStaffProfilePhotoStoragePath(storageOwnerKey, mimeType);

  const supabase = createServiceRoleClient();
  const { error: uploadError } = await supabase.storage
    .from(STAFF_PROFILE_PHOTO_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: mimeType,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    const message = uploadError.message?.toLowerCase() ?? "";
    if (message.includes("bucket") && (message.includes("not found") || message.includes("does not exist"))) {
      throw new Error(
        `Supabase Storage bucket "${STAFF_PROFILE_PHOTO_BUCKET}" was not found. ` +
          `Create a public bucket named "${STAFF_PROFILE_PHOTO_BUCKET}" in Supabase → Storage.`,
      );
    }
    throw new Error(`Could not upload profile photo: ${uploadError.message || "unknown storage error"}.`);
  }

  const normalizedTransform = normalizeStaffProfilePhotoTransform(transform);

  if (staffMemberId) {
    await prisma.companyTeamMember.update({
      where: { id: staffMemberId },
      data: {
        profilePhotoStoragePath: storagePath,
        profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    const normalizedEmail = teamMemberEmail?.trim().toLowerCase();
    if (normalizedEmail) {
      await prisma.user.updateMany({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        data: {
          profilePhotoStoragePath: storagePath,
          profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue,
        },
      });
    }
  } else if (access.dbUser?.id) {
    await prisma.user.update({
      where: { id: access.dbUser.id },
      data: {
        profilePhotoStoragePath: storagePath,
        profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    const normalizedEmail = access.email?.trim().toLowerCase();
    if (normalizedEmail) {
      await prisma.companyTeamMember.updateMany({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        data: {
          profilePhotoStoragePath: storagePath,
          profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue,
        },
      });
    }
  }

  if (existingStoragePath && existingStoragePath !== storagePath) {
    await deleteStaffProfilePhotoStorageByPath(existingStoragePath);
  }

  const publicUrl = getStaffProfilePhotoPublicUrl(storagePath);
  if (!publicUrl) {
    throw new Error(
      "Could not resolve staff profile photo URL: NEXT_PUBLIC_SUPABASE_URL is not set.",
    );
  }

  return {
    storagePath,
    publicUrl,
    transform: normalizedTransform,
    staffMemberId,
  };
}

export async function updateStaffProfilePhotoTransform(
  transform: Partial<StaffProfilePhotoTransform>,
  staffMemberId?: string,
): Promise<{ transform: StaffProfilePhotoTransform; staffMemberId?: string }> {
  const normalizedTransform = normalizeStaffProfilePhotoTransform(transform);

  if (staffMemberId) {
    await authorizePlatformMutation("workspace:team:write");
    const row = await prisma.companyTeamMember.findUnique({
      where: { id: staffMemberId },
      select: { id: true, email: true },
    });
    if (!row) {
      throw new Error("Staff member not found.");
    }

    await prisma.companyTeamMember.update({
      where: { id: staffMemberId },
      data: { profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue },
      select: { id: true },
    });

    const normalizedEmail = row.email?.trim().toLowerCase();
    if (normalizedEmail) {
      await prisma.user.updateMany({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        data: { profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue },
      });
    }

    return { transform: normalizedTransform, staffMemberId };
  }

  const access = await requireAuth();
  if (!access.dbUser?.id) {
    throw new Error("Sign in required.");
  }

  await prisma.user.update({
    where: { id: access.dbUser.id },
    data: { profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue },
    select: { id: true },
  });

  const normalizedEmail = access.email?.trim().toLowerCase();
  if (normalizedEmail) {
    await prisma.companyTeamMember.updateMany({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      data: { profilePhotoTransform: normalizedTransform as Prisma.InputJsonValue },
    });
  }

  return { transform: normalizedTransform };
}
