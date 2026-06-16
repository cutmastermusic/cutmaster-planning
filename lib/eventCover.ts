import { isPersistedCoverPhotoUrl } from "@/lib/eventCoverPhoto";

/** Neutral default hero when no custom cover is uploaded (served from /public). */
export const DEFAULT_EVENT_HERO_SRC = "/images/default-event-hero.svg";

export function hasCustomEventCover(coverPhotoDataUrl?: string): boolean {
  return Boolean(coverPhotoDataUrl?.trim());
}

/** True when the event has its own uploaded/stored welcome photo (not the global default fallback). */
export function hasEventSpecificWelcomePhoto(settings: {
  coverPhotoDataUrl?: string;
  coverPhotoStoragePath?: string;
}): boolean {
  if (settings.coverPhotoStoragePath?.trim()) return true;
  if (isPersistedCoverPhotoUrl(settings.coverPhotoDataUrl)) return true;
  return Boolean(settings.coverPhotoDataUrl?.trim());
}

export type CoupleWelcomePhotoDisplay = {
  displayUrl?: string;
  isEventSpecific: boolean;
};

/** Resolve couple dashboard hero photo: event upload, then global default, then ivory placeholder. */
export function resolveCoupleWelcomePhotoDisplay(input: {
  coverPhotoDataUrl?: string;
  coverPhotoStoragePath?: string;
  defaultWelcomePhotoDataUrl?: string;
}): CoupleWelcomePhotoDisplay {
  const isEventSpecific = hasEventSpecificWelcomePhoto(input);
  if (isEventSpecific) {
    return {
      displayUrl: input.coverPhotoDataUrl?.trim(),
      isEventSpecific: true,
    };
  }

  const defaultUrl = input.defaultWelcomePhotoDataUrl?.trim();
  if (defaultUrl) {
    return {
      displayUrl: defaultUrl,
      isEventSpecific: false,
    };
  }

  return {
    displayUrl: undefined,
    isEventSpecific: false,
  };
}

export function hasPersonalizedWelcomePhotoFlag(settings: {
  hasPersonalizedWelcomePhoto?: boolean;
  coverPhotoDataUrl?: string;
  coverPhotoStoragePath?: string;
}): boolean {
  if (settings.hasPersonalizedWelcomePhoto === true) return true;
  return false;
}

/** One-time backfill for events that already have a couple upload before the flag existed. */
export function backfillWelcomePhotoPersonalizationFlag<
  T extends {
    hasPersonalizedWelcomePhoto?: boolean;
    coverPhotoDataUrl?: string;
    coverPhotoStoragePath?: string;
  },
>(settings: T): T {
  if (settings.hasPersonalizedWelcomePhoto === true) return settings;
  if (hasEventSpecificWelcomePhoto(settings)) {
    return { ...settings, hasPersonalizedWelcomePhoto: true };
  }
  return settings;
}
