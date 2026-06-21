"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  PremiumCard,
  PrimaryButton,
  SectionTitle,
  TextInput,
  couplePortalPrimaryButtonClass,
  couplePortalSecondaryButtonClass,
  couplePortalTertiaryButtonClass,
} from "@/components/planning-ui";
import {
  createEventInvite,
  getEventInviteUrl,
  listEventInvites,
  removeEventMemberPortalAccess,
  resendEventInvite,
  revokeEventInvite,
  type EventInviteListItem,
  type EventInviteListState,
} from "@/lib/actions/eventInvites";
import { formatInviteExpiryDate } from "@/lib/email/formatInviteExpiry";
import type { InviteEmailDeliveryResult } from "@/lib/email/types";
import { isEventAccessError } from "@/lib/eventAccess/errors";

type EventInviteAdminSectionProps = {
  eventId: string;
  canInvite: boolean;
  modalOpen: boolean;
  onModalOpenChange: (open: boolean) => void;
  buttonVariant?: "default" | "couple";
};

type CreateInviteSuccess = {
  inviteUrl: string;
  expiresAt: Date;
  recipientEmail: string;
  emailDelivery: InviteEmailDeliveryResult;
};

type RowFeedbackTone = "success" | "error" | "warning";

type RowFeedback = {
  tone: RowFeedbackTone;
  message: string;
};

function inviteStateLabel(state: EventInviteListState): string {
  switch (state) {
    case "pending":
      return "Pending";
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    case "accepted":
      return "Accepted";
    default:
      return state;
  }
}

function inviteStateBadgeClass(state: EventInviteListState): string {
  switch (state) {
    case "active":
      return "border-emerald-300 bg-emerald-50 text-emerald-950";
    case "pending":
      return "border-violet-300 bg-violet-50 text-violet-950";
    case "expired":
      return "border-stone-300 bg-stone-100 text-stone-700";
    case "revoked":
      return "border-rose-300 bg-rose-50 text-rose-950";
    case "accepted":
      return "border-sky-300 bg-sky-50 text-sky-950";
    default:
      return "border-stone-300 bg-stone-100 text-stone-700";
  }
}

function coupleInviteStateBadgeClass(state: EventInviteListState): string {
  switch (state) {
    case "active":
    case "accepted":
      return "border-[#2f4a3e]/30 bg-[#2f4a3e]/10 text-[#2f4a3e]";
    case "pending":
      return "border-stone-300 bg-stone-50 text-stone-700";
    case "expired":
      return "border-stone-300 bg-stone-100 text-stone-700";
    case "revoked":
      return "border-rose-300 bg-rose-50 text-rose-950";
    default:
      return "border-stone-300 bg-stone-100 text-stone-700";
  }
}

function emailDeliveryMessage(
  delivery: InviteEmailDeliveryResult,
  recipientEmail: string,
): {
  tone: "success" | "warning";
  title: string;
  body: string;
} {
  if (delivery.status === "sent") {
    return {
      tone: "success",
      title: "Invite created",
      body: `Planning Portal access email sent to ${recipientEmail}. You can also copy the secure link below as a backup.`,
    };
  }

  if (delivery.status === "skipped") {
    return {
      tone: "warning",
      title: "Invite created",
      body: "Email delivery is not configured in this environment. Copy the secure link below and send it to the recipient.",
    };
  }

  return {
    tone: "warning",
    title: "Invite created — email not delivered",
    body: `The invite was saved, but the email could not be sent (${delivery.error}). Copy the secure link below and send it manually.`,
  };
}

function resendDeliveryFeedback(delivery: InviteEmailDeliveryResult, email: string): RowFeedback {
  if (delivery.status === "sent") {
    return { tone: "success", message: `Invite email resent to ${email}.` };
  }
  if (delivery.status === "skipped") {
    return {
      tone: "warning",
      message: "Email delivery is not configured. Copy the invite link and send it manually.",
    };
  }
  return {
    tone: "error",
    message: `Could not resend email (${delivery.error}). Copy the link and send it manually.`,
  };
}

function actionErrorMessage(error: unknown, fallback: string): string {
  return isEventAccessError(error) ? error.message : fallback;
}

const secondaryActionButtonClass =
  "rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60";

const dangerActionButtonClass =
  "rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-950 shadow-sm hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60";

