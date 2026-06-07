"use server";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { describePayload } from "@/lib/payloadSize";
import { mergeGrandEntranceDetailIntoAnswers } from "@/lib/grandEntranceDetail";
import {
  normalizePlanningQuestionAnswersForDb,
  parseCeremonyPlanJson,
  parsePlanningQuestionAnswersJson,
  planningQuestionAnswersWithLegacyGrandEntranceColumns,
  type PlanningQuestionAnswersRecord,
} from "@/lib/planningPersistence";
import type { EventCeremonyPlanSnapshot } from "@/types/planning";

/**
 * Log a single line per Server Action invocation describing the size of the
 * arguments we received. Helps pinpoint which action is approaching the 1 MB
 * Next.js Server Action body limit and which field within it is unbounded.
 *
 * Intentionally lightweight: only a console line, no DB writes or external
 * IO. Safe to keep in production.
 */
function logActionPayload(actionName: string, payload: unknown): void {
  const report = describePayload(actionName, payload);
  console.log(
    `[action-payload] ${report.actionName} ${report.kb} KB | largest=${report.largest.path} ~${Math.round(
      report.largest.bytes / 1024,
    )} KB`,
  );
}

type EventData = {
  title: string;
  date?: Date | null;
  type?: string | null;
  venue?: string | null;
  venueAddress?: string | null;
  assignedDj?: string | null;
  packageName?: string | null;
  plannerName?: string | null;
  plannerEmail?: string | null;
  ceremonyLocation?: string | null;
  receptionLocation?: string | null;
  internalNotes?: string | null;
  eventStatus?: string | null;
};

export async function getEvents() {
  const events = await prisma.event.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      timelines: {
        include: {
          items: true,
        },
      },
      songs: true,
      guestRequests: true,
      eventTeamMembers: {
        orderBy: { order: "asc" },
      },
      eventNotes: {
        orderBy: { order: "asc" },
      },
    },
  });

  console.log(
    "[HYDRATE-DEBUG] (server) getEvents → eventTeamMembers per event:",
    events.map((evt) => ({
      eventId: evt.id,
      title: evt.title,
      teamMemberCount: evt.eventTeamMembers.length,
      teamMembers: evt.eventTeamMembers.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        order: m.order,
        isActive: m.isActive,
        email: m.email,
      })),
    })),
  );

  return events;
}

export async function createEvent(data: EventData) {
  logActionPayload("createEvent", data);
  try {
    const demoUser = await prisma.user.upsert({
      where: {
        email: "demo@cutmasterplanning.com",
      },
      update: {},
      create: {
        email: "demo@cutmasterplanning.com",
        name: "Demo User",
      },
    });

    return await prisma.event.create({
      data: {
        title: data.title,
        date: data.date,
        type: data.type,
        venue: data.venue,
        venueAddress: data.venueAddress,
        assignedDj: data.assignedDj,
        packageName: data.packageName,
        plannerName: data.plannerName,
        plannerEmail: data.plannerEmail,
        ceremonyLocation: data.ceremonyLocation,
        receptionLocation: data.receptionLocation,
        internalNotes: data.internalNotes,
        eventStatus: data.eventStatus ?? "Planning",
        ownerId: demoUser.id,
        timelines: {
          create: {
            title: "Main Timeline",
          },
        },
      },
    });
  } catch (error) {
    console.error("[createEvent] database insert failed:", error);
    throw error;
  }
}

export async function updateGrandEntranceDetail(
  eventId: string,
  detail: {
    script: string;
    lineup: string;
    coupleEntrance: string;
  },
) {
  logActionPayload("updateGrandEntranceDetail", detail);
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { planningQuestionAnswers: true },
  });
  const priorAnswers = parsePlanningQuestionAnswersJson(existing?.planningQuestionAnswers);
  const mergedAnswers = normalizePlanningQuestionAnswersForDb(
    mergeGrandEntranceDetailIntoAnswers(priorAnswers, {
      script: detail.script,
      lineup: detail.lineup,
      coupleEntrance: detail.coupleEntrance,
    }),
  );
  const legacy = planningQuestionAnswersWithLegacyGrandEntranceColumns(mergedAnswers);
  return prisma.event.update({
    where: { id: eventId },
    data: {
      planningQuestionAnswers: legacy.answers,
      grandEntranceScript: legacy.grandEntranceScript,
      grandEntranceLineup: legacy.grandEntranceLineup,
      grandEntranceCouple: legacy.grandEntranceCouple,
    },
    select: {
      id: true,
      grandEntranceScript: true,
      grandEntranceLineup: true,
      grandEntranceCouple: true,
      planningQuestionAnswers: true,
    },
  });
}

