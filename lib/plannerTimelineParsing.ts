import "server-only";

export type PlannerTimelineMoment = {
  time: string;
  title: string;
  section: "ceremony" | "reception";
  notes?: string;
  confidence?: "high" | "medium" | "low";
};

export type PlannerTimelineParseResult = {
  ok: boolean;
  moments?: PlannerTimelineMoment[];
  message?: string;
  debug?: {
    inputCharacters?: number;
    momentsExtracted?: number;
  };
};

type OpenAIResponsePayload = {
  output_text?: unknown;
  output?: unknown;
  error?: {
    message?: string;
  };
};

type RawPlannerTimelineMoment = {
  time?: unknown;
  title?: unknown;
  section?: unknown;
  notes?: unknown;
  confidence?: unknown;
};

const OPENAI_PARSE_MODEL = "gpt-4.1-mini";
const OPENAI_NOT_CONFIGURED_MESSAGE = "Planner timeline parsing is not configured.";

function extractOpenAIText(payload: OpenAIResponsePayload | null): string {
  if (!payload || typeof payload !== "object") return "";

  if (typeof payload.output_text === "string") return payload.output_text.trim();

  if (!Array.isArray(payload.output)) return "";

  const chunks: string[] = [];
  for (const item of payload.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") continue;
      const text = (contentItem as { text?: unknown }).text;
      if (typeof text === "string") chunks.push(text);
    }
  }

  return chunks.join("\n").trim();
}

function isSection(value: unknown): value is PlannerTimelineMoment["section"] {
  return value === "ceremony" || value === "reception";
}

function isConfidence(value: unknown): value is PlannerTimelineMoment["confidence"] {
  return value === "high" || value === "medium" || value === "low";
}

function normalizeMoments(value: unknown): PlannerTimelineMoment[] | null {
  if (!value || typeof value !== "object") return null;
  const rawMoments = (value as { moments?: unknown }).moments;
  if (!Array.isArray(rawMoments)) return null;

  const moments: PlannerTimelineMoment[] = [];
  for (const rawMoment of rawMoments) {
    if (!rawMoment || typeof rawMoment !== "object") continue;
    const moment = rawMoment as RawPlannerTimelineMoment;
    if (typeof moment.time !== "string" || typeof moment.title !== "string" || !isSection(moment.section)) {
      continue;
    }

    const normalizedMoment: PlannerTimelineMoment = {
      time: moment.time.trim(),
      title: moment.title.trim(),
      section: moment.section,
    };

    if (typeof moment.notes === "string" && moment.notes.trim()) {
      normalizedMoment.notes = moment.notes.trim();
    }
    if (isConfidence(moment.confidence)) {
      normalizedMoment.confidence = moment.confidence;
    }

    if (normalizedMoment.time && normalizedMoment.title) {
      moments.push(normalizedMoment);
    }
  }

  return moments;
}

export async function parsePlannerTimelineText(text: string): Promise<PlannerTimelineParseResult> {
  const normalizedText = text.trim();
  const inputCharacters = normalizedText.length;

  if (!normalizedText) {
    return {
      ok: false,
      message: "Planner timeline text is required.",
      debug: { inputCharacters },
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      ok: false,
      message: OPENAI_NOT_CONFIGURED_MESSAGE,
      debug: { inputCharacters },
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_PARSE_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Extract only DJ/event-relevant timeline moments from this planner timeline text.",
                "Ignore hotel addresses, planner notes, vendor setup notes, and logistical details unless they are directly DJ-relevant.",
                "Preserve ceremony and reception order.",
                "Classify each moment as ceremony or reception.",
                "Return JSON only.",
                "",
                "Planner timeline text:",
                normalizedText,
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "showflow_planner_timeline_moments",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              moments: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    time: { type: "string" },
                    title: { type: "string" },
                    section: { type: "string", enum: ["ceremony", "reception"] },
                    notes: { type: ["string", "null"] },
                    confidence: { type: ["string", "null"], enum: ["high", "medium", "low", null] },
                  },
                  required: ["time", "title", "section", "notes", "confidence"],
                },
              },
            },
            required: ["moments"],
          },
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as OpenAIResponsePayload | null;
  if (!response.ok) {
    return {
      ok: false,
      message: payload?.error?.message ?? "OpenAI timeline parsing request failed.",
      debug: { inputCharacters },
    };
  }

  const outputText = extractOpenAIText(payload);
  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return {
      ok: false,
      message: "OpenAI timeline parsing did not return valid JSON.",
      debug: { inputCharacters },
    };
  }

  const moments = normalizeMoments(parsed);
  if (!moments) {
    return {
      ok: false,
      message: "OpenAI timeline parsing returned an unexpected JSON shape.",
      debug: { inputCharacters },
    };
  }

  return {
    ok: true,
    moments,
    debug: {
      inputCharacters,
      momentsExtracted: moments.length,
    },
  };
}
