import type { Screen } from "@/types/planning";
import {
  COUPLE_PLANNING_GAPS_UI_MAX,
  areaLabelForCouplePlanningGap,
  type CouplePlanningGap,
} from "@/utils/couplePlanningGaps";

export type CoupleFinalPlanningHint = {
  id: string;
  message: string;
  targetScreen: Screen;
  areaLabel: string;
};

export type BuildCoupleFinalPlanningHintsInput = {
  planningGaps: CouplePlanningGap[];
  timelineGapLabels: string[];
  timelineScreen: Screen;
  pendingGuestRequestCount: number;
  sectionGuestRequestsEnabled: boolean;
};

/**
 * Merges cross-area planning gaps, timeline-specific labels, and guest-request
 * attention into a capped, de-duplicated hint list for the post-journey dashboard.
 * Read-only — no persistence.
 */
export function buildCoupleFinalPlanningHints(
  input: BuildCoupleFinalPlanningHintsInput,
): CoupleFinalPlanningHint[] {
  const hints: CoupleFinalPlanningHint[] = [];
  const seenMessages = new Set<string>();

  const pushHint = (hint: CoupleFinalPlanningHint) => {
    const key = hint.message.trim().toLowerCase();
    if (seenMessages.has(key)) return;
    seenMessages.add(key);
    hints.push(hint);
  };

  for (const gap of input.planningGaps) {
    pushHint({
      id: gap.id,
      message: gap.message,
      targetScreen: gap.targetScreen,
      areaLabel: areaLabelForCouplePlanningGap(gap.area),
    });
    if (hints.length >= COUPLE_PLANNING_GAPS_UI_MAX) return hints;
  }

  for (let i = 0; i < input.timelineGapLabels.length; i++) {
    const message = input.timelineGapLabels[i]!;
    pushHint({
      id: `timeline-gap-${i}`,
      message,
      targetScreen: input.timelineScreen,
      areaLabel: "Timeline",
    });
    if (hints.length >= COUPLE_PLANNING_GAPS_UI_MAX) return hints;
  }

  if (
    input.sectionGuestRequestsEnabled &&
    input.pendingGuestRequestCount > 0 &&
    hints.length < COUPLE_PLANNING_GAPS_UI_MAX
  ) {
    const n = input.pendingGuestRequestCount;
    pushHint({
      id: "gap-guest-requests-pending",
      message:
        n === 1
          ? "One guest song request is waiting—take a look when you have a moment."
          : `${n} guest song requests are waiting—take a look when you have a moment.`,
      targetScreen: "Guest Requests",
      areaLabel: "Guest requests",
    });
  }

  return hints.slice(0, COUPLE_PLANNING_GAPS_UI_MAX);
}

export type CoupleFinalPlanningQuickLink = {
  id: string;
  label: string;
  description: string;
  statLine?: string;
  screen: Screen;
  badge?: string;
};
