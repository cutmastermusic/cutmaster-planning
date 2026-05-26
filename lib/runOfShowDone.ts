import type { CeremonyTimelineItem, TimelineItem } from "@/types/planning";

export const RUN_OF_SHOW_DONE_STORAGE_KEY = "cutmaster_run_of_show_done_v1";

export function buildRunOfShowDoneKeysFromTimeline(
  ceremonyItems: CeremonyTimelineItem[],
  receptionItems: TimelineItem[],
): Set<string> {
  const keys = new Set<string>();
  for (const item of ceremonyItems) {
    if (item.runOfShowDone) keys.add(`c:${item.id}`);
  }
  for (const item of receptionItems) {
    if (item.runOfShowDone) keys.add(`r:${item.id}`);
  }
  return keys;
}

export function clearRunOfShowDoneOnTimeline(
  ceremonyItems: CeremonyTimelineItem[],
  receptionItems: TimelineItem[],
): { ceremonyItems: CeremonyTimelineItem[]; receptionItems: TimelineItem[] } {
  return {
    ceremonyItems: ceremonyItems.map((item) =>
      item.runOfShowDone ? { ...item, runOfShowDone: false } : item,
    ),
    receptionItems: receptionItems.map((item) =>
      item.runOfShowDone ? { ...item, runOfShowDone: false } : item,
    ),
  };
}

/** One-time bridge: apply browser-local done keys onto timeline rows missing DB flags. */
export function mergeLocalRunOfShowDoneKeysIntoTimeline(
  ceremonyItems: CeremonyTimelineItem[],
  receptionItems: TimelineItem[],
  localDoneKeys: Iterable<string>,
): {
  ceremonyItems: CeremonyTimelineItem[];
  receptionItems: TimelineItem[];
  changed: boolean;
} {
  const local = new Set(localDoneKeys);
  let changed = false;
  const nextCeremony = ceremonyItems.map((item) => {
    if (!item.runOfShowDone && local.has(`c:${item.id}`)) {
      changed = true;
      return { ...item, runOfShowDone: true };
    }
    return item;
  });
  const nextReception = receptionItems.map((item) => {
    if (!item.runOfShowDone && local.has(`r:${item.id}`)) {
      changed = true;
      return { ...item, runOfShowDone: true };
    }
    return item;
  });
  return {
    ceremonyItems: nextCeremony,
    receptionItems: nextReception,
    changed,
  };
}

export function readLocalRunOfShowDoneKeysForEvent(
  storageKey: string,
  eventId: string,
): string[] {
  if (typeof window === "undefined" || !eventId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    const keys = map[eventId];
    return Array.isArray(keys) ? keys : [];
  } catch {
    return [];
  }
}
