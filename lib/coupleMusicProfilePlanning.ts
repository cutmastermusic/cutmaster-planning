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

/** Music Hub / legacy labels → Music Profile dance-floor chips. */
const DANCE_FLOOR_CHIP_ALIASES: Record<string, string> = {
  Singalongs: "Sing-Alongs",
  "Club Vibes": "Club Energy",
  Nostalgic: "Throwback Party",
  Loungey: "Laid Back",
  "Mixed Ages": "Mixed Generations",
  "Country Friendly": "Country Party",
  "Latin Friendly": "Latin Party",
  "Festival Feel": "High Energy",
  "Party Heavy": "High Energy",
  "Balanced Mix": "Open Format",
  "Classy Dinner Party": "Elegant",
};

/** Music Hub genre/era labels → Music Profile decade chips. */
const DECADE_CHIP_ALIASES: Record<string, string> = {
  Oldies: "60s",
  "Top 40": "Current Hits",
  Throwbacks: "2000s",
};

/** Music Hub genre/era labels → Music Profile genre chips. */
const GENRE_CHIP_ALIASES: Record<string, string> = {
  "Hip-Hop": "Hip Hop",
  "Top 40": "Pop",
  Dance: "EDM",
  Funk: "Funk / Disco",
  Disco: "Funk / Disco",
  Reggaeton: "Latin",
  "Salsa/Bachata": "Latin",
  "Pop Punk": "Rock",
  "Remixes / Mashups": "Pop",
  Motown: "R&B",
};

const LEGACY_MUSIC_INVOLVEMENT_TO_IMPORTANCE: Record<string, string> = {
  "We'll build everything ourselves": "Music is everything",
  "We'll provide lots of guidance": "Very important",
  "We'll provide a few must-plays": "Somewhat important",
  "We trust our DJ completely": "We trust our DJ",
};

function extractRawChipValues(raw: string | undefined): string[] {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    }
    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {
    // fall through — comma-separated or single bare label
  }

  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [trimmed];
}

function normalizeChipSelections(
  rawValues: readonly string[],
  allowed: ReadonlySet<string>,
  aliases: Record<string, string>,
): string[] {
  const next: string[] = [];
  for (const rawValue of rawValues) {
    const trimmed = rawValue.trim();
    if (!trimmed) continue;
    const canonical = aliases[trimmed] ?? trimmed;
    if (!allowed.has(canonical) || next.includes(canonical)) continue;
    next.push(canonical);
  }
  return next;
}

function allowedSetForOptions(options: readonly string[]): ReadonlySet<string> {
  return new Set(options);
}

export function parseMusicProfileDanceFloorAnswer(raw: string | undefined): string[] {
  return normalizeChipSelections(
    extractRawChipValues(raw),
    allowedSetForOptions(MUSIC_PROFILE_DANCE_FLOOR_OPTIONS),
    DANCE_FLOOR_CHIP_ALIASES,
  );
}

export function parseMusicProfileDecadesAnswer(raw: string | undefined): string[] {
  return normalizeChipSelections(
    extractRawChipValues(raw),
    allowedSetForOptions(MUSIC_PROFILE_DECADE_OPTIONS),
    DECADE_CHIP_ALIASES,
  );
}

export function parseMusicProfileGenresAnswer(raw: string | undefined): string[] {
  return normalizeChipSelections(
    extractRawChipValues(raw),
    allowedSetForOptions(MUSIC_PROFILE_GENRE_OPTIONS),
    GENRE_CHIP_ALIASES,
  );
}

export function parseMusicProfileLineDancesPickAnswer(raw: string | undefined): string[] {
  return normalizeChipSelections(extractRawChipValues(raw), ALLOWED_CHIPS, {});
}

export function normalizeMusicProfileImportanceAnswer(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  if ((MUSIC_PROFILE_IMPORTANCE_OPTIONS as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  return LEGACY_MUSIC_INVOLVEMENT_TO_IMPORTANCE[trimmed] ?? trimmed;
}

/** Merge canonical Music Profile keys with legacy planningQuestionAnswers for display/completion. */
export function resolveMusicProfileAnswersForDisplay(
  answers: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const resolved = { ...answers };

  const importance = normalizeMusicProfileImportanceAnswer(
    answers[MUSIC_PROFILE_QUESTION_IDS.importance] ?? answers.pq_music_involvement,
  );
  if (importance) {
    resolved[MUSIC_PROFILE_QUESTION_IDS.importance] = importance;
  }

  const lineDanceAttitude =
    (answers[MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude] ?? "").trim() ||
    (answers.pq_music_participation_attitude ?? "").trim();
  if (lineDanceAttitude) {
    resolved[MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude] = lineDanceAttitude;
  }

  if (parseMusicProfileLineDancesPickAnswer(answers[MUSIC_PROFILE_QUESTION_IDS.lineDancesPick]).length === 0) {
    const legacyPick = answers.pq_music_participation_pick;
    if (legacyPick?.trim()) {
      resolved[MUSIC_PROFILE_QUESTION_IDS.lineDancesPick] = legacyPick;
    }
  }

  return resolved;
}

function normalizeToAnyAllowedChip(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (ALLOWED_CHIPS.has(trimmed)) return trimmed;

  const fromDance = DANCE_FLOOR_CHIP_ALIASES[trimmed];
  if (fromDance && ALLOWED_CHIPS.has(fromDance)) return fromDance;

  const fromDecade = DECADE_CHIP_ALIASES[trimmed];
  if (fromDecade && ALLOWED_CHIPS.has(fromDecade)) return fromDecade;

  const fromGenre = GENRE_CHIP_ALIASES[trimmed];
  if (fromGenre && ALLOWED_CHIPS.has(fromGenre)) return fromGenre;

  return null;
}

/** Parse multi-select chip answers stored as JSON array strings in planningQuestionAnswers. */
export function parsePlanningQuestionChipAnswer(raw: string | undefined): string[] {
  const next: string[] = [];
  for (const entry of extractRawChipValues(raw)) {
    const canonical = normalizeToAnyAllowedChip(entry);
    if (canonical && !next.includes(canonical)) {
      next.push(canonical);
    }
  }
  return next;
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

function hasChipSelections(
  answers: Record<string, string | undefined>,
  questionId: string,
  parse: (raw: string | undefined) => string[],
): boolean {
  return parse(answers[questionId]).length > 0;
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
  const resolved = resolveMusicProfileAnswersForDisplay(answers);
  return [
    Boolean(normalizeMusicProfileImportanceAnswer(resolved[MUSIC_PROFILE_QUESTION_IDS.importance])),
    hasChipSelections(
      resolved,
      MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle,
      parseMusicProfileDanceFloorAnswer,
    ),
    hasChipSelections(resolved, MUSIC_PROFILE_QUESTION_IDS.decades, parseMusicProfileDecadesAnswer),
    hasChipSelections(
      resolved,
      MUSIC_PROFILE_QUESTION_IDS.genresLove,
      parseMusicProfileGenresAnswer,
    ),
    hasSingleAnswer(resolved, MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude),
  ];
}
