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
  readScope: "bypass",
  email: null,
  dbUser: null,
  platformRole: null,
  memberships: [],
  sessionIssue: null,
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

  const coupleMemberships = context.memberships.filter((membership) => membership.role === "COUPLE");
  const isCouplePortalSession =
    loaded &&
    context.mode === "supabase" &&
    context.readScope === "member" &&
    coupleMemberships.length > 0;
  const usesScopedEventReads =
    loaded && (context.readScope === "member" || context.readScope === "none");

  return {
    ...context,
    loaded,
    refresh,
    signOut,
    isAuthenticated: context.mode === "supabase" && Boolean(context.email),
    coupleMemberships,
    isCouplePortalSession,
    usesScopedEventReads,
  };
}
