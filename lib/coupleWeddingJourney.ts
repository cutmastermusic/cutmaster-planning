import type { PlanningQuestionDef } from "@/types/planning";
import { computePlanningQuestionGroupCompletion } from "@/data/planningQuestionGroups";
import { GRAND_ENTRANCE_PLANNING_LINEUP_KEY } from "@/lib/grandEntranceDetail";
import { parseSpeechesToasts, SPEECHES_TOASTS_PLANNING_KEY } from "@/lib/speechesToasts";
import { parseWeddingPartyLineup } from "@/lib/weddingPartyLineup";

export type CoupleWeddingChapterId =
  | "about_you"
  | "ceremony"
  | "reception_moments"
  | "music_vibe"
  | "your_team"
  | "final_review";

export const COUPLE_WEDDING_JOURNEY_CHAPTER_ORDER: CoupleWeddingChapterId[] = [
  "about_you",
  "ceremony",
  "reception_moments",
  "music_vibe",
  "your_team",
  "final_review",
];

/** Guided story chapters counted in the couple dashboard hero progress bar. */
export const COUPLE_WEDDING_STORY_CHAPTER_IDS: CoupleWeddingChapterId[] = [
  "about_you",
  "ceremony",
  "reception_moments",
  "music_vibe",
];

export type CoupleWeddingChapterStatus = "Not Started" | "In Progress" | "Complete";

export type CoupleWeddingChapterCardModel = {
  id: CoupleWeddingChapterId;
  kicker: string;
  title: string;
  description: string;
  completionPct: number;
  status: CoupleWeddingChapterStatus;
  statLine: string;
  statSubline: string;
  isPlaceholder: boolean;
};

export type CoupleWeddingJourneyProgressInput = {
  planningQuestionsGroupedBySection: Array<{
    group: { id: string };
    questions: PlanningQuestionDef[];
  }>;
  answers: Record<string, string | undefined>;
  showWeddingPartyLineupSection: boolean;
  showSpeechesToastsSection: boolean;
  vendorContactCount: number;
  collaboratorCount: number;
};

function visibleQuestionsForGroup(questions: PlanningQuestionDef[]): PlanningQuestionDef[] {
  return questions.filter(
    (question) =>
      question.id !== GRAND_ENTRANCE_PLANNING_LINEUP_KEY &&
      question.id !== SPEECHES_TOASTS_PLANNING_KEY,
  );
}

function chapterStatusFromPct(pct: number): CoupleWeddingChapterStatus {
  if (pct >= 100) return "Complete";
  if (pct <= 0) return "Not Started";
  return "In Progress";
}

export function computeCoupleWeddingChapterCompletionPct(
  chapterId: CoupleWeddingChapterId,
  input: CoupleWeddingJourneyProgressInput,
): number {
  const { answers, planningQuestionsGroupedBySection } = input;

  if (chapterId === "your_team") {
    const hasTeamSignal = input.vendorContactCount > 0 || input.collaboratorCount > 1;
    return hasTeamSignal ? 100 : 0;
  }

  if (chapterId === "final_review") {
    const contentChapters = COUPLE_WEDDING_JOURNEY_CHAPTER_ORDER.filter(
      (id) => id !== "final_review",
    );
    const contentPcts = contentChapters.map((id) =>
      computeCoupleWeddingChapterCompletionPct(id, input),
    );
    if (contentPcts.length === 0) return 0;
    return contentPcts.every((pct) => pct >= 100) ? 100 : 0;
  }

  const row = planningQuestionsGroupedBySection.find((entry) => entry.group.id === chapterId);
  if (!row) return 0;

  const visibleQuestions = visibleQuestionsForGroup(row.questions);

  if (chapterId === "reception_moments") {
    let totalSteps = visibleQuestions.length;
    let answeredSteps = visibleQuestions.filter((q) => (answers[q.id] ?? "").trim()).length;
    if (input.showWeddingPartyLineupSection) {
      totalSteps += 1;
      if (parseWeddingPartyLineup(answers[GRAND_ENTRANCE_PLANNING_LINEUP_KEY] ?? "").length > 0) {
        answeredSteps += 1;
      }
    }
    if (input.showSpeechesToastsSection) {
      totalSteps += 1;
      if (parseSpeechesToasts(answers[SPEECHES_TOASTS_PLANNING_KEY] ?? "").length > 0) {
        answeredSteps += 1;
      }
    }
    if (totalSteps === 0) return 0;
    return Math.round((answeredSteps / totalSteps) * 100);
  }

  if (visibleQuestions.length === 0) return 0;
  return computePlanningQuestionGroupCompletion(
    visibleQuestions,
    answers as Record<string, string>,
  );
}

const CHAPTER_CARD_COPY: Record<
  CoupleWeddingChapterId,
  { kicker: string; title: string; description: string; isPlaceholder: boolean }
> = {
  about_you: {
    kicker: "Chapter 1",
    title: "About You",
    description: "Tell us about yourselves—the story behind your celebration.",
    isPlaceholder: false,
  },
  ceremony: {
    kicker: "Chapter 2",
    title: "Ceremony",
    description: "Share how you imagine the moment you say I do.",
    isPlaceholder: false,
  },
  reception_moments: {
    kicker: "Chapter 3",
    title: "Reception Moments",
    description: "Entrance, toasts, dances, traditions, and your last dance.",
    isPlaceholder: false,
  },
  music_vibe: {
    kicker: "Chapter 4",
    title: "Music & Vibe",
    description: "The energy, artists, and boundaries for your dance floor.",
    isPlaceholder: false,
  },
  your_team: {
    kicker: "Chapter 5",
    title: "Your Team",
    description: "Planner, venue, and vendors—who we should align with.",
    isPlaceholder: true,
  },
  final_review: {
    kicker: "Chapter 6",
    title: "Final Review",
    description: "A calm pass to confirm your story is ready for the big day.",
    isPlaceholder: true,
  },
};

