import {
  type EventCapability,
  type CapabilityActor,
  type EventMemberRoleKey,
  normalizeEventMemberRole,
  roleHasCapability,
} from "@/lib/eventAccess/capabilities";
import { EventAccessError } from "@/lib/eventAccess/errors";
import { resolveSessionAccess } from "@/lib/eventAccess/resolveSessionAccess";
import type { EventMembership, SessionAccessProfile } from "@/lib/eventAccess/types";

export type AuthorizedActor = {
  access: SessionAccessProfile;
  bypass: boolean;
  platformAdmin: boolean;
  eventId: string | null;
  eventMemberRole: EventMemberRoleKey | null;
  capabilityActor: CapabilityActor;
};

function findActiveMembership(
  memberships: EventMembership[],
  eventId: string,
): EventMembership | undefined {
  return memberships.find(
    (membership) => membership.eventId === eventId && membership.status === "ACTIVE",
  );
}

function assertCapabilityAllowed(actor: CapabilityActor, capability: EventCapability): void {
  if (!roleHasCapability(actor, capability)) {
    throw new EventAccessError(
      "CAPABILITY_DENIED",
      `Capability "${capability}" is not allowed for this role.`,
    );
  }
}

export async function requireAuth(): Promise<SessionAccessProfile> {
  const access = await resolveSessionAccess();

  if (access.readScope === "bypass") {
    return access;
  }

  if (access.readScope === "none") {
    throw new EventAccessError("UNAUTHENTICATED", "Sign in required.");
  }

  return access;
}

export async function authorizeEventAccess(
  eventId: string,
  capability?: EventCapability,
): Promise<AuthorizedActor> {
  const access = await resolveSessionAccess();

  if (access.readScope === "bypass") {
    const actor: AuthorizedActor = {
      access,
      bypass: true,
      platformAdmin: false,
      eventId,
      eventMemberRole: null,
      capabilityActor: "bypass",
    };

    if (capability) {
      assertCapabilityAllowed("bypass", capability);
    }

    return actor;
  }

  if (access.readScope === "none") {
    throw new EventAccessError("UNAUTHENTICATED", "Sign in required.");
  }

  if (access.platformRole === "ADMIN") {
    const actor: AuthorizedActor = {
      access,
      bypass: false,
      platformAdmin: true,
      eventId,
      eventMemberRole: null,
      capabilityActor: "platform-admin",
    };

    if (capability) {
      assertCapabilityAllowed("platform-admin", capability);
    }

    return actor;
  }

  const membership = findActiveMembership(access.memberships, eventId);
  if (!membership) {
    throw new EventAccessError("FORBIDDEN", "You do not have access to this event.");
  }

  const eventMemberRole = normalizeEventMemberRole(membership.role);
  if (!eventMemberRole) {
    throw new EventAccessError("FORBIDDEN", "You do not have access to this event.");
  }

  const actor: AuthorizedActor = {
    access,
    bypass: false,
    platformAdmin: false,
    eventId,
    eventMemberRole,
    capabilityActor: eventMemberRole,
  };

  if (capability) {
    assertCapabilityAllowed(eventMemberRole, capability);
  }

  return actor;
}

export async function authorizeEventMutation(
  eventId: string,
  capability: EventCapability,
): Promise<AuthorizedActor> {
  return authorizeEventAccess(eventId, capability);
}
