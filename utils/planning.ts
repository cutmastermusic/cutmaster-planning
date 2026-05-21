import type {
  CeremonySongPlan,
  CeremonyTimelineItem,
  ChecklistStatus,
  DisplayTimelineItem,
  EventRecord,
  Formality,
  GuestRequestEntry,
  PlanningInsight,
  SongEntry,
  TimelineCategory,
  TimelineItem,
  TimelinePresetItem,
} from "@/types/planning";
import { PLAYLIST_BUCKET_IDS } from "@/types/planning";
import { musicTasteProfileHasSelections, normalizeMusicTasteProfile } from "@/data/musicTasteProfileCatalog";
import { normalizeVendorsArray } from "@/utils/vendors";

export function parseTimeToMinutesValue(rawTime: string): number {
  const value = rawTime.trim().toUpperCase();
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return Number.NaN;
  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3] === "PM") hours += 12;
  return hours * 60 + minutes;
}

function twelveHourClockToMinutes(hour12: number, minutes: number, mer: "AM" | "PM"): number | null {
  if (hour12 < 1 || hour12 > 12 || minutes > 59) return null;
  let h24 = hour12 % 12;
  if (mer === "PM") h24 += 12;
  return h24 * 60 + minutes;
}

/**
 * Parses common event time labels into minutes from midnight for sorting.
 * Returns null when the string is not a parseable clock time (e.g. "Grand entrance", "3").
 */
export function parseFlexibleTimeToMinutes(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/\d/.test(trimmed)) return null;

  const parseOne = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;

    // 7 PM / 7PM / 7 pm
    let m = t.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (m) {
      const h = Number(m[1]);
      const mer = m[2].toUpperCase() as "AM" | "PM";
      return twelveHourClockToMinutes(h, 0, mer);
    }

    // H:MM with optional AM/PM; bare H:MM uses 24h for 13–23, PM heuristic for 1–11, noon for 12
    m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (m) {
      const h = Number(m[1]);
      const min = Number(m[2]);
      const mer = m[3]?.toUpperCase() as "AM" | "PM" | undefined;
      if (min > 59 || h > 24) return null;
      if (mer === "AM" || mer === "PM") {
        if (h < 1 || h > 12) return null;
        return twelveHourClockToMinutes(h, min, mer);
      }
      if (h >= 13 && h <= 23) return h * 60 + min;
      if (h === 12) return 12 * 60 + min;
      if (h >= 1 && h <= 11) return (h + 12) * 60 + min;
      if (h === 0 && min <= 59) return min;
      return null;
    }

    return null;
  };

  let result = parseOne(trimmed);
  if (result !== null) return result;

  const embedded = trimmed.match(/\d{1,2}:\d{2}(?:\s*(?:AM|PM))?|\d{1,2}\s*(?:AM|PM)/i);
  if (embedded?.[0]) {
    result = parseOne(embedded[0]);
    if (result !== null) return result;
  }

  return null;
}

/** Insert a reception/main timeline row by parsed clock order; stable ties; unparsed rows stay after timed blocks. */
export function insertReceptionTimelineItemChronologically(
  items: TimelineItem[],
  newItem: TimelineItem,
): TimelineItem[] {
  const newM = parseFlexibleTimeToMinutes(newItem.time);
  if (newM === null) return [...items, newItem];

  let insertAt = items.length;
  for (let i = 0; i < items.length; i++) {
    const m = parseFlexibleTimeToMinutes(items[i].time);
    if (m !== null && m > newM) {
      insertAt = i;
      break;
    }
    if (m !== null && m <= newM) {
      insertAt = i + 1;
    }
  }
  const next = [...items];
  next.splice(insertAt, 0, newItem);
  return next;
}

/** Prisma `TimelineItem` row shape used when hydrating events from the database. */
export type DbTimelineItemRow = {
  id: string;
  time: string | null;
  title: string;
  category: string | null;
  notes: string | null;
  needsDjMcAttention: boolean;
  songTitle: string | null;
  artist: string | null;
  fadeOutEarly: boolean;
  fadeOutTimestamp: string | null;
  order: number;
};

export function mapMainTimelineItemsForDatabase(items: TimelineItem[]) {
  return items.map((item, index) => ({
    time: item.time?.trim() || null,
    title: item.title,
    category: item.category || null,
    notes: item.notes?.trim() || null,
    needsDjMcAttention: item.needsDjMcAttention ?? false,
    songTitle: item.songTitle?.trim() || null,
    artist: item.artist?.trim() || null,
    fadeOutEarly: item.fadeOutEarly ?? false,
    fadeOutTimestamp: item.fadeOutTimestamp?.trim() || null,
    order: index,
  }));
}

