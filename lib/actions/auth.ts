"use server";

import type { AuthContextMode, EventMembership, ReadScope, SessionIssue } from "@/lib/eventAccess/types";
import { resolveSessionAccess } from "@/lib/eventAccess/resolveSessionAccess";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, type AuthMode } from "@/lib/auth/authConfig";

export type AuthContextDbUser = {
  id: string;
  email: string;
  name: string | null;
  platformRole: string | null;
};

export type AuthContextResult = {
  mode: AuthContextMode;
  authMode: AuthMode;
  supabaseConfigured: boolean;
  bypassEnabled: boolean;
  readScope: ReadScope;
  email: string | null;
  dbUser: AuthContextDbUser | null;
  platformRole: string | null;
  memberships: EventMembership[];
  sessionIssue: SessionIssue | null;
};

export async function getAuthContext(): Promise<AuthContextResult> {
  const access = await resolveSessionAccess();
  return {
    mode: access.mode,
    authMode: access.authMode,
    supabaseConfigured: access.supabaseConfigured,
    bypassEnabled: access.bypassEnabled,
    readScope: access.readScope,
    email: access.email,
    dbUser: access.dbUser,
    platformRole: access.platformRole,
    memberships: access.memberships,
    sessionIssue: access.sessionIssue,
  };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
}
