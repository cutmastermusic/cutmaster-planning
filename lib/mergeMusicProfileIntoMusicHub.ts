import { MUSIC_GENRE_ERA_OPTIONS } from "@/data/musicGenreEraOptions";
import {
  MUSIC_TASTE_CROWD_OPTIONS,
  MUSIC_TASTE_DANCE_FLOOR_OPTIONS,
  MUSIC_TASTE_LINE_DANCE_OPTIONS,
  normalizeMusicTasteProfile,
} from "@/data/musicTasteProfileCatalog";
import {
  MUSIC_PROFILE_QUESTION_IDS,
  parseMusicProfileDanceFloorAnswer,
  parseMusicProfileDecadesAnswer,
  parseMusicProfileGenresAnswer,
  parseMusicProfileLineDancesPickAnswer,
  resolveMusicProfileAnswersForDisplay,
} from "@/lib/coupleMusicProfilePlanning";
import type { MusicTasteProfile, MusicVibeDetail } from "@/types/planning";

const ALLOWED_DANCE_FLOOR = new Set<string>(MUSIC_TASTE_DANCE_FLOOR_OPTIONS);
const ALLOWED_CROWD = new Set<string>(MUSIC_TASTE_CROWD_OPTIONS);
const ALLOWED_LINE_DANCES = new Set<string>(MUSIC_TASTE_LINE_DANCE_OPTIONS);
const ALLOWED_GENRE_ERA = new Set<string>(MUSIC_GENRE_ERA_OPTIONS);
const GENRE_ERA_ORDER = new Map(MUSIC_GENRE_ERA_OPTIONS.map((label, index) => [label, index]));

/** Music Profile dance floor chip → Music Hub taste profile dance floor style. */
const DANCE_FLOOR_STYLE_MAP: Record<string, string> = {
  "Sing-Alongs": "Singalongs",
  "Club Energy": "Club Vibes",
  Elegant: "Elegant",
  "Open Format": "Open Format",
  "Throwback Party": "Nostalgic",
  "High Energy": "High Energy",
  "Laid Back": "Loungey",
};

/** Music Profile dance floor chip → Music Hub crowd preference (when applicable). */
const DANCE_FLOOR_CROWD_MAP: Record<string, string> = {
  "Mixed Generations": "Mixed Ages",
  "Country Party": "Country Friendly",
  "Latin Party": "Latin Friendly",
};

/** Music Profile decade chip → Music Hub genre/era chip. */
const DECADE_GENRE_ERA_MAP: Record<string, string> = {
  "60s": "Oldies",
  "70s": "70s",
  "80s": "80s",
  "90s": "90s",
  "2000s": "2000s",
  "2010s": "Top 40",
  "Current Hits": "Top 40",
};

/** Music Profile genre chip → Music Hub genre/era chip(s). */
const GENRE_LOVE_GENRE_ERA_MAP: Record<string, string[]> = {
  Pop: ["Top 40"],
  "Hip Hop": ["Hip-Hop"],
  Country: ["Country"],
  Rock: ["Rock"],
  Alternative: ["Rock"],
  Indie: ["Indie"],
  EDM: ["EDM"],
  Latin: ["Latin"],
  "R&B": ["R&B"],
  "Funk / Disco": ["Funk", "Disco"],
};

const LINE_DANCE_ATTITUDE_MAP: Record<string, string | null> = {
  "We love them": "Yes to all",
  "Some are fine": null,
  "Only if requested": "Only if requested",
  "Please avoid them": "No",
};

export type MergeMusicProfileIntoMusicHubInput = {
  planningQuestionAnswers: Record<string, string | undefined>;
  musicTasteProfile: MusicTasteProfile;
  musicGenreEraSelections: string[];
  musicVibeDetail: MusicVibeDetail;
};

export type MergeMusicProfileIntoMusicHubResult = {
  musicTasteProfile: MusicTasteProfile;
  musicGenreEraSelections: string[];
  musicVibeDetail: MusicVibeDetail;
  changed: boolean;
};

