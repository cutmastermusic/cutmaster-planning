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

/** How music should behave — multi-select. */
export const MUSIC_TASTE_BEHAVIOR_OPTIONS = [
  "Clean Music Preferred",
  "Explicit Music OK",
  "Avoid Line Dances",
  "Love Line Dances",
  "Keep It Mainstream",
  "Surprise Us",
  "Deep Cuts Welcome",
] as const;

const ALLOWED_DANCE = new Set<string>(MUSIC_TASTE_DANCE_FLOOR_OPTIONS);
const ALLOWED_CROWD = new Set<string>(MUSIC_TASTE_CROWD_OPTIONS);
const ALLOWED_BEHAVIOR = new Set<string>(MUSIC_TASTE_BEHAVIOR_OPTIONS);

export function emptyMusicTasteProfile(): MusicTasteProfile {
  return {
    danceFloorStyles: [],
    crowdPreferences: [],
    musicBehavior: [],
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
  return {
    danceFloorStyles: filterAllowed(o.danceFloorStyles, ALLOWED_DANCE),
    crowdPreferences: filterAllowed(o.crowdPreferences, ALLOWED_CROWD),
    musicBehavior: filterAllowed(o.musicBehavior, ALLOWED_BEHAVIOR),
    danceFloorVibeNotes: typeof notes === "string" ? notes : "",
  };
}

export function musicTasteProfileHasSelections(p: MusicTasteProfile): boolean {
  return (
    p.danceFloorStyles.length > 0 ||
    p.crowdPreferences.length > 0 ||
    p.musicBehavior.length > 0 ||
    Boolean(p.danceFloorVibeNotes?.trim())
  );
}
