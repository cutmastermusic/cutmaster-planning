import type { MusicTasteProfile } from "@/types/planning";

/** Dance floor feel — multi-select chips (Music Hub → Taste profile). */
export const MUSIC_TASTE_DANCE_FLOOR_OPTIONS = [
  "High Energy",
  "Singalongs",
  "Club Vibes",
  "Elegant",
  "Open Format",
  "Nostalgic",
  "Festival Feel",
  "Loungey",
  "Classy Dinner Party",
  "Party Heavy",
  "Balanced Mix",
] as const;

/** Who’s on the floor — multi-select. */
export const MUSIC_TASTE_CROWD_OPTIONS = [
  "Younger Crowd",
  "Family Friendly",
  "Mixed Ages",
  "College Crowd",
  "Multicultural",
  "Latin Friendly",
  "Country Friendly",
  "Hip-Hop Friendly",
  "EDM Friendly",
  "Rock Friendly",
] as const;

/** How music should behave — multi-select (line-dance prefs live in lineDancesAndGroupSongs). */
export const MUSIC_TASTE_BEHAVIOR_OPTIONS = [
  "Clean Music Preferred",
  "Explicit Music OK",
  "Keep It Mainstream",
  "Surprise Us",
  "Deep Cuts Welcome",
] as const;

const LEGACY_LOVE_LINE_DANCE = "Love Line Dances";
const LEGACY_AVOID_LINE_DANCE = "Avoid Line Dances";

/** Line dances & group songs — multi-select (Music Hub). */
export const MUSIC_TASTE_LINE_DANCE_OPTIONS = [
  "Yes to all",
  "No",
  "Cupid Shuffle",
  "Wobble",
  "Electric Slide",
  "Macarena",
  "Cha Cha Slide",
  "YMCA",
  "Copperhead Road",
  "Only if requested",
] as const;

const ALLOWED_DANCE = new Set<string>(MUSIC_TASTE_DANCE_FLOOR_OPTIONS);
const ALLOWED_CROWD = new Set<string>(MUSIC_TASTE_CROWD_OPTIONS);
const ALLOWED_BEHAVIOR = new Set<string>(MUSIC_TASTE_BEHAVIOR_OPTIONS);
const ALLOWED_LINE_DANCES = new Set<string>(MUSIC_TASTE_LINE_DANCE_OPTIONS);

function migrateLegacyLineDanceBehavior(
  behavior: string[],
  lineDances: string[],
): { behavior: string[]; lineDances: string[] } {
  const withoutLegacy = behavior.filter(
    (value) => value !== LEGACY_LOVE_LINE_DANCE && value !== LEGACY_AVOID_LINE_DANCE,
  );
  if (lineDances.length > 0) {
    return { behavior: withoutLegacy, lineDances };
  }
  const migrated: string[] = [];
  if (behavior.includes(LEGACY_LOVE_LINE_DANCE)) migrated.push("Yes to all");
  if (behavior.includes(LEGACY_AVOID_LINE_DANCE)) migrated.push("No");
  return { behavior: withoutLegacy, lineDances: migrated };
}

export function emptyMusicTasteProfile(): MusicTasteProfile {
  return {
    danceFloorStyles: [],
    crowdPreferences: [],
    musicBehavior: [],
    lineDancesAndGroupSongs: [],
    danceFloorVibeNotes: "",
  };
}

/** Normalize persisted / imported JSON to a safe profile (unknown values dropped). */
export function normalizeMusicTasteProfile(raw: unknown): MusicTasteProfile {
  if (!raw || typeof raw !== "object") return emptyMusicTasteProfile();
  const o = raw as Record<string, unknown>;
  const filterAllowed = (arr: unknown, allowed: Set<string>): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string" && allowed.has(x));
  };
  const notes = o.danceFloorVibeNotes;
  const behaviorStrings = Array.isArray(o.musicBehavior)
    ? o.musicBehavior.filter((x): x is string => typeof x === "string")
    : [];
  const lineDancesRaw = filterAllowed(o.lineDancesAndGroupSongs, ALLOWED_LINE_DANCES);
  const migrated = migrateLegacyLineDanceBehavior(behaviorStrings, lineDancesRaw);
  return {
    danceFloorStyles: filterAllowed(o.danceFloorStyles, ALLOWED_DANCE),
    crowdPreferences: filterAllowed(o.crowdPreferences, ALLOWED_CROWD),
    musicBehavior: migrated.behavior.filter((value) => ALLOWED_BEHAVIOR.has(value)),
    lineDancesAndGroupSongs: migrated.lineDances,
    danceFloorVibeNotes: typeof notes === "string" ? notes : "",
  };
}

export function musicTasteProfileHasSelections(p: MusicTasteProfile): boolean {
  return (
    p.danceFloorStyles.length > 0 ||
    p.crowdPreferences.length > 0 ||
    p.musicBehavior.length > 0 ||
    (p.lineDancesAndGroupSongs?.length ?? 0) > 0 ||
    Boolean(p.danceFloorVibeNotes?.trim())
  );
}