function mergeAllowedStrings(
  existing: string[],
  additions: string[],
  allowed: Set<string>,
): { next: string[]; added: boolean } {
  const next = [...existing];
  let added = false;
  for (const value of additions) {
    if (!allowed.has(value) || next.includes(value)) continue;
    next.push(value);
    added = true;
  }
  return { next, added };
}

function sortGenreEraSelections(values: string[]): string[] {
  return [...values].sort(
    (a, b) => (GENRE_ERA_ORDER.get(a) ?? 999) - (GENRE_ERA_ORDER.get(b) ?? 999),
  );
}

function appendNoteBlock(existing: string, block: string): { next: string; added: boolean } {
  const trimmedBlock = block.trim();
  if (!trimmedBlock) return { next: existing, added: false };
  const trimmedExisting = existing.trim();
  if (trimmedExisting.includes(trimmedBlock)) return { next: existing, added: false };
  const next = trimmedExisting ? `${trimmedExisting}\n\n${trimmedBlock}` : trimmedBlock;
  return { next, added: true };
}

function mapDanceFloorStyles(profileSelections: string[]): string[] {
  return profileSelections
    .map((value) => DANCE_FLOOR_STYLE_MAP[value])
    .filter((value): value is string => Boolean(value));
}

function mapCrowdFromDanceFloor(profileSelections: string[]): string[] {
  return profileSelections
    .map((value) => DANCE_FLOOR_CROWD_MAP[value])
    .filter((value): value is string => Boolean(value));
}

function mapDecadesToGenreEra(profileSelections: string[]): string[] {
  return profileSelections
    .map((value) => DECADE_GENRE_ERA_MAP[value])
    .filter((value): value is string => Boolean(value));
}

function mapGenresLoveToGenreEra(profileSelections: string[]): string[] {
  const mapped: string[] = [];
  for (const value of profileSelections) {
    for (const target of GENRE_LOVE_GENRE_ERA_MAP[value] ?? []) {
      mapped.push(target);
    }
  }
  return mapped;
}

function mapLineDanceAttitude(attitude: string): string[] {
  const mapped = LINE_DANCE_ATTITUDE_MAP[attitude.trim()];
  return mapped ? [mapped] : [];
}

/**
 * One-way merge: Music Profile planning answers → Music Hub taste fields.
 * Never removes existing Music Hub values; only adds compatible selections and note blocks.
 */
