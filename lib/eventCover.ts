import { getEventCoverPhotoPublicUrl, isPersistedCoverPhotoUrl } from "@/lib/eventCoverPhoto";

/** Neutral default hero when no custom cover is uploaded (served from /public). */
export const DEFAULT_EVENT_HERO_SRC = "/images/default-event-hero.svg";

export function hasCustomEventCover(coverPhotoDataUrl?: string | null): boolean {
  return Boolean(coverPhotoDataUrl?.trim());
}

/** True when the event has its own uploaded/stored welcome photo (not the global default fallback). */
export function hasEventSpecificWelcomePhoto(settings: {
  coverPhotoDataUrl?: string | null;
  coverPhotoStoragePath?: string | null;
}): boolean {
  if (settings.coverPhotoStoragePath?.trim()) return true;
  if (isPersistedCoverPhotoUrl(settings.coverPhotoDataUrl ?? undefined)) return true;
  return Boolean(settings.coverPhotoDataUrl?.trim());
}

export type CoupleWelcomePhotoDisplay = {
  displayUrl: string;
  isEventSpecific: boolean;
};

function resolveEventSpecificCoverDisplayUrl(input: {
  coverPhotoDataUrl?: string | null;
  coverPhotoStoragePath?: string | null;
}): string | undefined {
  const fromDataUrl = input.coverPhotoDataUrl?.trim();
  if (fromDataUrl) return fromDataUrl;
  return getEventCoverPhotoPublicUrl(input.coverPhotoStoragePath);
}

/** Resolve event hero photo: event upload, then global default, then built-in event default. */
export function resolveEventHeroImageDisplay(input: {
  coverPhotoDataUrl?: string | null;
  coverPhotoStoragePath?: string | null;
  defaultWelcomePhotoDataUrl?: string | null;
}): CoupleWelcomePhotoDisplay {
  const eventDisplayUrl = hasEventSpecificWelcomePhoto(input)
    ? resolveEventSpecificCoverDisplayUrl(input)
    : undefined;

  if (eventDisplayUrl) {
    return {
      displayUrl: eventDisplayUrl,
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
    displayUrl: DEFAULT_EVENT_HERO_SRC,
    isEventSpecific: false,
  };
}

/** Backward-compatible name for couple dashboard/welcome photo callers. */
export function resolveCoupleWelcomePhotoDisplay(input: {
  coverPhotoDataUrl?: string | null;
  coverPhotoStoragePath?: string | null;
  defaultWelcomePhotoDataUrl?: string | null;
}): CoupleWelcomePhotoDisplay {
  return resolveEventHeroImageDisplay(input);
}

export function hasPersonalizedWelcomePhotoFlag(settings: {
  hasPersonalizedWelcomePhoto?: boolean;
  coverPhotoDataUrl?: string | null;
  coverPhotoStoragePath?: string | null;
}): boolean {
  if (settings.hasPersonalizedWelcomePhoto === true) return true;
  return false;
}

/** One-time backfill for events that already have a couple upload before the flag existed. */
export function backfillWelcomePhotoPersonalizationFlag<
  T extends {
    hasPersonalizedWelcomePhoto?: boolean;
    coverPhotoDataUrl?: string | null;
    coverPhotoStoragePath?: string | null;
  },
>(settings: T): T {
  if (settings.hasPersonalizedWelcomePhoto === true) return settings;
  if (hasEventSpecificWelcomePhoto(settings)) {
    return { ...settings, hasPersonalizedWelcomePhoto: true };
  }
  return settings;
}
