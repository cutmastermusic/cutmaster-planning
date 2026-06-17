import { resolveCoupleWelcomePhotoDisplay } from "@/lib/eventCover";
import type { CoupleWelcomePhotoDisplay } from "@/lib/eventCover";

type PhotoTraceFields = {
  eventId?: string | null;
  coverPhotoStoragePath?: string | null;
  coverPhotoDataUrl?: string | null;
  defaultWelcomePhotoDataUrl?: string;
};

/** TEMPORARY — trace welcome photo hydration on refresh. */
export function logPhotoTrace(
  step: number,
  fields: PhotoTraceFields,
  resolved?: CoupleWelcomePhotoDisplay,
): void {
  const display =
    resolved ??
    resolveCoupleWelcomePhotoDisplay({
      coverPhotoDataUrl: fields.coverPhotoDataUrl ?? undefined,
      coverPhotoStoragePath: fields.coverPhotoStoragePath ?? undefined,
      defaultWelcomePhotoDataUrl: fields.defaultWelcomePhotoDataUrl,
    });

  console.log(`[PHOTO TRACE] ${step}`, {
    eventId: fields.eventId ?? undefined,
    coverPhotoStoragePath: fields.coverPhotoStoragePath ?? undefined,
    coverPhotoDataUrl: fields.coverPhotoDataUrl ?? undefined,
    displayUrl: display.displayUrl,
    isEventSpecific: display.isEventSpecific,
  });
}
