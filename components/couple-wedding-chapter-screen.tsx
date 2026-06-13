"use client";

import type { ReactNode } from "react";

import { CoupleAboutYouGuidedSection } from "@/components/couple-about-you-guided-section";
import { CoupleCeremonyGuidedSection } from "@/components/couple-ceremony-guided-section";
import { CoupleFinalReviewSection } from "@/components/couple-final-review-section";
import { CoupleMusicProfileGuidedSection } from "@/components/couple-music-profile-guided-section";
import { CoupleYourTeamGuidedSection } from "@/components/couple-your-team-guided-section";
import {
  CoupleGuidedQuestionSection,
  questionGuidedStep,
  type CoupleGuidedQuestionStep,
} from "@/components/couple-guided-question-section";
import { CoupleMobileActionButton } from "@/components/couple-mobile-action-button";
import {
  PremiumCard,
  PrimaryButton,
  lightUiCyanPrimaryButtonClass,
  premiumFormSectionCardClass,
} from "@/components/planning-ui";
import type { GroupedPlanningQuestionsRow } from "@/data/planningQuestionGroups";
import { GRAND_ENTRANCE_PLANNING_LINEUP_KEY } from "@/lib/grandEntranceDetail";
import {
  coupleWeddingChapterNavLabel,
  isCoupleWeddingGuidedChapter,
  type CoupleWeddingChapterId,
  type CoupleWeddingChapterStatus,
} from "@/lib/coupleWeddingJourney";
import { parseSpeechesToasts, SPEECHES_TOASTS_PLANNING_KEY } from "@/lib/speechesToasts";
import { buildGuidedChapterReviewIncompleteHint } from "@/lib/coupleGuidedChapterMissingFields";
import { parseWeddingPartyLineup, WEDDING_PARTY_LINEUP_HELPER_COPY } from "@/lib/weddingPartyLineup";
import type { CoupleOperationalReadinessInput, CoupleFinalReviewSummaryInput } from "@/lib/coupleFinalReviewPlanning";
import type { PlanningQuestionDef } from "@/types/planning";

const COUPLE_WEDDING_GUIDED_CHAPTER_COPY: Record<
  string,
  {
    sectionId: string;
    eyebrow: string;
    title: string;
    intro: string;
    completionMessage?: string;
  }
> = {
  about_you: {
    sectionId: "about-you-guided",
    eyebrow: "About You",
    title: "Let's start with the two of you",
    intro: "Before we talk about timelines, music, and logistics, tell us a little about yourselves.",
    completionMessage: "Thanks — this helps us create a celebration that feels like you.",
  },
  ceremony: {
    sectionId: "ceremony-guided",
    eyebrow: "Ceremony",
    title: "Ceremony services checkpoint",
    intro: "A quick pass on ceremony audio and logistics—exact details can wait if you are still deciding.",
    completionMessage: "Thanks — this helps us know what to plan for your ceremony.",
  },
  reception_moments: {
    sectionId: "reception-moments-guided",
    eyebrow: "Reception Moments",
    title: "Let's plan the moments everyone will remember",
    intro: "These are the moments that make your reception feel personal.",
    completionMessage: "Thanks — these details help us shape a reception that feels like you.",
  },
  music_vibe: {
    sectionId: "music-profile-guided",
    eyebrow: "Music Profile",
    title: "Let's talk about the music",
    intro:
      "Most couples add songs over time, but before we build playlists, we'd love to understand the kind of celebration you're imagining.",
  },
};

export type CoupleWeddingChapterScreenProps = {
  chapterId: CoupleWeddingChapterId;
  chapterRow: GroupedPlanningQuestionsRow | null;
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
  onContinueToNextChapter: (chapterAnswers?: Record<string, string | undefined>) => void | Promise<void>;
  continueToNextChapterLabel: string;
  yourTeamContinueBlockedMessage?: string | null;
  onOpenMusicHub: () => void;
  onOpenEventTeam: (chapterAnswers?: Record<string, string | undefined>) => void | Promise<void>;
  onOpenEventPrep: () => void;
  onOpenTimeline: () => void;
  onOpenPlanningChapter: (chapterId: CoupleWeddingChapterId) => void;
  onReturnToDashboard: () => void;
  finalReviewStoryChapterRows: Array<{
    id: CoupleWeddingChapterId;
    title: string;
    status: CoupleWeddingChapterStatus;
  }>;
  finalReviewOperationalInput: CoupleOperationalReadinessInput;
  finalReviewSummaryInput: CoupleFinalReviewSummaryInput;
  finalReviewChapterComplete: boolean;
};

