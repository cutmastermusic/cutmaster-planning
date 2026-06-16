/** Temporary diagnostics for global default welcome photo pipeline. Remove after trace. */

const PREFIX = "[welcome-photo-trace]";

export function traceWelcomePhoto(step: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  console.log(PREFIX, step, payload);
  const w = window as Window & { __welcomePhotoTraceLog?: Array<{ step: string; payload: Record<string, unknown> }> };
  w.__welcomePhotoTraceLog = w.__welcomePhotoTraceLog ?? [];
  w.__welcomePhotoTraceLog.push({ step, payload });
}

export function readGlobalSettingsFromLocalStorage(): {
  defaultWelcomePhotoDataUrl?: string;
  defaultWelcomePhotoTransform?: unknown;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("cutmaster_planning_global_settings_v1");
    if (!raw) return null;
    return JSON.parse(raw) as {
      defaultWelcomePhotoDataUrl?: string;
      defaultWelcomePhotoTransform?: unknown;
    };
  } catch {
    return null;
  }
}

export function summarizeDataUrl(value?: string | null) {
  if (!value) return { present: false, length: 0, prefix: null as string | null };
  const trimmed = value.trim();
  return {
    present: Boolean(trimmed),
    length: trimmed.length,
    prefix: trimmed.slice(0, 32),
  };
}
