import type { CeremonyTimelineItem, TimelineCategory, TimelineItem } from "@/types/planning";

/** Suggested ceremony moment titles for brand-new Wedding events (order matters). */
export const NEW_WEDDING_CEREMONY_TIMELINE_MOMENTS = [
  "Pre-Ceremony Music",
  "Prelude",
  "Family Processional",
  "Wedding Party Processional",
  "Bride Processional",
  "During Ceremony",
  "Recessional",
] as const;

/** Suggested main-timeline moment titles for brand-new Wedding events (order matters). */
export const NEW_WEDDING_MAIN_TIMELINE_MOMENTS = [
  "Ceremony",
  "Cocktail Hour",
  "Grand Entrance",
  "First Dance",
  "Dinner",
  "Speeches / Toasts",
  "Cake Cutting",
  "Father-Daughter Dance",
  "Mother-Son Dance",
  "Group Photo",
  "Open Dancing",
  "Last Dance",
] as const;

export function categoryForWeddingMoment(title: (typeof NEW_WEDDING_MAIN_TIMELINE_MOMENTS)[number]): TimelineCategory {
  switch (title) {
    case "Cocktail Hour":
      return "Cocktail Hour";
    case "Grand Entrance":
    case "First Dance":
    case "Speeches / Toasts":
    case "Cake Cutting":
    case "Father-Daughter Dance":
    case "Mother-Son Dance":
      return "Formalities";
    case "Open Dancing":
    case "Last Dance":
      return "Dancing";
    default:
      return "Reception";
  }
}

/**
 * Ceremony timeline rows for a newly created Wedding (or Gender-Neutral Wedding) event only.
 * Structure and order are fixed; times and songs stay blank.
 */
export function buildNewWeddingCeremonyTimelineItems(): CeremonyTimelineItem[] {
  const stamp = Date.now();
  return NEW_WEDDING_CEREMONY_TIMELINE_MOMENTS.map((moment, index) => ({
    id: `ceremony-timeline-wedding-${stamp}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    timeOrOrder: "",
    moment,
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  }));
}

const DEFAULT_CEREMONY_MOMENT_KEYS = new Set(
  NEW_WEDDING_CEREMONY_TIMELINE_MOMENTS.map((moment) => moment.toLowerCase()),
);

export function isDefaultWeddingCeremonyMoment(moment: string): boolean {
  return DEFAULT_CEREMONY_MOMENT_KEYS.has(moment.trim().toLowerCase());
}

function ceremonyTimelineRowDetailScore(item: CeremonyTimelineItem): number {
  let score = 0;
  if (item.timeOrOrder?.trim()) score += 4;
  if (item.songTitle?.trim()) score += 2;
  if (item.artist?.trim()) score += 2;
  if (item.notes?.trim()) score += 1;
  return score;
}

/**
 * Collapse duplicate default wedding ceremony rows (e.g. preset append after seed).
 * Keeps the richest row per default moment title; custom duplicate titles are preserved.
 */
export function dedupeCeremonyTimelineDefaultDuplicates(
  items: CeremonyTimelineItem[],
): CeremonyTimelineItem[] {
  const groups = new Map<string, CeremonyTimelineItem[]>();

  for (const item of items) {
    if (!isDefaultWeddingCeremonyMoment(item.moment)) continue;
    const key = item.moment.trim().toLowerCase();
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  if ([...groups.values()].every((group) => group.length <= 1)) {
    return items;
  }

  const pickBest = (rows: CeremonyTimelineItem[]): CeremonyTimelineItem =>
    rows.reduce((best, row) =>
      ceremonyTimelineRowDetailScore(row) > ceremonyTimelineRowDetailScore(best) ? row : best,
    );

  const seenDefault = new Set<string>();
  const result: CeremonyTimelineItem[] = [];

  for (const item of items) {
    const key = item.moment.trim().toLowerCase();
    if (!isDefaultWeddingCeremonyMoment(item.moment)) {
      result.push(item);
      continue;
    }
    if (seenDefault.has(key)) continue;
    seenDefault.add(key);
    const group = groups.get(key)!;
    result.push(group.length === 1 ? item : pickBest(group));
  }

  return result;
}

/** When appending presets, skip default ceremony moments that already exist. */
export function filterCeremonyPresetAppendItems(
  existing: CeremonyTimelineItem[],
  incoming: CeremonyTimelineItem[],
): CeremonyTimelineItem[] {
  const existingDefaultKeys = new Set(
    existing
      .filter((item) => isDefaultWeddingCeremonyMoment(item.moment))
      .map((item) => item.moment.trim().toLowerCase()),
  );
  return incoming.filter((item) => {
    if (!isDefaultWeddingCeremonyMoment(item.moment)) return true;
    return !existingDefaultKeys.has(item.moment.trim().toLowerCase());
  });
}

/**
 * Reception/main timeline rows for a newly created Wedding event only.
 * Structure and order are fixed; all times and songs stay blank.
 */
export function buildNewWeddingMainTimelineItems(): TimelineItem[] {
  const stamp = Date.now();
  return NEW_WEDDING_MAIN_TIMELINE_MOMENTS.map((title, index) => ({
    id: `timeline-wedding-${stamp}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    time: "",
    category: categoryForWeddingMoment(title),
    notes: "",
    needsDjMcAttention: false,
  }));
}
