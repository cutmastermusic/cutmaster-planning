import type { PlanningQuestionDef, Screen, Vendor, VendorType } from "@/types/planning";

/** Minimal row shape for reception timeline gap checks (works with `DisplayTimelineItem`). */
export type CouplePlanningTimelineRow = {
  title: string;
  songTitle?: string;
};
import { PLAYLIST_BUCKET_IDS } from "@/types/planning";
import { musicTasteProfileHasSelections, normalizeMusicTasteProfile } from "@/data/musicTasteProfileCatalog";

/**
 * Lightweight “still needed” hints for couple dashboards.
 * Calm, operational gaps only — intended for gentle UI, not blocking validation.
 * Future planning/AI features can extend {@link CouplePlanningGapsInput} and this builder.
 */
export type CouplePlanningGapArea =
  | "ceremony"
  | "timeline"
  | "music"
  | "event-team"
  | "planning-questions";

export type CouplePlanningGap = {
  id: string;
  area: CouplePlanningGapArea;
  /** Short, helpful line (no alarmist tone). */
  message: string;
  targetScreen: Screen;
  /** Lower sorts first when trimming the list. */
  priority: number;
};

export type CouplePlanningGapsInput = {
  /** Reception / main timeline editor target for the couple. */
  timelineScreen: Screen;
  sectionCeremonyEnabled: boolean;
  sectionReceptionTimelineEnabled: boolean;
  sectionMustPlayEnabled: boolean;
  sectionPlaylistsEnabled: boolean;
  sectionVendorContactsEnabled: boolean;
  sectionPlanningQuestionsEnabled: boolean;
  ceremonyStartTime: string;
  hasKeyCeremonySongs: boolean;
  ceremonyTimelineItemCount: number;
  timelineRows: CouplePlanningTimelineRow[];
  musicPlaylistLinksCount: number;
  musicGenreEraSelectionsCount: number;
  mustPlaySongsCount: number;
  playIfPossibleSongsCount: number;
  playlistVibeOverrides: Partial<Record<(typeof PLAYLIST_BUCKET_IDS)[number], string[] | undefined>>;
  musicTasteProfileRaw: unknown;
  vendors: Vendor[];
  planningQuestions: PlanningQuestionDef[];
  planningQuestionAnswers: Record<string, string | undefined>;
};

function hasVendorType(vendors: Vendor[], type: VendorType): boolean {
  return vendors.some(
    (v) =>
      v.vendorType === type &&
      (v.companyName.trim().length > 0 || v.contactName.trim().length > 0),
  );
}

function hasMusicTasteSignal(input: CouplePlanningGapsInput): boolean {
  const taste = normalizeMusicTasteProfile(input.musicTasteProfileRaw);
  return (
    input.musicPlaylistLinksCount > 0 ||
    input.musicGenreEraSelectionsCount > 0 ||
    input.mustPlaySongsCount > 0 ||
    input.playIfPossibleSongsCount > 0 ||
    musicTasteProfileHasSelections(taste) ||
    PLAYLIST_BUCKET_IDS.some((id) => (input.playlistVibeOverrides[id]?.length ?? 0) > 0)
  );
}

function hasKeyTimelineMoments(rows: CouplePlanningTimelineRow[]): boolean {
  const titles = rows.map((item) => item.title.toLowerCase());
  return ["cocktail", "dinner", "toast", "open danc", "last"].every((needle) =>
    titles.some((title) => title.includes(needle)),
  );
}

function hasKeyFormalDanceSongs(rows: CouplePlanningTimelineRow[]): boolean {
  return (
    rows.some((t) => /first dance/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0) &&
    rows.some((t) => /father\/daughter/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0) &&
    rows.some((t) => /mother\/son/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0)
  );
}

function lastDanceMissingSong(rows: CouplePlanningTimelineRow[]): boolean {
  const row = rows.find((item) => /last\s*dance/i.test(item.title));
  return Boolean(row && !(row.songTitle?.trim().length));
}

function unansweredPlanningQuestions(
  questions: PlanningQuestionDef[],
  answers: Record<string, string | undefined>,
): number {
  return questions.filter((q) => !(answers[q.id] ?? "").trim()).length;
}

/**
 * Returns prioritized gentle gaps. Callers typically show the first N (e.g. 6).
 */
