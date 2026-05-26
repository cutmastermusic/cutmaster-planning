import { musicTasteProfileHasSelections, normalizeMusicTasteProfile } from "@/data/musicTasteProfileCatalog";
import { isGrandEntranceTimelineItem, readGrandEntranceDetail } from "@/lib/grandEntranceDetail";
import { weddingPartyLineupHasEntries } from "@/lib/weddingPartyLineup";
import type {
  CeremonyPlan,
  CeremonyTimelineItem,
  ChecklistDueDate,
  ChecklistStatus,
  EventRecord,
  EventSettings,
  GuestRequestEntry,
  MusicTasteProfile,
  Screen,
  SharedPlaylistLink,
  SongEntry,
  TeamMember,
  TimelineItem,
} from "@/types/planning";
import { PLAYLIST_BUCKET_IDS } from "@/types/planning";

export type ChecklistTemplateItem = {
  id: string;
  /** Display label for admin template tooling. */
  label: string;
  title: string;
  description: string;
  linkedSection: Screen;
  /** Days relative to event date (negative = before event). Example: -14 = 14 days before. */
  dueOffsetDays?: number;
  autoCompleteRule?: string;
  optional?: boolean;
};

export type PlanningChecklistTaskDef = Pick<
  ChecklistTemplateItem,
  "id" | "title" | "description" | "linkedSection"
>;

/** Preset relative offsets shown in event-level due-date dropdowns. */
export const CHECKLIST_DUE_OFFSET_PRESETS = [90, 60, 30, 14, 7, 3] as const;

/** DJ/Admin-owned checklist template — clients complete tasks, not structure. */
export const DEFAULT_PLANNING_CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  {
    id: "complete-event-details",
    label: "Complete Event Details",
    title: "Complete Event Details",
    description: "Finalize names, date, venue, and key event basics.",
    linkedSection: "Event Settings",
    dueOffsetDays: -90,
    autoCompleteRule: "complete-event-details",
  },
  {
    id: "add-planner-contact",
    label: "Add Planner Contact",
    title: "Add Planner Contact",
    description: "Add your planner in Event Team or Event Settings.",
    linkedSection: "Event Team",
    dueOffsetDays: -75,
    autoCompleteRule: "add-planner-contact",
  },
  {
    id: "choose-ceremony-songs",
    label: "Add Ceremony Music",
    title: "Add Ceremony Music",
    description: "Set ceremony songs on the ceremony timeline or classic ceremony plan.",
    linkedSection: "Ceremony",
    dueOffsetDays: -45,
    autoCompleteRule: "choose-ceremony-songs",
  },
  {
    id: "add-formal-dance-songs",
    label: "Add Key Formal Dances (Timeline)",
    title: "Add Key Formal Dances (Timeline)",
    description: "Set songs for formal dances and other music moments on your reception timeline.",
    linkedSection: "Timeline",
    dueOffsetDays: -30,
    autoCompleteRule: "add-formal-dance-songs",
  },
  {
    id: "add-must-play-songs",
    label: "Add Must Play Songs",
    title: "Add Must Play Songs",
    description: "Add at least one must-play song for your DJ.",
    linkedSection: "Music Hub",
    dueOffsetDays: -30,
    autoCompleteRule: "add-must-play-songs",
  },
  {
    id: "build-must-play-list",
    label: "Share your music taste",
    title: "Share your music taste",
    description: "Playlist links, genre picks, or a few favorite songs help your DJ read the room.",
    linkedSection: "Music Hub",
    dueOffsetDays: -30,
    autoCompleteRule: "build-must-play-list",
  },
  {
    id: "add-do-not-play-songs",
    label: "Add Do Not Play Songs",
    title: "Add Do Not Play Songs",
    description: "Capture songs and genres to avoid.",
    linkedSection: "Music Hub",
    dueOffsetDays: -21,
    autoCompleteRule: "add-do-not-play-songs",
  },
  {
    id: "add-grand-entrance-details",
    label: "Add Grand Entrance",
    title: "Add Grand Entrance",
    description: "Add wedding party lineup (Planning Questions) and MC script for show day.",
    linkedSection: "Timeline",
    dueOffsetDays: -21,
    autoCompleteRule: "add-grand-entrance-details",
  },
  {
    id: "review-timeline",
    label: "Review Timeline",
    title: "Review Timeline",
    description: "Confirm key reception flow and transitions.",
    linkedSection: "Timeline",
    dueOffsetDays: -14,
    autoCompleteRule: "review-timeline",
  },
  {
    id: "approve-guest-requests",
    label: "Approve Guest Requests",
    title: "Approve Guest Requests",
    description: "Review and resolve all pending guest requests.",
    linkedSection: "Guest Requests",
    dueOffsetDays: -7,
    autoCompleteRule: "approve-guest-requests",
    optional: true,
  },
  {
    id: "add-final-dj-notes",
    label: "Add Final DJ Notes",
    title: "Add Final DJ Notes",
    description: "Document final cues and handoff notes for event day.",
    linkedSection: "Event Prep",
    dueOffsetDays: -3,
    autoCompleteRule: "add-final-dj-notes",
  },
];

