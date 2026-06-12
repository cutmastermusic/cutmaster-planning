import {
  GRAND_ENTRANCE_COUPLE_ENTRANCE_SCRIPT_KEY,
  GRAND_ENTRANCE_COUPLE_KEY,
  GRAND_ENTRANCE_MC_SCRIPT_KEY,
  GRAND_ENTRANCE_PLANNING_LINEUP_KEY,
  grandEntranceDetailFieldsFromDb,
  mergeGrandEntranceDetailIntoAnswers,
  type GrandEntranceDetailDbRow,
} from "@/lib/grandEntranceDetail";
import { normalizeCeremonyCoverageStatus } from "@/lib/ceremonyCoverage";
import type {
  CeremonyCoverageStatus,
  CeremonyPlan,
  ClientEventDetailsSnapshot,
  EventCeremonyPlanSnapshot,
  EventSettings,
} from "@/types/planning";

export type PlanningQuestionAnswersRecord = Record<string, string>;

export function parsePlanningQuestionAnswersJson(value: unknown): PlanningQuestionAnswersRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out: PlanningQuestionAnswersRecord = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed) out[key] = trimmed;
      continue;
    }
    if (Array.isArray(raw)) {
      const labels = raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
      if (labels.length > 0) {
        out[key] = JSON.stringify(labels);
      }
      continue;
    }
    if (typeof raw === "number" || typeof raw === "boolean") {
      out[key] = String(raw);
    }
  }
  return out;
}

/** Strip empty values before DB write. */
export function normalizePlanningQuestionAnswersForDb(
  answers: Record<string, string | undefined> | null | undefined,
): PlanningQuestionAnswersRecord {
  const out: PlanningQuestionAnswersRecord = {};
  if (!answers) return out;
  for (const [key, raw] of Object.entries(answers)) {
    const trimmed = (raw ?? "").trim();
    if (trimmed) out[key] = trimmed;
  }
  return out;
}

export function hasNonEmptyPlanningQuestionAnswers(
  answers: Record<string, string | undefined> | null | undefined,
): boolean {
  if (!answers) return false;
  return Object.values(answers).some((value) => (value ?? "").trim().length > 0);
}

export function isDbPlanningQuestionAnswersEmpty(
  json: unknown,
  legacyColumns: GrandEntranceDetailDbRow,
): boolean {
  const parsed = parsePlanningQuestionAnswersJson(json);
  if (hasNonEmptyPlanningQuestionAnswers(parsed)) return false;
  const legacy = grandEntranceDetailFieldsFromDb(legacyColumns);
  return !legacy.script && !legacy.lineup && !legacy.coupleEntrance;
}

/** DB JSON first, then legacy Grand Entrance columns for any missing keys. */
export function buildPlanningQuestionAnswersFromDbRow(
  json: unknown,
  legacyColumns: GrandEntranceDetailDbRow,
): PlanningQuestionAnswersRecord {
  const fromJson = parsePlanningQuestionAnswersJson(json);
  const legacyFields = grandEntranceDetailFieldsFromDb(legacyColumns);
  const merged = mergeGrandEntranceDetailIntoAnswers(fromJson, {
    ...legacyFields,
    coupleEntranceScript: fromJson[GRAND_ENTRANCE_COUPLE_ENTRANCE_SCRIPT_KEY]?.trim() ?? "",
  });
  return normalizePlanningQuestionAnswersForDb(merged);
}

/** Dual-write payload: normalized answers + legacy Grand Entrance column values. */
export function planningQuestionAnswersWithLegacyGrandEntranceColumns(
  answers: Record<string, string | undefined> | null | undefined,
): {
  answers: PlanningQuestionAnswersRecord;
  grandEntranceScript: string | null;
  grandEntranceLineup: string | null;
  grandEntranceCouple: string | null;
} {
  const normalized = normalizePlanningQuestionAnswersForDb(answers);
  const trimOrNull = (value: string | undefined) => {
    const trimmed = (value ?? "").trim();
    return trimmed || null;
  };
  return {
    answers: normalized,
    grandEntranceScript: trimOrNull(normalized[GRAND_ENTRANCE_MC_SCRIPT_KEY]),
    grandEntranceLineup: trimOrNull(normalized[GRAND_ENTRANCE_PLANNING_LINEUP_KEY]),
    grandEntranceCouple: trimOrNull(normalized[GRAND_ENTRANCE_COUPLE_KEY]),
  };
}

export function emptyCeremonyPlanSnapshot(): EventCeremonyPlanSnapshot {
  const emptyPlan = (): CeremonyPlan => ({ title: "", artist: "", notes: "" });
  return {
    ceremonyStartTime: "",
    ceremonyGuestArrivalTime: "",
    officiantName: "",
    ceremonyNotes: "",
    microphoneNeeds: "",
    weddingPartyProcessional: emptyPlan(),
    brideGroomProcessional: emptyPlan(),
    unityCeremonySong: emptyPlan(),
    recessionalSong: emptyPlan(),
  };
}

