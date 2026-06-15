import { createClient } from "@supabase/supabase-js";

export function getSupabaseServiceRoleConfigIssues(): string[] {
  const issues: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return issues;
}

export function describeSupabaseServiceRoleConfigError(): string {
  const issues = getSupabaseServiceRoleConfigIssues();
  if (issues.length === 0) {
    return "Supabase service role is not configured.";
  }
  return (
    `Cover photo storage is not configured: ${issues.join("; ")}. ` +
    "Set the missing variable(s) in Vercel → Project → Settings → Environment Variables (Production), then redeploy."
  );
}

export function isSupabaseServiceRoleConfigured(): boolean {
  return getSupabaseServiceRoleConfigIssues().length === 0;
}

export function createServiceRoleClient() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error(describeSupabaseServiceRoleConfigError());
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
