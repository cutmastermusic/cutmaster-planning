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
import type { MusicHubMomentWorkspaceRef } from "@/lib/timelineMomentWorkspace";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

type DanceFirstMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  songTitle: string;
  artist: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  musicHubRef: MusicHubMomentWorkspaceRef;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onOpenMusicHub: () => void;
  onDone: () => void;
};

export function DanceFirstMomentWorkspace({
  title,
  time,
  notes,
  songTitle,
  artist,
  momentType,
  canEdit,
  musicHubRef,
  onTimeChange,
  onNotesChange,
  onSongTitleChange,
  onArtistChange,
  onOpenMusicHub,
  onDone,
}: DanceFirstMomentWorkspaceProps) {
  const hasSongCue = Boolean(songTitle.trim() || artist.trim());
  const musicHubHasSignal =
    musicHubRef.playlistLinkCount > 0 || musicHubRef.hasMusicProfile || musicHubRef.hasVibeNotes;

  return (
    <CoupleTimelineMomentWorkspaceShell
      title={title}
      timeLabel={time}
      momentType={momentType}
      onDone={onDone}
    >
      <CoupleTimelineMomentWorkspaceSection
        title="Timing & flow"
        description="Owned by your timeline — when this moment happens and how you want it to feel."
        homeLabel="Timeline"
      >
        <CoupleTimelineMomentTimelineFields
          time={time}
          notes={notes}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          disabled={!canEdit}
          notesLabel="Moment instructions"
          notesPlaceholder="How you want to be introduced, when to start, fade preferences, or anything your DJ should cue here."
        />
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection
        title="Scheduled song cue"
        description="The song scheduled for this moment on your timeline. Full playlists and must-plays live in Music Hub."
        homeLabel="Timeline cue"
      >
        <CoupleTimelineMomentSongCueFields
          songTitle={songTitle}
          artist={artist}
          onSongTitleChange={onSongTitleChange}
          onArtistChange={onArtistChange}
          disabled={!canEdit}
        />
        {!hasSongCue ? (
          <p className="mt-3 text-sm text-stone-500">
            Add the song you want for your first dance, or pick it from Music Hub when you are ready.
          </p>
        ) : null}
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection
        title="Music planning"
        description="Referenced from Music Hub — playlists, taste profile, and broader music direction."
        homeLabel="Music Hub"
      >
        <CoupleTimelineMomentHomeRefPanel
          isEmpty={!musicHubHasSignal}
          emptyMessage="Share playlists or music preferences in Music Hub when you are ready."
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
    </CoupleTimelineMomentWorkspaceShell>
  );
}
