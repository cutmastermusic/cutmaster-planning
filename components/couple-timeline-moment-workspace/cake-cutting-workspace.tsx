"use client";

import {
  CoupleTimelineMomentSongCueFields,
  CoupleTimelineMomentTimelineFields,
} from "@/components/couple-timeline-moment-workspace/timeline-fields";
import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

type CakeCuttingMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  songTitle: string;
  artist: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onDone: () => void;
};

export function CakeCuttingMomentWorkspace({
  title,
  time,
  notes,
  songTitle,
  artist,
  momentType,
  canEdit,
  onTimeChange,
  onNotesChange,
  onSongTitleChange,
  onArtistChange,
  onDone,
}: CakeCuttingMomentWorkspaceProps) {
  return (
    <CoupleTimelineMomentWorkspaceShell
      title={title}
      timeLabel={time}
      momentType={momentType}
      onDone={onDone}
      showMomentTypeLabel={false}
      showEmptyTimeLabel={false}
    >
      {time.trim() ? (
        <p className="-mt-2 text-lg font-medium tracking-tight text-stone-900">{time.trim()}</p>
      ) : null}

      <CoupleTimelineMomentWorkspaceSection title="When does this happen?">
        <CoupleTimelineMomentTimelineFields
          time={time}
          notes={notes}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          disabled={!canEdit}
          notesLabel="Notes"
          notesPlaceholder="Cue, photo, or announcement notes for this moment."
        />
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection title="What song should play?">
        <CoupleTimelineMomentSongCueFields
          songTitle={songTitle}
          artist={artist}
          onSongTitleChange={onSongTitleChange}
          onArtistChange={onArtistChange}
          disabled={!canEdit}
        />
      </CoupleTimelineMomentWorkspaceSection>
    </CoupleTimelineMomentWorkspaceShell>
  );
}
