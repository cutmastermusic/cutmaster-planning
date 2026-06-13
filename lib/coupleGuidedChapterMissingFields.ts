export type GuidedChapterMissingFieldStep = {
  optional?: boolean;
  missingLabel?: string;
  isAnswered: (answers: Record<string, string | undefined>) => boolean;
};

export function describeGuidedChapterMissingFields(
  steps: GuidedChapterMissingFieldStep[],
  answers: Record<string, string | undefined>,
): string[] {
  return steps
    .filter((step) => !step.optional && !step.isAnswered(answers))
    .map((step) => step.missingLabel?.trim() || "One more prompt");
}

export function formatGuidedChapterMissingSummary(missingLabels: string[]): string | null {
  if (missingLabels.length === 0) return null;
  if (missingLabels.length === 1) {
    return missingLabels[0];
  }
  if (missingLabels.length <= 3) {
    return `Still needed — ${missingLabels.join(", ")}.`;
  }
  return `Still needed — ${missingLabels.slice(0, 3).join(", ")}, and ${missingLabels.length - 3} more.`;
}

export function buildGuidedChapterReviewIncompleteHint(
  steps: GuidedChapterMissingFieldStep[],
  answers: Record<string, string | undefined>,
): string | null {
  return formatGuidedChapterMissingSummary(describeGuidedChapterMissingFields(steps, answers));
}
