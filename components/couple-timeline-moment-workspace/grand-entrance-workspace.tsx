"use client";

import {
  CoupleTimelineMomentHomeRefPanel,
  CoupleTimelineMomentRefFact,
} from "@/components/couple-timeline-moment-workspace/home-ref-panel";
import {
  CoupleTimelineMomentSongCueFields,
  CoupleTimelineMomentTimelineFields,
} from "@/components/couple-timeline-moment-workspace/timeline-fields";
import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import { PrimaryButton, lightUiSecondaryButtonClass } from "@/components/planning-ui";
import type {
  GrandEntranceMomentWorkspaceRef,
  MusicHubMomentWorkspaceRef,
} from "@/lib/timelineMomentWorkspace";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

type GrandEntranceMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  songTitle: string;
  artist: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  grandEntranceRef: GrandEntranceMomentWorkspaceRef;
  musicHubRef: MusicHubMomentWorkspaceRef;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onOpenLineup: () => void;
  onOpenMusicHub: () => void;
  onDone: () => void;
};

export function GrandEntranceMomentWorkspace({
  title,
  time,
  notes,
  songTitle,
  artist,
  momentType,
  canEdit,
  grandEntranceRef,
  musicHubRef,
  onTimeChange,
  onNotesChange,
  onSongTitleChange,
  onArtistChange,
  onOpenLineup,
  onOpenMusicHub,
  onDone,
}: GrandEntranceMomentWorkspaceProps) {
  const hasSongCue = Boolean(songTitle.trim() || artist.trim());
  const musicHubHasSignal =
    musicHubRef.playlistLinkCount > 0 || musicHubRef.hasMusicProfile || musicHubRef.hasVibeNotes;
  const hasLineup = grandEntranceRef.lineupPreview.length > 0;

  return (
    <CoupleTimelineMomentWorkspaceShell
      title={title}
      timeLabel={time}
      momentType={momentType}
      onDone={onDone}
      showMomentTypeLabel={false}
      showEmptyTimeLabel={false}
    >
      <CoupleTimelineMomentWorkspaceSection
        title="When does the room shift?"
        description="Set the moment in the timeline and the cue your team should follow."
      >
        <CoupleTimelineMomentTimelineFields
          time={time}
          notes={notes}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          disabled={!canEdit}
          notesLabel="Entrance direction"
          notesPlaceholder="Where the couple waits, how the room should be brought up, or who gives the go-ahead."
        />
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection
        title="What song carries the entrance?"
        description="This is the scheduled cue for the timeline. Broader music direction stays in Music Hub."
      >
        <CoupleTimelineMomentSongCueFields
          songTitle={songTitle}
          artist={artist}
          onSongTitleChange={onSongTitleChange}
          onArtistChange={onArtistChange}
          disabled={!canEdit}
        />
        {!hasSongCue ? (
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Add the entrance song here when it feels decided.
          </p>
        ) : null}
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection
        title="Who is being introduced?"
        description="Names, roles, and pronunciation live with People & Vendors."
      >
        {hasLineup ? (
          <ol className="space-y-3">
            {grandEntranceRef.lineupPreview.map((line) => (
              <li key={line.primary} className="rounded-xl border border-stone-200/80 bg-stone-50/60 px-4 py-3">
                <p className="text-sm font-semibold leading-snug text-stone-950">{line.primary}</p>
                {line.secondary ? (
                  <p className="mt-1 text-xs leading-snug text-stone-600">{line.secondary}</p>
                ) : null}
              </li>
            ))}
            {grandEntranceRef.moreLineupCount > 0 ? (
              <li className="text-sm font-medium text-stone-500">
                + {grandEntranceRef.moreLineupCount} more entrance
                {grandEntranceRef.moreLineupCount === 1 ? "" : "s"}
              </li>
            ) : null}
          </ol>
        ) : (
          <p className="text-sm leading-relaxed text-stone-500">
            Build the entrance order when you are ready.
          </p>
        )}
        <PrimaryButton
          type="button"
          onClick={onOpenLineup}
          className={`mt-4 w-full sm:w-auto ${lightUiSecondaryButtonClass}`}
        >
          Edit entrance order
        </PrimaryButton>
      </CoupleTimelineMomentWorkspaceSection>

      {musicHubHasSignal ? (
        <CoupleTimelineMomentWorkspaceSection
          title="What music context should we keep in mind?"
          description="Referenced from Music Hub — playlists, taste profile, and broader music direction."
        >
          <CoupleTimelineMomentHomeRefPanel
            actionLabel="Open Music Hub"
            onAction={onOpenMusicHub}
            summary={
              <>
                {musicHubRef.playlistLinkCount > 0 ? (
                  <CoupleTimelineMomentRefFact
                    label="Shared playlists"
                    value={`${musicHubRef.playlistLinkCount} link${musicHubRef.playlistLinkCount === 1 ? "" : "s"}${
                      musicHubRef.playlistPreview.length > 0
                        ? ` · ${musicHubRef.playlistPreview.join(", ")}`
                        : ""
                    }`}
                  />
                ) : null}
                {musicHubRef.hasMusicProfile ? (
                  <CoupleTimelineMomentRefFact label="Music profile" value="Saved" />
                ) : null}
                {musicHubRef.hasVibeNotes ? (
                  <CoupleTimelineMomentRefFact label="Vibe notes" value="Added" />
                ) : null}
              </>
            }
          />
        </CoupleTimelineMomentWorkspaceSection>
      ) : null}
    </CoupleTimelineMomentWorkspaceShell>
  );
}
