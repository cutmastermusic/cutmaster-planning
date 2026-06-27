"use client";

/**
 * SpotifyRecommendations
 *
 * Takes a client's song list and fetches 20 Spotify-sourced recommendations
 * tuned to the list's vibe (dinner = mellow, dance floor = high energy, etc.).
 *
 * Each recommendation shows whether it's in the DJ's indexed library.
 * Tapping "+" adds it directly to the client's list.
 */

import { useCallback, useEffect, useState } from "react";

import { getIndexedTracks } from "@/lib/serato-library";
import { matchScore } from "@/lib/serato-parser";
import type { SongListType, SongEntry } from "@/types/planning";
import type { SpotifyRecommendation } from "@/lib/spotify/getRecommendations";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  songs: SongEntry[];
  listType: SongListType;
  /** Called when the DJ taps "+" on a recommendation. */
  onAddSong: (title: string, artist: string) => void;
};

type LibraryStatus = "in-library" | "not-in-library" | "unknown";

type RecommendationRow = SpotifyRecommendation & {
  libraryStatus: LibraryStatus;
  added: boolean;
};

type RecommendationsApiResponse =
  | {
      ok: true;
      data: SpotifyRecommendation[];
      source: "spotify-recommendations";
      message?: string;
    }
  | { ok: false; message: string; code?: string; debug?: Record<string, unknown> };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIST_LABELS: Record<SongListType, string> = {
  preCeremony: "Pre-Ceremony",
  mustPlay: "Must Play",
  doNotPlay: "Do Not Play",
  playIfPossible: "Open Dancing",
  cocktailHour: "Cocktail Hour",
  dinner: "Dinner",
};

