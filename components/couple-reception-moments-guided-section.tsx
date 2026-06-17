"use client";

import { useMemo, type ReactNode } from "react";

import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import {
  CoupleGuidedQuestionSection,
  questionGuidedStep,
  type CoupleGuidedQuestionStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import { CoupleMobileActionButton } from "@/components/couple-mobile-action-button";
import { couplePortalPrimaryButtonClass } from "@/components/planning-ui";
import { GRAND_ENTRANCE_PLANNING_LINEUP_KEY } from "@/lib/grandEntranceDetail";
import {
  RECEPTION_MOMENTS_GATE_OPTIONS,
  RECEPTION_MOMENTS_QUESTION_IDS,
  RECEPTION_MOMENTS_REVISIT_LATER_NOTE,
  buildReceptionMomentsChapterReviewIncompleteHint,
  normalizeReceptionMomentsGateAnswer,
  receptionMomentsGateLabelFromValue,
  receptionMomentsGateValueFromLabel,
  resolveToastsGateAnswer,
  resolveWeddingPartyGateAnswer,
  toastsGateNeedsSpeakerFlow,
  weddingPartyGateNeedsLineupFlow,
} from "@/lib/coupleReceptionMomentsPlanning";
import { parseSpeechesToasts, SPEECHES_TOASTS_PLANNING_KEY } from "@/lib/speechesToasts";
import { parseWeddingPartyLineup, WEDDING_PARTY_LINEUP_HELPER_COPY } from "@/lib/weddingPartyLineup";
import {
  couplePlanningEmptyAnswerClass,
  couplePlanningPromptCardClass,
  couplePlanningQuestionLabelClass,
  couplePlanningQuestionShellClass,
} from "@/components/couple-planning-ui";
import type { PlanningQuestionDef } from "@/types/planning";

export type CoupleReceptionMomentsGuidedSectionProps = {
  questions: PlanningQuestionDef[];
  answers: Record<string, string | undefined>;
  onAnswerChange: (questionId: string, next: string) => void;
  renderQuestionEditor: (props: {
    question: PlanningQuestionDef;
    value: string;
    onChange: (next: string) => void;
  }) => ReactNode;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
  weddingPartyLineupSummary: string;
  speechesToastsSummary: string;
  onOpenWeddingPartyLineupEditor: () => void;
  onOpenSpeechesToastsEditor: () => void;
  onContinueToNextChapter?: () => void;
  continueToNextChapterLabel?: string;
} & CoupleGuidedResumeProps;

function renderGateReview(
  label: string,
  gate: ReturnType<typeof resolveWeddingPartyGateAnswer>,
): ReactNode {
  return (
    <div className={couplePlanningQuestionShellClass}>
      <p className={couplePlanningQuestionLabelClass}>{label}</p>
      <p className="mt-3 text-sm leading-relaxed text-stone-900">
        {gate ? receptionMomentsGateLabelFromValue(gate) : (
          <span className={couplePlanningEmptyAnswerClass}>Not answered</span>
        )}
      </p>
      {gate === "not_sure" ? (
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {RECEPTION_MOMENTS_REVISIT_LATER_NOTE}
        </p>
      ) : null}
    </div>
  );
}

export function CoupleReceptionMomentsGuidedSection({
  questions,
  answers,
  onAnswerChange,
  renderQuestionEditor,
  showWeddingPartyLineupSection,
  showSpeechesToastsSection,
  weddingPartyLineupSummary,
  speechesToastsSummary,
  onOpenWeddingPartyLineupEditor,
  onOpenSpeechesToastsEditor,
  onContinueToNextChapter,
  continueToNextChapterLabel,
  guidedResume,
  guidedResumeMode,
  onGuidedResumeChange,
}: CoupleReceptionMomentsGuidedSectionProps) {
  const weddingPartyGate = resolveWeddingPartyGateAnswer(answers);
  const toastsGate = resolveToastsGateAnswer(answers);
  const needsWeddingPartyLineup = weddingPartyGateNeedsLineupFlow(weddingPartyGate);
  const needsToastsCollection = toastsGateNeedsSpeakerFlow(toastsGate);

  const steps = useMemo((): CoupleGuidedQuestionStep[] => {
    const built: CoupleGuidedQuestionStep[] = [];
    const setSingle = (questionId: string, next: string) => onAnswerChange(questionId, next);

    if (showWeddingPartyLineupSection) {
      built.push({
        id: "reception-wedding-party-gate",
        missingLabel: "Wedding party introduction plan",
        isAnswered: (nextAnswers) => Boolean(resolveWeddingPartyGateAnswer(nextAnswers)),
        renderGuided: () => (
          <CouplePlanningChipSelect
            label="Will you be introducing a wedding party?"
            helperText="If you're still deciding, choose Not sure yet—you can update this anytime."
            mode="single"
            options={RECEPTION_MOMENTS_GATE_OPTIONS}
            value={receptionMomentsGateLabelFromValue(
              normalizeReceptionMomentsGateAnswer(
                answers[RECEPTION_MOMENTS_QUESTION_IDS.weddingPartyIntroduction],
              ) || weddingPartyGate,
            )}
            onChange={(next) =>
              setSingle(
                RECEPTION_MOMENTS_QUESTION_IDS.weddingPartyIntroduction,
                receptionMomentsGateValueFromLabel(next as string),
              )
            }
          />
        ),
        renderReview: () =>
          renderGateReview("Will you be introducing a wedding party?", weddingPartyGate),
      });

      if (needsWeddingPartyLineup) {
        const hasLineup =
          parseWeddingPartyLineup(answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0;
        const lineupCtaLabel = hasLineup
          ? "Edit Wedding Party Entrance"
          : "Add Wedding Party Entrance";
        const renderLineupStep = () => (
          <div className={couplePlanningPromptCardClass}>
            <p className={couplePlanningQuestionLabelClass}>Your Wedding Party Entrance</p>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              {WEDDING_PARTY_LINEUP_HELPER_COPY}
            </p>
            <p className="mt-4 text-sm font-medium text-stone-900">{weddingPartyLineupSummary}</p>
            <CoupleMobileActionButton
              onAction={onOpenWeddingPartyLineupEditor}
              className={`mt-4 w-full sm:w-auto ${couplePortalPrimaryButtonClass}`}
            >
              {lineupCtaLabel}
            </CoupleMobileActionButton>
          </div>
        );

        built.push({
          id: GRAND_ENTRANCE_PLANNING_LINEUP_KEY,
          missingLabel: "Wedding party entrance",
          isAnswered: (nextAnswers) =>
            parseWeddingPartyLineup(nextAnswers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0,
          renderGuided: renderLineupStep,
          renderReview: renderLineupStep,
        });
      }
    }

    if (showSpeechesToastsSection) {
      built.push({
        id: "reception-toasts-gate",
        missingLabel: "Reception toast plan",
        isAnswered: (nextAnswers) => Boolean(resolveToastsGateAnswer(nextAnswers)),
        renderGuided: () => (
          <CouplePlanningChipSelect
            label="Will anyone be giving a toast during your reception?"
            helperText="If you're still deciding, choose Not sure yet—you can update this anytime."
            mode="single"
            options={RECEPTION_MOMENTS_GATE_OPTIONS}
            value={receptionMomentsGateLabelFromValue(
              normalizeReceptionMomentsGateAnswer(
                answers[RECEPTION_MOMENTS_QUESTION_IDS.toastsPlanned],
              ) || toastsGate,
            )}
            onChange={(next) =>
              setSingle(
                RECEPTION_MOMENTS_QUESTION_IDS.toastsPlanned,
                receptionMomentsGateValueFromLabel(next as string),
              )
            }
          />
        ),
        renderReview: () =>
          renderGateReview("Will anyone be giving a toast during your reception?", toastsGate),
      });

      if (needsToastsCollection) {
        const hasToasts =
          parseSpeechesToasts(answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0;
        const toastsCtaLabel = hasToasts ? "Edit Toasts & Speeches" : "Plan Your Toasts";
        const renderToastsStep = () => (
          <div className={couplePlanningPromptCardClass}>
            <p className={couplePlanningQuestionLabelClass}>Speeches / Toasts</p>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Add each speaker with their role and name in toast order.
            </p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-stone-900">
              {speechesToastsSummary}
            </p>
            <CoupleMobileActionButton
              onAction={onOpenSpeechesToastsEditor}
              className={`mt-4 w-full sm:w-auto ${couplePortalPrimaryButtonClass}`}
            >
              {toastsCtaLabel}
            </CoupleMobileActionButton>
          </div>
        );

        built.push({
          id: SPEECHES_TOASTS_PLANNING_KEY,
          missingLabel: "Speeches / toasts",
          isAnswered: (nextAnswers) =>
            parseSpeechesToasts(nextAnswers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0,
          renderGuided: renderToastsStep,
          renderReview: renderToastsStep,
        });
      }
    }

    for (const question of questions) {
      built.push(
        questionGuidedStep(question, renderQuestionEditor, onAnswerChange, answers),
      );
    }

    return built;
  }, [
    answers,
    needsToastsCollection,
    needsWeddingPartyLineup,
    onAnswerChange,
    onOpenSpeechesToastsEditor,
    onOpenWeddingPartyLineupEditor,
    questions,
    renderQuestionEditor,
    showSpeechesToastsSection,
    showWeddingPartyLineupSection,
    speechesToastsSummary,
    toastsGate,
    weddingPartyGate,
    weddingPartyLineupSummary,
  ]);

  const reviewIncompleteHint = useMemo(
    () =>
      buildReceptionMomentsChapterReviewIncompleteHint({
        answers,
        showWeddingPartyLineupSection,
        showSpeechesToastsSection,
      }),
    [answers, showSpeechesToastsSection, showWeddingPartyLineupSection],
  );

  return (
    <CoupleGuidedQuestionSection
      sectionId="reception-moments-guided"
      eyebrow="Reception Moments"
      title="Let's plan the moments everyone will remember"
      intro="These are the moments that make your reception feel personal."
      steps={steps}
      answers={answers}
      reviewIncompleteHint={reviewIncompleteHint}
      completionMessage="Thanks — these details help us shape a reception that feels like you."
      onContinueToNextChapter={onContinueToNextChapter}
      continueToNextChapterLabel={continueToNextChapterLabel}
      guidedResume={guidedResume}
      guidedResumeMode={guidedResumeMode}
      onGuidedResumeChange={onGuidedResumeChange}
    />
  );
}