export function buildCoupleWeddingChapterCards(
  input: CoupleWeddingJourneyProgressInput,
): CoupleWeddingChapterCardModel[] {
  return COUPLE_WEDDING_JOURNEY_CHAPTER_ORDER.map((id) => {
    const copy = CHAPTER_CARD_COPY[id];
    const completionPct = computeCoupleWeddingChapterCompletionPct(id, input);
    const status = chapterStatusFromPct(completionPct);
    const row = input.planningQuestionsGroupedBySection.find((entry) => entry.group.id === id);
    const visibleQuestions = row ? visibleQuestionsForGroup(row.questions) : [];

    let statLine = `${completionPct}% complete`;
    let statSubline = "Short answers are enough—you can update anytime";

    if (id === "reception_moments") {
      const stepCount =
        visibleQuestions.length +
        (input.showWeddingPartyLineupSection ? 1 : 0) +
        (input.showSpeechesToastsSection ? 1 : 0);
      statLine = `${completionPct}% complete · ${stepCount} ${stepCount === 1 ? "step" : "steps"}`;
    } else if (id === "your_team") {
      statLine =
        input.vendorContactCount > 0
          ? `${input.vendorContactCount} day-of contact${input.vendorContactCount === 1 ? "" : "s"}`
          : "Add planner, venue, or photo contacts";
      statSubline =
        input.collaboratorCount > 1
          ? `${input.collaboratorCount - 1} collaborator${input.collaboratorCount === 2 ? "" : "s"} with access`
          : "Opens your Event Team workspace";
    } else if (id === "final_review") {
      statLine =
        completionPct >= 100
          ? "Your story chapters look complete"
          : "Unlocks when earlier chapters are complete";
      statSubline = "Preview what your team receives before the day";
    } else if (visibleQuestions.length > 0) {
      const answered = visibleQuestions.filter((q) => (input.answers[q.id] ?? "").trim()).length;
      statLine = `${completionPct}% complete · ${answered}/${visibleQuestions.length} answered`;
    }

    return {
      id,
      ...copy,
      completionPct,
      status,
      statLine,
      statSubline,
    };
  });
}

export function computeCoupleWeddingJourneyProgressPct(
  input: CoupleWeddingJourneyProgressInput,
): number {
  const cards = buildCoupleWeddingChapterCards(input);
  if (cards.length === 0) return 0;
  const sum = cards.reduce((acc, card) => acc + card.completionPct, 0);
  return Math.round(sum / cards.length);
}

/** Dashboard hero only — excludes placeholder chapters (Your Team, Final Review). */
export function computeCoupleWeddingStoryHeroProgressPct(
  input: CoupleWeddingJourneyProgressInput,
): number {
  const pcts = COUPLE_WEDDING_STORY_CHAPTER_IDS.map((id) =>
    computeCoupleWeddingChapterCompletionPct(id, input),
  );
  if (pcts.length === 0) return 0;
  return Math.round(pcts.reduce((acc, pct) => acc + pct, 0) / pcts.length);
}

export function hasAnyCoupleWeddingStoryChapterStarted(
  cards: CoupleWeddingChapterCardModel[],
): boolean {
  return cards
    .filter((card) => COUPLE_WEDDING_STORY_CHAPTER_IDS.includes(card.id))
    .some((card) => card.status !== "Not Started");
}

export function coupleWeddingChapterDashboardCtaLabel(
  chapterId: CoupleWeddingChapterId,
  hasAnyStoryChapterStarted: boolean,
): string {
  const title = coupleWeddingChapterNavLabel(chapterId);
  if (!hasAnyStoryChapterStarted && chapterId === "about_you") {
    return "Begin About You";
  }
  return `Continue ${title}`;
}

export function firstIncompleteCoupleWeddingStoryChapter(
  input: CoupleWeddingJourneyProgressInput,
): CoupleWeddingChapterId | null {
  for (const id of COUPLE_WEDDING_STORY_CHAPTER_IDS) {
    if (computeCoupleWeddingChapterCompletionPct(id, input) < 100) {
      return id;
    }
  }
  return null;
}

export function firstIncompleteCoupleWeddingChapter(
  input: CoupleWeddingJourneyProgressInput,
): CoupleWeddingChapterId | null {
  for (const id of COUPLE_WEDDING_JOURNEY_CHAPTER_ORDER) {
    if (computeCoupleWeddingChapterCompletionPct(id, input) < 100) {
      return id;
    }
  }
  return null;
}

export function nextCoupleWeddingChapterAfter(
  chapterId: CoupleWeddingChapterId,
): CoupleWeddingChapterId | null {
  const index = COUPLE_WEDDING_JOURNEY_CHAPTER_ORDER.indexOf(chapterId);
  if (index === -1 || index >= COUPLE_WEDDING_JOURNEY_CHAPTER_ORDER.length - 1) {
    return null;
  }
  return COUPLE_WEDDING_JOURNEY_CHAPTER_ORDER[index + 1] ?? null;
}

export function coupleWeddingChapterNavLabel(chapterId: CoupleWeddingChapterId): string {
  return CHAPTER_CARD_COPY[chapterId].title;
}

export function isCoupleWeddingGuidedChapter(chapterId: CoupleWeddingChapterId): boolean {
  return chapterId !== "your_team" && chapterId !== "final_review";
}
