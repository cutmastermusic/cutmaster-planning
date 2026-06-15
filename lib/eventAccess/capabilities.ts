export type EventCapability =
  | "event:read"
  | "event:create"
  | "event:delete"
  | "event:metadata:write"
  | "event:metadata:couple-write"
  | "event:cover-photo:write"
  | "planning:answers:write"
  | "planning:grand-entrance:write"
  | "ceremony-plan:write"
  | "music-hub:write"
  | "timeline:write"
  | "songs:write"
  | "guest-requests:write"
  | "team:write"
  | "notes:write"
  | "dj-ops:write"
  | "workspace:team:write"
  | "event:invite:write";

import type { UserRole } from "@/types/planning";

export type EventMemberRoleKey = "ADMIN" | "DJ" | "PLANNER" | "COUPLE";

export type CapabilityActor = "bypass" | "platform-admin" | EventMemberRoleKey;

const ALL_EVENT_CAPABILITIES: EventCapability[] = [
  "event:read",
  "event:create",
  "event:delete",
  "event:metadata:write",
  "event:metadata:couple-write",
  "event:cover-photo:write",
  "planning:answers:write",
  "planning:grand-entrance:write",
  "ceremony-plan:write",
  "music-hub:write",
  "timeline:write",
  "songs:write",
  "guest-requests:write",
  "team:write",
  "notes:write",
  "dj-ops:write",
  "workspace:team:write",
  "event:invite:write",
];

const CAPABILITY_MATRIX: Record<CapabilityActor, ReadonlySet<EventCapability>> = {
  bypass: new Set(ALL_EVENT_CAPABILITIES),
  "platform-admin": new Set(ALL_EVENT_CAPABILITIES),
  ADMIN: new Set([
    "event:read",
    "event:delete",
    "event:metadata:write",
    "event:metadata:couple-write",
    "event:cover-photo:write",
    "planning:answers:write",
    "planning:grand-entrance:write",
    "ceremony-plan:write",
    "music-hub:write",
    "timeline:write",
    "songs:write",
    "guest-requests:write",
    "team:write",
    "notes:write",
    "dj-ops:write",
    "event:invite:write",
  ]),
  DJ: new Set([
    "event:read",
    "event:metadata:write",
    "planning:answers:write",
    "planning:grand-entrance:write",
    "ceremony-plan:write",
    "music-hub:write",
    "timeline:write",
    "songs:write",
    "team:write",
    "dj-ops:write",
  ]),
  PLANNER: new Set([
    "event:read",
    "event:metadata:write",
    "event:cover-photo:write",
    "planning:answers:write",
    "ceremony-plan:write",
    "timeline:write",
    "team:write",
    "notes:write",
    "event:invite:write",
  ]),
  COUPLE: new Set([
    "event:read",
    "event:metadata:couple-write",
    "event:cover-photo:write",
    "planning:answers:write",
    "ceremony-plan:write",
    "music-hub:write",
    "timeline:write",
    "songs:write",
    "guest-requests:write",
    "team:write",
  ]),
};

export function normalizeEventMemberRole(role: string): EventMemberRoleKey | null {
  switch (role) {
    case "ADMIN":
    case "DJ":
    case "PLANNER":
    case "COUPLE":
      return role;
    default:
      return null;
  }
}

export function roleHasCapability(actor: CapabilityActor, capability: EventCapability): boolean {
  return CAPABILITY_MATRIX[actor]?.has(capability) ?? false;
}

/** Maps UI session role (effectiveRole) to event-member capability actor. */
export function userRoleToCapabilityActor(role: UserRole): EventMemberRoleKey | null {
  switch (role) {
    case "Admin":
      return "ADMIN";
    case "DJ":
      return "DJ";
    case "Planner":
      return "PLANNER";
    case "Couple":
      return "COUPLE";
    default:
      return null;
  }
}

export function userRoleHasEventCapability(
  role: UserRole,
  capability: EventCapability,
): boolean {
  const actor = userRoleToCapabilityActor(role);
  if (!actor) return false;
  return roleHasCapability(actor, capability);
}

export function listCapabilitiesForActor(actor: CapabilityActor): EventCapability[] {
  return [...(CAPABILITY_MATRIX[actor] ?? [])];
}
