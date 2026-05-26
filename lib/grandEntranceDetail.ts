/** Planning-question key — wedding party lineup / order (existing catalog id). */
export const GRAND_ENTRANCE_PLANNING_LINEUP_KEY = "pq_grand_entrance";

/** MC script for the Grand Entrance moment (stored in event planningQuestionAnswers). */
export const GRAND_ENTRANCE_MC_SCRIPT_KEY = "ge_mc_script";

/** Couple entrance line — defaults to event couple names when empty. */
export const GRAND_ENTRANCE_COUPLE_KEY = "ge_couple_entrance";

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
  operational: Pick<GrandEntranceDetailFields, "script">,
): Record<string, string> {
  const next = { ...answers };
  const trimmed = operational.script.trim();
  if (trimmed) next[GRAND_ENTRANCE_MC_SCRIPT_KEY] = trimmed;
  else delete next[GRAND_ENTRANCE_MC_SCRIPT_KEY];
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
    a.sideNote.trim() === b.sideNote.trim()
  );
}
