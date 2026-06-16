"use client";

import { useRef } from "react";

import { CoupleSpeechesToastsInlineEditor } from "@/components/couple-timeline-moment-workspace/speeches-toasts-inline-editor";
import { CoupleTimelineMomentTimelineFields } from "@/components/couple-timeline-moment-workspace/timeline-fields";
import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import type { TimelineMomentType } from "@/lib/timelineMomentType";
import type { SpeechesToastEntry } from "@/lib/speechesToasts";

type SpeechToastsMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  toastsRaw: string;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSpeechesToastsChange: (entries: SpeechesToastEntry[]) => void;
  onDone: () => void;
};

export function SpeechToastsMomentWorkspace({
  title,
  time,
  notes,
  momentType,
  canEdit,
  toastsRaw,
  onTimeChange,
  onNotesChange,
  onSpeechesToastsChange,
  onDone,
}: SpeechToastsMomentWorkspaceProps) {
  const pendingSpeechesRef = useRef<SpeechesToastEntry[] | null>(null);

  const handleDone = () => {
    if (pendingSpeechesRef.current) {
      onSpeechesToastsChange(pendingSpeechesRef.current);
      pendingSpeechesRef.current = null;
    }
    onDone();
  };

  return (
    <CoupleTimelineMomentWorkspaceShell
      title={title}
      timeLabel={time}
      momentType={momentType}
      onDone={handleDone}
    >
      <CoupleTimelineMomentWorkspaceSection
        title="Timing & flow"
        description="When toasts happen in your reception flow and any MC or DJ cues for this block."
        homeLabel="Timeline"
      >
        <CoupleTimelineMomentTimelineFields
          time={time}
          notes={notes}
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
          disabled={!canEdit}
          notesLabel="Flow notes"
          notesPlaceholder="When to start toasts, whether dinner is paused, intro style, or timing between speakers."
        />
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection
        title="Speakers & toast order"
        description="Owned by reception planning — edit here in context; the timeline references this list."
        homeLabel="Reception planning"
      >
        <CoupleSpeechesToastsInlineEditor
          key={toastsRaw}
          toastsRaw={toastsRaw}
          canEdit={canEdit}
          onChange={(entries) => {
            pendingSpeechesRef.current = entries;
          }}
        />
      </CoupleTimelineMomentWorkspaceSection>
    </CoupleTimelineMomentWorkspaceShell>
  );
}
