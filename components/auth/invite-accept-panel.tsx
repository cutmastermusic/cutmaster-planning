"use client";

import { useCallback, useEffect, useState } from "react";

import { PremiumCard, PrimaryButton, SectionTitle } from "@/components/planning-ui";
import { getAuthContext, signOut } from "@/lib/actions/auth";
import {
  acceptEventInvite,
  resolveInviteAcceptPreview,
  type InviteAcceptPreview,
} from "@/lib/actions/eventInvites";
import { isEventAccessError } from "@/lib/eventAccess/errors";
import {
  getInviteUnavailableCopy,
  type InviteUnavailableReason,
} from "@/lib/invites/inviteAcceptMessages";

type InviteAcceptPanelProps = {
  token: string;
};

type LoadState =
  | { kind: "loading" }
  | {
      kind: "unavailable";
      reason: InviteUnavailableReason;
      eventTitle?: string | null;
      invitedEmail?: string | null;
    }
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

function buildPlannerLoginHref(invitedEmail?: string | null): string {
  const params = new URLSearchParams({ next: "/" });
  if (invitedEmail?.trim()) {
    params.set("email", invitedEmail.trim());
  }
  return `/login?${params.toString()}`;
}

function InviteUnavailableState({
  reason,
  eventTitle,
}: {
  reason: InviteUnavailableReason;
  eventTitle?: string | null;
}) {
  const copy = getInviteUnavailableCopy(reason, { eventTitle });

  return (
    <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
      <PremiumCard variant="accent">
        <SectionTitle>{copy.title}</SectionTitle>
        <p className="mt-2 text-xs leading-relaxed text-stone-600">{copy.message}</p>
        <div className="mt-4 space-y-2">
          <PrimaryButton
            type="button"
            onClick={() => {
              window.location.href = copy.primaryCta.href;
            }}
            className="w-full rounded-xl border border-[#1f2724] bg-[#1f2724] px-3 py-2.5 text-xs font-semibold text-white shadow-none hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2"
          >
            {copy.primaryCta.label}
          </PrimaryButton>
          {copy.secondaryCta ? (
            <PrimaryButton
              type="button"
              onClick={() => {
                window.location.href = copy.secondaryCta!.href;
              }}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50"
            >
              {copy.secondaryCta.label}
            </PrimaryButton>
          ) : null}
        </div>
      </PremiumCard>
    </section>
  );
}

export function InviteAcceptPanel({ token }: InviteAcceptPanelProps) {
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
            setLoadState({ kind: "unavailable", reason: "invalid" });
          }
          return;
        }

        const result = await resolveInviteAcceptPreview(token);
        if (cancelled) return;

        if (result.status === "unavailable") {
          setLoadState({
            kind: "unavailable",
            reason: result.reason,
            eventTitle: result.eventTitle,
            invitedEmail: result.invitedEmail,
          });
          return;
        }

        setLoadState({ kind: "ready", preview: result.preview });
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

  const handleSignOutAndContinue = async (invitedEmail: string) => {
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = buildLoginHref(token, invitedEmail);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      await refreshAuth();
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    if (!authLoaded || loadState.kind !== "unavailable" || loadState.reason !== "already_accepted") {
      return;
    }

    window.location.replace(
      sessionEmail ? "/" : buildPlannerLoginHref(loadState.invitedEmail),
    );
  }, [authLoaded, loadState, sessionEmail]);

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

  if (loadState.kind === "unavailable") {
    if (loadState.reason === "already_accepted") {
      return (
        <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
          <PremiumCard variant="accent">
            <SectionTitle>Opening your ShowFlow planner…</SectionTitle>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              This invite has already been accepted. We&apos;re taking you to the right place.
            </p>
          </PremiumCard>
        </section>
      );
    }

    return (
      <InviteUnavailableState reason={loadState.reason} eventTitle={loadState.eventTitle} />
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
        <SectionTitle>Your ShowFlow planner is ready</SectionTitle>
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
              Continue with <span className="font-semibold text-stone-900">{invitedEmail}</span>.
              We&apos;ll email a secure access link so only the invited email can open this planner.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => {
                window.location.href = buildLoginHref(token, invitedEmail);
              }}
              className="w-full rounded-xl border border-[#1f2724] bg-[#1f2724] px-3 py-2.5 text-xs font-semibold text-white shadow-none hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2"
            >
              Continue to your planner
            </PrimaryButton>
          </div>
        ) : emailMatches ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-950">
              <p className="font-semibold">Signed in with the invited email</p>
              <p className="mt-1">{sessionEmail}</p>
            </div>
            {acceptError ? <p className="text-xs text-red-700">{acceptError}</p> : null}
            <PrimaryButton
              type="button"
              onClick={() => {
                void handleAccept();
              }}
              disabled={accepting}
              className="w-full rounded-xl border border-[#1f2724] bg-[#1f2724] px-3 py-2.5 text-xs font-semibold text-white shadow-none hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {accepting ? "Opening planner…" : "Open my ShowFlow planner"}
            </PrimaryButton>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold text-stone-900">
              This invitation must be accepted with the invited email address.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-950">
              <p>
                <span className="font-semibold uppercase tracking-[0.08em] text-amber-900">
                  Invited email
                </span>
              </p>
              <p className="mt-1 font-semibold text-stone-900">{invitedEmail}</p>
              <p className="mt-3">
                <span className="font-semibold uppercase tracking-[0.08em] text-amber-900">
                  Signed in as
                </span>
              </p>
              <p className="mt-1 font-semibold text-stone-900">{sessionEmail}</p>
            </div>
            <p className="text-xs leading-relaxed text-stone-600">
              We&apos;ll send the secure access link to the invited email so this planner stays private.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => {
                void handleSignOutAndContinue(invitedEmail);
              }}
              disabled={signingOut}
              className="w-full rounded-xl border border-[#1f2724] bg-[#1f2724] px-3 py-2.5 text-xs font-semibold text-white shadow-none hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {signingOut ? "Preparing access link…" : `Continue with ${invitedEmail}`}
            </PrimaryButton>
            <PrimaryButton
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              disabled={signingOut}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50 disabled:opacity-60"
            >
              Sign out only
            </PrimaryButton>
          </div>
        )}
      </PremiumCard>
    </section>
  );
}
