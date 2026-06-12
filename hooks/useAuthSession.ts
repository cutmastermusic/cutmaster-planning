"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAuthContext,
  signOut as signOutAction,
  type AuthContextResult,
} from "@/lib/actions/auth";

const INITIAL_STATE: AuthContextResult = {
  mode: "anonymous",
  authMode: "hybrid",
  supabaseConfigured: false,
  bypassEnabled: false,
  email: null,
  dbUser: null,
};

export function useAuthSession() {
  const [context, setContext] = useState<AuthContextResult>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const next = await getAuthContext();
    setContext(next);
    setLoaded(true);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthContext() {
      const next = await getAuthContext();
      if (cancelled) return;
      setContext(next);
      setLoaded(true);
    }

    void loadAuthContext();

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    await signOutAction();
    await refresh();
  }, [refresh]);

  return {
    ...context,
    loaded,
    refresh,
    signOut,
    isAuthenticated: context.mode === "supabase" && Boolean(context.email),
  };
}
