"use server";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type EventData = {
  title: string;
  date?: Date | null;
  type?: string | null;
  venue?: string | null;
  assignedDj?: string | null;
  packageName?: string | null;
  plannerName?: string | null;
  plannerEmail?: string | null;
  ceremonyLocation?: string | null;
  receptionLocation?: string | null;
  internalNotes?: string | null;
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

  return prisma.event.create({
    data: {
      title: data.title,
      date: data.date,
      type: data.type,
      venue: data.venue,
      assignedDj: data.assignedDj,
      packageName: data.packageName,
      plannerName: data.plannerName,
      plannerEmail: data.plannerEmail,
      ceremonyLocation: data.ceremonyLocation,
      receptionLocation: data.receptionLocation,
      internalNotes: data.internalNotes,
      ownerId: demoUser.id,
      timelines: {
        create: {
          title: "Main Timeline",
        },
      },
    },
  });
}

export async function updateEvent(id: string, data: EventData) {
  return prisma.event.update({
    where: {
      id,
    },
    data: {
      title: data.title,
      date: data.date,
      type: data.type,
      venue: data.venue,
      assignedDj: data.assignedDj,
      packageName: data.packageName,
      plannerName: data.plannerName,
      plannerEmail: data.plannerEmail,
      ceremonyLocation: data.ceremonyLocation,
      receptionLocation: data.receptionLocation,
      internalNotes: data.internalNotes,
    },
  });
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
    order: number;
  }>,
) {
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

  await prisma.timelineItem.deleteMany({
    where: {
      timelineId: timeline.id,
    },
  });

  await prisma.timelineItem.createMany({
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
      order: item.order,
    })),
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
    order: number;
  }>,
) {
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

  await prisma.timelineItem.deleteMany({
    where: {
      timelineId: timeline.id,
    },
  });

  await prisma.timelineItem.createMany({
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
      order: item.order,
    })),
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