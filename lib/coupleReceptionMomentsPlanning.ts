import type { PlanningQuestionDef } from "@/types/planning";
import { GRAND_ENTRANCE_PLANNING_LINEUP_KEY } from "@/lib/grandEntranceDetail";
import { parseSpeechesToasts, SPEECHES_TOASTS_PLANNING_KEY } from "@/lib/speechesToasts";
import { parseWeddingPartyLineup } from "@/lib/weddingPartyLineup";

export const RECEPTION_MOMENTS_QUESTION_IDS = {
  weddingPartyIntroduction: "pq_reception_wedding_party_intro",
  toastsPlanned: "pq_reception_toasts_planned",
} as const;

export const RECEPTION_MOMENTS_GATE_OPTIONS = ["Yes", "No", "Not sure yet"] as const;

export type ReceptionMomentsGateAnswer = "yes" | "no" | "not_sure";

export const RECEPTION_MOMENTS_REVISIT_LATER_NOTE = "We'll revisit this later.";

const GATE_LABEL_TO_VALUE: Record<
  (typeof RECEPTION_MOMENTS_GATE_OPTIONS)[number],
  ReceptionMomentsGateAnswer
> = {
  Yes: "yes",
  No: "no",
  "Not sure yet": "not_sure",
};

const GATE_VALUE_TO_LABEL: Record<ReceptionMomentsGateAnswer, string> = {
  yes: "Yes",
  no: "No",
  not_sure: "Not sure yet",
};

export function normalizeReceptionMomentsGateAnswer(
  raw: string | undefined,
): ReceptionMomentsGateAnswer | "" {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (trimmed === "yes" || trimmed === "no" || trimmed === "not_sure") {
    return trimmed;
  }
  if (trimmed === "not sure" || trimmed === "not sure yet") {
    return "not_sure";
  }
  return "";
}

export function receptionMomentsGateLabelFromValue(value: ReceptionMomentsGateAnswer | ""): string {
  if (!value) return "";
  return GATE_VALUE_TO_LABEL[value];
}

export function receptionMomentsGateValueFromLabel(label: string): ReceptionMomentsGateAnswer | "" {
  return GATE_LABEL_TO_VALUE[label as (typeof RECEPTION_MOMENTS_GATE_OPTIONS)[number]] ?? "";
}

