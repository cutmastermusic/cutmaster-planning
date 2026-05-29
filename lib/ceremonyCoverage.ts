import type { EventSettings } from "@/types/planning";

export type CeremonyCoverageStatus = "provided" | "not_provided" | "unknown";

export const CEREMONY_COVERAGE_OPTIONS: ReadonlyArray<{
  value: CeremonyCoverageStatus;
  label: string;
}> = [
  { value: "provided", label: "Cutmaster is providing ceremony audio" },
  { value: "not_provided", label: "Cutmaster is not providing ceremony audio" },
  { value: "unknown", label: "Not sure yet" },
];

export function defaultCeremonyCoverageStatus(
  layoutProfile: EventSettings["eventLayoutProfile"] | string,
): CeremonyCoverageStatus {
  if (layoutProfile === "Wedding" || layoutProfile === "Gender-Neutral Wedding") {
    return "provided";
  }
  return "unknown";
}

export function normalizeCeremonyCoverageStatus(
  value: unknown,
  layoutProfile: EventSettings["eventLayoutProfile"] | string,
): CeremonyCoverageStatus {
  if (value === "provided" || value === "not_provided" || value === "unknown") {
    return value;
  }
  return defaultCeremonyCoverageStatus(layoutProfile);
}

export function isCeremonyCoverageNotProvided(settings: Pick<EventSettings, "ceremonyCoverageStatus">): boolean {
  return settings.ceremonyCoverageStatus === "not_provided";
}
