/** Ceremony chapter — planning question IDs and checkpoint logic. */

export const CEREMONY_CHAPTER_QUESTION_IDS = {
  cutmasterServices: "pq_ceremony_cutmaster_services",
  startTime: "pq_ceremony_start_time",
  location: "pq_ceremony_location",
  locationDetails: "pq_ceremony_location_details",
} as const;

/** Legacy ceremony prompt retained in saved events; not shown in the couple Ceremony flow. */
export const CEREMONY_LEGACY_QUESTION_IDS = ["pq_ceremony"] as const;

export const CEREMONY_CUTMASTER_SERVICES_OPTIONS = ["Yes", "No", "Not sure yet"] as const;

export type CeremonyCutmasterServicesAnswer = "yes" | "no" | "not_sure";

export const CEREMONY_LOCATION_OPTIONS = [
  "Same location as reception",
  "Different location",
  "Not sure yet",
] as const;

export type CeremonyLocationAnswer = "same_as_reception" | "different" | "not_sure";

const CEREMONY_SERVICES_LABEL_TO_VALUE: Record<
  (typeof CEREMONY_CUTMASTER_SERVICES_OPTIONS)[number],
  CeremonyCutmasterServicesAnswer
> = {
  Yes: "yes",
  No: "no",
  "Not sure yet": "not_sure",
};

const CEREMONY_SERVICES_VALUE_TO_LABEL: Record<CeremonyCutmasterServicesAnswer, string> = {
  yes: "Yes",
  no: "No",
  not_sure: "Not sure yet",
};

const CEREMONY_LOCATION_LABEL_TO_VALUE: Record<
  (typeof CEREMONY_LOCATION_OPTIONS)[number],
  CeremonyLocationAnswer
> = {
  "Same location as reception": "same_as_reception",
  "Different location": "different",
  "Not sure yet": "not_sure",
};

const CEREMONY_LOCATION_VALUE_TO_LABEL: Record<CeremonyLocationAnswer, string> = {
  same_as_reception: "Same location as reception",
  different: "Different location",
  not_sure: "Not sure yet",
};

export function normalizeCeremonyCutmasterServicesAnswer(
  raw: string | undefined,
): CeremonyCutmasterServicesAnswer | "" {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (trimmed === "yes" || trimmed === "no" || trimmed === "not_sure") {
    return trimmed;
  }
  if (trimmed === "not sure" || trimmed === "not sure yet") {
    return "not_sure";
  }
  return "";
}

export function ceremonyCutmasterServicesLabelFromValue(
  value: CeremonyCutmasterServicesAnswer | "",
): string {
  if (!value) return "";
  return CEREMONY_SERVICES_VALUE_TO_LABEL[value];
}

export function ceremonyCutmasterServicesValueFromLabel(label: string): CeremonyCutmasterServicesAnswer | "" {
  return CEREMONY_SERVICES_LABEL_TO_VALUE[label as (typeof CEREMONY_CUTMASTER_SERVICES_OPTIONS)[number]] ?? "";
}

export function normalizeCeremonyLocationAnswer(raw: string | undefined): CeremonyLocationAnswer | "" {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (
    trimmed === "same_as_reception" ||
    trimmed === "different" ||
    trimmed === "not_sure"
  ) {
    return trimmed;
  }
  if (trimmed === "same location as reception" || trimmed === "same") {
    return "same_as_reception";
  }
  if (trimmed === "different location") {
    return "different";
  }
  if (trimmed === "not sure" || trimmed === "not sure yet") {
    return "not_sure";
  }
  return "";
}

export function ceremonyLocationLabelFromValue(value: CeremonyLocationAnswer | ""): string {
  if (!value) return "";
  return CEREMONY_LOCATION_VALUE_TO_LABEL[value];
}

export function ceremonyLocationValueFromLabel(label: string): CeremonyLocationAnswer | "" {
  return CEREMONY_LOCATION_LABEL_TO_VALUE[label as (typeof CEREMONY_LOCATION_OPTIONS)[number]] ?? "";
}

export function hasLegacyCeremonyPlanningAnswer(
  answers: Record<string, string | undefined>,
): boolean {
  return Boolean((answers.pq_ceremony ?? "").trim());
}

function isCeremonyLocationAnswered(answers: Record<string, string | undefined>): boolean {
  const location = normalizeCeremonyLocationAnswer(answers[CEREMONY_CHAPTER_QUESTION_IDS.location]);
  if (!location) return false;
  if (location === "different") {
    return Boolean((answers[CEREMONY_CHAPTER_QUESTION_IDS.locationDetails] ?? "").trim());
  }
  return true;
}

function ceremonyRequiredChecks(answers: Record<string, string | undefined>): boolean[] {
  if (hasLegacyCeremonyPlanningAnswer(answers)) {
    return [true];
  }

  const services = normalizeCeremonyCutmasterServicesAnswer(
    answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
  );
  if (!services) return [false];

  return [true, isCeremonyLocationAnswered(answers)];
}

/** Max guided required steps for the couple ceremony chapter (audio + location). */
export const CEREMONY_GUIDED_MAX_STEP_COUNT = 2;

export function computeCeremonyChapterCompletionPct(
  answers: Record<string, string | undefined>,
): number {
  const checks = ceremonyRequiredChecks(answers);
  const answered = checks.filter(Boolean).length;
  return Math.round((answered / checks.length) * 100);
}

export function countCeremonyRequiredStepsAnswered(
  answers: Record<string, string | undefined>,
): number {
  return ceremonyRequiredChecks(answers).filter(Boolean).length;
}

export function countCeremonyRequiredStepsTotal(
  answers: Record<string, string | undefined>,
): number {
  return ceremonyRequiredChecks(answers).length;
}

export function isCeremonyChapterComplete(answers: Record<string, string | undefined>): boolean {
  return computeCeremonyChapterCompletionPct(answers) >= 100;
}

export function describeCeremonyChapterMissingFields(
  answers: Record<string, string | undefined>,
): string[] {
  if (hasLegacyCeremonyPlanningAnswer(answers)) {
    return [];
  }

  const missing: string[] = [];
  const services = normalizeCeremonyCutmasterServicesAnswer(
    answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
  );

  if (!services) {
    missing.push("Ceremony audio/services with Cutmaster Music");
    return missing;
  }

  const location = normalizeCeremonyLocationAnswer(answers[CEREMONY_CHAPTER_QUESTION_IDS.location]);
  if (!location) {
    missing.push("Ceremony location");
  } else if (location === "different" && !(answers[CEREMONY_CHAPTER_QUESTION_IDS.locationDetails] ?? "").trim()) {
    missing.push("Ceremony location details");
  }

  return missing;
}

export function formatCeremonyChapterMissingSummary(
  missingLabels: string[],
): string | null {
  if (missingLabels.length === 0) return null;
  if (missingLabels.length === 1) {
    return missingLabels[0];
  }
  return `Still needed — ${missingLabels.join(", ")}.`;
}

export function buildCeremonyChapterReviewIncompleteHint(
  answers: Record<string, string | undefined>,
): string | null {
  return formatCeremonyChapterMissingSummary(describeCeremonyChapterMissingFields(answers));
}
