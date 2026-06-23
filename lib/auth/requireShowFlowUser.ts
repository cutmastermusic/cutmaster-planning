import type { User as SupabaseUser } from "@supabase/supabase-js";

import { getOrCreateUserFromSession } from "@/lib/auth/getOrCreateUserFromSession";
import { createClient } from "@/lib/supabase/server";

export class ShowFlowAuthRequiredError extends Error {
  constructor(message = "Sign in required.") {
    super(message);
    this.name = "ShowFlowAuthRequiredError";
  }
}

export type ShowFlowAuthenticatedUser = {
  supabaseUser: SupabaseUser;
  dbUser: Awaited<ReturnType<typeof getOrCreateUserFromSession>>;
};

export async function requireShowFlowUser(): Promise<ShowFlowAuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    throw new ShowFlowAuthRequiredError();
  }

  const dbUser = await getOrCreateUserFromSession(user);
  return { supabaseUser: user, dbUser };
}
