"use client";

import { useMemo, type ReactNode } from "react";

import {
  CoupleGuidedQuestionSection,
  questionGuidedStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import { buildGuidedChapterReviewIncompleteHint } from "@/lib/coupleGuidedChapterMissingFields";
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
  const steps = useMemo(
    () => questions.map((question) => questionGuidedStep(question, renderEditor, onAnswerChange, answers)),
    [questions, renderEditor, onAnswerChange, answers],
  );
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
