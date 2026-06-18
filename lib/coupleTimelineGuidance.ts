import {
  deriveFormalDanceMissingNotes,
  deriveTimelineReviewMissingNotes,
  timelineItemExpectsSongCue,
  type PlanningChecklistInput,
} from "@/lib/planningChecklist";
import type { TimelineItem } from "@/types/planning";

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
 * Merges timeline review + formal dance gap notes from existing checklist helpers.
 * Deduplicates after couple-friendly labeling.
 */
export function buildCoupleTimelineReviewGapLabels(
  input: Pick<PlanningChecklistInput, "timelineItems" | "planningQuestionAnswers">,
): string[] {
  const reviewNotes = deriveTimelineReviewMissingNotes(input);
  const danceNotes = deriveFormalDanceMissingNotes(input);
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