export function mergeMusicProfileIntoMusicHub(
  input: MergeMusicProfileIntoMusicHubInput,
): MergeMusicProfileIntoMusicHubResult {
  const answers = resolveMusicProfileAnswersForDisplay(input.planningQuestionAnswers);
  let changed = false;

  const taste = normalizeMusicTasteProfile(input.musicTasteProfile);
  let genreEra = [...input.musicGenreEraSelections];
  let vibeDetail: MusicVibeDetail = { ...input.musicVibeDetail };

  const danceFloorProfile = parseMusicProfileDanceFloorAnswer(
    answers[MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle],
  );
  const decadesProfile = parseMusicProfileDecadesAnswer(answers[MUSIC_PROFILE_QUESTION_IDS.decades]);
  const genresLoveProfile = parseMusicProfileGenresAnswer(
    answers[MUSIC_PROFILE_QUESTION_IDS.genresLove],
  );
  const genresAvoidProfile = parseMusicProfileGenresAnswer(
    answers[MUSIC_PROFILE_QUESTION_IDS.genresAvoid],
  );
  const lineDanceAttitude = (answers[MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude] ?? "").trim();
  const lineDancePicks = parseMusicProfileLineDancesPickAnswer(
    answers[MUSIC_PROFILE_QUESTION_IDS.lineDancesPick],
  );
  const importance = (answers[MUSIC_PROFILE_QUESTION_IDS.importance] ?? "").trim();
  const otherNotes = (answers[MUSIC_PROFILE_QUESTION_IDS.otherNotes] ?? "").trim();

  const danceFloorMerge = mergeAllowedStrings(
    taste.danceFloorStyles,
    mapDanceFloorStyles(danceFloorProfile),
    ALLOWED_DANCE_FLOOR,
  );
  if (danceFloorMerge.added) changed = true;
  taste.danceFloorStyles = danceFloorMerge.next;

  const crowdMerge = mergeAllowedStrings(
    taste.crowdPreferences,
    mapCrowdFromDanceFloor(danceFloorProfile),
    ALLOWED_CROWD,
  );
  if (crowdMerge.added) changed = true;
  taste.crowdPreferences = crowdMerge.next;

  const genreEraAdds = [
    ...mapDecadesToGenreEra(decadesProfile),
    ...mapGenresLoveToGenreEra(genresLoveProfile),
  ];
  const genreEraMerge = mergeAllowedStrings(genreEra, genreEraAdds, ALLOWED_GENRE_ERA);
  if (genreEraMerge.added) changed = true;
  genreEra = sortGenreEraSelections(genreEraMerge.next);

  const lineDanceMerge = mergeAllowedStrings(
    taste.lineDancesAndGroupSongs ?? [],
    [...mapLineDanceAttitude(lineDanceAttitude), ...lineDancePicks],
    ALLOWED_LINE_DANCES,
  );
  if (lineDanceMerge.added) changed = true;
  taste.lineDancesAndGroupSongs = lineDanceMerge.next;

  if (importance) {
    const importanceBlock = `Music importance (from Music Profile): ${importance}`;
    const notesMerge = appendNoteBlock(taste.danceFloorVibeNotes ?? "", importanceBlock);
    if (notesMerge.added) changed = true;
    taste.danceFloorVibeNotes = notesMerge.next;
  }

  if (otherNotes) {
    const notesMerge = appendNoteBlock(taste.danceFloorVibeNotes ?? "", otherNotes);
    if (notesMerge.added) changed = true;
    taste.danceFloorVibeNotes = notesMerge.next;
  }

  if (genresAvoidProfile.length > 0) {
    const avoidBlock = `Genres to minimize (from Music Profile): ${genresAvoidProfile.join(", ")}`;
    const cleanMerge = appendNoteBlock(vibeDetail.cleanMusicPrefs ?? "", avoidBlock);
    if (cleanMerge.added) changed = true;
    vibeDetail = { ...vibeDetail, cleanMusicPrefs: cleanMerge.next };
  }

  return {
    musicTasteProfile: taste,
    musicGenreEraSelections: genreEra,
    musicVibeDetail: vibeDetail,
    changed,
  };
}

export function musicProfileHasBridgeableAnswers(
  answers: Record<string, string | undefined>,
): boolean {
  const resolved = resolveMusicProfileAnswersForDisplay(answers);
  return (
    Boolean((resolved[MUSIC_PROFILE_QUESTION_IDS.importance] ?? "").trim()) ||
    parseMusicProfileDanceFloorAnswer(resolved[MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle]).length > 0 ||
    parseMusicProfileDecadesAnswer(resolved[MUSIC_PROFILE_QUESTION_IDS.decades]).length > 0 ||
    parseMusicProfileGenresAnswer(resolved[MUSIC_PROFILE_QUESTION_IDS.genresLove]).length > 0 ||
    parseMusicProfileGenresAnswer(resolved[MUSIC_PROFILE_QUESTION_IDS.genresAvoid]).length > 0 ||
    Boolean((resolved[MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude] ?? "").trim()) ||
    parseMusicProfileLineDancesPickAnswer(resolved[MUSIC_PROFILE_QUESTION_IDS.lineDancesPick]).length > 0 ||
    Boolean((resolved[MUSIC_PROFILE_QUESTION_IDS.otherNotes] ?? "").trim())
  );
}
