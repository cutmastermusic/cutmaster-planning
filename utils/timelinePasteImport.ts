import type { TimelineCategory, TimelineItem } from "@/types/planning";

import { parseFlexibleTimeToMinutes } from "@/utils/planning";

/** Editable row after parsing pasted planner text (pre-commit review). */
export type PastedTimelineImportDraft = {
  key: string;
  time: string;
  title: string;
  notes: string;
  songTitle?: string;
  artist?: string;
  category: TimelineCategory;
};

const DEFAULT_CATEGORY: TimelineCategory = "Reception";

function normalizeTimeTokenForParse(token: string): string {
  const t = token.trim();
  const glued = t.match(/^(\d{1,2}:\d{2}|(?:\d{1,2}))((?:am|pm))$/i);
  if (glued) return `${glued[1]} ${glued[2].toUpperCase()}`;
  return t;
}

/**
 * Strips a leading clock token from a line when {@link parseFlexibleTimeToMinutes} accepts it.
 * Returns null when no leading time is found (caller may still use the whole line as title-only).
 */
function stripLeadingTime(line: string): { time: string; rest: string } | null {
  const patterns: RegExp[] = [
    /^(\d{1,2}:\d{2}\s*(?:AM|PM))\s+/i,
    /^(\d{1,2}:\d{2})(AM|PM)\b\s*/i,
    /^(\d{1,2}:\d{2})\s+(?=\S)/,
    /^(\d{1,2}(?::\d{2})?)(AM|PM)\s+/i,
    /^(\d{1,2})(AM|PM)\s+/i,
    /^(\d{1,2}(?::\d{2})?)(am|pm)\s+/i,
    /^(\d{1,2})(am|pm)\s+/i,
  ];

  for (const re of patterns) {
    const m = line.match(re);
    if (!m) continue;
    const tokenForParse =
      m[2] !== undefined ? normalizeTimeTokenForParse(`${m[1]}${m[2]}`) : m[1].trim();
    if (parseFlexibleTimeToMinutes(tokenForParse) === null) continue;
    const rest = line.slice(m[0].length).trim();
    const displayTime =
      m[2] !== undefined ? `${m[1]} ${m[2].toLowerCase()}`.replace(/\s+/g, " ").trim() : m[1].trim();
    return { time: displayTime.replace(/\s+/g, " ").trim(), rest };
  }

  const whole = line.trim();
  if (whole && parseFlexibleTimeToMinutes(whole) !== null) {
    return { time: whole, rest: "" };
  }

  return null;
}

function splitTitleNotesAndSong(rest: string): {
  title: string;
  notes: string;
  songTitle?: string;
  artist?: string;
} {
  let working = rest.trim();
  let songTitle: string | undefined;
  let artist: string | undefined;

  const songIdx = working.search(/\b(?:Song|Music)\s*:/i);
  if (songIdx !== -1) {
    const before = working.slice(0, songIdx).trim().replace(/[-–—\s]+$/u, "");
    const after = working.slice(songIdx).replace(/^\s*(?:Song|Music)\s*:/i, "").trim();
    working = before;
    const songPart = after;
    const dash = songPart.match(/^(.+?)\s*[-–—]\s*(.+)$/u);
    if (dash) {
      songTitle = dash[1].trim();
      artist = dash[2].trim();
    } else {
      songTitle = songPart;
    }
  }

  const mdash = working.match(/^(.+?)\s*[-–—]\s+(.+)$/u);
  if (mdash && !songTitle) {
    return {
      title: mdash[1].trim(),
      notes: mdash[2].trim(),
      songTitle,
      artist,
    };
  }

  return {
    title: working.trim() || "Untitled moment",
    notes: "",
    songTitle,
    artist,
  };
}

/**
 * Parses pasted multi-line planner/coordinator text into reviewable reception timeline drafts.
 * Blank lines are skipped. Lines without a leading parseable time become title-only rows when non-trivial.
 */
export function parsePastedTimelineText(raw: string): PastedTimelineImportDraft[] {
  const lines = raw.split(/\r?\n/);
  const out: PastedTimelineImportDraft[] = [];
  let n = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const stripped = stripLeadingTime(line);
    if (stripped) {
      if (!stripped.rest.trim()) continue;
      const { title, notes, songTitle, artist } = splitTitleNotesAndSong(stripped.rest);
      if (!title && !notes && !songTitle) continue;
      out.push({
        key: `paste-${Date.now()}-${n++}-${Math.random().toString(36).slice(2, 7)}`,
        time: stripped.time,
        title: title || "Untitled moment",
        notes,
        songTitle,
        artist,
        category: DEFAULT_CATEGORY,
      });
      continue;
    }

    if (line.length >= 3) {
      const { title, notes, songTitle, artist } = splitTitleNotesAndSong(line);
      out.push({
        key: `paste-${Date.now()}-${n++}-${Math.random().toString(36).slice(2, 7)}`,
        time: "",
        title: title || line,
        notes,
        songTitle,
        artist,
        category: DEFAULT_CATEGORY,
      });
    }
  }
  return out;
}

/** Build persisted {@link TimelineItem} rows from approved drafts (fresh ids). */
export function timelineItemsFromImportDrafts(drafts: PastedTimelineImportDraft[]): TimelineItem[] {
  const t = Date.now();
  return drafts.map((d, i) => ({
    id: `timeline-${t}-${i}-${Math.random().toString(36).slice(2, 9)}`,
    title: d.title.trim() || "Untitled moment",
    time: d.time.trim(),
    category: d.category,
    notes: d.notes.trim(),
    songTitle: d.songTitle?.trim() || undefined,
    artist: d.artist?.trim() || undefined,
    needsDjMcAttention: false,
  }));
}
