"use server";

import {
  authorizePlatformAccess,
  authorizePlatformMutation,
} from "@/lib/eventAccess/authorize";
import { prisma } from "@/lib/prisma";

const DEFAULT_COMPANY_TEAM_SEED = [
  {
    name: "Cutmaster Admin",
    role: "Admin",
    email: "admin@cutmastermusic.com",
    phone: "(505) 555-0101",
    notes: "Oversees all production and operations.",
    isActive: true,
    order: 0,
  },
  {
    name: "Jordan Vega",
    role: "DJ",
    email: "jordan@cutmastermusic.com",
    phone: "(505) 555-0110",
    notes: "Lead bilingual wedding DJ.",
    isActive: true,
    order: 1,
  },
  {
    name: "Avery Lane",
    role: "Planner",
    email: "avery@cutmastermusic.com",
    phone: "(505) 555-0120",
    notes: "Planning ops and vendor coordination.",
    isActive: true,
    order: 2,
  },
] as const;

async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: "demo@cutmasterplanning.com" },
    update: {},
    create: {
      email: "demo@cutmasterplanning.com",
      name: "Demo User",
    },
  });
}

export async function getCompanyTeamMembers() {
  await authorizePlatformAccess();
  const demoUser = await getDemoUser();
  let rows = await prisma.companyTeamMember.findMany({
    where: { ownerId: demoUser.id },
    orderBy: { order: "asc" },
  });

  if (rows.length === 0) {
    await prisma.companyTeamMember.createMany({
      data: DEFAULT_COMPANY_TEAM_SEED.map((member) => ({
        ...member,
        ownerId: demoUser.id,
      })),
    });
    rows = await prisma.companyTeamMember.findMany({
      where: { ownerId: demoUser.id },
      orderBy: { order: "asc" },
    });
  }

  return rows;
}

export async function replaceCompanyTeamMembers(
  teamMembers: Array<{
    id?: string;
    name: string;
    role: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    isActive?: boolean;
    order: number;
  }>,
) {
  await authorizePlatformMutation("workspace:team:write");
  const demoUser = await getDemoUser();
  const existingRows = await prisma.companyTeamMember.findMany({
    where: { ownerId: demoUser.id },
  });
  const existingIdSet = new Set(existingRows.map((row) => row.id));

  const preserveIds = teamMembers
    .map((member) => member.id)
    .filter((id): id is string => Boolean(id && existingIdSet.has(id)));

  const idsToDelete = existingRows
    .map((row) => row.id)
    .filter((id) => !preserveIds.includes(id));

  if (idsToDelete.length > 0) {
    await prisma.companyTeamMember.deleteMany({
      where: {
        ownerId: demoUser.id,
        id: { in: idsToDelete },
      },
    });
  }

  for (const member of teamMembers) {
    const data = {
      name: member.name,
      role: member.role,
      email: member.email ?? null,
      phone: member.phone ?? null,
      notes: member.notes ?? null,
      isActive: member.isActive ?? true,
      order: member.order,
    };

    if (member.id && existingIdSet.has(member.id)) {
      await prisma.companyTeamMember.update({
        where: { id: member.id },
        data,
      });
      continue;
    }

    await prisma.companyTeamMember.create({
      data: {
        ...data,
        ownerId: demoUser.id,
      },
    });
  }

  return prisma.companyTeamMember.findMany({
    where: { ownerId: demoUser.id },
    orderBy: { order: "asc" },
  });
}
