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
  couplePortalPrimaryButtonClass,
  couplePortalSecondaryButtonClass,
} from "@/components/planning-ui";
import {
  couplePlanningEyebrowClass,
  couplePlanningIntroClass,
  couplePlanningSectionCardClass,
  couplePlanningTitleClass,
} from "@/components/couple-planning-ui";
import {
  firstUnansweredGuidedStepIndex,
  resolveCoupleGuidedQuestionPosition,
  areCoupleGuidedQuestionResumesEqual,
  type CoupleGuidedQuestionResume,
  type CoupleGuidedQuestionResumeMode,
} from "@/lib/coupleGuidedQuestionResume";
import type { PlanningQuestionDef } from "@/types/planning";

const guidedNavButtonBaseClass =
  "relative z-[1] min-h-12 touch-manipulation rounded-xl px-3 py-2.5 text-[13px] font-medium leading-none tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 sm:min-h-11";

const guidedNavPrimaryClass = `w-full sm:w-auto sm:min-w-[7.5rem] ${couplePortalPrimaryButtonClass}`;
const guidedNavSecondaryClass = `w-full sm:w-auto sm:min-w-[7.5rem] ${couplePortalSecondaryButtonClass}`;

/** Reserve space so fixed mobile nav does not cover the active question. */
const guidedStepContentSpacerClass =
  "pb-[calc(env(safe-area-inset-bottom,0px)+13rem)] md:pb-0";

/**
 * Mobile: portaled fixed bar above BottomNav (z-40).
 * Desktop: in-flow footer inside the card.
 */
const guidedNavFooterMobileClass =
  "pointer-events-auto fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-[55] touch-manipulation border-t border-stone-200/60 bg-[#f8f6f2]/98 px-5 py-3.5 shadow-[0_-4px_24px_-8px_rgba(28,25,23,0.12)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#f8f6f2]/95";

const guidedNavFooterDesktopClass =
  "pointer-events-auto flex touch-manipulation flex-col gap-2.5 border-t border-stone-200/60 pt-6";

const guidedNavFooterInnerClass = "pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col gap-2";

/** Blur focused field, then run the nav action (sync or async). */
function useReliableNavAction(action: () => void | Promise<void>, disabled = false) {
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
    void Promise.resolve(action());
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
  onAction: () => void | Promise<void>;
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
  onAction: () => void | Promise<void>;
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
  return firstUnansweredGuidedStepIndex(steps, answers);
}

