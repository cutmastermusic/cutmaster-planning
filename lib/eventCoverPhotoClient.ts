import { normalizeCoverPhotoTransform } from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform } from "@/types/planning";

export type UploadEventCoverPhotoResult = {
  publicUrl: string;
  storagePath: string;
  transform?: CoverPhotoTransform;
};

async function readUploadErrorMessage(response: Response): Promise<string> {
  const fallback = "Could not save welcome photo.";
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as { error?: string; message?: string };
      return body.error || body.message || fallback;
    }
    const text = (await response.text()).trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function uploadEventCoverPhoto(
  eventId: string,
  file: File,
  transform?: CoverPhotoTransform,
): Promise<UploadEventCoverPhotoResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (transform) {
    formData.append("transform", JSON.stringify(transform));
  }

  let response: Response;
  try {
    response = await fetch(`/api/events/${encodeURIComponent(eventId)}/cover-photo`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Could not reach the server to save your photo. Check your connection and try again. If this keeps happening, the image may be too large or welcome photo storage may not be configured in production.",
      );
    }
    throw error instanceof Error ? error : new Error("Could not save welcome photo.");
  }

  if (!response.ok) {
    throw new Error(await readUploadErrorMessage(response));
  }

  const payload = (await response.json()) as UploadEventCoverPhotoResult;
  return {
    publicUrl: payload.publicUrl,
    storagePath: payload.storagePath,
    transform: normalizeCoverPhotoTransform(payload.transform),
  };
}

export async function deleteEventCoverPhotoRemote(eventId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/events/${encodeURIComponent(eventId)}/cover-photo`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Could not reach the server to remove your photo. Check your connection and try again.");
    }
    throw error instanceof Error ? error : new Error("Could not remove welcome photo.");
  }

  if (!response.ok) {
    throw new Error(await readUploadErrorMessage(response));
  }
}