function visibleQuestionsForRow(row: GroupedPlanningQuestionsRow | null): PlanningQuestionDef[] {
  if (!row) return [];
  return row.questions.filter(
    (question) =>
      question.id !== GRAND_ENTRANCE_PLANNING_LINEUP_KEY &&
      question.id !== SPEECHES_TOASTS_PLANNING_KEY,
  );
}

function buildReceptionMomentSteps(
  visibleQuestions: PlanningQuestionDef[],
  input: Pick<
    CoupleWeddingChapterScreenProps,
    | "answers"
    | "showWeddingPartyLineupSection"
    | "showSpeechesToastsSection"
    | "weddingPartyLineupSummary"
    | "speechesToastsSummary"
    | "onOpenWeddingPartyLineupEditor"
    | "onOpenSpeechesToastsEditor"
    | "renderQuestionEditor"
    | "onAnswerChange"
  >,
): CoupleGuidedQuestionStep[] {
  const steps: CoupleGuidedQuestionStep[] = [];

  if (input.showWeddingPartyLineupSection) {
    const hasLineup =
      parseWeddingPartyLineup(input.answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0;
    const lineupCtaLabel = hasLineup
      ? "Edit Wedding Party Entrance"
      : "Add Wedding Party Entrance";
    const renderLineupStep = () => (
      <PremiumCard className="border-stone-200/90 bg-stone-50/50 shadow-none">
        <p className="text-base font-semibold text-stone-950">Your Wedding Party Entrance</p>
        <p className="mt-3 text-xs leading-relaxed text-stone-600">{WEDDING_PARTY_LINEUP_HELPER_COPY}</p>
        <p className="mt-4 text-sm font-medium text-stone-900">{input.weddingPartyLineupSummary}</p>
        <CoupleMobileActionButton
          onAction={input.onOpenWeddingPartyLineupEditor}
          className={`mt-4 w-full sm:w-auto ${lightUiCyanPrimaryButtonClass}`}
        >
          {lineupCtaLabel}
        </CoupleMobileActionButton>
      </PremiumCard>
    );
    steps.push({
      id: GRAND_ENTRANCE_PLANNING_LINEUP_KEY,
      missingLabel: "Wedding party entrance",
      isAnswered: (answers) =>
        parseWeddingPartyLineup(answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0,
      renderGuided: renderLineupStep,
      renderReview: renderLineupStep,
    });
  }

  if (input.showSpeechesToastsSection) {
    const hasToasts =
      parseSpeechesToasts(input.answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0;
    const toastsCtaLabel = hasToasts ? "Edit Toasts & Speeches" : "Plan Your Toasts";
    const renderToastsStep = () => (
      <PremiumCard className="border-stone-200/90 bg-stone-50/50 shadow-none">
        <p className="text-base font-semibold text-stone-950">Speeches / Toasts</p>
        <p className="mt-3 text-xs leading-relaxed text-stone-600">
          Add each speaker with their role and name in toast order.
        </p>
        <p className="mt-4 text-sm font-medium leading-relaxed text-stone-900">
          {input.speechesToastsSummary}
        </p>
        <CoupleMobileActionButton
          onAction={input.onOpenSpeechesToastsEditor}
          className={`mt-4 w-full sm:w-auto ${lightUiCyanPrimaryButtonClass}`}
        >
          {toastsCtaLabel}
        </CoupleMobileActionButton>
      </PremiumCard>
    );
    steps.push({
      id: SPEECHES_TOASTS_PLANNING_KEY,
      missingLabel: "Speeches / toasts",
      isAnswered: (answers) =>
        parseSpeechesToasts(answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0,
      renderGuided: renderToastsStep,
      renderReview: renderToastsStep,
    });
  }

  for (const question of visibleQuestions) {
    steps.push(
      questionGuidedStep(
        question,
        input.renderQuestionEditor,
        input.onAnswerChange,
        input.answers,
      ),
    );
  }

  return steps;
}

export function CoupleWeddingChapterScreen({
  chapterId,
  chapterRow,
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
  yourTeamContinueBlockedMessage = null,
  onOpenMusicHub,
  onOpenEventTeam,
  onOpenEventPrep,
  onOpenTimeline,
  onOpenPlanningChapter,
  onReturnToDashboard,
  finalReviewStoryChapterRows,
  finalReviewOperationalInput,
  finalReviewSummaryInput,
  finalReviewChapterComplete,
}: CoupleWeddingChapterScreenProps) {
  if (chapterId === "your_team") {
    return (
      <CoupleYourTeamGuidedSection
        answers={answers}
        onAnswerChange={onAnswerChange}
        onOpenEventTeam={onOpenEventTeam}
        onContinueToNextChapter={onContinueToNextChapter}
        continueToNextChapterLabel={continueToNextChapterLabel}
        continueBlockedMessage={yourTeamContinueBlockedMessage}
      />
    );
  }

  if (chapterId === "final_review") {
    return (
      <CoupleFinalReviewSection
        storyChapterRows={finalReviewStoryChapterRows}
        operationalReadinessInput={finalReviewOperationalInput}
        finalReviewSummaryInput={finalReviewSummaryInput}
        isChapterComplete={finalReviewChapterComplete}
        onOpenStoryChapter={onOpenPlanningChapter}
        onOpenTimeline={onOpenTimeline}
        onOpenMusicHub={onOpenMusicHub}
        onOpenEventTeam={onOpenEventTeam}
        onOpenEventDocument={onOpenEventPrep}
        onReturnToDashboard={onReturnToDashboard}
      />
    );
  }

  if (!isCoupleWeddingGuidedChapter(chapterId)) {
    return null;
  }

  const visibleQuestions = visibleQuestionsForRow(chapterRow);
  const chapterContinueProps = {
    onContinueToNextChapter,
    continueToNextChapterLabel,
  };

  if (chapterId === "about_you") {
    return (
      <CoupleAboutYouGuidedSection
        questions={visibleQuestions}
        answers={answers}
        onAnswerChange={onAnswerChange}
        renderEditor={renderQuestionEditor}
        {...chapterContinueProps}
      />
    );
  }

  if (chapterId === "ceremony") {
    return (
      <CoupleCeremonyGuidedSection
        answers={answers}
        onAnswerChange={onAnswerChange}
        {...chapterContinueProps}
      />
    );
  }

  if (chapterId === "music_vibe") {
    return (
      <CoupleMusicProfileGuidedSection
        answers={answers}
        onAnswerChange={onAnswerChange}
        onOpenMusicHub={onOpenMusicHub}
        onContinueToNextChapter={onContinueToNextChapter}
        continueToNextChapterLabel={continueToNextChapterLabel}
      />
    );
  }

  const chapterCopy = COUPLE_WEDDING_GUIDED_CHAPTER_COPY[chapterId];
  if (!chapterCopy) return null;

  const steps =
    chapterId === "reception_moments"
      ? buildReceptionMomentSteps(visibleQuestions, {
          answers,
          showWeddingPartyLineupSection,
          showSpeechesToastsSection,
          weddingPartyLineupSummary,
          speechesToastsSummary,
          onOpenWeddingPartyLineupEditor,
          onOpenSpeechesToastsEditor,
          renderQuestionEditor,
          onAnswerChange,
        })
      : visibleQuestions.map((question) =>
          questionGuidedStep(question, renderQuestionEditor, onAnswerChange, answers),
        );

  if (steps.length === 0) {
    return (
      <PremiumCard className={premiumFormSectionCardClass}>
        <p className="text-sm leading-relaxed text-stone-700">
          No prompts are available for {coupleWeddingChapterNavLabel(chapterId)} yet.
        </p>
        <PrimaryButton type="button" onClick={onContinueToNextChapter} className={`mt-4 ${lightUiCyanPrimaryButtonClass}`}>
          {continueToNextChapterLabel}
        </PrimaryButton>
      </PremiumCard>
    );
  }

  const reviewIncompleteHint = buildGuidedChapterReviewIncompleteHint(steps, answers);

  return (
    <CoupleGuidedQuestionSection
      key={chapterCopy.sectionId}
      sectionId={chapterCopy.sectionId}
      eyebrow={chapterCopy.eyebrow}
      title={chapterCopy.title}
      intro={chapterCopy.intro}
      completionMessage={chapterCopy.completionMessage}
      steps={steps}
      answers={answers}
      reviewIncompleteHint={reviewIncompleteHint}
      {...chapterContinueProps}
    />
  );
}
