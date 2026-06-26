import { NextResponse } from "next/server";

import {
  extractPlannerTimelineDocument,
  type PlannerTimelineExtractionResult,
} from "@/lib/plannerTimelineExtraction";

export const runtime = "nodejs";

function jsonResponse(payload: PlannerTimelineExtractionResult, status = 200): NextResponse {
  return NextResponse.json(payload, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return jsonResponse(
        {
          ok: false,
          source: "unsupported",
          message: "Planner timeline file is required.",
        },
        400,
      );
    }

    if (fileValue.size <= 0) {
      return jsonResponse(
        {
          ok: false,
          source: "unsupported",
          message: "Planner timeline file is empty.",
          debug: { fileType: fileValue.type || "application/octet-stream" },
        },
        400,
      );
    }

    return jsonResponse(await extractPlannerTimelineDocument(fileValue));
  } catch (error) {
    console.error("[planner-timeline-extract] POST failed", error);
    return jsonResponse(
      {
        ok: false,
        source: "unsupported",
        message: "Could not extract planner timeline document.",
      },
      500,
    );
  }
}