export function buildCouplePlanningGaps(input: CouplePlanningGapsInput): CouplePlanningGap[] {
  const gaps: CouplePlanningGap[] = [];

  if (input.sectionCeremonyEnabled) {
    if (!input.ceremonyStartTime.trim()) {
      gaps.push({
        id: "gap-ceremony-start",
        area: "ceremony",
        message: "Add your ceremony start time when the venue confirms it.",
        targetScreen: "Ceremony",
        priority: 10,
      });
    }
    if (input.ceremonyTimelineItemCount === 0) {
      gaps.push({
        id: "gap-ceremony-flow",
        area: "ceremony",
        message: "Add a few ceremony moments (processional through recessional) when you’re ready.",
        targetScreen: "Ceremony",
        priority: 12,
      });
    } else if (!input.hasKeyCeremonySongs) {
      gaps.push({
        id: "gap-ceremony-songs",
        area: "ceremony",
        message: "Finish ceremony music cues (processional, partner entrance, recessional).",
        targetScreen: "Ceremony",
        priority: 15,
      });
    }
  }

  if (input.sectionReceptionTimelineEnabled) {
    const items = input.timelineRows;
    if (items.length === 0) {
      gaps.push({
        id: "gap-timeline-empty",
        area: "timeline",
        message: "Sketch your reception timeline when timing starts to feel real.",
        targetScreen: input.timelineScreen,
        priority: 20,
      });
    } else {
      if (!hasKeyTimelineMoments(items)) {
        gaps.push({
          id: "gap-timeline-anchors",
          area: "timeline",
          message: "Add anchor moments (cocktail, dinner, toasts, dancing, and a closing beat).",
          targetScreen: input.timelineScreen,
          priority: 25,
        });
      }
      if (!hasKeyFormalDanceSongs(items)) {
        gaps.push({
          id: "gap-formal-dances",
          area: "timeline",
          message: "Add songs for your formal dances on the timeline (first dance and parent dances).",
          targetScreen: input.timelineScreen,
          priority: 30,
        });
      } else if (lastDanceMissingSong(items)) {
        gaps.push({
          id: "gap-last-dance",
          area: "timeline",
          message: "Pick a last dance song when you want the night to land with intention.",
          targetScreen: input.timelineScreen,
          priority: 35,
        });
      }
    }
  }

  if ((input.sectionMustPlayEnabled || input.sectionPlaylistsEnabled) && !hasMusicTasteSignal(input)) {
    gaps.push({
      id: "gap-music-taste",
      area: "music",
      message: "Share a playlist link, a few genres, or your taste profile so your DJ can prep.",
      targetScreen: "Music Hub",
      priority: 40,
    });
  }

  if (input.sectionVendorContactsEnabled) {
    if (input.vendors.length === 0) {
      gaps.push({
        id: "gap-team-empty",
        area: "event-team",
        message: "Add day-of contacts (planner, photographer, venue) to your Event Team.",
        targetScreen: "Event Team",
        priority: 50,
      });
    } else {
      if (!hasVendorType(input.vendors, "Photographer")) {
        gaps.push({
          id: "gap-team-photographer",
          area: "event-team",
          message: "Add your photographer to Event Team so photo timing stays smooth.",
          targetScreen: "Event Team",
          priority: 55,
        });
      }
      if (!hasVendorType(input.vendors, "Planner")) {
        gaps.push({
          id: "gap-team-planner",
          area: "event-team",
          message: "Add your planner or coordinator so everyone shares one contact sheet.",
          targetScreen: "Event Team",
          priority: 56,
        });
      }
      if (!hasVendorType(input.vendors, "Venue")) {
        gaps.push({
          id: "gap-team-venue",
          area: "event-team",
          message: "Add your venue contact for load-in and day-of questions.",
          targetScreen: "Event Team",
          priority: 57,
        });
      }
    }
  }

  if (input.sectionPlanningQuestionsEnabled) {
    const n = unansweredPlanningQuestions(input.planningQuestions, input.planningQuestionAnswers);
    if (n > 0) {
      gaps.push({
        id: "gap-planning-questions",
        area: "planning-questions",
        message:
          n === 1
            ? "One prompt about your day is still open—short answers are enough."
            : `${n} prompts about your day are still open—short answers are enough.`,
        targetScreen: "Planning Questions",
        priority: 18,
      });
    }
  }

  gaps.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  return gaps;
}

export const COUPLE_PLANNING_GAPS_UI_MAX = 6;

export function areaLabelForCouplePlanningGap(area: CouplePlanningGapArea): string {
  switch (area) {
    case "ceremony":
      return "Ceremony";
    case "timeline":
      return "Timeline";
    case "music":
      return "Music";
    case "event-team":
      return "Event team";
    case "planning-questions":
      return "About your day";
    default:
      return "Planning";
  }
}
