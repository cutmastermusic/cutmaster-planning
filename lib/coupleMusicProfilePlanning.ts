/** Music Profile chapter — planning question IDs and option catalogs. */

export const MUSIC_PROFILE_QUESTION_IDS = {
  importance: "pq_music_importance",
  danceFloorStyle: "pq_music_dance_floor_style",
  decades: "pq_music_decades",
  genresLove: "pq_music_genres_love",
  genresAvoid: "pq_music_genres_avoid",
  lineDancesAttitude: "pq_music_line_dances_attitude",
  lineDancesPick: "pq_music_line_dances_pick",
  otherNotes: "pq_music_other_notes",
} as const;

/** Retained in planningQuestionAnswers for saved events; not shown in the couple Music Profile flow. */
export const MUSIC_PROFILE_LEGACY_QUESTION_IDS = [
  "pq_must_play_vibe",
  "pq_do_not_play_notes",
  "pq_music_participation_attitude",
  "pq_music_participation_pick",
  "pq_music_involvement",
] as const;

export const MUSIC_PROFILE_GUIDED_STEP_COUNT = 7;

export const MUSIC_PROFILE_IMPORTANCE_OPTIONS = [
  "Music is everything",
  "Very important",
  "Somewhat important",
  "We trust our DJ",
] as const;

export const MUSIC_PROFILE_DANCE_FLOOR_OPTIONS = [
  "Sing-Alongs",
  "Club Energy",
  "Mixed Generations",
  "Elegant",
  "Open Format",
  "Throwback Party",
  "Country Party",
  "Latin Party",
  "High Energy",
  "Laid Back",
] as const;

export const MUSIC_PROFILE_DECADE_OPTIONS = [
  "60s",
  "70s",
  "80s",
  "90s",
  "2000s",
  "2010s",
  "Current Hits",
] as const;

export const MUSIC_PROFILE_GENRE_OPTIONS = [
  "Pop",
  "Hip Hop",
  "Country",
  "Rock",
  "Alternative",
  "Indie",
  "EDM",
  "Latin",
  "R&B",
  "Funk / Disco",
] as const;

export const MUSIC_PROFILE_LINE_DANCE_ATTITUDE_OPTIONS = [
  "We love them",
  "Some are fine",
  "Only if requested",
  "Please avoid them",
] as const;

export const MUSIC_PROFILE_LINE_DANCE_PICK_OPTIONS = [
  "Cupid Shuffle",
  "Cha Cha Slide",
  "Wobble",
  "Electric Slide",
  "Copperhead Road",
  "Macarena",
] as const;

/** Legacy participation picks — kept for parsing saved answers only. */
const MUSIC_PROFILE_LEGACY_PARTICIPATION_PICK_OPTIONS = [
  "Sweet Caroline",
  "Don't Stop Believin'",
  "Shout",
  "Friends in Low Places",
  "Piano Man",
] as const;

const ALLOWED_CHIP_SETS: ReadonlyArray<readonly string[]> = [
  MUSIC_PROFILE_DANCE_FLOOR_OPTIONS,
  MUSIC_PROFILE_DECADE_OPTIONS,
  MUSIC_PROFILE_GENRE_OPTIONS,
  MUSIC_PROFILE_LINE_DANCE_PICK_OPTIONS,
  MUSIC_PROFILE_LEGACY_PARTICIPATION_PICK_OPTIONS,
];

function allowedChipValues(): Set<string> {
  const values = new Set<string>();
  for (const options of ALLOWED_CHIP_SETS) {
    for (const option of options) {
      values.add(option);
    }
  }
  return values;
}

const ALLOWED_CHIPS = allowedChipValues();

/** Parse multi-select chip answers stored as JSON array strings in planningQuestionAnswers. */
export function parsePlanningQuestionChipAnswer(raw: string | undefined): string[] {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is string => typeof entry === "string" && ALLOWED_CHIPS.has(entry),
    );
  } catch {
    return [];
  }
}

/** Serialize multi-select chip answers for planningQuestionAnswers. */
export function serializePlanningQuestionChipAnswer(values: readonly string[]): string {
  const unique = [...new Set(values.filter((value) => ALLOWED_CHIPS.has(value)))];
  if (unique.length === 0) return "";
  return JSON.stringify(unique);
}

export function formatPlanningQuestionChipAnswerForDisplay(raw: string | undefined): string {
  const values = parsePlanningQuestionChipAnswer(raw);
  return values.length > 0 ? values.join(", ") : "";
}

function hasSingleAnswer(answers: Record<string, string | undefined>, questionId: string): boolean {
  return Boolean((answers[questionId] ?? "").trim());
}

function hasChipSelections(answers: Record<string, string | undefined>, questionId: string): boolean {
  return parsePlanningQuestionChipAnswer(answers[questionId]).length > 0;
}

/** Required Music Profile fields for chapter completion. */
export function isMusicProfileChapterComplete(answers: Record<string, string | undefined>): boolean {
  return computeMusicProfileChapterCompletionPct(answers) >= 100;
}

/** Completion based on five required fields; optional answers do not block 100%. */
export function computeMusicProfileChapterCompletionPct(
  answers: Record<string, string | undefined>,
): number {
  const requiredChecks = musicProfileRequiredChecks(answers);
  const answered = requiredChecks.filter(Boolean).length;
  return Math.round((answered / requiredChecks.length) * 100);
}

export function countMusicProfileRequiredStepsAnswered(
  answers: Record<string, string | undefined>,
): number {
  return musicProfileRequiredChecks(answers).filter(Boolean).length;
}

function musicProfileRequiredChecks(answers: Record<string, string | undefined>): boolean[] {
  return [
    hasSingleAnswer(answers, MUSIC_PROFILE_QUESTION_IDS.importance),
    hasChipSelections(answers, MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle),
    hasChipSelections(answers, MUSIC_PROFILE_QUESTION_IDS.decades),
    hasChipSelections(answers, MUSIC_PROFILE_QUESTION_IDS.genresLove),
    hasSingleAnswer(answers, MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude),
  ];
}
