import { NextRequest, NextResponse } from "next/server";

import { resolveRequestSiteOrigin } from "@/lib/auth/authConfig";
import { getOrCreateUserFromSession } from "@/lib/auth/getOrCreateUserFromSession";
import { createRouteHandlerClient } from "@/lib/supabase/server";

function sanitizeNextPath(next: string | null): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  return trimmed;
}

function loginErrorRedirect(origin: string): string {
  return `${origin}/login?error=auth_callback_failed`;
}

function countSupabaseAuthCookies(response: NextResponse): number {
  return response.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("-auth-token"))
    .length;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const safeNext = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const origin = resolveRequestSiteOrigin(request);

  if (!code) {
    console.error("[auth/callback] missing OAuth code query param");
    return NextResponse.redirect(loginErrorRedirect(origin));
  }

  const successRedirectUrl = `${origin}${safeNext}`;
  const response = NextResponse.redirect(successRedirectUrl);
  const supabase = createRouteHandlerClient(request, response);

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError.message);
    return NextResponse.redirect(loginErrorRedirect(origin));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[auth/callback] getUser after exchange failed:", userError.message);
    return NextResponse.redirect(loginErrorRedirect(origin));
  }

  if (!user?.email) {
    console.error("[auth/callback] exchange succeeded but session user email is missing");
    return NextResponse.redirect(loginErrorRedirect(origin));
  }

  const authCookieCount = countSupabaseAuthCookies(response);
  if (authCookieCount === 0) {
    console.error(
      "[auth/callback] session exchange completed but no Supabase auth cookies were written to redirect response",
    );
  }

  try {
    await getOrCreateUserFromSession(user);
  } catch (syncError) {
    console.error("[auth/callback] user sync failed:", syncError);
    return NextResponse.redirect(loginErrorRedirect(origin));
  }

  return response;
}
