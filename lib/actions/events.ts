"use server";

import { prisma } from "@/lib/prisma";

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

export async function createEvent(data: {
  title: string;
  date?: Date | null;
  type?: string | null;
  venue?: string | null;
}) {
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
      ownerId: demoUser.id,
      timelines: {
        create: {
          title: "Main Timeline",
        },
      },
    },
  });
}