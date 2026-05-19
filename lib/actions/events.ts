"use server";

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
  return prisma.event.findMany({
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
    },
  });
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