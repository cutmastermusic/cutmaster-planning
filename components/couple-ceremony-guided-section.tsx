"use client";

import { useMemo } from "react";

import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import {
  CoupleGuidedQuestionSection,
  type CoupleGuidedQuestionStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import {
  couplePlanningEmptyAnswerClass,
  couplePlanningQuestionLabelClass,
  couplePlanningQuestionShellClass,
} from "@/components/couple-planning-ui";
import {
  CEREMONY_CHAPTER_QUESTION_IDS,
  CEREMONY_HAPPENING_OPTIONS,
  buildCeremonyChapterReviewIncompleteHint,
  ceremonyHappeningLabelFromValue,
  ceremonyHappeningValueFromLabel,
  normalizeCeremonyHappeningAnswer,
} from "@/lib/coupleCeremonyPlanning";

const planningQuestionFieldShellClass = couplePlanningQuestionShellClass;

export type CoupleCeremonyGuidedSectionProps = {
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  onContinueToNextChapter?: () => void;
  continueToNextChapterLabel?: string;
} & CoupleGuidedResumeProps;

export function CoupleCeremonyGuidedSection({
  answers,
  onAnswerChange,
  onContinueToNextChapter,
  continueToNextChapterLabel,
  guidedResume,
  guidedResumeMode,
  onGuidedResumeChange,
}: CoupleCeremonyGuidedSectionProps) {
  const hasCeremonyValue = normalizeCeremonyHappeningAnswer(
    answers[CEREMONY_CHAPTER_QUESTION_IDS.hasCeremony],
  );

  const steps = useMemo((): CoupleGuidedQuestionStep[] => {
    const setSingle = (questionId: string, next: string) => onAnswerChange(questionId, next);

    const renderSingleReview = (label: string, raw: string | undefined) => (
      <div className={planningQuestionFieldShellClass}>
        <p className={couplePlanningQuestionLabelClass}>{label}</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-900">
          {(raw ?? "").trim() || <span className={couplePlanningEmptyAnswerClass}>Not answered</span>}
        </p>
      </div>
    );

    const hasCeremonyStep: CoupleGuidedQuestionStep = {
      id: "ceremony-happening",
      missingLabel: "Whether you are having a ceremony",
      isAnswered: (nextAnswers) =>
        Boolean(
          normalizeCeremonyHappeningAnswer(
            nextAnswers[CEREMONY_CHAPTER_QUESTION_IDS.hasCeremony],
          ),
        ),
      renderGuided: () => (
        <CouplePlanningChipSelect
          label="Will you be having a ceremony?"
          helperText="This simply tells us whether ceremony planning should stay visible for this event."
          mode="single"
          options={CEREMONY_HAPPENING_OPTIONS}
          value={ceremonyHappeningLabelFromValue(
            normalizeCeremonyHappeningAnswer(
              answers[CEREMONY_CHAPTER_QUESTION_IDS.hasCeremony],
            ),
          )}
          onChange={(next) =>
            setSingle(
              CEREMONY_CHAPTER_QUESTION_IDS.hasCeremony,
              ceremonyHappeningValueFromLabel(next as string),
            )
          }
        />
      ),
      renderReview: () =>
        renderSingleReview(
          "Will you be having a ceremony?",
          ceremonyHappeningLabelFromValue(
            normalizeCeremonyHappeningAnswer(answers[CEREMONY_CHAPTER_QUESTION_IDS.hasCeremony]),
          ),
        ),
    };

    return [hasCeremonyStep];
  }, [answers, onAnswerChange]);

  const reviewIncompleteHint = useMemo(
    () => buildCeremonyChapterReviewIncompleteHint(answers),
    [answers],
  );

  return (
    <CoupleGuidedQuestionSection
      sectionId="ceremony-guided"
      eyebrow="Ceremony"
      title="Ceremony"
      intro="A quick checkpoint so we know whether ceremony planning should stay part of this event."
      steps={steps}
      answers={answers}
      reviewIncompleteHint={reviewIncompleteHint}
      completionMessage={
        hasCeremonyValue === "no"
          ? "Thanks — we’ll keep the couple flow focused on the reception."
          : "Thanks — ceremony planning will stay visible for this event."
      }
      onContinueToNextChapter={onContinueToNextChapter}
      continueToNextChapterLabel={continueToNextChapterLabel}
      guidedResume={guidedResume}
      guidedResumeMode={guidedResumeMode}
      onGuidedResumeChange={onGuidedResumeChange}
    />
  );
}