export function mapCeremonyTimelineItemsForDatabase(items: CeremonyTimelineItem[]) {
  return items.map((item, index) => ({
    time: item.timeOrOrder?.trim() || null,
    title: item.moment,
    category: null,
    notes: item.notes?.trim() || null,
    needsDjMcAttention: item.needsDjMcAttention ?? false,
    songTitle: item.songTitle?.trim() || null,
    artist: item.artist?.trim() || null,
    fadeOutEarly: false,
    fadeOutTimestamp: null,
    order: index,
  }));
}

export function mapDatabaseRowsToMainTimelineItems(rows: DbTimelineItemRow[]): TimelineItem[] {
  return rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((row) => {
      const item: TimelineItem = {
        id: row.id,
        title: row.title,
        time: row.time ?? "",
        category: (row.category as TimelineCategory) || "Reception",
        notes: row.notes ?? "",
        needsDjMcAttention: row.needsDjMcAttention ?? false,
      };
      const song = row.songTitle?.trim();
      const artist = row.artist?.trim();
      if (song) item.songTitle = song;
      if (artist) item.artist = artist;
      if (row.fadeOutEarly) item.fadeOutEarly = row.fadeOutEarly;
      if (row.fadeOutTimestamp?.trim()) item.fadeOutTimestamp = row.fadeOutTimestamp.trim();
      return item;
    });
}

export function mapDatabaseRowsToCeremonyTimelineItems(
  rows: DbTimelineItemRow[],
): CeremonyTimelineItem[] {
  return rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((row) => ({
      id: row.id,
      timeOrOrder: row.time ?? "",
      moment: row.title,
      songTitle: row.songTitle ?? "",
      artist: row.artist ?? "",
      notes: row.notes ?? "",
      needsDjMcAttention: row.needsDjMcAttention ?? false,
    }));
}

/** Reception timeline row from a Global Settings preset (structure-first: blank fields stay blank). */
export function mainTimelineItemFromPreset(item: TimelinePresetItem, id: string): TimelineItem {
  const song = item.songPlaceholder?.trim();
  const notes = item.notesPlaceholder?.trim() ?? "";
  const row: TimelineItem = {
    id,
    title: item.momentName,
    time: item.timeOrOrder?.trim() ?? "",
    category: item.timelineCategory ?? "Reception",
    notes,
    needsDjMcAttention: false,
  };
  if (song) row.songTitle = song;
  return row;
}

/** Ceremony timeline row from a Global Settings preset. */
export function ceremonyTimelineItemFromPreset(item: TimelinePresetItem, id: string): CeremonyTimelineItem {
  const song = item.songPlaceholder?.trim() ?? "";
  return {
    id,
    timeOrOrder: item.timeOrOrder?.trim() ?? "",
    moment: item.momentName,
    songTitle: song,
    artist: "",
    notes: item.notesPlaceholder?.trim() ?? "",
    needsDjMcAttention: false,
  };
}

/** Converts legacy formality records into reception timeline rows (single timeline workflow). */
export function formalityRecordToTimelineItem(f: Formality): TimelineItem {
  return {
    id: f.id,
    time: f.time,
    title: f.momentName,
    category: "Formalities",
    notes: f.notes,
    needsDjMcAttention: f.needsDjMcAttention,
    songTitle: f.songTitle,
    artist: f.artist,
    fadeOutEarly: f.fadeOutEarly,
    fadeOutTimestamp: f.fadeOutTimestamp,
  };
}

/** Stable chronological sort for reception timeline rows (unparsed times keep seed order). */
export function sortTimelineItemsChronologically(items: TimelineItem[]): TimelineItem[] {
  const indexed = items.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    const ma = parseFlexibleTimeToMinutes(a.item.time);
    const mb = parseFlexibleTimeToMinutes(b.item.time);
    const aParsed = ma !== null;
    const bParsed = mb !== null;
    if (aParsed && bParsed && ma !== mb) return ma - mb;
    if (aParsed && !bParsed) return -1;
    if (!aParsed && bParsed) return 1;
    return a.index - b.index;
  });
  return indexed.map((x) => x.item);
}

/**
 * True when a row with a later parseable clock time appears above a row with an earlier time.
 * Blank or unparseable times are skipped (never treated as anchors for conflict).
 */
