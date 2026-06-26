import { NextResponse } from "next/server";

import {
  parsePlannerTimelineText,
  type PlannerTimelineParseResult,
} from "@/lib/plannerTimelineParsing";

export const runtime = "nodejs";

function jsonResponse(payload: PlannerTimelineParseResult, status = 200): NextResponse {
  return NextResponse.json(payload, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      400,
    );
  }

  const text = payload && typeof payload === "object" ? (payload as { text?: unknown }).text : undefined;
  if (typeof text !== "string") {
    return jsonResponse(
      {
        ok: false,
        message: "Planner timeline text is required.",
      },
      400,
    );
  }

  try {
    return jsonResponse(await parsePlannerTimelineText(text));
  } catch (error) {
    console.error("[planner-timeline-parse] POST failed", error);
    return jsonResponse(
      {
        ok: false,
        message: "Could not parse planner timeline text.",
        debug: { inputCharacters: text.trim().length },
      },
      500,
    );
  }
}
