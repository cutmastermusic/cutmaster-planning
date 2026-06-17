"use client";

import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import { TextArea, TextInput } from "@/components/planning-ui";
import type { OpenDancingMomentWorkspaceRef } from "@/lib/timelineMomentWorkspace";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

type OpenDancingMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  openDancingRef: OpenDancingMomentWorkspaceRef;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onDone: () => void;
};

const labelClass = "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500";
const fieldClass =
  "mt-1.5 w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-3 text-base text-stone-900 shadow-none transition focus:border-[#2f4a3e]/40 focus:outline-none focus:ring-2 focus:ring-[#2f4a3e]/15 disabled:cursor-default disabled:bg-stone-100/80";

function ReferenceLine({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-stone-900">{value.trim()}</p>
    </div>
  );
}

export function OpenDancingMomentWorkspace({
  title,
  time,
  notes,
  momentType,
  canEdit,
  openDancingRef,
  onTimeChange,
  onNotesChange,
  onDone,
}: OpenDancingMomentWorkspaceProps) {
  const hasCelebration = Boolean(
    openDancingRef.guestCount || openDancingRef.ageGroup || openDancingRef.partyRating,
  );
  const hasMusic = Boolean(
    openDancingRef.favoriteGenres ||
      openDancingRef.guestRequestPolicy ||
      openDancingRef.musicSummaries.length > 0,
  );

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

      <CoupleTimelineMomentWorkspaceSection title="Time">
        <TextInput
          id="couple-open-dancing-workspace-time"
          label="Time"
          value={time}
          onChange={onTimeChange}
          disabled={!canEdit}
          labelClassName={labelClass}
          inputClassName={fieldClass}
        />
      </CoupleTimelineMomentWorkspaceSection>

      {hasCelebration ? (
        <CoupleTimelineMomentWorkspaceSection title="Your Celebration">
          <div className="space-y-4">
            <ReferenceLine label="Guest Count" value={openDancingRef.guestCount} />
            <ReferenceLine label="Guest Age Range" value={openDancingRef.ageGroup} />
            <ReferenceLine label="Crowd Energy / Party Rating" value={openDancingRef.partyRating} />
          </div>
        </CoupleTimelineMomentWorkspaceSection>
      ) : null}

      {hasMusic ? (
        <CoupleTimelineMomentWorkspaceSection title="Music">
          <div className="space-y-4">
            <ReferenceLine label="Favorite Genres" value={openDancingRef.favoriteGenres} />
            <ReferenceLine label="Guest Request Policy" value={openDancingRef.guestRequestPolicy} />
            {openDancingRef.musicSummaries.map((line) => (
              <p key={line} className="text-sm font-medium leading-relaxed text-stone-900">
                {line}
              </p>
            ))}
          </div>
        </CoupleTimelineMomentWorkspaceSection>
      ) : null}

      <CoupleTimelineMomentWorkspaceSection title="Notes">
        <TextArea
          id="couple-open-dancing-workspace-notes"
          label="Notes"
          value={notes}
          onChange={onNotesChange}
          disabled={!canEdit}
          labelClassName={labelClass}
          textareaClassName={`${fieldClass} min-h-[6.5rem] resize-y`}
          rows={3}
        />
      </CoupleTimelineMomentWorkspaceSection>
    </CoupleTimelineMomentWorkspaceShell>
  );
}
