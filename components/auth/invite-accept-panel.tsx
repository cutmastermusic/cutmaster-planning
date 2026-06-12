"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PremiumCard, PrimaryButton, SectionTitle } from "@/components/planning-ui";
import { getAuthContext, signOut } from "@/lib/actions/auth";
import {
  acceptEventInvite,
  getInviteAcceptPreview,
  type InviteAcceptPreview,
} from "@/lib/actions/eventInvites";
import { isEventAccessError } from "@/lib/eventAccess/errors";

type InviteAcceptPanelProps = {
  token: string;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "invalid"; message: string }
  | { kind: "ready"; preview: InviteAcceptPreview };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function formatExpiryDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

function buildLoginHref(token: string, invitedEmail: string): string {
  const nextPath = `/invite/accept?token=${encodeURIComponent(token)}`;
  const params = new URLSearchParams({
    next: nextPath,
    email: invitedEmail,
  });
  return `/login?${params.toString()}`;
}

export function InviteAcceptPanel({ token }: InviteAcceptPanelProps) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const refreshAuth = useCallback(async () => {
    const context = await getAuthContext();
    setSessionEmail(context.mode === "supabase" && context.email ? context.email : null);
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    window.setTimeout(() => {
      void (async () => {
        if (!token.trim()) {
          if (!cancelled) {
            setLoadState({
              kind: "invalid",
              message: "This invite link is missing a token. Ask your planner for a new link.",
            });
          }
          return;
        }

        try {
          const preview = await getInviteAcceptPreview(token);
          if (!cancelled) {
            setLoadState({ kind: "ready", preview });
          }
        } catch (error) {
          if (!cancelled) {
            setLoadState({
              kind: "invalid",
              message: isEventAccessError(error)
                ? error.message
                : "This invite link is invalid or has expired.",
            });
          }
        }
      })();

      void (async () => {
        const context = await getAuthContext();
        if (cancelled) return;
        setSessionEmail(context.mode === "supabase" && context.email ? context.email : null);
        setAuthLoaded(true);
      })();
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);

    try {
      await acceptEventInvite(token);
      window.location.href = "/";
    } catch (error) {
      setAcceptError(
        isEventAccessError(error)
          ? error.message
          : "Could not accept this invitation. Try again or contact your planner.",
      );
      setAccepting(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      await refreshAuth();
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  if (loadState.kind === "loading" || !authLoaded) {
    return (
      <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
        <PremiumCard variant="accent">
          <SectionTitle>Loading invitation…</SectionTitle>
          <p className="mt-2 text-xs text-stone-600">Checking your invite link.</p>
        </PremiumCard>
      </section>
    );
  }

  if (loadState.kind === "invalid") {
    return (
      <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
        <PremiumCard variant="accent">
          <SectionTitle>Invitation unavailable</SectionTitle>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">{loadState.message}</p>
          <PrimaryButton
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className="mt-4 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50"
          >
            Go to sign in
          </PrimaryButton>
        </PremiumCard>
      </section>
    );
  }

  const { preview } = loadState;
  const invitedEmail = preview.invitedEmail;
  const isAuthenticated = Boolean(sessionEmail);
  const emailMatches =
    isAuthenticated && normalizeEmail(sessionEmail!) === normalizeEmail(invitedEmail);

  return (
    <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
      <PremiumCard variant="accent">
        <SectionTitle>You&apos;re invited to plan your celebration</SectionTitle>
        <div className="mt-3 space-y-2 text-xs text-stone-600">
          <p>
            <span className="font-semibold text-stone-900">Event: </span>
            {preview.eventTitle}
          </p>
          <p>
            <span className="font-semibold text-stone-900">Invited email: </span>
            {invitedEmail}
          </p>
          <p>
            <span className="font-semibold text-stone-900">Expires: </span>
            {formatExpiryDate(preview.expiresAt)}
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs leading-relaxed text-stone-600">
              Sign in with the email above to accept this invitation and open your planning portal.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => {
                window.location.href = buildLoginHref(token, invitedEmail);
              }}
              className="w-full rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-black shadow-none hover:brightness-[0.97]"
            >
              Continue with invited email
            </PrimaryButton>
          </div>
        ) : emailMatches ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-stone-600">
              Signed in as <span className="font-semibold text-stone-900">{sessionEmail}</span>
            </p>
            {acceptError ? <p className="text-xs text-red-700">{acceptError}</p> : null}
            <PrimaryButton
              type="button"
              onClick={() => {
                void handleAccept();
              }}
              disabled={accepting}
              className="w-full rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-black shadow-none hover:brightness-[0.97] disabled:opacity-60"
            >
              {accepting ? "Accepting…" : "Accept invitation"}
            </PrimaryButton>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950">
              <p>
                <span className="font-semibold">This invitation was sent to:</span>
                <br />
                {invitedEmail}
              </p>
              <p className="mt-2">
                <span className="font-semibold">You are currently signed in as:</span>
                <br />
                {sessionEmail}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-stone-600">
              Sign out and open this link again using the invited email address to accept.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              disabled={signingOut}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50 disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </PrimaryButton>
            <p className="text-xs text-stone-600">
              After signing out,{" "}
              <Link
                href={buildLoginHref(token, invitedEmail)}
                className="font-semibold text-stone-950 underline underline-offset-2"
              >
                continue with {invitedEmail}
              </Link>
              .
            </p>
          </div>
        )}
      </PremiumCard>
    </section>
  );
}
