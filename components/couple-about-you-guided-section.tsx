"use client";

import { useMemo, type ReactNode } from "react";

import {
  CoupleGuidedQuestionSection,
  questionGuidedStep,
  type CoupleGuidedQuestionStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import { TextInput } from "@/components/planning-ui";
import {
  couplePlanningEmptyAnswerClass,
  couplePlanningQuestionLabelClass,
  couplePlanningQuestionShellClass,
} from "@/components/couple-planning-ui";
import { buildGuidedChapterReviewIncompleteHint } from "@/lib/coupleGuidedChapterMissingFields";
import { EVENT_DETAILS_QUESTION_IDS } from "@/lib/couplePlanningExtendedQuestions";
import type { PlanningQuestionDef } from "@/types/planning";

export type CoupleAboutYouGuidedSectionProps = {
  questions: PlanningQuestionDef[];
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  renderEditor: (props: {
    question: PlanningQuestionDef;
    value: string;
    onChange: (next: string) => void;
  }) => ReactNode;
  onContinueToNextChapter?: () => void;
  continueToNextChapterLabel?: string;
} & CoupleGuidedResumeProps;

export function CoupleAboutYouGuidedSection({
  questions,
  answers,
  onAnswerChange,
  renderEditor,
  onContinueToNextChapter,
  continueToNextChapterLabel,
  guidedResume,
  guidedResumeMode,
  onGuidedResumeChange,
}: CoupleAboutYouGuidedSectionProps) {
  const coreQuestions = useMemo(
    () => questions.filter((question) => question.id !== EVENT_DETAILS_QUESTION_IDS.expectedGuestCount),
    [questions],
  );

  const steps = useMemo((): CoupleGuidedQuestionStep[] => {
    const built = coreQuestions.map((question) =>
      questionGuidedStep(question, renderEditor, onAnswerChange, answers),
    );

    built.push({
      id: "about-you-event-details-intro",
      optional: true,
      isAnswered: () => true,
      renderGuided: () => (
        <div className={couplePlanningQuestionShellClass}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f4a3e]/75">
            Event Details
          </p>
          <p className={`mt-3 ${couplePlanningQuestionLabelClass}`}>
            How many guests are you expecting?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            A rough number helps us plan sound, flow, and staffing — you can update it anytime.
          </p>
          <div className="mt-4">
            <TextInput
              id="about-you-expected-guest-count"
              label="Expected guest count"
              value={answers[EVENT_DETAILS_QUESTION_IDS.expectedGuestCount] ?? ""}
              onChange={(next) =>
                onAnswerChange(EVENT_DETAILS_QUESTION_IDS.expectedGuestCount, next.replace(/[^\d]/g, ""))
              }
              placeholder="e.g. 150"
              labelClassName={`block ${couplePlanningQuestionLabelClass}`}
            />
          </div>
        </div>
      ),
      renderReview: () => (
        <div className={couplePlanningQuestionShellClass}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f4a3e]/75">
            Event Details
          </p>
          <p className={`mt-3 ${couplePlanningQuestionLabelClass}`}>Expected guest count</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-900">
            {(answers[EVENT_DETAILS_QUESTION_IDS.expectedGuestCount] ?? "").trim() || (
              <span className={couplePlanningEmptyAnswerClass}>Not answered yet</span>
            )}
          </p>
        </div>
      ),
    });

    return built;
  }, [answers, coreQuestions, onAnswerChange, renderEditor]);

  const reviewIncompleteHint = useMemo(
    () => buildGuidedChapterReviewIncompleteHint(steps, answers),
    [steps, answers],
  );

  return (
    <CoupleGuidedQuestionSection
      sectionId="about-you-guided"
      eyebrow="About You"
      title="Let's start with the two of you"
      intro="Before we talk about timelines, music, and logistics, tell us a little about yourselves."
      steps={steps}
      answers={answers}
      reviewIncompleteHint={reviewIncompleteHint}
      onContinueToNextChapter={onContinueToNextChapter}
      continueToNextChapterLabel={continueToNextChapterLabel}
      guidedResume={guidedResume}
      guidedResumeMode={guidedResumeMode}
      onGuidedResumeChange={onGuidedResumeChange}
    />
  );
}
