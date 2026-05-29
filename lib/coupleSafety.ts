import type { EventSettings, UserRole } from "@/types/planning";

/** EventSettings fields owned by staff — preserved when Couple role persists. */
const STAFF_OWNED_EVENT_SETTINGS_KEYS = [
  "internalNotes",
  "assignedDj",
  "eventType",
  "eventLayoutProfile",
  "packageName",
  "plannerName",
  "plannerEmail",
  "prepSheetFooterOverride",
  "coupleWelcomeMessageOverride",
  "clientFacingNotes",
  "eventStatus",
  "liveEventShowMusicNotes",
  "liveEventShowDoNotPlay",
  "liveEventShowVendorContacts",
  "liveEventShowMcScript",
  "liveEventShowPlaylists",
  "liveEventShowPlanningQuestions",
  "liveEventShowGuestRequests",
  "liveEventCompactMode",
  "liveEventLargePrintMode",
  "sectionCeremonyEnabled",
  "sectionReceptionTimelineEnabled",
  "sectionPlaylistsEnabled",
  "sectionMustPlayEnabled",
  "sectionDoNotPlayEnabled",
  "sectionMcScriptEnabled",
  "sectionVendorContactsEnabled",
  "sectionMusicNotesEnabled",
  "sectionGuestRequestsEnabled",
  "sectionFormalitiesEnabled",
  "sectionPlanningChecklistEnabled",
  "sectionPlanningQuestionsEnabled",
  "ceremonyCoverageStatus",
] as const satisfies readonly (keyof EventSettings)[];

export type StaffOwnedEventSettingsSnapshot = Pick<
  EventSettings,
  (typeof STAFF_OWNED_EVENT_SETTINGS_KEYS)[number]
>;

export function pickStaffOwnedEventSettings(
  settings: EventSettings | undefined,
): Partial<StaffOwnedEventSettingsSnapshot> {
  if (!settings) return {};
  const out: Record<string, EventSettings[keyof EventSettings]> = {};
  for (const key of STAFF_OWNED_EVENT_SETTINGS_KEYS) {
    out[key] = settings[key];
  }
  return out as Partial<StaffOwnedEventSettingsSnapshot>;
}

/** Apply couple edits while keeping staff-owned settings from the preserved snapshot. */
export function mergeCoupleSafeEventSettings(
  coupleWorking: EventSettings,
  preserved: EventSettings | undefined,
): EventSettings {
  return {
    ...coupleWorking,
    ...pickStaffOwnedEventSettings(preserved),
  };
}

export type DatabaseEventMetadataUpdate = {
  title: string;
  date: Date | null;
  type?: string | null;
  venue?: string | null;
  assignedDj?: string | null;
  packageName?: string | null;
  plannerName?: string | null;
  plannerEmail?: string | null;
  ceremonyLocation?: string | null;
  receptionLocation?: string | null;
  internalNotes?: string | null;
  eventStatus?: string | null;
};

export function buildDatabaseEventUpdateForRole(
  role: UserRole,
  working: EventSettings,
  preserved: EventSettings | undefined,
): DatabaseEventMetadataUpdate {
  const settings =
    role === "Couple" ? mergeCoupleSafeEventSettings(working, preserved) : working;
  return {
    title: settings.eventName,
    date: settings.weddingDate ? new Date(settings.weddingDate) : null,
    type: settings.eventType,
    venue: settings.venue,
    assignedDj: settings.assignedDj || null,
    packageName: settings.packageName || null,
    plannerName: settings.plannerName || null,
    plannerEmail: settings.plannerEmail || null,
    ceremonyLocation: settings.ceremonyLocation || null,
    receptionLocation: settings.receptionLocation || null,
    internalNotes: settings.internalNotes || null,
    eventStatus: settings.eventStatus ?? undefined,
  };
}

export function restoreRolePreviewForSession(
  currentRole: UserRole | null | undefined,
  storedPreview: UserRole | null | undefined,
  fallback: UserRole = "Admin",
): UserRole {
  if (currentRole === "Couple") return "Couple";
  if (
    storedPreview === "Admin" ||
    storedPreview === "DJ" ||
    storedPreview === "Planner" ||
    storedPreview === "Couple"
  ) {
    return storedPreview;
  }
  return fallback;
}

/** UI/permissions role — real Couple sessions are always Couple regardless of stored preview. */
export function resolveEffectiveRole(
  sessionRole: UserRole | null | undefined,
  rolePreview: UserRole,
): UserRole {
  if (sessionRole === "Couple") return "Couple";
  return rolePreview;
}

/** True when the logged-in user is an actual Couple/client (not Admin previewing Couple). */
export function isActualCoupleSession(sessionRole: UserRole | null | undefined): boolean {
  return sessionRole === "Couple";
}

/** Only Admin may switch preview roles in the prototype. */
export function canUseRolePreviewSwitcher(sessionRole: UserRole | null | undefined): boolean {
  return sessionRole === "Admin";
}
