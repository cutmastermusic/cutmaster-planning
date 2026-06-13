import type { ReadScope } from "@/lib/eventAccess/types";

export function shouldUseUnscopedReads(readScope: ReadScope): boolean {
  return readScope === "bypass" || readScope === "all";
}

export function usesScopedEventReads(readScope: ReadScope): boolean {
  return readScope === "member" || readScope === "none";
}

export function accessibleEventIdsFromMemberships(
  memberships: Array<{ eventId: string }>,
): string[] {
  return [...new Set(memberships.map((membership) => membership.eventId))];
}

export function filterDatabaseEventsForSessionAccess<T extends { id: string }>(
  events: T[],
  readScope: ReadScope,
  memberships: Array<{ eventId: string }>,
  databaseEventIds: ReadonlySet<string>,
): T[] {
  if (!usesScopedEventReads(readScope)) {
    return events;
  }

  const allowed = new Set(accessibleEventIdsFromMemberships(memberships));
  return events.filter((event) => databaseEventIds.has(event.id) && allowed.has(event.id));
}

export function resolveActiveEventIdForSessionAccess(
  activeEventId: string,
  readScope: ReadScope,
  memberships: Array<{ eventId: string }>,
): string {
  if (!usesScopedEventReads(readScope)) {
    return activeEventId;
  }

  const allowed = accessibleEventIdsFromMemberships(memberships);
  if (activeEventId && allowed.includes(activeEventId)) {
    return activeEventId;
  }

  return allowed[0] ?? "";
}
