"use server";

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
    name: string;
    role: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    isActive?: boolean;
    order: number;
  }>,
) {
  const demoUser = await getDemoUser();

  await prisma.companyTeamMember.deleteMany({
    where: { ownerId: demoUser.id },
  });

  if (teamMembers.length === 0) {
    return [];
  }

  await prisma.companyTeamMember.createMany({
    data: teamMembers.map((member) => ({
      ownerId: demoUser.id,
      name: member.name,
      role: member.role,
      email: member.email ?? null,
      phone: member.phone ?? null,
      notes: member.notes ?? null,
      isActive: member.isActive ?? true,
      order: member.order,
    })),
  });

  return prisma.companyTeamMember.findMany({
    where: { ownerId: demoUser.id },
    orderBy: { order: "asc" },
  });
}
