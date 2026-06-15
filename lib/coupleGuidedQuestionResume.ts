import type { CoupleWeddingChapterId } from "@/lib/coupleWeddingJourney";

export type CoupleGuidedQuestionPhase = "guided" | "review";

export type CoupleGuidedQuestionResumeMode = "restore" | "first-incomplete";

export type CoupleGuidedQuestionResume = {
  stepId: string;
  phase: CoupleGuidedQuestionPhase;
};

export function areCoupleGuidedQuestionResumesEqual(
  left: CoupleGuidedQuestionResume | null | undefined,
  right: CoupleGuidedQuestionResume | null | undefined,
): boolean {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return left.stepId === right.stepId && left.phase === right.phase;
}

export type CouplePlanningChapterGuidedResumeState = Partial<
  Record<CoupleWeddingChapterId, CoupleGuidedQuestionResume>
>;

export type GuidedStepForResume = {
  id: string;
  isAnswered: (answers: Record<string, string | undefined>) => boolean;
};

export function firstUnansweredGuidedStepIndex(
  steps: readonly GuidedStepForResume[],
  answers: Record<string, string | undefined>,
): number {
  return steps.findIndex((step) => !step.isAnswered(answers));
}

/** Resolve guided step + phase for mount, refresh restore, or Home Continue. */
export function resolveCoupleGuidedQuestionPosition(
  steps: readonly GuidedStepForResume[],
  answers: Record<string, string | undefined>,
  options: {
    mode: CoupleGuidedQuestionResumeMode;
    resume?: CoupleGuidedQuestionResume | null;
  },
): { phase: CoupleGuidedQuestionPhase; stepIndex: number } {
  if (steps.length === 0) {
    return { phase: "review", stepIndex: 0 };
  }

  if (options.mode === "restore" && options.resume?.stepId) {
    const savedIndex = steps.findIndex((step) => step.id === options.resume!.stepId);
    if (savedIndex >= 0) {
      const phase =
        options.resume.phase === "review" ? "review" : "guided";
      return { phase, stepIndex: savedIndex };
    }
  }

  const firstIncomplete = firstUnansweredGuidedStepIndex(steps, answers);
  if (firstIncomplete === -1) {
    return { phase: "review", stepIndex: 0 };
  }
  return { phase: "guided", stepIndex: firstIncomplete };
}
