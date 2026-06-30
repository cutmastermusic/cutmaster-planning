import type { EventOperations } from "@/types/planning";

export function defaultEventOperations(): EventOperations {
  return {
    productionSchedule: {
      djArrivalTime: "",
      guestArrivalTime: "",
      ceremonySoundCheckTime: "",
      doorsOpenTime: "",
    },
    team: {
      leadDj: "",
      assistantDj: "",
      photoboothAttendant: "",
    },
    internalNotes: "",
  };
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

export function normalizeEventOperations(value: unknown): EventOperations {
  const defaults = defaultEventOperations();
  if (!value || typeof value !== "object") return defaults;
  const record = value as Record<string, unknown>;
  const productionSchedule =
    record.productionSchedule && typeof record.productionSchedule === "object"
      ? (record.productionSchedule as Record<string, unknown>)
      : {};
  const team =
    record.team && typeof record.team === "object"
      ? (record.team as Record<string, unknown>)
      : {};

  return {
    productionSchedule: {
      djArrivalTime: readString(productionSchedule, "djArrivalTime"),
      guestArrivalTime: readString(productionSchedule, "guestArrivalTime"),
      ceremonySoundCheckTime: readString(productionSchedule, "ceremonySoundCheckTime"),
      doorsOpenTime: readString(productionSchedule, "doorsOpenTime"),
    },
    team: {
      leadDj: readString(team, "leadDj"),
      assistantDj: readString(team, "assistantDj"),
      photoboothAttendant: readString(team, "photoboothAttendant"),
    },
    internalNotes: readString(record, "internalNotes"),
  };
}

export function normalizeEventOperationsForDb(value: EventOperations): EventOperations {
  return normalizeEventOperations(value);
}
