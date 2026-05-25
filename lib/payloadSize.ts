/**
 * Payload-size diagnostics for Server Action calls.
 *
 * Background:
 *   Next.js Server Actions enforce a default request body limit of 1 MB
 *   (configurable via `experimental.serverActions.bodySizeLimit`). When a
 *   client invokes a server action with arguments whose JSON serialization
 *   exceeds that limit, the request fails with:
 *     `Body exceeded 1 MB limit.`
 *
 *   The failure surfaces *after* the payload is already on the wire, which
 *   makes it hard to know *which* field grew unbounded. The helpers in this
 *   file let callers measure payload size at the call-site and either log
 *   diagnostics or throw a friendly error *before* the network call — with
 *   pointer information identifying the single largest leaf string in the
 *   payload (typically the offending notes / body / dedication / data URL).
 *
 *   Used by `lib/actions/events.ts` (server-side logging) and the Server
 *   Action wrappers in `app/page.tsx` (client-side warn / hard guard).
 *
 *   We intentionally do not raise the body limit yet — the goal is to find
 *   and fix the root cause, not paper over an unbounded field.
 */

/** Soft warning threshold (bytes). Logs a console warning but proceeds. */
export const PAYLOAD_WARN_BYTES = 750_000;

/** Hard error threshold (bytes). Throw before Next.js rejects the action. */
export const PAYLOAD_HARD_BYTES = 950_000;

export type LargestLeaf = {
  path: string;
  bytes: number;
  preview: string;
};

/**
 * Walk an arbitrary JSON-like value and return the single largest string leaf
 * by UTF-16 length (close enough to byte size for our diagnostic purposes;
 * we are looking for ballpark "this notes field is 1.2 MB", not exact bytes).
 *
 * Returns the deep path (e.g. `[2].notes`), an approximate byte size, and a
 * short preview of the leading characters to help identify the field.
 */
export function findLargestLeaf(value: unknown, basePath = ""): LargestLeaf {
  let largest: LargestLeaf = { path: basePath || "<root>", bytes: 0, preview: "" };

  const visit = (val: unknown, path: string) => {
    if (val == null) return;
    if (typeof val === "string") {
      const bytes = val.length;
      if (bytes > largest.bytes) {
        largest = {
          path: path || "<root>",
          bytes,
          preview: val.slice(0, 80),
        };
      }
      return;
    }
    if (Array.isArray(val)) {
      val.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    if (typeof val === "object") {
      for (const [key, child] of Object.entries(val as Record<string, unknown>)) {
        visit(child, path ? `${path}.${key}` : key);
      }
    }
  };

  visit(value, basePath);
  return largest;
}

/** Quick UTF-16-length approximation of the JSON byte size of a value. */
export function estimatePayloadBytes(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return 0;
  }
}

export type PayloadSizeReport = {
  actionName: string;
  bytes: number;
  kb: number;
  largest: LargestLeaf;
};

export function describePayload(actionName: string, payload: unknown): PayloadSizeReport {
  const bytes = estimatePayloadBytes(payload);
  return {
    actionName,
    bytes,
    kb: Math.round(bytes / 1024),
    largest: findLargestLeaf(payload),
  };
}

/**
 * Guard a client-side Server Action call. Logs a warning if the payload is
 * approaching the 1 MB limit and throws a clear error well before Next.js
 * would reject it — preserving the user's local state and surfacing the
 * offending field in the thrown message so the bug can be diagnosed.
 *
 * The guard does **not** mutate or strip anything; that is the caller's
 * responsibility once the root cause is identified.
 */
export function assertPayloadFitsServerAction(actionName: string, payload: unknown): PayloadSizeReport {
  const report = describePayload(actionName, payload);

  if (report.bytes >= PAYLOAD_HARD_BYTES) {
    const message =
      `[payload-guard] ${actionName} payload is ${report.kb} KB — Next.js will reject this ` +
      `(default Server Action body limit is 1 MB). Largest field: ${report.largest.path} ` +
      `(~${Math.round(report.largest.bytes / 1024)} KB). Preview: ${JSON.stringify(report.largest.preview)}.`;
    if (typeof window !== "undefined") {
      console.error(message, report);
    }
    throw new Error(message);
  }

  if (report.bytes >= PAYLOAD_WARN_BYTES && typeof window !== "undefined") {
    console.warn(
      `[payload-guard] ${actionName} payload is ${report.kb} KB (warn at ${Math.round(
        PAYLOAD_WARN_BYTES / 1024,
      )} KB, hard limit ~1024 KB). Largest field: ${report.largest.path} (~${Math.round(
        report.largest.bytes / 1024,
      )} KB).`,
      report,
    );
  }

  return report;
}