/** @deprecated Use {@link DEFAULT_PLANNING_CHECKLIST_TEMPLATE}. */
export const PLANNING_CHECKLIST_TASKS: PlanningChecklistTaskDef[] = DEFAULT_PLANNING_CHECKLIST_TEMPLATE;

export type PlanningChecklistDueConfig = {
  eventDueOverrides?: Record<string, ChecklistDueDate | undefined>;
  globalDefaultDueDates?: Record<string, ChecklistDueDate | undefined>;
};

export type ChecklistDueDateSource = "event" | "global" | "template";

export function templateDefaultDueDate(item: ChecklistTemplateItem): ChecklistDueDate | undefined {
  if (item.dueOffsetDays === undefined) return undefined;
  return { type: "relative", offsetDays: item.dueOffsetDays };
}

export function normalizeChecklistDueDate(value: unknown): ChecklistDueDate | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && !Number.isNaN(value)) {
    return { type: "relative", offsetDays: value };
  }
  if (typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (record.type === "relative" && typeof record.offsetDays === "number") {
    return { type: "relative", offsetDays: record.offsetDays };
  }
  if (record.type === "custom" && typeof record.date === "string" && record.date.trim()) {
    return { type: "custom", date: record.date.trim().slice(0, 10) };
  }
  return undefined;
}

export function migrateChecklistDueOffsetsRecord(
  offsets?: Record<string, number | undefined>,
): Record<string, ChecklistDueDate> {
  if (!offsets) return {};
  return Object.fromEntries(
    Object.entries(offsets).flatMap(([id, days]) =>
      days === undefined || Number.isNaN(days) ? [] : [[id, { type: "relative" as const, offsetDays: days }]],
    ),
  );
}

export function normalizeChecklistDueDatesRecord(
  dueDates?: Record<string, unknown>,
  legacyOffsets?: Record<string, number | undefined>,
): Record<string, ChecklistDueDate> {
  const merged = migrateChecklistDueOffsetsRecord(legacyOffsets);
  if (!dueDates) return merged;
  for (const [id, raw] of Object.entries(dueDates)) {
    const normalized = normalizeChecklistDueDate(raw);
    if (normalized) merged[id] = normalized;
  }
  return merged;
}

export function formatChecklistDueOffsetDescription(offsetDays: number): string {
  if (offsetDays === 0) return "Due on event date";
  const days = Math.abs(offsetDays);
  return `Due ${days} day${days === 1 ? "" : "s"} before event`;
}

