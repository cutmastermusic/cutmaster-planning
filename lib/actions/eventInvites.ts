"use server";

import type { EventMemberStatus } from "@/lib/generated/prisma/client";
import { getSiteUrl } from "@/lib/auth/authConfig";
import {
  sendPlanningPortalInviteEmail,
} from "@/lib/email/sendPlanningPortalInviteEmail";
import type { InviteEmailDeliveryResult } from "@/lib/email/types";
import { authorizeEventMutation, requireAuth } from "@/lib/eventAccess/authorize";
import { EventAccessError } from "@/lib/eventAccess/errors";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";
import { decryptInviteToken, encryptInviteToken } from "@/lib/invites/tokenEncryption";
import {
  classifyInviteRecord,
  getInviteUnavailableMessage,
  type InviteAcceptPreviewResult,
  type InviteUnavailableReason,
} from "@/lib/invites/inviteAcceptMessages";
import { resolveInviteAcceptPreview as resolveInviteAcceptPreviewFromDb } from "@/lib/invites/inviteAcceptState";
import { prisma } from "@/lib/prisma";

const INVITE_EXPIRY_DAYS = 14;
const INVITE_ACCEPT_PATH = "/invite/accept";

export type CreateEventInviteInput = {
  email: string;
  displayName?: string | null;
};

export type CreateEventInviteResult = {
  inviteUrl: string;
  expiresAt: Date;
  inviteId: string;
  eventMemberId: string;
  emailDelivery: InviteEmailDeliveryResult;
};

export type InviteAcceptPreview = {
  eventTitle: string;
  invitedEmail: string;
  expiresAt: Date;
};

export type AcceptEventInviteResult = {
  eventId: string;
  role: "COUPLE";
};

export type EventInviteListState = "pending" | "active" | "expired" | "revoked" | "accepted";

export type EventInviteListItem = {
  inviteId: string;
  eventMemberId: string;
  email: string;
  displayName: string | null;
  memberStatus: EventMemberStatus;
  memberAcceptedAt: Date | null;
  inviteCreatedAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  inviteState: EventInviteListState;
  hasRetrievableLink: boolean;
};

function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

function inviteExpiryDate(from: Date = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
}

function buildInviteUrl(rawToken: string): string {
  return `${getSiteUrl()}${INVITE_ACCEPT_PATH}?token=${encodeURIComponent(rawToken)}`;
}

function throwInviteUnavailable(
  reason: InviteUnavailableReason,
  options?: { eventTitle?: string | null },
): never {
  throw new EventAccessError("FORBIDDEN", getInviteUnavailableMessage(reason, options));
}

function assertSupabaseSessionForAccept(
  access: Awaited<ReturnType<typeof requireAuth>>,
): asserts access is Awaited<ReturnType<typeof requireAuth>> & {
  email: string;
  dbUser: NonNullable<Awaited<ReturnType<typeof requireAuth>>["dbUser"]>;
} {
  if (
    access.readScope === "bypass" ||
    access.mode !== "supabase" ||
    !access.email ||
    !access.dbUser
  ) {
    throw new EventAccessError(
      "UNAUTHENTICATED",
      "Sign in with the invited email to accept this invite.",
    );
  }
}

function resolveInviteListState(input: {
  memberStatus: EventMemberStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  now?: Date;
}): EventInviteListState {
  const now = input.now ?? new Date();

  if (input.memberStatus === "ACTIVE") {
    return "active";
  }

  if (input.revokedAt) {
    return "revoked";
  }

  if (input.acceptedAt) {
    return "accepted";
  }

  if (input.expiresAt.getTime() <= now.getTime()) {
    return "expired";
  }

  return "pending";
}

async function loadCoupleInviteForEvent(eventId: string, inviteId: string) {
  await authorizeEventMutation(eventId, "event:invite:write");

  const invite = await prisma.eventInvite.findFirst({
    where: {
      id: inviteId,
      eventId,
      role: "COUPLE",
    },
    include: {
      event: { select: { title: true } },
      eventMember: true,
    },
  });

  if (!invite) {
    throw new EventAccessError("FORBIDDEN", "Invite not found.");
  }

  const member = invite.eventMember;
  const memberStatus = member?.status ?? "PENDING";
  const inviteState = resolveInviteListState({
    memberStatus,
    expiresAt: invite.expiresAt,
    acceptedAt: invite.acceptedAt,
    revokedAt: invite.revokedAt,
  });

  return { invite, inviteState, memberStatus };
}

