import { NextResponse } from "next/server";

import {
  COVER_PHOTO_CAPABILITY,
  MAX_COVER_PHOTO_BYTES,
} from "@/lib/eventCoverPhoto";
import {
  removeEventCoverPhoto,
  saveEventCoverPhotoFromUpload,
} from "@/lib/actions/eventCoverPhoto";
import { authorizeEventMutation } from "@/lib/eventAccess/authorize";
import { EventAccessError } from "@/lib/eventAccess/errors";
import { normalizeCoverPhotoTransform } from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform } from "@/types/planning";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function accessErrorResponse(error: EventAccessError): NextResponse {
  const status =
    error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
  return jsonError(error.message, status);
}

function parseTransformField(raw: FormDataEntryValue | null): CoverPhotoTransform | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    return normalizeCoverPhotoTransform(JSON.parse(raw) as CoverPhotoTransform);
  } catch {
    throw new Error("Invalid cover photo transform.");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await context.params;
    await authorizeEventMutation(eventId, COVER_PHOTO_CAPABILITY);

    const formData = await request.formData();
    const fileValue = formData.get("file");
    if (!(fileValue instanceof File)) {
      return jsonError("Cover photo file is required.", 400);
    }

    if (fileValue.size <= 0 || fileValue.size > MAX_COVER_PHOTO_BYTES) {
      return jsonError("Cover photo must be under 3 MB.", 400);
    }

    const transform = parseTransformField(formData.get("transform"));
    const bytes = new Uint8Array(await fileValue.arrayBuffer());
    const mimeType = fileValue.type || "image/jpeg";

    const saved = await saveEventCoverPhotoFromUpload(eventId, bytes, mimeType, transform);
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof EventAccessError) {
      return accessErrorResponse(error);
    }
    console.error("[event-cover] POST failed", error);
    const message = error instanceof Error ? error.message : "Could not save cover photo.";
    return jsonError(message, 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await context.params;
    await removeEventCoverPhoto(eventId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof EventAccessError) {
      return accessErrorResponse(error);
    }
    console.error("[event-cover] DELETE failed", error);
    const message = error instanceof Error ? error.message : "Could not remove cover photo.";
    return jsonError(message, 500);
  }
}
