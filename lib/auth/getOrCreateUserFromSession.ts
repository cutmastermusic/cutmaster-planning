import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Prisma } from "@/lib/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export class AuthUserLinkConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthUserLinkConflictError";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function platformRoleForEmail(email: string): "ADMIN" | null {
  const configured = process.env.SHOWFLOW_PLATFORM_ADMIN_EMAILS?.trim();
  const adminEmails = new Set(
    (configured ? configured.split(",") : ["chris@cutmastermusic.com"])
      .map((item) => normalizeEmail(item))
      .filter(Boolean),
  );
  return adminEmails.has(normalizeEmail(email)) ? "ADMIN" : null;
}

function displayNameFromMetadata(supabaseUser: SupabaseUser): string | null {
  const metadata = supabaseUser.user_metadata;
  if (typeof metadata?.name === "string" && metadata.name.trim()) {
    return metadata.name.trim();
  }
  if (typeof metadata?.full_name === "string" && metadata.full_name.trim()) {
    return metadata.full_name.trim();
  }
  return null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function getOrCreateUserFromSession(supabaseUser: SupabaseUser) {
  const authSubject = supabaseUser.id;
  const rawEmail = supabaseUser.email?.trim();

  if (!rawEmail) {
    throw new Error("Supabase user is missing email");
  }

  const normalizedEmail = normalizeEmail(rawEmail);
  const name = displayNameFromMetadata(supabaseUser);
  const resolvedPlatformRole = platformRoleForEmail(normalizedEmail);

  const byAuthSubject = await prisma.user.findUnique({
    where: { authSubject },
  });

  if (byAuthSubject) {
    if ((!byAuthSubject.name && name) || (resolvedPlatformRole && byAuthSubject.platformRole !== resolvedPlatformRole)) {
      return prisma.user.update({
        where: { id: byAuthSubject.id },
        data: {
          ...(name && !byAuthSubject.name ? { name } : {}),
          ...(resolvedPlatformRole && byAuthSubject.platformRole !== resolvedPlatformRole
            ? { platformRole: resolvedPlatformRole }
            : {}),
        },
      });
    }
    return byAuthSubject;
  }

  const byEmail = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { email: rawEmail }],
    },
  });

  if (byEmail) {
    if (byEmail.authSubject && byEmail.authSubject !== authSubject) {
      throw new AuthUserLinkConflictError(
        `Email ${normalizedEmail} is already linked to a different auth account`,
      );
    }

    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        authSubject,
        ...(name && !byEmail.name ? { name } : {}),
        ...(resolvedPlatformRole && byEmail.platformRole !== resolvedPlatformRole
          ? { platformRole: resolvedPlatformRole }
          : {}),
      },
    });
  }

  try {
    return await prisma.user.create({
      data: {
        email: normalizedEmail,
        authSubject,
        name,
        platformRole: resolvedPlatformRole,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ authSubject }, { email: normalizedEmail }, { email: rawEmail }],
        },
      });
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}
