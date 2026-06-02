import type { TimelineItem } from "@/types/planning";

/** Planning-question key for structured speeches / toasts list. */
export const SPEECHES_TOASTS_PLANNING_KEY = "pq_toasts";

/** Canonical reception timeline moment title (shared with default wedding presets). */
export const SPEECHES_TOASTS_TIMELINE_TITLE = "Speeches / Toasts";

/** When set, auto-insert of the default timeline moment is skipped (user removed the row). */
export const SPEECHES_TOASTS_TIMELINE_SUPPRESSED_KEY = "_st_timeline_suppressed";

export const SPEECHES_TOASTS_STORAGE_PREFIX = "st:v1:";

export type SpeechesToastEntry = {
  id: string;
  role: string;
  name: string;
  order: number;
};

export const SPEECHES_TOASTS_HELPER_COPY =
  "Add each speaker in toast order. Role is how they are introduced (Best Man, Maid of Honor, etc.) and name is who will speak.";

const LEGACY_LINE_PREFIX = /^\s*(?:[-•*]|\d+[.)])\s*/;

function splitLegacyLine(line: string): { role: string; name: string } {
  const trimmed = line.trim();
  const roleNameMatch = trimmed.match(/^(.+?)\s*[—–\-:]\s*(.+)$/);
  if (roleNameMatch) {
    return {
      role: roleNameMatch[1].trim(),
      name: roleNameMatch[2].trim(),
    };
  }
  return { role: "", name: trimmed };
}

function normalizeEntry(
  value: unknown,
  fallbackOrder: number,
): SpeechesToastEntry | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<SpeechesToastEntry>;
  const role = typeof row.role === "string" ? row.role.trim() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!role && !name) return null;
  return {
    id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `st-${fallbackOrder}`,
    role,
    name,
    order: typeof row.order === "number" && Number.isFinite(row.order) ? row.order : fallbackOrder,
  };
}

export function sortSpeechesToastEntries(entries: SpeechesToastEntry[]): SpeechesToastEntry[] {
  return entries
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((entry, index) => ({ ...entry, order: index }));
}

export function parseSpeechesToasts(raw: string | undefined | null): SpeechesToastEntry[] {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return [];

  if (trimmed.startsWith(SPEECHES_TOASTS_STORAGE_PREFIX)) {
    try {
      const parsed: unknown = JSON.parse(trimmed.slice(SPEECHES_TOASTS_STORAGE_PREFIX.length));
      if (!Array.isArray(parsed)) return [];
      const entries = parsed
        .map((row, index) => normalizeEntry(row, index))
        .filter((row): row is SpeechesToastEntry => row != null);
      return sortSpeechesToastEntries(entries);
    } catch {
      return [];
    }
  }

  return sortSpeechesToastEntries(
    trimmed
      .split(/\n/)
      .map((line) => line.replace(LEGACY_LINE_PREFIX, "").trim())
      .filter(Boolean)
      .map((line, index) => {
        const { role, name } = splitLegacyLine(line);
        return {
          id: `legacy-${index}`,
          role,
          name,
          order: index,
        };
      })
      .filter((entry) => entry.role || entry.name),
  );
}

export function serializeSpeechesToasts(entries: SpeechesToastEntry[]): string {
  const normalized = sortSpeechesToastEntries(
    entries.filter((entry) => entry.role.trim() || entry.name.trim()),
  );
  if (normalized.length === 0) return "";
  return SPEECHES_TOASTS_STORAGE_PREFIX + JSON.stringify(normalized);
}

export function speechesToastsHasEntries(raw: string | undefined | null): boolean {
  return parseSpeechesToasts(raw).length > 0;
}

export function formatSpeechesToastLine(entry: SpeechesToastEntry, index: number): string {
  const role = entry.role.trim();
  const name = entry.name.trim();
  const prefix = `${index + 1}. `;
  if (role && name) return `${prefix}${role} — ${name}`;
  return `${prefix}${role || name}`;
}

export function formatSpeechesToastsForDisplay(raw: string | undefined | null): string {
  const entries = parseSpeechesToasts(raw);
  if (entries.length === 0) return "";
  return entries.map((entry, index) => formatSpeechesToastLine(entry, index)).join("\n");
}

export function createEmptySpeechesToastEntry(order: number): SpeechesToastEntry {
  return {
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: "",
    name: "",
    order,
  };
}

export function speechesToastEntriesEqual(
  a: SpeechesToastEntry[],
  b: SpeechesToastEntry[],
): boolean {
  const left = sortSpeechesToastEntries(a);
  const right = sortSpeechesToastEntries(b);
  if (left.length !== right.length) return false;
  return left.every((entry, index) => {
    const other = right[index];
    return (
      entry.id === other.id &&
      entry.role.trim() === other.role.trim() &&
      entry.name.trim() === other.name.trim() &&
      entry.order === other.order
    );
  });
}

