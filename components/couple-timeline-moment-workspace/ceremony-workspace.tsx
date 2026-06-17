"use client";

import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import { TextArea, TextInput } from "@/components/planning-ui";
import type { CeremonyMomentWorkspaceRef } from "@/lib/timelineMomentWorkspace";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

type CeremonyMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  ceremonyRef: CeremonyMomentWorkspaceRef;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onOpenCeremonyPlanning: () => void;
  onOpenCeremonyTimeline: () => void;
  onDone: () => void;
};

const labelClass = "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500";
const fieldClass =
  "mt-1.5 w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-3 text-base text-stone-900 shadow-none transition focus:border-[#2f4a3e]/40 focus:outline-none focus:ring-2 focus:ring-[#2f4a3e]/15 disabled:cursor-default disabled:bg-stone-100/80";

function CeremonyReference({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-stone-900">{value.trim()}</p>
    </div>
  );
}

function CeremonySongReference({
  label,
  song,
}: {
  label: string;
  song: string;
}) {
  if (!song.trim()) return null;
  return (
    <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 px-4 py-3">
      <p className="text-sm font-semibold leading-snug text-stone-950">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-stone-700">{song.trim()}</p>
    </div>
  );
}

export function CeremonyMomentWorkspace({
  title,
  time,
  notes,
  momentType,
  canEdit,
  ceremonyRef,
  onTimeChange,
  onNotesChange,
  onDone,
}: CeremonyMomentWorkspaceProps) {
  const hasProcessionalSongs = Boolean(
    ceremonyRef.grandparentsProcessionalSong ||
      ceremonyRef.parentsProcessionalSong ||
      ceremonyRef.processionalSong ||
      ceremonyRef.partnerProcessionalSong,
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
      <CoupleTimelineMomentWorkspaceSection title="Time">
        <TextInput
          id="couple-ceremony-workspace-time"
          label="Time"
          value={time}
          onChange={onTimeChange}
          disabled={!canEdit}
          labelClassName={labelClass}
          inputClassName={fieldClass}
          placeholder="e.g. 4:00 PM"
        />
      </CoupleTimelineMomentWorkspaceSection>

      {ceremonyRef.locationSummary || ceremonyRef.officiantName ? (
        <CoupleTimelineMomentWorkspaceSection title="Details">
          <div className="space-y-4">
            <CeremonyReference label="Location" value={ceremonyRef.locationSummary} />
            <CeremonyReference label="Officiant" value={ceremonyRef.officiantName} />
          </div>
        </CoupleTimelineMomentWorkspaceSection>
      ) : null}

      {hasProcessionalSongs ? (
        <CoupleTimelineMomentWorkspaceSection title="Processional">
          <div className="space-y-3">
            <CeremonySongReference label="Grandparents" song={ceremonyRef.grandparentsProcessionalSong} />
            <CeremonySongReference label="Parents" song={ceremonyRef.parentsProcessionalSong} />
            <CeremonySongReference label="Wedding Party" song={ceremonyRef.processionalSong} />
            <CeremonySongReference label="Bride / Groom" song={ceremonyRef.partnerProcessionalSong} />
          </div>
        </CoupleTimelineMomentWorkspaceSection>
      ) : null}

      {ceremonyRef.recessionalSong ? (
        <CoupleTimelineMomentWorkspaceSection title="Recessional">
          <CeremonySongReference label="Song" song={ceremonyRef.recessionalSong} />
        </CoupleTimelineMomentWorkspaceSection>
      ) : null}

      <CoupleTimelineMomentWorkspaceSection title="Notes">
        <TextArea
          id="couple-ceremony-workspace-notes"
          label="Notes"
          value={notes}
          onChange={onNotesChange}
          disabled={!canEdit}
          labelClassName={labelClass}
          textareaClassName={`${fieldClass} min-h-[6.5rem] resize-y`}
          rows={3}
          placeholder="Guest arrival cues, seating notes, or handoff details."
        />
      </CoupleTimelineMomentWorkspaceSection>
    </CoupleTimelineMomentWorkspaceShell>
  );
}
