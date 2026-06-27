"use client";

/**
 * DjPrepScreen — DJ/Admin-only per-event prep workflow.
 *
 * Single destination for preparation: Serato setup, music review, moment crates,
 * and crate export readiness.
 * Never shown to couple role.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { SeratoLibraryScanner } from "@/components/serato-library-scanner";
import { SeratoSongChecker } from "@/components/serato-song-checker";
import {
  getIndexedTracks,
  getLibraryMeta,
  getMusicRootPath,
  type SeratoLibraryMeta,
} from "@/lib/serato-library";
import { matchScore } from "@/lib/serato-parser";
import { exportCrate } from "@/lib/serato-crate-writer";
import type { SeratoTrack } from "@/lib/serato-parser";
import type {
  CeremonyPlan,
  CeremonyTimelineItem,
  SongEntry,
  TimelineItem,
} from "@/types/planning";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DjPrepScreenProps = {
  // Playlists
  preCeremonySongs: SongEntry[];
  mustPlaySongs: SongEntry[];
  playIfPossibleSongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  cocktailHourSongs: SongEntry[];
  dinnerSongs: SongEntry[];
  // Timeline (for formalities extraction)
  timelineItems: TimelineItem[];
  ceremonyTimelineItems: CeremonyTimelineItem[];
  // Ceremony plan songs
  weddingPartyProcessional: CeremonyPlan;
  brideGroomProcessional: CeremonyPlan;
  unityCeremonySong: CeremonyPlan;
  recessionalSong: CeremonyPlan;
  // Event meta
  defaultCrateName: string;
  eventDateDisplay?: string;
  eventVenueDisplay?: string;
  requestedSongCount?: number;
  pendingGuestRequestCount?: number;
};

type FormalityItem = {
  id: string;
  label: string;
  title: string;
  artist: string;
};

type FormCrateState =
  | { status: "idle" }
  | { status: "matching" }
  | { status: "exporting" }
  | { status: "success"; exported: number; crate: string }
  | { status: "error"; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(ts));
}

function isUsableMacMusicBasePath(value: string | null | undefined): value is string {
  const trimmed = value?.trim() ?? "";
  return trimmed.startsWith("/Users/") || trimmed.startsWith("/Volumes/");
}

/** Extract all song-cued moments from the timeline and ceremony plan. */
function extractWeddingMoments(
  timelineItems: TimelineItem[],
  ceremonyTimelineItems: CeremonyTimelineItem[],
  weddingPartyProcessional: CeremonyPlan,
  brideGroomProcessional: CeremonyPlan,
  unityCeremonySong: CeremonyPlan,
  recessionalSong: CeremonyPlan,
): FormalityItem[] {
  const items: FormalityItem[] = [];

  // Ceremony plan songs
  const cerPlan: Array<[string, CeremonyPlan]> = [
    ["Wedding Party Processional", weddingPartyProcessional],
    ["Bride/Groom Processional", brideGroomProcessional],
    ["Unity Ceremony", unityCeremonySong],
    ["Recessional", recessionalSong],
  ];
  for (const [label, plan] of cerPlan) {
    if (plan.title?.trim()) {
      items.push({
        id: `cer-${label}`,
        label,
        title: plan.title.trim(),
        artist: plan.artist?.trim() ?? "",
      });
    }
  }

  // Ceremony timeline rows with song cues
  for (const row of ceremonyTimelineItems) {
    if (row.songTitle?.trim()) {
      items.push({
        id: `ctl-${row.id}`,
        label: row.moment?.trim() || "Ceremony moment",
        title: row.songTitle.trim(),
        artist: row.artist?.trim() ?? "",
      });
    }
  }

  // Reception timeline rows with song cues
  for (const row of timelineItems) {
    if (row.songTitle?.trim()) {
      items.push({
        id: `tl-${row.id}`,
        label: row.title?.trim() || "Timeline moment",
        title: row.songTitle.trim(),
        artist: row.artist?.trim() ?? "",
      });
    }
  }

  // Dedupe by title+artist (case-insensitive)
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title.toLowerCase()}|${item.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scrollToSeratoSetup() {
  document.getElementById("dj-prep-serato-setup")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Workflow shell ───────────────────────────────────────────────────────────

function WorkflowSection({
  title,
  subtitle,
  meta,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-stone-200/85 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-[#f7f3eb]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-950">{title}</p>
            {meta ? (
              <span className="rounded-full border border-[#C79A5A]/30 bg-[#C79A5A]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6a31]">
                {meta}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-stone-500">{subtitle}</p>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`mt-1.5 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? <div className="border-t border-stone-100 px-5 py-4">{children}</div> : null}
    </div>
  );
}

// ─── Wedding Moments Crate ────────────────────────────────────────────────────

function WeddingMomentsCrateSection({
  items,
  defaultCrateName,
}: {
  items: FormalityItem[];
  defaultCrateName: string;
}) {
  const [state, setState] = useState<FormCrateState>({ status: "idle" });
  const crateName = `💍 ${defaultCrateName} - Wedding Moments 💍`;

  const handleExport = useCallback(async () => {
    if (items.length === 0) return;
    setState({ status: "matching" });
    try {
      const library = await getIndexedTracks();
      if (library.length === 0) {
        setState({ status: "error", message: "Library not indexed yet. Finish Serato Setup before exporting crates." });
        return;
      }

      const musicLibraryBasePath = await getMusicRootPath();
      if (!isUsableMacMusicBasePath(musicLibraryBasePath)) {
        setState({ status: "error", message: "Finish Serato Setup before exporting crates." });
        return;
      }

      const matched: SeratoTrack[] = [];
      for (const item of items) {
        const hit = library
          .map((t) => ({ t, score: matchScore(t, item.title, item.artist) }))
          .filter((r) => r.score >= 2)
          .sort((a, b) => b.score - a.score)[0]?.t;
        if (hit) matched.push(hit);
      }

      if (matched.length === 0) {
        setState({ status: "error", message: "None of the formality songs were found in your indexed library." });
        return;
      }

      setState({ status: "exporting" });
      const result = await exportCrate(crateName, matched, { musicLibraryBasePath });
      if (!result.ok) {
        setState({ status: "error", message: result.error });
        return;
      }
      setState({ status: "success", exported: matched.length, crate: crateName });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Export failed." });
    }
  }, [items, crateName]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-4 text-sm text-stone-500">
        No song cues found on the timeline yet. Add ceremony songs, Grand Entrance, First Dance,
        parent dances, or other timeline song assignments and they&apos;ll appear here automatically.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 bg-stone-50/80 px-4 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            {items.length} song{items.length === 1 ? "" : "s"} · pulled from timeline &amp; ceremony plan
          </p>
        </div>
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 border-b border-stone-100 px-4 py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{item.title}</p>
                {item.artist ? (
                  <p className="truncate text-[12px] text-stone-500">{item.artist}</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={state.status === "matching" || state.status === "exporting"}
          className="rounded-xl border border-[#2f4a3e] bg-[#2f4a3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214637] disabled:opacity-50"
        >
          {state.status === "matching"
            ? "Matching tracks…"
            : state.status === "exporting"
              ? "Exporting…"
              : `Export "${crateName}"`}
        </button>
        {state.status === "idle" && (
          <p className="text-[12px] text-stone-500">
            Matches songs against your indexed library and writes the Wedding Moments Serato crate.
          </p>
        )}
      </div>

      {state.status === "success" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ Exported {state.exported} track{state.exported === 1 ? "" : "s"} as &ldquo;{state.crate}&rdquo;
        </p>
      )}
      {state.status === "error" && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {state.message}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DjPrepScreen({
  preCeremonySongs,
  mustPlaySongs,
  playIfPossibleSongs,
  doNotPlaySongs,
  cocktailHourSongs,
  dinnerSongs,
  timelineItems,
  ceremonyTimelineItems,
  weddingPartyProcessional,
  brideGroomProcessional,
  unityCeremonySong,
  recessionalSong,
  defaultCrateName,
  eventDateDisplay,
  eventVenueDisplay,
  requestedSongCount = 0,
  pendingGuestRequestCount = 0,
}: DjPrepScreenProps) {
  const [libraryMeta, setLibraryMeta] = useState<SeratoLibraryMeta | undefined>();
  const [musicRootReady, setMusicRootReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadPrepStatus = async () => {
      const [meta, musicRoot] = await Promise.all([
        getLibraryMeta().catch(() => undefined),
        getMusicRootPath().catch(() => undefined),
      ]);
      if (!mounted) return;
      setLibraryMeta(meta);
      setMusicRootReady(isUsableMacMusicBasePath(musicRoot));
    };
    void loadPrepStatus();
    const interval = window.setInterval(() => void loadPrepStatus(), 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const weddingMoments = useMemo(
    () =>
      extractWeddingMoments(
        timelineItems,
        ceremonyTimelineItems,
        weddingPartyProcessional,
        brideGroomProcessional,
        unityCeremonySong,
        recessionalSong,
      ),
    [
      timelineItems,
      ceremonyTimelineItems,
      weddingPartyProcessional,
      brideGroomProcessional,
      unityCeremonySong,
      recessionalSong,
    ],
  );
  const playlistCounts = useMemo(
    () => ({
      preCeremony: preCeremonySongs.length,
      cocktailHour: cocktailHourSongs.length,
      dinner: dinnerSongs.length,
      playIfPossible: playIfPossibleSongs.length,
      mustPlay: mustPlaySongs.length,
      doNotPlay: doNotPlaySongs.length,
    }),
    [cocktailHourSongs.length, dinnerSongs.length, doNotPlaySongs.length, mustPlaySongs.length, playIfPossibleSongs.length, preCeremonySongs.length],
  );
  const crateReadyCount = Object.values(playlistCounts).filter((count) => count > 0).length + (weddingMoments.length > 0 ? 1 : 0);
  const eventMetaLine = [eventDateDisplay, eventVenueDisplay].filter((value) => value && value !== "TBD").join(" • ");

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-[#D8C9AD]/80 bg-[#fbf7ef] shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b08a45]">DJ Prep</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#214637] sm:text-4xl">
              {defaultCrateName}
            </h2>
            <p className="mt-2 text-sm font-medium text-stone-600">
              {eventMetaLine || "Event details pending"}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600">
              Everything below prepares this event for performance: library setup, client song review,
              and wedding-moment crates.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">Preparation Snapshot</p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-stone-950">Library {libraryMeta && musicRootReady ? "Ready" : "Needs Setup"}</p>
                <p className="text-[12px] text-stone-500">
                  {libraryMeta
                    ? `${libraryMeta.trackCount.toLocaleString()} songs · scanned ${formatRelativeDate(libraryMeta.lastScanned)}`
                    : "Connect and scan your library"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-950">Crates</p>
                <p className="text-[12px] text-stone-500">
                  {crateReadyCount > 0 ? `${crateReadyCount} ready to review` : "Not exported"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: libraryMeta && musicRootReady ? "Library Ready" : "Library Needs Setup",
            value: libraryMeta ? `${libraryMeta.trackCount.toLocaleString()} songs` : "Connect library",
            subline: libraryMeta ? `Last scanned ${formatRelativeDate(libraryMeta.lastScanned)}` : "Serato Setup",
          },
          {
            label: "Requested Songs",
            value: `${requestedSongCount} requested`,
            subline: pendingGuestRequestCount > 0 ? `${pendingGuestRequestCount} pending review` : "Requests reviewed",
          },
          {
            label: "Crates",
            value: crateReadyCount > 0 ? `${crateReadyCount} ready` : "Not exported",
            subline: "Review before performance",
          },
          {
            label: "Timeline Songs",
            value: `${weddingMoments.length} detected`,
            subline: "Wedding Moments crate",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">{card.label}</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-[#214637]">{card.value}</p>
            <p className="mt-0.5 text-[12px] text-stone-500">{card.subline}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <WorkflowSection
        title="Serato Setup"
          subtitle="Connect the music folder, rescan the library, set the Mac location, and keep diagnostics in one place."
          meta={libraryMeta && musicRootReady ? "Ready" : "Needs setup"}
        defaultOpen
      >
          <div id="dj-prep-serato-setup">
            <SeratoLibraryScanner />
          </div>
        </WorkflowSection>

        <WorkflowSection
          title="Review Event Music"
          subtitle="Match client playlists against your library, review missing songs, alternates, clean edits, remixes, and export playlist crates."
          meta={`${Object.values(playlistCounts).reduce((sum, count) => sum + count, 0)} songs`}
      >
        <SeratoSongChecker
          preCeremonySongs={preCeremonySongs}
          mustPlaySongs={mustPlaySongs}
          playIfPossibleSongs={playIfPossibleSongs}
          doNotPlaySongs={doNotPlaySongs}
          cocktailHourSongs={cocktailHourSongs}
          dinnerSongs={dinnerSongs}
          defaultCrateName={defaultCrateName}
            onGoToLibrary={scrollToSeratoSetup}
        />
        </WorkflowSection>

        <WorkflowSection
          title="Wedding Moments"
          subtitle="Ceremony songs, Grand Entrance, First Dance, parent dances, Cake, Bouquet, Private Last Dance, and any timeline song assignment."
          meta={`${weddingMoments.length} detected`}
      >
          <WeddingMomentsCrateSection items={weddingMoments} defaultCrateName={defaultCrateName} />
        </WorkflowSection>
      </div>
    </div>
  );
}
