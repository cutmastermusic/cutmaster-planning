export type InviteUnavailableReason =
  | "invalid"
  | "expired"
  | "already_accepted"
  | "revoked"
  | "member_revoked";

export type InviteUnavailableCopy = {
  title: string;
  message: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export type InviteAcceptPreviewPayload = {
  eventTitle: string;
  invitedEmail: string;
  expiresAt: Date;
};

export type InviteAcceptPreviewResult =
  | { status: "ready"; preview: InviteAcceptPreviewPayload }
  | {
      status: "unavailable";
      reason: InviteUnavailableReason;
      eventTitle?: string | null;
      invitedEmail?: string | null;
    };

export type InviteRecordForClassification = {
  email: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  event: { title: string };
  eventMember: { status: string } | null;
};

export function getInviteUnavailableCopy(
  reason: InviteUnavailableReason,
  options?: { eventTitle?: string | null },
): InviteUnavailableCopy {
  switch (reason) {
    case "invalid":
      return {
        title: "Invitation not found",
        message:
          "This link is not valid. It may have been copied incorrectly or is no longer in our system. Ask your planner to send a fresh invite.",
        primaryCta: { label: "Go to sign in", href: "/login" },
      };
    case "expired":
      return {
        title: "Invitation expired",
        message:
          "This invitation link has expired. Ask your planner to send a new invite to your email address.",
        primaryCta: { label: "Go to sign in", href: "/login" },
      };
    case "already_accepted":
      return {
        title: "Invitation already accepted",
        message: options?.eventTitle
          ? `You already accepted access to ${options.eventTitle}. Sign in to open your planning portal.`
          : "You already accepted this invitation. Sign in to open your planning portal.",
        primaryCta: { label: "Open planning portal", href: "/login" },
      };
    case "revoked":
      return {
        title: "Invitation cancelled",
        message:
          "Your planner cancelled this invitation link. Ask them to send a new invite if you still need access.",
        primaryCta: { label: "Go to sign in", href: "/login" },
      };
    case "member_revoked":
      return {
        title: "Access removed",
        message:
          "Your access to this event was removed. Contact your planner if you believe this is a mistake.",
        primaryCta: { label: "Go to sign in", href: "/login" },
      };
  }
}

export function getInviteUnavailableMessage(
  reason: InviteUnavailableReason,
  options?: { eventTitle?: string | null },
): string {
  return getInviteUnavailableCopy(reason, options).message;
}

export function classifyInviteRecord(
  invite: InviteRecordForClassification | null,
  now: Date = new Date(),
): InviteAcceptPreviewResult {
  if (!invite) {
    return { status: "unavailable", reason: "invalid" };
  }

  const eventTitle = invite.event.title;

  if (invite.eventMember?.status === "REVOKED") {
    return { status: "unavailable", reason: "member_revoked", eventTitle };
  }

  if (invite.revokedAt) {
    return { status: "unavailable", reason: "revoked", eventTitle };
  }

  if (invite.acceptedAt || invite.eventMember?.status === "ACTIVE") {
    return {
      status: "unavailable",
      reason: "already_accepted",
      eventTitle,
      invitedEmail: invite.email,
    };
  }

  if (invite.expiresAt.getTime() <= now.getTime()) {
    return { status: "unavailable", reason: "expired", eventTitle };
  }

  return {
    status: "ready",
    preview: {
      eventTitle,
      invitedEmail: invite.email,
      expiresAt: invite.expiresAt,
    },
  };
}
