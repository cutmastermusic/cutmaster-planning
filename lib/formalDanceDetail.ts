import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import { isToastTimelineItem } from "@/lib/speechesToasts";
import type { TimelineItem } from "@/types/planning";

const NON_FORMAL_DANCE_TITLE_PATTERN =
  /^(cake cutting|bouquet(?:\s+toss)?|garter(?:\s+toss)?|open dancing(?:\s+kickoff)?)$/i;

const FORMAL_DANCE_TITLE_PATTERN =
  /first dance|father[-/ ]?daughter|mother[-/ ]?son|anniversary|private last(?:\s+dance)?|last dance|parent dance|special dance|\bdance\b/i;

function isKickoffOnlyMoment(title: string): boolean {
  const normalized = title.trim();
  if (/^open dancing kickoff$/i.test(normalized)) return true;
  if (/^kickoff$/i.test(normalized)) return true;
  return /kickoff/i.test(normalized) && !/dance/i.test(normalized);
}

/** Reception timeline rows that represent a formal or special dance moment (Run Of Show command card). */
export function isFormalDanceTimelineItem(
  item: Pick<TimelineItem, "title" | "category">,
): boolean {
  const title = item.title.trim();
  if (!title) return false;
  if (isGrandEntranceTimelineItem(title) || isToastTimelineItem(title)) return false;
  if (NON_FORMAL_DANCE_TITLE_PATTERN.test(title)) return false;
  if (/^open dancing$/i.test(title)) return false;
  if (isKickoffOnlyMoment(title)) return false;
  if (/cake cutting/i.test(title)) return false;
  if (/bouquet|garter/i.test(title) && !/dance/i.test(title)) return false;

  return FORMAL_DANCE_TITLE_PATTERN.test(title);
}
