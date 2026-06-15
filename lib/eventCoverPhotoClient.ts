import { normalizeCoverPhotoTransform } from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform } from "@/types/planning";

export type UploadEventCoverPhotoResult = {
  publicUrl: string;
  storagePath: string;
  transform?: CoverPhotoTransform;
};

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

  const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/cover-photo`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not save welcome photo.");
  }

  const payload = (await response.json()) as UploadEventCoverPhotoResult;
  return {
    publicUrl: payload.publicUrl,
    storagePath: payload.storagePath,
    transform: normalizeCoverPhotoTransform(payload.transform),
  };
}

export async function deleteEventCoverPhotoRemote(eventId: string): Promise<void> {
  const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/cover-photo`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not remove welcome photo.");
  }
}
