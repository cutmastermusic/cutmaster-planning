import { NextResponse } from "next/server";

import { getSiteUrl, isSupabaseConfigured } from "@/lib/auth/authConfig";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.error("[auth/signout] signOut failed:", error);
  }

  return NextResponse.redirect(`${getSiteUrl()}/`, { status: 303 });
}

export async function GET() {
  return POST();
}
