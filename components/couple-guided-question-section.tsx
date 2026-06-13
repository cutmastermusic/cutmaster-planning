"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  PremiumCard,
  lightUiCyanPrimaryButtonClass,
  lightUiSecondaryButtonClass,
  premiumFormSectionCardClass,
} from "@/components/planning-ui";
import type { PlanningQuestionDef } from "@/types/planning";

const guidedNavButtonBaseClass =
  "relative z-[1] min-h-12 touch-manipulation rounded-xl px-3 py-2.5 text-[13px] font-medium leading-none tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 sm:min-h-11";

const guidedNavPrimaryClass = `w-full sm:w-auto sm:min-w-[7.5rem] ${lightUiCyanPrimaryButtonClass}`;
const guidedNavSecondaryClass = `w-full sm:w-auto sm:min-w-[7.5rem] ${lightUiSecondaryButtonClass}`;

/** Reserve space so fixed mobile nav does not cover the active question. */
const guidedStepContentSpacerClass =
  "pb-[calc(env(safe-area-inset-bottom,0px)+13rem)] md:pb-0";

/**
 * Mobile: portaled fixed bar above BottomNav (z-40).
 * Desktop: in-flow footer inside the card.
 */
const guidedNavFooterMobileClass =
  "pointer-events-auto fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-[55] touch-manipulation border-t border-stone-200/90 bg-white/98 px-5 py-3 shadow-[0_-4px_24px_-8px_rgba(28,25,23,0.15)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/95";

const guidedNavFooterDesktopClass =
  "pointer-events-auto flex touch-manipulation flex-col gap-2 border-t border-stone-200/90 pt-4";

const guidedNavFooterInnerClass = "pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col gap-2";

/** Blur focused field, then run the nav action. */
function useReliableNavAction(action: () => void, disabled = false) {
  return useCallback(() => {
    if (disabled) return;

    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT")
    ) {
      active.blur();
    }
    action();
  }, [action, disabled]);
}

function useGuidedNavHandlers(action: () => void, disabled = false) {
  const run = useReliableNavAction(action, disabled);
  const skipClickRef = useRef(false);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.pointerType === "mouse") return;

      event.preventDefault();
      skipClickRef.current = true;
      run();
    },
    [disabled, run],
  );

  const onClick = useCallback(() => {
    if (disabled) return;
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    run();
  }, [disabled, run]);

  return { onPointerDown, onClick };
}