export function receptionTimelineHasClockOrderConflict(items: TimelineItem[]): boolean {
  const minutesList = items.map((item) => parseFlexibleTimeToMinutes(item.time));
  for (let i = 0; i < items.length; i++) {
    const mi = minutesList[i];
    if (mi === null) continue;
    for (let j = i + 1; j < items.length; j++) {
      const mj = minutesList[j];
      if (mj === null) continue;
      if (mi > mj) return true;
    }
  }
  return false;
}

/**
 * Merges legacy `formalities` into `timelineItems` once: drops timeline rows whose titles match
 * migrated formality moment names, appends converted rows, sorts by time.
 */
export function migrateFormalitiesIntoTimelineItems(
  timelineItems: TimelineItem[],
  formalities: Formality[],
): TimelineItem[] {
  if (!formalities?.length) return timelineItems;

  const momentKeys = new Set(
    formalities.map((f) => f.momentName.trim().toLowerCase()).filter(Boolean),
  );

  const scrubbed = timelineItems.filter(
    (item) => !momentKeys.has(item.title.trim().toLowerCase()),
  );

  const converted = formalities.map(formalityRecordToTimelineItem);

  return sortTimelineItemsChronologically([...scrubbed, ...converted]);
}

/** Normalizes persisted events after consolidating formalities into the reception timeline. */
export function normalizeEventRecordAfterFormalitiesMerge(evt: EventRecord): EventRecord {
  const nextTimeline = migrateFormalitiesIntoTimelineItems(
    evt.timelineItems ?? [],
    evt.formalities ?? [],
  );
  return {
    ...evt,
    timelineItems: nextTimeline,
    formalities: [],
    vendors: normalizeVendorsArray(evt.vendors),
    settings: {
      ...evt.settings,
      sectionFormalitiesEnabled: false,
    },
  };
}

export function insertCeremonyTimelineItemChronologically(
  items: CeremonyTimelineItem[],
  newItem: CeremonyTimelineItem,
): CeremonyTimelineItem[] {
  const newM = parseFlexibleTimeToMinutes(newItem.timeOrOrder);
  if (newM === null) return [...items, newItem];

  let insertAt = items.length;
  for (let i = 0; i < items.length; i++) {
    const m = parseFlexibleTimeToMinutes(items[i].timeOrOrder);
    if (m !== null && m > newM) {
      insertAt = i;
      break;
    }
    if (m !== null && m <= newM) {
      insertAt = i + 1;
    }
  }
  const next = [...items];
  next.splice(insertAt, 0, newItem);
  return next;
}

