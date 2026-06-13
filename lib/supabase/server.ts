import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/auth/authConfig";

function getSupabaseProjectEnv(): { url: string; anonKey: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseProjectEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Server Actions and some RSC contexts cannot set cookies.
          console.warn("[supabase/server] cookieStore.setAll skipped:", error);
        }
      },
    },
  });
}

/**
 * Route Handler client — writes auth cookies onto the outgoing NextResponse
 * (required for /auth/callback so the session survives redirect).
 */
export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const { url, anonKey } = getSupabaseProjectEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        if (cookiesToSet.length === 0) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        } catch (error) {
          console.error(
            "[supabase/route-handler] failed to write auth cookies onto response:",
            error,
          );
          throw error;
        }
      },
    },
  });
}
