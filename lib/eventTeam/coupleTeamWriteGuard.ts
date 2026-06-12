import type { AuthorizedActor } from "@/lib/eventAccess/authorize";
import { EventAccessError } from "@/lib/eventAccess/errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export type EventTeamMemberWriteInput = {
  name: string;
  role: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  website?: string | null;
  instagram?: string | null;
  arrivalTime?: string | null;
  specialCoordinationNotes?: string | null;
  isActive?: boolean;
  isCollaborator?: boolean;
  permissions?: Prisma.InputJsonValue | null;
  order: number;
};

/** Internal Cutmaster staff on the event team roster (mirrors client `isCutmasterEventTeamMember`). */
export function isInternalCutmasterEventTeamMember(row: {
  role: string;
  company?: string | null;
}): boolean {
  if (row.role === "Admin" || row.role === "DJ") return true;
  if (row.role === "Planner" && !(row.company?.trim() ?? "")) return true;
  return false;
}

export function actorRequiresCoupleSafeTeamWrite(actor: AuthorizedActor): boolean {
  if (actor.bypass || actor.platformAdmin) return false;
  return actor.eventMemberRole === "COUPLE";
}

function dbRowToWriteInput(
  row: Awaited<ReturnType<typeof loadExistingEventTeamMembers>>[number],
): EventTeamMemberWriteInput {
  return {
    name: row.name,
    role: row.role,
    company: row.company,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    website: row.website,
    instagram: row.instagram,
    arrivalTime: row.arrivalTime,
    specialCoordinationNotes: row.specialCoordinationNotes,
    isActive: row.isActive,
    isCollaborator: row.isCollaborator,
    permissions: row.permissions,
    order: row.order,
  };
}

async function loadExistingEventTeamMembers(eventId: string) {
  return prisma.eventTeamMember.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
  });
}

/**
 * COUPLE writes may replace vendor/contact rows they manage, but must never
 * delete or overwrite internal Cutmaster staff rows.
 */
export async function enforceCoupleSafeEventTeamReplace(
  eventId: string,
  incoming: EventTeamMemberWriteInput[],
): Promise<EventTeamMemberWriteInput[]> {
  for (const member of incoming) {
    if (isInternalCutmasterEventTeamMember(member)) {
      throw new EventAccessError(
        "FORBIDDEN",
        "You cannot modify Cutmaster staff on the event team.",
      );
    }
  }

  const existing = await loadExistingEventTeamMembers(eventId);
  const staffFromDb = existing
    .filter((row) => isInternalCutmasterEventTeamMember(row))
    .map(dbRowToWriteInput);

  const clientRows = incoming.map((member, index) => ({
    ...member,
    order: staffFromDb.length + index,
  }));

  return [...staffFromDb, ...clientRows];
}