/** Explicit gate answer, or infer "yes" when legacy lineup data exists. */
export function resolveWeddingPartyGateAnswer(
  answers: Record<string, string | undefined>,
): ReceptionMomentsGateAnswer | "" {
  const explicit = normalizeReceptionMomentsGateAnswer(
    answers[RECEPTION_MOMENTS_QUESTION_IDS.weddingPartyIntroduction],
  );
  if (explicit) return explicit;
  if (parseWeddingPartyLineup(answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0) {
    return "yes";
  }
  return "";
}

/** Explicit gate answer, or infer "yes" when legacy toast data exists. */
export function resolveToastsGateAnswer(
  answers: Record<string, string | undefined>,
): ReceptionMomentsGateAnswer | "" {
  const explicit = normalizeReceptionMomentsGateAnswer(
    answers[RECEPTION_MOMENTS_QUESTION_IDS.toastsPlanned],
  );
  if (explicit) return explicit;
  if (parseSpeechesToasts(answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0) {
    return "yes";
  }
  return "";
}

export function weddingPartyGateNeedsLineupFlow(
  gate: ReceptionMomentsGateAnswer | "",
): boolean {
  return gate === "yes";
}

export function toastsGateNeedsSpeakerFlow(gate: ReceptionMomentsGateAnswer | ""): boolean {
  return gate === "yes";
}

function isWeddingPartySectionComplete(
  answers: Record<string, string | undefined>,
  showSection: boolean,
): boolean {
  if (!showSection) return true;

  const gate = resolveWeddingPartyGateAnswer(answers);
  if (!gate) return false;
  if (gate === "no" || gate === "not_sure") return true;
  return parseWeddingPartyLineup(answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0;
}

function isToastsSectionComplete(
  answers: Record<string, string | undefined>,
  showSection: boolean,
): boolean {
  if (!showSection) return true;

  const gate = resolveToastsGateAnswer(answers);
  if (!gate) return false;
  if (gate === "no" || gate === "not_sure") return true;
  return parseSpeechesToasts(answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0;
}

function visibleReceptionMomentQuestions(questions: PlanningQuestionDef[]): PlanningQuestionDef[] {
  return questions.filter(
    (question) =>
      question.id !== GRAND_ENTRANCE_PLANNING_LINEUP_KEY &&
      question.id !== SPEECHES_TOASTS_PLANNING_KEY,
  );
}

function receptionMomentsRequiredChecks(input: {
  answers: Record<string, string | undefined>;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
  visibleQuestions: PlanningQuestionDef[];
}): boolean[] {
  const checks: boolean[] = [];

  if (input.showWeddingPartyLineupSection) {
    const gate = resolveWeddingPartyGateAnswer(input.answers);
    checks.push(Boolean(gate));
    if (gate === "yes") {
      checks.push(
        parseWeddingPartyLineup(input.answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0,
      );
    }
  }

  if (input.showSpeechesToastsSection) {
    const gate = resolveToastsGateAnswer(input.answers);
    checks.push(Boolean(gate));
    if (gate === "yes") {
      checks.push(parseSpeechesToasts(input.answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0);
    }
  }

  for (const question of input.visibleQuestions) {
    checks.push(Boolean((input.answers[question.id] ?? "").trim()));
  }

  return checks;
}

export function computeReceptionMomentsChapterCompletionPct(input: {
  answers: Record<string, string | undefined>;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
  rowQuestions?: PlanningQuestionDef[];
}): number {
  const visibleQuestions = input.rowQuestions
    ? visibleReceptionMomentQuestions(input.rowQuestions)
    : [];

  const checks = receptionMomentsRequiredChecks({
    answers: input.answers,
    showWeddingPartyLineupSection: input.showWeddingPartyLineupSection,
    showSpeechesToastsSection: input.showSpeechesToastsSection,
    visibleQuestions,
  });

  if (checks.length === 0) return 0;

  const answered = checks.filter(Boolean).length;
  return Math.round((answered / checks.length) * 100);
}

export function countReceptionMomentsRequiredStepsAnswered(input: {
  answers: Record<string, string | undefined>;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
  rowQuestions?: PlanningQuestionDef[];
}): number {
  const visibleQuestions = input.rowQuestions
    ? visibleReceptionMomentQuestions(input.rowQuestions)
    : [];

  return receptionMomentsRequiredChecks({
    answers: input.answers,
    showWeddingPartyLineupSection: input.showWeddingPartyLineupSection,
    showSpeechesToastsSection: input.showSpeechesToastsSection,
    visibleQuestions,
  }).filter(Boolean).length;
}

export function countReceptionMomentsRequiredStepsTotal(input: {
  answers: Record<string, string | undefined>;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
  rowQuestions?: PlanningQuestionDef[];
}): number {
  const visibleQuestions = input.rowQuestions
    ? visibleReceptionMomentQuestions(input.rowQuestions)
    : [];

  return receptionMomentsRequiredChecks({
    answers: input.answers,
    showWeddingPartyLineupSection: input.showWeddingPartyLineupSection,
    showSpeechesToastsSection: input.showSpeechesToastsSection,
    visibleQuestions,
  }).length;
}

export function describeReceptionMomentsChapterMissingFields(input: {
  answers: Record<string, string | undefined>;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
}): string[] {
  const missing: string[] = [];

  if (input.showWeddingPartyLineupSection) {
    const gate = resolveWeddingPartyGateAnswer(input.answers);
    if (!gate) {
      missing.push("Wedding party introduction plan");
    } else if (gate === "yes" && parseWeddingPartyLineup(input.answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length === 0) {
      missing.push("Wedding party entrance");
    }
  }

  if (input.showSpeechesToastsSection) {
    const gate = resolveToastsGateAnswer(input.answers);
    if (!gate) {
      missing.push("Reception toast plan");
    } else if (gate === "yes" && parseSpeechesToasts(input.answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length === 0) {
      missing.push("Speeches / toasts");
    }
  }

  return missing;
}

export function buildReceptionMomentsChapterReviewIncompleteHint(input: {
  answers: Record<string, string | undefined>;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
}): string | null {
  const missing = describeReceptionMomentsChapterMissingFields(input);
  if (missing.length === 0) return null;
  if (missing.length === 1) return missing[0];
  return `Still needed — ${missing.join(", ")}.`;
}

export function isWeddingPartySectionCompleteForAnswers(
  answers: Record<string, string | undefined>,
  showSection: boolean,
): boolean {
  return isWeddingPartySectionComplete(answers, showSection);
}

export function isToastsSectionCompleteForAnswers(
  answers: Record<string, string | undefined>,
  showSection: boolean,
): boolean {
  return isToastsSectionComplete(answers, showSection);
}