function InvitePersonCard({
  row,
  feedback,
  children,
  buttonVariant = "default",
}: {
  row: EventInviteListItem;
  feedback?: RowFeedback | null;
  children?: ReactNode;
  buttonVariant?: "default" | "couple";
}) {
  return (
    <PremiumCard className="border-stone-200 bg-white p-4 shadow-sm ring-1 ring-stone-200/80 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-snug text-stone-950 [overflow-wrap:anywhere]">
            {row.displayName || row.email}
          </p>
          {row.displayName ? (
            <p className="mt-1 text-sm leading-snug text-stone-700 [overflow-wrap:anywhere]">
              {row.email}
            </p>
          ) : null}
          <p className="mt-2 text-[13px] leading-relaxed text-stone-600">
            {row.inviteState === "active" && row.memberAcceptedAt
              ? `Active since ${formatInviteExpiryDate(row.memberAcceptedAt)}`
              : `Expires ${formatInviteExpiryDate(row.expiresAt)}`}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            buttonVariant === "couple"
              ? coupleInviteStateBadgeClass(row.inviteState)
              : inviteStateBadgeClass(row.inviteState)
          }`}
        >
          {inviteStateLabel(row.inviteState)}
        </span>
      </div>
      {feedback ? (
        <p
          className={`mt-3 text-xs leading-relaxed ${
            feedback.tone === "success"
              ? "text-emerald-900"
              : feedback.tone === "warning"
                ? "text-amber-900"
                : "text-rose-900"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}
      {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
    </PremiumCard>
  );
}