export function buildPlanningInsights(
  mergedTimelineItems: DisplayTimelineItem[],
  mustPlaySongs: SongEntry[],
  doNotPlaySongs: SongEntry[],
  weddingPartyProcessional: CeremonySongPlan,
  brideGroomProcessional: CeremonySongPlan,
  microphoneNeeds: string,
  guestRequests: GuestRequestEntry[],
): PlanningInsight[] {
  const insights: PlanningInsight[] = [];

  const chronological = mergedTimelineItems
    .map((item) => ({
      item,
      minutes: parseTimeToMinutesValue(item.time),
    }))
    .filter((row) => Number.isFinite(row.minutes))
    .sort((a, b) => a.minutes - b.minutes);

  for (let i = 1; i < chronological.length; i++) {
    if (chronological[i].minutes === chronological[i - 1].minutes) {
      insights.push({
        id: `tl-overlap-${i}-${chronological[i].item.id}`,
        section: "timeline",
        variant: "warning",
        message: `${chronological[i - 1].item.title} and ${chronological[i].item.title} share the same start time — consider a quick stagger so transitions stay smooth.`,
      });
    }
  }

  const dinnerRow = chronological.find((row) =>
    row.item.title.toLowerCase().includes("dinner"),
  );
  if (dinnerRow) {
    const dinnerIndex = chronological.indexOf(dinnerRow);
    if (dinnerIndex !== -1 && dinnerIndex < chronological.length - 1) {
      const nextMinutes = chronological[dinnerIndex + 1].minutes - dinnerRow.minutes;
      if (nextMinutes >= 0 && nextMinutes < 45) {
        insights.push({
          id: "tl-dinner-short",
          section: "timeline",
          variant: "warning",
          message:
            "The dinner service window looks tight compared to what follows — consider adding minutes for plating and guest movement.",
        });
      }
    }
  }

  const speechRow = chronological.find((row) =>
    /speech|toast/i.test(row.item.title),
  );
  if (speechRow) {
    const speechIndex = chronological.indexOf(speechRow);
    if (speechIndex > 0) {
      const gap =
        speechRow.minutes - chronological[speechIndex - 1].minutes;
      if (gap >= 0 && gap < 15) {
        insights.push({
          id: "tl-speech-buffer",
          section: "timeline",
          variant: "warning",
          message:
            "Speeches start soon after the prior moment — add a short buffer for mic checks and guest seating.",
        });
      }
    }
  }

  const openDancingRow = chronological.find((row) =>
    /open danc/i.test(row.item.title),
  );
  if (openDancingRow && openDancingRow.minutes > 21 * 60 + 15) {
    insights.push({
      id: "tl-open-late",
      section: "timeline",
      variant: "warning",
      message:
        "Open dancing starts relatively late — guests may lose momentum earlier in the evening.",
    });
  }

  const formalMomentChrono = chronological.filter(
    (row) =>
      row.item.category === "Formalities" ||
      /first dance|father|mother|bouquet|garter|grand entrance|anniversary|toast|last dance|kickoff/i.test(
        row.item.title,
      ),
  );
  for (let i = 1; i < formalMomentChrono.length; i++) {
    const gap = formalMomentChrono[i].minutes - formalMomentChrono[i - 1].minutes;
    if (gap >= 0 && gap < 12) {
      insights.push({
        id: `tl-formal-gap-${formalMomentChrono[i].item.id}`,
        section: "timeline",
        variant: "warning",
        message: `${formalMomentChrono[i - 1].item.title} and ${formalMomentChrono[i].item.title} are very close together — allow breathing room for cues and applause.`,
      });
    }
  }

  if (mustPlaySongs.length === 0) {
    insights.push({
      id: "music-no-must",
      section: "music",
      variant: "warning",
      message:
        "No must-play songs yet — add a short list so the DJ knows your non-negotiable tracks.",
    });
  }

  if (doNotPlaySongs.length > 8) {
    insights.push({
      id: "music-many-dnp",
      section: "music",
      variant: "warning",
      message:
        "Your do-not-play list is long — too many restrictions can limit energy and requests.",
    });
  }

  const lastDance = mergedTimelineItems.find((item) => /last\s*dance/i.test(item.title));
  if (lastDance && !(lastDance.songTitle?.trim())) {
    insights.push({
      id: "music-last-dance",
      section: "music",
      variant: "suggestion",
      message:
        "Pick a last dance song in your reception timeline so the closing moment feels intentional.",
    });
  }

  const kickoff = mergedTimelineItems.find((item) =>
    /open\s*dancing\s*kickoff/i.test(item.title),
  );
  if (kickoff && !(kickoff.songTitle?.trim())) {
    insights.push({
      id: "music-kickoff",
      section: "music",
      variant: "suggestion",
      message:
        "Set an open dancing kickoff track — it sets the tone when the floor opens.",
    });
  }

  if (
    !weddingPartyProcessional.title.trim() ||
    !brideGroomProcessional.title.trim()
  ) {
    insights.push({
      id: "ceremony-processional",
      section: "ceremony",
      variant: "warning",
      message:
        "Complete both processional song selections so aisle cues are crystal clear.",
    });
  }

  if (!microphoneNeeds.trim()) {
    insights.push({
      id: "ceremony-mic",
      section: "ceremony",
      variant: "warning",
      message:
        "Add microphone needs — officiant and readers sound better with a clear lav or handheld plan.",
    });
  }

  const pendingCount = guestRequests.filter((r) => r.status === "Pending").length;
  if (pendingCount > 5) {
    insights.push({
      id: "guest-pending",
      section: "guest",
      variant: "warning",
      message: `${pendingCount} guest requests are still pending — review soon so expectations stay clear.`,
    });
  }

  return insights;
}

