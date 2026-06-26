"use client";

/**
 * SeratoSongChecker — DJ/Admin only, never shown to couples.
 *
 * Loads the indexed Serato library from IndexedDB and matches the client's
 * song lists against it. Shows found / multiple versions / missing grouped
 * results with a version picker for ambiguous matches.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getIndexedTracks, getLibraryMeta } from "@/lib/serato-library";
import {
  matchSongsToLibrary,
  songEntryToClientSong,
  type LibraryCheckSummary,
  type MatchResult,
} from "@/lib/serato-matching";
import { exportCrate, type ExportResult } from "@/lib/serato-crate-writer";
import type { SeratoTrack } from "@/lib/serato-parser";
import type { SongEntry } from "@/types/planning";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  mustPlaySongs: SongEntry[];
  playIfPossibleSongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
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
  mustPlay: "Must Play",
  playIfPossible: "Dance Floor Favorites",
  doNotPlay: "Songs to Avoid",
};

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

function ResultRow({
  result,
  onSelectCandidate,
}: {
  result: MatchResult;
  onSelectCandidate: (songId: string, candidateId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { clientSong, status, candidates, selectedCandidateId } = result;

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
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-medium text-[#2f4a3e] underline underline-offset-2"
          >
            {expanded ? "Hide versions" : `${candidates.length} versions — pick one`}
          </button>
          {expanded && (
            <div className="mt-1.5 space-y-1.5">
              {candidates.map((track) => {
                const isSelected = track.id === selectedCandidateId;
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
                      {isSelected && (
                        <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-[#2f4a3e]">
                          Selected
                        </span>
                      )}
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
  onSelectCandidate,
  defaultOpen = true,
}: {
  title: string;
  results: MatchResult[];
  onSelectCandidate: (songId: string, candidateId: string) => void;
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
              onSelectCandidate={onSelectCandidate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SeratoSongChecker({
  mustPlaySongs,
  playIfPossibleSongs,
  doNotPlaySongs,
  defaultCrateName = "ShowFlow Crate",
  onGoToLibrary,
}: Props) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [crateName, setCrateName] = useState(defaultCrateName);
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });

  const allClientSongs = useMemo(() => [
    ...mustPlaySongs.map((s) => songEntryToClientSong(s, "mustPlay")),
    ...playIfPossibleSongs.map((s) => songEntryToClientSong(s, "playIfPossible")),
    ...doNotPlaySongs.map((s) => songEntryToClientSong(s, "doNotPlay")),
  ], [mustPlaySongs, playIfPossibleSongs, doNotPlaySongs]);

  const runCheck = useCallback(async () => {
    setLoadState({ status: "loading" });
    try {
      const meta = await getLibraryMeta();
      if (!meta || meta.trackCount === 0) {
        setLoadState({ status: "no-library" });
        return;
      }
      const library = await getIndexedTracks();
      const summary = matchSongsToLibrary(allClientSongs, library);
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
  useEffect(() => { void runCheck(); }, [runCheck]);

  const handleSelectCandidate = useCallback((songId: string, candidateId: string) => {
    setSelections((prev) => ({ ...prev, [songId]: candidateId }));
  }, []);

  const handleExport = useCallback(async (results: MatchResult[]) => {
    // Collect tracks for found + multiple-with-selection rows (skip missing)
    const tracksToExport: SeratoTrack[] = [];
    for (const r of results) {
      if (r.status === "missing") continue;
      const track = r.candidates.find((c) => c.id === r.selectedCandidateId);
      if (track) tracksToExport.push(track);
    }

    if (tracksToExport.length === 0) {
      setExportState({ status: "error", message: "No matched tracks to export." });
      return;
    }

    setExportState({ status: "exporting" });
    const result = await exportCrate(crateName, tracksToExport);
    if (result.ok) {
      setExportState({ status: "success", result });
    } else {
      setExportState({ status: "error", message: result.error });
    }
  }, [crateName]);

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
  const exportableCount = foundCount + multipleCount;

  const groupedByList = (listType: string) =>
    mergedResults.filter((r) => r.clientSong.listType === listType);

  return (
    <div className="space-y-4">
      {/* Summary + export bar */}
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        {/* Export row */}
        {exportableCount > 0 && (
          <div className="border-t border-stone-100 pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f4a3e]/55">
              Export to Serato — {exportableCount} track{exportableCount !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={crateName}
                onChange={(e) => setCrateName(e.target.value)}
                placeholder="Crate name"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-[#1f2724] placeholder:text-stone-400 focus:border-[#2f4a3e]/40 focus:outline-none focus:ring-2 focus:ring-[#2f4a3e]/10"
              />
              <button
                type="button"
                disabled={exportState.status === "exporting" || !crateName.trim()}
                onClick={() => void handleExport(mergedResults)}
                className="shrink-0 rounded-xl bg-[#2f4a3e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214637] disabled:opacity-50"
              >
                {exportState.status === "exporting" ? "Exporting…" : "Export Crate"}
              </button>
            </div>

            {/* Export feedback */}
            {exportState.status === "success" && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="text-emerald-600">✓</span>
                <p className="text-[12px] font-medium text-emerald-800">
                  Saved <span className="font-semibold">{exportState.result.fileName}</span> — {exportState.result.trackCount} tracks. Reload Serato to see it.
                </p>
              </div>
            )}
            {exportState.status === "error" && (
              <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                <p className="text-[12px] font-medium text-rose-800">{exportState.message}</p>
              </div>
            )}

            <p className="mt-2 text-[11px] text-stone-400">
              First export: you&apos;ll be asked to select your Serato Subcrates folder. ShowFlow remembers it after that.
            </p>
          </div>
        )}
      </div>

      {/* Results by list */}
      {(["mustPlay", "playIfPossible", "doNotPlay"] as const).map((listType) => {
        const results = groupedByList(listType);
        return (
          <ResultSection
            key={listType}
            title={LIST_LABELS[listType]}
            results={results}
            onSelectCandidate={handleSelectCandidate}
            defaultOpen={false}
          />
        );
      })}
    </div>
  );
}
