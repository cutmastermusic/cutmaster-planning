"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectMusicFolder,
  ensureReadPermission,
  getLibraryMeta,
  getStoredMusicHandle,
  getMusicRootPath,
  isFileSystemAccessSupported,
  saveMusicRootPath,
  scanMusicFolder,
  type SeratoLibraryMeta,
  type MusicFolderScanProgress,
} from "@/lib/serato-library";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(ts));
}

function phaseLabel(phase: MusicFolderScanProgress["phase"]): string {
  switch (phase) {
    case "listing": return "Finding audio files…";
    case "reading": return "Reading track metadata…";
    case "saving":  return "Saving to index…";
    case "done":    return "Done";
  }
}

function StatusDot({ color }: { color: "green" | "amber" | "red" }) {
  const cls = color === "green" ? "bg-emerald-400" : color === "amber" ? "bg-amber-400" : "bg-rose-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}

function isFolderPermissionRecoveryError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return false;
  if (["NotAllowedError", "SecurityError", "NotFoundError"].includes(err.name)) return true;
  const message = err.message.toLowerCase();
  return (
    message.includes("request is not allowed") ||
    message.includes("user agent") ||
    message.includes("current context") ||
    message.includes("permission")
  );
}

function isUsableMacMusicBasePath(value: string | null | undefined): value is string {
  const trimmed = value?.trim() ?? "";
  return trimmed.startsWith("/Users/") || trimmed.startsWith("/Volumes/");
}

// ─── Main component ───────────────────────────────────────────────────────────

type ScanState =
  | { status: "idle" }
  | { status: "scanning"; progress: MusicFolderScanProgress }
  | { status: "error"; message: string };

