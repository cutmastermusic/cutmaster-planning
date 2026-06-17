"use client";

import {
  CoupleTimelineMomentSongCueFields,
  CoupleTimelineMomentTimelineFields,
} from "@/components/couple-timeline-moment-workspace/timeline-fields";
import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import { PrimaryButton, lightUiSecondaryButtonClass } from "@/components/planning-ui";
import type { GrandEntranceMomentWorkspaceRef } from "@/lib/timelineMomentWorkspace";
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
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onOpenLineup: () => void;
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
  onTimeChange,
  onNotesChange,
  onSongTitleChange,
  onArtistChange,
  onOpenLineup,
  onDone,
}: GrandEntranceMomentWorkspaceProps) {
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
          notesPlaceholder="Where the couple waits, how the room should be brought up, or who gives the go-ahead."
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

      <CoupleTimelineMomentWorkspaceSection title="Who is being introduced?">
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
        ) : null}
        <PrimaryButton
          type="button"
          onClick={onOpenLineup}
          className={`mt-4 w-full sm:w-auto ${lightUiSecondaryButtonClass}`}
        >
          Edit entrance order
        </PrimaryButton>
      </CoupleTimelineMomentWorkspaceSection>
    </CoupleTimelineMomentWorkspaceShell>
  );
}