function resolveRetrievableInviteUrl(invite: { tokenEnc: string | null }): string {
  const rawToken = decryptInviteToken(invite.tokenEnc);
  if (!rawToken) {
    throw new EventAccessError(
      "FORBIDDEN",
      "This invite link is unavailable. Send a new invite to generate a fresh link.",
    );
  }

  return buildInviteUrl(rawToken);
}

async function loadCoupleMemberForEvent(eventId: string, eventMemberId: string) {
  await authorizeEventMutation(eventId, "event:invite:write");

  const member = await prisma.eventMember.findFirst({
    where: {
      id: eventMemberId,
      eventId,
      role: "COUPLE",
    },
  });

  if (!member) {
    throw new EventAccessError("FORBIDDEN", "Portal member not found.");
  }

  return member;
}

export async function createEventInvite(
  eventId: string,
  input: CreateEventInviteInput,
): Promise<CreateEventInviteResult> {
  const actor = await authorizeEventMutation(eventId, "event:invite:write");

  const normalizedEmail = normalizeInviteEmail(input.email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new EventAccessError("FORBIDDEN", "A valid email address is required.");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true },
  });

  if (!event) {
    throw new EventAccessError("FORBIDDEN", "Event not found.");
  }

  const displayName = input.displayName?.trim() || null;
  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = inviteExpiryDate();
  const createdById = actor.access.dbUser?.id ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const existingMember = await tx.eventMember.findUnique({
      where: {
        eventId_email: {
          eventId,
          email: normalizedEmail,
        },
      },
    });

    if (existingMember?.status === "ACTIVE") {
      throw new EventAccessError(
        "FORBIDDEN",
        "This email already has active access to the event.",
      );
    }

    const eventMember = existingMember
      ? await tx.eventMember.update({
          where: { id: existingMember.id },
          data: {
            displayName: displayName ?? existingMember.displayName,
            role: "COUPLE",
            status: "PENDING",
            invitedById: createdById ?? existingMember.invitedById,
            userId: null,
            acceptedAt: null,
          },
        })
      : await tx.eventMember.create({
          data: {
            eventId,
            email: normalizedEmail,
            displayName,
            role: "COUPLE",
            status: "PENDING",
            invitedById: createdById,
          },
        });

    await tx.eventInvite.updateMany({
      where: {
        eventMemberId: eventMember.id,
        acceptedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const invite = await tx.eventInvite.create({
      data: {
        eventId,
        eventMemberId: eventMember.id,
        email: normalizedEmail,
        role: "COUPLE",
        tokenHash,
        tokenEnc: encryptInviteToken(rawToken),
        expiresAt,
        createdById,
      },
    });

    return {
      inviteId: invite.id,
      eventMemberId: eventMember.id,
      expiresAt: invite.expiresAt,
    };
  });

  const inviteUrl = buildInviteUrl(rawToken);
  const emailDelivery = await sendPlanningPortalInviteEmail({
    to: normalizedEmail,
    recipientName: displayName,
    eventTitle: event.title,
    inviteUrl,
    expiresAt: result.expiresAt,
  });

  return {
    inviteUrl,
    expiresAt: result.expiresAt,
    inviteId: result.inviteId,
    eventMemberId: result.eventMemberId,
    emailDelivery,
  };
}

export async function getInviteAcceptPreview(rawToken: string): Promise<InviteAcceptPreview> {
  const result = await resolveInviteAcceptPreviewFromDb(rawToken);

  if (result.status === "unavailable") {
    throwInviteUnavailable(result.reason, { eventTitle: result.eventTitle });
  }

  return result.preview;
}

export async function resolveInviteAcceptPreview(rawToken: string): Promise<InviteAcceptPreviewResult> {
  return resolveInviteAcceptPreviewFromDb(rawToken);
}

