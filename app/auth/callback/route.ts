import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/auth/authConfig";
import { getOrCreateUserFromSession } from "@/lib/auth/getOrCreateUserFromSession";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/";
  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(`${getSiteUrl()}/login?error=auth_callback_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await getOrCreateUserFromSession(user);
    } catch (syncError) {
      console.error("[auth/callback] user sync failed:", syncError);
      return NextResponse.redirect(`${getSiteUrl()}/login?error=auth_callback_failed`);
    }
  }

  return NextResponse.redirect(`${getSiteUrl()}${safeNext}`);
}
