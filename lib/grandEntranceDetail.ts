/** Planning-question key — wedding party lineup / order (existing catalog id). */
export const GRAND_ENTRANCE_PLANNING_LINEUP_KEY = "pq_grand_entrance";

/** MC script for the Grand Entrance moment (stored in event planningQuestionAnswers). */
export const GRAND_ENTRANCE_MC_SCRIPT_KEY = "ge_mc_script";

/** Couple entrance line — defaults to event couple names when empty. */
export const GRAND_ENTRANCE_COUPLE_KEY = "ge_couple_entrance";

/** DJ/Admin hype script immediately before announcing the couple (planningQuestionAnswers JSON only). */
export const GRAND_ENTRANCE_COUPLE_ENTRANCE_SCRIPT_KEY = "ge_couple_entrance_script";

const GRAND_ENTRANCE_TITLE = /grand entrance/i;

export function isGrandEntranceTimelineItem(title: string): boolean {
  return GRAND_ENTRANCE_TITLE.test(title.trim());
}

export function parseGrandEntranceLineup(raw: string): string[] {
  return raw
    .split(/\n/)
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export type GrandEntranceDetailFields = {
  script: string;
  lineup: string;
  coupleEntrance: string;
  coupleEntranceScript: string;
};

export function readGrandEntranceDetail(
  answers: Record<string, string | undefined>,
  coupleDefault: string,
): GrandEntranceDetailFields {
  return {
    script: answers[GRAND_ENTRANCE_MC_SCRIPT_KEY]?.trim() ?? "",
    lineup: answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY]?.trim() ?? "",
    coupleEntrance:
      answers[GRAND_ENTRANCE_COUPLE_KEY]?.trim() || coupleDefault.trim(),
    coupleEntranceScript:
      answers[GRAND_ENTRANCE_COUPLE_ENTRANCE_SCRIPT_KEY]?.trim() ?? "",
  };
}

export type GrandEntranceDetailDbRow = {
  grandEntranceScript?: string | null;
  grandEntranceLineup?: string | null;
  grandEntranceCouple?: string | null;
};

export function grandEntranceDetailFieldsFromDb(
  row: GrandEntranceDetailDbRow,
): GrandEntranceDetailFields {
  return {
    script: row.grandEntranceScript?.trim() ?? "",
    lineup: row.grandEntranceLineup?.trim() ?? "",
    coupleEntrance: row.grandEntranceCouple?.trim() ?? "",
    coupleEntranceScript: "",
  };
}

export function mergeGrandEntranceDbIntoPlanningAnswers(
  answers: Record<string, string | undefined>,
  row: GrandEntranceDetailDbRow,
): Record<string, string> {
  return mergeGrandEntranceDetailIntoAnswers(
    answers as Record<string, string>,
    grandEntranceDetailFieldsFromDb(row),
  );
}

export function mergeGrandEntranceOperationalIntoAnswers(
  answers: Record<string, string>,
  operational: Pick<GrandEntranceDetailFields, "script" | "coupleEntranceScript">,
): Record<string, string> {
  const next = { ...answers };
  const setOrDelete = (key: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) next[key] = trimmed;
    else delete next[key];
  };
  setOrDelete(GRAND_ENTRANCE_MC_SCRIPT_KEY, operational.script);
  setOrDelete(GRAND_ENTRANCE_COUPLE_ENTRANCE_SCRIPT_KEY, operational.coupleEntranceScript);
  return next;
}

export function mergeGrandEntranceDetailIntoAnswers(
  answers: Record<string, string>,
  detail: GrandEntranceDetailFields,
): Record<string, string> {
  const next = { ...answers };
  const setOrDelete = (key: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) next[key] = trimmed;
    else delete next[key];
  };
  setOrDelete(GRAND_ENTRANCE_MC_SCRIPT_KEY, detail.script);
  setOrDelete(GRAND_ENTRANCE_PLANNING_LINEUP_KEY, detail.lineup);
  setOrDelete(GRAND_ENTRANCE_COUPLE_KEY, detail.coupleEntrance);
  setOrDelete(GRAND_ENTRANCE_COUPLE_ENTRANCE_SCRIPT_KEY, detail.coupleEntranceScript);
  return next;
}

export function grandEntranceDetailDraftsEqual(
  a: GrandEntranceDetailFields & { sideNote: string },
  b: GrandEntranceDetailFields & { sideNote: string },
): boolean {
  return (
    a.script.trim() === b.script.trim() &&
    a.lineup.trim() === b.lineup.trim() &&
    a.coupleEntrance.trim() === b.coupleEntrance.trim() &&
    a.coupleEntranceScript.trim() === b.coupleEntranceScript.trim() &&
    a.sideNote.trim() === b.sideNote.trim()
  );
}

export type GrandEntranceMcScriptPreviewContent = {
  previewLines: string[];
  moreLineCount: number;
  isEmpty: boolean;
};

/** Compact read-only preview for timeline / Run Of Show surfaces. */
export function getGrandEntranceMcScriptPreviewContent(
  script: string | undefined | null,
  maxVisible = 2,
): GrandEntranceMcScriptPreviewContent {
  const trimmed = script?.trim() ?? "";
  if (!trimmed) {
    return { previewLines: [], moreLineCount: 0, isEmpty: true };
  }

  const lines = trimmed
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { previewLines: [], moreLineCount: 0, isEmpty: true };
  }

  const visible = lines.slice(0, maxVisible);
  return {
    previewLines: visible,
    moreLineCount: Math.max(0, lines.length - maxVisible),
    isEmpty: false,
  };
}
