"use client";

import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { PrimaryButton } from "@/components/planning-ui";
import {
  RunOfShowReferenceQuickContactsBlock,
  RunOfShowReferenceSongListBlock,
} from "@/components/run-of-show-live-reference";
import { musicTasteProfileHasSelections } from "@/data/musicTasteProfileCatalog";
import type { RunOfShowQuickContactRow } from "@/lib/runOfShowLiveReference";
import type {
  DjMusicNote,
  DjScriptEntry,
  EventNote,
  MusicTasteProfile,
  MusicVibeDetail,
  SongEntry,
} from "@/types/planning";

const PINNED_NOTES_MAX_VISIBLE = 4;
const SHOW_BOOK_SCRIPTS_MAX_VISIBLE = 3;
const SHOW_BOOK_MUSIC_NOTES_MAX_VISIBLE = 5;

type RunOfShowReferenceDrawerProps = {
  open: boolean;
  onClose: () => void;
  eventHeadline: string;
  eventDate?: string;
  venue?: string;
  receptionLocation?: string;
  quickContacts: RunOfShowQuickContactRow[];
  mustPlaySongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  showMustPlay: boolean;
  showDoNotPlay: boolean;
  pinnedEventNotes: EventNote[];
  showMusicVibe: boolean;
  isSchoolDanceProfile: boolean;
  generalDjNotes: string;
  musicTasteProfile: MusicTasteProfile;
  musicVibeDetail: MusicVibeDetail;
  musicGenreEraSelections: string[];
  genreOtherSelected: boolean;
  showShowBook: boolean;
  showBookScripts: DjScriptEntry[];
  showBookMusicNotes: DjMusicNote[];
};

function sectionLabelClass() {
  return "text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 md:text-xs";
}

function ReferenceDetailsBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-xl border border-stone-200/90 bg-stone-50/50 open:bg-stone-50/80"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 touch-manipulation sm:px-4 sm:py-3.5 [&::-webkit-details-marker]:hidden">
        <span className={sectionLabelClass()}>{title}</span>
        <span className="text-[11px] font-medium text-stone-400 transition group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="border-t border-stone-200/80 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">{children}</div>
    </details>
  );
}

function PinnedEventNotesBlock({ notes }: { notes: EventNote[] }) {
  if (notes.length === 0) return null;

  const visible = notes.slice(0, PINNED_NOTES_MAX_VISIBLE);
  const moreCount = Math.max(0, notes.length - PINNED_NOTES_MAX_VISIBLE);

  return (
    <ReferenceDetailsBlock title="Pinned notes">
      <ul className="space-y-2.5">
        {visible.map((note) => (
          <li
            key={note.id}
            className="rounded-xl border border-cyan-200/90 bg-cyan-50/50 px-3 py-3 sm:px-3.5 sm:py-3.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/80 bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-950">
                Pinned
              </span>
              {note.category?.trim() ? (
                <span className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                  {note.category.trim()}
                </span>
              ) : null}
            </div>
            {note.title?.trim() ? (
              <p className="mt-2 text-sm font-semibold leading-snug text-stone-950 [overflow-wrap:anywhere]">
                {note.title.trim()}
              </p>
            ) : null}
            {note.body?.trim() ? (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 [overflow-wrap:anywhere]">
                {note.body.trim()}
              </p>
            ) : null}
          </li>
        ))}
        {moreCount > 0 ? (
          <li className="text-xs font-medium text-stone-500">+ {moreCount} more pinned</li>
        ) : null}
      </ul>
    </ReferenceDetailsBlock>
  );
}

function buildCompactMusicVibeLines(input: {
  isSchoolDanceProfile: boolean;
  generalDjNotes: string;
  musicTasteProfile: MusicTasteProfile;
  musicVibeDetail: MusicVibeDetail;
  musicGenreEraSelections: string[];
  genreOtherSelected: boolean;
}): string[] {
  const lines: string[] = [];

  if (input.isSchoolDanceProfile) {
    lines.push("Clean edits and school-appropriate selections.");
  }

  const vibe = input.generalDjNotes.trim();
  if (vibe) lines.push(`Overall vibe: ${vibe}`);

  if (input.musicGenreEraSelections.length > 0) {
    lines.push(`Genre / era: ${input.musicGenreEraSelections.join(", ")}`);
  }

  const profile = input.musicTasteProfile;
  if (profile.danceFloorStyles.length > 0) {
    lines.push(`Dance floor: ${profile.danceFloorStyles.join(", ")}`);
  }
  if (profile.crowdPreferences.length > 0) {
    lines.push(`Crowd: ${profile.crowdPreferences.join(", ")}`);
  }
  if (profile.musicBehavior.length > 0) {
    lines.push(`Behavior: ${profile.musicBehavior.join(", ")}`);
  }
  if ((profile.lineDancesAndGroupSongs?.length ?? 0) > 0) {
    lines.push(`Line dances & group songs: ${profile.lineDancesAndGroupSongs!.join(", ")}`);
  }
  const tasteNotes = profile.danceFloorVibeNotes?.trim();
  if (tasteNotes) lines.push(`Ideal dance floor vibe: ${tasteNotes}`);

  const detail = input.musicVibeDetail;
  if ((detail.genres ?? "").trim()) {
    const label = input.genreOtherSelected ? "Other styles" : "Genres / eras";
    lines.push(`${label}: ${detail.genres!.trim()}`);
  }
  if ((detail.energy ?? "").trim()) lines.push(`Energy: ${detail.energy!.trim()}`);
  if ((detail.crowdNotes ?? "").trim()) lines.push(`Crowd notes: ${detail.crowdNotes!.trim()}`);
  if ((detail.cleanMusicPrefs ?? "").trim()) {
    const label = input.isSchoolDanceProfile ? "Clean selections" : "Clean / content";
    lines.push(`${label}: ${detail.cleanMusicPrefs!.trim()}`);
  }

  return lines;
}

