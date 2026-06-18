"use client";

import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import { TextArea } from "@/components/planning-ui";
import { CeremonyCoverageNotice } from "@/components/ceremony-coverage-notice";
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
  onNotesChange,
  onDone,
}: CeremonyMomentWorkspaceProps) {
  const processionalSongs = [
    { label: "Family", song: ceremonyRef.grandparentsProcessionalSong || ceremonyRef.parentsProcessionalSong },
    { label: "Wedding Party", song: ceremonyRef.processionalSong },
    { label: "Bride / Groom", song: ceremonyRef.partnerProcessionalSong },
    { label: "Unity", song: ceremonyRef.unityCeremonySong },
    { label: "Recessional", song: ceremonyRef.recessionalSong },
  ];
  const hasCeremonyMusic = Boolean(
    ceremonyRef.grandparentsProcessionalSong ||
      ceremonyRef.parentsProcessionalSong ||
      ceremonyRef.processionalSong ||
      ceremonyRef.partnerProcessionalSong ||
      ceremonyRef.unityCeremonySong ||
      ceremonyRef.recessionalSong ||
      ceremonyRef.ceremonyMomentsPreview.some((moment) => moment.song),
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
      <CoupleTimelineMomentWorkspaceSection title="Ceremony Audio">
        <div className="space-y-3">
          <CeremonyReference label="Cutmaster Music ceremony audio" value={ceremonyRef.ceremonyAudioStatus} />
          {ceremonyRef.ceremonyAudioNotProvided ? <CeremonyCoverageNotice /> : null}
        </div>
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection title="Location">
        <div className="space-y-4">
          <CeremonyReference label="Ceremony location" value={ceremonyRef.locationSummary || "Not answered"} />
          <CeremonyReference label="Officiant" value={ceremonyRef.officiantName} />
        </div>
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection title="Ceremony Moments / Music">
        {hasCeremonyMusic || ceremonyRef.ceremonyMomentsPreview.length > 0 ? (
          <div className="space-y-3">
            {processionalSongs.map((entry) => (
              <CeremonySongReference key={entry.label} label={entry.label} song={entry.song} />
            ))}
            {ceremonyRef.ceremonyMomentsPreview.length > 0 ? (
              <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3">
                <p className="text-sm font-semibold leading-snug text-stone-950">Ceremony timeline</p>
                <div className="mt-3 space-y-2">
                  {ceremonyRef.ceremonyMomentsPreview.map((moment) => (
                    <div key={`${moment.timeOrOrder}-${moment.moment}`} className="text-sm leading-relaxed text-stone-700">
                      <span className="font-medium text-stone-950">{moment.moment}</span>
                      {moment.timeOrOrder ? <span className="text-stone-500"> · {moment.timeOrOrder}</span> : null}
                      {moment.song ? <span className="block text-stone-600">{moment.song}</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-stone-600">
            Add processional, unity, recessional, and other ceremony music cues to the Ceremony Timeline.
          </p>
        )}
      </CoupleTimelineMomentWorkspaceSection>

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
