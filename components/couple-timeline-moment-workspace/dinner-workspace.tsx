"use client";

import {
  CoupleTimelineMomentWorkspaceSection,
  CoupleTimelineMomentWorkspaceShell,
} from "@/components/couple-timeline-moment-workspace/shell";
import { CouplePlanningChipSelect } from "@/components/couple-planning-chip-select";
import { CoupleTimelineMomentTimelineFields } from "@/components/couple-timeline-moment-workspace/timeline-fields";
import {
  BUFFET_TABLE_RELEASE_OPTIONS,
  DINNER_SERVICE_STYLE_OPTIONS,
  RECEPTION_DINNER_QUESTION_IDS,
  isBuffetDinnerService,
  normalizeDinnerServiceStyle,
} from "@/lib/couplePlanningExtendedQuestions";
import type { TimelineMomentType } from "@/lib/timelineMomentType";

type DinnerMomentWorkspaceProps = {
  title: string;
  time: string;
  notes: string;
  momentType: TimelineMomentType;
  canEdit: boolean;
  answers: Record<string, string | undefined>;
  onPlanningAnswerChange: (questionId: string, next: string) => void;
  onTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onDone: () => void;
};

export function DinnerMomentWorkspace({
  title,
  time,
  notes,
  momentType,
  canEdit,
  answers,
  onPlanningAnswerChange,
  onTimeChange,
  onNotesChange,
  onDone,
}: DinnerMomentWorkspaceProps) {
  const dinnerService = normalizeDinnerServiceStyle(
    answers[RECEPTION_DINNER_QUESTION_IDS.dinnerServiceStyle],
  );
  const showTableRelease = isBuffetDinnerService(dinnerService);

  const setDinnerService = (next: string) => {
    onPlanningAnswerChange(RECEPTION_DINNER_QUESTION_IDS.dinnerServiceStyle, next);
    if (next !== "Buffet") {
      onPlanningAnswerChange(RECEPTION_DINNER_QUESTION_IDS.buffetTableRelease, "");
    }
  };

  return (
    <CoupleTimelineMomentWorkspaceShell
      title={title}
      timeLabel={time}
      momentType={momentType}
      onDone={onDone}
    >
      <CoupleTimelineMomentWorkspaceSection title="Dinner details">
        <CouplePlanningChipSelect
          label="How will dinner be served?"
          mode="single"
          options={DINNER_SERVICE_STYLE_OPTIONS}
          value={dinnerService}
          onChange={(next) => setDinnerService(next as string)}
        />
        {showTableRelease ? (
          <div className="mt-4 border-t border-stone-200/80 pt-4">
            <CouplePlanningChipSelect
              label="Who will release tables?"
              helperText="Venue staff is usually best for buffet flow — choose what matches your plan."
              mode="single"
              options={BUFFET_TABLE_RELEASE_OPTIONS}
              value={answers[RECEPTION_DINNER_QUESTION_IDS.buffetTableRelease] ?? ""}
              onChange={(next) =>
                onPlanningAnswerChange(
                  RECEPTION_DINNER_QUESTION_IDS.buffetTableRelease,
                  next as string,
                )
              }
            />
          </div>
        ) : null}
      </CoupleTimelineMomentWorkspaceSection>

      <CoupleTimelineMomentWorkspaceSection title="Timing & notes">
        <CoupleTimelineMomentTimelineFields
          time={time}
          notes={notes}
          disabled={!canEdit}
          notesPlaceholder="Service style notes, dietary timing, or when you'd like background music to shift."
          onTimeChange={onTimeChange}
          onNotesChange={onNotesChange}
        />
      </CoupleTimelineMomentWorkspaceSection>
    </CoupleTimelineMomentWorkspaceShell>
  );
}
