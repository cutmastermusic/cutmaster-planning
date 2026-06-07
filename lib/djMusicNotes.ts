import type { DjMusicNote, DjMusicNotes } from "@/types/planning";

/** Matches the app-wide id convention: `${prefix}-${ts}-${rand}`. SSR-safe. */
function makeDjMusicNoteId(): string {
  return `dj-music-note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Default music notes for an event that has never had any set.
 * Intentionally empty — we never seed sample/placeholder content into the
 * Event Document or operational views.
 */
export function defaultDjMusicNotes(): DjMusicNotes {
  return [];
}

/** A blank entry for the "Add note" action. */
export function createDjMusicNote(order: number): DjMusicNote {
  return { id: makeDjMusicNoteId(), text: "", order };
}

function coerceNote(value: unknown, fallbackOrder: number): DjMusicNote | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : makeDjMusicNoteId(),
    text: typeof raw.text === "string" ? raw.text : "",
    order: typeof raw.order === "number" ? raw.order : fallbackOrder,
  };
}

/**
 * Tolerant parse of the Event.djMusicNotes JSON value.
 * - A valid array (including an empty one) is parsed as-is.
 * - null / missing / unexpected shapes resolve to an empty list (no seeds).
 */
export function parseDjMusicNotesJson(value: unknown): DjMusicNotes {
  if (Array.isArray(value)) {
    return value
      .map((note, index) => coerceNote(note, index))
      .filter((note): note is DjMusicNote => note !== null)
      .sort((a, b) => a.order - b.order)
      .map((note, index) => ({ ...note, order: index }));
  }
  return defaultDjMusicNotes();
}

export function isDjMusicNotesEmpty(notes: DjMusicNotes | null | undefined): boolean {
  if (!notes || notes.length === 0) return true;
  return notes.every((note) => !(note.text ?? "").trim());
}

/** Normalize for DB write: stable shape + sequential order. Empty entries are kept. */
export function normalizeDjMusicNotesForDb(
  notes: DjMusicNotes | null | undefined,
): DjMusicNotes {
  if (!Array.isArray(notes)) return [];
  return [...notes]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((note, index) => ({
      id: typeof note.id === "string" && note.id ? note.id : makeDjMusicNoteId(),
      text: typeof note.text === "string" ? note.text : "",
      order: index,
    }));
}
