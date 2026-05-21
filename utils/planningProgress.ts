import type { EventStatus } from "@/lib/eventStatus";
import type {
  CeremonyTimelineItem,
  EventSettings,
  Screen,
  TimelineItem,
} from "@/types/planning";

export type PlanningProgressCheckState = "complete" | "attention";

export type PlanningProgressCheck = {
  id: string;
  label: string;
  state: PlanningProgressCheckState;
  targetScreen?: Screen;
};

export type PlanningProgressInput = {
  eventStatus: EventStatus;
  layoutProfile: EventSettings["eventLayoutProfile"];
  sectionCeremonyEnabled: boolean;
  sectionMustPlayEnabled: boolean;
  timelineItems: Pick<TimelineItem, "title" | "songTitle">[];
  ceremonyTimelineItems: Pick<CeremonyTimelineItem, "moment" | "songTitle">[];
  teamMemberCount: number;
  mustPlayCount: number;
  eventNotesCount: number;
  hasKeyCeremonySongs: boolean;
  primaryTimelineScreen: Screen;
};

function hasParentDancesFilled(
  timelineItems: PlanningProgressInput["timelineItems"],
): boolean {
  if (
    timelineItems.some(
      (row) => /parent dance/i.test(row.title) && (row.songTitle?.trim() ?? "").length > 0,
    )
  ) {
    return true;
  }
  const fatherDaughter = timelineItems.some(
    (row) =>
      /father.*daughter|father\s*\/\s*daughter/i.test(row.title) &&
      (row.songTitle?.trim() ?? "").length > 0,
  );
  const motherSon = timelineItems.some(
    (row) =>
      /mother.*son|mother\s*\/\s*son/i.test(row.title) && (row.songTitle?.trim() ?? "").length > 0,
  );
  return fatherDaughter && motherSon;
}

function ceremonyMusicReady(input: PlanningProgressInput): boolean {
  if (!input.sectionCeremonyEnabled) return true;
  if (input.hasKeyCeremonySongs) return true;
  if (input.ceremonyTimelineItems.some((row) => (row.songTitle?.trim() ?? "").length > 0)) {
    return true;
  }
  return false;
}

function pushCheck(
  checks: PlanningProgressCheck[],
  item: Omit<PlanningProgressCheck, "state"> & { ok: boolean },
) {
  checks.push({
    id: item.id,
    label: item.label,
    state: item.ok ? "complete" : "attention",
    targetScreen: item.targetScreen,
  });
}

/**
 * Lightweight planning snapshot derived from existing event working state (V1 — no scoring).
 */
export function buildPlanningProgressChecks(input: PlanningProgressInput): PlanningProgressCheck[] {
  const checks: PlanningProgressCheck[] = [];
  const tl = input.primaryTimelineScreen;

  pushCheck(checks, {
    id: "timeline-started",
    label: "Timeline started",
    ok: input.timelineItems.length > 0,
    targetScreen: tl,
  });

  pushCheck(checks, {
    id: "event-team",
    label: "Event team added",
    ok: input.teamMemberCount > 0,
    targetScreen: "Event Team",
  });

  if (input.sectionCeremonyEnabled) {
    pushCheck(checks, {
      id: "ceremony-music",
      label: ceremonyMusicReady(input) ? "Ceremony music in place" : "Ceremony music missing",
      ok: ceremonyMusicReady(input),
      targetScreen: "Ceremony",
    });
  }

  if (input.sectionMustPlayEnabled) {
    pushCheck(checks, {
      id: "must-play",
      label: input.mustPlayCount > 0 ? "Must-play songs added" : "Must-play songs missing",
      ok: input.mustPlayCount > 0,
      targetScreen: "Music Hub",
    });
  }

  const expectsParentDances =
    input.layoutProfile === "Wedding" || input.layoutProfile === "Gender-Neutral Wedding";
  if (expectsParentDances) {
    const parentOk = hasParentDancesFilled(input.timelineItems);
    pushCheck(checks, {
      id: "parent-dances",
      label: parentOk ? "Parent dances filled in" : "Parent dances missing",
      ok: parentOk,
      targetScreen: tl,
    });
  }

  pushCheck(checks, {
    id: "notes",
    label: input.eventNotesCount > 0 ? "Notes added" : "Notes missing",
    ok: input.eventNotesCount > 0,
    targetScreen: "Notes",
  });

  const reviewMarked =
    input.eventStatus === "Final Review" ||
    input.eventStatus === "Event Ready" ||
    input.eventStatus === "Completed";
  pushCheck(checks, {
    id: "final-review",
    label: reviewMarked ? "Final review marked" : "Final review incomplete",
    ok: reviewMarked,
    targetScreen: "Event Settings",
  });

  return checks;
}
