import type { TimelineItem } from "@/types/planning";

type CoupleTimelineReviewInput = {
  timelineItems: TimelineItem[];
  planningQuestionAnswers: Record<string, string | undefined>;
};

const NON_SONG_RECEPTION_MOMENT_PATTERN =
  /^(grand entrance|toasts?|ceremony|group photo|cocktail hour|dinner)$/i;
const MUSIC_CUE_TITLE_PATTERN =
  /dance|toss|cutting|kickoff|special dance|parent dance|anniversary/i;
const TIMELINE_REVIEW_ANCHORS = ["cocktail", "dinner", "toast", "open danc", "last"] as const;

function timelineItemExpectsSongCue(
  item: Pick<TimelineItem, "title" | "category">,
): boolean {
  const title = item.title.trim();
  if (!title) return false;
  if (NON_SONG_RECEPTION_MOMENT_PATTERN.test(title)) return false;
  if (item.category === "Formalities") return !/grand entrance|toast/i.test(title);
  if (item.category === "Dancing") return !/^open dancing$/i.test(title);
  return MUSIC_CUE_TITLE_PATTERN.test(title);
}

function timelineAnchorLabel(needle: (typeof TIMELINE_REVIEW_ANCHORS)[number]): string {
  switch (needle) {
    case "cocktail":
      return "Cocktail hour";
    case "dinner":
      return "Dinner";
    case "toast":
      return "Speeches / Toasts";
    case "open danc":
      return "Open dancing";
    default:
      return "Last dance";
  }
}

function timelineItemHasSong(item: Pick<TimelineItem, "songTitle" | "artist">): boolean {
  return Boolean(item.songTitle?.trim() || item.artist?.trim());
}

function buildTimelineReviewNotes(input: CoupleTimelineReviewInput): string[] {
  const rows = TIMELINE_REVIEW_ANCHORS.map((needle) => ({
    needle,
    row: input.timelineItems.find((item) => item.title.toLowerCase().includes(needle)),
  }));
  if (rows.every((entry) => !entry.row)) {
    return ["Add key reception moments to the timeline"];
  }
  return rows.flatMap(({ needle, row }) => {
    if (!row) return [`${timelineAnchorLabel(needle)} not on timeline`];
    if (timelineItemExpectsSongCue(row) && !timelineItemHasSong(row)) {
      return [`${row.title.trim()} song missing`];
    }
    if (!row.time?.trim() && !row.notes?.trim()) {
      return [`${row.title.trim()} needs a time or notes`];
    }
    return [];
  });
}

/** Map internal checklist gap notes to couple-friendly review lines (presentation only). */
export function coupleFriendlyTimelineGapLabel(note: string): string {
  const trimmed = note.trim();
  const songMissing = trimmed.match(/^(.+) song missing$/i);
  if (songMissing) {
    return `Add song details for ${songMissing[1]!.trim()}`;
  }
  if (/speeches \/ toasts need speakers or notes/i.test(trimmed)) {
    return "Confirm toast speakers";
  }
  if (/grand entrance needs script, lineup, or song/i.test(trimmed)) {
    return "Add wedding party lineup or entrance details for Grand Entrance";
  }
  const needsTime = trimmed.match(/^(.+) needs a time or notes$/i);
  if (needsTime) {
    return `Add a time for ${needsTime[1]!.trim()}`;
  }
  const notOnTimeline = trimmed.match(/^(.+) not on timeline$/i);
  if (notOnTimeline) {
    return `Add ${notOnTimeline[1]!.trim()} to your timeline`;
  }
  if (/add key reception moments/i.test(trimmed)) {
    return "Add key moments: cocktail hour, dinner, toasts, open dancing, and last dance";
  }
  return trimmed;
}

/**
 * Merges timeline review + music cue gap notes from existing timeline data.
 * Deduplicates after couple-friendly labeling.
 */
export function buildCoupleTimelineReviewGapLabels(
  input: CoupleTimelineReviewInput,
): string[] {
  const reviewNotes = buildTimelineReviewNotes(input);
  const danceNotes = input.timelineItems
    .filter((item) => timelineItemExpectsSongCue(item) && !timelineItemHasSong(item))
    .map((item) => `${item.title.trim()} song missing`);
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const note of [...reviewNotes, ...danceNotes]) {
    if (/not on timeline|add key reception moments/i.test(note)) continue;
    const friendly = coupleFriendlyTimelineGapLabel(note);
    const key = friendly.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(friendly);
  }

  return labels;
}

export function receptionTimelineRowMissingSong(
  item: Pick<TimelineItem, "title" | "category" | "songTitle" | "artist">,
): boolean {
  if (!timelineItemExpectsSongCue(item)) return false;
  return !(item.songTitle?.trim() || item.artist?.trim());
}
