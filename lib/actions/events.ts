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