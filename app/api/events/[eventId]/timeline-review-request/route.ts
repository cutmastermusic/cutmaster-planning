import { NextResponse } from "next/server";

import { resolveRequestSiteOrigin } from "@/lib/auth/authConfig";
import { roleHasCapability } from "@/lib/eventAccess/capabilities";
import { authorizeEventAccess } from "@/lib/eventAccess/authorize";
import { EventAccessError } from "@/lib/eventAccess/errors";
import { prisma } from "@/lib/prisma";
import { sendTimelineReviewRequestedEmail } from "@/lib/email/sendTimelineReviewRequestedEmail";

const ADMIN_FALLBACK_EMAIL = "chris@cutmastermusic.com";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function accessErrorResponse(error: EventAccessError): NextResponse {
  const status =
    error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
  return jsonError(error.message, status);
}

function normalizeLookup(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatEventDate(date: Date | null): string {
  if (!date) return "Not provided";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function uniqueEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const email of emails) {
    const trimmed = email.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    next.push(trimmed);
  }
  return next;
}

async function readLastEditedAt(request: Request): Promise<Date | null> {
  try {
    const body = (await request.json()) as { lastEditedAt?: unknown };
    if (typeof body.lastEditedAt !== "string") return null;
    const parsed = new Date(body.lastEditedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await context.params;
    const actor = await authorizeEventAccess(eventId);
    const canRequestReview =
      roleHasCapability(actor.capabilityActor, "event:metadata:couple-write") ||
      roleHasCapability(actor.capabilityActor, "event:metadata:write");

    if (!canRequestReview) {
      return jsonError("You do not have permission to request timeline review.", 403);
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        date: true,
        assignedDj: true,
        ownerId: true,
        timelineReviewRequestedAt: true,
        members: {
          where: { status: "ACTIVE" },
          select: {
            email: true,
            displayName: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      return jsonError("Event not found.", 404);
    }

    const lastEditedAt = await readLastEditedAt(request);
    const hasUpdatesSinceReview =
      Boolean(event.timelineReviewRequestedAt && lastEditedAt) &&
      lastEditedAt!.getTime() > event.timelineReviewRequestedAt!.getTime() + 1000;

    if (event.timelineReviewRequestedAt && !hasUpdatesSinceReview) {
      return NextResponse.json({
        ok: true,
        status: "already_requested",
        requestedAt: event.timelineReviewRequestedAt.toISOString(),
        notification: { status: "skipped", reason: "already_requested" },
      });
    }

    const requestedAt = new Date();
    const claimed = await prisma.event.updateMany({
      where: event.timelineReviewRequestedAt
        ? {
            id: eventId,
            timelineReviewRequestedAt: event.timelineReviewRequestedAt,
          }
        : {
            id: eventId,
            timelineReviewRequestedAt: null,
          },
      data: {
        timelineReviewRequestedAt: requestedAt,
      },
    });

    if (claimed.count === 0) {
      const latest = await prisma.event.findUnique({
        where: { id: eventId },
        select: { timelineReviewRequestedAt: true },
      });
      return NextResponse.json({
        ok: true,
        status: "already_requested",
        requestedAt: latest?.timelineReviewRequestedAt?.toISOString() ?? requestedAt.toISOString(),
        notification: { status: "skipped", reason: "already_requested" },
      });
    }

    const assignedDjLookup = normalizeLookup(event.assignedDj);
    const activeDjMember = event.members.find((member) => member.role === "DJ" && member.email.trim());
    const activeCoupleMember = event.members.find(
      (member) => member.role === "COUPLE" && (member.displayName?.trim() || member.email.trim()),
    );
    const companyDjCandidates = assignedDjLookup
      ? await prisma.companyTeamMember.findMany({
          where: {
            ownerId: event.ownerId,
            isActive: true,
            role: "DJ",
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];
    const assignedCompanyDj = companyDjCandidates.find((member) =>
      [member.id, member.name, member.email ?? ""].some((value) => normalizeLookup(value) === assignedDjLookup),
    );
    const assignedDjEmail =
      activeDjMember?.email ||
      assignedCompanyDj?.email ||
      (event.assignedDj && looksLikeEmail(event.assignedDj) ? event.assignedDj : "");
    const recipients = uniqueEmails([assignedDjEmail || ADMIN_FALLBACK_EMAIL]);
    const origin = resolveRequestSiteOrigin(request);
    const reviewTimelineUrl = `${origin}/?event=${encodeURIComponent(event.id)}#timeline-section-reception`;
    const notification = await sendTimelineReviewRequestedEmail({
      to: recipients,
      eventName: event.title,
      eventDate: formatEventDate(event.date),
      coupleName: activeCoupleMember?.displayName || activeCoupleMember?.email || event.title,
      reviewTimelineUrl,
    });

    if (notification.status !== "sent") {
      console.error("[timeline-review-request] notification was not sent", {
        eventId,
        notification,
      });
    }

    return NextResponse.json({
      ok: true,
      status: event.timelineReviewRequestedAt ? "updated_requested" : "requested",
      requestedAt: requestedAt.toISOString(),
      notification,
    });
  } catch (error) {
    if (error instanceof EventAccessError) {
      return accessErrorResponse(error);
    }
    console.error("[timeline-review-request] POST failed", error);
    return jsonError("Could not request timeline review.", 500);
  }
}
