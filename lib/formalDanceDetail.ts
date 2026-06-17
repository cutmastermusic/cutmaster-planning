import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import { isToastTimelineItem } from "@/lib/speechesToasts";
import type { TimelineItem } from "@/types/planning";

const NON_FORMAL_DANCE_TITLE_PATTERN =
  /^(cake cutting|bouquet(?:\s+toss)?|garter(?:\s+toss)?|open dancing(?:\s+kickoff)?)$/i;

const FORMAL_DANCE_TITLE_PATTERN =
  /first dance|father[-/ ]?daughter|mother[-/ ]?son|anniversary|private last(?:\s+dance)?|last dance|parent dance|special dance|\bdance\b/i;

export const FORMAL_DANCES_PLANNING_KEY = "pq_formal_dances";

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

export type ParentDanceKind = "father_daughter" | "mother_son";

export function resolveParentDanceKind(title: string): ParentDanceKind | null {
  const normalized = title.trim().toLowerCase();
  if (/father[-/ ]?daughter|father.+daughter|daughter.+father/.test(normalized)) {
    return "father_daughter";
  }
  if (/mother[-/ ]?son|mother.+son|son.+mother/.test(normalized)) {
    return "mother_son";
  }
  return null;
}

export function isParentDanceTimelineItem(title: string): boolean {
  return resolveParentDanceKind(title) != null;
}

function lineMatchesParentDanceKind(line: string, kind: ParentDanceKind): boolean {
  const normalized = line.toLowerCase();
  if (kind === "father_daughter") {
    return /father|dad|daughter/.test(normalized);
  }
  return /mother|mom|son/.test(normalized);
}

function stripFormalDanceLineLabel(line: string, kind: ParentDanceKind): string {
  const withoutBullet = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
  const labelPattern =
    kind === "father_daughter"
      ? /^(?:father[-/ ]?daughter(?:\s+dance)?|father\s*&\s*daughter|daughter\s*&\s*father|dad\s*&\s*daughter)\s*[:—-]\s*/i
      : /^(?:mother[-/ ]?son(?:\s+dance)?|mother\s*&\s*son|son\s*&\s*mother|mom\s*&\s*son)\s*[:—-]\s*/i;
  return withoutBullet.replace(labelPattern, "").trim();
}

function stripSongDetail(line: string): string {
  return line
    .replace(/\s+(?:song|music)\s*[:—-].*$/i, "")
    .replace(/\s+to\s+["“][^"”]+["”].*$/i, "")
    .trim();
}

export function findParentDanceParticipants(
  title: string,
  formalDancesRaw: string | undefined | null,
): string {
  const kind = resolveParentDanceKind(title);
  const raw = formalDancesRaw?.trim() ?? "";
  if (!kind || !raw) return "";

  const matchingLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && lineMatchesParentDanceKind(line, kind));
  if (!matchingLine) return "";

  return stripSongDetail(stripFormalDanceLineLabel(matchingLine, kind));
}