function hasCompactMusicVibeContent(input: {
  showMusicVibe: boolean;
  isSchoolDanceProfile: boolean;
  generalDjNotes: string;
  musicTasteProfile: MusicTasteProfile;
  musicVibeDetail: MusicVibeDetail;
  musicGenreEraSelections: string[];
}): boolean {
  if (!input.showMusicVibe) return false;
  if (input.isSchoolDanceProfile) return true;
  if (input.generalDjNotes.trim()) return true;
  if (input.musicGenreEraSelections.length > 0) return true;
  if (musicTasteProfileHasSelections(input.musicTasteProfile)) return true;
  const detail = input.musicVibeDetail;
  return Boolean(
    (detail.genres ?? "").trim() ||
      (detail.energy ?? "").trim() ||
      (detail.crowdNotes ?? "").trim() ||
      (detail.cleanMusicPrefs ?? "").trim(),
  );
}

function CompactMusicVibeBlock({
  isSchoolDanceProfile,
  generalDjNotes,
  musicTasteProfile,
  musicVibeDetail,
  musicGenreEraSelections,
  genreOtherSelected,
}: {
  isSchoolDanceProfile: boolean;
  generalDjNotes: string;
  musicTasteProfile: MusicTasteProfile;
  musicVibeDetail: MusicVibeDetail;
  musicGenreEraSelections: string[];
  genreOtherSelected: boolean;
}) {
  const lines = buildCompactMusicVibeLines({
    isSchoolDanceProfile,
    generalDjNotes,
    musicTasteProfile,
    musicVibeDetail,
    musicGenreEraSelections,
    genreOtherSelected,
  });

  if (lines.length === 0) return null;

  return (
    <ReferenceDetailsBlock title="Music vibe">
      <ul className="space-y-2 text-sm leading-relaxed text-stone-800 md:text-[15px]">
        {lines.map((line, index) => (
          <li key={`music-vibe-${index}-${line.slice(0, 24)}`} className="[overflow-wrap:anywhere]">
            {line}
          </li>
        ))}
      </ul>
    </ReferenceDetailsBlock>
  );
}

