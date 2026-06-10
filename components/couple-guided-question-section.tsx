"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  PremiumCard,
  PrimaryButton,
  lightUiCyanPrimaryButtonClass,
  lightUiSecondaryButtonClass,
  premiumFormSectionCardClass,
} from "@/components/planning-ui";
import type { PlanningQuestionDef } from "@/types/planning";

function firstUnansweredStepIndex(
  steps: CoupleGuidedQuestionStep[],
  answers: Record<string, string | undefined>,
): number {
  return steps.findIndex((step) => !step.isAnswered(answers));
}

function countAnsweredSteps(
  steps: CoupleGuidedQuestionStep[],
  answers: Record<string, string | undefined>,
): number {
  return steps.filter((step) => step.isAnswered(answers)).length;
}

type Phase = "guided" | "review";

export type CoupleGuidedQuestionStep = {
  id: string;
  isAnswered: (answers: Record<string, string | undefined>) => boolean;
  renderGuided: () => ReactNode;
  renderReview: () => ReactNode;
};

export type CoupleGuidedQuestionSectionProps = {
  sectionId: string;
  eyebrow: string;
  title: string;
  intro: string;
  steps: CoupleGuidedQuestionStep[];
  answers: Record<string, string | undefined>;
  completionMessage?: string;
  onContinueToNextChapter?: () => void;
  continueToNextChapterLabel?: string;
};

export function questionGuidedStep(
  question: PlanningQuestionDef,
  renderEditor: (props: {
    question: PlanningQuestionDef;
    value: string;
    onChange: (next: string) => void;
  }) => ReactNode,
  onAnswerChange: (questionId: string, next: string) => void,
  answers: Record<string, string | undefined>,
): CoupleGuidedQuestionStep {
  return {
    id: question.id,
    isAnswered: (nextAnswers) => Boolean((nextAnswers[question.id] ?? "").trim()),
    renderGuided: () =>
      renderEditor({
        question,
        value: answers[question.id] ?? "",
        onChange: (next) => onAnswerChange(question.id, next),
      }),
    renderReview: () =>
      renderEditor({
        question,
        value: answers[question.id] ?? "",
        onChange: (next) => onAnswerChange(question.id, next),
      }),
  };
}

export function CoupleGuidedQuestionSection({
  sectionId,
  eyebrow,
  title,
  intro,
  steps,
  answers,
  completionMessage = "Thanks — this helps us create a celebration that feels like you.",
  onContinueToNextChapter,
  continueToNextChapterLabel = "Continue to next chapter",
}: CoupleGuidedQuestionSectionProps) {
  const total = steps.length;
  const answered = useMemo(() => countAnsweredSteps(steps, answers), [steps, answers]);
  const progressPct = total === 0 ? 100 : Math.round((answered / total) * 100);
  const allAnswered = total > 0 && answered === total;

  const [phase, setPhase] = useState<Phase>(() => {
    if (total === 0) return "review";
    return firstUnansweredStepIndex(steps, answers) === -1 ? "review" : "guided";
  });
  const [stepIndex, setStepIndex] = useState(() => {
    if (total === 0) return 0;
    const idx = firstUnansweredStepIndex(steps, answers);
    return idx === -1 ? 0 : idx;
  });

  const stepRegionRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex <= 0;
  const isLastStep = stepIndex >= total - 1;

  const goToReview = useCallback(() => {
    setPhase("review");
  }, []);

  const goToGuided = useCallback(() => {
    const idx = firstUnansweredStepIndex(steps, answers);
    setStepIndex(idx === -1 ? 0 : idx);
    setPhase("guided");
  }, [steps, answers]);

  const goPrevious = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    if (isLastStep) {
      goToReview();
      return;
    }
    setStepIndex((prev) => Math.min(total - 1, prev + 1));
  }, [goToReview, isLastStep, total]);

  useEffect(() => {
    if (phase !== "guided" || !currentStep) return;
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focusTarget = stepRegionRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button:not([disabled])",
    );
    focusTarget?.focus({ preventScroll: true });
    stepRegionRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [phase, stepIndex, currentStep]);

  if (total === 0) {
    return null;
  }

  return (
    <PremiumCard
      id={sectionId}
      className={premiumFormSectionCardClass}
      aria-labelledby={`${sectionId}-title`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{eyebrow}</p>
      <h3
        id={`${sectionId}-title`}
        className="mt-2 text-lg font-semibold leading-snug text-stone-950 sm:text-xl"
      >
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">{intro}</p>

      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium tabular-nums text-stone-800">
          <span>
            {phase === "guided"
              ? `Question ${stepIndex + 1} of ${total}`
              : `${answered} of ${total} answered`}
          </span>
          <span className="text-xs font-normal text-stone-600">{progressPct}% complete</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-[var(--cm-accent)] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {phase === "guided" && currentStep ? (
        <div ref={stepRegionRef} className="mt-6 space-y-5">
          {currentStep.renderGuided()}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goToReview}
              className="min-h-11 self-start px-1 py-2 text-left text-sm font-semibold text-stone-700 underline-offset-2 hover:text-stone-950 hover:underline"
            >
              Review all answers
            </button>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <PrimaryButton
                type="button"
                onClick={goPrevious}
                disabled={isFirstStep}
                className={`w-full sm:w-auto sm:min-w-[7.5rem] ${lightUiSecondaryButtonClass}`}
              >
                Previous
              </PrimaryButton>
              <PrimaryButton
                type="button"
                onClick={goNext}
                className={`w-full sm:w-auto sm:min-w-[7.5rem] ${lightUiCyanPrimaryButtonClass}`}
              >
                {isLastStep ? "Review answers" : "Next"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {allAnswered ? (
            <p className="rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-3 text-sm leading-relaxed text-emerald-950">
              {completionMessage}
            </p>
          ) : null}
          <div className="flex flex-col gap-5">
            {steps.map((step) => (
              <div key={step.id}>{step.renderReview()}</div>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
            {allAnswered && onContinueToNextChapter ? (
              <PrimaryButton
                type="button"
                onClick={onContinueToNextChapter}
                className={`w-full sm:w-auto sm:min-w-[12rem] ${lightUiCyanPrimaryButtonClass}`}
              >
                {continueToNextChapterLabel}
              </PrimaryButton>
            ) : null}
            <PrimaryButton
              type="button"
              onClick={goToGuided}
              className={`w-full sm:w-auto sm:min-w-[10rem] ${lightUiSecondaryButtonClass}`}
            >
              Continue one at a time
            </PrimaryButton>
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
