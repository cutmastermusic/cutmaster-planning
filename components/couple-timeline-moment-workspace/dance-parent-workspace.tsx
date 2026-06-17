"use client";

import {
  CoupleTimelineMomentSongCueFields,
  CoupleTimelineMomentTimelineFields,
} from "@/components/couple-timeline-moment-workspace/timeline-fields";
import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import type { ParentDanceMomentWorkspaceRef } from "@/lib/timelineMomentWorkspace";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

type DanceParentMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  songTitle: string;
  artist: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  parentDanceRef: ParentDanceMomentWorkspaceRef;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onDone: () => void;
};

export function DanceParentMomentWorkspace({
  title,
  time,
  notes,
  songTitle,
  artist,
  momentType,
  canEdit,
  parentDanceRef,
  onTimeChange,
  onNotesChange,
  onSongTitleChange,
  onArtistChange,
  onDone,
}: DanceParentMomentWorkspaceProps) {
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
          notesPlaceholder="Timing, fade preferences, or anything your DJ should know for this dance."
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

      {parentDanceRef.participants.trim() ? (
        <CoupleTimelineMomentWorkspaceSection title="Who is dancing?">
          <p className="text-sm font-medium leading-relaxed text-stone-900">
            {parentDanceRef.participants.trim()}
          </p>
        </CoupleTimelineMomentWorkspaceSection>
      ) : null}
    </CoupleTimelineMomentWorkspaceShell>
  );
}