export async function replacePlanningQuestionAnswers(
  eventId: string,
  answers: PlanningQuestionAnswersRecord,
) {
  logActionPayload("replacePlanningQuestionAnswers", answers);
  const legacy = planningQuestionAnswersWithLegacyGrandEntranceColumns(answers);
  return prisma.event.update({
    where: { id: eventId },
    data: {
      planningQuestionAnswers: legacy.answers,
      grandEntranceScript: legacy.grandEntranceScript,
      grandEntranceLineup: legacy.grandEntranceLineup,
      grandEntranceCouple: legacy.grandEntranceCouple,
    },
    select: {
      id: true,
      planningQuestionAnswers: true,
      grandEntranceScript: true,
      grandEntranceLineup: true,
      grandEntranceCouple: true,
    },
  });
}

export async function replaceCeremonyPlan(eventId: string, plan: EventCeremonyPlanSnapshot) {
  logActionPayload("replaceCeremonyPlan", plan);
  const normalized = parseCeremonyPlanJson(plan) ?? plan;
  return prisma.event.update({
    where: { id: eventId },
    data: {
      ceremonyPlan: normalized as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      ceremonyPlan: true,
    },
  });
}

export async function replaceDjScripts(
  eventId: string,
  scripts: Array<{
    id: string;
    title: string;
    body: string;
    order: number;
  }>,
) {
  logActionPayload("replaceDjScripts", scripts);
  return prisma.event.update({
    where: { id: eventId },
    data: {
      djScripts: scripts as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      djScripts: true,
    },
  });
}

export async function updateEvent(id: string, data: EventData) {
  logActionPayload("updateEvent", data);
  return prisma.event.update({
    where: {
      id,
    },
    data: {
      title: data.title,
      date: data.date,
      type: data.type,
      venue: data.venue,
      venueAddress: data.venueAddress,
      assignedDj: data.assignedDj,
      packageName: data.packageName,
      plannerName: data.plannerName,
      plannerEmail: data.plannerEmail,
      ceremonyLocation: data.ceremonyLocation,
      receptionLocation: data.receptionLocation,
      internalNotes: data.internalNotes,
      eventStatus: data.eventStatus ?? undefined,
    },
  });
}

