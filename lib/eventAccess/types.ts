import type { AuthMode } from "@/lib/auth/authConfig";

export type AuthContextMode = "supabase" | "bypass" | "prototype" | "anonymous";

export type ReadScope = "all" | "member" | "none" | "bypass";

export type EventMembership = {
  eventId: string;
  role: string;
  status: string;
};

export type SessionAccessDbUser = {
  id: string;
  email: string;
  name: string | null;
  platformRole: string | null;
};

export type SessionAccessProfile = {
  mode: AuthContextMode;
  authMode: AuthMode;
  supabaseConfigured: boolean;
  bypassEnabled: boolean;
  readScope: ReadScope;
  email: string | null;
  dbUser: SessionAccessDbUser | null;
  platformRole: string | null;
  memberships: EventMembership[];
};
