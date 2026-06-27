/**
 * Serato library song matching.
 *
 * Takes a client's song list and the DJ's indexed library and produces a
 * MatchResult for every requested song — found, multiple versions, or missing.
 *
 * No file I/O — pure in-memory logic.
 */

import { matchScore, normalizeForMatch, type SeratoTrack } from "@/lib/serato-parser";
import type { SongListType, SongEntry } from "@/types/planning";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchStatus = "found" | "multiple" | "missing";

export type ClientSong = {
  id: string;
  title: string;
  artist: string;
  listType: SongListType;
};

export type MatchResult = {
  clientSong: ClientSong;
  status: MatchStatus;
  /** All library candidates with score ≥ 1, sorted best-first. */
  candidates: SeratoTrack[];
  /** ID of the candidate the DJ has selected (for "multiple" rows). */
  selectedCandidateId: string | null;
};

export type LibraryCheckSummary = {
  results: MatchResult[];
  foundCount: number;
  multipleCount: number;
  missingCount: number;
  totalCount: number;
};

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Score threshold to consider a match meaningful.
 * Score 1 = title "contains" match — too loose, pulls in false positives.
 * Score 2 = exact title match (minimum acceptable confidence).
 * Score 3 = exact title + artist match (highest confidence).
 */
const MIN_SCORE = 2;

/**
 * Find all library tracks that match a client song, sorted by score descending.
 * Tracks with the same score are sub-sorted alphabetically by title for consistency.
 */
function findCandidates(
  title: string,
  artist: string,
  library: SeratoTrack[],
): SeratoTrack[] {
  const scored: Array<{ track: SeratoTrack; score: number }> = [];

  for (const track of library) {
    const score = matchScore(track, title, artist);
    if (score >= MIN_SCORE) {
      scored.push({ track, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.track.title.localeCompare(b.track.title);
  });

  return scored.map((s) => s.track);
}

/**
 * Determine match status from a candidate list.
 * - "found"    — exactly one candidate (or one score-3 match among multiples)
 * - "multiple" — more than one meaningful candidate
 * - "missing"  — no candidates
 */
function resolveStatus(candidates: SeratoTrack[]): MatchStatus {
  if (candidates.length === 0) return "missing";
  // One candidate = clean find. Multiple = let the DJ pick the right version/edit.
  return candidates.length === 1 ? "found" : "multiple";
}

/**
 * Run the full library check for a list of client songs.
 *
 * @param clientSongs  - Songs from the client's song lists.
 * @param library      - Full indexed track list from IndexedDB.
 * @param extraCounts  - Optional additional pick counts (e.g. from ShowFlow tracking)
 *                       keyed by track ID. Merged with any playCount on the track itself.
 */
export function matchSongsToLibrary(
  clientSongs: ClientSong[],
  library: SeratoTrack[],
  extraCounts?: Map<string, number>,
): LibraryCheckSummary {
  const results: MatchResult[] = clientSongs.map((clientSong) => {
    let candidates = findCandidates(clientSong.title, clientSong.artist, library);

    // Sort candidates: highest play/pick count first, then preserve score order (stable sort).
    const hasAnyCounts =
      (extraCounts && extraCounts.size > 0) ||
      candidates.some((c) => (c.playCount ?? 0) > 0);

    if (hasAnyCounts) {
      candidates = [...candidates].sort((a, b) => {
        const countA = (a.playCount ?? 0) + (extraCounts?.get(a.id) ?? 0);
        const countB = (b.playCount ?? 0) + (extraCounts?.get(b.id) ?? 0);
        return countB - countA; // stable: ties keep original score-sorted order
      });
    }

    const status = resolveStatus(candidates);

    // Pre-select the top candidate (highest count + score).
    const selectedCandidateId = candidates[0]?.id ?? null;

    return { clientSong, status, candidates, selectedCandidateId };
  });

  return {
    results,
    foundCount: results.filter((r) => r.status === "found").length,
    multipleCount: results.filter((r) => r.status === "multiple").length,
    missingCount: results.filter((r) => r.status === "missing").length,
    totalCount: results.length,
  };
}

// ─── Adapter: SongEntry → ClientSong ─────────────────────────────────────────

/** Convert a SongEntry from the app's planning data into a ClientSong for matching. */
export function songEntryToClientSong(entry: SongEntry, listType: SongListType): ClientSong {
  return {
    id: entry.id,
    title: entry.title?.trim() ?? "",
    artist: entry.artist?.trim() ?? "",
    listType,
  };
}