function EnergyBar({ value }: { value: number | null }) {
  if (value === null) return null;
  const pct = Math.round(value * 100);
  const color = value >= 0.7 ? "bg-rose-400" : value >= 0.45 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-1" title={`Energy ${pct}%`}>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-stone-400">{pct}%</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpotifyRecommendations({ songs, listType, onAddSong }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rows, setRows] = useState<RecommendationRow[]>([]);

  useEffect(() => {
    console.info("[SpotifyRecommendations] rendered", {
      listType,
      songCount: songs.length,
      seeds: songs.slice(0, 5).map((song) => ({ title: song.title, artist: song.artist ?? "" })),
    });
  }, [listType, songs]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    setRows([]);

    // Use up to 5 songs from the list as seeds
    const seeds = songs
      .slice(0, 5)
      .map((s) => ({ title: s.title?.trim() ?? "", artist: s.artist?.trim() ?? "" }))
      .filter((seed) => seed.title);
    console.info("[SpotifyRecommendations] fetch requested", { listType, seedCount: seeds.length, seeds });
    if (seeds.length === 0) {
      setError("Add songs first. Recommendations use songs from this list as seeds.");
      setLoading(false);
      return;
    }

    try {
      const requestBody = { seeds, listType, limit: 20 };
      console.info("[SpotifyRecommendations] POST /api/music/recommendations", requestBody);
      const res = await fetch("/api/music/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const json = (await res.json()) as RecommendationsApiResponse;
      console.info("[SpotifyRecommendations] response", {
        status: res.status,
        ok: json.ok,
        source: json.ok ? json.source : undefined,
        count: json.ok ? json.data.length : 0,
        message: json.message,
        code: json.ok ? undefined : json.code,
        debug: json.ok ? undefined : json.debug,
      });

      if (!json.ok) {
        setError(json.message);
        setLoading(false);
        return;
      }
      if (json.message) {
        setNotice(json.message);
      }
      if (json.data.length === 0) {
        setError("Spotify returned no recommendations for these songs.");
        setLoading(false);
        return;
      }

      // Check each recommendation against the indexed library
      let library: Awaited<ReturnType<typeof getIndexedTracks>> = [];
      try {
        library = await getIndexedTracks();
      } catch {
        // Library not indexed — show "unknown" status for all
      }

      const result: RecommendationRow[] = json.data.map((rec) => {
        let libraryStatus: LibraryStatus = library.length === 0 ? "unknown" : "not-in-library";
        if (library.length > 0) {
          const match = library.some((t) => matchScore(t, rec.title, rec.artist) >= 2);
          if (match) libraryStatus = "in-library";
        }
        return { ...rec, libraryStatus, added: false };
      });

      setRows(result);
    } catch {
      console.error("[SpotifyRecommendations] request failed");
      setError("Could not load recommendations. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [songs, listType]);

  const handleOpen = useCallback(() => {
    console.info("[SpotifyRecommendations] button clicked", { listType, songCount: songs.length });
    setOpen(true);
    void fetchRecommendations();
  }, [fetchRecommendations, listType, songs.length]);

  const handleAdd = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row || row.added) return;
      onAddSong(row.title, row.artist);
      setRows((prev) => prev.map((r, i) => (i === index ? { ...r, added: true } : r)));
    },
    [rows, onAddSong],
  );

  if (!open) {
    if (songs.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/70 px-4 py-3 text-center text-sm font-medium text-stone-500">
          Add songs first to get {LIST_LABELS[listType]} recommendations.
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1DB954]/40 bg-[#1DB954]/5 px-4 py-3 text-sm font-medium text-[#1a8a3e] transition hover:border-[#1DB954]/60 hover:bg-[#1DB954]/10"
      >
        {/* Spotify-ish sparkle icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 1.5c3.59 0 6.5 2.91 6.5 6.5S11.59 14.5 8 14.5 1.5 11.59 1.5 8 4.41 1.5 8 1.5zm-3.2 7.3a.42.42 0 00.58.14c1.55-.95 3.5-1.16 5.8-.64a.42.42 0 00.2-.82c-2.55-.57-4.73-.33-6.44.74a.42.42 0 00-.14.58zm-.37-1.9a.52.52 0 00.72.17c1.78-1.09 4.46-1.4 6.58-.77a.52.52 0 10.3-1c-2.39-.73-5.37-.38-7.43.87a.52.52 0 00-.17.72zm-.06-1.97a.62.62 0 00.86.21C7.18 3.9 10.74 3.76 13.1 4.6a.62.62 0 10.42-1.17C11.1 2.5 7.16 2.65 4.58 4.23a.62.62 0 00-.21.7z" fill="currentColor" />
        </svg>
        Get {LIST_LABELS[listType]} recommendations
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 1.5c3.59 0 6.5 2.91 6.5 6.5S11.59 14.5 8 14.5 1.5 11.59 1.5 8 4.41 1.5 8 1.5zm-3.2 7.3a.42.42 0 00.58.14c1.55-.95 3.5-1.16 5.8-.64a.42.42 0 00.2-.82c-2.55-.57-4.73-.33-6.44.74a.42.42 0 00-.14.58zm-.37-1.9a.52.52 0 00.72.17c1.78-1.09 4.46-1.4 6.58-.77a.52.52 0 10.3-1c-2.39-.73-5.37-.38-7.43.87a.52.52 0 00-.17.72zm-.06-1.97a.62.62 0 00.86.21C7.18 3.9 10.74 3.76 13.1 4.6a.62.62 0 10.42-1.17C11.1 2.5 7.16 2.65 4.58 4.23a.62.62 0 00-.21.7z" fill="#1DB954" />
          </svg>
          <span className="text-[11px] font-semibold text-stone-700">
            Suggested additions · {LIST_LABELS[listType]}
          </span>
          {rows.length > 0 && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
              {rows.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchRecommendations()}
            disabled={loading}
            className="rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-40"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-500 transition hover:border-stone-300 hover:bg-stone-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {loading && (
          <div className="flex items-center gap-3 py-6 justify-center">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1DB954]/30 border-t-[#1DB954]" />
            <span className="text-sm text-stone-500">Finding songs you might love…</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-800">Couldn&apos;t load recommendations</p>
            <p className="mt-0.5 text-sm text-rose-700">{error}</p>
          </div>
        )}

        {notice && !loading && !error && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-sm font-semibold text-amber-900">{notice}</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="space-y-1">
            {rows.map((row, i) => (
              <div
                key={row.spotifyId}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  row.added ? "bg-emerald-50" : "hover:bg-stone-50"
                }`}
              >
                {/* Album art */}
                {row.albumArtSmall ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.albumArtSmall}
                    alt={row.album}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-stone-100 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M9 18V5l12-2v13" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="6" cy="18" r="3" stroke="#94a3b8" strokeWidth="2" />
                      <circle cx="18" cy="16" r="3" stroke="#94a3b8" strokeWidth="2" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800 leading-tight">{row.title}</p>
                  <p className="truncate text-[12px] text-stone-500 leading-tight mt-0.5">{row.artist}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {row.bpm && (
                      <span className="text-[10px] font-medium text-stone-400">{row.bpm} BPM</span>
                    )}
                    <EnergyBar value={row.energy} />
                    {row.libraryStatus === "in-library" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                          <path d="M1.5 4l1.5 1.5L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        In your library
                      </span>
                    )}
                    {row.libraryStatus === "not-in-library" && (
                      <span className="text-[10px] text-stone-400">Not in library</span>
                    )}
                  </div>
                </div>

                {/* Add button */}
                <button
                  type="button"
                  onClick={() => handleAdd(i)}
                  disabled={row.added}
                  title={row.added ? "Added" : `Add to ${LIST_LABELS[listType]}`}
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition ${
                    row.added
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-stone-200 bg-white text-stone-400 hover:border-[#2f4a3e]/40 hover:text-[#2f4a3e]"
                  }`}
                >
                  {row.added ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 flex items-center gap-1 text-[10px] text-stone-400">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 1.5c3.59 0 6.5 2.91 6.5 6.5S11.59 14.5 8 14.5 1.5 11.59 1.5 8 4.41 1.5 8 1.5zm-3.2 7.3a.42.42 0 00.58.14c1.55-.95 3.5-1.16 5.8-.64a.42.42 0 00.2-.82c-2.55-.57-4.73-.33-6.44.74a.42.42 0 00-.14.58zm-.37-1.9a.52.52 0 00.72.17c1.78-1.09 4.46-1.4 6.58-.77a.52.52 0 10.3-1c-2.39-.73-5.37-.38-7.43.87a.52.52 0 00-.17.72zm-.06-1.97a.62.62 0 00.86.21C7.18 3.9 10.74 3.76 13.1 4.6a.62.62 0 10.42-1.17C11.1 2.5 7.16 2.65 4.58 4.23a.62.62 0 00-.21.7z" fill="currentColor" />
          </svg>
          Powered by Spotify · Recommendations are seeded from this list&apos;s songs
        </p>
      </div>
    </div>
  );
}
