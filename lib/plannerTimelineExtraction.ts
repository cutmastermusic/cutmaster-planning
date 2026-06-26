import "server-only";

export type PlannerTimelineExtractionSource =
  | "pdf-text"
  | "openai-vision"
  | "text"
  | "unsupported";

export type PlannerTimelineExtractionResult = {
  ok: boolean;
  source: PlannerTimelineExtractionSource;
  text?: string;
  message?: string;
  debug?: {
    charactersExtracted?: number;
    fileType?: string;
  };
};

type PdfParseModule = {
  default?: unknown;
};

type PdfParseResult = {
  text?: string;
};

const MIN_USEFUL_PDF_TEXT_CHARACTERS = 80;
const OPENAI_VISION_MODEL = "gpt-4.1-mini";
const OPENAI_NOT_CONFIGURED_MESSAGE = "OCR/document vision is not configured.";

function getFileType(file: File): string {
  return file.type || "application/octet-stream";
}

function isPdf(file: File): boolean {
  return getFileType(file) === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImage(file: File): boolean {
  return getFileType(file).startsWith("image/");
}

function isText(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return getFileType(file).startsWith("text/") || fileName.endsWith(".txt");
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}

function isUsefulPdfText(text: string): boolean {
  const compactText = text.replace(/\s/g, "");
  const letters = text.match(/[A-Za-z]/g)?.length ?? 0;
  return compactText.length >= MIN_USEFUL_PDF_TEXT_CHARACTERS && letters >= 20;
}

async function extractPdfTextIfAvailable(bytes: Buffer): Promise<string | null> {
  try {
    const moduleName = "pdf-parse";
    const pdfParseModule = (await import(moduleName)) as PdfParseModule;
    const pdfParse = pdfParseModule.default;
    if (typeof pdfParse !== "function") return null;

    const result = (await pdfParse(bytes)) as PdfParseResult;
    return normalizeExtractedText(result.text ?? "");
  } catch (error) {
    const code = typeof error === "object" && error ? (error as { code?: unknown }).code : undefined;
    if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
      return null;
    }
    console.warn("[planner-timeline-extract] pdf-parse failed", error);
    return null;
  }
}

async function fileToDataUrl(file: File, bytes: Buffer): Promise<string> {
  const contentType = getFileType(file);
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

function extractOpenAIText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const directText = (payload as { output_text?: unknown }).output_text;
  if (typeof directText === "string") return normalizeExtractedText(directText);

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") continue;
      const text = (contentItem as { text?: unknown }).text;
      if (typeof text === "string") chunks.push(text);
    }
  }

  return normalizeExtractedText(chunks.join("\n"));
}

async function extractWithOpenAIVision(file: File, bytes: Buffer): Promise<PlannerTimelineExtractionResult> {
  const fileType = getFileType(file);
  if (!process.env.OPENAI_API_KEY) {
    return {
      ok: false,
      source: "openai-vision",
      message: OPENAI_NOT_CONFIGURED_MESSAGE,
      debug: { fileType },
    };
  }

  const dataUrl = await fileToDataUrl(file, bytes);
  const fileContent = isPdf(file)
    ? {
        type: "input_file",
        filename: file.name || "planner-timeline.pdf",
        file_data: dataUrl,
      }
    : {
        type: "input_image",
        image_url: dataUrl,
        detail: "high",
      };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Extract the visible text from this planner timeline document.",
                "Preserve event names, times, locations, notes, and ordering as plainly as possible.",
                "Return only the extracted text. Do not summarize or interpret it yet.",
              ].join(" "),
            },
            fileContent,
          ],
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? ((payload as { error?: { message?: string } }).error?.message ?? "OpenAI vision/OCR request failed.")
        : "OpenAI vision/OCR request failed.";
    return {
      ok: false,
      source: "openai-vision",
      message,
      debug: { fileType },
    };
  }

  const text = extractOpenAIText(payload);
  return {
    ok: Boolean(text),
    source: "openai-vision",
    text: text || undefined,
    message: text ? undefined : "OpenAI vision/OCR did not return extracted text.",
    debug: {
      charactersExtracted: text.length,
      fileType,
    },
  };
}

export async function extractPlannerTimelineDocument(file: File): Promise<PlannerTimelineExtractionResult> {
  const fileType = getFileType(file);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isText(file)) {
    const text = normalizeExtractedText(bytes.toString("utf8"));
    return {
      ok: Boolean(text),
      source: "text",
      text: text || undefined,
      message: text ? undefined : "Uploaded text file is empty.",
      debug: {
        charactersExtracted: text.length,
        fileType,
      },
    };
  }

  if (isPdf(file)) {
    const pdfText = await extractPdfTextIfAvailable(bytes);
    if (pdfText && isUsefulPdfText(pdfText)) {
      return {
        ok: true,
        source: "pdf-text",
        text: pdfText,
        debug: {
          charactersExtracted: pdfText.length,
          fileType,
        },
      };
    }

    const result = await extractWithOpenAIVision(file, bytes);
    return {
      ...result,
      debug: {
        ...result.debug,
        charactersExtracted: result.debug?.charactersExtracted ?? pdfText?.length ?? 0,
        fileType,
      },
    };
  }

  if (isImage(file)) {
    return extractWithOpenAIVision(file, bytes);
  }

  return {
    ok: false,
    source: "unsupported",
    message: "Unsupported planner timeline file type.",
    debug: { fileType },
  };
}
