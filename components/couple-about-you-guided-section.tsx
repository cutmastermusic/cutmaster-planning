"use client";

import type { ReactNode } from "react";

import {
  CoupleGuidedQuestionSection,
  questionGuidedStep,
} from "@/components/couple-guided-question-section";
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
};

export function CoupleAboutYouGuidedSection({
  questions,
  answers,
  onAnswerChange,
  renderEditor,
  onContinueToNextChapter,
  continueToNextChapterLabel,
}: CoupleAboutYouGuidedSectionProps) {
  const steps = questions.map((question) =>
    questionGuidedStep(question, renderEditor, onAnswerChange, answers),
  );

  return (
    <CoupleGuidedQuestionSection
      sectionId="about-you-guided"
      eyebrow="About You"
      title="Let's start with the two of you"
      intro="Before we talk about timelines, music, and logistics, tell us a little about yourselves."
      steps={steps}
      answers={answers}
      onContinueToNextChapter={onContinueToNextChapter}
      continueToNextChapterLabel={continueToNextChapterLabel}
    />
  );
}
