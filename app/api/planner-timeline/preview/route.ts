import { NextResponse } from "next/server";

import {
  extractPlannerTimelineDocument,
  type PlannerTimelineExtractionSource,
} from "@/lib/plannerTimelineExtraction";
import {
  parsePlannerTimelineText,
  type PlannerTimelineMoment,
} from "@/lib/plannerTimelineParsing";

export const runtime = "nodejs";

type PlannerTimelinePreviewResult = {
  ok: boolean;
  source?: PlannerTimelineExtractionSource;
  moments?: PlannerTimelineMoment[];
  message?: string;
  debug?: {
    fileType?: string;
    charactersExtracted?: number;
    momentsExtracted?: number;
  };
};

function jsonResponse(payload: PlannerTimelinePreviewResult, status = 200): NextResponse {
  return NextResponse.json(payload, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  let fileValue: FormDataEntryValue | null;
  try {
    const formData = await request.formData();
    fileValue = formData.get("file");
  } catch {
    return jsonResponse(
      {
        ok: false,
        source: "unsupported",
        message: "Request body must be multipart/form-data.",
      },
      400,
    );
  }

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

  try {
    const extraction = await extractPlannerTimelineDocument(fileValue);
    const extractionDebug = {
      fileType: extraction.debug?.fileType,
      charactersExtracted: extraction.debug?.charactersExtracted,
    };

    if (!extraction.ok || !extraction.text) {
      return jsonResponse({
        ok: false,
        source: extraction.source,
        message: extraction.message ?? "Could not extract planner timeline text.",
        debug: extractionDebug,
      });
    }

    const parsed = await parsePlannerTimelineText(extraction.text);
    if (!parsed.ok || !parsed.moments) {
      return jsonResponse({
        ok: false,
        source: extraction.source,
        message: parsed.message ?? "Could not parse planner timeline moments.",
        debug: {
          ...extractionDebug,
          momentsExtracted: parsed.debug?.momentsExtracted,
        },
      });
    }

    return jsonResponse({
      ok: true,
      source: extraction.source,
      moments: parsed.moments,
      debug: {
        ...extractionDebug,
        momentsExtracted: parsed.moments.length,
      },
    });
  } catch (error) {
    console.error("[planner-timeline-preview] POST failed", error);
    return jsonResponse(
      {
        ok: false,
        source: "unsupported",
        message: "Could not preview planner timeline import.",
        debug: { fileType: fileValue.type || "application/octet-stream" },
      },
      500,
    );
  }
}
