import {
  getAuthMode,
  isAuthBypassEnabled,
  isSupabaseConfigured,
} from "@/lib/auth/authConfig";
import {
  AuthUserLinkConflictError,
  getOrCreateUserFromSession,
} from "@/lib/auth/getOrCreateUserFromSession";
import type { EventMembership, SessionAccessProfile } from "@/lib/eventAccess/types";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function loadActiveMemberships(
  dbUser: { id: string; email: string },
): Promise<EventMembership[]> {
  const rows = await prisma.eventMember.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ userId: dbUser.id }, { email: { equals: dbUser.email, mode: "insensitive" } }],
    },
    select: {
      eventId: true,
      role: true,
      status: true,
    },
  });

  return rows.map((row) => ({
    eventId: row.eventId,
    role: row.role,
    status: row.status,
  }));
}

export async function resolveSessionAccess(): Promise<SessionAccessProfile> {
  const authMode = getAuthMode();
  const supabaseConfigured = isSupabaseConfigured();
  const bypassEnabled = isAuthBypassEnabled();

  const base = {
    authMode,
    supabaseConfigured,
    bypassEnabled,
  };

  if (!supabaseConfigured || bypassEnabled || authMode === "prototype") {
    return {
      ...base,
      mode: bypassEnabled ? "bypass" : "prototype",
      readScope: "bypass",
      email: null,
      dbUser: null,
      platformRole: null,
      memberships: [],
      sessionIssue: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ...base,
      mode: "anonymous",
      readScope: "none",
      email: null,
      dbUser: null,
      platformRole: null,
      memberships: [],
      sessionIssue: null,
    };
  }

  let dbUser: SessionAccessProfile["dbUser"] = null;
  let memberships: EventMembership[] = [];

  try {
    const row = await getOrCreateUserFromSession(user);
    dbUser = {
      id: row.id,
      email: row.email,
      name: row.name,
      platformRole: row.platformRole,
    };

    if (row.platformRole === "ADMIN") {
      return {
        ...base,
        mode: "supabase",
        readScope: "all",
        email: user.email,
        dbUser,
        platformRole: row.platformRole,
        memberships: [],
        sessionIssue: null,
      };
    }

    memberships = await loadActiveMemberships(dbUser);
    return {
      ...base,
      mode: "supabase",
      readScope: "member",
      email: user.email,
      dbUser,
      platformRole: row.platformRole,
      memberships,
      sessionIssue: null,
    };
  } catch (error) {
    const sessionIssue =
      error instanceof AuthUserLinkConflictError ? "auth_link_conflict" : "user_sync_failed";

    if (error instanceof AuthUserLinkConflictError) {
      console.error("[resolveSessionAccess] auth link conflict:", error.message);
    } else {
      console.error("[resolveSessionAccess] user sync failed:", error);
    }

    return {
      ...base,
      mode: "supabase",
      readScope: "none",
      email: user.email,
      dbUser,
      platformRole: dbUser?.platformRole ?? null,
      memberships,
      sessionIssue,
    };
  }
}