function GuidedNavButton({
  children,
  onAction,
  disabled = false,
  className,
  /** When true, only onClick runs the action (avoids ghost taps after footer swaps). */
  clickOnly = false,
}: {
  children: ReactNode;
  onAction: () => void;
  disabled?: boolean;
  className?: string;
  clickOnly?: boolean;
}) {
  const { onPointerDown, onClick } = useGuidedNavHandlers(onAction, disabled);

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${guidedNavButtonBaseClass} ${className ?? ""}`.trim()}
      onPointerDown={clickOnly ? undefined : onPointerDown}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function GuidedNavTextButton({
  children,
  onAction,
  className,
}: {
  children: ReactNode;
  onAction: () => void;
  className?: string;
}) {
  const { onPointerDown, onClick } = useGuidedNavHandlers(onAction);

  return (
    <button
      type="button"
      className={className}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

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
  return steps
    .filter((step) => !step.optional)
    .filter((step) => step.isAnswered(answers)).length;
}

function countProgressSteps(steps: CoupleGuidedQuestionStep[]): number {
  return steps.filter((step) => !step.optional).length;
}

type Phase = "guided" | "review";

export type CoupleGuidedQuestionStep = {
  id: string;
  isAnswered: (answers: Record<string, string | undefined>) => boolean;
  /** When true, step is excluded from the progress bar count (still required for review completion). */
  optional?: boolean;
  /** Human-readable label for missing-field review hints. */
  missingLabel?: string;
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
  completionTitle?: string;
  completionBody?: string;
  completionPrimaryLabel?: string;
  onCompletionPrimary?: () => void;
  completionSecondaryLabel?: string;
  onCompletionSecondary?: () => void;
  onContinueToNextChapter?: () => void | Promise<void>;
  continueToNextChapterLabel?: string;
  /** Shown on review when required steps are still incomplete. */
  reviewIncompleteHint?: string | null;
  /** Shown when chapter continue was blocked after review (e.g. stale or unsaved answers). */
  continueBlockedMessage?: string | null;
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
    missingLabel: question.label,
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

function GuidedNavFooter({ children }: { children: ReactNode }) {
  const [useMobilePortal, setUseMobilePortal] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setUseMobilePortal(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const inner = <div className={guidedNavFooterInnerClass}>{children}</div>;

  if (useMobilePortal && typeof document !== "undefined") {
    return createPortal(
      <div className={guidedNavFooterMobileClass} role="navigation" aria-label="Guided question steps">
        {inner}
      </div>,
      document.body,
    );
  }

  return (
    <div className={guidedNavFooterDesktopClass} role="navigation" aria-label="Guided question steps">
      {inner}
    </div>
  );
}

export function CoupleGuidedQuestionSection({
  sectionId,
  eyebrow,
  title,
  intro,
  steps,
  answers,
  completionMessage = "Thanks — this helps us create a celebration that feels like you.",
  completionTitle,
  completionBody,
  completionPrimaryLabel,
  onCompletionPrimary,
  completionSecondaryLabel,
  onCompletionSecondary,
  onContinueToNextChapter,
  continueToNextChapterLabel = "Continue to next chapter",
  reviewIncompleteHint = null,
  continueBlockedMessage = null,
}: CoupleGuidedQuestionSectionProps) {
  const flowStepCount = steps.length;
  const requiredStepCount = countProgressSteps(steps);
  const answered = useMemo(() => countAnsweredSteps(steps, answers), [steps, answers]);
  const progressPct =
    requiredStepCount === 0 ? 100 : Math.round((answered / requiredStepCount) * 100);
  const allAnswered = steps.length > 0 && steps.every((step) => step.isAnswered(answers));

  const [phase, setPhase] = useState<Phase>(() => {
    if (flowStepCount === 0) return "review";
    return firstUnansweredStepIndex(steps, answers) === -1 ? "review" : "guided";
  });
  const [stepIndex, setStepIndex] = useState(() => {
    if (flowStepCount === 0) return 0;
    const idx = firstUnansweredStepIndex(steps, answers);
    return idx === -1 ? 0 : idx;
  });

  const stepContentRef = useRef<HTMLDivElement>(null);
  /** Blocks ghost taps on review footer right after entering review from guided nav. */
  const reviewTransitionGuardRef = useRef(false);
  const reviewTransitionTimerRef = useRef<number | null>(null);

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex <= 0;
  const isLastStep = stepIndex >= steps.length - 1;
  const activeStepId = currentStep?.id;

  const enterReview = useCallback(() => {
    reviewTransitionGuardRef.current = true;
    if (reviewTransitionTimerRef.current !== null) {
      window.clearTimeout(reviewTransitionTimerRef.current);
    }
    reviewTransitionTimerRef.current = window.setTimeout(() => {
      reviewTransitionGuardRef.current = false;
      reviewTransitionTimerRef.current = null;
    }, 450);
    setPhase("review");
  }, []);

  useEffect(() => {
    return () => {
      if (reviewTransitionTimerRef.current !== null) {
        window.clearTimeout(reviewTransitionTimerRef.current);
      }
    };
  }, []);

  const goToReview = useCallback(() => {
    enterReview();
  }, [enterReview]);

  const goToGuided = useCallback(() => {
    if (reviewTransitionGuardRef.current) return;
    const idx = firstUnansweredStepIndex(steps, answers);
    setStepIndex(idx === -1 ? Math.max(0, steps.length - 1) : idx);
    setPhase("guided");
  }, [steps, answers]);

  const goPrevious = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    let shouldEnterReview = false;
    setStepIndex((prev) => {
      if (prev >= steps.length - 1) {
        shouldEnterReview = true;
        return prev;
      }
      return prev + 1;
    });
    if (shouldEnterReview) {
      enterReview();
    }
  }, [steps.length, enterReview]);

  useEffect(() => {
    if (phase !== "guided" || !activeStepId) return;
    if (typeof window === "undefined") return;

    const focusTarget = stepContentRef.current?.querySelector<HTMLElement>(
      "input:not([type='hidden']), textarea, select",
    );
    if (!focusTarget) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    requestAnimationFrame(() => {
      focusTarget.focus({ preventScroll: true });
      focusTarget.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    });
  }, [phase, stepIndex, activeStepId]);

  if (flowStepCount === 0) {
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
              ? `Step ${stepIndex + 1} of ${flowStepCount}`
              : `${answered} of ${requiredStepCount} required answered`}
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
        <>
          <div
            ref={stepContentRef}
            className={`mt-6 ${guidedStepContentSpacerClass}`}
          >
            {currentStep.renderGuided()}
          </div>
          <GuidedNavFooter>
            <GuidedNavTextButton
              onAction={goToReview}
              className="min-h-12 touch-manipulation self-start rounded-lg px-3 py-3 text-left text-sm font-semibold text-stone-700 underline-offset-2 transition hover:text-stone-950 hover:underline active:bg-stone-100/80 active:text-stone-950 active:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D4FF]/60"
            >
              See all answers so far
            </GuidedNavTextButton>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <GuidedNavButton
                onAction={goPrevious}
                disabled={isFirstStep}
                className={guidedNavSecondaryClass}
              >
                Previous
              </GuidedNavButton>
              <GuidedNavButton onAction={goNext} className={guidedNavPrimaryClass}>
                {isLastStep ? "Finish & review chapter" : "Next"}
              </GuidedNavButton>
            </div>
          </GuidedNavFooter>
        </>
      ) : phase === "review" ? (
        <div className="mt-6 space-y-5">
          {!allAnswered && reviewIncompleteHint ? (
            <div
              className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-4"
              role="status"
            >
              <p className="text-sm font-semibold text-amber-950">A few details are still needed</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-950">{reviewIncompleteHint}</p>
            </div>
          ) : null}
          {continueBlockedMessage ? (
            <div
              className="rounded-xl border border-rose-200/90 bg-rose-50/90 px-4 py-4"
              role="alert"
            >
              <p className="text-sm font-semibold text-rose-950">A few answers are still needed</p>
              <p className="mt-2 text-sm leading-relaxed text-rose-950">{continueBlockedMessage}</p>
            </div>
          ) : null}
          {allAnswered ? (
            completionTitle && completionBody ? (
              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-4">
                <h4 className="text-base font-semibold text-emerald-950">{completionTitle}</h4>
                <p className="mt-2 text-sm leading-relaxed text-emerald-950">{completionBody}</p>
              </div>
            ) : (
              <p className="rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-3 text-sm leading-relaxed text-emerald-950">
                {completionMessage}
              </p>
            )
          ) : null}
          <div className={`flex flex-col gap-5 ${guidedStepContentSpacerClass} md:pb-0`}>
            {steps.map((step) => (
              <div key={step.id}>{step.renderReview()}</div>
            ))}
          </div>
          <GuidedNavFooter>
            {allAnswered && (onCompletionPrimary ?? onContinueToNextChapter) ? (
              <GuidedNavButton
                onAction={() => (onCompletionPrimary ?? onContinueToNextChapter)?.()}
                className={`w-full sm:w-auto sm:min-w-[12rem] ${lightUiCyanPrimaryButtonClass}`}
              >
                {completionPrimaryLabel ?? continueToNextChapterLabel}
              </GuidedNavButton>
            ) : null}
            {allAnswered && onCompletionSecondary ? (
              <GuidedNavButton
                onAction={onCompletionSecondary}
                className={`w-full sm:w-auto sm:min-w-[12rem] ${lightUiSecondaryButtonClass}`}
              >
                {completionSecondaryLabel ?? "Continue"}
              </GuidedNavButton>
            ) : null}
            {!allAnswered ? (
              <GuidedNavButton
                onAction={goToGuided}
                clickOnly
                className={`w-full sm:w-auto sm:min-w-[10rem] ${lightUiSecondaryButtonClass}`}
              >
                Go to unanswered questions
              </GuidedNavButton>
            ) : (
              <GuidedNavButton
                onAction={goToGuided}
                clickOnly
                className={`w-full sm:w-auto sm:min-w-[10rem] ${lightUiSecondaryButtonClass}`}
              >
                Edit answers one at a time
              </GuidedNavButton>
            )}
          </GuidedNavFooter>
        </div>
      ) : null}
    </PremiumCard>
  );
}
