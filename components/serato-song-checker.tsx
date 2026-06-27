"use client";

/**
 * SeratoSongChecker — DJ/Admin only, never shown to couples.
 *
 * Loads the indexed Serato library from IndexedDB and matches the client's
 * song lists against it. Shows found / multiple versions / missing grouped
 * results with a version picker for ambiguous matches.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getIndexedTracks, getLibraryMeta, recordTrackPick, getTrackPickCounts, getSeratoPlayCounts, getStoredMusicHandle, getMusicRootPath, readTrackPlayCount } from "@/lib/serato-library";
import {
  matchSongsToLibrary,
  songEntryToClientSong,
  type LibraryCheckSummary,
  type MatchResult,
} from "@/lib/serato-matching";
import { buildSeratoCratePathString, exportCrate, type ExportResult } from "@/lib/serato-crate-writer";
import type { SeratoTrack } from "@/lib/serato-parser";
import type { SongEntry } from "@/types/planning";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  preCeremonySongs?: SongEntry[];
  mustPlaySongs: SongEntry[];
  playIfPossibleSongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  cocktailHourSongs?: SongEntry[];
  dinnerSongs?: SongEntry[];
  /** Default crate name — typically the couple/event name. */
  defaultCrateName?: string;
  onGoToLibrary: () => void;
};

type ExportState =
  | { status: "idle" }
  | { status: "exporting" }
  | { status: "success"; result: ExportResult & { ok: true } }
  | { status: "error"; message: string };

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "no-library" }
  | { status: "ready"; summary: LibraryCheckSummary }
  | { status: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LIST_LABELS: Record<string, string> = {
  preCeremony: "Pre-Ceremony Music",
  mustPlay: "Must Play",
  playIfPossible: "Open Dancing",
  doNotPlay: "Songs to Avoid",
  cocktailHour: "Cocktail Hour",
  dinner: "Dinner",
};

const ALL_LIST_TYPES = ["preCeremony", "mustPlay", "playIfPossible", "doNotPlay", "cocktailHour", "dinner"] as const;
type ListType = typeof ALL_LIST_TYPES[number];

const DEFAULT_SINGLE_EXPORT_STATE: ExportState = { status: "idle" };
const SHOW_SERATO_EXPORT_PATH_PREVIEW = process.env.NODE_ENV !== "production";

const SERATO_CRATE_LABELS: Record<ListType, string> = {
  preCeremony: "Pre-Ceremony",
  cocktailHour: "Cocktail Hour",
  dinner: "Dinner",
  playIfPossible: "Open Dancing",
  mustPlay: "Must Play",
  doNotPlay: "Do Not Play",
};

const SERATO_CRATE_EMOJIS: Record<ListType, string> = {
  preCeremony: "🎻",
  cocktailHour: "🥂",
  dinner: "🍽",
  playIfPossible: "💃",
  mustPlay: "⭐",
  doNotPlay: "🚫",
};

function formatPlainSeratoCrateName(eventName: string, listType: ListType): string {
  return `${eventName} - ${SERATO_CRATE_LABELS[listType]}`;
}

function formatSeratoCrateName(eventName: string, listType: ListType, useEmoji = true): string {
  const plainName = formatPlainSeratoCrateName(eventName, listType);
  if (!useEmoji) return plainName;
  const emoji = SERATO_CRATE_EMOJIS[listType];
  return `${emoji} ${plainName} ${emoji}`;
}

function defaultCrateNameForList(defaultCrateName: string, listType: ListType): string {
  return formatSeratoCrateName(defaultCrateName, listType);
}

function isUsableMacMusicBasePath(value: string | null | undefined): value is string {
  const trimmed = value?.trim() ?? "";
  return trimmed.startsWith("/Users/") || trimmed.startsWith("/Volumes/");
}

const SERATO_SETUP_REQUIRED_MESSAGE = "Finish Serato Setup before exporting crates.";

function selectedExportTracks(results: MatchResult[]): SeratoTrack[] {
  return results.flatMap((result) => {
    if (result.status === "missing") return [];
    const track = result.candidates.find((candidate) => candidate.id === result.selectedCandidateId);
    return track ? [track] : [];
  });
}

function buildDefaultCrateNames(defaultCrateName: string): Record<ListType, string> {
  return ALL_LIST_TYPES.reduce(
    (acc, listType) => ({
      ...acc,
      [listType]: defaultCrateNameForList(defaultCrateName, listType),
    }),
    {} as Record<ListType, string>,
  );
}

function buildDefaultExportStates(): Record<ListType, ExportState> {
  return ALL_LIST_TYPES.reduce(
    (acc, listType) => ({
      ...acc,
      [listType]: DEFAULT_SINGLE_EXPORT_STATE,
    }),
    {} as Record<ListType, ExportState>,
  );
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function filename(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MatchResult["status"] }) {
  if (status === "found") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        ✓ Found
      </span>
    );
  }
  if (status === "multiple") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        ⚠ Multiple versions
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
      ✕ Not in library
    </span>
  );
}

