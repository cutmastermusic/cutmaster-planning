"use client";

import {
  CoupleTimelineMomentHomeRefPanel,
  CoupleTimelineMomentRefFact,
} from "@/components/couple-timeline-moment-workspace/home-ref-panel";
import { CoupleTimelineMomentTimelineFields } from "@/components/couple-timeline-moment-workspace/timeline-fields";
import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
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

export function CeremonyMomentWorkspace({
  title,
  time,
  notes,
  momentType,
  canEdit,
  ceremonyRef,
  onTimeChange,
  onNotesChange,
  onOpenCeremonyPlanning,
  onOpenCeremonyTimeline,
  onDone,
}: CeremonyMomentWorkspaceProps) {
  const planningHasSignal = Boolean(
    ceremonyRef.ceremonyStartTime ||
      ceremonyRef.guestArrivalTime ||
      ceremonyRef.officiantName ||
      ceremonyRef.locationSummary ||
      ceremonyRef.processionalSong ||
      ceremonyRef.recessionalSong ||
      ceremonyRef.ceremonyNotes,
  );

  return (
    <CoupleTimelineMomentWorkspaceShell
      title={title}
      timeLabel={time}
      momentType={momentType}
      onDone={onDone}
    >
      <CoupleTimelineMomentWorkspaceSection
        title="Timing & flow"
        description="How this ceremony block fits into your day-of sequence."
        homeLabel="Timeline"
      >
        <CoupleTimelineMomentTimelineFields
          time={time}
          notes={notes}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          disabled={!canEdit}
          notesLabel="Flow notes"
          notesPlaceholder="Guest arrival cues, when guests should be seated, or handoff notes for your DJ/MC."
        />
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection
        title="Ceremony details"
        description="Referenced from Ceremony planning — details are not duplicated on the timeline."
        homeLabel="Ceremony"
      >
        <CoupleTimelineMomentHomeRefPanel
          isEmpty={!planningHasSignal}
          emptyMessage="Add ceremony details in Ceremony planning when you are ready."
          actionLabel="Open Ceremony planning"
          onAction={onOpenCeremonyPlanning}
          summary={
            <>
              <CoupleTimelineMomentRefFact label="Ceremony start" value={ceremonyRef.ceremonyStartTime} />
              <CoupleTimelineMomentRefFact label="Guest arrival" value={ceremonyRef.guestArrivalTime} />
              <CoupleTimelineMomentRefFact label="Officiant" value={ceremonyRef.officiantName} />
              <CoupleTimelineMomentRefFact label="Location" value={ceremonyRef.locationSummary} />
              <CoupleTimelineMomentRefFact label="Processional song" value={ceremonyRef.processionalSong} />
              <CoupleTimelineMomentRefFact label="Recessional song" value={ceremonyRef.recessionalSong} />
              {ceremonyRef.ceremonyNotes ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                    Ceremony notes
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
                    {ceremonyRef.ceremonyNotes}
                  </p>
                </div>
              ) : null}
            </>
          }
        />
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection
        title="Ceremony timeline"
        description="Moment-by-moment ceremony flow lives on your Ceremony timeline."
        homeLabel="Ceremony timeline"
      >
        <CoupleTimelineMomentHomeRefPanel
          isEmpty={ceremonyRef.ceremonyMomentsPreview.length === 0}
          emptyMessage="Add ceremony moments on your Ceremony timeline when the order feels clear."
          actionLabel="View Ceremony timeline"
          onAction={onOpenCeremonyTimeline}
          summary={
            <ol className="space-y-2">
              {ceremonyRef.ceremonyMomentsPreview.map((row) => (
                <li key={`${row.moment}-${row.timeOrOrder}`} className="flex gap-3 text-sm">
                  <span className="w-16 shrink-0 font-medium text-stone-500">
                    {row.timeOrOrder || "—"}
                  </span>
                  <span className="font-medium text-stone-900">{row.moment}</span>
                </li>
              ))}
            </ol>
          }
        />
      </CoupleTimelineMomentWorkspaceSection>
    </CoupleTimelineMomentWorkspaceShell>
  );
}
