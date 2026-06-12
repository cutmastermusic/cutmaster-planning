"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PremiumCard, PrimaryButton, SectionTitle, TextInput } from "@/components/planning-ui";
import {
  createEventInvite,
  listEventInvites,
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
};

type CreateInviteSuccess = {
  inviteUrl: string;
  expiresAt: Date;
  recipientEmail: string;
  emailDelivery: InviteEmailDeliveryResult;
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

function emailDeliveryMessage(delivery: InviteEmailDeliveryResult, recipientEmail: string): {
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

export function EventInviteAdminSection({
  eventId,
  canInvite,
  modalOpen,
  onModalOpenChange,
}: EventInviteAdminSectionProps) {
  const [invites, setInvites] = useState<EventInviteListItem[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<CreateInviteSuccess | null>(null);
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "error">("");

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

  const activeCount = useMemo(
    () => invites.filter((row) => row.inviteState === "active").length,
    [invites],
  );
  const pendingCount = useMemo(
    () => invites.filter((row) => row.inviteState === "pending").length,
    [invites],
  );

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
        isEventAccessError(error)
          ? error.message
          : "Could not create the invite. Try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createSuccess?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(createSuccess.inviteUrl);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus(""), 2200);
    }
  };

  const successMessage = createSuccess
    ? emailDeliveryMessage(createSuccess.emailDelivery, createSuccess.recipientEmail)
    : null;

  return (
    <>
      <PremiumCard variant="accent">
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
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:w-auto"
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
        invites.map((row) => (
          <PremiumCard
            key={row.inviteId}
            className="border-stone-200 bg-white p-4 shadow-sm ring-1 ring-stone-200/80 sm:p-5"
          >
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
                  Expires {formatInviteExpiryDate(row.expiresAt)}
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${inviteStateBadgeClass(row.inviteState)}`}
              >
                {inviteStateLabel(row.inviteState)}
              </span>
            </div>
          </PremiumCard>
        ))
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">Planning Portal access</SectionTitle>
              <PrimaryButton
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
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
                    void handleCopyLink();
                  }}
                  className="w-full rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-black shadow-none hover:brightness-[0.97]"
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
                  className="w-full rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-black shadow-none hover:brightness-[0.97] disabled:opacity-60"
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