function ShowBookExcerptBlock({
  scripts,
  musicNotes,
}: {
  scripts: DjScriptEntry[];
  musicNotes: DjMusicNote[];
}) {
  const visibleScripts = scripts.slice(0, SHOW_BOOK_SCRIPTS_MAX_VISIBLE);
  const scriptsMore = Math.max(0, scripts.length - SHOW_BOOK_SCRIPTS_MAX_VISIBLE);
  const visibleNotes = musicNotes.slice(0, SHOW_BOOK_MUSIC_NOTES_MAX_VISIBLE);
  const notesMore = Math.max(0, musicNotes.length - SHOW_BOOK_MUSIC_NOTES_MAX_VISIBLE);

  return (
    <ReferenceDetailsBlock title="Show Book">
      <p className="mb-3 text-[11px] leading-snug text-stone-500 md:text-xs">
        DJ / admin operational scripts and notes — read-only.
      </p>
      {visibleScripts.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            DJ scripts
          </p>
          {visibleScripts.map((script) => (
            <div
              key={script.id}
              className="rounded-xl border border-stone-200/90 bg-white px-3 py-3 sm:px-3.5 sm:py-3.5"
            >
              {(script.title ?? "").trim() ? (
                <p className="text-sm font-semibold leading-snug text-stone-900 md:text-[15px]">
                  {script.title.trim()}
                </p>
              ) : null}
              {(script.body ?? "").trim() ? (
                <p className="mt-1 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 md:text-[15px]">
                  {script.body.trim()}
                </p>
              ) : null}
            </div>
          ))}
          {scriptsMore > 0 ? (
            <p className="text-xs font-medium text-stone-500">+ {scriptsMore} more scripts</p>
          ) : null}
        </div>
      ) : null}
      {visibleNotes.length > 0 ? (
        <div className={visibleScripts.length > 0 ? "mt-4 border-t border-stone-200/80 pt-4" : ""}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            Music notes
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-700 md:text-[15px]">
            {visibleNotes.map((note) => (
              <li key={note.id} className="[overflow-wrap:anywhere]">
                {note.text.trim()}
              </li>
            ))}
            {notesMore > 0 ? (
              <li className="list-none pl-0 text-xs font-medium text-stone-500">
                + {notesMore} more notes
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </ReferenceDetailsBlock>
  );
}

function EventAtAGlanceBlock({
  headline,
  eventDate,
  venue,
  receptionLocation,
}: {
  headline: string;
  eventDate?: string;
  venue?: string;
  receptionLocation?: string;
}) {
  const dateLabel = eventDate?.trim() ?? "";
  const venueLabel = venue?.trim() ?? "";
  const receptionLabel = receptionLocation?.trim() ?? "";
  const hasDetails = Boolean(dateLabel || venueLabel || receptionLabel);

  return (
    <ReferenceDetailsBlock title="Event at a glance">
      <p className="text-base font-semibold leading-snug text-stone-950 md:text-lg">
        {headline.trim() || "Event"}
      </p>
      {hasDetails ? (
        <dl className="mt-3 space-y-2 text-sm leading-snug text-stone-700 md:text-[15px]">
          {dateLabel ? (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Date
              </dt>
              <dd className="mt-0.5 font-medium text-stone-800">{dateLabel}</dd>
            </div>
          ) : null}
          {venueLabel ? (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Venue
              </dt>
              <dd className="mt-0.5 [overflow-wrap:anywhere]">{venueLabel}</dd>
            </div>
          ) : null}
          {receptionLabel ? (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Reception location
              </dt>
              <dd className="mt-0.5 [overflow-wrap:anywhere]">{receptionLabel}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-2 text-sm leading-snug text-stone-500">No additional event details listed</p>
      )}
    </ReferenceDetailsBlock>
  );
}

/** Read-only quick reference drawer for Run Of Show — contacts, song guardrails, event context. */
export function RunOfShowReferenceDrawer({
  open,
  onClose,
  eventHeadline,
  eventDate,
  venue,
  receptionLocation,
  quickContacts,
  mustPlaySongs,
  doNotPlaySongs,
  showMustPlay,
  showDoNotPlay,
  pinnedEventNotes,
  showMusicVibe,
  isSchoolDanceProfile,
  generalDjNotes,
  musicTasteProfile,
  musicVibeDetail,
  musicGenreEraSelections,
  genreOtherSelected,
  showShowBook,
  showBookScripts,
  showBookMusicNotes,
}: RunOfShowReferenceDrawerProps) {
  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const musicVibeVisible = useMemo(
    () =>
      hasCompactMusicVibeContent({
        showMusicVibe,
        isSchoolDanceProfile,
        generalDjNotes,
        musicTasteProfile,
        musicVibeDetail,
        musicGenreEraSelections,
      }),
    [
      showMusicVibe,
      isSchoolDanceProfile,
      generalDjNotes,
      musicTasteProfile,
      musicVibeDetail,
      musicGenreEraSelections,
    ],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center pointer-events-none md:items-stretch md:justify-end md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-label="Run Of Show quick reference"
    >
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 bg-black/50 md:bg-black/45"
        aria-label="Close quick reference"
        onClick={requestClose}
      />
      <div className="pointer-events-auto relative flex h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 md:h-full md:max-h-none md:max-w-md md:rounded-3xl lg:max-w-lg">
        <header className="relative z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4 md:pt-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Quick reference
              </p>
              <p className="mt-1 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">
                Live event info
              </p>
              <p className="mt-1 text-xs leading-snug text-stone-500 sm:text-sm">
                Read-only contacts and guardrails — stay in Run Of Show.
              </p>
            </div>
            <PrimaryButton
              type="button"
              onClick={requestClose}
              className="min-h-11 shrink-0 touch-manipulation rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
            >
              Close
            </PrimaryButton>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-3">
            <PinnedEventNotesBlock notes={pinnedEventNotes} />
            <RunOfShowReferenceQuickContactsBlock contacts={quickContacts} />
            {showMustPlay ? (
              <RunOfShowReferenceSongListBlock
                title="Must play"
                songs={mustPlaySongs}
                emptyLabel="No must-play songs listed"
              />
            ) : null}
            {showDoNotPlay ? (
              <RunOfShowReferenceSongListBlock
                title="Do not play"
                songs={doNotPlaySongs}
                emptyLabel="No blocked songs listed"
                tone="blocked"
              />
            ) : null}
            {musicVibeVisible ? (
              <CompactMusicVibeBlock
                isSchoolDanceProfile={isSchoolDanceProfile}
                generalDjNotes={generalDjNotes}
                musicTasteProfile={musicTasteProfile}
                musicVibeDetail={musicVibeDetail}
                musicGenreEraSelections={musicGenreEraSelections}
                genreOtherSelected={genreOtherSelected}
              />
            ) : null}
            {showShowBook ? (
              <ShowBookExcerptBlock scripts={showBookScripts} musicNotes={showBookMusicNotes} />
            ) : null}
            <EventAtAGlanceBlock
              headline={eventHeadline}
              eventDate={eventDate}
              venue={venue}
              receptionLocation={receptionLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
