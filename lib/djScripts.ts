import type { DjScriptEntry, DjScripts } from "@/types/planning";

/** Matches the app-wide id convention: `${prefix}-${ts}-${rand}`. SSR-safe. */
function makeDjScriptId(): string {
  return `dj-script-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_DJ_SCRIPT_TITLES = [
  "Grand Entrance",
  "Welcome",
  "Last Call",
  "Send Off",
  "Custom Script Notes",
] as const;

/** Starter entries seeded for events that have never had scripts set. */
export function defaultDjScripts(): DjScripts {
  return DEFAULT_DJ_SCRIPT_TITLES.map((title, index) => ({
    id: makeDjScriptId(),
    title,
    body: "",
    order: index,
  }));
}

/** A blank entry for the "Add script" action. */
export function createDjScriptEntry(order: number): DjScriptEntry {
  return { id: makeDjScriptId(), title: "", body: "", order };
}

function coerceEntry(value: unknown, fallbackOrder: number): DjScriptEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : makeDjScriptId(),
    title: typeof raw.title === "string" ? raw.title : "",
    body: typeof raw.body === "string" ? raw.body : "",
    order: typeof raw.order === "number" ? raw.order : fallbackOrder,
  };
}

/**
 * Tolerant parse of the Event.djScripts JSON value.
 * - A valid array (including an empty one) is parsed as-is (so a DJ who deletes
 *   every script keeps an empty list rather than re-seeding starters).
 * - null / missing / unexpected shapes seed the default starter entries.
 */
export function parseDjScriptsJson(value: unknown): DjScripts {
  if (Array.isArray(value)) {
    const entries = value
      .map((entry, index) => coerceEntry(entry, index))
      .filter((entry): entry is DjScriptEntry => entry !== null)
      .sort((a, b) => a.order - b.order)
      .map((entry, index) => ({ ...entry, order: index }));
    return entries;
  }
  return defaultDjScripts();
}

export function isDjScriptsEmpty(scripts: DjScripts | null | undefined): boolean {
  if (!scripts || scripts.length === 0) return true;
  return scripts.every((entry) => !(entry.title ?? "").trim() && !(entry.body ?? "").trim());
}

/** Normalize for DB write: stable shape + sequential order. Empty entries are kept. */
export function normalizeDjScriptsForDb(scripts: DjScripts | null | undefined): DjScripts {
  if (!Array.isArray(scripts)) return [];
  return [...scripts]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((entry, index) => ({
      id: typeof entry.id === "string" && entry.id ? entry.id : makeDjScriptId(),
      title: typeof entry.title === "string" ? entry.title : "",
      body: typeof entry.body === "string" ? entry.body : "",
      order: index,
    }));
}
