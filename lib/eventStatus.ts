/** Planning/execution stages for booked events (not a CRM pipeline). */
export const EVENT_STATUSES = [
  "Planning",
  "Final Review",
  "Event Ready",
  "Completed",
  "Archived",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

const STATUS_SET = new Set<string>(EVENT_STATUSES);

/** Maps DB, settings, and legacy lifecycle values into a valid status. */
export function normalizeEventStatus(
  value: unknown,
  legacyLifecycle?: unknown,
): EventStatus {
  if (typeof value === "string" && STATUS_SET.has(value)) {
    return value as EventStatus;
  }
  const legacy = typeof legacyLifecycle === "string" ? legacyLifecycle : value;
  if (legacy === "archived") return "Archived";
  if (legacy === "completed") return "Completed";
  if (legacy === "active") return "Planning";
  return "Planning";
}

export function isArchivedEventStatus(status: EventStatus): boolean {
  return status === "Archived";
}

/** Pill classes for All Events cards (on dark cover overlay). */
export function eventStatusPillClassOnCover(status: EventStatus): string {
  switch (status) {
    case "Archived":
      return "bg-black/60 text-zinc-200";
    case "Completed":
      return "bg-emerald-500/25 text-emerald-100";
    case "Event Ready":
      return "bg-sky-500/30 text-sky-50";
    case "Final Review":
      return "bg-amber-500/30 text-amber-50";
    default:
      return "bg-white/15 text-white";
  }
}

/** Pill classes for light surfaces (settings, lists). */
export function eventStatusPillClassOnLight(status: EventStatus): string {
  switch (status) {
    case "Archived":
      return "bg-stone-200 text-stone-700 ring-stone-300/80";
    case "Completed":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "Event Ready":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case "Final Review":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    default:
      return "bg-stone-100 text-stone-800 ring-stone-200";
  }
}
