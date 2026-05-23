/** Neutral default hero when no custom cover is uploaded (served from /public). */
export const DEFAULT_EVENT_HERO_SRC = "/images/default-event-hero.svg";

export function hasCustomEventCover(coverPhotoDataUrl?: string): boolean {
  return Boolean(coverPhotoDataUrl?.trim());
}