function isCeremonyPlanEmpty(plan: CeremonyPlan): boolean {
  return !plan.title.trim() && !plan.artist.trim() && !plan.notes.trim();
}

function readClientEventDetails(raw: Record<string, unknown>): ClientEventDetailsSnapshot | undefined {
  const entry = raw.clientEventDetails;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
  const details = entry as Record<string, unknown>;
  return {
    coupleNames: typeof details.coupleNames === "string" ? details.coupleNames : "",
    eventStartTime: typeof details.eventStartTime === "string" ? details.eventStartTime : "",
    eventEndTime: typeof details.eventEndTime === "string" ? details.eventEndTime : "",
    guestRequestMessageOverride:
      typeof details.guestRequestMessageOverride === "string"
        ? details.guestRequestMessageOverride
        : "",
  };
}

function hasNonEmptyClientEventDetails(details: ClientEventDetailsSnapshot | undefined): boolean {
  if (!details) return false;
  return Boolean(
    details.coupleNames.trim() ||
      details.eventStartTime.trim() ||
      details.eventEndTime.trim() ||
      details.guestRequestMessageOverride.trim(),
  );
}

export function buildClientEventDetailsFromSettings(
  settings: EventSettings,
): ClientEventDetailsSnapshot {
  return {
    coupleNames: settings.coupleNames ?? "",
    eventStartTime: settings.eventStartTime ?? "",
    eventEndTime: settings.eventEndTime ?? "",
    guestRequestMessageOverride: settings.guestRequestMessageOverride ?? "",
  };
}

export function attachClientEventDetailsToCeremonyPlan(
  plan: EventCeremonyPlanSnapshot,
  details: ClientEventDetailsSnapshot,
): EventCeremonyPlanSnapshot {
  return { ...plan, clientEventDetails: details };
}

export function applyClientEventDetailsToEventSettings(
  settings: EventSettings,
  plan: EventCeremonyPlanSnapshot | null | undefined,
): void {
  const details = plan?.clientEventDetails;
  if (!details) return;
  settings.coupleNames = details.coupleNames;
  settings.eventStartTime = details.eventStartTime;
  settings.eventEndTime = details.eventEndTime;
  settings.guestRequestMessageOverride = details.guestRequestMessageOverride;
}

export function applyCeremonyCoverageFromPlan(
  settings: EventSettings,
  plan: EventCeremonyPlanSnapshot | null | undefined,
): void {
  settings.ceremonyCoverageStatus = normalizeCeremonyCoverageStatus(
    plan?.ceremonyCoverageStatus,
    settings.eventLayoutProfile,
  );
}

export function applyCeremonyPlanExtensionsToEventSettings(
  settings: EventSettings,
  plan: EventCeremonyPlanSnapshot | null | undefined,
): void {
  applyClientEventDetailsToEventSettings(settings, plan);
  applyCeremonyCoverageFromPlan(settings, plan);
}

function readCeremonyCoverageStatus(raw: Record<string, unknown>): CeremonyCoverageStatus | undefined {
  const value = raw.ceremonyCoverageStatus;
  if (value === "provided" || value === "not_provided" || value === "unknown") {
    return value;
  }
  return undefined;
}

export function parseCeremonyPlanJson(value: unknown): EventCeremonyPlanSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const readPlan = (key: string): CeremonyPlan => {
    const entry = raw[key];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { title: "", artist: "", notes: "" };
    }
    const plan = entry as Record<string, unknown>;
    return {
      title: typeof plan.title === "string" ? plan.title : "",
      artist: typeof plan.artist === "string" ? plan.artist : "",
      notes: typeof plan.notes === "string" ? plan.notes : "",
    };
  };
  const clientEventDetails = readClientEventDetails(raw);
  const ceremonyCoverageStatus = readCeremonyCoverageStatus(raw);
  return {
    ceremonyStartTime: typeof raw.ceremonyStartTime === "string" ? raw.ceremonyStartTime : "",
    ceremonyGuestArrivalTime:
      typeof raw.ceremonyGuestArrivalTime === "string" ? raw.ceremonyGuestArrivalTime : "",
    officiantName: typeof raw.officiantName === "string" ? raw.officiantName : "",
    ceremonyNotes: typeof raw.ceremonyNotes === "string" ? raw.ceremonyNotes : "",
    microphoneNeeds: typeof raw.microphoneNeeds === "string" ? raw.microphoneNeeds : "",
    weddingPartyProcessional: readPlan("weddingPartyProcessional"),
    brideGroomProcessional: readPlan("brideGroomProcessional"),
    unityCeremonySong: readPlan("unityCeremonySong"),
    recessionalSong: readPlan("recessionalSong"),
    ...(clientEventDetails ? { clientEventDetails } : {}),
    ...(ceremonyCoverageStatus ? { ceremonyCoverageStatus } : {}),
  };
}

