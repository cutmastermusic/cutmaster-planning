import { NextResponse } from "next/server";

import {
  saveStaffProfilePhotoFromUpload,
  updateStaffProfilePhotoTransform,
} from "@/lib/actions/staffProfilePhoto";
import { EventAccessError } from "@/lib/eventAccess/errors";
import {
  MAX_STAFF_PROFILE_PHOTO_BYTES,
  type StaffProfilePhotoTransform,
  normalizeStaffProfilePhotoTransform,
} from "@/lib/staffProfilePhoto";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function accessErrorResponse(error: EventAccessError): NextResponse {
  const status =
    error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
  return jsonError(error.message, status);
}

function parseTransform(raw: FormDataEntryValue | null): StaffProfilePhotoTransform | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    return normalizeStaffProfilePhotoTransform(JSON.parse(raw) as Partial<StaffProfilePhotoTransform>);
  } catch {
    throw new Error("Invalid profile photo transform.");
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    if (!(fileValue instanceof File)) {
      return jsonError("Profile photo file is required.", 400);
    }

    if (fileValue.size <= 0 || fileValue.size > MAX_STAFF_PROFILE_PHOTO_BYTES) {
      return jsonError("Profile photo must be under 3 MB.", 400);
    }

    const staffMemberIdValue = formData.get("staffMemberId");
    const staffMemberId =
      typeof staffMemberIdValue === "string" && staffMemberIdValue.trim()
        ? staffMemberIdValue.trim()
        : undefined;

    const bytes = new Uint8Array(await fileValue.arrayBuffer());
    const mimeType = fileValue.type || "image/jpeg";
    const transform = parseTransform(formData.get("transform"));
    const saved = await saveStaffProfilePhotoFromUpload(bytes, mimeType, staffMemberId, transform);
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof EventAccessError) {
      return accessErrorResponse(error);
    }
    console.error("[staff-photo] POST failed", error);
    const message = error instanceof Error ? error.message : "Could not save profile photo.";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      staffMemberId?: string;
      transform?: Partial<StaffProfilePhotoTransform>;
    };

    const saved = await updateStaffProfilePhotoTransform(
      normalizeStaffProfilePhotoTransform(body.transform),
      body.staffMemberId?.trim() || undefined,
    );
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof EventAccessError) {
      return accessErrorResponse(error);
    }
    console.error("[staff-photo] PATCH failed", error);
    const message = error instanceof Error ? error.message : "Could not update profile photo crop.";
    return jsonError(message, 500);
  }
}
