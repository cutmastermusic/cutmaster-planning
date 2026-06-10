"use client";

import type { ReactNode } from "react";

import { CoupleAboutYouGuidedSection } from "@/components/couple-about-you-guided-section";
import { CoupleMusicProfileGuidedSection } from "@/components/couple-music-profile-guided-section";
import {
  CoupleGuidedQuestionSection,
  questionGuidedStep,
  type CoupleGuidedQuestionStep,
} from "@/components/couple-guided-question-section";
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
} from "@/lib/coupleWeddingJourney";
import { parseSpeechesToasts, SPEECHES_TOASTS_PLANNING_KEY } from "@/lib/speechesToasts";
import { parseWeddingPartyLineup, WEDDING_PARTY_LINEUP_HELPER_COPY } from "@/lib/weddingPartyLineup";
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
    title: "Let's talk about your ceremony",
    intro: "Tell us how you imagine the moment you say I do.",
    completionMessage: "Thanks — this helps us plan a ceremony that feels right for you.",
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
  onContinueToNextChapter: () => void;
  continueToNextChapterLabel: string;
  onOpenMusicHub: () => void;
  onOpenEventTeam: () => void;
  onOpenEventPrep: () => void;
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
    const renderLineupStep = () => (
      <PremiumCard className="border-stone-200/90 bg-stone-50/50 shadow-none">
        <p className="text-base font-semibold text-stone-950">Your Wedding Party Entrance</p>
        <p className="mt-3 text-xs leading-relaxed text-stone-600">{WEDDING_PARTY_LINEUP_HELPER_COPY}</p>
        <p className="mt-4 text-sm font-medium text-stone-900">{input.weddingPartyLineupSummary}</p>
        <PrimaryButton
          type="button"
          onClick={input.onOpenWeddingPartyLineupEditor}
          className={`mt-4 ${lightUiCyanPrimaryButtonClass}`}
        >
          Add Wedding Party Entrance
        </PrimaryButton>
      </PremiumCard>
    );
    steps.push({
      id: GRAND_ENTRANCE_PLANNING_LINEUP_KEY,
      isAnswered: (answers) =>
        parseWeddingPartyLineup(answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0,
      renderGuided: renderLineupStep,
      renderReview: renderLineupStep,
    });
  }

  if (input.showSpeechesToastsSection) {
    const renderToastsStep = () => (
      <PremiumCard className="border-stone-200/90 bg-stone-50/50 shadow-none">
        <p className="text-base font-semibold text-stone-950">Speeches / Toasts</p>
        <p className="mt-3 text-xs leading-relaxed text-stone-600">
          Add each speaker with their role and name in toast order.
        </p>
        <p className="mt-4 text-sm font-medium leading-relaxed text-stone-900">
          {input.speechesToastsSummary}
        </p>
        <PrimaryButton
          type="button"
          onClick={input.onOpenSpeechesToastsEditor}
          className={`mt-4 ${lightUiCyanPrimaryButtonClass}`}
        >
          Plan Your Toasts
        </PrimaryButton>
      </PremiumCard>
    );
    steps.push({
      id: SPEECHES_TOASTS_PLANNING_KEY,
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
  onOpenMusicHub,
  onOpenEventTeam,
  onOpenEventPrep,
}: CoupleWeddingChapterScreenProps) {
  if (chapterId === "your_team") {
    return (
      <PremiumCard className={premiumFormSectionCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Your Team</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">
          Let&apos;s get your team aligned
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Help us stay aligned with your planner, venue, and vendors. Add day-of contacts in Event Team—we
          will expand this chapter soon.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <PrimaryButton
            type="button"
            onClick={onOpenEventTeam}
            className={`w-full sm:w-auto ${lightUiCyanPrimaryButtonClass}`}
          >
            Open Event Team
          </PrimaryButton>
          <PrimaryButton type="button" onClick={onContinueToNextChapter} className="w-full sm:w-auto">
            {continueToNextChapterLabel}
          </PrimaryButton>
        </div>
      </PremiumCard>
    );
  }

  if (chapterId === "final_review") {
    return (
      <PremiumCard className={premiumFormSectionCardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Final Review</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">
          Ready for a final pass?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Preview what your DJ and planner receive in the Event Document. Guided final-review prompts are
          coming soon.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <PrimaryButton
            type="button"
            onClick={onOpenEventPrep}
            className={`w-full sm:w-auto ${lightUiCyanPrimaryButtonClass}`}
          >
            Preview Event Document
          </PrimaryButton>
          <PrimaryButton type="button" onClick={onContinueToNextChapter} className="w-full sm:w-auto">
            {continueToNextChapterLabel}
          </PrimaryButton>
        </div>
      </PremiumCard>
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

  if (chapterId === "music_vibe") {
    return (
      <CoupleMusicProfileGuidedSection
        answers={answers}
        onAnswerChange={onAnswerChange}
        onOpenMusicHub={onOpenMusicHub}
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

  return (
    <CoupleGuidedQuestionSection
      sectionId={chapterCopy.sectionId}
      eyebrow={chapterCopy.eyebrow}
      title={chapterCopy.title}
      intro={chapterCopy.intro}
      completionMessage={chapterCopy.completionMessage}
      steps={steps}
      answers={answers}
      {...chapterContinueProps}
    />
  );
}