export type CoupleGuidedResumeProps = {
  /** Saved step for refresh / journey resume. */
  guidedResume?: CoupleGuidedQuestionResume | null;
  /** Restore saved step on mount, or open at first incomplete (Home Continue). */
  guidedResumeMode?: CoupleGuidedQuestionResumeMode;
  onGuidedResumeChange?: (resume: CoupleGuidedQuestionResume) => void;
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
} & CoupleGuidedResumeProps;

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
  guidedResume = null,
  guidedResumeMode = "restore",
  onGuidedResumeChange,
}: CoupleGuidedQuestionSectionProps) {
  const flowStepCount = steps.length;
  const requiredStepCount = countProgressSteps(steps);
  const answered = useMemo(() => countAnsweredSteps(steps, answers), [steps, answers]);
  const progressPct =
    requiredStepCount === 0 ? 100 : Math.round((answered / requiredStepCount) * 100);
  const allAnswered = steps.length > 0 && steps.every((step) => step.isAnswered(answers));

  const initialGuidedPosition = useMemo(
    () =>
      resolveCoupleGuidedQuestionPosition(steps, answers, {
        mode: guidedResumeMode,
        resume: guidedResume,
      }),
    [answers, guidedResume, guidedResumeMode, steps],
  );

  const [phase, setPhase] = useState<Phase>(initialGuidedPosition.phase);
  const [stepIndex, setStepIndex] = useState(initialGuidedPosition.stepIndex);

  const stepContentRef = useRef<HTMLDivElement>(null);
  /** Blocks ghost taps on review footer right after entering review from guided nav. */
  const reviewTransitionGuardRef = useRef(false);
  const reviewTransitionTimerRef = useRef<number | null>(null);
  const lastPersistedResumeRef = useRef<CoupleGuidedQuestionResume | null>(
    guidedResume?.stepId
      ? { stepId: guidedResume.stepId, phase: guidedResume.phase }
      : null,
  );

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex <= 0;
  const isLastStep = stepIndex >= steps.length - 1;
  const activeStepId = currentStep?.id;

  const persistGuidedResume = useCallback(
    (nextStepId: string | undefined, nextPhase: Phase) => {
      if (!onGuidedResumeChange || !nextStepId) return;
      const nextResume: CoupleGuidedQuestionResume = {
        stepId: nextStepId,
        phase: nextPhase,
      };
      if (areCoupleGuidedQuestionResumesEqual(lastPersistedResumeRef.current, nextResume)) {
        return;
      }
      lastPersistedResumeRef.current = nextResume;
      onGuidedResumeChange(nextResume);
    },
    [onGuidedResumeChange],
  );

  useEffect(() => {
    if (activeStepId) return;
    const fallback = resolveCoupleGuidedQuestionPosition(steps, answers, {
      mode: "first-incomplete",
    });
    setStepIndex(fallback.stepIndex);
    setPhase(fallback.phase);
  }, [activeStepId, answers, steps]);

  useEffect(() => {
    if (!activeStepId) return;
    persistGuidedResume(activeStepId, phase);
  }, [activeStepId, phase, persistGuidedResume]);

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
    persistGuidedResume(activeStepId, "review");
  }, [activeStepId, persistGuidedResume]);

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
    const nextIndex = idx === -1 ? Math.max(0, steps.length - 1) : idx;
    setStepIndex(nextIndex);
    setPhase("guided");
    persistGuidedResume(steps[nextIndex]?.id, "guided");
  }, [answers, persistGuidedResume, steps]);

  const goPrevious = useCallback(() => {
    setStepIndex((prev) => {
      const nextIndex = Math.max(0, prev - 1);
      persistGuidedResume(steps[nextIndex]?.id, "guided");
      return nextIndex;
    });
  }, [persistGuidedResume, steps]);

  const goNext = useCallback(() => {
    let shouldEnterReview = false;
    setStepIndex((prev) => {
      if (prev >= steps.length - 1) {
        shouldEnterReview = true;
        return prev;
      }
      const nextIndex = prev + 1;
      persistGuidedResume(steps[nextIndex]?.id, "guided");
      return nextIndex;
    });
    if (shouldEnterReview) {
      enterReview();
    }
  }, [enterReview, persistGuidedResume, steps]);

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
      className={couplePlanningSectionCardClass}
      aria-labelledby={`${sectionId}-title`}
    >
      <p className={couplePlanningEyebrowClass}>{eyebrow}</p>
      <h3 id={`${sectionId}-title`} className={couplePlanningTitleClass}>
        {title}
      </h3>
      <p className={couplePlanningIntroClass}>{intro}</p>

      <div className="mt-6 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-stone-800">
          <span>
            {phase === "guided"
              ? `Step ${stepIndex + 1} of ${flowStepCount}`
              : `${answered} of ${requiredStepCount} answered`}
          </span>
          <span className="text-xs font-normal text-stone-600">{progressPct}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-stone-200/80">
          <div
            className="h-full rounded-full bg-[#2f4a3e] transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {phase === "guided" && currentStep ? (
        <>
          <div
            ref={stepContentRef}
            className={`mt-8 ${guidedStepContentSpacerClass}`}
          >
            {currentStep.renderGuided()}
          </div>
          <GuidedNavFooter>
            <GuidedNavTextButton
              onAction={goToReview}
              className="min-h-12 touch-manipulation self-start rounded-lg px-1 py-2 text-left text-sm font-medium text-stone-600 underline-offset-2 transition hover:text-stone-900 hover:underline active:text-stone-900 active:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f4a3e]/40"
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
        <div className="mt-8 space-y-6">
          {!allAnswered && reviewIncompleteHint ? (
            <div
              className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-5 py-4"
              role="status"
            >
              <p className="text-sm font-semibold text-amber-950">A few details are still needed</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-950/90">{reviewIncompleteHint}</p>
            </div>
          ) : null}
          {continueBlockedMessage ? (
            <div
              className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-5 py-4"
              role="alert"
            >
              <p className="text-sm font-semibold text-rose-950">A few answers are still needed</p>
              <p className="mt-2 text-sm leading-relaxed text-rose-950/90">{continueBlockedMessage}</p>
            </div>
          ) : null}
          {allAnswered ? (
            completionTitle && completionBody ? (
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-5 py-5">
                <h4 className="text-base font-semibold text-emerald-950">{completionTitle}</h4>
                <p className="mt-2 text-sm leading-relaxed text-emerald-950/90">{completionBody}</p>
              </div>
            ) : (
              <p className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-5 py-4 text-sm leading-relaxed text-emerald-950/90">
                {completionMessage}
              </p>
            )
          ) : null}
          <div className={`divide-y divide-stone-200/60 ${guidedStepContentSpacerClass} md:pb-0`}>
            {steps.map((step) => (
              <div key={step.id} className="py-6 first:pt-0 last:pb-0">
                {step.renderReview()}
              </div>
            ))}
          </div>
          <GuidedNavFooter>
            {allAnswered && (onCompletionPrimary ?? onContinueToNextChapter) ? (
              <GuidedNavButton
                onAction={() => (onCompletionPrimary ?? onContinueToNextChapter)?.()}
                className={`w-full sm:w-auto sm:min-w-[12rem] ${couplePortalPrimaryButtonClass}`}
              >
                {completionPrimaryLabel ?? continueToNextChapterLabel}
              </GuidedNavButton>
            ) : null}
            {allAnswered && onCompletionSecondary ? (
              <GuidedNavButton
                onAction={onCompletionSecondary}
                className={`w-full sm:w-auto sm:min-w-[12rem] ${couplePortalSecondaryButtonClass}`}
              >
                {completionSecondaryLabel ?? "Continue"}
              </GuidedNavButton>
            ) : null}
            {!allAnswered ? (
              <GuidedNavButton
                onAction={goToGuided}
                clickOnly
                className={`w-full sm:w-auto sm:min-w-[10rem] ${couplePortalSecondaryButtonClass}`}
              >
                Go to unanswered questions
              </GuidedNavButton>
            ) : (
              <GuidedNavButton
                onAction={goToGuided}
                clickOnly
                className={`w-full sm:w-auto sm:min-w-[10rem] ${couplePortalSecondaryButtonClass}`}
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