export function isCeremonyPlanSnapshotEmpty(plan: EventCeremonyPlanSnapshot | null | undefined): boolean {
  if (!plan) return true;
  if (hasNonEmptyClientEventDetails(plan.clientEventDetails)) return false;
  const scalarEmpty =
    !plan.ceremonyStartTime.trim() &&
    !plan.ceremonyGuestArrivalTime.trim() &&
    !plan.officiantName.trim() &&
    !plan.ceremonyNotes.trim() &&
    !plan.microphoneNeeds.trim();
  const songsEmpty =
    isCeremonyPlanEmpty(plan.weddingPartyProcessional) &&
    isCeremonyPlanEmpty(plan.brideGroomProcessional) &&
    isCeremonyPlanEmpty(plan.unityCeremonySong) &&
    isCeremonyPlanEmpty(plan.recessionalSong);
  return scalarEmpty && songsEmpty;
}

export function hasNonEmptyCeremonyPlanFields(input: {
  ceremonyStartTime: string;
  ceremonyGuestArrivalTime: string;
  officiantName: string;
  ceremonyNotes: string;
  microphoneNeeds: string;
  weddingPartyProcessional: CeremonyPlan;
  brideGroomProcessional: CeremonyPlan;
  unityCeremonySong: CeremonyPlan;
  recessionalSong: CeremonyPlan;
}): boolean {
  return !isCeremonyPlanSnapshotEmpty(buildCeremonyPlanSnapshot(input));
}

export function buildCeremonyPlanSnapshot(input: {
  ceremonyStartTime: string;
  ceremonyGuestArrivalTime: string;
  officiantName: string;
  ceremonyNotes: string;
  microphoneNeeds: string;
  weddingPartyProcessional: CeremonyPlan;
  brideGroomProcessional: CeremonyPlan;
  unityCeremonySong: CeremonyPlan;
  recessionalSong: CeremonyPlan;
}): EventCeremonyPlanSnapshot {
  return {
    ceremonyStartTime: input.ceremonyStartTime ?? "",
    ceremonyGuestArrivalTime: input.ceremonyGuestArrivalTime ?? "",
    officiantName: input.officiantName ?? "",
    ceremonyNotes: input.ceremonyNotes ?? "",
    microphoneNeeds: input.microphoneNeeds ?? "",
    weddingPartyProcessional: {
      title: input.weddingPartyProcessional?.title ?? "",
      artist: input.weddingPartyProcessional?.artist ?? "",
      notes: input.weddingPartyProcessional?.notes ?? "",
    },
    brideGroomProcessional: {
      title: input.brideGroomProcessional?.title ?? "",
      artist: input.brideGroomProcessional?.artist ?? "",
      notes: input.brideGroomProcessional?.notes ?? "",
    },
    unityCeremonySong: {
      title: input.unityCeremonySong?.title ?? "",
      artist: input.unityCeremonySong?.artist ?? "",
      notes: input.unityCeremonySong?.notes ?? "",
    },
    recessionalSong: {
      title: input.recessionalSong?.title ?? "",
      artist: input.recessionalSong?.artist ?? "",
      notes: input.recessionalSong?.notes ?? "",
    },
  };
}

export function applyCeremonyPlanSnapshotToEventFields(
  event: {
    ceremonyStartTime: string;
    ceremonyGuestArrivalTime: string;
    officiantName: string;
    ceremonyNotes: string;
    microphoneNeeds: string;
    weddingPartyProcessional: CeremonyPlan;
    brideGroomProcessional: CeremonyPlan;
    unityCeremonySong: CeremonyPlan;
    recessionalSong: CeremonyPlan;
  },
  plan: EventCeremonyPlanSnapshot,
): void {
  event.ceremonyStartTime = plan.ceremonyStartTime;
  event.ceremonyGuestArrivalTime = plan.ceremonyGuestArrivalTime;
  event.officiantName = plan.officiantName;
  event.ceremonyNotes = plan.ceremonyNotes;
  event.microphoneNeeds = plan.microphoneNeeds;
  event.weddingPartyProcessional = { ...plan.weddingPartyProcessional };
  event.brideGroomProcessional = { ...plan.brideGroomProcessional };
  event.unityCeremonySong = { ...plan.unityCeremonySong };
  event.recessionalSong = { ...plan.recessionalSong };
}
