import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseMusicHubPlanJson } from "@/lib/musicHubPlan";
import { resolvePublicGuestRequestEvent } from "@/lib/guestRequests/resolvePublicEvent";

export const dynamic = "force-dynamic";

type GuestRequestSubmitResponse =
  | { ok: true }
  | { ok: false; code: "closed" | "limit_reached" | "invalid_input" | "not_found" | "api_error"; message: string };

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function errorResponse(
  code: Exclude<GuestRequestSubmitResponse, { ok: true }>["code"],
  message: string,
  status = 200,
): NextResponse<GuestRequestSubmitResponse> {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse<GuestRequestSubmitResponse>> {
  try {
    const { token } = await context.params;
    const requestToken = decodeURIComponent(token ?? "").trim();
    if (!requestToken) return errorResponse("not_found", "This request link is not available.", 404);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const guestName = cleanText(body?.guestName, 80);
    const songTitle = cleanText(body?.songTitle, 120);
    const artist = cleanText(body?.artist, 120);

    if (!guestName || !songTitle) {
      return errorResponse("invalid_input", "Please include your name and song title.", 400);
    }

    const event = await resolvePublicGuestRequestEvent(requestToken);

    if (!event) return errorResponse("not_found", "This request link is not available.", 404);

    const settings = parseMusicHubPlanJson(event.musicHubPlan)?.guestRequestSettings;
    if (!settings?.enabled) {
      return errorResponse("closed", "Guest song requests are not open right now.");
    }

    if (settings.maxRequests !== "unlimited" && event.guestRequests.length >= settings.maxRequests) {
      return errorResponse("limit_reached", "Guest song requests are full for this event.");
    }

    const nextOrder =
      event.guestRequests.reduce((max, row) => Math.max(max, row.order), -1) + 1;

    await prisma.guestRequest.create({
      data: {
        eventId: event.id,
        guestName,
        songTitle,
        artist,
        dedication: "",
        status: "Pending",
        addedToMustPlay: false,
        addedToDoNotPlay: false,
        order: nextOrder,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[guest-request-submit] failed", error);
    return errorResponse("api_error", "We could not send your request. Please try again.", 500);
  }
}
