export type AuthMode = "hybrid" | "prototype" | "supabase";

if (process.env.NODE_ENV === "production" && process.env.AUTH_BYPASS === "true") {
  throw new Error("AUTH_BYPASS is not allowed in production");
}

export function getAuthMode(): AuthMode {
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE?.trim().toLowerCase();
  if (mode === "supabase" || mode === "prototype" || mode === "hybrid") {
    return mode;
  }
  return "hybrid";
}

export function isAuthBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS === "true";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(nextPath = "/"): string {
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function showPrototypeLogin(): boolean {
  const mode = getAuthMode();
  return mode === "hybrid" || mode === "prototype" || isAuthBypassEnabled();
}

export function showSupabaseLogin(): boolean {
  if (!isSupabaseConfigured()) return false;
  const mode = getAuthMode();
  return mode === "hybrid" || mode === "supabase";
}