export function isToastTimelineItem(title: string): boolean {
  const normalized = title.trim();
  if (!normalized) return false;
  if (/^welcome\s+speech$/i.test(normalized)) return false;
  if (/^speeches?\s*\/\s*toasts?$/i.test(normalized)) return true;
  if (/^toasts?$/i.test(normalized)) return true;
  if (/^family\s+toasts?$/i.test(normalized)) return true;
  return false;
}

export function isSpeechesToastsTimelineSuppressed(
  answers: Record<string, string | undefined> | null | undefined,
): boolean {
  return answers?.[SPEECHES_TOASTS_TIMELINE_SUPPRESSED_KEY] === "1";
}

export function withSpeechesToastsTimelineSuppressed(
  answers: Record<string, string>,
  suppressed: boolean,
): Record<string, string> {
  const next = { ...answers };
  if (suppressed) next[SPEECHES_TOASTS_TIMELINE_SUPPRESSED_KEY] = "1";
  else delete next[SPEECHES_TOASTS_TIMELINE_SUPPRESSED_KEY];
  return next;
}

export function createSpeechesToastsTimelineItem(): TimelineItem {
  return {
    id: `timeline-speeches-toasts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: SPEECHES_TOASTS_TIMELINE_TITLE,
    time: "",
    category: "Formalities",
    notes: "",
    needsDjMcAttention: false,
  };
}

function findSpeechesToastsInsertIndex(items: TimelineItem[]): number {
  const dinnerIndex = items.findIndex((item) => /^dinner$/i.test(item.title.trim()));
  if (dinnerIndex >= 0) return dinnerIndex + 1;
  const cakeIndex = items.findIndex((item) => /cake cutting/i.test(item.title.trim()));
  if (cakeIndex >= 0) return cakeIndex;
  return items.length;
}

/** Rename legacy "Toasts" rows to the canonical title without creating duplicates. */
export function normalizeSpeechesToastsTimelineTitles(
  items: TimelineItem[],
): { items: TimelineItem[]; changed: boolean } {
  let changed = false;
  const next = items.map((item) => {
    if (/^toasts?$/i.test(item.title.trim()) && item.title.trim() !== SPEECHES_TOASTS_TIMELINE_TITLE) {
      changed = true;
      return { ...item, title: SPEECHES_TOASTS_TIMELINE_TITLE };
    }
    return item;
  });
  return { items: next, changed };
}

/**
 * Ensures wedding reception timelines include a dedicated Speeches / Toasts moment after Dinner.
 * Skips when a toast row already exists or the user removed the default row.
 */
export function ensureSpeechesToastsTimelineItem(
  items: TimelineItem[],
  planningQuestionAnswers: Record<string, string | undefined> | null | undefined,
): { items: TimelineItem[]; changed: boolean } {
  if (isSpeechesToastsTimelineSuppressed(planningQuestionAnswers)) {
    return { items, changed: false };
  }
  if (items.some((item) => isToastTimelineItem(item.title))) {
    return { items, changed: false };
  }
  const insertIndex = findSpeechesToastsInsertIndex(items);
  const next = items.slice();
  next.splice(insertIndex, 0, createSpeechesToastsTimelineItem());
  return { items: next, changed: true };
}

/** Normalize legacy titles, then insert the default moment when missing. */
export function applyWeddingSpeechesToastsTimelineDefaults(
  items: TimelineItem[],
  planningQuestionAnswers: Record<string, string | undefined> | null | undefined,
): { items: TimelineItem[]; changed: boolean } {
  const normalized = normalizeSpeechesToastsTimelineTitles(items);
  const ensured = ensureSpeechesToastsTimelineItem(normalized.items, planningQuestionAnswers);
  return {
    items: ensured.items,
    changed: normalized.changed || ensured.changed,
  };
}

export type SpeechesToastsPreviewLine = {
  primary: string;
};

export type SpeechesToastsPreviewContent = {
  lines: SpeechesToastsPreviewLine[];
  isEmpty: boolean;
};

export function getSpeechesToastsPreviewContent(
  raw: string | undefined | null,
  maxVisible?: number,
): SpeechesToastsPreviewContent {
  const entries = parseSpeechesToasts(raw);
  if (entries.length === 0) {
    return { lines: [], isEmpty: true };
  }
  const visible =
    typeof maxVisible === "number" ? entries.slice(0, maxVisible) : entries;
  return {
    lines: visible.map((entry, index) => ({
      primary: formatSpeechesToastLine(entry, index),
    })),
    isEmpty: false,
  };
}
