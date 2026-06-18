"use client";

import type { ReactNode } from "react";

import { CoupleAboutYouGuidedSection } from "@/components/couple-about-you-guided-section";
import { CoupleCeremonyGuidedSection } from "@/components/couple-ceremony-guided-section";
import { CoupleFinalReviewSection } from "@/components/couple-final-review-section";
import { CoupleReceptionMomentsGuidedSection } from "@/components/couple-reception-moments-guided-section";
import { CoupleYourTeamGuidedSection } from "@/components/couple-your-team-guided-section";
import {
  CoupleGuidedQuestionSection,
  questionGuidedStep,
  type CoupleGuidedResumeProps,
} from "@/components/couple-guided-question-section";
import {
  couplePlanningSectionCardClass,
} from "@/components/couple-planning-ui";
import {
  PremiumCard,
  PrimaryButton,
  couplePortalPrimaryButtonClass,
} from "@/components/planning-ui";
import type { GroupedPlanningQuestionsRow } from "@/data/planningQuestionGroups";
import { GRAND_ENTRANCE_PLANNING_LINEUP_KEY } from "@/lib/grandEntranceDetail";
import {
  coupleWeddingChapterNavLabel,
  isCoupleWeddingGuidedChapter,
  type CoupleWeddingChapterId,
  type CoupleWeddingChapterStatus,
} from "@/lib/coupleWeddingJourney";
import { SPEECHES_TOASTS_PLANNING_KEY } from "@/lib/speechesToasts";
import { buildGuidedChapterReviewIncompleteHint } from "@/lib/coupleGuidedChapterMissingFields";
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
} & CoupleGuidedResumeProps;

function visibleQuestionsForRow(row: GroupedPlanningQuestionsRow | null): PlanningQuestionDef[] {
  if (!row) return [];
  return row.questions.filter(
    (question) =>
      question.id !== GRAND_ENTRANCE_PLANNING_LINEUP_KEY &&
      question.id !== SPEECHES_TOASTS_PLANNING_KEY,
  );
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
  onOpenTimeline,
  onOpenPlanningChapter,
  onReturnToDashboard,
  finalReviewStoryChapterRows,
  finalReviewOperationalInput,
  finalReviewSummaryInput,
  finalReviewChapterComplete,
  guidedResume,
  guidedResumeMode,
  onGuidedResumeChange,
}: CoupleWeddingChapterScreenProps) {
  const guidedResumeProps = {
    guidedResume,
    guidedResumeMode,
    onGuidedResumeChange,
  };
  if (chapterId === "your_team") {
    return (
      <CoupleYourTeamGuidedSection
        answers={answers}
        onAnswerChange={onAnswerChange}
        onOpenEventTeam={onOpenEventTeam}
        onContinueToNextChapter={onContinueToNextChapter}
        continueToNextChapterLabel={continueToNextChapterLabel}
        continueBlockedMessage={yourTeamContinueBlockedMessage}
        {...guidedResumeProps}
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
        onViewTimeline={onOpenTimeline}
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
        {...guidedResumeProps}
      />
    );
  }

  if (chapterId === "ceremony") {
    return (
      <CoupleCeremonyGuidedSection
        answers={answers}
        onAnswerChange={onAnswerChange}
        {...chapterContinueProps}
        {...guidedResumeProps}
      />
    );
  }

  if (chapterId === "music_vibe") {
    return (
      <section className={couplePlanningSectionCardClass}>
        <PremiumCard className="border-stone-200 bg-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f4a3e]/75">
            Music Profile
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            Next: build your soundtrack
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            Music deserves its own space. We’ll ask about your style, your guests, and the songs you love in Music Hub.
          </p>
          <PrimaryButton
            type="button"
            onClick={onOpenMusicHub}
            className={`mt-6 w-full sm:w-auto ${couplePortalPrimaryButtonClass}`}
          >
            Open Music Profile
          </PrimaryButton>
        </PremiumCard>
      </section>
    );
  }

  if (chapterId === "reception_moments") {
    return (
      <CoupleReceptionMomentsGuidedSection
        questions={visibleQuestions}
        answers={answers}
        onAnswerChange={onAnswerChange}
        renderQuestionEditor={renderQuestionEditor}
        showWeddingPartyLineupSection={showWeddingPartyLineupSection}
        showSpeechesToastsSection={showSpeechesToastsSection}
        weddingPartyLineupSummary={weddingPartyLineupSummary}
        speechesToastsSummary={speechesToastsSummary}
        onOpenWeddingPartyLineupEditor={onOpenWeddingPartyLineupEditor}
        onOpenSpeechesToastsEditor={onOpenSpeechesToastsEditor}
        {...chapterContinueProps}
        {...guidedResumeProps}
      />
    );
  }

  const chapterCopy = COUPLE_WEDDING_GUIDED_CHAPTER_COPY[chapterId];
  if (!chapterCopy) return null;

  const steps = visibleQuestions.map((question) =>
    questionGuidedStep(question, renderQuestionEditor, onAnswerChange, answers),
  );

  if (steps.length === 0) {
    return (
      <PremiumCard className={couplePlanningSectionCardClass}>
        <p className="text-[15px] leading-relaxed text-stone-700">
          No prompts are available for {coupleWeddingChapterNavLabel(chapterId)} yet.
        </p>
        <PrimaryButton type="button" onClick={onContinueToNextChapter} className={`mt-6 ${couplePortalPrimaryButtonClass}`}>
          {continueToNextChapterLabel}
        </PrimaryButton>
      </PremiumCard>
    );
  }

  const reviewIncompleteHint = buildGuidedChapterReviewIncompleteHint(steps, answers);

  return (
    <CoupleGuidedQuestionSection
      key={`${chapterCopy.sectionId}-${guidedResumeMode ?? "restore"}`}
      sectionId={chapterCopy.sectionId}
      eyebrow={chapterCopy.eyebrow}
      title={chapterCopy.title}
      intro={chapterCopy.intro}
      completionMessage={chapterCopy.completionMessage}
      steps={steps}
      answers={answers}
      reviewIncompleteHint={reviewIncompleteHint}
      {...chapterContinueProps}
      {...guidedResumeProps}
    />
  );
}