export async function deleteEvent(id: string) {
  logActionPayload("deleteEvent", { id });

  const eventExists = await prisma.event.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!eventExists) {
    return { deleted: false as const };
  }

  await prisma.$transaction(async (tx) => {
    const timelines = await tx.timeline.findMany({
      where: { eventId: id },
      select: { id: true },
    });
    const timelineIds = timelines.map((timeline) => timeline.id);

    if (timelineIds.length > 0) {
      await tx.timelineItem.deleteMany({
        where: { timelineId: { in: timelineIds } },
      });
    }

    await tx.timeline.deleteMany({ where: { eventId: id } });
    await tx.eventSong.deleteMany({ where: { eventId: id } });
    await tx.guestRequest.deleteMany({ where: { eventId: id } });
    await tx.event.delete({ where: { id } });
  });

  return { deleted: true as const };
}
export async function replaceMainTimelineItems(
  eventId: string,
  items: Array<{
    time?: string | null;
    title: string;
    category?: string | null;
    notes?: string | null;
    needsDjMcAttention?: boolean;
    songTitle?: string | null;
    artist?: string | null;
    fadeOutEarly?: boolean;
    fadeOutTimestamp?: string | null;
    runOfShowDone?: boolean;
    teamCueFormat?: string | null;
    order: number;
  }>,
) {
  logActionPayload("replaceMainTimelineItems", items);
  const timeline = await prisma.timeline.upsert({
    where: {
      eventId_title: {
        eventId,
        title: "Main Timeline",
      },
    },
    update: {},
    create: {
      eventId,
      title: "Main Timeline",
    },
  });

  // Atomic replace: delete + recreate run in one transaction so a failed
  // createMany can never leave the timeline emptied by a committed deleteMany.
  await prisma.$transaction(async (tx) => {
    await tx.timelineItem.deleteMany({
      where: {
        timelineId: timeline.id,
      },
    });

    await tx.timelineItem.createMany({
      data: items.map((item) => ({
        timelineId: timeline.id,
        time: item.time,
        title: item.title,
        category: item.category,
        notes: item.notes,
        needsDjMcAttention: item.needsDjMcAttention ?? false,
        songTitle: item.songTitle,
        artist: item.artist,
        fadeOutEarly: item.fadeOutEarly ?? false,
        fadeOutTimestamp: item.fadeOutTimestamp,
        runOfShowDone: item.runOfShowDone ?? false,
        teamCueFormat: item.teamCueFormat ?? "plain",
        order: item.order,
      })),
    });
  });
}

export async function replaceCeremonyTimelineItems(
  eventId: string,
  items: Array<{
    time?: string | null;
    title: string;
    category?: string | null;
    notes?: string | null;
    needsDjMcAttention?: boolean;
    songTitle?: string | null;
    artist?: string | null;
    fadeOutEarly?: boolean;
    fadeOutTimestamp?: string | null;
    runOfShowDone?: boolean;
    teamCueFormat?: string | null;
    order: number;
  }>,
) {
  logActionPayload("replaceCeremonyTimelineItems", items);
  const timeline = await prisma.timeline.upsert({
    where: {
      eventId_title: {
        eventId,
        title: "Ceremony Timeline",
      },
    },
    update: {},
    create: {
      eventId,
      title: "Ceremony Timeline",
    },
  });

  // Atomic replace: delete + recreate run in one transaction so a failed
  // createMany can never leave the timeline emptied by a committed deleteMany.
  await prisma.$transaction(async (tx) => {
    await tx.timelineItem.deleteMany({
      where: {
        timelineId: timeline.id,
      },
    });

    await tx.timelineItem.createMany({
      data: items.map((item) => ({
        timelineId: timeline.id,
        time: item.time,
        title: item.title,
        category: item.category,
        notes: item.notes,
        needsDjMcAttention: item.needsDjMcAttention ?? false,
        songTitle: item.songTitle,
        artist: item.artist,
        fadeOutEarly: item.fadeOutEarly ?? false,
        fadeOutTimestamp: item.fadeOutTimestamp,
        runOfShowDone: item.runOfShowDone ?? false,
        teamCueFormat: item.teamCueFormat ?? "plain",
        order: item.order,
      })),
    });
  });
}

export async function replaceEventSongs(
  eventId: string,
  listType: string,
  songs: Array<{
    title: string;
    artist?: string | null;
    notes?: string | null;
    highPriority?: boolean;
    order: number;
  }>,
) {
  logActionPayload(`replaceEventSongs[${listType}]`, songs);
  await prisma.eventSong.deleteMany({
    where: {
      eventId,
      listType,
    },
  });

  await prisma.eventSong.createMany({
    data: songs.map((song) => ({
      eventId,
      listType,
      title: song.title,
      artist: song.artist,
      notes: song.notes,
      highPriority: song.highPriority ?? false,
      order: song.order,
    })),
  });
}

export async function replaceGuestRequests(
  eventId: string,
  guestRequests: Array<{
    guestName: string;
    songTitle: string;
    artist: string;
    dedication: string;
    status: string;
    addedToMustPlay?: boolean;
    addedToDoNotPlay?: boolean;
    order: number;
  }>,
) {
  logActionPayload("replaceGuestRequests", guestRequests);
  await prisma.guestRequest.deleteMany({
    where: {
      eventId,
    },
  });

  await prisma.guestRequest.createMany({
    data: guestRequests.map((request) => ({
      eventId,
      guestName: request.guestName,
      songTitle: request.songTitle,
      artist: request.artist,
      dedication: request.dedication,
      status: request.status,
      addedToMustPlay: request.addedToMustPlay ?? false,
      addedToDoNotPlay: request.addedToDoNotPlay ?? false,
      order: request.order,
    })),
  });
}

