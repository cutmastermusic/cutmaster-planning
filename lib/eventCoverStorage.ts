import { normalizeCoverPhotoTransform } from "@/lib/coverPhotoTransform";
import { isPersistedCoverPhotoUrl } from "@/lib/eventCoverPhoto";
import type { CoverPhotoTransform, EventRecord, EventSettings } from "@/types/planning";

/** Per-event cover photos — prototype/local-only fallback when an event is not DB-backed. */
export const EVENT_COVER_PHOTO_STORAGE_KEY = "cutmaster_event_cover_photos_v1";

export type StoredEventCoverPhoto = {
  coverPhotoDataUrl: string;
  coverPhotoTransform?: CoverPhotoTransform;
};

type EventCoverPhotoStore = Record<string, StoredEventCoverPhoto>;

function readStore(): EventCoverPhotoStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EVENT_COVER_PHOTO_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EventCoverPhotoStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: EventCoverPhotoStore): void {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(store).length === 0) {
      window.localStorage.removeItem(EVENT_COVER_PHOTO_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(EVENT_COVER_PHOTO_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn("[event-cover] failed to persist cover photo", error);
  }
}

export function readStoredEventCoverPhoto(eventId: string): StoredEventCoverPhoto | undefined {
  if (!eventId) return undefined;
  const stored = readStore()[eventId];
  if (!stored?.coverPhotoDataUrl?.trim()) return undefined;
  return {
    coverPhotoDataUrl: stored.coverPhotoDataUrl,
    coverPhotoTransform: normalizeCoverPhotoTransform(stored.coverPhotoTransform),
  };
}

export function persistEventCoverPhotoToLocalStorage(
  eventId: string,
  photo: StoredEventCoverPhoto | undefined,
): void {
  if (!eventId) return;
  const store = readStore();
  if (!photo?.coverPhotoDataUrl?.trim()) {
    delete store[eventId];
  } else {
    store[eventId] = {
      coverPhotoDataUrl: photo.coverPhotoDataUrl,
      coverPhotoTransform: normalizeCoverPhotoTransform(photo.coverPhotoTransform),
    };
  }
  writeStore(store);
}

export function clearEventCoverPhotoFromLocalStorage(eventId: string): void {
  persistEventCoverPhotoToLocalStorage(eventId, undefined);
}

/** Prefer DB/storage URLs; local cache only for non-DB prototype events. */
export function mergeStoredEventCoverIntoSettings(
  eventId: string,
  settings: EventSettings,
  options?: { isDbBacked?: boolean },
): EventSettings {
  if (settings.coverPhotoStoragePath || isPersistedCoverPhotoUrl(settings.coverPhotoDataUrl)) {
    return settings;
  }

  if (options?.isDbBacked) {
    const next = { ...settings };
    delete next.coverPhotoDataUrl;
    delete next.coverPhotoTransform;
    delete next.coverPhotoStoragePath;
    return next;
  }

  const stored = readStoredEventCoverPhoto(eventId);
  if (!stored) {
    const next = { ...settings };
    delete next.coverPhotoDataUrl;
    delete next.coverPhotoTransform;
    delete next.coverPhotoStoragePath;
    return next;
  }
  return {
    ...settings,
    coverPhotoDataUrl: stored.coverPhotoDataUrl,
    coverPhotoTransform: stored.coverPhotoTransform,
  };
}

export function mergeStoredEventCoversIntoEvents(
  events: EventRecord[],
  dbBackedEventIds?: ReadonlySet<string>,
): EventRecord[] {
  if (typeof window === "undefined") return events;
  return events.map((evt) => ({
    ...evt,
    settings: mergeStoredEventCoverIntoSettings(evt.id, evt.settings, {
      isDbBacked: dbBackedEventIds?.has(evt.id),
    }),
  }));
}