export function EventInviteAdminSection({
  eventId,
  canInvite,
  modalOpen,
  onModalOpenChange,
  buttonVariant = "default",
}: EventInviteAdminSectionProps) {
  const [invites, setInvites] = useState<EventInviteListItem[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<CreateInviteSuccess | null>(null);
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "error">("");
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});
  const inviteSecondaryActionButtonClass =
    buttonVariant === "couple"
      ? `px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 ${couplePortalSecondaryButtonClass}`
      : secondaryActionButtonClass;
  const invitePrimaryActionButtonClass =
    buttonVariant === "couple"
      ? `w-full px-3 py-2.5 text-xs disabled:opacity-60 ${couplePortalPrimaryButtonClass}`
      : "w-full rounded-xl border border-[#1f2724] bg-[#1f2724] px-3 py-2.5 text-xs font-semibold text-white shadow-none hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2 disabled:opacity-60";

  useEffect(() => {
    let cancelled = false;

    window.setTimeout(() => {
      void (async () => {
        setLoadingInvites(true);
        try {
          const rows = await listEventInvites(eventId);
          if (!cancelled) {
            setInvites(rows);
          }
        } catch (error) {
          console.error("[EventInviteAdminSection] listEventInvites failed:", error);
          if (!cancelled) {
            setInvites([]);
          }
        } finally {
          if (!cancelled) {
            setLoadingInvites(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const reloadInvites = useCallback(async () => {
    setLoadingInvites(true);
    try {
      const rows = await listEventInvites(eventId);
      setInvites(rows);
    } catch (error) {
      console.error("[EventInviteAdminSection] listEventInvites failed:", error);
      setInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  }, [eventId]);

  const activeInvites = useMemo(() => {
    const seen = new Set<string>();
    return invites.filter((row) => {
      if (row.inviteState !== "active") return false;
      if (seen.has(row.eventMemberId)) return false;
      seen.add(row.eventMemberId);
      return true;
    });
  }, [invites]);

  const pendingInvites = useMemo(
    () => invites.filter((row) => row.inviteState === "pending"),
    [invites],
  );

  const inactiveInvites = useMemo(
    () =>
      invites.filter(
        (row) =>
          row.inviteState !== "active" &&
          row.inviteState !== "pending",
      ),
    [invites],
  );

  const activeCount = activeInvites.length;
  const pendingCount = pendingInvites.length;

  const resetModalFields = () => {
    setInviteEmail("");
    setInviteDisplayName("");
    setCreateError(null);
    setCreateSuccess(null);
    setCopyStatus("");
  };

  const handleCloseModal = () => {
    onModalOpenChange(false);
    resetModalFields();
  };

  const setFeedback = (key: string, feedback: RowFeedback | null) => {
    setRowFeedback((prev) => {
      if (!feedback) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: feedback };
    });
  };

  const setBusy = (key: string, busy: boolean) => {
    setRowBusy((prev) => ({ ...prev, [key]: busy }));
  };

  const handleCreateInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      setCreateError("Enter the recipient's email address.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    setCopyStatus("");

    try {
      const result = await createEventInvite(eventId, {
        email,
        displayName: inviteDisplayName.trim() || null,
      });
      setCreateSuccess({
        inviteUrl: result.inviteUrl,
        expiresAt: result.expiresAt,
        recipientEmail: email,
        emailDelivery: result.emailDelivery,
      });
      await reloadInvites();
    } catch (error) {
      setCreateError(
        actionErrorMessage(error, "Could not create the invite. Try again."),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus(""), 2200);
    }
  };

  const handleCopyPendingLink = async (row: EventInviteListItem) => {
    const key = `copy:${row.inviteId}`;
    setBusy(key, true);
    setFeedback(key, null);

    try {
      const { inviteUrl } = await getEventInviteUrl(eventId, row.inviteId);
      await navigator.clipboard.writeText(inviteUrl);
      setFeedback(key, { tone: "success", message: "Invite link copied to clipboard." });
    } catch (error) {
      setFeedback(key, {
        tone: "error",
        message: actionErrorMessage(error, "Could not copy the invite link."),
      });
    } finally {
      setBusy(key, false);
    }
  };

  const handleResendInvite = async (row: EventInviteListItem) => {
    const key = `resend:${row.inviteId}`;
    setBusy(key, true);
    setFeedback(key, null);

    try {
      const result = await resendEventInvite(eventId, row.inviteId);
      setFeedback(key, resendDeliveryFeedback(result.emailDelivery, row.email));
    } catch (error) {
      setFeedback(key, {
        tone: "error",
        message: actionErrorMessage(error, "Could not resend the invite."),
      });
    } finally {
      setBusy(key, false);
    }
  };

  const handleRevokeInvite = async (row: EventInviteListItem) => {
    const label = row.displayName || row.email;
    const confirmed = window.confirm(
      `Revoke the pending invite for ${label}? The invite link will stop working immediately.`,
    );
    if (!confirmed) return;

    const key = `revoke:${row.inviteId}`;
    setBusy(key, true);
    setFeedback(key, null);

    try {
      await revokeEventInvite(eventId, row.inviteId);
      setFeedback(key, { tone: "success", message: "Invite revoked." });
      await reloadInvites();
    } catch (error) {
      setFeedback(key, {
        tone: "error",
        message: actionErrorMessage(error, "Could not revoke the invite."),
      });
    } finally {
      setBusy(key, false);
    }
  };

  const handleRemoveAccess = async (row: EventInviteListItem) => {
    const label = row.displayName || row.email;
    const confirmed = window.confirm(
      `Remove Planning Portal access for ${label}? They will lose access to this event only.`,
    );
    if (!confirmed) return;

    const key = `remove:${row.eventMemberId}`;
    setBusy(key, true);
    setFeedback(key, null);

    try {
      await removeEventMemberPortalAccess(eventId, row.eventMemberId);
      setFeedback(key, { tone: "success", message: "Portal access removed." });
      await reloadInvites();
    } catch (error) {
      setFeedback(key, {
        tone: "error",
        message: actionErrorMessage(error, "Could not remove portal access."),
      });
    } finally {
      setBusy(key, false);
    }
  };

  const successMessage = createSuccess
    ? emailDeliveryMessage(createSuccess.emailDelivery, createSuccess.recipientEmail)
    : null;

  return (
    <>
      <PremiumCard variant={buttonVariant === "couple" ? "default" : "accent"}>
        <SectionTitle>Planning Portal access</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Invite collaborators to sign in and work in the Planning Portal for this event. An email
          is sent automatically when you create an invite; you can also copy the secure link as a
          backup.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-stone-200 bg-stone-50/95 px-3 py-2.5 text-stone-700">
            Active:{" "}
            <span className="font-semibold tabular-nums text-stone-950">{activeCount}</span>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/95 px-3 py-2.5 text-stone-700">
            Pending invite:{" "}
            <span className="font-semibold tabular-nums text-stone-950">{pendingCount}</span>
          </div>
        </div>
        {canInvite ? (
          <div className="mt-3">
            <PrimaryButton
              type="button"
              onClick={() => {
                resetModalFields();
                onModalOpenChange(true);
              }}
              className={
                buttonVariant === "couple"
                  ? `w-full px-3 py-2.5 text-xs sm:w-auto ${couplePortalSecondaryButtonClass}`
                  : "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:w-auto"
              }
            >
              Send portal invite
            </PrimaryButton>
          </div>
        ) : null}
      </PremiumCard>

      {loadingInvites ? (
        <PremiumCard className="border-stone-200 bg-white p-4 shadow-sm ring-1 ring-stone-200/80 sm:p-5">
          <p className="text-xs text-stone-600">Loading invitations…</p>
        </PremiumCard>
      ) : invites.length === 0 ? (
        <PremiumCard className="border-stone-200 bg-white p-4 shadow-sm ring-1 ring-stone-200/80 sm:p-5">
          <p className="text-xs text-stone-600">No portal invitations yet.</p>
        </PremiumCard>
      ) : (
        <div className="space-y-4">
          {activeInvites.length > 0 ? (
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Active portal users
              </p>
              {activeInvites.map((row) => {
                const feedbackKey = `remove:${row.eventMemberId}`;
                return (
                  <InvitePersonCard
                    key={row.eventMemberId}
                    row={row}
                    feedback={rowFeedback[feedbackKey] ?? null}
                    buttonVariant={buttonVariant}
                  >
                    {canInvite ? (
                      <PrimaryButton
                        type="button"
                        disabled={Boolean(rowBusy[feedbackKey])}
                        onClick={() => {
                          void handleRemoveAccess(row);
                        }}
                        className={dangerActionButtonClass}
                      >
                        {rowBusy[feedbackKey] ? "Removing…" : "Remove access"}
                      </PrimaryButton>
                    ) : null}
                  </InvitePersonCard>
                );
              })}
            </div>
          ) : null}

          {pendingInvites.length > 0 ? (
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Pending invites
              </p>
              {pendingInvites.map((row) => {
                const copyKey = `copy:${row.inviteId}`;
                const resendKey = `resend:${row.inviteId}`;
                const revokeKey = `revoke:${row.inviteId}`;
                const feedback =
                  rowFeedback[copyKey] ??
                  rowFeedback[resendKey] ??
                  rowFeedback[revokeKey] ??
                  null;

                return (
                  <InvitePersonCard
                    key={row.inviteId}
                    row={row}
                    feedback={feedback}
                    buttonVariant={buttonVariant}
                  >
                    {canInvite ? (
                      <>
                        <PrimaryButton
                          type="button"
                          disabled={!row.hasRetrievableLink || Boolean(rowBusy[copyKey])}
                          onClick={() => {
                            void handleCopyPendingLink(row);
                          }}
                          className={inviteSecondaryActionButtonClass}
                        >
                          {rowBusy[copyKey] ? "Copying…" : "Copy link"}
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          disabled={!row.hasRetrievableLink || Boolean(rowBusy[resendKey])}
                          onClick={() => {
                            void handleResendInvite(row);
                          }}
                          className={inviteSecondaryActionButtonClass}
                        >
                          {rowBusy[resendKey] ? "Resending…" : "Resend"}
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          disabled={Boolean(rowBusy[revokeKey])}
                          onClick={() => {
                            void handleRevokeInvite(row);
                          }}
                          className={dangerActionButtonClass}
                        >
                          {rowBusy[revokeKey] ? "Revoking…" : "Revoke"}
                        </PrimaryButton>
                      </>
                    ) : null}
                  </InvitePersonCard>
                );
              })}
            </div>
          ) : null}

          {inactiveInvites.length > 0 ? (
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Past invitations
              </p>
              {inactiveInvites.map((row) => (
                <InvitePersonCard key={row.inviteId} row={row} buttonVariant={buttonVariant} />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">Planning Portal access</SectionTitle>
              <PrimaryButton
                type="button"
                onClick={handleCloseModal}
                className={
                  buttonVariant === "couple"
                    ? `px-3 py-2 text-xs ${couplePortalTertiaryButtonClass}`
                    : "rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
                }
              >
                Close
              </PrimaryButton>
            </div>

            {createSuccess && successMessage ? (
              <div className="mt-4 space-y-3">
                <p
                  className={`text-xs font-semibold ${
                    successMessage.tone === "success" ? "text-emerald-900" : "text-amber-900"
                  }`}
                >
                  {successMessage.title}
                </p>
                <p className="text-xs text-stone-600">{successMessage.body}</p>
                <p className="text-xs text-stone-600">
                  Expires {formatInviteExpiryDate(createSuccess.expiresAt)}.
                </p>
                <p className="break-all rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] text-stone-700">
                  {createSuccess.inviteUrl}
                </p>
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    void handleCopyUrl(createSuccess.inviteUrl);
                  }}
                  className={invitePrimaryActionButtonClass}
                >
                  {copyStatus === "copied"
                    ? "Copied!"
                    : copyStatus === "error"
                      ? "Copy failed — select link above"
                      : "Copy invite link"}
                </PrimaryButton>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <TextInput
                  id="real-invite-email"
                  label="Email"
                  value={inviteEmail}
                  onChange={setInviteEmail}
                  placeholder="name@example.com"
                />
                <TextInput
                  id="real-invite-name"
                  label="Display name (optional)"
                  value={inviteDisplayName}
                  onChange={setInviteDisplayName}
                  placeholder="Jamie Rivera"
                />
                {createError ? <p className="text-xs text-red-700">{createError}</p> : null}
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    void handleCreateInvite();
                  }}
                  disabled={creating}
                  className={invitePrimaryActionButtonClass}
                >
                  {creating ? "Creating…" : "Create invite"}
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
