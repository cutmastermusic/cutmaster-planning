"use server";

import {
  getAuthMode,
  isAuthBypassEnabled,
  isSupabaseConfigured,
  type AuthMode,
} from "@/lib/auth/authConfig";
import {
  AuthUserLinkConflictError,
  getOrCreateUserFromSession,
} from "@/lib/auth/getOrCreateUserFromSession";
import { createClient } from "@/lib/supabase/server";

export type AuthContextMode = "supabase" | "bypass" | "prototype" | "anonymous";

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
  email: string | null;
  dbUser: AuthContextDbUser | null;
};

export async function getAuthContext(): Promise<AuthContextResult> {
  const authMode = getAuthMode();
  const supabaseConfigured = isSupabaseConfigured();
  const bypassEnabled = isAuthBypassEnabled();

  const base = {
    authMode,
    supabaseConfigured,
    bypassEnabled,
  };

  if (!supabaseConfigured) {
    return {
      ...base,
      mode: bypassEnabled ? "bypass" : "prototype",
      email: null,
      dbUser: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ...base,
      mode: bypassEnabled
        ? "bypass"
        : authMode === "prototype"
          ? "prototype"
          : "anonymous",
      email: null,
      dbUser: null,
    };
  }

  let dbUser: AuthContextDbUser | null = null;

  try {
    const row = await getOrCreateUserFromSession(user);
    dbUser = {
      id: row.id,
      email: row.email,
      name: row.name,
      platformRole: row.platformRole,
    };
  } catch (error) {
    if (error instanceof AuthUserLinkConflictError) {
      console.error("[getAuthContext] auth link conflict:", error.message);
    } else {
      console.error("[getAuthContext] user sync failed:", error);
    }
  }

  return {
    ...base,
    mode: bypassEnabled ? "bypass" : "supabase",
    email: user.email,
    dbUser,
  };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
}