export function formatChecklistCustomDueDateLabel(isoDate: string): string {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return "Due date not set";
  const formatted = new Date(`${isoDate.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Due ${formatted}`;
}

export function deriveChecklistDueDateIso(
  eventDate: string,
  due: ChecklistDueDate | undefined,
): string | null {
  if (!due) return null;
  if (due.type === "custom") {
    const iso = due.date.trim().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  }
  const parsed = Date.parse(eventDate);
  if (Number.isNaN(parsed)) return null;
  const dueDay = new Date(parsed);
  dueDay.setDate(dueDay.getDate() + due.offsetDays);
  return dueDay.toISOString().slice(0, 10);
}

export function formatChecklistDueDateLabel(
  eventDate: string,
  due: ChecklistDueDate | undefined,
): string {
  if (!due) return "No due date set";
  if (due.type === "custom") return formatChecklistCustomDueDateLabel(due.date);
  return formatChecklistDueOffsetDescription(due.offsetDays);
}

export function resolveChecklistDueDate(
  taskId: string,
  templateItem: ChecklistTemplateItem | undefined,
  dueConfig: PlanningChecklistDueConfig,
): ChecklistDueDate | undefined {
  const eventOverride = dueConfig.eventDueOverrides?.[taskId];
  if (eventOverride) return eventOverride;
  const globalDefault = dueConfig.globalDefaultDueDates?.[taskId];
  if (globalDefault) return globalDefault;
  return templateItem ? templateDefaultDueDate(templateItem) : undefined;
}

export function resolveChecklistDueDateSource(
  taskId: string,
  dueConfig: PlanningChecklistDueConfig,
): ChecklistDueDateSource {
  if (dueConfig.eventDueOverrides?.[taskId]) return "event";
  if (dueConfig.globalDefaultDueDates?.[taskId]) return "global";
  return "template";
}

export function hasEventChecklistDueOverride(
  taskId: string,
  dueConfig: PlanningChecklistDueConfig,
): boolean {
  return Boolean(dueConfig.eventDueOverrides?.[taskId]);
}

export function getDefaultChecklistDueDateSets(): Record<string, ChecklistDueDate> {
  return Object.fromEntries(
    DEFAULT_PLANNING_CHECKLIST_TEMPLATE.flatMap((item) => {
      const due = templateDefaultDueDate(item);
      return due ? [[item.id, due]] : [];
    }),
  );
}

export function getDefaultChecklistDueDateSetsForProfiles(): Partial<
  Record<EventSettings["eventLayoutProfile"], Record<string, ChecklistDueDate>>
> {
  const base = getDefaultChecklistDueDateSets();
  const profiles: EventSettings["eventLayoutProfile"][] = [
    "Wedding",
    "Gender-Neutral Wedding",
    "Corporate",
    "Holiday Party",
    "Graduation Celebration",
    "Birthday Party",
    "Private Party",
    "Bar/Club Event",
    "School Dance",
  ];
  return Object.fromEntries(profiles.map((profile) => [profile, { ...base }]));
}

/** @deprecated Use {@link getDefaultChecklistDueDateSets}. */
export function getDefaultChecklistDueOffsetSets(): Record<string, number> {
  return Object.fromEntries(
    DEFAULT_PLANNING_CHECKLIST_TEMPLATE.flatMap((item) =>
      item.dueOffsetDays === undefined ? [] : [[item.id, item.dueOffsetDays]],
    ),
  );
}

/** @deprecated Use {@link getDefaultChecklistDueDateSetsForProfiles}. */
export function getDefaultChecklistDueOffsetSetsForProfiles(): Partial<
  Record<EventSettings["eventLayoutProfile"], Record<string, number>>
> {
  const base = getDefaultChecklistDueOffsetSets();
  const profiles: EventSettings["eventLayoutProfile"][] = [
    "Wedding",
    "Gender-Neutral Wedding",
    "Corporate",
    "Holiday Party",
    "Graduation Celebration",
    "Birthday Party",
    "Private Party",
    "Bar/Club Event",
    "School Dance",
  ];
  return Object.fromEntries(profiles.map((profile) => [profile, { ...base }]));
}

export type PlanningChecklistInput = {
  eventName: string;
  coupleNames: string;
  venue: string;
  weddingDate: string;
  plannerName: string;
  plannerEmail: string;
  teamMembers: TeamMember[];
  planningQuestionAnswers: Record<string, string | undefined>;
  mustPlaySongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  playIfPossibleSongs: SongEntry[];
  musicPlaylistLinks: SharedPlaylistLink[];
  musicGenreEraSelections: string[];
  musicTasteProfile: MusicTasteProfile;
  playlistVibeOverrides: Partial<Record<string, string[]>>;
  weddingPartyProcessional: CeremonyPlan;
  brideGroomProcessional: CeremonyPlan;
  recessionalSong: CeremonyPlan;
  ceremonyTimelineItems: CeremonyTimelineItem[];
  timelineItems: TimelineItem[];
  guestRequests: GuestRequestEntry[];
  generalDjNotes: string;
  sectionReceptionTimelineEnabled: boolean;
  receptionHubEligibleNav: boolean;
};

export type PlanningChecklistItem = PlanningChecklistTaskDef & {
  autoStatus: ChecklistStatus;
  status: ChecklistStatus;
  /** ISO date (yyyy-mm-dd) for sorting; empty when event date or offset is unavailable. */
  dueDate: string;
  /** Human-readable due label for clients and operators. */
  dueDateLabel: string;
  dueDateConfig?: ChecklistDueDate;
  dueDateSource: ChecklistDueDateSource;
  /** Small guidance lines derived from existing timeline/event data (incomplete items only). */
  missingNotes: string[];
};

export type DerivedChecklistProgress = "not-started" | "in-progress" | "complete";

export function toChecklistStatus(progress: DerivedChecklistProgress): ChecklistStatus {
  switch (progress) {
    case "complete":
      return "Complete";
    case "in-progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}

/** Map filled vs expected slots to a three-state progress value. */
export function deriveRatioProgress(filled: number, total: number): DerivedChecklistProgress {
  if (total <= 0 || filled <= 0) return "not-started";
  if (filled >= total) return "complete";
  return "in-progress";
}

/** Progress when expected slots only exist on the timeline — any present slot with gaps is in-progress. */
export function deriveTimelineSlotsProgress(filled: number, total: number): DerivedChecklistProgress {
  if (total <= 0) return "not-started";
  if (filled >= total) return "complete";
  return "in-progress";
}

const NON_SONG_RECEPTION_MOMENT_PATTERN =
  /^(grand entrance|toasts?|ceremony|group photo|cocktail hour|dinner)$/i;

const MUSIC_CUE_TITLE_PATTERN =
  /dance|toss|cutting|kickoff|special dance|parent dance|anniversary/i;

/** Reception timeline rows that typically carry a song cue (only items on the timeline count). */
export function timelineItemExpectsSongCue(
  item: Pick<TimelineItem, "title" | "category">,
): boolean {
  const title = item.title.trim();
  if (!title) return false;
  if (NON_SONG_RECEPTION_MOMENT_PATTERN.test(title)) return false;

  if (item.category === "Formalities") {
    if (/grand entrance|toast/i.test(title)) return false;
    return true;
  }

  if (item.category === "Dancing") {
    if (/^open dancing$/i.test(title)) return false;
    return true;
  }

  return MUSIC_CUE_TITLE_PATTERN.test(title);
}

function timelineItemHasSong(item: Pick<TimelineItem, "songTitle" | "artist">): boolean {
  return Boolean(item.songTitle?.trim() || item.artist?.trim());
}

function formatTimelineMissingSongNote(title: string): string {
  return `${title.trim()} song missing`;
}

/** Music-expecting reception timeline slots (timeline is source of truth). */
export function receptionTimelineMusicCueSlots(
  timelineItems: TimelineItem[],
): Pick<TimelineItem, "title" | "songTitle" | "artist" | "category">[] {
  return timelineItems.filter((item) => timelineItemExpectsSongCue(item));
}

/** @deprecated Prefer {@link receptionTimelineMusicCueSlots} — kept for existing imports. */
export function keyFormalDanceTimelineSlots(
  timelineItems: TimelineItem[],
): Pick<TimelineItem, "title" | "songTitle">[] {
  return receptionTimelineMusicCueSlots(timelineItems);
}

export function deriveFormalDanceMissingNotes(
  input: Pick<PlanningChecklistInput, "timelineItems">,
): string[] {
  return receptionTimelineMusicCueSlots(input.timelineItems)
    .filter((item) => !timelineItemHasSong(item))
    .map((item) => formatTimelineMissingSongNote(item.title));
}

export function deriveFormalDanceChecklistProgress(
  input: Pick<PlanningChecklistInput, "timelineItems">,
): DerivedChecklistProgress {
  const slots = receptionTimelineMusicCueSlots(input.timelineItems);
  const filled = slots.filter(timelineItemHasSong).length;
  return deriveTimelineSlotsProgress(filled, slots.length);
}

export function hasKeyFormalDanceSongs(input: Pick<PlanningChecklistInput, "timelineItems">): boolean {
  return deriveFormalDanceChecklistProgress(input) === "complete";
}

export function deriveEventDetailsChecklistProgress(input: Pick<
  PlanningChecklistInput,
  "eventName" | "coupleNames" | "venue" | "weddingDate"
>): DerivedChecklistProgress {
  const fields = [input.eventName, input.coupleNames, input.venue, input.weddingDate];
  const filled = fields.filter((value) => value.trim()).length;
  return deriveRatioProgress(filled, fields.length);
}

export function hasEventDetailsComplete(input: Pick<
  PlanningChecklistInput,
  "eventName" | "coupleNames" | "venue" | "weddingDate"
>): boolean {
  return deriveEventDetailsChecklistProgress(input) === "complete";
}

const CEREMONY_MUSIC_MOMENT_PATTERN =
  /processional|recessional|prelude|during ceremony|pre-ceremony|ceremony music/i;

function ceremonyTimelineItemHasSong(item: CeremonyTimelineItem): boolean {
  return Boolean(item.songTitle.trim() || item.artist.trim());
}

export function deriveCeremonyMusicChecklistProgress(input: Pick<
  PlanningChecklistInput,
  | "weddingPartyProcessional"
  | "brideGroomProcessional"
  | "recessionalSong"
  | "ceremonyTimelineItems"
>): DerivedChecklistProgress {
  const musicMoments = input.ceremonyTimelineItems.filter((item) =>
    CEREMONY_MUSIC_MOMENT_PATTERN.test(item.moment),
  );
  if (musicMoments.length > 0) {
    const filled = musicMoments.filter(ceremonyTimelineItemHasSong).length;
    return deriveTimelineSlotsProgress(filled, musicMoments.length);
  }

  const legacyFields = [
    input.weddingPartyProcessional.title,
    input.brideGroomProcessional.title,
    input.recessionalSong.title,
  ];
  const filled = legacyFields.filter((value) => value.trim()).length;
  return deriveTimelineSlotsProgress(filled, legacyFields.length);
}

export function deriveCeremonyMusicMissingNotes(input: Pick<
  PlanningChecklistInput,
  | "weddingPartyProcessional"
  | "brideGroomProcessional"
  | "recessionalSong"
  | "ceremonyTimelineItems"
>): string[] {
  const musicMoments = input.ceremonyTimelineItems.filter((item) =>
    CEREMONY_MUSIC_MOMENT_PATTERN.test(item.moment),
  );
  if (musicMoments.length > 0) {
    return musicMoments
      .filter((item) => !ceremonyTimelineItemHasSong(item))
      .map((item) => formatTimelineMissingSongNote(item.moment));
  }

  const legacySlots: { label: string; value: string }[] = [
    { label: "Wedding party processional", value: input.weddingPartyProcessional.title },
    { label: "Partner processional", value: input.brideGroomProcessional.title },
    { label: "Recessional", value: input.recessionalSong.title },
  ];
  return legacySlots
    .filter((slot) => !slot.value.trim())
    .map((slot) => formatTimelineMissingSongNote(slot.label));
}

export function hasFinalDjNotes(input: Pick<PlanningChecklistInput, "generalDjNotes">): boolean {
  return Boolean(input.generalDjNotes.trim().length >= 16);
}

export function hasMusicTasteSignal(input: Pick<
  PlanningChecklistInput,
  | "mustPlaySongs"
  | "playIfPossibleSongs"
  | "musicPlaylistLinks"
  | "musicGenreEraSelections"
  | "musicTasteProfile"
  | "playlistVibeOverrides"
>): boolean {
  return (
    input.mustPlaySongs.length > 0 ||
    input.playIfPossibleSongs.length > 0 ||
    input.musicPlaylistLinks.length > 0 ||
    input.musicGenreEraSelections.length > 0 ||
    musicTasteProfileHasSelections(input.musicTasteProfile) ||
    PLAYLIST_BUCKET_IDS.some((id) => (input.playlistVibeOverrides[id]?.length ?? 0) > 0)
  );
}

export function hasPlannerContact(input: Pick<
  PlanningChecklistInput,
  "plannerName" | "plannerEmail" | "teamMembers"
>): boolean {
  if (input.plannerName.trim() || input.plannerEmail.trim()) return true;
  return input.teamMembers.some(
    (member) =>
      member.isActive &&
      member.role === "Planner" &&
      (member.name.trim() || member.email.trim() || member.phone.trim()),
  );
}

export function hasCeremonyMusic(input: Pick<
  PlanningChecklistInput,
  | "weddingPartyProcessional"
  | "brideGroomProcessional"
  | "recessionalSong"
  | "ceremonyTimelineItems"
>): boolean {
  return deriveCeremonyMusicChecklistProgress(input) === "complete";
}

export function deriveGrandEntranceChecklistProgress(input: Pick<
  PlanningChecklistInput,
  "planningQuestionAnswers" | "coupleNames" | "timelineItems"
>): DerivedChecklistProgress {
  const geRow = input.timelineItems.find((item) => isGrandEntranceTimelineItem(item.title));
  const detail = readGrandEntranceDetail(input.planningQuestionAnswers, input.coupleNames);

  if (!geRow) {
    const started = Boolean(detail.script.trim() || weddingPartyLineupHasEntries(detail.lineup));
    return started ? "in-progress" : "not-started";
  }

  const filled = [
    detail.script.trim(),
    weddingPartyLineupHasEntries(detail.lineup) ? "lineup" : "",
    geRow.songTitle?.trim() || geRow.artist?.trim() || "",
  ].filter(Boolean).length;
  return deriveTimelineSlotsProgress(filled, 3);
}

export function deriveGrandEntranceMissingNotes(input: Pick<
  PlanningChecklistInput,
  "planningQuestionAnswers" | "coupleNames" | "timelineItems"
>): string[] {
  const geRow = input.timelineItems.find((item) => isGrandEntranceTimelineItem(item.title));
  const detail = readGrandEntranceDetail(input.planningQuestionAnswers, input.coupleNames);
  const notes: string[] = [];

  if (!geRow) notes.push("Add Grand Entrance to reception timeline");
  else if (!timelineItemHasSong(geRow)) notes.push(formatTimelineMissingSongNote("Grand Entrance"));
  if (!detail.script.trim()) notes.push("MC script missing");
  if (!weddingPartyLineupHasEntries(detail.lineup)) notes.push("Wedding party lineup missing");

  return notes;
}

export function deriveEventDetailsMissingNotes(input: Pick<
  PlanningChecklistInput,
  "eventName" | "coupleNames" | "venue" | "weddingDate"
>): string[] {
  const slots: { label: string; value: string }[] = [
    { label: "Event name", value: input.eventName },
    { label: "Couple names", value: input.coupleNames },
    { label: "Venue", value: input.venue },
    { label: "Wedding date", value: input.weddingDate },
  ];
  return slots.filter((slot) => !slot.value.trim()).map((slot) => `${slot.label} missing`);
}

const TIMELINE_REVIEW_ANCHORS = ["cocktail", "dinner", "toast", "open danc", "last"] as const;

function timelineAnchorLabel(needle: (typeof TIMELINE_REVIEW_ANCHORS)[number]): string {
  switch (needle) {
    case "cocktail":
      return "Cocktail hour";
    case "dinner":
      return "Dinner";
    case "toast":
      return "Toasts";
    case "open danc":
      return "Open dancing";
    default:
      return "Last dance";
  }
}

function findTimelineAnchorRow(
  timelineItems: TimelineItem[],
  needle: (typeof TIMELINE_REVIEW_ANCHORS)[number],
): TimelineItem | undefined {
  return timelineItems.find((item) => item.title.toLowerCase().includes(needle));
}

/** Whether a reception anchor row has enough detail for day-of use (not just a preset title). */
function timelineAnchorOperationalReady(
  item: TimelineItem,
  planningQuestionAnswers: Record<string, string | undefined>,
): boolean {
  const title = item.title.toLowerCase();

  if (/toast/.test(title)) {
    return Boolean(item.notes?.trim() || planningQuestionAnswers.pq_toasts?.trim());
  }

  if (isGrandEntranceTimelineItem(item.title)) {
    const detail = readGrandEntranceDetail(planningQuestionAnswers, "");
    return Boolean(
      detail.script.trim() || weddingPartyLineupHasEntries(detail.lineup) || timelineItemHasSong(item),
    );
  }

  if (timelineItemExpectsSongCue(item)) {
    return timelineItemHasSong(item);
  }

  return Boolean(item.time?.trim() || item.notes?.trim());
}

function timelineAnchorGapNote(
  item: TimelineItem,
  planningQuestionAnswers: Record<string, string | undefined>,
): string {
  if (/toast/i.test(item.title)) return "Toasts need speakers or notes";
  if (isGrandEntranceTimelineItem(item.title)) {
    return "Grand Entrance needs script, lineup, or song";
  }
  if (timelineItemExpectsSongCue(item)) return formatTimelineMissingSongNote(item.title);
  return `${item.title.trim()} needs a time or notes`;
}

export function deriveTimelineReviewChecklistProgress(
  input: Pick<PlanningChecklistInput, "timelineItems" | "planningQuestionAnswers">,
): DerivedChecklistProgress {
  const answers = input.planningQuestionAnswers ?? {};
  let present = 0;
  let ready = 0;

  for (const needle of TIMELINE_REVIEW_ANCHORS) {
    const row = findTimelineAnchorRow(input.timelineItems, needle);
    if (!row) continue;
    present += 1;
    if (timelineAnchorOperationalReady(row, answers)) ready += 1;
  }

  if (present === 0) return "not-started";

  const expected = TIMELINE_REVIEW_ANCHORS.length;
  if (present < expected) {
    return deriveRatioProgress(ready, expected);
  }

  if (ready === expected) return "complete";
  return "in-progress";
}

export function deriveTimelineReviewMissingNotes(
  input: Pick<PlanningChecklistInput, "timelineItems" | "planningQuestionAnswers">,
): string[] {
  const answers = input.planningQuestionAnswers ?? {};
  const rows = TIMELINE_REVIEW_ANCHORS.map((needle) => ({
    needle,
    row: findTimelineAnchorRow(input.timelineItems, needle),
  }));

  if (rows.every((entry) => !entry.row)) {
    return ["Add key reception moments to the timeline"];
  }

  const notes: string[] = [];
  for (const { needle, row } of rows) {
    if (!row) {
      notes.push(`${timelineAnchorLabel(needle)} not on timeline`);
      continue;
    }
    if (!timelineAnchorOperationalReady(row, answers)) {
      notes.push(timelineAnchorGapNote(row, answers));
    }
  }
  return notes;
}

export function hasKeyTimelineMoments(
  input: Pick<PlanningChecklistInput, "timelineItems" | "planningQuestionAnswers">,
): boolean {
  return deriveTimelineReviewChecklistProgress(input) === "complete";
}

export function hasGrandEntranceDetails(input: Pick<
  PlanningChecklistInput,
  "planningQuestionAnswers" | "coupleNames" | "timelineItems"
>): boolean {
  return deriveGrandEntranceChecklistProgress(input) === "complete";
}

function deriveGuestRequestsChecklistProgress(
  guestRequests: GuestRequestEntry[],
): DerivedChecklistProgress {
  if (guestRequests.length === 0) return "not-started";
  if (guestRequests.every((request) => request.status !== "Pending")) return "complete";
  return "in-progress";
}

function deriveFinalDjNotesChecklistProgress(generalDjNotes: string): DerivedChecklistProgress {
  const trimmed = generalDjNotes.trim();
  if (!trimmed) return "not-started";
  if (trimmed.length >= 16) return "complete";
  return "in-progress";
}

function deriveFinalDjNotesMissingNotes(generalDjNotes: string): string[] {
  const trimmed = generalDjNotes.trim();
  if (!trimmed) return ["Final DJ notes missing"];
  if (trimmed.length >= 16) return [];
  return ["Add a few more final DJ notes for handoff"];
}

export function derivePlanningChecklistMissingNotes(
  taskId: string,
  input: PlanningChecklistInput,
): string[] {
  switch (taskId) {
    case "complete-event-details":
      return deriveEventDetailsMissingNotes(input);
    case "choose-ceremony-songs":
      return deriveCeremonyMusicMissingNotes(input);
    case "add-formal-dance-songs":
      return deriveFormalDanceMissingNotes(input);
    case "add-grand-entrance-details":
      return deriveGrandEntranceMissingNotes(input);
    case "review-timeline":
      return deriveTimelineReviewMissingNotes(input);
    case "add-final-dj-notes":
      return deriveFinalDjNotesMissingNotes(input.generalDjNotes);
    default:
      return [];
  }
}

function completeIf(condition: boolean): ChecklistStatus {
  return condition ? "Complete" : "Not Started";
}

export function derivePlanningChecklistAutoStatuses(
  input: PlanningChecklistInput,
): Record<string, ChecklistStatus> {
  const hasMusicTasteForChecklist = hasMusicTasteSignal(input);

  return {
    "complete-event-details": toChecklistStatus(deriveEventDetailsChecklistProgress(input)),
    "add-planner-contact": completeIf(hasPlannerContact(input)),
    "choose-ceremony-songs": toChecklistStatus(deriveCeremonyMusicChecklistProgress(input)),
    "add-formal-dance-songs": toChecklistStatus(deriveFormalDanceChecklistProgress(input)),
    "add-must-play-songs": completeIf(input.mustPlaySongs.length > 0),
    "build-must-play-list": completeIf(hasMusicTasteForChecklist),
    "add-do-not-play-songs": completeIf(input.doNotPlaySongs.length > 0),
    "add-grand-entrance-details": toChecklistStatus(deriveGrandEntranceChecklistProgress(input)),
    "review-timeline": toChecklistStatus(deriveTimelineReviewChecklistProgress(input)),
    "approve-guest-requests": toChecklistStatus(deriveGuestRequestsChecklistProgress(input.guestRequests)),
    "add-final-dj-notes": toChecklistStatus(deriveFinalDjNotesChecklistProgress(input.generalDjNotes)),
  };
}

function receptionTimelineLinkedSection(input: PlanningChecklistInput): Screen {
  return input.receptionHubEligibleNav && input.sectionReceptionTimelineEnabled
    ? "Reception Timeline"
    : "Timeline";
}

/** Resolve linked section for tasks that depend on nav layout. */
export function planningChecklistLinkedSection(
  taskId: string,
  input: PlanningChecklistInput,
): Screen {
  if (
    taskId === "add-formal-dance-songs" ||
    taskId === "add-grand-entrance-details"
  ) {
    return receptionTimelineLinkedSection(input);
  }
  if (taskId === "review-timeline") {
    return receptionTimelineLinkedSection(input);
  }
  if (taskId === "choose-ceremony-songs") {
    return "Ceremony";
  }
  return PLANNING_CHECKLIST_TASKS.find((task) => task.id === taskId)?.linkedSection ?? "Dashboard";
}

export type ChecklistTaskFocus =
  | { kind: "none" }
  | { kind: "scroll"; elementId: string; focusElementId?: string }
  | {
      kind: "receptionTimelineItem";
      itemId: string;
      expand?: boolean;
      openGrandEntrance?: boolean;
    }
  | { kind: "ceremonyTimelineItem"; itemId: string; expand?: boolean }
  | { kind: "musicQuickAdd"; songListType: "mustPlay" | "playIfPossible" | "doNotPlay" }
  | { kind: "guestRequestQueue" }
  | { kind: "eventTeamInvite" };

export type ChecklistTaskNavigation = {
  screen: Screen;
  focus: ChecklistTaskFocus;
};

export type ChecklistTaskNavigationOptions = {
  /** When true, ceremony tasks open the unified Timeline workspace instead of Ceremony. */
  unifiedEventTimeline?: boolean;
};

function firstCeremonyMusicMomentMissingSong(
  input: Pick<
    PlanningChecklistInput,
    "ceremonyTimelineItems" | "weddingPartyProcessional" | "brideGroomProcessional" | "recessionalSong"
  >,
): CeremonyTimelineItem | undefined {
  const musicMoments = input.ceremonyTimelineItems.filter((item) =>
    CEREMONY_MUSIC_MOMENT_PATTERN.test(item.moment),
  );
  if (musicMoments.length > 0) {
    return musicMoments.find((item) => !ceremonyTimelineItemHasSong(item));
  }
  return undefined;
}

function firstReceptionTimelineItemMissingSong(
  timelineItems: TimelineItem[],
): TimelineItem | undefined {
  return timelineItems.find(
    (item) => timelineItemExpectsSongCue(item) && !timelineItemHasSong(item),
  );
}

function eventDetailsFocusElementId(input: Pick<
  PlanningChecklistInput,
  "eventName" | "coupleNames" | "venue" | "weddingDate"
>): string {
  const missing = deriveEventDetailsMissingNotes(input);
  const first = missing[0]?.toLowerCase() ?? "";
  if (first.includes("couple")) return "event-settings-couple-names";
  if (first.includes("venue")) return "event-settings-venue";
  if (first.includes("date")) return "event-settings-date";
  return "event-settings-event-name";
}

/** Deep-link target for a checklist task — screen plus optional in-section focus. */
export function resolveChecklistTaskNavigation(
  taskId: string,
  input: PlanningChecklistInput,
  options?: ChecklistTaskNavigationOptions,
): ChecklistTaskNavigation {
  const unifiedEventTimeline = options?.unifiedEventTimeline ?? false;

  switch (taskId) {
    case "complete-event-details":
      return {
        screen: "Event Settings",
        focus: {
          kind: "scroll",
          elementId: eventDetailsFocusElementId(input),
          focusElementId: eventDetailsFocusElementId(input),
        },
      };
    case "add-planner-contact":
      return {
        screen: "Event Team",
        focus: hasPlannerContact(input) ? { kind: "none" } : { kind: "eventTeamInvite" },
      };
    case "choose-ceremony-songs": {
      const screen = unifiedEventTimeline ? receptionTimelineLinkedSection(input) : "Ceremony";
      const missingCeremonyItem = firstCeremonyMusicMomentMissingSong(input);
      if (missingCeremonyItem) {
        return {
          screen,
          focus: {
            kind: "ceremonyTimelineItem",
            itemId: missingCeremonyItem.id,
            expand: true,
          },
        };
      }
      return {
        screen,
        focus: {
          kind: "scroll",
          elementId: unifiedEventTimeline ? "timeline-section-ceremony" : "timeline-section-ceremony",
        },
      };
    }
    case "add-formal-dance-songs": {
      const screen = receptionTimelineLinkedSection(input);
      const missingItem = firstReceptionTimelineItemMissingSong(input.timelineItems);
      if (missingItem) {
        return {
          screen,
          focus: {
            kind: "receptionTimelineItem",
            itemId: missingItem.id,
            expand: true,
          },
        };
      }
      return {
        screen,
        focus: { kind: "scroll", elementId: "timeline-section-reception" },
      };
    }
    case "add-must-play-songs":
      return {
        screen: "Music Hub",
        focus: { kind: "musicQuickAdd", songListType: "mustPlay" },
      };
    case "build-must-play-list":
      return {
        screen: "Music Hub",
        focus: {
          kind: "scroll",
          elementId: "music-hub-playlist-links",
          focusElementId: "music-new-playlist-url",
        },
      };
    case "add-do-not-play-songs":
      return {
        screen: "Music Hub",
        focus: { kind: "musicQuickAdd", songListType: "doNotPlay" },
      };
    case "add-grand-entrance-details": {
      const screen = receptionTimelineLinkedSection(input);
      const grandEntrance = input.timelineItems.find((item) =>
        isGrandEntranceTimelineItem(item.title),
      );
      if (grandEntrance) {
        return {
          screen,
          focus: {
            kind: "receptionTimelineItem",
            itemId: grandEntrance.id,
            openGrandEntrance: true,
          },
        };
      }
      return {
        screen,
        focus: { kind: "scroll", elementId: "timeline-section-reception" },
      };
    }
    case "review-timeline":
      return {
        screen: receptionTimelineLinkedSection(input),
        focus: { kind: "scroll", elementId: "timeline-section-reception" },
      };
    case "approve-guest-requests":
      return {
        screen: "Guest Requests",
        focus: { kind: "guestRequestQueue" },
      };
    case "add-final-dj-notes":
      return {
        screen: "Event Prep",
        focus: { kind: "none" },
      };
    default:
      return {
        screen: planningChecklistLinkedSection(taskId, input),
        focus: { kind: "none" },
      };
  }
}

export function resolvePlanningChecklistStatus(
  taskId: string,
  autoStatuses: Record<string, ChecklistStatus>,
  manualStatuses: Record<string, ChecklistStatus | undefined> | undefined,
): ChecklistStatus {
  const autoStatus = autoStatuses[taskId] ?? "Not Started";
  const manualStatus = manualStatuses?.[taskId];
  if (autoStatus === "Complete") return "Complete";
  if (manualStatus) return manualStatus;
  return autoStatus;
}

export function shouldShowPlanningChecklistMissingNotes(
  status: ChecklistStatus,
  missingNotes: string[],
): boolean {
  if (status === "Complete" || missingNotes.length === 0) return false;
  return true;
}

export function buildPlanningChecklist(
  input: PlanningChecklistInput,
  dueConfig: PlanningChecklistDueConfig,
  manualStatuses: Record<string, ChecklistStatus | undefined> | undefined,
): PlanningChecklistItem[] {
  const autoStatuses = derivePlanningChecklistAutoStatuses(input);
  return DEFAULT_PLANNING_CHECKLIST_TEMPLATE.map((task) => {
    const autoStatus = autoStatuses[task.id] ?? "Not Started";
    const status = resolvePlanningChecklistStatus(task.id, autoStatuses, manualStatuses);
    const missingNotes =
      status === "Complete" ? [] : derivePlanningChecklistMissingNotes(task.id, input);
    const dueDateConfig = resolveChecklistDueDate(task.id, task, dueConfig);
    const dueDateSource = resolveChecklistDueDateSource(task.id, dueConfig);
    const dueDate = deriveChecklistDueDateIso(input.weddingDate, dueDateConfig) ?? "";
    const dueDateLabel = formatChecklistDueDateLabel(input.weddingDate, dueDateConfig);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      linkedSection: planningChecklistLinkedSection(task.id, input),
      autoStatus,
      status,
      dueDate,
      dueDateLabel,
      dueDateConfig,
      dueDateSource,
      missingNotes,
    };
  });
}

export function planningChecklistCompletionPercent(items: PlanningChecklistItem[]): number {
  if (items.length === 0) return 0;
  const complete = items.filter((item) => item.status === "Complete").length;
  return Math.round((complete / items.length) * 100);
}

export function planningChecklistInputFromEventRecord(evt: EventRecord): PlanningChecklistInput {
  const s = evt.settings;
  const timelineItems = evt.timelineItems ?? [];
  const tasteNorm = normalizeMusicTasteProfile(evt.musicTasteProfile);
  return {
    eventName: s?.eventName ?? "",
    coupleNames: s?.coupleNames ?? "",
    venue: s?.venue ?? "",
    weddingDate: s?.weddingDate ?? "",
    plannerName: s?.plannerName ?? "",
    plannerEmail: s?.plannerEmail ?? "",
    teamMembers:
      (evt as EventRecord & { eventTeamMembers?: TeamMember[] }).eventTeamMembers ?? [],
    planningQuestionAnswers: s?.planningQuestionAnswers ?? {},
    mustPlaySongs: evt.mustPlaySongs ?? [],
    doNotPlaySongs: evt.doNotPlaySongs ?? [],
    playIfPossibleSongs: evt.playIfPossibleSongs ?? [],
    musicPlaylistLinks: evt.musicPlaylistLinks ?? [],
    musicGenreEraSelections: evt.musicGenreEraSelections ?? [],
    musicTasteProfile: tasteNorm,
    playlistVibeOverrides: evt.playlistVibeOverrides ?? {},
    weddingPartyProcessional: evt.weddingPartyProcessional ?? { title: "", artist: "", notes: "" },
    brideGroomProcessional: evt.brideGroomProcessional ?? { title: "", artist: "", notes: "" },
    recessionalSong: evt.recessionalSong ?? { title: "", artist: "", notes: "" },
    ceremonyTimelineItems: evt.ceremonyTimelineItems ?? [],
    timelineItems,
    guestRequests: evt.guestRequests ?? [],
    generalDjNotes: evt.generalDjNotes ?? "",
    sectionReceptionTimelineEnabled: s?.sectionReceptionTimelineEnabled ?? true,
    receptionHubEligibleNav: s?.sectionReceptionTimelineEnabled ?? true,
  };
}
