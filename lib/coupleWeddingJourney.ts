import type { PlanningQuestionDef } from "@/types/planning";
import { computePlanningQuestionGroupCompletion } from "@/data/planningQuestionGroups";
import {
  computeReceptionMomentsChapterCompletionPct,
  countReceptionMomentsRequiredStepsAnswered,
  countReceptionMomentsRequiredStepsTotal,
} from "@/lib/coupleReceptionMomentsPlanning";
import {
  computeCeremonyChapterCompletionPct,
  countCeremonyRequiredStepsAnswered,
  countCeremonyRequiredStepsTotal,
} from "@/lib/coupleCeremonyPlanning";
import { MUSIC_PROFILE_GUIDED_STEP_COUNT } from "@/lib/coupleMusicProfilePlanning";
import {
  computeYourTeamChapterCompletionPct,
  countYourTeamRequiredStepsAnswered,
} from "@/lib/coupleYourTeamPlanning";
import { GRAND_ENTRANCE_PLANNING_LINEUP_KEY } from "@/lib/grandEntranceDetail";
import { SPEECHES_TOASTS_PLANNING_KEY } from "@/lib/speechesToasts";

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
  "music_vibe",
  "your_team",
  "final_review",
];

/** Guided story chapters counted in the couple dashboard hero progress bar. */
export const COUPLE_WEDDING_STORY_CHAPTER_IDS: CoupleWeddingChapterId[] = [
  "about_you",
  "ceremony",
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
  musicHubHasSignal: boolean;
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
    return computeYourTeamChapterCompletionPct(answers);
  }

  if (chapterId === "music_vibe") {
    return input.musicHubHasSignal ? 100 : 0;
  }

  if (chapterId === "ceremony") {
    return computeCeremonyChapterCompletionPct(answers);
  }

  if (chapterId === "reception_moments") {
    const row = planningQuestionsGroupedBySection.find((entry) => entry.group.id === chapterId);
    return computeReceptionMomentsChapterCompletionPct({
      answers,
      showWeddingPartyLineupSection: input.showWeddingPartyLineupSection,
      showSpeechesToastsSection: input.showSpeechesToastsSection,
      rowQuestions: row?.questions,
    });
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
    description: "Ceremony audio with Cutmaster, start time, and location—short and practical.",
    isPlaceholder: false,
  },
  reception_moments: {
    kicker: "Chapter 3",
    title: "Reception Moments",
    description: "Entrance, toasts, dances, traditions, and your last dance.",
    isPlaceholder: false,
  },
  music_vibe: {
    kicker: "Chapter 3",
    title: "Music Profile",
    description: "Your musical identity—energy, genres, and dance-floor vision before playlists.",
    isPlaceholder: false,
  },
  your_team: {
    kicker: "Chapter 4",
    title: "Your Team",
    description: "Who you've booked—and who's still on your list.",
    isPlaceholder: false,
  },
  final_review: {
    kicker: "Chapter 5",
    title: "Final Review",
    description: "A calm pass to confirm your story is ready for the big day.",
    isPlaceholder: false,
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
      const requiredTotal = countReceptionMomentsRequiredStepsTotal({
        answers: input.answers,
        showWeddingPartyLineupSection: input.showWeddingPartyLineupSection,
        showSpeechesToastsSection: input.showSpeechesToastsSection,
        rowQuestions: visibleQuestions,
      });
      const answered = countReceptionMomentsRequiredStepsAnswered({
        answers: input.answers,
        showWeddingPartyLineupSection: input.showWeddingPartyLineupSection,
        showSpeechesToastsSection: input.showSpeechesToastsSection,
        rowQuestions: visibleQuestions,
      });
      const stepLabel = requiredTotal === 1 ? "step" : "steps";
      statLine = `${completionPct}% complete · ${answered}/${requiredTotal} ${stepLabel}`;
      statSubline = "Not sure yet is fine—you can revisit wedding party and toasts anytime";
    } else if (id === "music_vibe") {
      statLine = `${completionPct}% complete · ${MUSIC_PROFILE_GUIDED_STEP_COUNT} steps`;
      statSubline = "Capture your vibe before building playlists in Music Hub";
    } else if (id === "ceremony") {
      const requiredTotal = countCeremonyRequiredStepsTotal(input.answers);
      const answered = countCeremonyRequiredStepsAnswered(input.answers);
      const stepLabel = requiredTotal === 1 ? "step" : "steps";
      statLine = `${completionPct}% complete · ${answered}/${requiredTotal} ${stepLabel}`;
      statSubline = "Say No to Cutmaster ceremony audio if we are not providing it";
    } else if (id === "your_team") {
      const answered = countYourTeamRequiredStepsAnswered(input.answers);
      statLine = `${completionPct}% complete · ${answered}/5 steps`;
      statSubline = "Booked or not yet—either answer helps us coordinate";
    } else if (id === "final_review") {
      statLine =
        completionPct >= 100
          ? "Ready for your final pass"
          : "Opens for a final pass once Chapters 1–4 are complete";
      statSubline = "Tap anytime to see what still needs attention";
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

/** Dashboard hero only — excludes Your Team and Final Review. */
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

/** Story-chapter average for couple dashboard hero copy (excludes Your Team / Final Review). */
export function computeCoupleWeddingStoryHeroProgressPctFromCards(
  cards: CoupleWeddingChapterCardModel[],
): number {
  const storyCards = cards.filter((card) =>
    COUPLE_WEDDING_STORY_CHAPTER_IDS.includes(card.id),
  );
  if (storyCards.length === 0) return 0;
  return Math.round(
    storyCards.reduce((acc, card) => acc + card.completionPct, 0) / storyCards.length,
  );
}

export function resolveCoupleHeroTagline(input: {
  isCoupleWeddingPlanningView: boolean;
  sectionPlanningQuestionsEnabled: boolean;
  coupleWeddingStoryChapterStarted: boolean;
  isCoupleWeddingJourneyComplete: boolean;
  coupleWeddingChapterCards: CoupleWeddingChapterCardModel[];
}): string {
  const brandNewCopy = "Welcome — let's start shaping your celebration.";

  if (!input.isCoupleWeddingPlanningView || !input.sectionPlanningQuestionsEnabled) {
    return brandNewCopy;
  }

  if (input.isCoupleWeddingJourneyComplete) {
    return "You're almost ready for an unforgettable celebration.";
  }

  const progressPct = computeCoupleWeddingStoryHeroProgressPctFromCards(
    input.coupleWeddingChapterCards,
  );

  if (!input.coupleWeddingStoryChapterStarted || progressPct < 8) {
    return brandNewCopy;
  }
  if (progressPct < 35) {
    return "You're off to a great start. Let's keep the momentum going.";
  }
  if (progressPct < 72) {
    return "Everything is coming together beautifully.";
  }
  return "You're almost ready for an unforgettable celebration.";
}

export function coupleWeddingChapterDashboardCtaLabel(
  chapterId: CoupleWeddingChapterId,
  status: CoupleWeddingChapterStatus,
): string {
  const title = coupleWeddingChapterNavLabel(chapterId);
  if (status === "Not Started") {
    return `Start ${title}`;
  }
  if (status === "In Progress") {
    return `Continue ${title}`;
  }
  return `Open ${title}`;
}

/** Short footer label on couple dashboard chapter cards (status only). */
export function coupleWeddingChapterCardFooterLabel(status: CoupleWeddingChapterStatus): string {
  if (status === "Complete") return "Revisit";
  if (status === "In Progress") return "Continue";
  return "Start";
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