export async function replaceEventTeamMembers(
  eventId: string,
  teamMembers: Array<{
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
  }>,
) {
  logActionPayload("replaceEventTeamMembers", teamMembers);
  console.log("replaceEventTeamMembers CALLED");
  console.log(
    "replaceEventTeamMembers incoming",
    teamMembers.map((m) => m.name),
  );
  console.log("[TEAM-DEBUG] (server) replaceEventTeamMembers ENTER", {
    eventId,
    count: teamMembers.length,
    sample: teamMembers[0],
    incomingNames: teamMembers.map((m) => m.name),
    incomingRoles: teamMembers.map((m) => m.role),
  });

  const eventExists = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  console.log("[TEAM-DEBUG] (server) event lookup", {
    eventId,
    found: Boolean(eventExists),
  });

  if (!eventExists) {
    console.warn(
      "[TEAM-DEBUG] (server) replaceEventTeamMembers: event not found in DB; aborting to avoid FK error",
      { eventId },
    );
    return [];
  }

  const deleted = await prisma.eventTeamMember.deleteMany({
    where: { eventId },
  });
  console.log("[TEAM-DEBUG] (server) deleteMany done", {
    eventId,
    deletedCount: deleted.count,
  });

  if (teamMembers.length === 0) {
    const rows = await prisma.eventTeamMember.findMany({
      where: { eventId },
      orderBy: { order: "asc" },
    });
    console.log("[TEAM-DEBUG] (server) empty payload → returning current rows", {
      eventId,
      rows: rows.length,
    });
    return rows;
  }

  const created = await prisma.eventTeamMember.createMany({
    data: teamMembers.map((member) => ({
      eventId,
      name: member.name,
      role: member.role,
      company: member.company ?? null,
      email: member.email ?? null,
      phone: member.phone ?? null,
      notes: member.notes ?? null,
      website: member.website ?? null,
      instagram: member.instagram ?? null,
      arrivalTime: member.arrivalTime ?? null,
      specialCoordinationNotes: member.specialCoordinationNotes ?? null,
      isActive: member.isActive ?? true,
      isCollaborator: member.isCollaborator ?? false,
      permissions:
        member.permissions === undefined || member.permissions === null
          ? Prisma.JsonNull
          : member.permissions,
      order: member.order,
    })),
  });
  console.log("[TEAM-DEBUG] (server) createMany done", {
    eventId,
    createdCount: created.count,
  });

  const rows = await prisma.eventTeamMember.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
  });
  console.log("[TEAM-DEBUG] (server) replaceEventTeamMembers RETURN", {
    eventId,
    rowsReturned: rows.length,
  });
  return rows;
}

export async function replaceEventNotes(
  eventId: string,
  notes: Array<{
    category?: string;
    title?: string | null;
    body: string;
    isPinned?: boolean;
    order: number;
  }>,
) {
  logActionPayload("replaceEventNotes", notes);
  const eventExists = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!eventExists) {
    console.warn(
      "[EVENT-NOTES] replaceEventNotes: event not found in DB; aborting to avoid FK error",
      { eventId },
    );
    return [];
  }

  await prisma.eventNote.deleteMany({
    where: { eventId },
  });

  if (notes.length === 0) {
    return prisma.eventNote.findMany({
      where: { eventId },
      orderBy: { order: "asc" },
    });
  }

  await prisma.eventNote.createMany({
    data: notes.map((note) => ({
      eventId,
      category: note.category?.trim() || "General",
      title: note.title?.trim() || null,
      body: note.body,
      isPinned: note.isPinned ?? false,
      order: note.order,
    })),
  });

  return prisma.eventNote.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
  });
}