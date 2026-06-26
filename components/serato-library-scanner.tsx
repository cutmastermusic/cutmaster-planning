"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectSeratoFolder,
  ensureReadPermission,
  getLibraryMeta,
  getStoredSeratoHandle,
  isFileSystemAccessSupported,
  scanSeratoLibrary,
  type SeratoLibraryMeta,
  type ScanProgress,
} from "@/lib/serato-library";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatCount(n: number): string {
  return n.toLocaleString();
}

function phaseLabel(phase: ScanProgress["phase"]): string {
  switch (phase) {
    case "reading": return "Reading library file…";
    case "parsing": return "Parsing tracks…";
    case "saving":  return "Indexing tracks…";
    case "done":    return "Done";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ color }: { color: "green" | "amber" | "red" }) {
  const cls =
    color === "green" ? "bg-emerald-400" :
    color === "amber" ? "bg-amber-400" :
    "bg-rose-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

type ScanState =
  | { status: "idle" }
  | { status: "scanning"; progress: ScanProgress }
  | { status: "error"; message: string };

export function SeratoLibraryScanner() {
  const [supported, setSupported] = useState(true);
  const [meta, setMeta] = useState<SeratoLibraryMeta | undefined>();
  const [hasHandle, setHasHandle] = useState(false);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });

  // ── Bootstrap: load stored meta + check for saved handle ──
  useEffect(() => {
    if (!isFileSystemAccessSupported()) {
      setSupported(false);
      return;
    }
    getLibraryMeta().then(setMeta).catch(console.error);
    getStoredSeratoHandle()
      .then((h) => setHasHandle(!!h))
      .catch(console.error);
  }, []);

  // ── Scan (shared logic for first connect + rescan) ──
  const runScan = useCallback(async (handle: FileSystemDirectoryHandle) => {
    setScanState({ status: "scanning", progress: { phase: "reading", tracksFound: 0 } });
    try {
      const result = await scanSeratoLibrary(handle, (progress) =>
        setScanState({ status: "scanning", progress }),
      );
      setMeta(result);
      setHasHandle(true);
      setScanState({ status: "idle" });
    } catch (err) {
      setScanState({
        status: "error",
        message: err instanceof Error ? err.message : "Scan failed. Please try again.",
      });
    }
  }, []);

  // ── Connect folder (first time) ──
  const handleConnect = useCallback(async () => {
    try {
      const handle = await connectSeratoFolder();
      await runScan(handle);
    } catch (err) {
      // User cancelled the picker — not an error worth showing
      if (err instanceof Error && err.name === "AbortError") return;
      setScanState({
        status: "error",
        message: err instanceof Error ? err.message : "Could not connect folder.",
      });
    }
  }, [runScan]);

  // ── Rescan (handle already stored) ──
  const handleRescan = useCallback(async () => {
    const handle = await getStoredSeratoHandle();
    if (!handle) {
      // Handle gone — ask user to reconnect
      return handleConnect();
    }
    const ok = await ensureReadPermission(handle);
    if (!ok) {
      setScanState({ status: "error", message: "Permission denied. Please reconnect your Serato folder." });
      return;
    }
    await runScan(handle);
  }, [handleConnect, runScan]);

  const isScanning = scanState.status === "scanning";

  // ── Browser not supported ──
  if (!supported) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-800">Browser not supported</p>
        <p className="mt-1 text-sm text-amber-700">
          Serato library scanning requires Chrome or Edge. Please open ShowFlow in Chrome to use this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2f4a3e]/55">
              DJ Tools
            </p>
            <h3 className="mt-1 text-base font-semibold text-[#214637]">
              Serato Music Library
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              Index your Serato library so ShowFlow can check which client songs you already have.{" "}
              <span className="font-medium text-[#2f4a3e]">Your library files are never modified.</span>
            </p>
          </div>

          {/* Status dot */}
          {meta && !isScanning && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <StatusDot color="green" />
              <span className="text-[11px] font-semibold text-emerald-800">Indexed</span>
            </div>
          )}
        </div>

        {/* Library stats */}
        {meta && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-100 bg-[#f7f5f1]/70 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Tracks indexed
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-[#214637]">
                {formatCount(meta.trackCount)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-100 bg-[#f7f5f1]/70 p-3 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Last scanned
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-700">
                {formatDate(meta.lastScanned)}
              </p>
            </div>
          </div>
        )}

        {/* Scan progress */}
        {isScanning && scanState.status === "scanning" && (
          <div className="mt-4 rounded-xl border border-[#2f4a3e]/15 bg-[#2f4a3e]/5 p-4">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#2f4a3e]/30 border-t-[#2f4a3e]" />
              <span className="text-sm font-semibold text-[#2f4a3e]">
                {phaseLabel(scanState.progress.phase)}
              </span>
              {scanState.progress.tracksFound > 0 && (
                <span className="text-sm text-[#2f4a3e]/70">
                  {formatCount(scanState.progress.tracksFound)} tracks found
                </span>
              )}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#2f4a3e]/10">
              <div
                className="h-full rounded-full bg-[#2f4a3e] transition-all duration-500"
                style={{
                  width:
                    scanState.progress.phase === "reading" ? "25%" :
                    scanState.progress.phase === "parsing" ? "55%" :
                    scanState.progress.phase === "saving"  ? "80%" :
                    "100%",
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {scanState.status === "error" && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-800">Scan failed</p>
            <p className="mt-0.5 text-sm text-rose-700">{scanState.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          {!hasHandle ? (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isScanning}
              className="rounded-xl bg-[#2f4a3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214637] disabled:opacity-50"
            >
              Connect Serato Library
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRescan}
              disabled={isScanning}
              className="rounded-xl bg-[#2f4a3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214637] disabled:opacity-50"
            >
              {isScanning ? "Scanning…" : "Rescan Library"}
            </button>
          )}

          {hasHandle && !isScanning && (
            <button
              type="button"
              onClick={handleConnect}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
            >
              Change Folder
            </button>
          )}
        </div>

        {/* Read-only notice */}
        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-stone-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 4.5v3M6 3.5v.5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
          ShowFlow reads your library in read-only mode. Your Serato files are never changed.
        </p>
      </div>

      {/* How it works */}
      {!meta && !isScanning && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#214637]">How it works</p>
          <ol className="mt-3 space-y-2.5">
            {[
              'Click "Connect Serato Library" and select your Serato folder (usually ~/Music/Serato).',
              "ShowFlow reads your library index — no files are copied or changed.",
              "Open any client's song lists to see which songs you have, which are missing, and pick between remixes.",
              "Rescan any time you add new music — takes about 10–30 seconds for most libraries.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-stone-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f4a3e]/10 text-[10px] font-bold text-[#2f4a3e]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
