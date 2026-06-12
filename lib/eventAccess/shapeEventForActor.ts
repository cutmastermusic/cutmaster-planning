/**
 * Strips staff-only event read fields for actors who must not receive them
 * (currently COUPLE event members). Used by server reads and client hydration.
 */

export type EventReadPayload = {
  internalNotes?: string | null;
  djScripts?: unknown;
  djMusicNotes?: unknown;
  eventNotes?: unknown[] | null;
};

export function shouldStripStaffOnlyEventFieldsForRole(
  membershipRole: string | null | undefined,
): boolean {
  return membershipRole === "COUPLE";
}

export function shapeEventReadForMembershipRole<T extends EventReadPayload>(
  event: T,
  membershipRole: string | null | undefined,
): T {
  if (!shouldStripStaffOnlyEventFieldsForRole(membershipRole)) {
    return event;
  }

  return stripStaffOnlyFieldsFromEventRead(event);
}

export function stripStaffOnlyFieldsFromEventRead<T extends EventReadPayload>(event: T): T {
  return {
    ...event,
    internalNotes: null,
    djScripts: null,
    djMusicNotes: null,
    eventNotes: [],
  };
}

export type ClientEventStaffFields = {
  settings?: { internalNotes?: string } | null;
  djScripts?: unknown;
  djMusicNotes?: unknown;
  eventNotes?: unknown[] | null;
};

/** Defense-in-depth for client hydration when couple portal loads event records. */
export function stripStaffOnlyFieldsFromClientEventRecord<T extends ClientEventStaffFields>(
  event: T,
): T {
  return {
    ...event,
    settings: event.settings
      ? { ...event.settings, internalNotes: "" }
      : event.settings,
    djScripts: [],
    djMusicNotes: [],
    eventNotes: [],
  };
}