// ─── Single result row ────────────────────────────────────────────────────────

function PlayCountBadge({ seratoCount, showflowCount }: { seratoCount?: number; showflowCount?: number }) {
  const total = (seratoCount ?? 0) + (showflowCount ?? 0);
  if (total === 0) return null;
  const label = total === 1 ? "used 1×" : `used ${total}×`;
  const isFrequent = total >= 10;
  return (
    <span
      title={[
        seratoCount ? `Serato plays: ${seratoCount}` : null,
        showflowCount ? `ShowFlow picks: ${showflowCount}` : null,
      ].filter(Boolean).join(" · ")}
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isFrequent
          ? "bg-[#C79A5A]/18 text-[#7a5c1e]"
          : "bg-stone-100 text-stone-500"
      }`}
    >
      {isFrequent ? "★ " : ""}{label}
    </span>
  );
}

function ResultRow({
  result,
  extraCounts,
  musicHandle,
  musicRoot,
  onSelectCandidate,
  onCountsRead,
}: {
  result: MatchResult;
  extraCounts: Map<string, number>;
  musicHandle: FileSystemDirectoryHandle | null;
  musicRoot: string | null;
  onSelectCandidate: (songId: string, candidateId: string) => void;
  onCountsRead: (counts: Map<string, number>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [readingCounts, setReadingCounts] = useState(false);
  const hasReadRef = useRef(false);
  const { clientSong, status, candidates, selectedCandidateId } = result;

  // When expanded for the first time, read SERATO_PLAYCOUNT from ID3 tags
  const handleExpand = useCallback(async () => {
    setExpanded((v) => !v);
    if (hasReadRef.current || !musicHandle || !musicRoot || status !== "multiple") return;
    hasReadRef.current = true;
    setReadingCounts(true);
    try {
      const results = await Promise.allSettled(
        candidates.map((c) => readTrackPlayCount(c.filePath, musicHandle, musicRoot))
      );
      const newCounts = new Map<string, number>();
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value !== undefined) {
          newCounts.set(candidates[i].id, r.value);
        }
      });
      if (newCounts.size > 0) onCountsRead(newCounts);
    } finally {
      setReadingCounts(false);
    }
  }, [candidates, musicHandle, musicRoot, onCountsRead, status]);

  const selectedTrack = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="border-b border-stone-100 py-3 last:border-0">
      {/* Song header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1f2724]">
            {clientSong.title || <span className="italic text-stone-400">Untitled</span>}
          </p>
          {clientSong.artist && (
            <p className="truncate text-xs text-stone-500">{clientSong.artist}</p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Found — show matched track info */}
      {status === "found" && selectedTrack && (
        <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2">
          <p className="truncate text-[12px] font-medium text-emerald-800">
            {selectedTrack.title}
            {selectedTrack.artist ? ` — ${selectedTrack.artist}` : ""}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-emerald-600/70">
            {filename(selectedTrack.filePath)}
            {selectedTrack.bpm ? ` · ${selectedTrack.bpm} BPM` : ""}
            {selectedTrack.key ? ` · ${selectedTrack.key}` : ""}
            {selectedTrack.durationMs ? ` · ${formatDuration(selectedTrack.durationMs)}` : ""}
          </p>
        </div>
      )}

      {/* Multiple — version picker */}
      {status === "multiple" && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExpand()}
              className="text-[11px] font-medium text-[#2f4a3e] underline underline-offset-2"
            >
              {expanded ? "Hide versions" : `${candidates.length} versions — pick one`}
            </button>
            {readingCounts && (
              <span className="text-[10px] text-stone-400">reading play counts…</span>
            )}
          </div>
          {expanded && (
            <div className="mt-1.5 space-y-1.5">
              {candidates.map((track) => {
                const isSelected = track.id === selectedCandidateId;
                const showflowCount = extraCounts.get(track.id) ?? 0;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => onSelectCandidate(clientSong.id, track.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-[#2f4a3e]/40 bg-[#2f4a3e]/8 ring-1 ring-[#2f4a3e]/20"
                        : "border-stone-200 bg-white hover:border-[#2f4a3e]/25 hover:bg-[#f7f5f1]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-[#1f2724]">
                          {track.title}
                          {track.artist ? ` — ${track.artist}` : ""}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-stone-500">
                          {filename(track.filePath)}
                          {track.bpm ? ` · ${track.bpm} BPM` : ""}
                          {track.key ? ` · ${track.key}` : ""}
                          {track.durationMs ? ` · ${formatDuration(track.durationMs)}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <PlayCountBadge seratoCount={track.playCount} showflowCount={showflowCount} />
                        {isSelected && (
                          <span className="text-[11px] font-semibold text-[#2f4a3e]">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function ResultSection({
  title,
  results,
  extraCounts,
  musicHandle,
  musicRoot,
  onSelectCandidate,
  onCountsRead,
  defaultOpen = true,
}: {
  title: string;
  results: MatchResult[];
  extraCounts: Map<string, number>;
  musicHandle: FileSystemDirectoryHandle | null;
  musicRoot: string | null;
  onSelectCandidate: (songId: string, candidateId: string) => void;
  onCountsRead: (counts: Map<string, number>) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (results.length === 0) return null;

  const foundCount = results.filter((r) => r.status === "found").length;
  const multipleCount = results.filter((r) => r.status === "multiple").length;
  const missingCount = results.filter((r) => r.status === "missing").length;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-[#214637]">{title}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
            {results.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {foundCount > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600">✓ {foundCount}</span>
          )}
          {multipleCount > 0 && (
            <span className="text-[11px] font-semibold text-amber-600">⚠ {multipleCount}</span>
          )}
          {missingCount > 0 && (
            <span className="text-[11px] font-semibold text-rose-600">✕ {missingCount}</span>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className={`shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4">
          {results.map((result) => (
            <ResultRow
              key={result.clientSong.id}
              result={result}
              extraCounts={extraCounts}
              musicHandle={musicHandle}
              musicRoot={musicRoot}
              onSelectCandidate={onSelectCandidate}
              onCountsRead={onCountsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SeratoSongChecker({
  preCeremonySongs = [],
  mustPlaySongs,
  playIfPossibleSongs,
  doNotPlaySongs,
  cocktailHourSongs = [],
  dinnerSongs = [],
  defaultCrateName = "ShowFlow Crate",
  onGoToLibrary,
}: Props) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [selections, setSelections] = useState<Record<string, string>>({});
  // Combined counts (serato history + showflow picks) — keyed by track file path
  const [showflowCounts, setShowflowCounts] = useState<Map<string, number>>(new Map());
  const showflowCountsRef = useRef<Map<string, number>>(new Map());
  // Music folder handle for on-demand ID3 play count reading
  const [musicHandle, setMusicHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [musicRoot, setMusicRoot] = useState<string | null>(null);

  // Per-list crate names and export states
  const [crateNames, setCrateNames] = useState<Record<string, string>>(() =>
    buildDefaultCrateNames(defaultCrateName),
  );
  const [exportStates, setExportStates] = useState<Record<string, ExportState>>(() =>
    buildDefaultExportStates(),
  );

  const allClientSongs = useMemo(() => [
    ...preCeremonySongs.map((s) => songEntryToClientSong(s, "preCeremony")),
    ...mustPlaySongs.map((s) => songEntryToClientSong(s, "mustPlay")),
    ...playIfPossibleSongs.map((s) => songEntryToClientSong(s, "playIfPossible")),
    ...doNotPlaySongs.map((s) => songEntryToClientSong(s, "doNotPlay")),
    ...cocktailHourSongs.map((s) => songEntryToClientSong(s, "cocktailHour")),
    ...dinnerSongs.map((s) => songEntryToClientSong(s, "dinner")),
  ], [preCeremonySongs, mustPlaySongs, playIfPossibleSongs, doNotPlaySongs, cocktailHourSongs, dinnerSongs]);

  const runCheck = useCallback(async () => {
    setLoadState({ status: "loading" });
    try {
      const meta = await getLibraryMeta();
      if (!meta || meta.trackCount === 0) {
        setLoadState({ status: "no-library" });
        return;
      }
      // Load library + both count sources in parallel
      const [library, showflowPicks, seratoCounts] = await Promise.all([
        getIndexedTracks(),
        getTrackPickCounts(),
        getSeratoPlayCounts(),
      ]);

      // Merge: serato history counts + showflow pick counts (keyed by file path = track ID)
      const merged = new Map<string, number>();
      for (const [id, count] of seratoCounts) merged.set(id, count);
      for (const [id, count] of showflowPicks) merged.set(id, (merged.get(id) ?? 0) + count);

      showflowCountsRef.current = merged;
      setShowflowCounts(merged);
      const summary = matchSongsToLibrary(allClientSongs, library, merged);
      setLoadState({ status: "ready", summary });
      setSelections({});
    } catch (err) {
      setLoadState({
        status: "error",
        message: err instanceof Error ? err.message : "Check failed. Try again.",
      });
    }
  }, [allClientSongs]);

  // Auto-run on mount
  useEffect(() => {
    void runCheck();
    Promise.all([getStoredMusicHandle(), getMusicRootPath()]).then(([handle, root]) => {
      if (handle) setMusicHandle(handle);
      if (root) setMusicRoot(root);
    }).catch(console.error);
  }, [runCheck]);

  const handleSelectCandidate = useCallback((songId: string, candidateId: string) => {
    setSelections((prev) => ({ ...prev, [songId]: candidateId }));
    // Record this pick in ShowFlow's history and bump the displayed count (fire-and-forget)
    void recordTrackPick(candidateId).then(() => {
      const updated = new Map(showflowCountsRef.current);
      updated.set(candidateId, (updated.get(candidateId) ?? 0) + 1);
      showflowCountsRef.current = updated;
      setShowflowCounts(new Map(updated));
    });
  }, []);

  // Merge newly-read ID3 counts into the combined counts map
  const handleCountsRead = useCallback((newCounts: Map<string, number>) => {
    const updated = new Map(showflowCountsRef.current);
    for (const [id, count] of newCounts) {
      // ID3 counts are the authoritative play count — replace (don't add) the serato portion
      updated.set(id, count + (updated.get(id) ?? 0));
    }
    showflowCountsRef.current = updated;
    setShowflowCounts(new Map(updated));
  }, []);

  const handleExport = useCallback(async (listType: string, results: MatchResult[]) => {
    const tracksToExport = selectedExportTracks(results);

    if (tracksToExport.length === 0) {
      setExportStates((prev) => ({ ...prev, [listType]: { status: "error", message: "No matched tracks to export." } }));
      return;
    }

    setExportStates((prev) => ({ ...prev, [listType]: { status: "exporting" } }));
    const crateName =
      crateNames[listType] ??
      (ALL_LIST_TYPES.includes(listType as ListType)
        ? defaultCrateNameForList(defaultCrateName, listType as ListType)
        : `${defaultCrateName} - ${listType}`);
    const savedMusicRoot = await getMusicRootPath();
    const savedMusicRootTrimmed = savedMusicRoot?.trim() || "";
    const previewMusicRoot = musicRoot?.trim() || "";
    if (savedMusicRootTrimmed && savedMusicRootTrimmed !== previewMusicRoot) {
      setMusicRoot(savedMusicRootTrimmed);
      setExportStates((prev) => ({
        ...prev,
        [listType]: {
          status: "error",
          message: "Music Library Base Path was refreshed. Review the path preview and export again.",
        },
      }));
      return;
    }
    const musicLibraryBasePath = previewMusicRoot || undefined;
    if (!isUsableMacMusicBasePath(musicLibraryBasePath)) {
      setExportStates((prev) => ({
        ...prev,
        [listType]: {
          status: "error",
          message: SERATO_SETUP_REQUIRED_MESSAGE,
        },
      }));
      return;
    }
    const result = await exportCrate(crateName, tracksToExport, {
      musicLibraryBasePath,
    });
    if (result.ok) {
      setExportStates((prev) => ({ ...prev, [listType]: { status: "success", result } }));
    } else {
      setExportStates((prev) => ({ ...prev, [listType]: { status: "error", message: result.error } }));
    }
  }, [crateNames, defaultCrateName, musicRoot]);

  // Merge DJ selections into summary results
  const mergedResults = useMemo<MatchResult[]>(() => {
    if (loadState.status !== "ready") return [];
    return loadState.summary.results.map((r) =>
      selections[r.clientSong.id]
        ? { ...r, selectedCandidateId: selections[r.clientSong.id] }
        : r,
    );
  }, [loadState, selections]);

  // ── No songs ──
  if (allClientSongs.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm">
        <p className="text-sm text-stone-500">No songs added to this client&apos;s lists yet.</p>
      </div>
    );
  }

  // ── No library ──
  if (loadState.status === "no-library") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p className="text-sm font-semibold text-amber-800">Library not indexed yet</p>
        <p className="mt-1 text-sm text-amber-700">
          Scan your Serato library in DJ Tools first, then come back to check this client&apos;s songs.
        </p>
        <button
          type="button"
          onClick={onGoToLibrary}
          className="mt-3 rounded-xl bg-[#2f4a3e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214637]"
        >
          Go to DJ Tools
        </button>
      </div>
    );
  }

  // ── Loading ──
  if (loadState.status === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#2f4a3e]/30 border-t-[#2f4a3e]" />
        <span className="text-sm text-stone-600">Checking library…</span>
      </div>
    );
  }

  // ── Error ──
  if (loadState.status === "error") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-rose-800">Check failed</p>
        <p className="mt-1 text-sm text-rose-700">{loadState.message}</p>
        <button type="button" onClick={runCheck} className="mt-3 text-sm font-medium text-rose-800 underline">
          Try again
        </button>
      </div>
    );
  }

  // ── Results ──
  if (loadState.status !== "ready") return null;

  const { foundCount, multipleCount, missingCount, totalCount } = loadState.summary;

  const groupedByList = (listType: string) =>
    mergedResults.filter((r) => r.clientSong.listType === listType);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-[#214637]">{totalCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Total</p>
          </div>
          <div className="h-8 w-px bg-stone-100" />
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">{foundCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Found</p>
          </div>
          {multipleCount > 0 && (
            <div className="text-center">
              <p className="text-lg font-bold text-amber-500">{multipleCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Pick version</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-bold text-rose-500">{missingCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Missing</p>
          </div>
        </div>
        <button
          type="button"
          onClick={runCheck}
          className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
        >
          Recheck
        </button>
      </div>

      {/* Per-list sections with individual export */}
      {ALL_LIST_TYPES.map((listType) => {
        const results = groupedByList(listType);
        if (results.length === 0) return null;
        const exportableCount = results.filter((r) => r.status !== "missing").length;
        const listExportState = exportStates[listType] ?? DEFAULT_SINGLE_EXPORT_STATE;
        const listCrateName = crateNames[listType] ?? defaultCrateNameForList(defaultCrateName, listType);
        const exportTracks = selectedExportTracks(results);
        const musicLibraryBasePath = musicRoot?.trim() || "";
        const musicLibraryBasePathReady = isUsableMacMusicBasePath(musicLibraryBasePath);
        const previewTracks = exportTracks.slice(0, 3).map((track) => ({
          title: track.title,
          artist: track.artist,
          originalStoredPath: track.filePath,
          finalCratePath: musicLibraryBasePathReady
            ? buildSeratoCratePathString(track.filePath, musicLibraryBasePath)
            : buildSeratoCratePathString(track.filePath, undefined),
        }));

        return (
          <div key={listType} className="space-y-2">
            <ResultSection
              title={LIST_LABELS[listType]}
              results={results}
              extraCounts={showflowCounts}
              musicHandle={musicHandle}
              musicRoot={musicRoot}
              onSelectCandidate={handleSelectCandidate}
              onCountsRead={handleCountsRead}
              defaultOpen={false}
            />

            {/* Export footer for this list */}
            {exportableCount > 0 && (
              <div className="rounded-2xl border border-stone-200 bg-[#f7f5f1]/60 px-4 py-3 shadow-sm">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f4a3e]/55">
                  Export crate — {exportableCount} track{exportableCount !== 1 ? "s" : ""}
                </p>
                {!musicLibraryBasePathReady ? (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-[12px] font-semibold text-amber-900">
                      {SERATO_SETUP_REQUIRED_MESSAGE}
                    </p>
                    {musicLibraryBasePath ? (
                      <p className="mt-1 font-mono text-[11px] text-amber-800">
                        Current value: {musicLibraryBasePath}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {SHOW_SERATO_EXPORT_PATH_PREVIEW ? (
                  <details className="mb-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                    <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 [&::-webkit-details-marker]:hidden">
                      Developer Tools / Show Path Preview
                    </summary>
                    <p className="mt-2 font-mono text-[11px] text-stone-700">
                      Music Library Location: {musicLibraryBasePath || "(not set)"}
                    </p>
                    <div className="mt-2 space-y-2">
                      {previewTracks.map((track, index) => (
                        <div key={`${track.originalStoredPath}-${index}`} className="rounded-lg bg-stone-50 px-2 py-2">
                          <p className="truncate text-[11px] font-semibold text-stone-800">
                            {track.title}{track.artist ? ` — ${track.artist}` : ""}
                          </p>
                          <p className="mt-1 break-all font-mono text-[10px] text-stone-500">
                            Original: {track.originalStoredPath}
                          </p>
                          <p className="mt-1 break-all font-mono text-[10px] font-semibold text-[#2f4a3e]">
                            Final crate path: {track.finalCratePath}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={listCrateName}
                    onChange={(e) =>
                      setCrateNames((prev) => ({ ...prev, [listType]: e.target.value }))
                    }
                    placeholder="Crate name"
                    className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-[#1f2724] placeholder:text-stone-400 focus:border-[#2f4a3e]/40 focus:outline-none focus:ring-2 focus:ring-[#2f4a3e]/10"
                  />
                  <button
                    type="button"
                    disabled={
                      listExportState.status === "exporting" ||
                      !listCrateName.trim() ||
                      !musicLibraryBasePathReady
                    }
                    onClick={() => void handleExport(listType, results)}
                    className="shrink-0 rounded-xl bg-[#2f4a3e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214637] disabled:opacity-50"
                  >
                    {listExportState.status === "exporting" ? "Exporting…" : "Export Crate"}
                  </button>
                </div>

                {listExportState.status === "success" && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <span className="text-emerald-600">✓</span>
                    <p className="text-[12px] font-medium text-emerald-800">
                      Saved <span className="font-semibold">{listExportState.result.fileName}</span> — {listExportState.result.trackCount} tracks. Reload Serato to see it.
                    </p>
                  </div>
                )}
                {listExportState.status === "error" && (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                    <p className="text-[12px] font-medium text-rose-800">{listExportState.message}</p>
                  </div>
                )}

                {listExportState.status === "idle" && (
                  <p className="mt-2 text-[11px] text-stone-400">
                    First export: you&apos;ll be asked to select your Serato Subcrates folder. ShowFlow remembers it after that.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