export const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Tailwind classes — keep literals static so the JIT compiler retains them. */
export function eventCoverFallbackClasses(layoutProfile: string): string {
  switch (layoutProfile) {
    case "Wedding":
    case "Gender-Neutral Wedding":
      return "bg-gradient-to-br from-[#4a3424] via-[#1e1c26] to-[#09090d]";
    case "Corporate":
      return "bg-gradient-to-br from-[#1a2738] via-[#12161f] to-[#09090d]";
    case "Holiday Party":
      return "bg-gradient-to-br from-[#3b1f28] via-[#1a151c] to-[#09090d]";
    case "Graduation Celebration":
      return "bg-gradient-to-br from-[#1f3d36] via-[#141a18] to-[#09090d]";
    case "Birthday Party":
      return "bg-gradient-to-br from-[#4a2f52] via-[#1c151f] to-[#09090d]";
    case "Bar/Club Event":
      return "bg-gradient-to-br from-[#2b1f4a] via-[#15131f] to-[#09090d]";
    case "School Dance":
      return "bg-gradient-to-br from-[#1f3550] via-[#141820] to-[#09090d]";
    case "Private Party":
      return "bg-gradient-to-br from-[#342f48] via-[#17161e] to-[#09090d]";
    default:
      return "bg-gradient-to-br from-[#2f2838] via-[#16151c] to-[#09090d]";
  }
}

/**
 * Mirrors Dashboard checklist completion for any persisted event (used on All Events cards).
 */
export function approximatePlanningProgressPercent(evt: EventRecord): number {
  const s = evt.settings;
  const timelineItems = migrateFormalitiesIntoTimelineItems(
    evt.timelineItems ?? [],
    evt.formalities ?? [],
  );

  const hasEventDetailsComplete = Boolean(
    (s?.eventName ?? "").trim() &&
      (s?.coupleNames ?? "").trim() &&
      (s?.venue ?? "").trim() &&
      (s?.weddingDate ?? "").trim(),
  );

  const wp = evt.weddingPartyProcessional?.title?.trim();
  const bp = evt.brideGroomProcessional?.title?.trim();
  const rs = evt.recessionalSong?.title?.trim();
  const hasKeyCeremonySongs = Boolean(wp && bp && rs);

  const hasKeyFormalDanceSongs = Boolean(
    timelineItems.some((t) => /first dance/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0) &&
      timelineItems.some(
        (t) => /father\/daughter/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0,
      ) &&
      timelineItems.some(
        (t) => /mother\/son/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0,
      ),
  );

  const combinedTimelineTitles = timelineItems.map((item) => item.title.toLowerCase());
  const hasKeyTimelineMoments = ["cocktail", "dinner", "toast", "open danc", "last"].every((needle) =>
    combinedTimelineTitles.some((title) => title.includes(needle)),
  );

  const guestRequests = evt.guestRequests ?? [];
  const noPendingGuestRequests = guestRequests.every((request) => request.status !== "Pending");

  const hasFinalDjNotes = Boolean((evt.generalDjNotes ?? "").trim().length >= 16);

  const hasMomentPlaylistLines = PLAYLIST_BUCKET_IDS.some(
    (id) => (evt.playlistVibeOverrides?.[id]?.length ?? 0) > 0,
  );
  const tasteNorm = normalizeMusicTasteProfile(evt.musicTasteProfile);
  const hasMusicDirection =
    (evt.mustPlaySongs?.length ?? 0) > 0 ||
    (evt.playIfPossibleSongs?.length ?? 0) > 0 ||
    (evt.musicPlaylistLinks?.length ?? 0) > 0 ||
    (evt.musicGenreEraSelections?.length ?? 0) > 0 ||
    musicTasteProfileHasSelections(tasteNorm) ||
    hasMomentPlaylistLines;

  const tasks: { id: string; autoStatus: ChecklistStatus }[] = [
    {
      id: "complete-event-details",
      autoStatus: hasEventDetailsComplete ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "choose-ceremony-songs",
      autoStatus: hasKeyCeremonySongs ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "add-formal-dance-songs",
      autoStatus: hasKeyFormalDanceSongs ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "build-must-play-list",
      autoStatus: hasMusicDirection ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "add-do-not-play-songs",
      autoStatus: (evt.doNotPlaySongs?.length ?? 0) > 0 ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "review-timeline",
      autoStatus: hasKeyTimelineMoments ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "approve-guest-requests",
      autoStatus:
        guestRequests.length > 0 && noPendingGuestRequests ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "add-final-dj-notes",
      autoStatus: hasFinalDjNotes ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
  ];

  const manual = s?.checklistManualStatuses ?? {};
  let complete = 0;
  for (const t of tasks) {
    const status = manual[t.id] ?? t.autoStatus;
    if (status === "Complete") complete++;
  }
  return tasks.length === 0 ? 0 : Math.round((complete / tasks.length) * 100);
}

export function readImageFileAsDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error(`Choose an image under ${Math.round(maxBytes / (1024 * 1024))} MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}
