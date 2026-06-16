import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import { normalizeDefaultTimelineMomentKey } from "@/lib/restoreDefaultTimelineMoments";
import { isToastTimelineItem } from "@/lib/speechesToasts";

export const TIMELINE_MOMENT_TYPES = [
  "ceremony",
  "playlist",
  "introduction",
  "speech",
  "meal",
  "dance",
  "tradition",
  "photo",
  "open_dance",
  "exit",
  "custom",
] as const;

export type TimelineMomentType = (typeof TIMELINE_MOMENT_TYPES)[number];

export function isTimelineMomentType(value: string | null | undefined): value is TimelineMomentType {
  return TIMELINE_MOMENT_TYPES.includes(value as TimelineMomentType);
}

export function normalizeTimelineMomentType(
  value: string | null | undefined,
): TimelineMomentType | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return isTimelineMomentType(normalized) ? normalized : undefined;
}

export function inferTimelineMomentType(title: string): TimelineMomentType {
  if (isToastTimelineItem(title)) return "speech";
  if (isGrandEntranceTimelineItem(title)) return "introduction";

  const key = normalizeDefaultTimelineMomentKey(title);

  if (
    key === "pre-ceremony" ||
    key === "ceremony" ||
    /\bceremony\b/.test(key) ||
    /processional|recessional|unity|vows|readings|signing/.test(key)
  ) {
    return "ceremony";
  }

  if (/grand entrance|introduction|wedding party entrance/.test(key)) return "introduction";
  if (/speech|toast|welcome|blessing|remarks/.test(key)) return "speech";
  if (/cocktail hour|dinner|lunch|brunch|meal|bar service|dessert|salads|entree|seated/.test(key)) {
    return "meal";
  }
  if (/first dance|father[-/ ]daughter|mother[-/ ]son|parent dance|formal dance|last dance/.test(key)) {
    return "dance";
  }
  if (/open danc|dance floor open|dancing begins|open dancing/.test(key)) return "open_dance";
  if (
    /cake cutting|bouquet|garter|tradition|horah|money dance|sword|lantern|shoe game|anniversary dance/.test(
      key,
    )
  ) {
    return "tradition";
  }
  if (/photo|picture|portrait|formals/.test(key)) return "photo";
  if (/exit|send.?off|getaway|farewell|departure|sparkler send/.test(key)) return "exit";
  if (/playlist|background music|ambient music|cocktail hour music/.test(key)) return "playlist";

  return "custom";
}

export function resolveTimelineMomentType(item: {
  title: string;
  momentType?: TimelineMomentType | string | null;
}): TimelineMomentType {
  const stored = normalizeTimelineMomentType(item.momentType ?? undefined);
  if (stored) return stored;
  return inferTimelineMomentType(item.title);
}

export function timelineMomentTypeLabel(type: TimelineMomentType): string {
  switch (type) {
    case "ceremony":
      return "Ceremony";
    case "playlist":
      return "Playlist";
    case "introduction":
      return "Introduction";
    case "speech":
      return "Toast / Speech";
    case "meal":
      return "Meal";
    case "dance":
      return "Dance";
    case "tradition":
      return "Tradition";
    case "photo":
      return "Photo";
    case "open_dance":
      return "Open dance";
    case "exit":
      return "Exit";
    case "custom":
      return "Custom";
  }
}

/** Light contextual copy for couple timeline cards — references planning homes, never duplicates data. */
export function coupleTimelineMomentReferenceHint(type: TimelineMomentType): string | null {
  switch (type) {
    case "ceremony":
      return "Ceremony details live in Ceremony planning — this moment holds timing and flow.";
    case "playlist":
    case "dance":
    case "open_dance":
      return "Song and playlist details live in Music Hub — referenced here for timing.";
    case "introduction":
      return "Lineup and introductions reference People & Vendors and reception planning.";
    case "speech":
      return "Speaker details reference reception planning — not duplicated on the timeline.";
    case "meal":
      return "Meal timing lives here; menu and service stay with your venue team.";
    case "tradition":
      return "Tradition timing here; specific details may live in reception planning.";
    case "photo":
      return "Photo timing here; shot lists stay with your photographer.";
    case "exit":
      return "Send-off timing here; logistics stay with your planner and vendors.";
    case "custom":
      return null;
  }
}
