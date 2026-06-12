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