export async function acceptEventInvite(rawToken: string): Promise<AcceptEventInviteResult> {
  const access = await requireAuth();
  assertSupabaseSessionForAccept(access);

  const sessionEmail = normalizeInviteEmail(access.email);
  const token = rawToken.trim();

  if (!token) {
    throwInviteUnavailable("invalid");
  }

  const tokenHash = hashInviteToken(token);

  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.eventInvite.findUnique({
      where: { tokenHash },
      include: {
        event: { select: { title: true } },
        eventMember: true,
      },
    });

    const classified = classifyInviteRecord(invite);
    if (classified.status === "unavailable") {
      throwInviteUnavailable(classified.reason, { eventTitle: classified.eventTitle });
    }

    if (!invite?.eventMemberId || !invite.eventMember) {
      throwInviteUnavailable("invalid");
    }

    if (normalizeInviteEmail(invite.email) !== sessionEmail) {
      throw new EventAccessError(
        "FORBIDDEN",
        `This invite was sent to ${invite.email}. Sign in with that email to accept.`,
      );
    }

    const acceptedAt = new Date();

    const eventMember = await tx.eventMember.update({
      where: { id: invite.eventMemberId },
      data: {
        status: "ACTIVE",
        userId: access.dbUser.id,
        acceptedAt,
        email: sessionEmail,
      },
    });

    await tx.eventInvite.update({
      where: { id: invite.id },
      data: { acceptedAt },
    });

    return {
      eventId: eventMember.eventId,
      role: "COUPLE" as const,
    };
  });

  return result;
}

export async function listEventInvites(eventId: string): Promise<EventInviteListItem[]> {
  await authorizeEventMutation(eventId, "event:invite:write");

  const rows = await prisma.eventInvite.findMany({
    where: {
      eventId,
      role: "COUPLE",
    },
    include: {
      eventMember: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = new Date();

  return rows.map((row) => {
    const member = row.eventMember;
    const memberStatus = member?.status ?? "PENDING";
    const memberAcceptedAt = member?.acceptedAt ?? null;
    const inviteState = resolveInviteListState({
      memberStatus,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      now,
    });

    return {
      inviteId: row.id,
      eventMemberId: row.eventMemberId ?? member?.id ?? "",
      email: row.email,
      displayName: member?.displayName ?? null,
      memberStatus,
      memberAcceptedAt,
      inviteCreatedAt: row.createdAt,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      inviteState,
      hasRetrievableLink: inviteState === "pending" && Boolean(row.tokenEnc),
    };
  });
}

export async function getEventInviteUrl(
  eventId: string,
  inviteId: string,
): Promise<{ inviteUrl: string }> {
  const { invite, inviteState } = await loadCoupleInviteForEvent(eventId, inviteId);

  if (inviteState !== "pending") {
    throw new EventAccessError("FORBIDDEN", "Only pending invites have a copyable link.");
  }

  return { inviteUrl: resolveRetrievableInviteUrl(invite) };
}

export async function resendEventInvite(
  eventId: string,
  inviteId: string,
): Promise<{ emailDelivery: InviteEmailDeliveryResult }> {
  const { invite, inviteState } = await loadCoupleInviteForEvent(eventId, inviteId);

  if (inviteState !== "pending") {
    throw new EventAccessError("FORBIDDEN", "Only pending invites can be resent.");
  }

  const inviteUrl = resolveRetrievableInviteUrl(invite);
  const emailDelivery = await sendPlanningPortalInviteEmail({
    to: invite.email,
    recipientName: invite.eventMember?.displayName ?? null,
    eventTitle: invite.event.title,
    inviteUrl,
    expiresAt: invite.expiresAt,
  });

  return { emailDelivery };
}

export async function revokeEventInvite(eventId: string, inviteId: string): Promise<void> {
  const { invite, inviteState } = await loadCoupleInviteForEvent(eventId, inviteId);

  if (inviteState !== "pending") {
    throw new EventAccessError("FORBIDDEN", "Only pending invites can be revoked.");
  }

  const revokedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.eventInvite.update({
      where: { id: invite.id },
      data: { revokedAt },
    });

    if (invite.eventMemberId && invite.eventMember?.status === "PENDING") {
      await tx.eventMember.update({
        where: { id: invite.eventMemberId },
        data: { status: "REVOKED" },
      });
    }
  });
}

export async function removeEventMemberPortalAccess(
  eventId: string,
  eventMemberId: string,
): Promise<void> {
  const member = await loadCoupleMemberForEvent(eventId, eventMemberId);

  if (member.status !== "ACTIVE") {
    throw new EventAccessError("FORBIDDEN", "This member does not have active portal access.");
  }

  const revokedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.eventMember.update({
      where: { id: eventMemberId },
      data: {
        status: "REVOKED",
        userId: null,
      },
    });

    await tx.eventInvite.updateMany({
      where: {
        eventMemberId,
        revokedAt: null,
      },
      data: { revokedAt },
    });
  });

  console.info("[portal-access] removed active portal access", {
    eventId,
    eventMemberId,
    email: member.email,
  });
}
