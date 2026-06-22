"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { SpotifyTrackSearchResult } from "@/lib/spotify/types";

type SongSearchAutocompleteProps = {
  disabled?: boolean;
  selectedSong?: SpotifyTrackSearchResult | null;
  onSelect: (song: SpotifyTrackSearchResult) => void;
};

type MusicSearchApiResponse = {
  results: SpotifyTrackSearchResult[];
};

function isSpotifyTrackSearchResult(value: unknown): value is SpotifyTrackSearchResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Record<keyof SpotifyTrackSearchResult, unknown>>;
  return (
    typeof candidate.spotifyId === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.artist === "string" &&
    typeof candidate.album === "string" &&
    (typeof candidate.albumArt === "string" || candidate.albumArt === null) &&
    (typeof candidate.albumArtSmall === "string" || candidate.albumArtSmall === null)
  );
}

function isMusicSearchApiResponse(value: unknown): value is MusicSearchApiResponse {
  if (!value || typeof value !== "object") return false;
  const results = (value as { results?: unknown }).results;
  return Array.isArray(results) && results.every(isSpotifyTrackSearchResult);
}

export function SongSearchAutocomplete({
  disabled = false,
  selectedSong,
  onSelect,
}: SongSearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrackSearchResult[]>([]);
  const [selected, setSelected] = useState<SpotifyTrackSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);
  const trimmedQuery = query.trim();
  const showEmpty = searched && !loading && !error && trimmedQuery.length >= 2 && results.length === 0;
  const selectedForDisplay = selectedSong === undefined ? selected : selectedSong;

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      return;
    }

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      setError(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(false);
      void fetch(`/api/music/search?q=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Music search failed.");
          const body: unknown = await response.json();
          if (!isMusicSearchApiResponse(body)) throw new Error("Unexpected music search response.");
          if (requestIdRef.current !== requestId) return;
          setResults(body.results);
          setSearched(true);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || requestIdRef.current !== requestId) return;
          console.error("[song-search-autocomplete] search failed", err);
          setResults([]);
          setSearched(true);
          setError(true);
        })
        .finally(() => {
          if (requestIdRef.current === requestId) setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [disabled, trimmedQuery]);

  const helperText = useMemo(() => {
    if (disabled) return "Song search is disabled for this session.";
    if (trimmedQuery.length === 0) return "Optional: search Spotify, or type the song manually below.";
    if (trimmedQuery.length < 2) return "Type at least 2 characters to search.";
    if (loading) return "Searching Spotify...";
    if (error) return "Search is unavailable. You can still enter the song manually.";
    if (showEmpty) return "No matches found. You can still enter the song manually.";
    return "Select a result to fill the title and artist fields.";
  }, [disabled, error, loading, showEmpty, trimmedQuery.length]);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
      <label htmlFor="song-search-autocomplete" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600">
        Search Spotify
      </label>
      <input
        id="song-search-autocomplete"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by song or artist"
        disabled={disabled}
        className="mt-1.5 w-full min-h-11 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm transition focus:border-[#C79A5A]/70 focus:outline-none focus:ring-2 focus:ring-[#C79A5A]/25 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <p className="mt-1.5 text-[11px] leading-snug text-stone-500" aria-live="polite">
        {helperText}
      </p>

      {results.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {results.map((result) => (
            <button
              key={result.spotifyId}
              type="button"
              disabled={disabled}
              onClick={() => {
                setSelected(result);
                onSelect(result);
                setResults([]);
              }}
              className="flex w-full min-w-0 touch-manipulation items-center gap-3 border-b border-stone-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {result.albumArtSmall ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.albumArtSmall}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="h-10 w-10 shrink-0 rounded-lg border border-stone-200 bg-stone-100" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-stone-900">{result.title}</span>
                <span className="block truncate text-xs text-stone-600">
                  {result.artist}
                  {result.album ? ` · ${result.album}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedForDisplay ? (
        <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-[#7F8F7A]/40 bg-white px-2.5 py-2">
          {selectedForDisplay.albumArtSmall ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedForDisplay.albumArtSmall}
              alt=""
              className="h-8 w-8 shrink-0 rounded-md object-cover"
              loading="lazy"
            />
          ) : null}
          <p className="min-w-0 truncate text-[11px] font-medium text-stone-700">
            Selected from Spotify: <span className="font-semibold text-stone-900">{selectedForDisplay.title}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