export function SeratoLibraryScanner() {
  const [supported, setSupported] = useState(true);
  const [meta, setMeta] = useState<SeratoLibraryMeta | undefined>();
  const [hasMusicHandle, setHasMusicHandle] = useState(false);
  const [musicRoot, setMusicRoot] = useState<string | undefined>();
  const [musicRootDraft, setMusicRootDraft] = useState("");
  const [clipboardStatus, setClipboardStatus] = useState<"idle" | "pasted" | "invalid" | "error">("idle");
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });

  useEffect(() => {
    if (!isFileSystemAccessSupported()) { setSupported(false); return; }
    getLibraryMeta().then(setMeta).catch(console.error);
    getStoredMusicHandle().then((h) => setHasMusicHandle(!!h)).catch(console.error);
    getMusicRootPath().then((p) => {
      if (p) {
        setMusicRoot(p);
        setMusicRootDraft(p);
      }
    }).catch(console.error);
  }, []);

  const runScan = useCallback(async (
    handle: FileSystemDirectoryHandle,
    options?: { rethrowPermissionErrors?: boolean },
  ) => {
    setScanState({ status: "scanning", progress: { phase: "listing", filesTotal: 0, filesDone: 0, tracksFound: 0 } });
    try {
      const storedRoot = await getMusicRootPath();
      const root = storedRoot ?? `/${handle.name}`;
      const result = await scanMusicFolder(handle, root, (p) => setScanState({ status: "scanning", progress: p }));
      setMeta(result);
      setMusicRoot(root);
      setScanState({ status: "idle" });
    } catch (err) {
      if (options?.rethrowPermissionErrors && isFolderPermissionRecoveryError(err)) {
        throw err;
      }
      setScanState({ status: "error", message: err instanceof Error ? err.message : "Scan failed." });
    }
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      const handle = await connectMusicFolder();
      setHasMusicHandle(true);
      await runScan(handle, { rethrowPermissionErrors: true });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setScanState({ status: "error", message: err instanceof Error ? err.message : "Could not connect folder." });
    }
  }, [runScan]);

  const handleRescan = useCallback(async () => {
    try {
      const handle = await getStoredMusicHandle();
      if (!handle) {
        await handleConnect();
        return;
      }
      const hasPermission = await ensureReadPermission(handle);
      if (!hasPermission) {
        await handleConnect();
        return;
      }
      await runScan(handle);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      await handleConnect();
    }
  }, [handleConnect, runScan]);

  const handleSaveBasePath = useCallback(async () => {
    const nextPath = musicRootDraft.trim().replace(/\/+$/, "");
    if (!isUsableMacMusicBasePath(nextPath)) {
      setClipboardStatus("invalid");
      return;
    }
    await saveMusicRootPath(nextPath);
    setMusicRoot(nextPath);
    setClipboardStatus("idle");
  }, [musicRootDraft]);

  const handlePasteBasePath = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const nextPath = clipboardText.trim().replace(/\/+$/, "");
      if (!isUsableMacMusicBasePath(nextPath)) {
        setClipboardStatus("invalid");
        return;
      }
      setMusicRootDraft(nextPath);
      setClipboardStatus("pasted");
    } catch {
      setClipboardStatus("error");
    }
  }, []);

  const isScanning = scanState.status === "scanning";
  const progress = isScanning ? (scanState as { status: "scanning"; progress: MusicFolderScanProgress }).progress : null;
  const pct = progress && progress.filesTotal > 0
    ? Math.round((progress.filesDone / progress.filesTotal) * 100)
    : null;
  const savedMusicRootIsValid = isUsableMacMusicBasePath(musicRoot);
  const draftMusicRootIsValid = isUsableMacMusicBasePath(musicRootDraft);
  const setupStatusItems = [
    { label: "Music folder connected", done: hasMusicHandle },
    { label: "Library scanned", done: Boolean(meta?.trackCount) },
    { label: "Music library location set", done: savedMusicRootIsValid },
    { label: "Ready to export crates", done: hasMusicHandle && Boolean(meta?.trackCount) && savedMusicRootIsValid },
  ];

  if (!supported) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-800">Browser not supported</p>
        <p className="mt-1 text-sm text-amber-700">
          Music library scanning requires Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2f4a3e]/55">
              DJ Prep
            </p>
            <h3 className="mt-1 text-base font-semibold text-[#214637]">
              Serato Setup
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              Connect your music folder once, then tell ShowFlow where that folder lives on your Mac so exported crates load cleanly in Serato.
            </p>
          </div>
          {setupStatusItems[3].done && !isScanning && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <StatusDot color="green" />
              <span className="text-[11px] font-semibold text-emerald-800">Ready</span>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {setupStatusItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border px-3 py-2 ${
                item.done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-stone-200 bg-stone-50 text-stone-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <StatusDot color={item.done ? "green" : "amber"} />
                <p className="text-[11px] font-semibold leading-snug">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        {meta && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-100 bg-[#f7f5f1]/70 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Tracks indexed</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-[#214637]">
                {meta.trackCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-stone-100 bg-[#f7f5f1]/70 p-3 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Last scanned</p>
              <p className="mt-1 text-sm font-semibold text-stone-700">{formatDate(meta.lastScanned)}</p>
            </div>
            {musicRoot && (
              <div className="rounded-xl border border-stone-100 bg-[#f7f5f1]/70 p-3 sm:col-span-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">Music root</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-stone-600">{musicRoot}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-stone-200 bg-[#f7f5f1]/70 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f4a3e]/60">
            Connect Library
          </p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[#214637]">Connect Music Library</h4>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                Select the folder that contains your DJ music. ShowFlow reads it in read-only mode.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!hasMusicHandle ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isScanning}
                  className="rounded-xl bg-[#2f4a3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214637] disabled:opacity-50"
                >
                  Connect Music Folder
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRescan}
                    disabled={isScanning}
                    className="rounded-xl bg-[#2f4a3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214637] disabled:opacity-50"
                  >
                    {isScanning ? "Scanning..." : "Rescan Library"}
                  </button>
                  {!isScanning && (
                    <button
                      type="button"
                      onClick={handleConnect}
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
                    >
                      Change Folder
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-[#f7f5f1]/70 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f4a3e]/60">
            Locate Library
          </p>
          <label htmlFor="music-library-base-path" className="mt-1 block text-sm font-semibold text-[#214637]">
            Music Library Location
          </label>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            In Finder, select your Music Library folder and press Cmd + Option + C, then paste it here.
          </p>
          <div className="mt-3 flex flex-col gap-2 lg:flex-row">
            <input
              id="music-library-base-path"
              value={musicRootDraft}
              onChange={(event) => {
                setMusicRootDraft(event.target.value);
                setClipboardStatus("idle");
              }}
              placeholder="/Users/yourname/Music/Cutmaster Music Library"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#2f4a3e]/40 focus:outline-none focus:ring-2 focus:ring-[#2f4a3e]/10"
            />
            <button
              type="button"
              onClick={() => void handlePasteBasePath()}
              className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              Paste from Clipboard
            </button>
            <button
              type="button"
              onClick={() => void handleSaveBasePath()}
              disabled={
                !draftMusicRootIsValid ||
                musicRootDraft.trim().replace(/\/+$/, "") === (musicRoot ?? "")
              }
              className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Location
            </button>
          </div>
          {!draftMusicRootIsValid ? (
            <p className="mt-2 text-xs font-semibold text-amber-800">
              Finish Serato Setup before exporting crates. The location must start with /Users/ or /Volumes/.
            </p>
          ) : null}
          {clipboardStatus === "pasted" ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700">Path pasted. Save it to finish setup.</p>
          ) : clipboardStatus === "invalid" ? (
            <p className="mt-2 text-xs font-semibold text-amber-800">
              That clipboard value does not look like a Mac folder path. Copy the folder path from Finder and try again.
            </p>
          ) : clipboardStatus === "error" ? (
            <p className="mt-2 text-xs font-semibold text-rose-700">
              Could not read the clipboard. Paste the path manually.
            </p>
          ) : null}
        </div>

        {/* Scan progress */}
        {isScanning && progress && (
          <div className="mt-4 rounded-xl border border-[#2f4a3e]/15 bg-[#2f4a3e]/5 p-4">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#2f4a3e]/30 border-t-[#2f4a3e]" />
              <span className="text-sm font-semibold text-[#2f4a3e]">{phaseLabel(progress.phase)}</span>
              {progress.filesTotal > 0 && (
                <span className="text-sm text-[#2f4a3e]/70">
                  {progress.filesDone.toLocaleString()} / {progress.filesTotal.toLocaleString()} files
                </span>
              )}
            </div>
            {pct !== null && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#2f4a3e]/10">
                <div className="h-full rounded-full bg-[#2f4a3e] transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
            )}
            {progress.tracksFound > 0 && (
              <p className="mt-2 text-[11px] text-[#2f4a3e]/60">
                {progress.tracksFound.toLocaleString()} tracks with metadata found
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {scanState.status === "error" && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-800">Scan failed</p>
            <p className="mt-0.5 text-sm text-rose-700">{scanState.message}</p>
          </div>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-stone-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 4.5v3M6 3.5v.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          ShowFlow reads your files in read-only mode. Nothing is ever changed.
        </p>
      </div>

      {/* How it works */}
      {!meta && !isScanning && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#214637]">How it works</p>
          <ol className="mt-3 space-y-2.5">
            {[
              'Click "Connect Music Folder" and select your music root folder (e.g. your Dropbox music folder).',
              "ShowFlow scans every audio file and reads its ID3 metadata — title, artist, BPM, key, and Serato play count.",
              "Open any client's song lists in Music Hub → Check Songs to see which tracks you have and pick between versions.",
              "Versions are sorted by how many times you've actually played them in Serato.",
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
