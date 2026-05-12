"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  AppHeader,
  BottomNav,
  EventHomeNav,
  InsightStack,
  PersistEcho,
  PremiumCard,
  PrimaryButton,
  SectionEmptyState,
  SectionTitle,
  SongCard,
  TextArea,
  TextInput,
  darkUiAccentPrimaryButtonClass,
  darkUiCompactGhostButtonClass,
  darkUiDangerGhostButtonClass,
  darkUiEmptyStateInPanelClass,
  darkUiFieldLabelClass,
  darkUiInputClass,
  darkUiSecondaryOutlineButtonClass,
  darkUiSelectClass,
  darkUiWorkspaceJumpButtonClass,
  lightUiCyanPrimaryButtonClass,
  lightUiDestructiveButtonClass,
  lightUiEmptyHintInCardClass,
  lightUiFormLabelClass,
  lightUiInputClass,
  lightUiListRowClass,
  lightUiSecondaryButtonClass,
  lightUiSectionCaptionClass,
  lightUiSelectClass,
} from "@/components/planning-ui";
import type { PersistFeedback } from "@/components/planning-ui";
import {
  formatPlanningQuestionsPlainTextLines,
  getDefaultPlanningQuestionSets,
  getPlanningQuestionsForProfile,
} from "@/data/planningQuestionsCatalog";
import {
  buildSeedEvents,
  initialBrideGroomProcessional,
  initialCeremonyGuestArrivalTime,
  initialCeremonyTimelineItems,
  initialCeremonyNotes,
  initialCeremonyStartTime,
  initialDoNotPlaySongs,
  defaultAppSettings,
  getDefaultTimelinePresetSets,
  seedMergedTimelineItems,
  initialGeneralDjNotes,
  initialGuestRequests,
  initialMcAnnouncements,
  initialMicrophoneNeeds,
  initialMustPlaySongs,
  initialOfficiantName,
  initialPlannerNotes,
  initialRecessionalSong,
  initialTemplates,
  initialTeamMembers,
  initialVendors,
  initialUnityCeremonySong,
  initialWeddingPartyProcessional,
  timelineCategories,
  vibeBuckets,
} from "@/data/planningMockData";
import { usePlanningApp } from "@/hooks/usePlanningApp";
import type {
  AppMode,
  AppSettings,
  ActivityItem,
  ActivityType,
  CeremonySongPlan,
  CeremonyTimelineItem,
  Collaborator,
  DisplayTimelineItem,
  EventLifecycleStatus,
  EventSettings,
  EventRecord,
  GuestRequestEntry,
  GuestRequestStatus,
  ChecklistStatus,
  PlanningQuestionAnswerType,
  PlanningQuestionDef,
  Screen,
  SongEntry,
  SongListType,
  TimelineCategory,
  TimelineItem,
  TimelinePresetItem,
  TimelineTemplate,
  TeamMember,
  UserRole,
  Vendor,
  VendorAffiliation,
  VendorType,
  WeddingDetails,
  NotificationItem,
  MusicVibeDetail,
  PlaylistBucketId,
} from "@/types/planning";
import { PLAYLIST_BUCKET_IDS, PLAYLIST_BUCKET_LABELS } from "@/types/planning";
import {
  VENDOR_TYPES_ORDERED,
  VENDOR_UI_SECTIONS,
  filterVendorsByTypes,
  formatVendorContactLines,
  isCutmasterEventTeam,
  normalizeVendorsArray,
  smsHref,
  sortVendorsForEventDocument,
  vendorTypeLabel,
} from "@/utils/vendors";
import {
  approximatePlanningProgressPercent,
  buildPlanningInsights,
  cloneJson,
  eventCoverFallbackClasses,
  insertCeremonyTimelineItemChronologically,
  insertReceptionTimelineItemChronologically,
  migrateFormalitiesIntoTimelineItems,
  normalizeEventRecordAfterFormalitiesMerge,
  readImageFileAsDataUrl,
  mainTimelineItemFromPreset,
  ceremonyTimelineItemFromPreset,
  receptionTimelineHasClockOrderConflict,
  sortTimelineItemsChronologically,
} from "@/utils/planning";
import {
  redrawRunOfShowAnnotationCanvas,
  runOfShowClientToContentCoords,
  type RunOfShowAnnotationStroke,
} from "@/lib/runOfShowAnnotations";
import {
  computePlanningQuestionGroupCompletion,
  groupPlanningQuestionsBySection,
} from "@/data/planningQuestionGroups";

function PlanningQuestionAnswerEditor({
  q,
  value,
  onChange,
}: {
  q: PlanningQuestionDef;
  value: string;
  onChange: (next: string) => void;
}) {
  const labelSuffix = q.required ? " *" : "";

  if (q.answerType === "long_text") {
    return (
      <PremiumCard>
        <TextArea
          id={`planning-q-${q.id}`}
          label={`${q.label}${labelSuffix}`}
          value={value}
          onChange={onChange}
          rows={3}
          placeholder={q.placeholder ?? "Add notes…"}
        />
        {(q.helpText ?? "").trim() ? (
          <p className="mt-2 text-xs leading-relaxed text-stone-600">{q.helpText}</p>
        ) : null}
      </PremiumCard>
    );
  }

  if (q.answerType === "yes_no") {
    return (
      <PremiumCard>
        <label className={lightUiFormLabelClass}>
          {q.label}
          {labelSuffix}
        </label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={lightUiSelectClass}
        >
          <option value="" className="bg-white text-stone-900">
            Select…
          </option>
          <option value="Yes" className="bg-white text-stone-900">
            Yes
          </option>
          <option value="No" className="bg-white text-stone-900">
            No
          </option>
        </select>
        {(q.helpText ?? "").trim() ? (
          <p className="mt-2 text-xs leading-relaxed text-stone-600">{q.helpText}</p>
        ) : null}
      </PremiumCard>
    );
  }

  if (q.answerType === "multiple_choice") {
    return (
      <PremiumCard>
        <label className={lightUiFormLabelClass}>
          {q.label}
          {labelSuffix}
        </label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={lightUiSelectClass}
        >
          <option value="" className="bg-white text-stone-900">
            Select…
          </option>
          {(q.options ?? []).map((option) => (
            <option key={`pq-option-${q.id}-${option}`} value={option} className="bg-white text-stone-900">
              {option}
            </option>
          ))}
        </select>
        {(q.helpText ?? "").trim() ? (
          <p className="mt-2 text-xs leading-relaxed text-stone-600">{q.helpText}</p>
        ) : null}
      </PremiumCard>
    );
  }

  return (
    <PremiumCard>
      <TextInput
        id={`planning-q-${q.id}`}
        label={`${q.label}${labelSuffix}`}
        value={value}
        onChange={onChange}
        placeholder={q.placeholder ?? "Add answer…"}
      />
      {(q.helpText ?? "").trim() ? (
        <p className="mt-2 text-xs leading-relaxed text-stone-600">{q.helpText}</p>
      ) : null}
    </PremiumCard>
  );
}

type ImportedPlaylistSong = {
  title: string;
  artist: string;
  vibe: "chill" | "romantic" | "dance";
};

type LocalAppStateBackup = {
  activeScreen: Screen;
  appMode: AppMode;
  authStage: "login" | "invite" | "app";
  currentRole: UserRole | null;
  rolePreview: UserRole;
  guestRequestView: "admin" | "guest";
  inviteAccessPreview: {
    eventId: string;
    role: UserRole;
    token: string;
    link: string;
  } | null;
};

type BackupPayload = {
  version: 1;
  exportedAt: string;
  events: EventRecord[];
  activeEventId: string;
  appSettings: AppSettings;
  templates: TimelineTemplate[];
  teamMembers: TeamMember[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  appState: LocalAppStateBackup;
};

const MUSIC_HUB_BUCKET_SHELL: Record<PlaylistBucketId, string> = {
  cocktailHour: "border border-stone-200 border-t-2 border-t-black bg-white shadow-none",
  dinner: "border border-stone-200 border-t-2 border-t-stone-600 bg-white shadow-none",
  openDancing: "border border-stone-200 border-t-[3px] border-t-[#7E52A0] bg-white shadow-none",
  afterparty: "border border-stone-200 border-t-2 border-t-stone-800 bg-white shadow-none",
  custom: "border border-stone-200 border-t-2 border-t-emerald-700 bg-white shadow-none",
};

/** Event Packet Options: on = solid cyan + dark text; off = white + readable gray + border */
const EVENT_PACKET_SECTION_TOGGLE_ON =
  "w-full border border-stone-900/20 bg-[#00D4FF] text-stone-950 shadow-none hover:brightness-[1.02]";
const EVENT_PACKET_SECTION_TOGGLE_OFF =
  "w-full border border-stone-300 bg-white text-stone-700 shadow-none hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900";

const TIMELINE_DRAG_EDGE_PX = 76;
const TIMELINE_DRAG_SCROLL_STEP = 18;

/** Nearest vertical scroll container (including `start`) for timeline drag auto-scroll. */
function findVerticalScrollContainer(start: HTMLElement | null): HTMLElement | null {
  if (typeof document === "undefined" || !start) return null;
  let el: HTMLElement | null = start;
  while (el) {
    const { overflowY } = window.getComputedStyle(el);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 2
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/** First names for Run Of Show headline (e.g. "Alex + Jordan") from stored couple / client string. */
function formatRunOfShowCoupleFirstNames(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const firstToken = (segment: string) => {
    const t = segment.trim();
    if (!t) return "";
    const word = t.split(/\s+/).find((w) => /[A-Za-z0-9]/.test(w)) ?? t;
    return word.replace(/^[^A-Za-z0-9]+/, "").replace(/[^A-Za-z0-9'-]+$/, "");
  };
  const parts = trimmed
    .split(/\s*(?:&|\+|\/|,|\||\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const a = firstToken(parts[0]);
    const b = firstToken(parts[1]);
    if (a && b) return `${a} + ${b}`;
  }
  const one = firstToken(parts[0] ?? trimmed);
  return one || null;
}

/** Run Of Show header accent (subtle chrome only); swap when white-label themes ship. */
const DEFAULT_RUN_OF_SHOW_BRAND_ACCENT = "#00D4FF";

/** Run Of Show live view: collapse key for the ceremony moment list (not persisted planning data). */
const RUN_OF_SHOW_CEREMONY_SECTION_ID = "ros:ceremony";

function autoScrollForDragClientY(clientY: number, scrollContainer: HTMLElement | null): void {
  if (typeof window === "undefined") return;
  if (scrollContainer) {
    const r = scrollContainer.getBoundingClientRect();
    if (clientY < r.top + TIMELINE_DRAG_EDGE_PX) {
      scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop - TIMELINE_DRAG_SCROLL_STEP);
    } else if (clientY > r.bottom - TIMELINE_DRAG_EDGE_PX) {
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      scrollContainer.scrollTop = Math.min(maxScroll, scrollContainer.scrollTop + TIMELINE_DRAG_SCROLL_STEP);
    }
  } else if (clientY < TIMELINE_DRAG_EDGE_PX) {
    window.scrollBy({ top: -TIMELINE_DRAG_SCROLL_STEP, left: 0, behavior: "auto" });
  } else if (clientY > window.innerHeight - TIMELINE_DRAG_EDGE_PX) {
    window.scrollBy({ top: TIMELINE_DRAG_SCROLL_STEP, left: 0, behavior: "auto" });
  }
}

type EventLayoutProfile =
  | "Wedding"
  | "Gender-Neutral Wedding"
  | "Corporate"
  | "Holiday Party"
  | "Graduation Celebration"
  | "Birthday Party"
  | "Bar/Club Event"
  | "School Dance"
  | "Private Party";

type EventModalDraft = {
  eventName: string;
  coupleNames: string;
  eventType: string;
  eventLayoutProfile: EventLayoutProfile;
  weddingDate: string;
  venue: string;
  ceremonyLocation: string;
  receptionLocation: string;
  assignedDj: string;
  packageName: string;
  plannerName: string;
  plannerEmail: string;
  internalNotes: string;
};

const EVENT_TYPES: EventLayoutProfile[] = [
  "Wedding",
  "Gender-Neutral Wedding",
  "Corporate",
  "Holiday Party",
  "Graduation Celebration",
  "Birthday Party",
  "Private Party",
  "Bar/Club Event",
  "School Dance",
];

const GLOBAL_SETTINGS_SECTIONS = [
  "Event Types",
  "Planning Questions",
  "Timeline Presets",
  "Event Document",
  "Team Management",
  "Branding / App",
] as const;

type GlobalSettingsSection = (typeof GLOBAL_SETTINGS_SECTIONS)[number];

const QUESTION_ANSWER_TYPES: {
  value: PlanningQuestionAnswerType;
  label: string;
}[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "yes_no", label: "Yes / No" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "song", label: "Song" },
  { value: "contact", label: "Contact" },
];

const getLayoutProfileDefaults = (profile: EventLayoutProfile) => {
  if (profile === "Gender-Neutral Wedding") {
    return {
      sectionCeremonyEnabled: true,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: true,
      sectionMcScriptEnabled: true,
      sectionVendorContactsEnabled: true,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: true,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  if (profile === "Corporate") {
    return {
      sectionCeremonyEnabled: false,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: true,
      sectionMcScriptEnabled: true,
      sectionVendorContactsEnabled: true,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: false,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  if (profile === "Holiday Party") {
    return {
      sectionCeremonyEnabled: false,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: true,
      sectionMcScriptEnabled: true,
      sectionVendorContactsEnabled: true,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: true,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  if (profile === "Graduation Celebration") {
    return {
      sectionCeremonyEnabled: false,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: true,
      sectionMcScriptEnabled: true,
      sectionVendorContactsEnabled: false,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: true,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  if (profile === "Birthday Party") {
    return {
      sectionCeremonyEnabled: false,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: true,
      sectionMcScriptEnabled: true,
      sectionVendorContactsEnabled: false,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: true,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  if (profile === "Bar/Club Event") {
    return {
      sectionCeremonyEnabled: false,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: true,
      sectionMcScriptEnabled: true,
      sectionVendorContactsEnabled: false,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: true,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  if (profile === "School Dance") {
    return {
      sectionCeremonyEnabled: false,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: true,
      sectionMcScriptEnabled: true,
      sectionVendorContactsEnabled: false,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: true,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  if (profile === "Private Party") {
    return {
      sectionCeremonyEnabled: false,
      sectionReceptionTimelineEnabled: true,
      sectionPlaylistsEnabled: true,
      sectionMustPlayEnabled: true,
      sectionDoNotPlayEnabled: false,
      sectionMcScriptEnabled: false,
      sectionVendorContactsEnabled: false,
      sectionMusicNotesEnabled: true,
      sectionGuestRequestsEnabled: false,
      sectionFormalitiesEnabled: false,
      sectionPlanningChecklistEnabled: true,
      sectionPlanningQuestionsEnabled: true,
    };
  }
  return {
    sectionCeremonyEnabled: true,
    sectionReceptionTimelineEnabled: true,
    sectionPlaylistsEnabled: true,
    sectionMustPlayEnabled: true,
    sectionDoNotPlayEnabled: true,
    sectionMcScriptEnabled: true,
    sectionVendorContactsEnabled: true,
    sectionMusicNotesEnabled: true,
    sectionGuestRequestsEnabled: true,
    sectionFormalitiesEnabled: false,
    sectionPlanningChecklistEnabled: true,
    sectionPlanningQuestionsEnabled: true,
  };
};

type LayoutSectionDefaults = ReturnType<typeof getLayoutProfileDefaults>;

const inferLayoutProfileFromEventType = (eventType: string): EventLayoutProfile => {
  const normalized = eventType.trim().toLowerCase();
  if (normalized.includes("gender-neutral")) return "Gender-Neutral Wedding";
  if (normalized.includes("holiday")) return "Holiday Party";
  if (normalized.includes("graduation") || normalized.includes("grad")) return "Graduation Celebration";
  if (normalized.includes("birthday") || normalized.includes("sweet 16")) return "Birthday Party";
  if (normalized.includes("bar") || normalized.includes("club") || normalized.includes("nightclub")) return "Bar/Club Event";
  if (normalized.includes("school") || normalized.includes("prom") || normalized.includes("homecoming")) return "School Dance";
  if (normalized.includes("corporate") || normalized.includes("company") || normalized.includes("business")) return "Corporate";
  if (normalized.includes("private")) return "Private Party";
  if (!normalized || normalized.includes("wedding")) return "Wedding";
  return "Private Party";
};

const LAYOUT_PROFILE_DESCRIPTIONS: Record<EventLayoutProfile, string> = {
  Wedding:
    "Full planning suite with ceremony, reception timeline, music, vendors, and Event Document export",
  "Gender-Neutral Wedding":
    "Inclusive wedding profile with ceremony, reception timeline, and full music planning",
  Corporate: "Run-of-show, playlists, announcements, vendors, and optional scripts",
  "Holiday Party": "Run-of-show, announcements, guest requests, and festive music planning",
  "Graduation Celebration": "Timeline, announcements, requests, and clean-event music controls",
  "Birthday Party": "Party-forward timeline with playlists, requests, and celebration moments",
  "Bar/Club Event": "Performance-focused timeline, playlists, requests, and floor energy notes",
  "School Dance": "Playlists, guest requests, announcements, and simplified timeline",
  "Private Party": "Minimal planning with music, timeline, and notes",
};

type LiveEventDocumentVisibilityDefaults = Pick<
  EventSettings,
  | "liveEventShowMusicNotes"
  | "liveEventShowDoNotPlay"
  | "liveEventShowVendorContacts"
  | "liveEventShowMcScript"
  | "liveEventShowPlaylists"
  | "liveEventShowPlanningQuestions"
  | "liveEventShowGuestRequests"
>;

/** Defaults for Event Prep on-screen / print section visibility (users can override per event). */
function getLiveEventDocumentDefaults(profile: EventLayoutProfile): LiveEventDocumentVisibilityDefaults {
  switch (profile) {
    case "Wedding":
    case "Gender-Neutral Wedding":
      return {
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: true,
        liveEventShowVendorContacts: true,
        liveEventShowMcScript: true,
        liveEventShowPlaylists: false,
        liveEventShowPlanningQuestions: true,
        liveEventShowGuestRequests: false,
      };
    case "Corporate":
    case "Holiday Party":
      return {
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: false,
        liveEventShowVendorContacts: true,
        liveEventShowMcScript: true,
        liveEventShowPlaylists: true,
        liveEventShowPlanningQuestions: false,
        liveEventShowGuestRequests: false,
      };
    case "School Dance":
    case "Graduation Celebration":
      return {
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: true,
        liveEventShowVendorContacts: false,
        liveEventShowMcScript: true,
        liveEventShowPlaylists: true,
        liveEventShowPlanningQuestions: false,
        liveEventShowGuestRequests: true,
      };
    case "Birthday Party":
      return {
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: true,
        liveEventShowVendorContacts: false,
        liveEventShowMcScript: true,
        liveEventShowPlaylists: true,
        liveEventShowPlanningQuestions: true,
        liveEventShowGuestRequests: true,
      };
    case "Bar/Club Event":
      return {
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: true,
        liveEventShowVendorContacts: false,
        liveEventShowMcScript: true,
        liveEventShowPlaylists: true,
        liveEventShowPlanningQuestions: false,
        liveEventShowGuestRequests: true,
      };
    case "Private Party":
      return {
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: false,
        liveEventShowVendorContacts: false,
        liveEventShowMcScript: false,
        liveEventShowPlaylists: true,
        liveEventShowPlanningQuestions: false,
        liveEventShowGuestRequests: false,
      };
    default:
      return {
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: false,
        liveEventShowVendorContacts: false,
        liveEventShowMcScript: false,
        liveEventShowPlaylists: true,
        liveEventShowPlanningQuestions: false,
        liveEventShowGuestRequests: false,
      };
  }
}

/** Migrates deprecated screen ids from persisted app state (localStorage / backups). */
function migrateLegacyScreenId(raw: unknown): Screen {
  if (
    raw === "DJ Prep Sheet" ||
    raw === "Live Event Mode" ||
    raw === "Event Document"
  ) {
    return "Event Prep";
  }
  if (raw === "Formal Dances" || raw === "Reception Formalities") {
    return "Reception Timeline";
  }
  if (raw === "Music") {
    return "Music Hub";
  }
  return raw as Screen;
}

const LAYOUT_SECTION_PREVIEW: {
  key: keyof LayoutSectionDefaults;
  label: string;
}[] = [
  { key: "sectionCeremonyEnabled", label: "Ceremony" },
  { key: "sectionReceptionTimelineEnabled", label: "Reception timeline" },
  { key: "sectionPlaylistsEnabled", label: "Playlists" },
  { key: "sectionMustPlayEnabled", label: "Must play" },
  { key: "sectionDoNotPlayEnabled", label: "Do not play" },
  { key: "sectionMcScriptEnabled", label: "MC script / announcements" },
  { key: "sectionVendorContactsEnabled", label: "Vendor contacts" },
  { key: "sectionMusicNotesEnabled", label: "Music notes" },
  { key: "sectionGuestRequestsEnabled", label: "Guest requests" },
  { key: "sectionPlanningChecklistEnabled", label: "Planning checklist" },
  { key: "sectionPlanningQuestionsEnabled", label: "Planning questions" },
];

const getEnabledLayoutSectionLabels = (defaults: LayoutSectionDefaults) =>
  LAYOUT_SECTION_PREVIEW.filter((row) => defaults[row.key]).map((row) => row.label);

const getEnabledSectionLabels = (
  profile: EventLayoutProfile | string,
  defaults?: Partial<LayoutSectionDefaults> | null,
): string[] => {
  const safeDefaults = getLayoutProfileDefaults(
    (EVENT_TYPES.includes(profile as EventLayoutProfile)
      ? profile
      : "Wedding") as EventLayoutProfile,
  );
  const resolvedDefaults = {
    ...safeDefaults,
    ...(defaults ?? {}),
  } as LayoutSectionDefaults;

  const labels = getEnabledLayoutSectionLabels(resolvedDefaults);
  return labels.length > 0 ? labels : ["No sections enabled"];
};

const EVENT_TYPE_USE_CASE: Record<EventLayoutProfile, string> = {
  Wedding: "Full wedding-day planning with ceremony cues, reception timeline, and vendor coordination.",
  "Gender-Neutral Wedding":
    "Inclusive wedding planning with partner/couple language and full ceremony + reception support.",
  Corporate:
    "Programmed event flow for remarks, run-of-show transitions, and brand-aware music control.",
  "Holiday Party":
    "Seasonal celebration planning with timeline, playlists, announcements, and optional requests.",
  "Graduation Celebration":
    "Family-focused celebration flow with announcements, requests, and milestone moments.",
  "Birthday Party":
    "Party-forward planning with special moments, requests, and dance-floor pacing.",
  "Private Party":
    "Lean event setup for timeline + music direction with optional restrictions.",
  "Bar/Club Event":
    "Set-time driven performance flow with playlists, music direction, and floor management.",
  "School Dance":
    "Student event planning with clean music controls, announcements, and request management.",
};

const getDefaultLiveEventSectionLabels = (profile: EventLayoutProfile): string[] => {
  const visibility = getLiveEventDocumentDefaults(profile);
  const labels = ["Event Overview"];
  const layoutDefaults = getLayoutProfileDefaults(profile);
  if (layoutDefaults.sectionCeremonyEnabled) labels.push("Ceremony Timeline");
  if (layoutDefaults.sectionReceptionTimelineEnabled) {
    labels.push(
      profile === "Corporate"
        ? "Run of Show"
        : profile === "School Dance" ||
            profile === "Private Party" ||
            profile === "Graduation Celebration" ||
            profile === "Birthday Party" ||
            profile === "Bar/Club Event" ||
            profile === "Holiday Party"
          ? "Timeline"
          : "Reception Timeline",
    );
  }
  if (
    visibility.liveEventShowPlanningQuestions &&
    layoutDefaults.sectionPlanningQuestionsEnabled
  ) {
    labels.push("Planning Notes / Key Answers");
  }
  if (visibility.liveEventShowMusicNotes && layoutDefaults.sectionMusicNotesEnabled) {
    labels.push(profile === "School Dance" ? "Clean Music Notes" : "Music Notes");
  }
  if (visibility.liveEventShowDoNotPlay && layoutDefaults.sectionDoNotPlayEnabled) {
    labels.push("Do Not Play");
  }
  if (visibility.liveEventShowPlaylists && layoutDefaults.sectionPlaylistsEnabled) {
    labels.push("Playlists");
  }
  if (visibility.liveEventShowVendorContacts && layoutDefaults.sectionVendorContactsEnabled) {
    labels.push("Vendors / Contacts");
  }
  if (visibility.liveEventShowMcScript && layoutDefaults.sectionMcScriptEnabled) {
    labels.push(
      profile === "Corporate" || profile === "Holiday Party"
        ? "Announcements / Script Notes"
        : profile === "School Dance" || profile === "Graduation Celebration"
          ? "Announcements"
          : "MC Script / Announcements",
    );
  }
  if (visibility.liveEventShowGuestRequests && layoutDefaults.sectionGuestRequestsEnabled) {
    labels.push("Guest Requests");
  }
  return labels;
};

const PRIMARY_PARTY_FIELD_LABEL: Record<EventLayoutProfile, string> = {
  Wedding: "Couple / Honoree Names",
  "Gender-Neutral Wedding": "Partners / Honoree Names",
  Corporate: "Client / Organization Name",
  "Holiday Party": "Host / Organization Name",
  "Graduation Celebration": "Graduate / School Name",
  "Birthday Party": "Host / Guest of Honor",
  "Bar/Club Event": "Venue / Event Name",
  "School Dance": "School / Organization Name",
  "Private Party": "Host / Guest of Honor",
};

/** Table headers, cards, and plain-text export prefix for the primary party field */
const PRIMARY_PARTY_SHORT_LABEL: Record<EventLayoutProfile, string> = {
  Wedding: "Couple / Honoree",
  "Gender-Neutral Wedding": "Partners / Honoree",
  Corporate: "Client / Organization",
  "Holiday Party": "Host / Organization",
  "Graduation Celebration": "Graduate / School",
  "Birthday Party": "Host / Honoree",
  "Bar/Club Event": "Venue / Event",
  "School Dance": "School / Organization",
  "Private Party": "Host / Guest of Honor",
};

const INVITE_PREVIEW_TITLE: Record<EventLayoutProfile, string> = {
  Wedding: "You've been invited to plan your celebration with Cutmaster Music",
  "Gender-Neutral Wedding": "You've been invited to plan your celebration with Cutmaster Music",
  Corporate: "You've been invited to collaborate on this corporate event with Cutmaster Music",
  "Holiday Party": "You've been invited to collaborate on this holiday event with Cutmaster Music",
  "Graduation Celebration": "You've been invited to collaborate on this graduation event with Cutmaster Music",
  "Birthday Party": "You've been invited to collaborate on this birthday event with Cutmaster Music",
  "Bar/Club Event": "You've been invited to collaborate on this bar/club event with Cutmaster Music",
  "School Dance": "You've been invited to collaborate on this school event with Cutmaster Music",
  "Private Party": "You've been invited to collaborate on this event with Cutmaster Music",
};

const COPY_INVITE_LINK_LABEL: Record<EventLayoutProfile, string> = {
  Wedding: "Copy couple invite link",
  "Gender-Neutral Wedding": "Copy partner invite link",
  Corporate: "Copy client invite link",
  "Holiday Party": "Copy holiday event invite link",
  "Graduation Celebration": "Copy graduation invite link",
  "Birthday Party": "Copy birthday invite link",
  "Bar/Club Event": "Copy venue invite link",
  "School Dance": "Copy school portal invite link",
  "Private Party": "Copy host invite link",
};

function migrateLegacyLayoutProfile(
  rawProfile: unknown,
  eventType: string,
): EventLayoutProfile {
  const value = String(rawProfile ?? "").trim();
  if (
    value === "Wedding" ||
    value === "Gender-Neutral Wedding" ||
    value === "Corporate" ||
    value === "Holiday Party" ||
    value === "Graduation Celebration" ||
    value === "Birthday Party" ||
    value === "Private Party" ||
    value === "Bar/Club Event" ||
    value === "School Dance"
  ) {
    return value;
  }
  if (value === "Quinceañera") return "Wedding";
  if (value === "Custom") return "Private Party";
  if (value === "Sweet 16") return "Birthday Party";
  if (value === "En Blanc Experience") return "Bar/Club Event";
  return inferLayoutProfileFromEventType(eventType);
}

function resolveLayoutProfileForDisplay(
  settings: Partial<Pick<EventSettings, "eventLayoutProfile" | "eventType">> | undefined,
  defaultEventType: string,
): EventLayoutProfile {
  return migrateLegacyLayoutProfile(
    settings?.eventLayoutProfile,
    settings?.eventType ?? defaultEventType ?? "",
  );
}

type EventNavSectionFlags = {
  sectionCeremonyEnabled: boolean;
  sectionReceptionTimelineEnabled: boolean;
  sectionPlaylistsEnabled: boolean;
  sectionMustPlayEnabled: boolean;
  sectionDoNotPlayEnabled: boolean;
  sectionMcScriptEnabled: boolean;
  sectionVendorContactsEnabled: boolean;
  sectionMusicNotesEnabled: boolean;
  sectionGuestRequestsEnabled: boolean;
  sectionPlanningChecklistEnabled: boolean;
  sectionPlanningQuestionsEnabled: boolean;
};

/** Shared by event nav and perspective switching so role changes keep the same event + valid screen. */
function buildEventNavItemsForRole(role: UserRole, s: EventNavSectionFlags): Screen[] {
  const includeExportScreens =
    s.sectionReceptionTimelineEnabled ||
    s.sectionCeremonyEnabled ||
    s.sectionMustPlayEnabled ||
    s.sectionPlaylistsEnabled ||
    s.sectionDoNotPlayEnabled ||
    s.sectionGuestRequestsEnabled ||
    s.sectionVendorContactsEnabled ||
    s.sectionMcScriptEnabled ||
    s.sectionMusicNotesEnabled ||
    s.sectionPlanningChecklistEnabled ||
    s.sectionPlanningQuestionsEnabled;

  const base: Screen[] = [
    "Dashboard",
    ...(s.sectionMustPlayEnabled || s.sectionDoNotPlayEnabled || s.sectionPlaylistsEnabled
      ? (["Music Hub", "Music Import"] as Screen[])
      : []),
    ...(s.sectionReceptionTimelineEnabled ? (["Timeline"] as Screen[]) : []),
    ...(s.sectionPlanningChecklistEnabled ? (["Planning Checklist"] as Screen[]) : []),
    ...(s.sectionPlanningQuestionsEnabled ? (["Planning Questions"] as Screen[]) : []),
    ...(s.sectionCeremonyEnabled ? (["Ceremony"] as Screen[]) : []),
    ...(s.sectionPlanningChecklistEnabled || s.sectionMusicNotesEnabled ? (["Notes"] as Screen[]) : []),
    ...(s.sectionVendorContactsEnabled ? (["Vendors"] as Screen[]) : []),
    ...(s.sectionGuestRequestsEnabled ? (["Guest Requests"] as Screen[]) : []),
    "Collaborators",
    "Event Settings",
    ...(includeExportScreens ? (["Event Prep"] as Screen[]) : []),
  ];
  if (role === "Admin") return base;
  if (role === "DJ") {
    return base.filter((item) => item !== "Event Settings");
  }
  if (role === "Planner") {
    return base;
  }
  const receptionHubEligible = s.sectionReceptionTimelineEnabled;
  const coupleAllowedScreens: Screen[] = [
    "Dashboard",
    "Reception Hub",
    "Reception Timeline",
    "Music Hub",
    "Music Import",
    "Planning Checklist",
    "Planning Questions",
    "Ceremony",
    "Timeline",
    "Vendors",
    "Guest Requests",
    "Event Settings",
    "Event Prep",
    "Collaborators",
    "Notes",
  ];
  let coupleNav = base.filter((item) => coupleAllowedScreens.includes(item));
  if (receptionHubEligible) {
    coupleNav = coupleNav.filter((item) => item !== "Timeline");
    const dashIdx = coupleNav.indexOf("Dashboard");
    if (dashIdx !== -1 && !coupleNav.includes("Reception Hub")) {
      coupleNav = [
        ...coupleNav.slice(0, dashIdx + 1),
        "Reception Hub",
        ...coupleNav.slice(dashIdx + 1),
      ];
    }
  } else {
    coupleNav = coupleNav.filter((item) => item !== "Reception Hub");
  }
  return coupleNav;
}

function getWorkspaceNavItemsForRole(role: UserRole): Screen[] {
  if (role === "Admin") {
    return ["Command Center", "All Events", "Team", "Settings", "Notification Center"];
  }
  if (role === "DJ") {
    return ["Command Center", "All Events", "Notification Center"];
  }
  return ["All Events", "Notification Center"];
}

function perspectiveRoleLabel(role: UserRole): string {
  return role === "Couple" ? "Client" : role;
}

function eventNavFlagsFromRecord(evt: EventRecord): EventNavSectionFlags {
  return {
    sectionCeremonyEnabled: evt.settings?.sectionCeremonyEnabled ?? true,
    sectionReceptionTimelineEnabled: evt.settings?.sectionReceptionTimelineEnabled ?? true,
    sectionPlaylistsEnabled: evt.settings?.sectionPlaylistsEnabled ?? true,
    sectionMustPlayEnabled: evt.settings?.sectionMustPlayEnabled ?? true,
    sectionDoNotPlayEnabled: evt.settings?.sectionDoNotPlayEnabled ?? true,
    sectionMcScriptEnabled: evt.settings?.sectionMcScriptEnabled ?? true,
    sectionVendorContactsEnabled: evt.settings?.sectionVendorContactsEnabled ?? true,
    sectionMusicNotesEnabled: evt.settings?.sectionMusicNotesEnabled ?? true,
    sectionGuestRequestsEnabled: evt.settings?.sectionGuestRequestsEnabled ?? true,
    sectionPlanningChecklistEnabled: evt.settings?.sectionPlanningChecklistEnabled ?? true,
    sectionPlanningQuestionsEnabled: evt.settings?.sectionPlanningQuestionsEnabled ?? true,
  };
}

function VendorEventCard({
  vendor,
  variant,
  onEdit,
  onDelete,
  onCopy,
}: {
  vendor: Vendor;
  variant: "cutmaster" | "partner";
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendorId: string) => void;
  onCopy: (vendor: Vendor) => void;
}) {
  const displayName = vendor.contactName.trim() || vendor.companyName.trim() || "Contact";
  const companyLine =
    vendor.contactName.trim() && vendor.companyName.trim() ? vendor.companyName.trim() : null;
  const roleLabel = vendorTypeLabel(vendor.vendorType);
  const wrapCls =
    variant === "cutmaster"
      ? "border border-stone-200 border-l-[3px] border-l-[#7E52A0] bg-white shadow-none"
      : "border border-stone-200 bg-white shadow-none";
  const igUrl = vendor.instagram.trim()
    ? vendor.instagram.startsWith("http")
      ? vendor.instagram
      : `https://instagram.com/${vendor.instagram.replace(/^@/, "")}`
    : "";
  const webUrl = vendor.website.trim()
    ? vendor.website.startsWith("http")
      ? vendor.website
      : `https://${vendor.website}`
    : "";
  const smsLink = vendor.phone.trim() ? smsHref(vendor.phone) : "";

  return (
    <article
      className={`flex flex-col rounded-2xl border p-4 sm:p-5 ${wrapCls}`}
      data-vendor-id={vendor.id}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">
            {roleLabel}
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-stone-950 [overflow-wrap:anywhere] sm:truncate">
            {displayName}
          </p>
          {companyLine ? (
            <p className="mt-0.5 text-sm leading-snug text-stone-700 [overflow-wrap:anywhere] sm:truncate sm:text-stone-600">
              {companyLine}
            </p>
          ) : null}
          {variant === "cutmaster" ? (
            <span className="mt-2 inline-flex rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-900">
              Cutmaster
            </span>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:flex-col sm:gap-1">
          <PrimaryButton
            type="button"
            onClick={() => onEdit(vendor)}
            className="min-h-12 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-10 sm:flex-none sm:px-2.5 sm:py-1.5 sm:text-[11px] sm:font-medium"
          >
            Edit
          </PrimaryButton>
          <PrimaryButton
            type="button"
            onClick={() => onDelete(vendor.id)}
            className="min-h-12 flex-1 rounded-lg border border-rose-400 bg-white px-3 py-2.5 text-[13px] font-semibold text-rose-900 shadow-none hover:bg-rose-50 sm:min-h-10 sm:flex-none sm:px-2.5 sm:py-1.5 sm:text-[11px]"
          >
            Delete
          </PrimaryButton>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-stone-700 sm:mt-3 sm:space-y-1.5 sm:text-xs sm:text-stone-600">
        {vendor.phone.trim() ? (
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-stone-500">Phone</dt>
            <dd className="min-w-0 text-stone-900">{vendor.phone.trim()}</dd>
          </div>
        ) : null}
        {vendor.email.trim() ? (
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-stone-500">Email</dt>
            <dd className="min-w-0 break-all text-stone-900">{vendor.email.trim()}</dd>
          </div>
        ) : null}
        {webUrl ? (
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-stone-500">Web</dt>
            <dd className="min-w-0 truncate text-[#0c7a96]">{vendor.website.trim()}</dd>
          </div>
        ) : null}
        {vendor.instagram.trim() ? (
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-stone-500">Social</dt>
            <dd className="min-w-0 truncate text-stone-700">{vendor.instagram.trim()}</dd>
          </div>
        ) : null}
      </dl>

      {vendor.notes.trim() ? (
        <p className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm leading-relaxed text-stone-800 sm:mt-2 sm:bg-white sm:px-2.5 sm:py-2 sm:text-[11px] sm:leading-snug sm:text-stone-700">
          {vendor.notes.trim()}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2 sm:mt-4">
        {vendor.phone.trim() ? (
          <PrimaryButton
            type="button"
            onClick={() => window.open(`tel:${vendor.phone.trim()}`, "_blank")}
            className="min-h-12 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-9 sm:py-2 sm:text-[11px] sm:font-medium sm:text-stone-800 sm:shadow-sm sm:flex-none"
          >
            Call
          </PrimaryButton>
        ) : null}
        {smsLink ? (
          <PrimaryButton
            type="button"
            onClick={() => window.open(smsLink, "_blank")}
            className="min-h-12 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-9 sm:py-2 sm:text-[11px] sm:font-medium sm:text-stone-800 sm:shadow-sm sm:flex-none"
          >
            Text
          </PrimaryButton>
        ) : null}
        {vendor.email.trim() ? (
          <PrimaryButton
            type="button"
            onClick={() => window.open(`mailto:${vendor.email.trim()}`, "_blank")}
            className="min-h-12 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-9 sm:py-2 sm:text-[11px] sm:font-medium sm:text-stone-800 sm:shadow-sm sm:flex-none"
          >
            Email
          </PrimaryButton>
        ) : null}
        <PrimaryButton
          type="button"
          onClick={() => onCopy(vendor)}
          className="min-h-12 flex-1 rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-[13px] font-semibold text-black shadow-none hover:brightness-[0.97] sm:min-h-9 sm:py-2 sm:text-[11px] sm:flex-none"
        >
          Copy
        </PrimaryButton>
        {webUrl ? (
          <PrimaryButton
            type="button"
            onClick={() => window.open(webUrl, "_blank")}
            className="min-h-12 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-9 sm:py-2 sm:text-[11px] sm:font-medium sm:text-stone-800 sm:shadow-sm sm:flex-none"
          >
            Website
          </PrimaryButton>
        ) : null}
        {igUrl ? (
          <PrimaryButton
            type="button"
            onClick={() => window.open(igUrl, "_blank")}
            className="min-h-12 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-9 sm:py-2 sm:text-[11px] sm:font-medium sm:text-stone-800 sm:shadow-sm sm:flex-none"
          >
            Instagram
          </PrimaryButton>
        ) : null}
      </div>
    </article>
  );
}

const PERSPECTIVE_ROLES: UserRole[] = ["Couple", "Planner", "DJ", "Admin"];

export default function Home() {
  const timelineComposerRef = useRef<HTMLDivElement | null>(null);
  const timelineStreamRef = useRef<HTMLDivElement | null>(null);
  const ceremonyTimelineComposerRef = useRef<HTMLDivElement | null>(null);
  const ceremonyTimelineStreamRef = useRef<HTMLDivElement | null>(null);
  const eventCoverPhotoInputRef = useRef<HTMLInputElement>(null);
  const hasParsedInviteParams = useRef(false);
  const {
    activeScreen,
    setActiveScreen,
    hasHydrated,
    setHasHydrated,
    persistPhase,
    setPersistPhase,
    persistBaseline,
    setPersistBaseline,
    authStage,
    setAuthStage,
    currentRole,
    setCurrentRole,
    inviteAccessPreview,
    setInviteAccessPreview,
  } = usePlanningApp();
  const persistUiSuppressBootCountRef = useRef(0);
  const persistPhaseHideTimeoutRef = useRef<number | null>(null);
  const [mustPlaySongs, setMustPlaySongs] = useState<SongEntry[]>(initialMustPlaySongs);
  const [doNotPlaySongs, setDoNotPlaySongs] = useState<SongEntry[]>(initialDoNotPlaySongs);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongArtist, setNewSongArtist] = useState("");
  const [newSongNotes, setNewSongNotes] = useState("");
  const [newSongHighPriority, setNewSongHighPriority] = useState(false);
  const [newSongListType, setNewSongListType] = useState<SongListType>("mustPlay");
  const [playlistUrlInput, setPlaylistUrlInput] = useState("");
  const [musicImportStage, setMusicImportStage] = useState<
    "idle" | "analyzing" | "building" | "ready"
  >("idle");
  const [importedPlaylistName, setImportedPlaylistName] = useState("");
  const [importedPlaylistSongs, setImportedPlaylistSongs] = useState<ImportedPlaylistSong[]>([]);
  const [importCocktailSuggestions, setImportCocktailSuggestions] = useState<string[]>([]);
  const [importDinnerSuggestions, setImportDinnerSuggestions] = useState<string[]>([]);
  const [importOpenDancingSuggestions, setImportOpenDancingSuggestions] = useState<string[]>([]);
  const [guestRequestView, setGuestRequestView] = useState<"admin" | "guest">("admin");
  const [guestRequests, setGuestRequests] = useState<GuestRequestEntry[]>(initialGuestRequests);
  const [guestFormName, setGuestFormName] = useState("");
  const [guestFormTitle, setGuestFormTitle] = useState("");
  const [guestFormArtist, setGuestFormArtist] = useState("");
  const [guestFormDedication, setGuestFormDedication] = useState("");
  const [guestSubmitBanner, setGuestSubmitBanner] = useState("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(seedMergedTimelineItems);
  const [ceremonyTimelineItems, setCeremonyTimelineItems] = useState<CeremonyTimelineItem[]>(
    initialCeremonyTimelineItems,
  );
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineTime, setTimelineTime] = useState("");
  const [timelineCategory, setTimelineCategory] =
    useState<TimelineCategory>("Ceremony");
  const [timelineNotes, setTimelineNotes] = useState("");
  const [timelineSongTitle, setTimelineSongTitle] = useState("");
  const [timelineArtist, setTimelineArtist] = useState("");
  const [timelineComposerError, setTimelineComposerError] = useState<string | null>(null);
  const [timelineNeedsAttention, setTimelineNeedsAttention] = useState(false);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [draggingTimelineId, setDraggingTimelineId] = useState<string | null>(null);
  const [dropTargetTimelineId, setDropTargetTimelineId] = useState<string | null>(null);
  const dropTargetTimelineIdRef = useRef<string | null>(null);
  const touchDragTimelineSourceRef = useRef<string | null>(null);
  /** Reception/main timeline: collapsed summary vs expanded inline edit */
  const [receptionTimelineExpandedId, setReceptionTimelineExpandedId] = useState<string | null>(null);
  /** Compact add/edit panel for new items (not inline-expanded rows) */
  const [timelineComposerOpen, setTimelineComposerOpen] = useState(false);
  /** Event Document: distraction-free live execution view (same timeline order as packet). */
  const [runOfShowOpen, setRunOfShowOpen] = useState(false);
  const [runOfShowIsFullscreen, setRunOfShowIsFullscreen] = useState(false);
  /** Live execution only: per-moment done flags (localStorage), never synced to planning timeline. */
  const [runOfShowDoneKeys, setRunOfShowDoneKeys] = useState<Set<string>>(() => new Set());
  /**
   * Sections that are still all-done but the operator chose to expand again (prevents immediate
   * re-collapse until at least one moment in that section is marked not done).
   */
  const [runOfShowUserExpandedWhileCompleteIds, setRunOfShowUserExpandedWhileCompleteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const runOfShowScrollRef = useRef<HTMLElement | null>(null);
  /** Whether the current Up Next timeline row intersects the Run Of Show scroll viewport (for floating cue). */
  const [runOfShowUpNextRowInView, setRunOfShowUpNextRowInView] = useState(true);
  /** Apple Pencil / touch ink layer over Run Of Show scroll area (local only). */
  const [runOfShowAnnotateMode, setRunOfShowAnnotateMode] = useState(false);
  const [runOfShowAnnotationStrokes, setRunOfShowAnnotationStrokes] = useState<RunOfShowAnnotationStroke[]>([]);
  const [runOfShowAnnotationCanvasSize, setRunOfShowAnnotationCanvasSize] = useState({ w: 0, h: 0 });
  const runOfShowAnnotationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const runOfShowAnnotationInProgressRef = useRef<{ x: number; y: number }[] | null>(null);
  const runOfShowAnnotationStrokesRef = useRef<RunOfShowAnnotationStroke[]>([]);
  const runOfShowAnnotationCanvasSizeRef = useRef({ w: 0, h: 0 });
  const runOfShowAnnotationPersistTimerRef = useRef<number | null>(null);
  const runOfShowAnnotationPointerRafRef = useRef<number | null>(null);
  runOfShowAnnotationStrokesRef.current = runOfShowAnnotationStrokes;
  runOfShowAnnotationCanvasSizeRef.current = runOfShowAnnotationCanvasSize;
  const [weddingPartyProcessional, setWeddingPartyProcessional] = useState<CeremonySongPlan>(
    initialWeddingPartyProcessional,
  );
  const [brideGroomProcessional, setBrideGroomProcessional] = useState<CeremonySongPlan>(
    initialBrideGroomProcessional,
  );
  const [unityCeremonySong, setUnityCeremonySong] = useState<CeremonySongPlan>(
    initialUnityCeremonySong,
  );
  const [recessionalSong, setRecessionalSong] = useState<CeremonySongPlan>(
    initialRecessionalSong,
  );
  const [ceremonyNotes, setCeremonyNotes] = useState(initialCeremonyNotes);
  const [officiantName, setOfficiantName] = useState(initialOfficiantName);
  const [ceremonyStartTime, setCeremonyStartTime] = useState(initialCeremonyStartTime);
  const [ceremonyGuestArrivalTime, setCeremonyGuestArrivalTime] = useState(
    initialCeremonyGuestArrivalTime,
  );
  const [microphoneNeeds, setMicrophoneNeeds] = useState(initialMicrophoneNeeds);
  const [generalDjNotes, setGeneralDjNotes] = useState(initialGeneralDjNotes);
  const [playlistVibeOverrides, setPlaylistVibeOverrides] =
    useState<Partial<Record<PlaylistBucketId, string[]>>>({});
  const [musicVibeDetail, setMusicVibeDetail] = useState<MusicVibeDetail>({});
  const [playlistAddDrafts, setPlaylistAddDrafts] = useState<
    Partial<Record<PlaylistBucketId, string>>
  >({});
  const [playlistDrag, setPlaylistDrag] = useState<{ id: PlaylistBucketId; index: number } | null>(
    null,
  );
  const [mcAnnouncements, setMcAnnouncements] = useState(initialMcAnnouncements);
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "error">("");
  const [rolePreview, setRolePreview] = useState<UserRole>("Admin");
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [activityEventFilter, setActivityEventFilter] = useState<string>("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    eventLayoutProfile: "Wedding",
    eventName: "Wedding Reception",
    coupleNames: "Alex & Jordan",
    eventType: "Wedding",
    weddingDate: "",
    venue: "",
    ceremonyLocation: "",
    receptionLocation: "",
    eventStartTime: "",
    eventEndTime: "",
    assignedDj: "",
    plannerName: "",
    plannerEmail: "",
    packageName: "",
    internalNotes: "",
    clientFacingNotes: "",
    prepSheetFooterOverride: "",
    guestRequestMessageOverride: "",
    coupleWelcomeMessageOverride: "",
    liveEventShowMusicNotes: true,
    liveEventShowDoNotPlay: true,
    liveEventShowVendorContacts: true,
    liveEventShowMcScript: true,
    liveEventShowPlaylists: false,
    liveEventShowPlanningQuestions: true,
    liveEventShowGuestRequests: false,
    liveEventCompactMode: false,
    liveEventLargePrintMode: false,
    sectionCeremonyEnabled: true,
    sectionReceptionTimelineEnabled: true,
    sectionPlaylistsEnabled: true,
    sectionMustPlayEnabled: true,
    sectionDoNotPlayEnabled: true,
    sectionMcScriptEnabled: true,
    sectionVendorContactsEnabled: true,
    sectionMusicNotesEnabled: true,
    sectionGuestRequestsEnabled: true,
    sectionFormalitiesEnabled: false,
    sectionPlanningChecklistEnabled: true,
    sectionPlanningQuestionsEnabled: true,
    planningQuestionAnswers: {},
    checklistDueDates: {},
    checklistManualStatuses: {},
    eventLifecycleStatus: "active",
  });
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("Couple");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupStatus, setBackupStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [activeGlobalSettingsSection, setActiveGlobalSettingsSection] =
    useState<GlobalSettingsSection>("Event Types");
  /** Timeline Presets (Global Settings): expanded card keys; omitted/false = collapsed. */
  const [timelinePresetExpandedByProfile, setTimelinePresetExpandedByProfile] = useState<
    Partial<Record<EventLayoutProfile, boolean>>
  >({});
  const timelinePresetDragRef = useRef<{ profile: EventLayoutProfile; index: number } | null>(null);

  // `weddingDetails` is derived from the active event (see event management state below).

  const [plannerNotes, setPlannerNotes] = useState<string[]>(initialPlannerNotes);
  const [vendors, setVendors] = useState<Vendor[]>(() => normalizeVendorsArray(initialVendors));

  const [appMode, setAppMode] = useState<AppMode>("events");
  const [activeEventId, setActiveEventId] = useState<string>("evt-1");

  const [events, setEvents] = useState<EventRecord[]>(() =>
    buildSeedEvents({
      timelineItems,
      ceremonyTimelineItems,
      formalities: [],
      mustPlaySongs,
      doNotPlaySongs,
      ceremonyStartTime,
      ceremonyGuestArrivalTime,
      officiantName,
      ceremonyNotes,
      microphoneNeeds,
      weddingPartyProcessional,
      brideGroomProcessional,
      unityCeremonySong,
      recessionalSong,
      plannerNotes,
      vendors,
      guestRequests,
      generalDjNotes,
      mcAnnouncements,
    }),
  );

  const [allEventsSearch, setAllEventsSearch] = useState("");
  const [allEventsProfileFilter, setAllEventsProfileFilter] = useState<EventLayoutProfile | "all">("all");
  const [allEventsLifecycleFilter, setAllEventsLifecycleFilter] = useState<
    "open" | "active" | "completed" | "archived" | "all"
  >("open");
  const [allEventsTimingFilter, setAllEventsTimingFilter] = useState<"all" | "upcoming" | "past">("all");
  const [allEventsSort, setAllEventsSort] = useState<
    "date-asc" | "date-desc" | "recently-updated" | "alpha"
  >("date-asc");

  const activeEvent = events.find((e) => e.id === activeEventId) ?? events[0];
  const weddingDetails: WeddingDetails = activeEvent?.meta ?? {
    couple: "",
    date: "",
    venue: "",
  };

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<"new" | "edit">("new");
  const [eventModalStatus, setEventModalStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [eventDraft, setEventDraft] = useState<EventModalDraft>({
    eventName: "",
    coupleNames: "",
    eventType: appSettings.defaultEventType,
    eventLayoutProfile: inferLayoutProfileFromEventType(appSettings.defaultEventType),
    weddingDate: "",
    venue: "",
    ceremonyLocation: "",
    receptionLocation: "",
    assignedDj: "",
    packageName: "",
    plannerName: "",
    plannerEmail: "",
    internalNotes: "",
  });
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<"new" | "edit">("new");
  const [templateEditingId, setTemplateEditingId] = useState<string | null>(null);
  const [templateDraftName, setTemplateDraftName] = useState("");
  const [templates, setTemplates] = useState<TimelineTemplate[]>(initialTemplates);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [teamEditingId, setTeamEditingId] = useState<string | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [teamRoleDraft, setTeamRoleDraft] = useState<"Admin" | "DJ" | "Planner">("DJ");
  const [teamEmailDraft, setTeamEmailDraft] = useState("");
  const [teamPhoneDraft, setTeamPhoneDraft] = useState("");
  const [teamNotesDraft, setTeamNotesDraft] = useState("");
  const [teamActiveDraft, setTeamActiveDraft] = useState(true);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamFormStatus, setTeamFormStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorEditingId, setVendorEditingId] = useState<string | null>(null);
  const [vendorStatus, setVendorStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [vendorTypeDraft, setVendorTypeDraft] = useState<VendorType>("Planner");
  const [vendorCompanyDraft, setVendorCompanyDraft] = useState("");
  const [vendorContactDraft, setVendorContactDraft] = useState("");
  const [vendorEmailDraft, setVendorEmailDraft] = useState("");
  const [vendorPhoneDraft, setVendorPhoneDraft] = useState("");
  const [vendorNotesDraft, setVendorNotesDraft] = useState("");
  const [vendorWebsiteDraft, setVendorWebsiteDraft] = useState("");
  const [vendorInstagramDraft, setVendorInstagramDraft] = useState("");
  const [vendorArrivalDraft, setVendorArrivalDraft] = useState("");
  const [vendorCoordinationDraft, setVendorCoordinationDraft] = useState("");
  const [vendorAffiliationDraft, setVendorAffiliationDraft] =
    useState<VendorAffiliation>("event_partner");
  /** Ceremony timeline: collapsed summary vs expanded inline edit */
  const [ceremonyTimelineExpandedId, setCeremonyTimelineExpandedId] = useState<string | null>(null);
  /** Compact composer for new ceremony moments */
  const [ceremonyTimelineComposerOpen, setCeremonyTimelineComposerOpen] = useState(false);
  const [ceremonyTimelineDraftTimeOrOrder, setCeremonyTimelineDraftTimeOrOrder] = useState("");
  const [ceremonyTimelineDraftMoment, setCeremonyTimelineDraftMoment] = useState("");
  const [ceremonyTimelineDraftSongTitle, setCeremonyTimelineDraftSongTitle] = useState("");
  const [ceremonyTimelineDraftArtist, setCeremonyTimelineDraftArtist] = useState("");
  const [ceremonyTimelineDraftNotes, setCeremonyTimelineDraftNotes] = useState("");
  const [ceremonyTimelineDraftNeedsAttention, setCeremonyTimelineDraftNeedsAttention] = useState(false);
  const [draggingCeremonyTimelineId, setDraggingCeremonyTimelineId] = useState<string | null>(null);
  const [dropTargetCeremonyTimelineId, setDropTargetCeremonyTimelineId] = useState<string | null>(null);
  const dropTargetCeremonyTimelineIdRef = useRef<string | null>(null);
  const touchDragCeremonyTimelineSourceRef = useRef<string | null>(null);
  const reorderTimelineItemToTargetRef = useRef<(itemId: string, targetId: string) => void>(() => {});
  const reorderCeremonyTimelineItemToTargetRef = useRef<(itemId: string, targetId: string) => void>(
    () => {},
  );

  const commitActiveEventPlanningToEventsState = useCallback(() => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === activeEventId
          ? {
              ...evt,
              lastUpdatedAt: Date.now(),
              meta: {
                ...evt.meta,
                couple: eventSettings.coupleNames || evt.meta.couple,
                date: eventSettings.weddingDate || evt.meta.date,
                venue: eventSettings.venue || evt.meta.venue,
              },
              timelineItems,
              ceremonyTimelineItems,
              formalities: [],
              mustPlaySongs,
              doNotPlaySongs,
              ceremonyStartTime,
              ceremonyGuestArrivalTime,
              officiantName,
              ceremonyNotes,
              microphoneNeeds,
              weddingPartyProcessional,
              brideGroomProcessional,
              unityCeremonySong,
              recessionalSong,
              plannerNotes,
              vendors,
              guestRequests,
              generalDjNotes,
              playlistVibeOverrides,
              musicVibeDetail,
              mcAnnouncements,
              settings: eventSettings,
            }
          : evt,
      ),
    );
  }, [
    activeEventId,
    brideGroomProcessional,
    ceremonyGuestArrivalTime,
    ceremonyNotes,
    ceremonyStartTime,
    ceremonyTimelineItems,
    eventSettings,
    generalDjNotes,
    guestRequests,
    mcAnnouncements,
    microphoneNeeds,
    musicVibeDetail,
    mustPlaySongs,
    doNotPlaySongs,
    officiantName,
    plannerNotes,
    playlistVibeOverrides,
    recessionalSong,
    timelineItems,
    unityCeremonySong,
    vendors,
    weddingPartyProcessional,
  ]);

  const loadEventPlanningIntoWorkingState = (evt: EventRecord) => {
    const normalized = normalizeEventRecordAfterFormalitiesMerge(evt);
    setTimelineItems(cloneJson(normalized.timelineItems));
    setCeremonyTimelineItems(cloneJson(normalized.ceremonyTimelineItems ?? []));
    setMustPlaySongs(cloneJson(normalized.mustPlaySongs));
    setDoNotPlaySongs(cloneJson(normalized.doNotPlaySongs));
    setCeremonyStartTime(evt.ceremonyStartTime);
    setCeremonyGuestArrivalTime(evt.ceremonyGuestArrivalTime ?? "");
    setOfficiantName(evt.officiantName);
    setCeremonyNotes(evt.ceremonyNotes);
    setMicrophoneNeeds(evt.microphoneNeeds);
    setWeddingPartyProcessional(cloneJson(evt.weddingPartyProcessional));
    setBrideGroomProcessional(cloneJson(evt.brideGroomProcessional));
    setUnityCeremonySong(cloneJson(evt.unityCeremonySong));
    setRecessionalSong(cloneJson(evt.recessionalSong));
    setPlannerNotes(cloneJson(evt.plannerNotes));
    setVendors(cloneJson(normalized.vendors ?? []));
    setGuestRequests(cloneJson(evt.guestRequests));
    setGeneralDjNotes(evt.generalDjNotes);
    setPlaylistVibeOverrides(cloneJson(evt.playlistVibeOverrides ?? {}));
    setMusicVibeDetail(cloneJson(evt.musicVibeDetail ?? {}));
    setMcAnnouncements(evt.mcAnnouncements);
    setEventSettings(
      cloneJson({
        eventLayoutProfile: migrateLegacyLayoutProfile(
          evt.settings?.eventLayoutProfile,
          evt.settings?.eventType ?? "",
        ),
        eventName: evt.settings?.eventName ?? evt.meta.couple ?? "",
        coupleNames: evt.settings?.coupleNames ?? evt.meta.couple ?? "",
        eventType: migrateLegacyLayoutProfile(
          evt.settings?.eventLayoutProfile ?? evt.settings?.eventType,
          evt.settings?.eventType ?? "",
        ),
        weddingDate: evt.settings?.weddingDate ?? evt.meta.date ?? "",
        venue: evt.settings?.venue ?? evt.meta.venue ?? "",
        ceremonyLocation: evt.settings?.ceremonyLocation ?? "",
        receptionLocation: evt.settings?.receptionLocation ?? "",
        eventStartTime: evt.settings?.eventStartTime ?? "",
        eventEndTime: evt.settings?.eventEndTime ?? "",
        assignedDj: evt.settings?.assignedDj ?? "",
        plannerName: evt.settings?.plannerName ?? "",
        plannerEmail: evt.settings?.plannerEmail ?? "",
        packageName: evt.settings?.packageName ?? "",
        internalNotes: evt.settings?.internalNotes ?? "",
        clientFacingNotes: evt.settings?.clientFacingNotes ?? "",
        prepSheetFooterOverride: evt.settings?.prepSheetFooterOverride ?? "",
        guestRequestMessageOverride: evt.settings?.guestRequestMessageOverride ?? "",
        coupleWelcomeMessageOverride: evt.settings?.coupleWelcomeMessageOverride ?? "",
        liveEventShowMusicNotes: evt.settings?.liveEventShowMusicNotes ?? true,
        liveEventShowDoNotPlay: evt.settings?.liveEventShowDoNotPlay ?? true,
        liveEventShowVendorContacts: evt.settings?.liveEventShowVendorContacts ?? true,
        liveEventShowMcScript: evt.settings?.liveEventShowMcScript ?? true,
        liveEventShowPlaylists: evt.settings?.liveEventShowPlaylists ?? true,
        liveEventShowPlanningQuestions: evt.settings?.liveEventShowPlanningQuestions ?? true,
        liveEventShowGuestRequests:
          typeof evt.settings?.liveEventShowGuestRequests === "boolean"
            ? evt.settings.liveEventShowGuestRequests
            : getLiveEventDocumentDefaults(
                (evt.settings?.eventLayoutProfile as EventLayoutProfile) ?? "Wedding",
              ).liveEventShowGuestRequests,
        liveEventCompactMode: evt.settings?.liveEventCompactMode ?? false,
        liveEventLargePrintMode: evt.settings?.liveEventLargePrintMode ?? false,
        sectionCeremonyEnabled: evt.settings?.sectionCeremonyEnabled ?? true,
        sectionReceptionTimelineEnabled: evt.settings?.sectionReceptionTimelineEnabled ?? true,
        sectionPlaylistsEnabled: evt.settings?.sectionPlaylistsEnabled ?? true,
        sectionMustPlayEnabled: evt.settings?.sectionMustPlayEnabled ?? true,
        sectionDoNotPlayEnabled: evt.settings?.sectionDoNotPlayEnabled ?? true,
        sectionMcScriptEnabled: evt.settings?.sectionMcScriptEnabled ?? true,
        sectionVendorContactsEnabled: evt.settings?.sectionVendorContactsEnabled ?? true,
        sectionMusicNotesEnabled: evt.settings?.sectionMusicNotesEnabled ?? true,
        sectionGuestRequestsEnabled: evt.settings?.sectionGuestRequestsEnabled ?? true,
        sectionFormalitiesEnabled: false,
        sectionPlanningChecklistEnabled: evt.settings?.sectionPlanningChecklistEnabled ?? true,
        sectionPlanningQuestionsEnabled: evt.settings?.sectionPlanningQuestionsEnabled ?? true,
        planningQuestionAnswers: evt.settings?.planningQuestionAnswers ?? {},
        checklistDueDates: evt.settings?.checklistDueDates ?? {},
        checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
        coverPhotoDataUrl: evt.settings?.coverPhotoDataUrl,
        eventLifecycleStatus: evt.settings?.eventLifecycleStatus ?? "active",
      }),
    );

    // Reset local editing modes when switching context.
    setEditingTimelineId(null);
    setTimelineNeedsAttention(false);
  };

  const switchToEvent = (nextEventId: string) => {
    const next = events.find((e) => e.id === nextEventId);
    if (!next) return;

    commitActiveEventPlanningToEventsState();
    loadEventPlanningIntoWorkingState(next);
    setActiveEventId(nextEventId);
    setActiveScreen("Dashboard");
    setAppMode("event");
  };

  const getEventName = useCallback(
    (eventId: string) =>
      events.find((evt) => evt.id === eventId)?.settings?.eventName ||
      events.find((evt) => evt.id === eventId)?.meta.couple ||
      "Event",
    [events],
  );

  const logActivity = useCallback((type: ActivityType, summary: string, eventId = activeEventId) => {
    const role = currentRole ?? rolePreview;
    const item: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      summary,
      userRole: role,
      eventId,
      eventName: getEventName(eventId),
      timestamp: Date.now(),
      unread: true,
    };
    setActivities((prev) => [item, ...prev].slice(0, 220));
  }, [activeEventId, currentRole, getEventName, rolePreview]);

  const pushNotification = useCallback((summary: string, type: ActivityType | "system", eventId = activeEventId) => {
    const eventName = getEventName(eventId);
    const recentExists = notifications.some(
      (n) =>
        n.summary === summary &&
        n.eventId === eventId &&
        Date.now() - n.timestamp < 20 * 60 * 1000,
    );
    if (recentExists) return;
    const item: NotificationItem = {
      id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      summary,
      eventId,
      eventName,
      timestamp: Date.now(),
      unread: true,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 140));
  }, [activeEventId, getEventName, notifications]);

  const formatRelativeTime = (ts: number) => {
    const diffMs = nowTick - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const activityTypeIcon = (type: ActivityType | "system") => {
    if (type === "event_created") return "✨";
    if (type === "timeline_updated") return "🕒";
    if (type === "timeline_item_added") return "➕";
    if (type === "song_added") return "🎵";
    if (type === "guest_request_submitted") return "📩";
    if (type === "guest_request_reviewed") return "✅";
    if (type === "ceremony_updated") return "💍";
    if (type === "formality_updated") return "💃";
    if (type === "collaborator_invited") return "👥";
    if (type === "collaborator_removed_from_event") return "🚪";
    if (type === "team_member_added") return "🧑‍💼";
    if (type === "team_member_assigned") return "🎧";
    if (type === "team_member_removed_from_event") return "🧾";
    if (type === "vendor_updated") return "🏢";
    if (type === "checklist_completed") return "☑️";
    if (type === "template_applied") return "🧩";
    return "🔔";
  };

  const buildEventFromTemplate = (
    meta: WeddingDetails,
    template: TimelineTemplate | undefined,
    ids: { eventId: string; collaboratorId: string },
  ): EventRecord => {
    const templateTimeline = template
      ? migrateFormalitiesIntoTimelineItems(
          cloneJson(template.timelineItems),
          cloneJson(template.formalities ?? []),
        )
      : cloneJson(timelineItems);
    const templateSuggestions = template ? cloneJson(template.planningSuggestions) : cloneJson(plannerNotes);
    return {
      id: ids.eventId,
      lastUpdatedAt: Date.now(),
      meta,
      collaborators: [
        {
          id: ids.collaboratorId,
          name: "Event Owner",
          email: "owner@example.com",
          role: "Couple",
          status: "Accepted",
        },
      ],
      timelineItems: templateTimeline,
      ceremonyTimelineItems: cloneJson(ceremonyTimelineItems),
      formalities: [],
      mustPlaySongs: cloneJson(mustPlaySongs),
      doNotPlaySongs: cloneJson(doNotPlaySongs),
      ceremonyStartTime,
      ceremonyGuestArrivalTime,
      officiantName,
      ceremonyNotes,
      microphoneNeeds,
      weddingPartyProcessional: cloneJson(weddingPartyProcessional),
      brideGroomProcessional: cloneJson(brideGroomProcessional),
      unityCeremonySong: cloneJson(unityCeremonySong),
      recessionalSong: cloneJson(recessionalSong),
      plannerNotes: templateSuggestions,
      vendors: cloneJson(vendors),
      guestRequests: cloneJson(guestRequests),
      generalDjNotes,
      playlistVibeOverrides: cloneJson(playlistVibeOverrides),
      musicVibeDetail: cloneJson(musicVibeDetail),
      mcAnnouncements,
      settings: {
        eventLayoutProfile: "Wedding",
        eventName: meta.couple || "New Event",
        coupleNames: meta.couple,
        eventType: appSettings.defaultEventType,
        weddingDate: meta.date,
        venue: meta.venue,
        ceremonyLocation: "",
        receptionLocation: "",
        eventStartTime: "",
        eventEndTime: "",
        assignedDj: "",
        plannerName: "",
        plannerEmail: "",
        packageName: "",
        internalNotes: "",
        clientFacingNotes: "",
        prepSheetFooterOverride: "",
        guestRequestMessageOverride: "",
        coupleWelcomeMessageOverride: "",
        liveEventShowMusicNotes: true,
        liveEventShowDoNotPlay: true,
        liveEventShowVendorContacts: true,
        liveEventShowMcScript: true,
        liveEventShowPlaylists: true,
        liveEventShowPlanningQuestions: true,
        liveEventShowGuestRequests: false,
        liveEventCompactMode: false,
        liveEventLargePrintMode: false,
        sectionCeremonyEnabled: true,
        sectionReceptionTimelineEnabled: true,
        sectionPlaylistsEnabled: true,
        sectionMustPlayEnabled: true,
        sectionDoNotPlayEnabled: true,
        sectionMcScriptEnabled: true,
        sectionVendorContactsEnabled: true,
        sectionMusicNotesEnabled: true,
        sectionGuestRequestsEnabled: true,
        sectionFormalitiesEnabled: false,
        sectionPlanningChecklistEnabled: true,
        sectionPlanningQuestionsEnabled: true,
        planningQuestionAnswers: {},
        checklistDueDates: {},
        checklistManualStatuses: {},
        eventLifecycleStatus: "active",
      },
    };
  };

  const buildCeremonyTimelineFromLegacyEvent = (evt: Partial<EventRecord>): CeremonyTimelineItem[] => {
    const inferredProfile = inferLayoutProfileFromEventType(evt.settings?.eventType ?? "");
    const partnerProcessionalLabel =
      inferredProfile === "Gender-Neutral Wedding"
        ? "Partner/Couple Processional"
        : "Bride/Groom Processional";
    const existing = Array.isArray(evt.ceremonyTimelineItems) ? evt.ceremonyTimelineItems : [];
    if (existing.length > 0) {
      return existing.map((item, index) => ({
        id: item.id || `ceremony-timeline-migrated-${index}`,
        timeOrOrder: item.timeOrOrder || "",
        moment: item.moment || `Ceremony Moment ${index + 1}`,
        songTitle: item.songTitle || "",
        artist: item.artist || "",
        notes: item.notes || "",
        needsDjMcAttention: Boolean(item.needsDjMcAttention),
      }));
    }

    return [
      {
        id: `ceremony-timeline-${Date.now()}-prelude`,
        timeOrOrder: evt.ceremonyGuestArrivalTime || "Prelude",
        moment: "Guest Arrival / Prelude",
        songTitle: "",
        artist: "",
        notes: "",
        needsDjMcAttention: false,
      },
      {
        id: `ceremony-timeline-${Date.now()}-wedding-party`,
        timeOrOrder: "Processional",
        moment: "Wedding Party Processional",
        songTitle: evt.weddingPartyProcessional?.title || "",
        artist: evt.weddingPartyProcessional?.artist || "",
        notes: evt.weddingPartyProcessional?.notes || "",
        needsDjMcAttention: true,
      },
      {
        id: `ceremony-timeline-${Date.now()}-bride-groom`,
        timeOrOrder: partnerProcessionalLabel,
        moment: partnerProcessionalLabel,
        songTitle: evt.brideGroomProcessional?.title || "",
        artist: evt.brideGroomProcessional?.artist || "",
        notes: evt.brideGroomProcessional?.notes || "",
        needsDjMcAttention: true,
      },
      {
        id: `ceremony-timeline-${Date.now()}-unity`,
        timeOrOrder: "Unity",
        moment: "Unity Ceremony",
        songTitle: evt.unityCeremonySong?.title || "",
        artist: evt.unityCeremonySong?.artist || "",
        notes: evt.unityCeremonySong?.notes || "",
        needsDjMcAttention: false,
      },
      {
        id: `ceremony-timeline-${Date.now()}-recessional`,
        timeOrOrder: "Recessional",
        moment: "Recessional",
        songTitle: evt.recessionalSong?.title || "",
        artist: evt.recessionalSong?.artist || "",
        notes: evt.recessionalSong?.notes || "",
        needsDjMcAttention: true,
      },
    ];
  };

  const openCreateTemplateModal = () => {
    setTemplateModalMode("new");
    setTemplateEditingId(null);
    setTemplateDraftName("");
    setTemplateModalOpen(true);
  };

  const openEditTemplateModal = (template: TimelineTemplate) => {
    setTemplateModalMode("edit");
    setTemplateEditingId(template.id);
    setTemplateDraftName(template.name);
    setTemplateModalOpen(true);
  };

  const handleSaveEventModal = () => {
    const draft = eventDraft;
    const couple = draft.coupleNames.trim();
    const date = draft.weddingDate.trim();
    const venue = draft.venue.trim();
    const eventName = draft.eventName.trim() || couple || "New Event";
    const inferredProfile = inferLayoutProfileFromEventType(draft.eventType || appSettings.defaultEventType);
    const createLayoutProfile = inferredProfile;
    const profileDefaults = getLayoutProfileDefaults(createLayoutProfile);

    if (!eventName || !couple) {
      const missingPrimaryLabel = PRIMARY_PARTY_FIELD_LABEL[draft.eventLayoutProfile];
      setEventModalStatus({
        kind: "error",
        message: `${missingPrimaryLabel} is required to create an event.`,
      });
      return;
    }

    if (eventModalMode === "new") {
      const newEvent = buildEventFromTemplate(
        { couple, date, venue },
        undefined,
        {
          eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          collaboratorId: `col-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        },
      );
      newEvent.settings = {
        ...newEvent.settings,
        eventLayoutProfile: createLayoutProfile,
        eventName,
        coupleNames: couple,
        eventType: draft.eventType || newEvent.settings.eventType,
        weddingDate: date,
        venue,
        ceremonyLocation: draft.ceremonyLocation.trim(),
        receptionLocation: draft.receptionLocation.trim(),
        assignedDj: draft.assignedDj,
        packageName: draft.packageName.trim(),
        plannerName: draft.plannerName.trim(),
        plannerEmail: draft.plannerEmail.trim(),
        internalNotes: draft.internalNotes.trim(),
        ...profileDefaults,
        ...getLiveEventDocumentDefaults(createLayoutProfile),
      };
      newEvent.meta = {
        couple,
        date,
        venue,
      };
      const timelinePresetDefaults =
        appSettings.timelinePresetSets?.[createLayoutProfile] ??
        getDefaultTimelinePresetSets()[createLayoutProfile] ??
        [];
      const enabledPresets = timelinePresetDefaults.filter((item) => item.defaultIncluded);
      newEvent.ceremonyTimelineItems = enabledPresets
        .filter((item) => item.timelineType === "ceremony")
        .map((item) =>
          ceremonyTimelineItemFromPreset(
            item,
            `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ),
        );
      newEvent.timelineItems = enabledPresets
        .filter((item) => item.timelineType === "main")
        .map((item) =>
          mainTimelineItemFromPreset(item, `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        );
      setEvents((prev) => [...prev, newEvent]);
      setActiveEventId(newEvent.id);
      loadEventPlanningIntoWorkingState(newEvent);
      setAppMode("event");
      setActiveScreen("Dashboard");
      setEventModalOpen(false);
      setEventEditingId(null);
      setEventModalStatus(null);
      logActivity("event_created", `Created event: ${couple}`, newEvent.id);
      return;
    }

    if (eventEditingId) {
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventEditingId
            ? {
                ...evt,
                meta: { couple, date, venue },
                settings: {
                  ...evt.settings,
                  eventLayoutProfile: inferredProfile,
                  eventName,
                  coupleNames: couple,
                  eventType: draft.eventType,
                  weddingDate: date,
                  venue,
                  ceremonyLocation: draft.ceremonyLocation.trim(),
                  receptionLocation: draft.receptionLocation.trim(),
                  assignedDj: draft.assignedDj,
                  packageName: draft.packageName.trim(),
                  plannerName: draft.plannerName.trim(),
                  plannerEmail: draft.plannerEmail.trim(),
                  internalNotes: draft.internalNotes.trim(),
                },
              }
            : evt,
        ),
      );
      setEventModalStatus(null);
    }

    setEventModalOpen(false);
    setEventEditingId(null);
  };

  const handleSaveTemplateModal = () => {
    const name = templateDraftName.trim();
    if (!name) return;

    if (templateModalMode === "new") {
      const newTemplate: TimelineTemplate = {
        id: `tpl-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        kind: "custom",
        timelineItems: cloneJson(timelineItems),
        formalities: [],
        planningSuggestions: cloneJson(plannerNotes),
      };
      setTemplates((prev) => [...prev, newTemplate]);
      setTemplateModalOpen(false);
      return;
    }

    if (!templateEditingId) return;

    setTemplates((prev) =>
      prev.map((tpl) =>
        tpl.id === templateEditingId
          ? {
              ...tpl,
              name,
              timelineItems: cloneJson(timelineItems),
              formalities: [],
              planningSuggestions: cloneJson(plannerNotes),
            }
          : tpl,
      ),
    );
    setTemplateModalOpen(false);
    setTemplateEditingId(null);
  };

  const screenTitle =
    activeScreen === "Dashboard" ? `${appSettings.appName} Dashboard` : activeScreen;
  const effectiveTimezone = appSettings.defaultEventTimezone;
  const effectiveEventType = eventSettings.eventType || appSettings.defaultEventType;
  const effectivePrepSheetFooter =
    eventSettings.prepSheetFooterOverride || appSettings.prepSheetFooterText;
  const effectiveGuestRequestMessage =
    eventSettings.guestRequestMessageOverride || appSettings.publicGuestRequestMessage;
  const effectiveCoupleWelcomeMessage =
    eventSettings.coupleWelcomeMessageOverride || appSettings.coupleWelcomeMessage;

  const layoutProfileForActiveEvent = useMemo(
    () => resolveLayoutProfileForDisplay(eventSettings, appSettings.defaultEventType),
    [eventSettings, appSettings.defaultEventType],
  );
  const primaryPartyFieldLabel = PRIMARY_PARTY_FIELD_LABEL[layoutProfileForActiveEvent];
  const primaryPartyShortLabel = PRIMARY_PARTY_SHORT_LABEL[layoutProfileForActiveEvent];
  const eventDateGridLabel =
    layoutProfileForActiveEvent === "Wedding" ||
    layoutProfileForActiveEvent === "Gender-Neutral Wedding"
      ? "Wedding date"
      : "Event date";
  const eventDateFieldLabel =
    layoutProfileForActiveEvent === "Wedding" ||
    layoutProfileForActiveEvent === "Gender-Neutral Wedding"
      ? "Wedding Date"
      : "Event Date";

  const eventPrepReceptionHeading =
    layoutProfileForActiveEvent === "Corporate"
      ? "Run of Show"
      : layoutProfileForActiveEvent === "School Dance" ||
          layoutProfileForActiveEvent === "Private Party" ||
          layoutProfileForActiveEvent === "Graduation Celebration" ||
          layoutProfileForActiveEvent === "Birthday Party" ||
          layoutProfileForActiveEvent === "Bar/Club Event" ||
          layoutProfileForActiveEvent === "Holiday Party"
        ? "Timeline"
        : "Reception Timeline";

  const eventPrepMcHeading =
    layoutProfileForActiveEvent === "Corporate" || layoutProfileForActiveEvent === "Holiday Party"
      ? "Announcements / Script Notes"
      : layoutProfileForActiveEvent === "School Dance" ||
          layoutProfileForActiveEvent === "Graduation Celebration"
        ? "Announcements"
        : "Key Announcements / MC Scripts";
  const eventCountdownLabel =
    layoutProfileForActiveEvent === "Wedding" || layoutProfileForActiveEvent === "Gender-Neutral Wedding"
      ? "Wedding countdown"
      : "Event countdown";

  const planningQuestionsForEvent = useMemo(() => {
    const defaultSets = getDefaultPlanningQuestionSets();
    return (
      appSettings.planningQuestionSets?.[layoutProfileForActiveEvent] ??
      defaultSets[layoutProfileForActiveEvent] ??
      getPlanningQuestionsForProfile(layoutProfileForActiveEvent)
    );
  }, [appSettings.planningQuestionSets, layoutProfileForActiveEvent]);

  const planningQuestionsGroupedBySection = useMemo(
    () => groupPlanningQuestionsBySection(planningQuestionsForEvent, layoutProfileForActiveEvent),
    [planningQuestionsForEvent, layoutProfileForActiveEvent],
  );

  const [expandedPlanningQuestionGroups, setExpandedPlanningQuestionGroups] = useState<
    Record<string, boolean>
  >({});

  const planningQuestionSetsForSettings = useMemo(() => {
    const defaults = getDefaultPlanningQuestionSets();
    return EVENT_TYPES.reduce((acc, profile) => {
      acc[profile] = appSettings.planningQuestionSets?.[profile] ?? defaults[profile] ?? [];
      return acc;
    }, {} as Record<EventLayoutProfile, PlanningQuestionDef[]>);
  }, [appSettings.planningQuestionSets]);

  const updatePlanningQuestionSet = useCallback(
    (
      profile: EventLayoutProfile,
      updater: (questions: PlanningQuestionDef[]) => PlanningQuestionDef[],
    ) => {
      setAppSettings((prev) => {
        const defaults = getDefaultPlanningQuestionSets();
        const current = cloneJson(
          prev.planningQuestionSets?.[profile] ?? defaults[profile] ?? [],
        );
        return {
          ...prev,
          planningQuestionSets: {
            ...(prev.planningQuestionSets ?? {}),
            [profile]: updater(current),
          },
        };
      });
    },
    [setAppSettings],
  );

  const addPlanningQuestionToSet = (profile: EventLayoutProfile) => {
    updatePlanningQuestionSet(profile, (questions) => [
      ...questions,
      {
        id: `pq_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: "New question",
        helpText: "",
        answerType: "long_text",
        required: false,
        showInLiveEventMode: true,
        options: [],
        placeholder: "",
        sectionGroup: "event_details",
      },
    ]);
  };

  const resetPlanningQuestionSet = (profile: EventLayoutProfile) => {
    const defaults = getDefaultPlanningQuestionSets();
    setAppSettings((prev) => ({
      ...prev,
      planningQuestionSets: {
        ...(prev.planningQuestionSets ?? {}),
        [profile]: cloneJson(defaults[profile] ?? []),
      },
    }));
  };

  const timelinePresetSetsForSettings = useMemo(() => {
    const defaults = getDefaultTimelinePresetSets();
    return EVENT_TYPES.reduce((acc, profile) => {
      acc[profile] = appSettings.timelinePresetSets?.[profile] ?? defaults[profile] ?? [];
      return acc;
    }, {} as Record<EventLayoutProfile, TimelinePresetItem[]>);
  }, [appSettings.timelinePresetSets]);

  const timelinePresetsForActiveEvent = useMemo(
    () => timelinePresetSetsForSettings[layoutProfileForActiveEvent] ?? [],
    [timelinePresetSetsForSettings, layoutProfileForActiveEvent],
  );
  const ceremonyPresetsForActiveEvent = useMemo(
    () => timelinePresetsForActiveEvent.filter((item) => item.timelineType === "ceremony"),
    [timelinePresetsForActiveEvent],
  );
  const mainTimelinePresetsForActiveEvent = useMemo(
    () => timelinePresetsForActiveEvent.filter((item) => item.timelineType === "main"),
    [timelinePresetsForActiveEvent],
  );

  const buildTimelineItemsFromPresets = useCallback((presets: TimelinePresetItem[]) => {
    const enabledPresets = presets.filter((item) => item.defaultIncluded);
    const ceremonyItems: CeremonyTimelineItem[] = enabledPresets
      .filter((item) => item.timelineType === "ceremony")
      .map((item) =>
        ceremonyTimelineItemFromPreset(
          item,
          `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ),
      );
    const mainItems: TimelineItem[] = enabledPresets
      .filter((item) => item.timelineType === "main")
      .map((item) =>
        mainTimelineItemFromPreset(item, `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
      );
    return { ceremonyItems, mainItems };
  }, []);

  const applyPresetItemsToTimelineState = useCallback(
    (presets: TimelinePresetItem[], replaceExisting: boolean) => {
      const { ceremonyItems, mainItems } = buildTimelineItemsFromPresets(presets);

      setCeremonyTimelineItems((prev) => (replaceExisting ? ceremonyItems : [...prev, ...ceremonyItems]));
      setTimelineItems((prev) => (replaceExisting ? mainItems : [...prev, ...mainItems]));
    },
    [buildTimelineItemsFromPresets],
  );

  const updateTimelinePresetSet = useCallback(
    (
      profile: EventLayoutProfile,
      updater: (presets: TimelinePresetItem[]) => TimelinePresetItem[],
    ) => {
      setAppSettings((prev) => {
        const defaults = getDefaultTimelinePresetSets();
        const current = cloneJson(prev.timelinePresetSets?.[profile] ?? defaults[profile] ?? []);
        return {
          ...prev,
          timelinePresetSets: {
            ...(prev.timelinePresetSets ?? {}),
            [profile]: updater(current),
          },
        };
      });
    },
    [setAppSettings],
  );

  const addTimelinePresetToSet = (profile: EventLayoutProfile) => {
    updateTimelinePresetSet(profile, (presets) => [
      ...presets,
      {
        id: `tp_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timelineType: "main",
        timeOrOrder: "",
        momentName: "New timeline moment",
        songPlaceholder: "",
        notesPlaceholder: "",
        defaultIncluded: true,
      },
    ]);
  };

  const resetTimelinePresetSet = (profile: EventLayoutProfile) => {
    const defaults = getDefaultTimelinePresetSets();
    setAppSettings((prev) => ({
      ...prev,
      timelinePresetSets: {
        ...(prev.timelinePresetSets ?? {}),
        [profile]: cloneJson(defaults[profile] ?? []),
      },
    }));
  };

  const duplicateTimelinePresetMoment = useCallback(
    (profile: EventLayoutProfile, index: number) => {
      updateTimelinePresetSet(profile, (items) => {
        const row = items[index];
        if (!row) return items;
        const copy: TimelinePresetItem = {
          ...cloneJson(row),
          id: `tp_dup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          momentName: row.momentName.trim() ? `${row.momentName.trim()} (copy)` : "Moment (copy)",
        };
        const next = [...items];
        next.splice(index + 1, 0, copy);
        return next;
      });
    },
    [updateTimelinePresetSet],
  );

  const reorderTimelinePresetRows = useCallback(
    (profile: EventLayoutProfile, fromIndex: number, dropIndex: number) => {
      if (fromIndex === dropIndex) return;
      updateTimelinePresetSet(profile, (items) => {
        if (fromIndex < 0 || fromIndex >= items.length || dropIndex < 0 || dropIndex >= items.length) {
          return items;
        }
        const next = [...items];
        const [row] = next.splice(fromIndex, 1);
        let insertAt = dropIndex;
        if (fromIndex < dropIndex) insertAt = dropIndex - 1;
        next.splice(insertAt, 0, row);
        return next;
      });
    },
    [updateTimelinePresetSet],
  );

  const dashboardEyebrowText = useMemo(() => {
    const role = currentRole ?? rolePreview;
    if (role === "Couple") {
      if (layoutProfileForActiveEvent === "Wedding") return "Your wedding planning journey";
      if (layoutProfileForActiveEvent === "Gender-Neutral Wedding") return "Your wedding planning journey";
      return "Your event planning journey";
    }
    if (role === "Planner") return "Coordination & logistics";
    if (role === "DJ") return "Performance & execution";
    if (role === "Admin") return "Operations & full editing";
    return "Event planning dashboard";
  }, [currentRole, rolePreview, layoutProfileForActiveEvent]);

  const invitePreviewEvent = useMemo(() => {
    if (!inviteAccessPreview) return undefined;
    return events.find((e) => e.id === inviteAccessPreview.eventId);
  }, [inviteAccessPreview, events]);

  const inviteLayoutProfile = useMemo(() => {
    if (!inviteAccessPreview) return "Wedding" satisfies EventLayoutProfile;
    return invitePreviewEvent
      ? resolveLayoutProfileForDisplay(invitePreviewEvent.settings, appSettings.defaultEventType)
      : ("Wedding" satisfies EventLayoutProfile);
  }, [inviteAccessPreview, invitePreviewEvent, appSettings.defaultEventType]);

  const effectiveRole = currentRole ?? rolePreview;
  const canManageMusic = effectiveRole === "Admin" || effectiveRole === "DJ" || effectiveRole === "Couple";
  const canEditTimeline =
    effectiveRole === "Admin" ||
    effectiveRole === "DJ" ||
    effectiveRole === "Planner" ||
    effectiveRole === "Couple";
  const canManageGuestRequests = effectiveRole === "Admin" || effectiveRole === "Couple";
  const canEditNotes = effectiveRole === "Admin" || effectiveRole === "Planner";
  const canManageEvents = effectiveRole === "Admin";
  const canEditEventCover = effectiveRole !== "DJ";
  const canEditEventLifecycle = effectiveRole === "Admin" || effectiveRole === "Planner";
  const applyEventCoverPhoto = useCallback(
    (dataUrl: string | undefined) => {
      setEventSettings((prev) => ({ ...prev, coverPhotoDataUrl: dataUrl }));
      if (!activeEventId) return;
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === activeEventId
            ? { ...evt, settings: { ...evt.settings, coverPhotoDataUrl: dataUrl } }
            : evt,
        ),
      );
    },
    [activeEventId],
  );

  const handleEventCoverPhotoChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        const dataUrl = await readImageFileAsDataUrl(file, 2_800_000);
        applyEventCoverPhoto(dataUrl);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Could not use that image.");
      }
    },
    [applyEventCoverPhoto],
  );

  const applyEventLifecycleStatus = useCallback(
    (status: EventLifecycleStatus) => {
      setEventSettings((prev) => ({ ...prev, eventLifecycleStatus: status }));
      if (!activeEventId) return;
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === activeEventId
            ? {
                ...evt,
                lastUpdatedAt: Date.now(),
                settings: { ...evt.settings, eventLifecycleStatus: status },
              }
            : evt,
        ),
      );
    },
    [activeEventId],
  );

  const viewerRoleBadgeForEvent = useCallback(
    (evt: EventRecord): string | null => {
      const role = effectiveRole;
      if (role === "Admin") return null;
      if (role === "DJ") {
        const activeDj = teamMembers.find((m) => m.role === "DJ" && m.isActive);
        const assigned = evt.settings?.assignedDj?.trim();
        if (activeDj && assigned && (assigned === activeDj.id || assigned === activeDj.name)) {
          return "Assigned DJ";
        }
        return null;
      }
      const collab = (evt.collaborators ?? []).some(
        (c) => c.role === role && c.status === "Accepted",
      );
      if (!collab) return null;
      return role === "Couple" ? "Client" : role;
    },
    [effectiveRole, teamMembers],
  );

  const canInviteCollaborators = effectiveRole === "Admin" || effectiveRole === "Planner";
  const sectionCeremonyEnabled = eventSettings.sectionCeremonyEnabled;
  const sectionReceptionTimelineEnabled = eventSettings.sectionReceptionTimelineEnabled;
  const sectionPlaylistsEnabled = eventSettings.sectionPlaylistsEnabled;
  const sectionMustPlayEnabled = eventSettings.sectionMustPlayEnabled;
  const sectionDoNotPlayEnabled = eventSettings.sectionDoNotPlayEnabled;
  const sectionMcScriptEnabled = eventSettings.sectionMcScriptEnabled;
  const sectionVendorContactsEnabled = eventSettings.sectionVendorContactsEnabled;
  const sectionMusicNotesEnabled = eventSettings.sectionMusicNotesEnabled;
  const sectionGuestRequestsEnabled = eventSettings.sectionGuestRequestsEnabled;
  const sectionPlanningChecklistEnabled = eventSettings.sectionPlanningChecklistEnabled;
  const sectionPlanningQuestionsEnabled = eventSettings.sectionPlanningQuestionsEnabled;
  /** Reception Hub entry when the reception/main timeline is enabled (couple-friendly). */
  const receptionHubEligibleNav = sectionReceptionTimelineEnabled;
  const showDesktopSidebar =
    authStage === "app" &&
    (effectiveRole === "Admin" || effectiveRole === "DJ");
  const acceptedCollaborators = activeEvent?.collaborators?.filter((c) => c.status === "Accepted") ?? [];
  const pendingCollaborators = activeEvent?.collaborators?.filter((c) => c.status === "Pending") ?? [];

  const hasKeyCeremonySongs = Boolean(
    weddingPartyProcessional.title.trim() &&
      brideGroomProcessional.title.trim() &&
      recessionalSong.title.trim(),
  );
  const hasKeyFormalDanceSongs = Boolean(
    timelineItems.some((t) => /first dance/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0) &&
      timelineItems.some(
        (t) => /father\/daughter/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0,
      ) &&
      timelineItems.some(
        (t) => /mother\/son/i.test(t.title) && (t.songTitle?.trim() ?? "").length > 0,
      ),
  );
  const combinedTimelineTitles = timelineItems.map((item) => item.title.toLowerCase());
  const hasKeyTimelineMoments = ["cocktail", "dinner", "toast", "open danc", "last"].every(
    (needle) => combinedTimelineTitles.some((title) => title.includes(needle)),
  );
  const noPendingGuestRequests = guestRequests.every((request) => request.status !== "Pending");
  const hasFinalDjNotes = Boolean(generalDjNotes.trim().length >= 16);
  const hasEventDetailsComplete = Boolean(
    eventSettings.eventName.trim() &&
      eventSettings.coupleNames.trim() &&
      eventSettings.venue.trim() &&
      eventSettings.weddingDate.trim(),
  );

  const checklistTasks = useMemo(
    () => [
      {
        id: "complete-event-details",
        title: "Complete Event Details",
        description: "Finalize names, date, venue, and key event basics.",
        linkedSection: "Event Settings" as Screen,
        autoStatus: hasEventDetailsComplete ? "Complete" : "Not Started",
      },
      {
        id: "choose-ceremony-songs",
        title: "Choose Ceremony Songs",
        description: "Set processional and recessional songs for ceremony cues.",
        linkedSection: "Ceremony" as Screen,
        autoStatus: hasKeyCeremonySongs ? "Complete" : "Not Started",
      },
      {
        id: "add-formal-dance-songs",
        title: "Add Key Formal Dances (Timeline)",
        description: "Set first dance and parent dance songs on your reception timeline.",
        linkedSection: (receptionHubEligibleNav ? "Reception Timeline" : "Timeline") as Screen,
        autoStatus: hasKeyFormalDanceSongs ? "Complete" : "Not Started",
      },
      {
        id: "build-must-play-list",
        title: "Build Must Play List",
        description: "Add must-play songs for the dance floor.",
        linkedSection: "Music Hub" as Screen,
        autoStatus: mustPlaySongs.length > 0 ? "Complete" : "Not Started",
      },
      {
        id: "add-do-not-play-songs",
        title: "Add Do Not Play Songs",
        description: "Capture songs and genres to avoid.",
        linkedSection: "Music Hub" as Screen,
        autoStatus: doNotPlaySongs.length > 0 ? "Complete" : "Not Started",
      },
      {
        id: "review-timeline",
        title: "Review Timeline",
        description: "Confirm key reception flow and transitions.",
        linkedSection: (receptionHubEligibleNav && sectionReceptionTimelineEnabled
          ? "Reception Timeline"
          : "Timeline") as Screen,
        autoStatus: hasKeyTimelineMoments ? "Complete" : "Not Started",
      },
      {
        id: "approve-guest-requests",
        title: "Approve Guest Requests",
        description: "Review and resolve all pending guest requests.",
        linkedSection: "Guest Requests" as Screen,
        autoStatus:
          guestRequests.length > 0 && noPendingGuestRequests ? "Complete" : "Not Started",
      },
      {
        id: "add-final-dj-notes",
        title: "Add Final DJ Notes",
        description: "Document final cues and handoff notes for event day.",
        linkedSection: "Event Prep" as Screen,
        autoStatus: hasFinalDjNotes ? "Complete" : "Not Started",
      },
    ],
    [
      hasEventDetailsComplete,
      hasKeyCeremonySongs,
      hasKeyFormalDanceSongs,
      hasKeyTimelineMoments,
      hasFinalDjNotes,
      mustPlaySongs.length,
      doNotPlaySongs.length,
      guestRequests,
      noPendingGuestRequests,
      receptionHubEligibleNav,
      sectionReceptionTimelineEnabled,
    ],
  );

  const planningChecklist = checklistTasks.map((task) => {
    const dueDate = eventSettings.checklistDueDates?.[task.id] || "";
    const manualStatus = eventSettings.checklistManualStatuses?.[task.id];
    const status = manualStatus ?? task.autoStatus;
    return { ...task, dueDate, status };
  });

  const completionPercent = Math.round(
    (planningChecklist.filter((item) => item.status === "Complete").length / planningChecklist.length) *
      100,
  );
  const isCoupleView = effectiveRole === "Couple";
  /** Run Of Show is operator-facing only — not for couple/client packet review. */
  const canAccessRunOfShow = effectiveRole !== "Couple";
  /** Couple role cannot see ROS UI; keeps scroll lock off if `runOfShowOpen` is stale. */
  const runOfShowOverlayActive = runOfShowOpen && canAccessRunOfShow;
  const eventDisplayName = eventSettings.eventName || weddingDetails.couple;
  /** Same resolution as {@link AppHeader} — Cutmaster default is `/cmm-logo-white.png` (light artwork). */
  const resolvedDocLogoSrc = useMemo(() => {
    const raw = appSettings.logoUrl?.trim() ?? "";
    if (!raw) return "/cmm-logo-white.png";
    if (raw.startsWith("/") || raw.startsWith("http") || raw.startsWith("data:")) return raw;
    return "/cmm-logo-white.png";
  }, [appSettings.logoUrl]);
  const coupleDisplayName = eventSettings.coupleNames || weddingDetails.couple;
  const eventDateDisplay = eventSettings.weddingDate || weddingDetails.date || "TBD";
  const eventVenueDisplay = eventSettings.venue || weddingDetails.venue || "TBD";

  const runOfShowHeadline = useMemo(() => {
    const weddingLike =
      layoutProfileForActiveEvent === "Wedding" ||
      layoutProfileForActiveEvent === "Gender-Neutral Wedding";
    if (weddingLike) {
      const fromCouple = formatRunOfShowCoupleFirstNames(
        eventSettings.coupleNames?.trim() || weddingDetails.couple?.trim() || "",
      );
      if (fromCouple) return fromCouple;
      return (
        eventSettings.eventName?.trim() ||
        weddingDetails.couple?.trim() ||
        eventDisplayName ||
        "Event"
      );
    }
    return (
      eventSettings.eventName?.trim() ||
      weddingDetails.couple?.trim() ||
      eventDisplayName ||
      "Event"
    );
  }, [
    layoutProfileForActiveEvent,
    eventSettings.coupleNames,
    eventSettings.eventName,
    weddingDetails.couple,
    eventDisplayName,
  ]);

  const runOfShowSubline = useMemo(() => {
    const bits: string[] = ["Run Of Show"];
    const date = (eventSettings.weddingDate || weddingDetails.date || "").trim();
    const venue = (eventSettings.venue || weddingDetails.venue || "").trim();
    if (date && date !== "TBD") bits.push(date);
    if (venue && venue !== "TBD") bits.push(venue);
    return bits.join(" · ");
  }, [eventSettings.weddingDate, eventSettings.venue, weddingDetails.date, weddingDetails.venue]);

  /** White-label: drive from `appSettings` today; later replace with tenant brand config object. */
  const runOfShowHeaderBrand = useMemo(
    () => ({
      companyName: appSettings.companyName?.trim() || "Cutmaster Music",
      logoSrc: resolvedDocLogoSrc,
      brandAccentColor: DEFAULT_RUN_OF_SHOW_BRAND_ACCENT,
    }),
    [appSettings.companyName, resolvedDocLogoSrc],
  );

  const parsedWeddingDate = eventDateDisplay && eventDateDisplay !== "TBD" ? new Date(eventDateDisplay) : null;
  const hasValidWeddingDate = Boolean(parsedWeddingDate && !Number.isNaN(parsedWeddingDate.getTime()));
  const safeWeddingTimestamp = hasValidWeddingDate && parsedWeddingDate ? parsedWeddingDate.getTime() : null;
  const millisecondsUntilWedding = safeWeddingTimestamp === null ? null : safeWeddingTimestamp - nowTick;
  const daysUntilWedding =
    millisecondsUntilWedding === null ? null : Math.max(0, Math.ceil(millisecondsUntilWedding / 86400000));
  const nextChecklistTasks = planningChecklist.filter((item) => item.status !== "Complete").slice(0, 3);
  const upcomingMilestones = planningChecklist
    .filter((item) => item.status !== "Complete" && item.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const recentActivityForActiveEvent = activities
    .filter((item) => item.eventId === activeEventId)
    .slice(0, 4);
  const defaultPlaylistLinesById = useMemo((): Record<PlaylistBucketId, string[]> => {
    const cocktailSeed =
      vibeBuckets.find((bucket) => bucket.title === "Cocktail Hour Vibe")?.songs ?? [];
    const dinnerSeed = vibeBuckets.find((bucket) => bucket.title === "Dinner Vibe")?.songs ?? [];
    const openSeed =
      vibeBuckets.find((bucket) => bucket.title === "Open Dancing Vibe")?.songs ?? [];
    return {
      cocktailHour: [...importCocktailSuggestions, ...cocktailSeed],
      dinner: [...importDinnerSuggestions, ...dinnerSeed],
      openDancing: [...importOpenDancingSuggestions, ...openSeed],
      afterparty: [],
      custom: [],
    };
  }, [importCocktailSuggestions, importDinnerSuggestions, importOpenDancingSuggestions]);

  const getPlaylistLines = useCallback(
    (id: PlaylistBucketId) => playlistVibeOverrides[id] ?? defaultPlaylistLinesById[id],
    [playlistVibeOverrides, defaultPlaylistLinesById],
  );

  const addPlaylistLineToBucket = useCallback(
    (id: PlaylistBucketId, rawLine: string) => {
      const trimmed = rawLine.trim();
      if (!trimmed) return;
      const lines = [...getPlaylistLines(id), trimmed];
      setPlaylistVibeOverrides((prev) => ({ ...prev, [id]: lines }));
    },
    [getPlaylistLines],
  );

  const removePlaylistLineFromBucket = useCallback(
    (id: PlaylistBucketId, index: number) => {
      const lines = getPlaylistLines(id).filter((_, i) => i !== index);
      setPlaylistVibeOverrides((prev) => ({ ...prev, [id]: lines }));
    },
    [getPlaylistLines],
  );

  const reorderPlaylistLineInBucket = useCallback(
    (id: PlaylistBucketId, from: number, to: number) => {
      const lines = [...getPlaylistLines(id)];
      if (from === to || from < 0 || from >= lines.length || to < 0 || to >= lines.length) return;
      const [item] = lines.splice(from, 1);
      lines.splice(to, 0, item);
      setPlaylistVibeOverrides((prev) => ({ ...prev, [id]: lines }));
    },
    [getPlaylistLines],
  );

  const resetPlaylistBucketToDefaults = useCallback((id: PlaylistBucketId) => {
    setPlaylistVibeOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const unreadBadgeCount =
    activities.filter((a) => a.unread).length + notifications.filter((n) => n.unread).length;
  const filteredActivities = activities.filter((item) => {
    const eventOk = activityEventFilter === "all" || item.eventId === activityEventFilter;
    const typeOk = activityTypeFilter === "all" || item.type === activityTypeFilter;
    return eventOk && typeOk;
  });
  const quickActions = useMemo(() => {
    const actions: Array<{
      id: string;
      label: string;
      visible: boolean;
      onClick: () => void;
      priority: number;
    }> = [
      {
        id: "add-song",
        label: "Add Song",
        visible: appMode === "event" && canManageMusic,
        onClick: () => {
          setActiveScreen("Music Hub");
          setNewSongListType("mustPlay");
        },
        priority: activeScreen === "Music Hub" ? 100 : 40,
      },
      {
        id: "add-timeline",
        label: "Add Timeline Item",
        visible: appMode === "event" && canEditTimeline,
        onClick: () => {
          const timelineScreen: Screen =
            isCoupleView &&
            receptionHubEligibleNav &&
            sectionReceptionTimelineEnabled
              ? "Reception Timeline"
              : "Timeline";
          setActiveScreen(timelineScreen);
          setTimelineTitle("");
          setTimelineTime("");
          setTimelineCategory("Ceremony");
          setTimelineNotes("");
          setTimelineSongTitle("");
          setTimelineArtist("");
          setTimelineComposerError(null);
          setTimelineNeedsAttention(false);
          setEditingTimelineId(null);
          setTimelineComposerOpen(true);
          window.setTimeout(() => {
            timelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 0);
        },
        priority:
          activeScreen === "Timeline" || activeScreen === "Reception Timeline" ? 100 : 39,
      },
      {
        id: "add-guest-request",
        label: "Add Guest Request",
        visible: appMode === "event" && canManageGuestRequests,
        onClick: () => {
          setActiveScreen("Guest Requests");
          setGuestRequestView("guest");
        },
        priority: activeScreen === "Guest Requests" ? 100 : 37,
      },
      {
        id: "invite-collaborator",
        label: "Invite Collaborator",
        visible: appMode === "event" && canInviteCollaborators,
        onClick: () => {
          setActiveScreen("Collaborators");
          window.setTimeout(() => setInviteModalOpen(true), 0);
        },
        priority: 30,
      },
      {
        id: "create-event",
        label: "Create Event",
        visible: canManageEvents,
        onClick: () => {
          setAppMode("events");
          setActiveScreen("All Events");
          setEventModalMode("new");
          setEventEditingId(null);
          setEventDraft({
            eventName: "",
            coupleNames: "",
            eventType: effectiveEventType,
            eventLayoutProfile: inferLayoutProfileFromEventType(effectiveEventType),
            weddingDate: "",
            venue: "",
            ceremonyLocation: "",
            receptionLocation: "",
            assignedDj: "",
            packageName: "",
            plannerName: "",
            plannerEmail: "",
            internalNotes: "",
          });
          setEventModalOpen(true);
        },
        priority: 20,
      },
    ];
    return actions.filter((a) => a.visible).sort((a, b) => b.priority - a.priority);
  }, [
    activeScreen,
    appMode,
    canEditTimeline,
    isCoupleView,
    receptionHubEligibleNav,
    sectionReceptionTimelineEnabled,
    canInviteCollaborators,
    canManageEvents,
    canManageGuestRequests,
    canManageMusic,
    effectiveEventType,
    logActivity,
    pushNotification,
    setActiveScreen,
    timelineComposerRef,
    timelineStreamRef,
  ]);

  const visibleEvents = useMemo(() => {
    let list: EventRecord[];
    if (!currentRole || currentRole === "Admin") {
      list = events;
    } else if (currentRole === "DJ") {
      const activeDj = teamMembers.find((member) => member.role === "DJ" && member.isActive);
      if (activeDj) {
        list = events.filter(
          (evt) =>
            evt.settings?.assignedDj === activeDj.id ||
            evt.settings?.assignedDj === activeDj.name,
        );
      } else {
        list = [];
      }
    } else {
      list = events.filter((evt) =>
        (evt.collaborators ?? []).some(
          (c) => c.role === currentRole && c.status === "Accepted",
        ),
      );
    }
    const pinned = activeEventId ? events.find((evt) => evt.id === activeEventId) : undefined;
    if (pinned && !list.some((evt) => evt.id === pinned.id)) {
      return [pinned, ...list];
    }
    return list;
  }, [events, currentRole, teamMembers, activeEventId]);

  const parseEventDateTime = useCallback((value: string) => {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  }, []);

  const allEventsFilteredAndSorted = useMemo(() => {
    const q = allEventsSearch.trim().toLowerCase();
    const searching = q.length > 0;

    const matchesSearchFields = (evt: EventRecord, query: string) => {
      const profile = resolveLayoutProfileForDisplay(evt.settings, appSettings.defaultEventType);
      const blob = [
        evt.settings?.eventName,
        evt.meta.couple,
        evt.settings?.coupleNames,
        evt.settings?.venue,
        evt.meta.venue,
        evt.settings?.eventType,
        profile,
        PRIMARY_PARTY_SHORT_LABEL[profile],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const matchesTiming = (evt: EventRecord) => {
      if (allEventsTimingFilter === "all") return true;
      const raw = evt.settings?.weddingDate || evt.meta.date || "";
      const eventMs = Date.parse(raw);
      if (Number.isNaN(eventMs)) {
        return allEventsTimingFilter === "upcoming";
      }
      if (allEventsTimingFilter === "upcoming") {
        return eventMs >= todayMs;
      }
      return eventMs < todayMs;
    };

    const matchesLifecycle = (evt: EventRecord) => {
      const life: EventLifecycleStatus = evt.settings?.eventLifecycleStatus ?? "active";
      switch (allEventsLifecycleFilter) {
        case "all":
          return true;
        case "active":
          return life === "active";
        case "completed":
          return life === "completed";
        case "archived":
          return life === "archived";
        case "open":
          if (life === "archived") {
            return searching && matchesSearchFields(evt, q);
          }
          return life === "active" || life === "completed";
        default:
          return true;
      }
    };

    let rows = visibleEvents.filter((evt) => {
      if (!matchesLifecycle(evt)) return false;
      if (!matchesTiming(evt)) return false;
      const profile = resolveLayoutProfileForDisplay(evt.settings, appSettings.defaultEventType);
      if (allEventsProfileFilter !== "all" && profile !== allEventsProfileFilter) {
        return false;
      }
      if (!searching) return true;
      return matchesSearchFields(evt, q);
    });

    const nameOf = (e: EventRecord) =>
      (e.settings?.eventName || e.meta.couple || "").trim().toLowerCase();

    rows = [...rows].sort((a, b) => {
      switch (allEventsSort) {
        case "alpha":
          return nameOf(a).localeCompare(nameOf(b));
        case "recently-updated":
          return (b.lastUpdatedAt ?? 0) - (a.lastUpdatedAt ?? 0);
        case "date-desc":
          return (
            parseEventDateTime(b.settings?.weddingDate || b.meta.date) -
            parseEventDateTime(a.settings?.weddingDate || a.meta.date)
          );
        case "date-asc":
        default:
          return (
            parseEventDateTime(a.settings?.weddingDate || a.meta.date) -
            parseEventDateTime(b.settings?.weddingDate || b.meta.date)
          );
      }
    });

    return rows;
  }, [
    allEventsLifecycleFilter,
    allEventsProfileFilter,
    allEventsSearch,
    allEventsSort,
    allEventsTimingFilter,
    appSettings.defaultEventType,
    parseEventDateTime,
    visibleEvents,
  ]);

  const commandCenterEvents = useMemo(() => {
    return [...visibleEvents].sort(
      (a, b) => parseEventDateTime(a.settings?.weddingDate || a.meta.date) - parseEventDateTime(b.settings?.weddingDate || b.meta.date),
    );
  }, [parseEventDateTime, visibleEvents]);

  const commandCenterAttentionEvents = useMemo(() => {
    return commandCenterEvents
      .map((evt) => {
        const pendingGuestRequests = evt.guestRequests.filter((req) => req.status === "Pending").length;
        const incompleteChecklistCount = [
          !evt.settings?.eventName?.trim(),
          !evt.settings?.coupleNames?.trim(),
          !evt.settings?.venue?.trim(),
          !evt.settings?.weddingDate?.trim(),
          evt.mustPlaySongs.length === 0,
          evt.timelineItems.length === 0,
        ].filter(Boolean).length;
        return { evt, pendingGuestRequests, incompleteChecklistCount };
      })
      .filter((item) => item.pendingGuestRequests > 0 || item.incompleteChecklistCount > 0);
  }, [commandCenterEvents]);

  const commandCenterUpcomingEvents = commandCenterEvents.slice(0, 6);

  const openCommandCenterEvent = (eventId: string, target: Screen) => {
    const next = events.find((e) => e.id === eventId);
    if (!next) return;
    commitActiveEventPlanningToEventsState();
    loadEventPlanningIntoWorkingState(next);
    setActiveEventId(eventId);
    setAppMode("event");
    setActiveScreen(target);
  };

  const resetTeamMemberDraft = () => {
    setTeamEditingId(null);
    setTeamNameDraft("");
    setTeamRoleDraft("DJ");
    setTeamEmailDraft("");
    setTeamPhoneDraft("");
    setTeamNotesDraft("");
    setTeamActiveDraft(true);
  };

  const startEditingTeamMember = (member: TeamMember) => {
    setTeamEditingId(member.id);
    setTeamNameDraft(member.name);
    setTeamRoleDraft(member.role);
    setTeamEmailDraft(member.email);
    setTeamPhoneDraft(member.phone);
    setTeamNotesDraft(member.notes);
    setTeamActiveDraft(member.isActive);
    setTeamFormStatus({ kind: "success", message: `Editing ${member.name}.` });
    setTeamModalOpen(true);
  };

  const openAddTeamMemberModal = () => {
    resetTeamMemberDraft();
    setTeamFormStatus(null);
    setTeamModalOpen(true);
  };

  const closeTeamMemberModal = () => {
    setTeamModalOpen(false);
    resetTeamMemberDraft();
  };

  const saveTeamMember = () => {
    const name = teamNameDraft.trim();
    const email = teamEmailDraft.trim();
    if (!name) {
      setTeamFormStatus({ kind: "error", message: "Team member name is required." });
      return;
    }
    if (!teamRoleDraft) {
      setTeamFormStatus({ kind: "error", message: "Team member role is required." });
      return;
    }
    if (!teamEditingId) {
      const newMember: TeamMember = {
        id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        role: teamRoleDraft,
        email,
        phone: teamPhoneDraft.trim(),
        notes: teamNotesDraft.trim(),
        isActive: teamActiveDraft,
      };
      setTeamMembers((prev) => [newMember, ...prev]);
      logActivity("team_member_added", `Added team member: ${name}`);
      setTeamFormStatus({ kind: "success", message: `Added ${name} to the team.` });
      closeTeamMemberModal();
      return;
    }
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === teamEditingId
          ? {
              ...member,
              name,
              role: teamRoleDraft,
              email,
              phone: teamPhoneDraft.trim(),
              notes: teamNotesDraft.trim(),
              isActive: teamActiveDraft,
            }
          : member,
      ),
    );
    logActivity("team_member_added", `Updated team member: ${name}`);
    setTeamFormStatus({ kind: "success", message: `Saved updates for ${name}.` });
    closeTeamMemberModal();
  };

  const deleteTeamMember = (teamMemberId: string) => {
    const target = teamMembers.find((member) => member.id === teamMemberId);
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm(
            `Permanently delete "${target?.name || "this team member"}" from your workspace team? This does not delete events, but DJ assignments to this person are cleared.`,
          );
    if (!ok) return;
    setTeamMembers((prev) => prev.filter((member) => member.id !== teamMemberId));
    setEvents((prev) =>
      prev.map((evt) =>
        evt.settings.assignedDj === teamMemberId
          ? {
              ...evt,
              settings: {
                ...evt.settings,
                assignedDj: "",
              },
            }
          : evt,
      ),
    );
    setEventSettings((prev) =>
      prev.assignedDj === teamMemberId ? { ...prev, assignedDj: "" } : prev,
    );
    if (teamEditingId === teamMemberId) {
      closeTeamMemberModal();
    }
  };

  const isTeamMemberAssignedToActiveEvent = useCallback(
    (member: TeamMember) => {
      if (!activeEventId) return false;
      const settings = events.find((e) => e.id === activeEventId)?.settings;
      if (!settings) return false;
      const ad = settings.assignedDj?.trim() ?? "";
      if (member.role === "DJ" && (ad === member.id || ad === member.name)) return true;
      if (member.role === "Planner") {
        const pem = settings.plannerEmail?.trim().toLowerCase() ?? "";
        const pmail = member.email.trim().toLowerCase();
        if (pmail && pem && pmail === pem) return true;
        const pn = settings.plannerName?.trim() ?? "";
        const nm = member.name.trim();
        if (nm && pn && nm === pn) return true;
      }
      return false;
    },
    [activeEventId, events],
  );

  const removeTeamMemberFromActiveEvent = useCallback(
    (member: TeamMember) => {
      if (!canManageEvents || !activeEventId) return;
      const evt = events.find((e) => e.id === activeEventId);
      const settings = evt?.settings;
      if (!settings) return;

      const ad = settings.assignedDj?.trim() ?? "";
      const djMatch =
        member.role === "DJ" && (ad === member.id || ad === member.name);

      const pem = settings.plannerEmail?.trim().toLowerCase() ?? "";
      const pmail = member.email.trim().toLowerCase();
      const pn = settings.plannerName?.trim() ?? "";
      const nm = member.name.trim();
      const plannerMatch =
        member.role === "Planner" &&
        ((Boolean(pmail) && Boolean(pem) && pmail === pem) ||
          (Boolean(nm) && Boolean(pn) && nm === pn));

      if (!djMatch && !plannerMatch) return;

      if (
        typeof window !== "undefined" &&
        !window.confirm(
          `Remove "${member.name}" from this event only? They remain on your workspace team roster.`,
        )
      ) {
        return;
      }

      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== activeEventId) return e;
          let nextSettings = { ...e.settings };
          if (djMatch) {
            nextSettings = { ...nextSettings, assignedDj: "" };
          }
          if (plannerMatch) {
            nextSettings = { ...nextSettings, plannerName: "", plannerEmail: "" };
          }
          return { ...e, settings: nextSettings, lastUpdatedAt: Date.now() };
        }),
      );

      setEventSettings((prev) => {
        let next = { ...prev };
        const prevDj = prev.assignedDj?.trim() ?? "";
        if (djMatch && (prevDj === member.id || prevDj === member.name)) {
          next = { ...next, assignedDj: "" };
        }
        const prevPe = prev.plannerEmail?.trim().toLowerCase() ?? "";
        const prevPn = prev.plannerName?.trim() ?? "";
        if (
          plannerMatch &&
          ((pmail && prevPe === pmail) || (nm && prevPn === nm))
        ) {
          next = { ...next, plannerName: "", plannerEmail: "" };
        }
        return next;
      });

      logActivity(
        "team_member_removed_from_event",
        `Removed ${member.name} from event`,
      );
    },
    [activeEventId, canManageEvents, events, logActivity],
  );

  const clearAssignedDjFromActiveEvent = useCallback(() => {
    if (!canManageEvents || !activeEventId) return;
    const djVal = eventSettings.assignedDj?.trim() ?? "";
    if (!djVal) return;
    const label =
      teamMembers.find((m) => m.id === djVal || m.name === djVal)?.name || djVal;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Remove ${label} as assigned DJ for this event only? This does not remove anyone from your workspace team.`,
      )
    ) {
      return;
    }
    setEventSettings((prev) => ({ ...prev, assignedDj: "" }));
    setEvents((prev) =>
      prev.map((e) =>
        e.id === activeEventId
          ? {
              ...e,
              lastUpdatedAt: Date.now(),
              settings: { ...e.settings, assignedDj: "" },
            }
          : e,
      ),
    );
    logActivity(
      "team_member_removed_from_event",
      `Removed DJ assignment (${label}) from event`,
    );
  }, [
    activeEventId,
    canManageEvents,
    eventSettings.assignedDj,
    logActivity,
    teamMembers,
  ]);

  const resetVendorDraft = () => {
    setVendorEditingId(null);
    setVendorTypeDraft("Planner");
    setVendorCompanyDraft("");
    setVendorContactDraft("");
    setVendorEmailDraft("");
    setVendorPhoneDraft("");
    setVendorNotesDraft("");
    setVendorWebsiteDraft("");
    setVendorInstagramDraft("");
    setVendorArrivalDraft("");
    setVendorCoordinationDraft("");
    setVendorAffiliationDraft("event_partner");
  };

  const openAddVendorModal = () => {
    resetVendorDraft();
    setVendorStatus(null);
    setVendorModalOpen(true);
  };

  const openEditVendorModal = (vendor: Vendor) => {
    setVendorEditingId(vendor.id);
    setVendorTypeDraft(vendor.vendorType);
    setVendorCompanyDraft(vendor.companyName);
    setVendorContactDraft(vendor.contactName);
    setVendorEmailDraft(vendor.email);
    setVendorPhoneDraft(vendor.phone);
    setVendorNotesDraft(vendor.notes);
    setVendorWebsiteDraft(vendor.website);
    setVendorInstagramDraft(vendor.instagram);
    setVendorArrivalDraft(vendor.arrivalTime);
    setVendorCoordinationDraft(vendor.specialCoordinationNotes);
    setVendorAffiliationDraft(vendor.affiliation ?? "event_partner");
    setVendorStatus(null);
    setVendorModalOpen(true);
  };

  const closeVendorModal = () => {
    setVendorModalOpen(false);
    resetVendorDraft();
  };

  const syncVendorsToActiveEvent = (nextVendors: Vendor[]) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === activeEventId
          ? {
              ...evt,
              vendors: nextVendors,
            }
          : evt,
      ),
    );
  };

  const saveVendor = () => {
    const selectedVendorType = vendorTypeDraft?.trim() as VendorType;
    const companyName = vendorCompanyDraft.trim();
    if (!selectedVendorType) {
      setVendorStatus({ kind: "error", message: "Vendor Type is required." });
      return;
    }
    if (!companyName) {
      setVendorStatus({ kind: "error", message: "Company Name is required." });
      return;
    }
    const payload: Vendor = {
      id: vendorEditingId || `vendor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      vendorType: selectedVendorType,
      companyName,
      contactName: vendorContactDraft.trim(),
      email: vendorEmailDraft.trim(),
      phone: vendorPhoneDraft.trim(),
      notes: vendorNotesDraft.trim(),
      website: vendorWebsiteDraft.trim(),
      instagram: vendorInstagramDraft.trim(),
      arrivalTime: vendorArrivalDraft.trim(),
      specialCoordinationNotes: vendorCoordinationDraft.trim(),
      affiliation: vendorAffiliationDraft,
    };
    if (!vendorEditingId) {
      const nextVendors = [payload, ...vendors];
      setVendors(nextVendors);
      syncVendorsToActiveEvent(nextVendors);
      logActivity("vendor_updated", `Added vendor: ${payload.companyName}`);
      setVendorStatus({ kind: "success", message: `Added ${payload.companyName}.` });
      closeVendorModal();
      return;
    }
    const nextVendors = vendors.map((item) => (item.id === vendorEditingId ? payload : item));
    setVendors(nextVendors);
    syncVendorsToActiveEvent(nextVendors);
    logActivity("vendor_updated", `Updated vendor: ${payload.companyName}`);
    setVendorStatus({ kind: "success", message: `Saved ${payload.companyName}.` });
    closeVendorModal();
  };

  const deleteVendor = (vendorId: string) => {
    const target = vendors.find((item) => item.id === vendorId);
    const ok = typeof window === "undefined" ? true : window.confirm(`Delete vendor "${target?.companyName || "this vendor"}"?`);
    if (!ok) return;
    const nextVendors = vendors.filter((item) => item.id !== vendorId);
    setVendors(nextVendors);
    syncVendorsToActiveEvent(nextVendors);
    logActivity("vendor_updated", `Removed vendor: ${target?.companyName || "Vendor"}`);
  };

  const copyVendorContactInfo = useCallback(async (vendor: Vendor) => {
    const text = formatVendorContactLines(vendor).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setVendorStatus({
        kind: "success",
        message: `Copied contact info for ${vendor.companyName || vendor.contactName || "contact"}.`,
      });
    } catch {
      setVendorStatus({ kind: "error", message: "Could not copy contact info." });
    }
  }, []);

  const workspaceNavItems: Screen[] = useMemo(() => {
    if (effectiveRole === "Admin") {
      return ["Command Center", "All Events", "Team", "Settings", "Notification Center"];
    }
    if (effectiveRole === "DJ") {
      return ["Command Center", "All Events", "Notification Center"];
    }
    if (effectiveRole === "Planner") {
      return ["All Events", "Notification Center"];
    }
    return ["All Events", "Notification Center"];
  }, [effectiveRole]);

  const eventNavItems: Screen[] = useMemo(() => {
    return buildEventNavItemsForRole(effectiveRole, {
      sectionCeremonyEnabled,
      sectionReceptionTimelineEnabled,
      sectionPlaylistsEnabled,
      sectionMustPlayEnabled,
      sectionDoNotPlayEnabled,
      sectionMcScriptEnabled,
      sectionVendorContactsEnabled,
      sectionMusicNotesEnabled,
      sectionGuestRequestsEnabled,
      sectionPlanningChecklistEnabled,
      sectionPlanningQuestionsEnabled,
    });
  }, [
    effectiveRole,
    sectionCeremonyEnabled,
    sectionDoNotPlayEnabled,
    sectionGuestRequestsEnabled,
    sectionMustPlayEnabled,
    sectionMcScriptEnabled,
    sectionMusicNotesEnabled,
    sectionPlanningChecklistEnabled,
    sectionPlanningQuestionsEnabled,
    sectionPlaylistsEnabled,
    sectionReceptionTimelineEnabled,
    sectionVendorContactsEnabled,
  ]);

  const coupleTimelineEntryScreen = useMemo((): Screen | null => {
    if (receptionHubEligibleNav) return "Reception Hub";
    if (sectionReceptionTimelineEnabled) return "Timeline";
    return null;
  }, [receptionHubEligibleNav, sectionReceptionTimelineEnabled]);

  const coupleGuidedNextScreen = useMemo((): Screen => {
    const answers = eventSettings.planningQuestionAnswers ?? {};
    const unansweredPlanningQuestionCount = planningQuestionsForEvent.filter(
      (q) => !answers[q.id]?.trim(),
    ).length;
    const pendingGuestCount = guestRequests.filter((r) => r.status === "Pending").length;
    const hasUserPlaylistLines = PLAYLIST_BUCKET_IDS.some(
      (id) => (playlistVibeOverrides[id]?.length ?? 0) > 0,
    );

    const mergedChecklist = checklistTasks.map((task) => {
      const manualStatus = eventSettings.checklistManualStatuses?.[task.id];
      const status = manualStatus ?? task.autoStatus;
      return { ...task, status };
    });

    if (!hasEventDetailsComplete) return "Event Settings";
    if (sectionCeremonyEnabled && !hasKeyCeremonySongs) return "Ceremony";

    if (sectionReceptionTimelineEnabled && (!hasKeyTimelineMoments || !hasKeyFormalDanceSongs)) {
      return receptionHubEligibleNav ? "Reception Timeline" : "Timeline";
    }

    if (sectionMustPlayEnabled && mustPlaySongs.length === 0) return "Music Hub";
    if (sectionDoNotPlayEnabled && doNotPlaySongs.length === 0) return "Music Hub";
    if (sectionPlaylistsEnabled && !hasUserPlaylistLines) return "Music Hub";

    if (sectionPlanningQuestionsEnabled && unansweredPlanningQuestionCount > 0) {
      return "Planning Questions";
    }
    if (sectionGuestRequestsEnabled && pendingGuestCount > 0) return "Guest Requests";

    const nextIncomplete = mergedChecklist.find((t) => t.status !== "Complete");
    if (nextIncomplete) return nextIncomplete.linkedSection;

    if (sectionPlanningChecklistEnabled) return "Planning Checklist";
    return eventNavItems.includes("Event Prep") ? "Event Prep" : "Music Hub";
  }, [
    checklistTasks,
    eventSettings.checklistManualStatuses,
    eventSettings.planningQuestionAnswers,
    eventNavItems,
    guestRequests,
    hasEventDetailsComplete,
    hasKeyCeremonySongs,
    hasKeyFormalDanceSongs,
    hasKeyTimelineMoments,
    mustPlaySongs.length,
    doNotPlaySongs.length,
    playlistVibeOverrides,
    planningQuestionsForEvent,
    receptionHubEligibleNav,
    sectionCeremonyEnabled,
    sectionDoNotPlayEnabled,
    sectionGuestRequestsEnabled,
    sectionMustPlayEnabled,
    sectionPlanningChecklistEnabled,
    sectionPlanningQuestionsEnabled,
    sectionPlaylistsEnabled,
    sectionReceptionTimelineEnabled,
  ]);

  const coupleGuidedNextHint = useMemo(() => {
    const labels: Partial<Record<Screen, string>> = {
      "Event Settings": "Next: your names, date & venue",
      Ceremony: "Next: ceremony music",
      "Reception Timeline": "Next: reception flow",
      Timeline: "Next: timeline",
      "Music Hub": "Next: playlists & requests",
      "Planning Questions": "Next: your questionnaire",
      "Guest Requests": "Next: guest song ideas",
      "Planning Checklist": "Review your checklist",
      "Event Prep": "Next: your event document",
      Vendors: "Next: vendor contacts",
      Notes: "Next: notes",
    };
    return labels[coupleGuidedNextScreen] ?? "Continue your planning";
  }, [coupleGuidedNextScreen]);

  const coupleHomePlanningSections = useMemo(() => {
    type CoupleHomeSectionCard = {
      id: string;
      kicker: string;
      title: string;
      description: string;
      screen: Screen;
      completion: number;
      ctaLabel: string;
      pendingBadge?: string;
      completionStatusLabel?: "Not Started" | "In Progress" | "Complete";
    };
    const cards: CoupleHomeSectionCard[] = [];

    if (sectionCeremonyEnabled) {
      cards.push({
        id: "ceremony",
        kicker: "Ceremony",
        title: "Ceremony",
        description: "Processional moments, music, and ceremony flow.",
        screen: "Ceremony",
        completion: hasKeyCeremonySongs ? 100 : 38,
        ctaLabel: hasKeyCeremonySongs ? "Review" : "Continue",
      });
    }

    if (coupleTimelineEntryScreen) {
      let completion = 100;
      if (sectionReceptionTimelineEnabled) {
        completion = Math.round(
          (hasKeyTimelineMoments ? 50 : 0) + (hasKeyFormalDanceSongs ? 50 : 0),
        );
      }
      const needsWork = completion < 100;
      cards.push({
        id: "reception",
        kicker: "Main event",
        title: receptionHubEligibleNav ? "Reception & main event" : "Reception / main event",
        description: receptionHubEligibleNav
          ? "One timeline for flow, formal moments, and cues — what's next on the night."
          : "Shape the arc of your celebration.",
        screen: coupleTimelineEntryScreen,
        completion,
        ctaLabel: needsWork ? "Continue" : "Review",
      });
    }

    if (sectionMustPlayEnabled || sectionDoNotPlayEnabled || sectionPlaylistsEnabled) {
      const parts: number[] = [];
      if (sectionMustPlayEnabled) parts.push(mustPlaySongs.length > 0 ? 100 : 0);
      if (sectionDoNotPlayEnabled) parts.push(doNotPlaySongs.length > 0 ? 100 : 0);
      if (sectionPlaylistsEnabled) {
        const hasUserPlaylistLines = PLAYLIST_BUCKET_IDS.some(
          (id) => (playlistVibeOverrides[id]?.length ?? 0) > 0,
        );
        parts.push(hasUserPlaylistLines ? 100 : 0);
      }
      const completion = parts.length
        ? Math.round(parts.reduce((acc, n) => acc + n, 0) / parts.length)
        : 100;
      cards.push({
        id: "music",
        kicker: "Music",
        title: "Music hub",
        description: "Must-play, do-not-play, and playlists by moment.",
        screen: "Music Hub",
        completion,
        ctaLabel: completion >= 100 ? "Review" : "Continue",
      });
    }

    if (sectionVendorContactsEnabled) {
      const completion =
        vendors.length === 0 ? 28 : Math.min(100, 35 + Math.min(vendors.length, 5) * 13);
      cards.push({
        id: "vendors",
        kicker: "Partners",
        title: "Vendors",
        description: "Your creative partners and day-of contacts.",
        screen: "Vendors",
        completion,
        ctaLabel: vendors.length === 0 ? "Continue" : "Review",
      });
    }

    if (sectionGuestRequestsEnabled) {
      const pendingGuestCount = guestRequests.filter((r) => r.status === "Pending").length;
      const completion =
        pendingGuestCount > 0 ? 52 : guestRequests.length === 0 ? 72 : 100;
      cards.push({
        id: "guest-requests",
        kicker: "Guests",
        title: "Guest requests",
        description: "Song ideas and notes from the people you love.",
        screen: "Guest Requests",
        completion,
        ctaLabel: pendingGuestCount > 0 ? "Continue" : "Review",
        pendingBadge: pendingGuestCount > 0 ? `${pendingGuestCount} pending` : undefined,
      });
    }

    if (sectionPlanningQuestionsEnabled && planningQuestionsForEvent.length > 0) {
      const pqAnswers = eventSettings.planningQuestionAnswers ?? {};
      const pqHasAnswer = (qId: string) => Boolean(pqAnswers[qId]?.trim());
      const pqList = planningQuestionsForEvent;
      const answeredCount = pqList.filter((q) => pqHasAnswer(q.id)).length;
      const requiredQs = pqList.filter((q) => q.required);
      const requiredComplete =
        requiredQs.length > 0
          ? requiredQs.every((q) => pqHasAnswer(q.id))
          : pqList.every((q) => pqHasAnswer(q.id));
      let completionStatus: "Not Started" | "In Progress" | "Complete";
      let pqCta: string;
      if (answeredCount === 0) {
        completionStatus = "Not Started";
        pqCta = "Start Questions";
      } else if (!requiredComplete) {
        completionStatus = "In Progress";
        pqCta = "Continue Questions";
      } else {
        completionStatus = "Complete";
        pqCta = "Review / Edit Answers";
      }
      const pqPct =
        pqList.length === 0 ? 100 : Math.round((answeredCount / pqList.length) * 100);
      cards.push({
        id: "planning-questions",
        kicker: "Details",
        title: "Planning questions",
        description: "Thoughtful prompts for your event—answers stay with your plan and Event Document.",
        screen: "Planning Questions",
        completion: pqPct,
        ctaLabel: pqCta,
        completionStatusLabel: completionStatus,
      });
    }

    if (eventNavItems.includes("Event Prep")) {
      cards.push({
        id: "event-prep",
        kicker: "Live event",
        title: "Event document",
        description: "Live event mode and exports for your team.",
        screen: "Event Prep",
        completion: hasFinalDjNotes ? 100 : 48,
        ctaLabel: hasFinalDjNotes ? "Review" : "Continue",
      });
    }

    const clientHomeOrder = [
      "ceremony",
      "reception",
      "music",
      "planning-questions",
      "vendors",
      "event-prep",
      "guest-requests",
    ];
    return clientHomeOrder
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is (typeof cards)[number] => Boolean(c));
  }, [
    coupleTimelineEntryScreen,
    eventNavItems,
    eventSettings.planningQuestionAnswers,
    guestRequests,
    hasFinalDjNotes,
    hasKeyCeremonySongs,
    hasKeyFormalDanceSongs,
    hasKeyTimelineMoments,
    mustPlaySongs.length,
    doNotPlaySongs.length,
    playlistVibeOverrides,
    receptionHubEligibleNav,
    sectionCeremonyEnabled,
    sectionDoNotPlayEnabled,
    sectionGuestRequestsEnabled,
    sectionMustPlayEnabled,
    sectionPlanningQuestionsEnabled,
    sectionPlaylistsEnabled,
    sectionReceptionTimelineEnabled,
    sectionVendorContactsEnabled,
    vendors.length,
    planningQuestionsForEvent,
  ]);

  const coupleAttentionSummary = useMemo(() => {
    const answers = eventSettings.planningQuestionAnswers ?? {};
    const unansweredPlanningQuestionCount = planningQuestionsForEvent.filter(
      (q) => !answers[q.id]?.trim(),
    ).length;
    const pendingGuestCount = guestRequests.filter((r) => r.status === "Pending").length;
    return { unansweredPlanningQuestionCount, pendingGuestCount };
  }, [
    eventSettings.planningQuestionAnswers,
    guestRequests,
    planningQuestionsForEvent,
  ]);

  const primaryTimelineScreenForHome = useMemo((): Screen => {
    if (
      receptionHubEligibleNav &&
      sectionReceptionTimelineEnabled
    ) {
      return "Reception Timeline";
    }
    return "Timeline";
  }, [
    receptionHubEligibleNav,
    sectionReceptionTimelineEnabled,
  ]);

  const enabledSectionToggleCount = useMemo(
    () =>
      [
        sectionCeremonyEnabled,
        sectionReceptionTimelineEnabled,
        sectionPlaylistsEnabled,
        sectionMustPlayEnabled,
        sectionDoNotPlayEnabled,
        sectionMcScriptEnabled,
        sectionVendorContactsEnabled,
        sectionMusicNotesEnabled,
        sectionGuestRequestsEnabled,
        sectionPlanningChecklistEnabled,
        sectionPlanningQuestionsEnabled,
      ].filter(Boolean).length,
    [
      sectionCeremonyEnabled,
      sectionDoNotPlayEnabled,
      sectionGuestRequestsEnabled,
      sectionMcScriptEnabled,
      sectionMusicNotesEnabled,
      sectionMustPlayEnabled,
      sectionPlanningChecklistEnabled,
      sectionPlanningQuestionsEnabled,
      sectionPlaylistsEnabled,
      sectionReceptionTimelineEnabled,
      sectionVendorContactsEnabled,
    ],
  );

  type StaffHomeAction =
    | { kind: "screen"; screen: Screen; label: string }
    | { kind: "workspace"; label: string; section: GlobalSettingsSection };

  const staffHomeQuickActions = useMemo((): StaffHomeAction[] => {
    const hasScreen = (screen: Screen) => eventNavItems.includes(screen);
    const tl = primaryTimelineScreenForHome;

    const filterScreens = (items: StaffHomeAction[]) =>
      items.filter((item) => item.kind === "workspace" || hasScreen(item.screen));

    if (effectiveRole === "Planner") {
      return filterScreens([
        { kind: "screen", screen: tl, label: tl === "Reception Timeline" ? "Reception timeline" : "Timeline" },
        { kind: "screen", screen: "Vendors", label: "Vendor coordination" },
        { kind: "screen", screen: "Planning Questions", label: "Planning questions" },
        { kind: "screen", screen: "Planning Checklist", label: "Planning progress" },
        { kind: "screen", screen: "Notes", label: "Planning notes" },
        { kind: "screen", screen: "Event Settings", label: "Event logistics" },
      ]);
    }

    if (effectiveRole === "DJ") {
      return filterScreens([
        { kind: "screen", screen: "Event Prep", label: "Event Document" },
        { kind: "screen", screen: "Music Hub", label: "Music hub · must / DNP" },
        { kind: "screen", screen: tl, label: "Timeline" },
        { kind: "screen", screen: "Ceremony", label: "Ceremony cues" },
      ]);
    }

    if (effectiveRole === "Admin") {
      return filterScreens([
        { kind: "screen", screen: "Event Settings", label: "Event settings · sections" },
        { kind: "screen", screen: "Event Prep", label: "Event Document" },
        { kind: "screen", screen: tl, label: "Timeline" },
        { kind: "screen", screen: "Music Hub", label: "Music hub" },
        { kind: "workspace", label: "Timeline presets", section: "Timeline Presets" },
        { kind: "workspace", label: "Team management", section: "Team Management" },
      ]);
    }

    return [];
  }, [effectiveRole, eventNavItems, primaryTimelineScreenForHome]);

  const roleDashboardMetricCards = useMemo(() => {
    if (effectiveRole === "Couple") return [];
    const pctLabel = `${completionPercent}%`;
    const collaboratorCount = (activeEvent?.collaborators ?? []).length;

    if (effectiveRole === "Planner") {
      return [
        {
          label: "Planning progress",
          value: pctLabel,
          detail: "Weighted completion across your checklist for this event.",
        },
        {
          label: "Open planning questions",
          value: `${coupleAttentionSummary.unansweredPlanningQuestionCount}`,
          detail:
            coupleAttentionSummary.unansweredPlanningQuestionCount === 0
              ? "Questionnaire is fully answered."
              : "Answers still needed from the client or team.",
        },
        {
          label: "Vendor roster",
          value: `${vendors.length}`,
          detail: "Partners and contacts on file for coordination.",
        },
      ];
    }

    if (effectiveRole === "DJ") {
      const musicReady =
        (!sectionMustPlayEnabled || mustPlaySongs.length > 0) &&
        (!sectionDoNotPlayEnabled || doNotPlaySongs.length > 0);
      return [
        {
          label: "Music readiness",
          value: musicReady ? pctLabel : "In progress",
          detail: "Must-play & do-not-play coverage for show time.",
        },
        {
          label: "Timeline beats",
          value: `${timelineItems.length}`,
          detail: "Main-event timeline entries to execute against.",
        },
        {
          label: "MC script",
          value: mcAnnouncements.trim() ? "Drafted" : "Add cues",
          detail: "Announcements roll into your live event document.",
        },
      ];
    }

    if (effectiveRole === "Admin") {
      return [
        {
          label: "Overall completion",
          value: pctLabel,
          detail: "Holistic health score for this event’s planning areas.",
        },
        {
          label: "Sections enabled",
          value: `${enabledSectionToggleCount}`,
          detail: "Fine-grained modules turned on in Event Settings.",
        },
        {
          label: "Collaborators",
          value: `${collaboratorCount}`,
          detail: "Invites and roles attached to this event.",
        },
      ];
    }

    return [];
  }, [
    activeEvent?.collaborators,
    completionPercent,
    coupleAttentionSummary.unansweredPlanningQuestionCount,
    doNotPlaySongs.length,
    effectiveRole,
    enabledSectionToggleCount,
    mcAnnouncements,
    mustPlaySongs.length,
    sectionDoNotPlayEnabled,
    sectionMustPlayEnabled,
    timelineItems.length,
    vendors.length,
  ]);

  const prioritizedEventNavForDashboard = useMemo(() => {
    const items = eventNavItems.filter((s) => s !== "Dashboard");
    const tl = primaryTimelineScreenForHome;

    const rankFor = (screen: Screen): number => {
      let preferred: Screen[] = [];
      if (effectiveRole === "Planner") {
        preferred = [
          tl,
          "Vendors",
          "Planning Questions",
          "Planning Checklist",
          "Notes",
          "Event Settings",
          "Guest Requests",
          "Collaborators",
          "Ceremony",
          "Music Hub",
          "Music Import",
          "Event Prep",
        ];
      } else if (effectiveRole === "DJ") {
        preferred = [
          "Event Prep",
          "Music Hub",
          tl,
          "Ceremony",
          "Planning Checklist",
          "Guest Requests",
          "Collaborators",
          "Notes",
          "Music Import",
        ];
      } else if (effectiveRole === "Admin") {
        preferred = [
          "Event Settings",
          "Event Prep",
          "Music Hub",
          tl,
          "Collaborators",
          "Planning Questions",
          "Ceremony",
          "Vendors",
          "Guest Requests",
          "Planning Checklist",
          "Notes",
          "Music Import",
        ];
      } else {
        return items.findIndex((s) => s === screen);
      }
      const idx = preferred.findIndex((s) => s === screen);
      return idx === -1 ? 100 + items.findIndex((s) => s === screen) : idx;
    };

    return [...items].sort((a, b) => rankFor(a) - rankFor(b));
  }, [effectiveRole, eventNavItems, primaryTimelineScreenForHome]);

  const staffDashboardSectionTitles = useMemo(() => {
    if (effectiveRole === "Planner") {
      return {
        nextTasks: "Coordination priorities",
        milestones: "Timeline & milestone outlook",
        updates: "Latest updates on this event",
        assistant: "Coordination assistant",
        assistantHint:
          "Operational read on timeline, vendors, guests, and music—updates as sections change.",
        allSections: "All planning sections",
        insightsIntro: "Insights that match your lens",
      };
    }
    if (effectiveRole === "DJ") {
      return {
        nextTasks: "Execution checklist",
        milestones: "Show-time milestones",
        updates: "Latest updates on this event",
        assistant: "Performance assistant",
        assistantHint:
          "Music, timeline, ceremony, and guest-flow cues—built for live execution.",
        allSections: "Execution toolkit",
        insightsIntro: "Insights for show time",
      };
    }
    if (effectiveRole === "Admin") {
      return {
        nextTasks: "Recommended admin tasks",
        milestones: "Planning milestones",
        updates: "Latest updates on this event",
        assistant: "Administrator assistant",
        assistantHint:
          "Full-spectrum notes across timeline, music, ceremony, and guests.",
        allSections: "All sections & tools",
        insightsIntro: "Full-planning insights",
      };
    }
    return {
      nextTasks: "Next recommended tasks",
      milestones: "Upcoming planning milestones",
      updates: "Most recent updates",
      assistant: "Smart Planning Assistant",
      assistantHint:
        "A concise read on timing, music, ceremony, and guest flow — update any section to refresh.",
      allSections: "Planning Sections",
      insightsIntro: "Planning Insights",
    };
  }, [effectiveRole]);

  const currentNavItems = appMode === "events" ? workspaceNavItems : eventNavItems;

  const shellNavActiveScreen = useMemo((): Screen => {
    if (activeScreen === "Reception Timeline") {
      return "Reception Hub";
    }
    return activeScreen;
  }, [activeScreen]);

  const allowedActiveEventScreens = useMemo((): Screen[] => {
    if (appMode !== "event") return workspaceNavItems;
    const extras: Screen[] = [];
    if (receptionHubEligibleNav) {
      if (sectionReceptionTimelineEnabled) {
        extras.push("Reception Timeline");
      }
    }
    return [...eventNavItems, ...extras];
  }, [
    appMode,
    workspaceNavItems,
    eventNavItems,
    receptionHubEligibleNav,
    sectionReceptionTimelineEnabled,
  ]);

  const switchPerspectiveRole = useCallback(
    (nextRole: UserRole) => {
      commitActiveEventPlanningToEventsState();
      setCurrentRole(nextRole);
      setRolePreview(nextRole);

      const flags: EventNavSectionFlags = {
        sectionCeremonyEnabled,
        sectionReceptionTimelineEnabled,
        sectionPlaylistsEnabled,
        sectionMustPlayEnabled,
        sectionDoNotPlayEnabled,
        sectionMcScriptEnabled,
        sectionVendorContactsEnabled,
        sectionMusicNotesEnabled,
        sectionGuestRequestsEnabled,
        sectionPlanningChecklistEnabled,
        sectionPlanningQuestionsEnabled,
      };

      let candidate: Screen = activeScreen;

      if (activeScreen === "Reception Hub" && nextRole !== "Couple") {
        candidate = receptionHubEligibleNav ? "Reception Timeline" : "Timeline";
      } else if (activeScreen === "Event Settings" && nextRole === "DJ") {
        candidate = "Dashboard";
      }

      if (appMode === "event") {
        const eventNav = buildEventNavItemsForRole(nextRole, flags);
        const extras: Screen[] = [];
        if (receptionHubEligibleNav) {
          extras.push("Reception Timeline");
        }
        const allowed = [...eventNav, ...extras];
        const nextScreen = allowed.includes(candidate)
          ? candidate
          : eventNav.includes("Dashboard")
            ? "Dashboard"
            : (eventNav[0] ?? "Dashboard");
        setActiveScreen(nextScreen);
        return;
      }

      const wsNav = getWorkspaceNavItemsForRole(nextRole);
      const nextScreen = wsNav.includes(candidate)
        ? candidate
        : wsNav.includes("All Events")
          ? "All Events"
          : (wsNav[0] ?? "All Events");
      setActiveScreen(nextScreen);
    },
    [
      commitActiveEventPlanningToEventsState,
      sectionCeremonyEnabled,
      sectionReceptionTimelineEnabled,
      sectionPlaylistsEnabled,
      sectionMustPlayEnabled,
      sectionDoNotPlayEnabled,
      sectionMcScriptEnabled,
      sectionVendorContactsEnabled,
      sectionMusicNotesEnabled,
      sectionGuestRequestsEnabled,
      sectionPlanningChecklistEnabled,
      sectionPlanningQuestionsEnabled,
      activeScreen,
      appMode,
      receptionHubEligibleNav,
      setActiveScreen,
      setCurrentRole,
      setRolePreview,
    ],
  );

  const navLabel = (screen: Screen) => {
    if (screen === "Dashboard") return "Event Dashboard";
    if (screen === "Settings") return "Global Settings";
    if (screen === "Reception Hub") return "Reception & timeline";
    if (screen === "Reception Timeline") return "Reception timeline";
    if (screen === "Event Prep") return "Event Document";
    return screen;
  };

  const getTeamMemberName = (value: string) => {
    if (!value.trim()) return "TBD";
    return teamMembers.find((member) => member.id === value)?.name || value;
  };
  const activeDjTeamMembers = useMemo(
    () => teamMembers.filter((member) => member.role === "DJ" && member.isActive),
    [teamMembers],
  );

  const assignedPlannerTeamMemberForEvent = useMemo(() => {
    if (!activeEventId) return null;
    const pem = eventSettings.plannerEmail?.trim().toLowerCase();
    const pn = eventSettings.plannerName?.trim();
    if (!pem && !pn) return null;
    return (
      teamMembers.find(
        (m) =>
          m.role === "Planner" &&
          ((pem && m.email.trim().toLowerCase() === pem) ||
            (pn && m.name.trim() === pn)),
      ) ?? null
    );
  }, [activeEventId, eventSettings.plannerEmail, eventSettings.plannerName, teamMembers]);
  const cutmasterTeamVendors = useMemo(
    () => vendors.filter((v) => isCutmasterEventTeam(v)),
    [vendors],
  );
  const partnerVendors = useMemo(
    () => vendors.filter((v) => !isCutmasterEventTeam(v)),
    [vendors],
  );

  const EVENTS_STORAGE_KEY = "cutmaster_planning_events_v1";
  const GLOBAL_SETTINGS_STORAGE_KEY = "cutmaster_planning_global_settings_v1";
  const RUN_OF_SHOW_DONE_STORAGE_KEY = "cutmaster_run_of_show_done_v1";
  const RUN_OF_SHOW_SECTION_UI_STORAGE_KEY = "cutmaster_run_of_show_section_ui_v1";
  const RUN_OF_SHOW_ANNOTATIONS_STORAGE_KEY = "cutmaster_run_of_show_annotations_v1";

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
      const rawGlobal = window.localStorage.getItem(GLOBAL_SETTINGS_STORAGE_KEY);
      if (!raw) {
        if (rawGlobal) {
          const parsedGlobal = JSON.parse(rawGlobal) as Partial<AppSettings>;
          setAppSettings((prev) => ({ ...prev, ...parsedGlobal }));
        }
        window.setTimeout(() => setHasHydrated(true), 0);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<{
        events: EventRecord[];
        activeEventId: string;
        templates: TimelineTemplate[];
        teamMembers: TeamMember[];
        appSettings: AppSettings;
        activities: ActivityItem[];
        notifications: NotificationItem[];
        appState: LocalAppStateBackup;
      }>;
      const parsedGlobal = rawGlobal ? (JSON.parse(rawGlobal) as Partial<AppSettings>) : null;

      if (!Array.isArray(parsed.events)) {
        window.setTimeout(() => setHasHydrated(true), 0);
        return;
      }

      const loadedEvents = parsed.events.map((evt) => ({
        ...evt,
        lastUpdatedAt: typeof evt.lastUpdatedAt === "number" ? evt.lastUpdatedAt : Date.now(),
        ceremonyTimelineItems: buildCeremonyTimelineFromLegacyEvent(evt),
        collaborators: Array.isArray(evt.collaborators) ? evt.collaborators : [],
        vendors: Array.isArray(evt.vendors) ? evt.vendors : [],
        ceremonyGuestArrivalTime: evt.ceremonyGuestArrivalTime ?? "",
        settings: {
          eventLayoutProfile: migrateLegacyLayoutProfile(
            evt.settings?.eventLayoutProfile,
            evt.settings?.eventType ?? "",
          ),
          eventName: evt.settings?.eventName ?? evt.meta.couple ?? "",
          coupleNames: evt.settings?.coupleNames ?? evt.meta.couple ?? "",
          eventType: migrateLegacyLayoutProfile(
            evt.settings?.eventLayoutProfile ?? evt.settings?.eventType,
            evt.settings?.eventType ?? "",
          ),
          weddingDate: evt.settings?.weddingDate ?? evt.meta.date ?? "",
          venue: evt.settings?.venue ?? evt.meta.venue ?? "",
          ceremonyLocation: evt.settings?.ceremonyLocation ?? "",
          receptionLocation: evt.settings?.receptionLocation ?? "",
          eventStartTime: evt.settings?.eventStartTime ?? "",
          eventEndTime: evt.settings?.eventEndTime ?? "",
          assignedDj: evt.settings?.assignedDj ?? "",
          plannerName: evt.settings?.plannerName ?? "",
          plannerEmail: evt.settings?.plannerEmail ?? "",
          packageName: evt.settings?.packageName ?? "",
          internalNotes: evt.settings?.internalNotes ?? "",
          clientFacingNotes: evt.settings?.clientFacingNotes ?? "",
          prepSheetFooterOverride: evt.settings?.prepSheetFooterOverride ?? "",
          guestRequestMessageOverride: evt.settings?.guestRequestMessageOverride ?? "",
          coupleWelcomeMessageOverride: evt.settings?.coupleWelcomeMessageOverride ?? "",
          liveEventShowMusicNotes: evt.settings?.liveEventShowMusicNotes ?? true,
          liveEventShowDoNotPlay: evt.settings?.liveEventShowDoNotPlay ?? true,
          liveEventShowVendorContacts: evt.settings?.liveEventShowVendorContacts ?? true,
          liveEventShowMcScript: evt.settings?.liveEventShowMcScript ?? true,
          liveEventShowPlaylists: evt.settings?.liveEventShowPlaylists ?? true,
          liveEventShowPlanningQuestions: evt.settings?.liveEventShowPlanningQuestions ?? true,
          liveEventShowGuestRequests:
            typeof evt.settings?.liveEventShowGuestRequests === "boolean"
              ? evt.settings.liveEventShowGuestRequests
              : getLiveEventDocumentDefaults(
                  (evt.settings?.eventLayoutProfile as EventLayoutProfile) ?? "Wedding",
                ).liveEventShowGuestRequests,
          liveEventCompactMode: evt.settings?.liveEventCompactMode ?? false,
          liveEventLargePrintMode: evt.settings?.liveEventLargePrintMode ?? false,
          sectionCeremonyEnabled: evt.settings?.sectionCeremonyEnabled ?? true,
          sectionReceptionTimelineEnabled: evt.settings?.sectionReceptionTimelineEnabled ?? true,
          sectionPlaylistsEnabled: evt.settings?.sectionPlaylistsEnabled ?? true,
          sectionMustPlayEnabled: evt.settings?.sectionMustPlayEnabled ?? true,
          sectionDoNotPlayEnabled: evt.settings?.sectionDoNotPlayEnabled ?? true,
          sectionMcScriptEnabled: evt.settings?.sectionMcScriptEnabled ?? true,
          sectionVendorContactsEnabled: evt.settings?.sectionVendorContactsEnabled ?? true,
          sectionMusicNotesEnabled: evt.settings?.sectionMusicNotesEnabled ?? true,
          sectionGuestRequestsEnabled: evt.settings?.sectionGuestRequestsEnabled ?? true,
          sectionFormalitiesEnabled: false,
          sectionPlanningChecklistEnabled: evt.settings?.sectionPlanningChecklistEnabled ?? true,
          sectionPlanningQuestionsEnabled: evt.settings?.sectionPlanningQuestionsEnabled ?? true,
          planningQuestionAnswers: evt.settings?.planningQuestionAnswers ?? {},
          checklistDueDates: evt.settings?.checklistDueDates ?? {},
          checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
          coverPhotoDataUrl: evt.settings?.coverPhotoDataUrl,
          eventLifecycleStatus: evt.settings?.eventLifecycleStatus ?? "active",
        },
      }));
      const migratedEvents = loadedEvents.map((evt) =>
        normalizeEventRecordAfterFormalitiesMerge(evt as EventRecord),
      );
      setEvents(migratedEvents);
      setAppMode(migratedEvents.length > 0 ? "event" : "events");
      if (Array.isArray(parsed.templates)) {
        setTemplates(
          parsed.templates.map((tpl) => ({
            ...tpl,
            timelineItems: migrateFormalitiesIntoTimelineItems(
              tpl.timelineItems ?? [],
              tpl.formalities ?? [],
            ),
            formalities: [],
          })),
        );
      }
      if (Array.isArray(parsed.teamMembers)) setTeamMembers(parsed.teamMembers);
      if (Array.isArray(parsed.activities)) setActivities(parsed.activities);
      if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
      if (parsed.appState) {
        setAppMode(parsed.appState.appMode === "event" ? "event" : "events");
        setAuthStage(
          parsed.appState.authStage === "login" ||
            parsed.appState.authStage === "invite" ||
            parsed.appState.authStage === "app"
            ? parsed.appState.authStage
            : "app",
        );
        setCurrentRole(isValidUserRole(parsed.appState.currentRole) ? parsed.appState.currentRole : null);
        setRolePreview(isValidUserRole(parsed.appState.rolePreview) ? parsed.appState.rolePreview : "Admin");
        setGuestRequestView(parsed.appState.guestRequestView === "guest" ? "guest" : "admin");
        setInviteAccessPreview(parsed.appState.inviteAccessPreview ?? null);
        setActiveScreen(migrateLegacyScreenId(parsed.appState.activeScreen ?? "Dashboard"));
      }
      const mergedGlobal = parsedGlobal ?? parsed.appSettings;
      if (mergedGlobal) setAppSettings((prev) => ({ ...prev, ...mergedGlobal }));

      const nextActiveId =
        parsed.activeEventId || (migratedEvents[0] ? migratedEvents[0].id : "");
      if (nextActiveId) setActiveEventId(nextActiveId);

      const active = nextActiveId
        ? migratedEvents.find((e) => e.id === nextActiveId) ?? migratedEvents[0]
        : undefined;

      if (active) {
        loadEventPlanningIntoWorkingState(active);
      }

      if (persistPhaseHideTimeoutRef.current) {
        window.clearTimeout(persistPhaseHideTimeoutRef.current);
        persistPhaseHideTimeoutRef.current = null;
      }
      setPersistPhase("idle");
      setPersistBaseline(false);
      persistUiSuppressBootCountRef.current = 1;
      window.setTimeout(() => setHasHydrated(true), 0);
    } catch {
      persistUiSuppressBootCountRef.current = 1;
      window.setTimeout(() => setHasHydrated(true), 0);
    }
  }, [
    setAppSettings,
    setHasHydrated,
    setPersistPhase,
    setPersistBaseline,
    setActiveScreen,
    setAuthStage,
    setCurrentRole,
    setInviteAccessPreview,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hasHydrated) return;
    if (typeof window === "undefined") return;

    const payloadEvents = events.map((e) =>
      e.id === activeEventId
        ? {
            ...e,
            timelineItems,
            ceremonyTimelineItems,
            formalities: [],
            mustPlaySongs,
            doNotPlaySongs,
            ceremonyStartTime,
            ceremonyGuestArrivalTime,
            officiantName,
            ceremonyNotes,
            microphoneNeeds,
            weddingPartyProcessional,
            brideGroomProcessional,
            unityCeremonySong,
            recessionalSong,
            plannerNotes,
            vendors,
            guestRequests,
            generalDjNotes,
            playlistVibeOverrides,
            musicVibeDetail,
            mcAnnouncements,
            settings: eventSettings,
          }
        : e,
    );

    const payload = {
      events: payloadEvents,
      activeEventId,
      templates,
      teamMembers,
      activities,
      notifications,
      appState: {
        activeScreen,
        appMode,
        authStage,
        currentRole,
        rolePreview,
        guestRequestView,
        inviteAccessPreview,
      },
    };

    const showPersistUi = persistUiSuppressBootCountRef.current <= 0;
    if (showPersistUi) {
      setPersistPhase("pending");
    }

    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(payload));
        window.localStorage.setItem(
          GLOBAL_SETTINGS_STORAGE_KEY,
          JSON.stringify(appSettings),
        );
        setPersistBaseline(true);
        if (persistUiSuppressBootCountRef.current > 0) {
          persistUiSuppressBootCountRef.current -= 1;
        } else {
          setPersistPhase("saved");
          if (persistPhaseHideTimeoutRef.current) {
            window.clearTimeout(persistPhaseHideTimeoutRef.current);
          }
          persistPhaseHideTimeoutRef.current = window.setTimeout(() => {
            setPersistPhase("idle");
            persistPhaseHideTimeoutRef.current = null;
          }, 2400);
        }
      } catch {
        if (persistUiSuppressBootCountRef.current > 0) {
          persistUiSuppressBootCountRef.current -= 1;
        }
        setPersistPhase("idle");
      }
    }, 450);

    return () => window.clearTimeout(t);
  }, [
    hasHydrated,
    events,
    activeEventId,
    templates,
    teamMembers,
    activities,
    notifications,
    activeScreen,
    appMode,
    authStage,
    currentRole,
    rolePreview,
    guestRequestView,
    inviteAccessPreview,
    timelineItems,
    ceremonyTimelineItems,
    mustPlaySongs,
    doNotPlaySongs,
    ceremonyStartTime,
    ceremonyGuestArrivalTime,
    officiantName,
    ceremonyNotes,
    microphoneNeeds,
    weddingPartyProcessional,
    brideGroomProcessional,
    unityCeremonySong,
    recessionalSong,
    plannerNotes,
    vendors,
    guestRequests,
    generalDjNotes,
    playlistVibeOverrides,
    musicVibeDetail,
    mcAnnouncements,
    eventSettings,
    appSettings,
    setPersistPhase,
    setPersistBaseline,
  ]);

  useEffect(() => {
    if (appMode !== "events") return;
    if (activeScreen !== "Settings") return;
    if (canManageEvents) return;
    setActiveScreen("All Events");
  }, [activeScreen, appMode, canManageEvents, setActiveScreen]);

  useEffect(() => {
    if (authStage !== "app") return;
    if (appMode === "events") {
      if (!workspaceNavItems.includes(activeScreen)) {
        window.setTimeout(() => setActiveScreen("All Events"), 0);
      }
      return;
    }
    if (!allowedActiveEventScreens.includes(activeScreen)) {
      window.setTimeout(() => setActiveScreen("Dashboard"), 0);
    }
  }, [activeScreen, appMode, authStage, allowedActiveEventScreens, setActiveScreen, workspaceNavItems]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (typeof window === "undefined") return;
    if (hasParsedInviteParams.current) return;
    hasParsedInviteParams.current = true;

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    const roleParam = params.get("role");
    const token = params.get("token");

    if (!eventId || !roleParam || !token) return;

    const normalizedRole = roleParam.trim();
    const validRoles: UserRole[] = ["Admin", "DJ", "Couple", "Planner"];
    if (!validRoles.includes(normalizedRole as UserRole)) return;

    const role = normalizedRole as UserRole;
    const inviteLink = `${window.location.origin}${window.location.pathname}?event=${encodeURIComponent(
      eventId,
    )}&role=${encodeURIComponent(role)}&token=${encodeURIComponent(token)}`;

    const cleanedUrl = new URL(window.location.href);
    cleanedUrl.searchParams.delete("event");
    cleanedUrl.searchParams.delete("role");
    cleanedUrl.searchParams.delete("token");
    window.history.replaceState({}, "", `${cleanedUrl.pathname}${cleanedUrl.search}${cleanedUrl.hash}`);

    window.setTimeout(() => {
      setInviteAccessPreview({
        eventId,
        role,
        token,
        link: inviteLink,
      });
      setAuthStage("invite");
    }, 0);
  }, [hasHydrated, setAuthStage, setInviteAccessPreview]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (activeScreen !== "Notification Center") return;
    window.setTimeout(() => {
      setActivities((prev) => prev.map((item) => ({ ...item, unread: false })));
      setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    }, 0);
  }, [activeScreen, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    const pendingCount = guestRequests.filter((request) => request.status === "Pending").length;
    if (pendingCount >= 3) {
      window.setTimeout(() => {
        pushNotification(`${pendingCount} guest requests pending`, "system");
      }, 0);
    }
    if (!hasKeyFormalDanceSongs) {
      window.setTimeout(() => {
        pushNotification("Formal dances incomplete", "system");
      }, 0);
    }
  }, [guestRequests, hasHydrated, hasKeyFormalDanceSongs, pushNotification]);

  const completedChecklistIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (!hasHydrated) return;
    const nowCompleted = planningChecklist
      .filter((item) => item.status === "Complete")
      .map((item) => item.id);
    const newlyCompleted = nowCompleted.filter(
      (id) => !completedChecklistIdsRef.current.includes(id),
    );
    newlyCompleted.forEach((id) => {
      const task = planningChecklist.find((item) => item.id === id);
      if (task) {
        window.setTimeout(() => {
          logActivity("checklist_completed", `${task.title} marked complete`);
        }, 0);
      }
    });
    completedChecklistIdsRef.current = nowCompleted;
  }, [hasHydrated, logActivity, planningChecklist]);

  const ceremonySnapshotRef = useRef("");
  useEffect(() => {
    if (!hasHydrated) return;
    const snapshot = [
      ceremonyStartTime,
      ceremonyGuestArrivalTime,
      officiantName,
      microphoneNeeds,
      ceremonyNotes,
      JSON.stringify(ceremonyTimelineItems),
    ].join("|");
    if (!ceremonySnapshotRef.current) {
      ceremonySnapshotRef.current = snapshot;
      return;
    }
    if (ceremonySnapshotRef.current !== snapshot) {
      ceremonySnapshotRef.current = snapshot;
      window.setTimeout(() => {
        logActivity("ceremony_updated", "Updated ceremony details");
      }, 0);
    }
  }, [
    hasHydrated,
    ceremonyStartTime,
    ceremonyGuestArrivalTime,
    officiantName,
    logActivity,
    microphoneNeeds,
    ceremonyNotes,
    ceremonyTimelineItems,
  ]);

  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  const handleResetDemoData = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Reset demo data?\n\nThis clears all locally saved prototype changes on this device.",
    );
    if (!ok) return;
    try {
      window.localStorage.removeItem(EVENTS_STORAGE_KEY);
      window.localStorage.removeItem(GLOBAL_SETTINGS_STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const currentEventsPayload = useMemo(
    () =>
      events.map((e) =>
        e.id === activeEventId
          ? {
              ...e,
              timelineItems,
              ceremonyTimelineItems,
              formalities: [],
              mustPlaySongs,
              doNotPlaySongs,
              ceremonyStartTime,
              ceremonyGuestArrivalTime,
              officiantName,
              ceremonyNotes,
              microphoneNeeds,
              weddingPartyProcessional,
              brideGroomProcessional,
              unityCeremonySong,
              recessionalSong,
              plannerNotes,
              guestRequests,
              generalDjNotes,
              playlistVibeOverrides,
              musicVibeDetail,
              mcAnnouncements,
              settings: eventSettings,
            }
          : e,
      ),
    [
      events,
      activeEventId,
      timelineItems,
      ceremonyTimelineItems,
      mustPlaySongs,
      doNotPlaySongs,
      ceremonyStartTime,
      ceremonyGuestArrivalTime,
      officiantName,
      ceremonyNotes,
      microphoneNeeds,
      weddingPartyProcessional,
      brideGroomProcessional,
      unityCeremonySong,
      recessionalSong,
      plannerNotes,
      guestRequests,
      generalDjNotes,
      playlistVibeOverrides,
      musicVibeDetail,
      mcAnnouncements,
      eventSettings,
    ],
  );

  const localAppStateBackup = useMemo(
    (): LocalAppStateBackup => ({
      activeScreen,
      appMode,
      authStage,
      currentRole,
      rolePreview,
      guestRequestView,
      inviteAccessPreview,
    }),
    [
      activeScreen,
      appMode,
      authStage,
      currentRole,
      rolePreview,
      guestRequestView,
      inviteAccessPreview,
    ],
  );

  function isValidUserRole(value: unknown): value is UserRole {
    return value === "Admin" || value === "DJ" || value === "Couple" || value === "Planner";
  }

  function isBackupPayload(value: unknown): value is BackupPayload {
    if (!value || typeof value !== "object") return false;
    const data = value as Partial<BackupPayload>;
    if (!Array.isArray(data.events)) return false;
    if (typeof data.activeEventId !== "string") return false;
    if (!Array.isArray(data.templates)) return false;
    if (!Array.isArray(data.teamMembers)) return false;
    if (!Array.isArray(data.activities)) return false;
    if (!Array.isArray(data.notifications)) return false;
    if (!data.appSettings || typeof data.appSettings !== "object") return false;
    const settings = data.appSettings as Partial<AppSettings>;
    if (typeof settings.companyName !== "string" || typeof settings.appName !== "string") return false;
    if (!data.appState || typeof data.appState !== "object") return false;
    return true;
  }

  const exportBackupJson = () => {
    if (typeof window === "undefined") return;
    try {
      const payload: BackupPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        events: currentEventsPayload,
        activeEventId,
        appSettings,
        templates,
        teamMembers,
        activities,
        notifications,
        appState: localAppStateBackup,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      anchor.href = url;
      anchor.download = `cutmaster-planning-backup-${stamp}.json`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      setBackupStatus({ kind: "success", message: "Backup exported successfully." });
    } catch {
      setBackupStatus({ kind: "error", message: "Failed to export backup JSON." });
    }
  };

  const triggerBackupFilePicker = () => {
    backupFileInputRef.current?.click();
  };

  const applyImportedBackup = (payload: BackupPayload) => {
    const normalizedEvents = payload.events.map((evt) => ({
      ...evt,
      lastUpdatedAt: typeof evt.lastUpdatedAt === "number" ? evt.lastUpdatedAt : Date.now(),
      collaborators: Array.isArray(evt.collaborators) ? evt.collaborators : [],
      settings: {
        eventLayoutProfile: migrateLegacyLayoutProfile(
          evt.settings?.eventLayoutProfile,
          evt.settings?.eventType ?? "",
        ),
        eventName: evt.settings?.eventName ?? evt.meta?.couple ?? "",
        coupleNames: evt.settings?.coupleNames ?? evt.meta?.couple ?? "",
        eventType: migrateLegacyLayoutProfile(
          evt.settings?.eventLayoutProfile ?? evt.settings?.eventType,
          evt.settings?.eventType ?? "",
        ),
        weddingDate: evt.settings?.weddingDate ?? evt.meta?.date ?? "",
        venue: evt.settings?.venue ?? evt.meta?.venue ?? "",
        ceremonyLocation: evt.settings?.ceremonyLocation ?? "",
        receptionLocation: evt.settings?.receptionLocation ?? "",
        eventStartTime: evt.settings?.eventStartTime ?? "",
        eventEndTime: evt.settings?.eventEndTime ?? "",
        assignedDj: evt.settings?.assignedDj ?? "",
        plannerName: evt.settings?.plannerName ?? "",
        plannerEmail: evt.settings?.plannerEmail ?? "",
        packageName: evt.settings?.packageName ?? "",
        internalNotes: evt.settings?.internalNotes ?? "",
        clientFacingNotes: evt.settings?.clientFacingNotes ?? "",
        prepSheetFooterOverride: evt.settings?.prepSheetFooterOverride ?? "",
        guestRequestMessageOverride: evt.settings?.guestRequestMessageOverride ?? "",
        coupleWelcomeMessageOverride: evt.settings?.coupleWelcomeMessageOverride ?? "",
        liveEventShowMusicNotes: evt.settings?.liveEventShowMusicNotes ?? true,
        liveEventShowDoNotPlay: evt.settings?.liveEventShowDoNotPlay ?? true,
        liveEventShowVendorContacts: evt.settings?.liveEventShowVendorContacts ?? true,
        liveEventShowMcScript: evt.settings?.liveEventShowMcScript ?? true,
        liveEventShowPlaylists: evt.settings?.liveEventShowPlaylists ?? true,
        liveEventShowPlanningQuestions: evt.settings?.liveEventShowPlanningQuestions ?? true,
        liveEventShowGuestRequests:
          typeof evt.settings?.liveEventShowGuestRequests === "boolean"
            ? evt.settings.liveEventShowGuestRequests
            : getLiveEventDocumentDefaults(
                (evt.settings?.eventLayoutProfile as EventLayoutProfile) ?? "Wedding",
              ).liveEventShowGuestRequests,
        liveEventCompactMode: evt.settings?.liveEventCompactMode ?? false,
        liveEventLargePrintMode: evt.settings?.liveEventLargePrintMode ?? false,
        sectionCeremonyEnabled: evt.settings?.sectionCeremonyEnabled ?? true,
        sectionReceptionTimelineEnabled: evt.settings?.sectionReceptionTimelineEnabled ?? true,
        sectionPlaylistsEnabled: evt.settings?.sectionPlaylistsEnabled ?? true,
        sectionMustPlayEnabled: evt.settings?.sectionMustPlayEnabled ?? true,
        sectionDoNotPlayEnabled: evt.settings?.sectionDoNotPlayEnabled ?? true,
        sectionMcScriptEnabled: evt.settings?.sectionMcScriptEnabled ?? true,
        sectionVendorContactsEnabled: evt.settings?.sectionVendorContactsEnabled ?? true,
        sectionMusicNotesEnabled: evt.settings?.sectionMusicNotesEnabled ?? true,
        sectionGuestRequestsEnabled: evt.settings?.sectionGuestRequestsEnabled ?? true,
        sectionFormalitiesEnabled: false,
        sectionPlanningChecklistEnabled: evt.settings?.sectionPlanningChecklistEnabled ?? true,
        sectionPlanningQuestionsEnabled: evt.settings?.sectionPlanningQuestionsEnabled ?? true,
        planningQuestionAnswers: evt.settings?.planningQuestionAnswers ?? {},
        checklistDueDates: evt.settings?.checklistDueDates ?? {},
        checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
        coverPhotoDataUrl: evt.settings?.coverPhotoDataUrl,
        eventLifecycleStatus: evt.settings?.eventLifecycleStatus ?? "active",
      },
    }));
    const mergedBackupEvents = normalizedEvents.map((evt) =>
      normalizeEventRecordAfterFormalitiesMerge(evt as EventRecord),
    );
    if (mergedBackupEvents.length === 0) {
      setBackupStatus({ kind: "error", message: "Backup has no events to restore." });
      return;
    }
    const nextActiveId = mergedBackupEvents.some((evt) => evt.id === payload.activeEventId)
      ? payload.activeEventId
      : mergedBackupEvents[0].id;
    const nextActiveEvent =
      mergedBackupEvents.find((evt) => evt.id === nextActiveId) ?? mergedBackupEvents[0];

    setEvents(mergedBackupEvents);
    setActiveEventId(nextActiveId);
    loadEventPlanningIntoWorkingState(nextActiveEvent);
    setTemplates(
      Array.isArray(payload.templates)
        ? payload.templates.map((tpl) => ({
            ...tpl,
            timelineItems: migrateFormalitiesIntoTimelineItems(
              tpl.timelineItems ?? [],
              tpl.formalities ?? [],
            ),
            formalities: [],
          }))
        : [],
    );
    setTeamMembers(Array.isArray(payload.teamMembers) ? payload.teamMembers : []);
    setActivities(Array.isArray(payload.activities) ? payload.activities : []);
    setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
    setAppSettings({ ...defaultAppSettings, ...payload.appSettings });

    const backupAppState = payload.appState;
    setAppMode(backupAppState.appMode === "events" || backupAppState.appMode === "event" ? backupAppState.appMode : "events");
    setAuthStage(
      backupAppState.authStage === "login" ||
        backupAppState.authStage === "invite" ||
        backupAppState.authStage === "app"
        ? backupAppState.authStage
        : "app",
    );
    setCurrentRole(isValidUserRole(backupAppState.currentRole) ? backupAppState.currentRole : null);
    setRolePreview(isValidUserRole(backupAppState.rolePreview) ? backupAppState.rolePreview : "Admin");
    setGuestRequestView(backupAppState.guestRequestView === "guest" ? "guest" : "admin");
    setInviteAccessPreview(backupAppState.inviteAccessPreview ?? null);
    setActiveScreen(migrateLegacyScreenId(backupAppState.activeScreen ?? "Dashboard"));
  };

  const importBackupJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const content = await file.text();
      const parsed: unknown = JSON.parse(content);
      if (!isBackupPayload(parsed)) {
        setBackupStatus({ kind: "error", message: "Invalid backup file format." });
        return;
      }
      if (typeof window !== "undefined") {
        const ok = window.confirm(
          "Replace current local data with this backup?\n\nThis will overwrite events, templates, settings, and activity history on this device.",
        );
        if (!ok) return;
      }
      applyImportedBackup(parsed);
      if (typeof window !== "undefined") {
        const eventsStoragePayload = {
          events: parsed.events,
          activeEventId: parsed.activeEventId,
          templates: parsed.templates,
          teamMembers: parsed.teamMembers,
          activities: parsed.activities,
          notifications: parsed.notifications,
          appState: parsed.appState,
        };
        window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsStoragePayload));
        window.localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(parsed.appSettings));
      }
      setBackupStatus({ kind: "success", message: "Backup restored successfully." });
    } catch {
      setBackupStatus({ kind: "error", message: "Could not import backup JSON." });
    }
  };

  const addSong = () => {
    const cleanedTitle = newSongTitle.trim();
    if (!cleanedTitle) return;

    const newEntry: SongEntry = {
      id: `${newSongListType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanedTitle,
      artist: newSongArtist.trim() || undefined,
      notes: newSongNotes.trim() || undefined,
      highPriority: newSongHighPriority,
    };

    if (newSongListType === "mustPlay") {
      setMustPlaySongs((prev) => [newEntry, ...prev]);
    } else {
      setDoNotPlaySongs((prev) => [newEntry, ...prev]);
    }
    logActivity("song_added", `Added song: ${cleanedTitle}`);

    setNewSongTitle("");
    setNewSongArtist("");
    setNewSongNotes("");
    setNewSongHighPriority(false);
  };

  const runAutoCategorization = useCallback((songs: ImportedPlaylistSong[]) => {
    const cocktail: string[] = [];
    const dinner: string[] = [];
    const openDancing: string[] = [];
    songs.forEach((song) => {
      const label = `${song.title} - ${song.artist}`;
      if (song.vibe === "chill") cocktail.push(label);
      if (song.vibe === "romantic") dinner.push(label);
      if (song.vibe === "dance") openDancing.push(label);
    });
    setImportCocktailSuggestions(cocktail);
    setImportDinnerSuggestions(dinner);
    setImportOpenDancingSuggestions(openDancing);
  }, []);

  const handleImportPlaylist = () => {
    if (!playlistUrlInput.trim()) return;
    const mockSongs: ImportedPlaylistSong[] = [
      { title: "Best Part", artist: "H.E.R. ft. Daniel Caesar", vibe: "chill" },
      { title: "Adore You", artist: "Harry Styles", vibe: "romantic" },
      { title: "Levitating", artist: "Dua Lipa", vibe: "dance" },
      { title: "Golden Hour", artist: "JVKE", vibe: "romantic" },
      { title: "Electric Feel", artist: "MGMT", vibe: "dance" },
      { title: "Put Your Records On", artist: "Corinne Bailey Rae", vibe: "chill" },
    ];
    setMusicImportStage("analyzing");
    setImportedPlaylistSongs([]);
    setImportCocktailSuggestions([]);
    setImportDinnerSuggestions([]);
    setImportOpenDancingSuggestions([]);
    window.setTimeout(() => {
      setMusicImportStage("building");
      window.setTimeout(() => {
        setImportedPlaylistName("Spotify Favorites - Wedding Edit");
        setImportedPlaylistSongs(mockSongs);
        runAutoCategorization(mockSongs);
        setMusicImportStage("ready");
      }, 1100);
    }, 900);
  };

  const handleAddAllImportedToMustPlay = () => {
    if (importedPlaylistSongs.length === 0) return;
    const timestamp = Date.now();
    const importedEntries: SongEntry[] = importedPlaylistSongs.map((song, index) => ({
      id: `imported-must-${timestamp}-${index}`,
      title: song.title,
      artist: song.artist,
      notes: "Imported from mock Spotify playlist.",
      highPriority: song.vibe === "dance",
    }));
    setMustPlaySongs((prev) => [...importedEntries, ...prev]);
    logActivity("song_added", `Imported ${importedEntries.length} songs to Must Play`);
    pushNotification("Playlist songs imported", "song_added");
  };

  const removeSong = (listType: SongListType, songId: string) => {
    if (listType === "mustPlay") {
      setMustPlaySongs((prev) => prev.filter((song) => song.id !== songId));
      return;
    }
    setDoNotPlaySongs((prev) => prev.filter((song) => song.id !== songId));
  };

  const togglePriority = (listType: SongListType, songId: string) => {
    const updatePriority = (songs: SongEntry[]) =>
      songs.map((song) =>
        song.id === songId ? { ...song, highPriority: !song.highPriority } : song,
      );

    if (listType === "mustPlay") {
      setMustPlaySongs((prev) => updatePriority(prev));
      return;
    }
    setDoNotPlaySongs((prev) => updatePriority(prev));
  };

  const setGuestRequestStatus = (id: string, status: GuestRequestStatus) => {
    if (status === "Approved" || status === "Rejected") {
      logActivity(
        "guest_request_reviewed",
        `Guest request ${status.toLowerCase()}`,
      );
    }
    setGuestRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  };

  const roleBadgeClass = (role: UserRole) => {
    if (role === "Admin") return "border border-stone-400 bg-stone-100 font-semibold text-stone-950";
    if (role === "DJ") return "border border-violet-400 bg-violet-50 font-semibold text-violet-950";
    if (role === "Planner") return "border border-sky-400 bg-sky-50 font-semibold text-sky-950";
    return "border border-emerald-400 bg-emerald-50 font-semibold text-emerald-950";
  };

  const handleInviteCollaborator = () => {
    const name = inviteName.trim();
    const email = inviteEmail.trim();
    if (!name || !email) return;
    updateCollaboratorsForActiveEvent((current) => [
      ...current,
      {
        id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        email,
        role: inviteRole,
        status: "Pending",
      },
    ]);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Couple");
    setInviteModalOpen(false);
    logActivity("collaborator_invited", `Invited ${name} as ${inviteRole}`);
  };

  const buildGuestRequestNotes = (request: GuestRequestEntry) => {
    const parts: string[] = [`Guest request: ${request.guestName}`];
    if (request.dedication.trim()) parts.push(request.dedication.trim());
    return parts.join(". ");
  };

  const addGuestRequestToMustPlay = (request: GuestRequestEntry) => {
    if (request.addedToMustPlay) return;
    const title = request.songTitle.trim();
    if (!title) return;
    const entry: SongEntry = {
      id: `req-mp-${request.id}-${Date.now()}`,
      title,
      artist: request.artist.trim() || undefined,
      notes: buildGuestRequestNotes(request),
      highPriority: request.status === "Approved",
    };
    setMustPlaySongs((prev) => [entry, ...prev]);
    setGuestRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, addedToMustPlay: true } : r)),
    );
  };

  const addGuestRequestToDoNotPlay = (request: GuestRequestEntry) => {
    if (request.addedToDoNotPlay) return;
    const title = request.songTitle.trim();
    if (!title) return;
    const entry: SongEntry = {
      id: `req-dnp-${request.id}-${Date.now()}`,
      title,
      artist: request.artist.trim() || undefined,
      notes: buildGuestRequestNotes(request),
      highPriority: true,
    };
    setDoNotPlaySongs((prev) => [entry, ...prev]);
    setGuestRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, addedToDoNotPlay: true } : r)),
    );
  };

  const submitGuestRequestForm = () => {
    const name = guestFormName.trim();
    const title = guestFormTitle.trim();
    if (!name || !title) return;
    const newRequest: GuestRequestEntry = {
      id: `gr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      guestName: name,
      songTitle: title,
      artist: guestFormArtist.trim(),
      dedication: guestFormDedication.trim(),
      status: "Pending",
      addedToMustPlay: false,
      addedToDoNotPlay: false,
    };
    setGuestRequests((prev) => [...prev, newRequest]);
    setGuestFormName("");
    setGuestFormTitle("");
    setGuestFormArtist("");
    setGuestFormDedication("");
    setGuestSubmitBanner("Thank you! Your request was submitted.");
    setTimeout(() => setGuestSubmitBanner(""), 3500);
    logActivity("guest_request_submitted", `Guest request submitted by ${name}`);
  };

  const guestRequestStatusBadgeClass = (status: GuestRequestStatus) => {
    if (status === "Pending") return "bg-[#7E52A0]/18 text-violet-100";
    if (status === "Approved") return "bg-emerald-500/20 text-emerald-100";
    return "bg-[#6f5353]/45 text-[#f2dede]";
  };

  const resetTimelineForm = () => {
    setTimelineTitle("");
    setTimelineTime("");
    setTimelineCategory("Ceremony");
    setTimelineNotes("");
    setTimelineSongTitle("");
    setTimelineArtist("");
    setTimelineComposerError(null);
    setTimelineNeedsAttention(false);
    setEditingTimelineId(null);
  };

  const prepareAddMomentAfterTimelineItem = (timelineItemId: string) => {
    const item = timelineItems.find((t) => t.id === timelineItemId);
    if (!item) return;
    resetTimelineForm();
    setTimelineTime(item.time);
    setTimelineCategory(item.category);
    setReceptionTimelineExpandedId(null);
    setTimelineComposerOpen(true);
    window.setTimeout(() => {
      timelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const addOrUpdateTimelineItem = () => {
    const cleanTitle = timelineTitle.trim();
    const cleanTime = timelineTime.trim();
    const cleanSong = timelineSongTitle.trim();
    const cleanArtist = timelineArtist.trim();

    if (!cleanTitle) {
      setTimelineComposerError("Moment name is required.");
      return;
    }
    setTimelineComposerError(null);

    if (editingTimelineId) {
      setTimelineItems((prev) =>
        prev.map((item) =>
          item.id === editingTimelineId
            ? {
                ...item,
                title: cleanTitle,
                time: cleanTime,
                category: timelineCategory,
                notes: timelineNotes.trim(),
                songTitle: cleanSong,
                artist: cleanArtist,
                needsDjMcAttention: timelineNeedsAttention,
              }
            : item,
        ),
      );
      logActivity("timeline_updated", `Updated timeline item: ${cleanTitle}`);
      pushNotification("Timeline updated", "timeline_updated");
      resetTimelineForm();
      setTimelineComposerOpen(false);
      return;
    }

    const newItem: TimelineItem = {
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: cleanTitle,
      time: cleanTime,
      category: timelineCategory,
      notes: timelineNotes.trim(),
      songTitle: cleanSong || undefined,
      artist: cleanArtist || undefined,
      needsDjMcAttention: timelineNeedsAttention,
    };

    setTimelineItems((prev) => insertReceptionTimelineItemChronologically(prev, newItem));
    logActivity("timeline_item_added", `Added timeline moment: ${cleanTitle}`);
    pushNotification("Timeline moment added", "timeline_item_added");
    resetTimelineForm();
    setTimelineComposerOpen(false);
  };

  const deleteTimelineItem = (itemId: string) => {
    setTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    if (editingTimelineId === itemId) {
      resetTimelineForm();
    }
    if (receptionTimelineExpandedId === itemId) {
      setReceptionTimelineExpandedId(null);
    }
  };

  const moveTimelineItem = (itemId: string, direction: "up" | "down") => {
    setTimelineItems((prev) => {
      const currentIndex = prev.findIndex((item) => item.id === itemId);
      if (currentIndex === -1) return prev;
      if (direction === "up" && currentIndex === 0) return prev;
      if (direction === "down" && currentIndex === prev.length - 1) return prev;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const updated = [...prev];
      const [movedItem] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const reorderTimelineItemToTarget = (itemId: string, targetId: string) => {
    if (!itemId || !targetId || itemId === targetId) return;
    setTimelineItems((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === itemId);
      const toIndex = prev.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    logActivity("timeline_updated", "Reordered timeline items");
    pushNotification("Timeline updated", "timeline_updated");
  };

  const sortReceptionTimelineByEnteredTime = () => {
    if (!canEditTimeline) return;
    setTimelineItems((prev) => sortTimelineItemsChronologically(prev));
    logActivity("timeline_updated", "Sorted reception timeline by entered time");
  };

  const duplicateTimelineItem = (item: TimelineItem) => {
    const duplicate: TimelineItem = {
      ...item,
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${item.title} (Copy)`,
      songTitle: item.songTitle,
      artist: item.artist,
      fadeOutEarly: item.fadeOutEarly,
      fadeOutTimestamp: item.fadeOutTimestamp,
    };
    setTimelineItems((prev) => insertReceptionTimelineItemChronologically(prev, duplicate));
    logActivity("timeline_updated", `Duplicated timeline item: ${item.title}`);
    pushNotification("Timeline updated", "timeline_updated");
  };

  const addReceptionPreset = (preset: TimelinePresetItem) => {
    const newItem = mainTimelineItemFromPreset(
      preset,
      `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    );
    setTimelineItems((prev) => insertReceptionTimelineItemChronologically(prev, newItem));
    logActivity("timeline_updated", `Added preset: ${preset.momentName}`);
    pushNotification("Timeline updated", "timeline_updated");
  };

  const addCeremonyPreset = (preset: TimelinePresetItem) => {
    const newItem = ceremonyTimelineItemFromPreset(
      preset,
      `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    );
    setCeremonyTimelineItems((prev) =>
      insertCeremonyTimelineItemChronologically(prev, newItem),
    );
    logActivity("ceremony_updated", `Added ceremony preset: ${preset.momentName}`);
    pushNotification("Ceremony timeline updated", "ceremony_updated");
  };

  const applyTimelinePresetsForActiveEvent = () => {
    const ok = window.confirm(
      `Apply timeline presets for ${layoutProfileForActiveEvent}? This can append defaults to your current timeline.`,
    );
    if (!ok) return;
    const replaceExisting = window.confirm(
      "Replace existing timeline and ceremony moments with presets? Click Cancel to keep your current items and append presets instead.",
    );
    applyPresetItemsToTimelineState(timelinePresetsForActiveEvent, replaceExisting);
    logActivity(
      "timeline_updated",
      replaceExisting
        ? "Replaced timeline with current event-type presets"
        : "Appended current event-type timeline presets",
    );
    pushNotification("Timeline presets applied", "timeline_updated");
  };

  /** Full suggested flow for setup — replaces ceremony + main when user confirms edge cases. */
  const handleApplySuggestedTimelineSetup = () => {
    if (!canEditTimeline) return;
    if ((mainTimelinePresetsForActiveEvent ?? []).length === 0) return;
    if (ceremonyTimelineItems.length > 0 && mergedTimelineItems.length === 0) {
      const ok = window.confirm(
        "Loading the full suggested timeline will replace your current ceremony moments. Continue?",
      );
      if (!ok) return;
    }
    applyPresetItemsToTimelineState(timelinePresetsForActiveEvent, true);
    logActivity("timeline_updated", "Loaded suggested timeline from presets (setup)");
    pushNotification("Suggested timeline loaded", "timeline_updated");
  };

  const resetCeremonyTimelineDraft = () => {
    setCeremonyTimelineDraftTimeOrOrder("");
    setCeremonyTimelineDraftMoment("");
    setCeremonyTimelineDraftSongTitle("");
    setCeremonyTimelineDraftArtist("");
    setCeremonyTimelineDraftNotes("");
    setCeremonyTimelineDraftNeedsAttention(false);
  };

  const openCeremonyTimelineComposer = () => {
    resetCeremonyTimelineDraft();
    setCeremonyTimelineExpandedId(null);
    setCeremonyTimelineComposerOpen(true);
    window.setTimeout(() => {
      ceremonyTimelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const prepareAddCeremonyMomentAfter = (afterItemId: string) => {
    const prior = ceremonyTimelineItems.find((t) => t.id === afterItemId);
    if (!prior) return;
    resetCeremonyTimelineDraft();
    setCeremonyTimelineDraftTimeOrOrder(prior.timeOrOrder);
    setCeremonyTimelineExpandedId(null);
    setCeremonyTimelineComposerOpen(true);
    window.setTimeout(() => {
      ceremonyTimelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const saveCeremonyTimelineComposerItem = () => {
    const cleanMoment = ceremonyTimelineDraftMoment.trim();
    if (!cleanMoment) return;
    const newCeremonyItem: CeremonyTimelineItem = {
      id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timeOrOrder: ceremonyTimelineDraftTimeOrOrder.trim(),
      moment: cleanMoment,
      songTitle: ceremonyTimelineDraftSongTitle.trim(),
      artist: ceremonyTimelineDraftArtist.trim(),
      notes: ceremonyTimelineDraftNotes.trim(),
      needsDjMcAttention: ceremonyTimelineDraftNeedsAttention,
    };
    setCeremonyTimelineItems((prev) =>
      insertCeremonyTimelineItemChronologically(prev, newCeremonyItem),
    );
    logActivity("ceremony_updated", `Added ceremony moment: ${cleanMoment}`);
    pushNotification("Ceremony timeline updated", "ceremony_updated");
    resetCeremonyTimelineDraft();
    setCeremonyTimelineComposerOpen(false);
  };

  const deleteCeremonyTimelineItem = (itemId: string) => {
    setCeremonyTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    if (ceremonyTimelineExpandedId === itemId) {
      setCeremonyTimelineExpandedId(null);
    }
    logActivity("ceremony_updated", "Removed ceremony moment");
    pushNotification("Ceremony timeline updated", "ceremony_updated");
  };

  const duplicateCeremonyTimelineItem = (item: CeremonyTimelineItem) => {
    const duplicate: CeremonyTimelineItem = {
      ...item,
      id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      moment: `${item.moment} (Copy)`,
    };
    setCeremonyTimelineItems((prev) =>
      insertCeremonyTimelineItemChronologically(prev, duplicate),
    );
    logActivity("ceremony_updated", `Duplicated ceremony moment: ${item.moment}`);
    pushNotification("Ceremony timeline updated", "ceremony_updated");
  };

  const moveCeremonyTimelineItem = (itemId: string, direction: "up" | "down") => {
    setCeremonyTimelineItems((prev) => {
      const currentIndex = prev.findIndex((item) => item.id === itemId);
      if (currentIndex === -1) return prev;
      if (direction === "up" && currentIndex === 0) return prev;
      if (direction === "down" && currentIndex === prev.length - 1) return prev;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const updated = [...prev];
      const [movedItem] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const reorderCeremonyTimelineItemToTarget = (itemId: string, targetId: string) => {
    if (!itemId || !targetId || itemId === targetId) return;
    setCeremonyTimelineItems((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === itemId);
      const toIndex = prev.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    logActivity("ceremony_updated", "Reordered ceremony timeline");
    pushNotification("Ceremony timeline updated", "ceremony_updated");
  };

  reorderTimelineItemToTargetRef.current = reorderTimelineItemToTarget;
  reorderCeremonyTimelineItemToTargetRef.current = reorderCeremonyTimelineItemToTarget;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!draggingTimelineId) return;
    if (touchDragTimelineSourceRef.current) return;

    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      autoScrollForDragClientY(
        event.clientY,
        findVerticalScrollContainer(timelineStreamRef.current),
      );
    };

    window.addEventListener("dragover", onDragOver);
    return () => window.removeEventListener("dragover", onDragOver);
  }, [draggingTimelineId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!draggingTimelineId) return;
    if (!touchDragTimelineSourceRef.current) return;
    if (!canEditTimeline) return;

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      autoScrollForDragClientY(
        touch.clientY,
        findVerticalScrollContainer(timelineStreamRef.current),
      );
      const over = document.elementFromPoint(touch.clientX, touch.clientY);
      const row = over?.closest("[data-timeline-id]") as HTMLElement | null;
      const id = row?.dataset.timelineId ?? null;
      const src = touchDragTimelineSourceRef.current;
      if (id && src && id !== src) {
        dropTargetTimelineIdRef.current = id;
        setDropTargetTimelineId(id);
      } else if (!id) {
        dropTargetTimelineIdRef.current = null;
        setDropTargetTimelineId(null);
      }
      event.preventDefault();
    };

    const finish = () => {
      const src = touchDragTimelineSourceRef.current;
      const tgt = dropTargetTimelineIdRef.current;
      touchDragTimelineSourceRef.current = null;
      dropTargetTimelineIdRef.current = null;
      setDraggingTimelineId(null);
      setDropTargetTimelineId(null);
      if (src && tgt && src !== tgt) {
        reorderTimelineItemToTargetRef.current(src, tgt);
      }
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", finish, true);
    document.addEventListener("touchcancel", finish, true);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", finish, true);
      document.removeEventListener("touchcancel", finish, true);
    };
  }, [draggingTimelineId, canEditTimeline]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!draggingCeremonyTimelineId) return;
    if (touchDragCeremonyTimelineSourceRef.current) return;

    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      autoScrollForDragClientY(
        event.clientY,
        findVerticalScrollContainer(ceremonyTimelineStreamRef.current),
      );
    };

    window.addEventListener("dragover", onDragOver);
    return () => window.removeEventListener("dragover", onDragOver);
  }, [draggingCeremonyTimelineId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!draggingCeremonyTimelineId) return;
    if (!touchDragCeremonyTimelineSourceRef.current) return;
    if (!canEditTimeline) return;

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      autoScrollForDragClientY(
        touch.clientY,
        findVerticalScrollContainer(ceremonyTimelineStreamRef.current),
      );
      const over = document.elementFromPoint(touch.clientX, touch.clientY);
      const row = over?.closest("[data-ceremony-timeline-id]") as HTMLElement | null;
      const id = row?.dataset.ceremonyTimelineId ?? null;
      const src = touchDragCeremonyTimelineSourceRef.current;
      if (id && src && id !== src) {
        dropTargetCeremonyTimelineIdRef.current = id;
        setDropTargetCeremonyTimelineId(id);
      } else if (!id) {
        dropTargetCeremonyTimelineIdRef.current = null;
        setDropTargetCeremonyTimelineId(null);
      }
      event.preventDefault();
    };

    const finish = () => {
      const src = touchDragCeremonyTimelineSourceRef.current;
      const tgt = dropTargetCeremonyTimelineIdRef.current;
      touchDragCeremonyTimelineSourceRef.current = null;
      dropTargetCeremonyTimelineIdRef.current = null;
      setDraggingCeremonyTimelineId(null);
      setDropTargetCeremonyTimelineId(null);
      if (src && tgt && src !== tgt) {
        reorderCeremonyTimelineItemToTargetRef.current(src, tgt);
      }
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", finish, true);
    document.addEventListener("touchcancel", finish, true);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", finish, true);
      document.removeEventListener("touchcancel", finish, true);
    };
  }, [draggingCeremonyTimelineId, canEditTimeline]);

  const updateCollaboratorsForActiveEvent = (
    updater: (current: Collaborator[]) => Collaborator[],
  ) => {
    if (!activeEventId) return;
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === activeEventId
          ? { ...evt, collaborators: updater(evt.collaborators ?? []) }
          : evt,
      ),
    );
  };

  const mergedTimelineItems: DisplayTimelineItem[] = useMemo(
    () =>
      timelineItems.map((item) => ({
        id: item.id,
        source: "timeline" as const,
        time: item.time,
        title: item.title,
        category: item.category,
        notes: item.notes,
        needsDjMcAttention: item.needsDjMcAttention,
        songTitle: item.songTitle?.trim() || "",
        artist: item.artist?.trim() || "",
        fadeOutEarly: item.fadeOutEarly,
        fadeOutTimestamp: item.fadeOutTimestamp,
      })),
    [timelineItems],
  );

  /** Reception/main timeline: consecutive rows with the same category form one collapsible phase in Run Of Show. */
  const runOfShowReceptionPhaseGroups = useMemo(() => {
    type Phase = { id: string; category: TimelineCategory; items: DisplayTimelineItem[] };
    const groups: Phase[] = [];
    for (const item of mergedTimelineItems) {
      const tail = groups[groups.length - 1];
      if (tail && tail.category === item.category) {
        tail.items.push(item);
      } else {
        groups.push({ id: `ros:recv:${item.id}`, category: item.category, items: [item] });
      }
    }
    return groups;
  }, [mergedTimelineItems]);

  const runOfShowCeremonyAllMomentsDone = useMemo(
    () =>
      sectionCeremonyEnabled &&
      ceremonyTimelineItems.length > 0 &&
      ceremonyTimelineItems.every((item) => runOfShowDoneKeys.has(`c:${item.id}`)),
    [sectionCeremonyEnabled, ceremonyTimelineItems, runOfShowDoneKeys],
  );

  /** Ceremony (if enabled) then reception — matches on-screen Run Of Show order. */
  const runOfShowOrderedSteps = useMemo(() => {
    const steps: { key: string; title: string }[] = [];
    if (sectionCeremonyEnabled) {
      ceremonyTimelineItems.forEach((item) => {
        steps.push({
          key: `c:${item.id}`,
          title: item.moment?.trim() || "Untitled moment",
        });
      });
    }
    if (sectionReceptionTimelineEnabled) {
      mergedTimelineItems.forEach((item) => {
        steps.push({
          key: `r:${item.id}`,
          title: item.title?.trim() || "Untitled moment",
        });
      });
    }
    return steps;
  }, [
    sectionCeremonyEnabled,
    sectionReceptionTimelineEnabled,
    ceremonyTimelineItems,
    mergedTimelineItems,
  ]);

  const runOfShowUpNextMeta = useMemo(() => {
    const steps = runOfShowOrderedSteps;
    if (steps.length === 0) return { banner: "none" as const, upNextKey: null as string | null };
    const firstUndone = steps.find((s) => !runOfShowDoneKeys.has(s.key));
    if (!firstUndone) return { banner: "complete" as const, upNextKey: null as string | null };
    return {
      banner: "upNext" as const,
      upNextKey: firstUndone.key,
      upNextTitle: firstUndone.title,
    };
  }, [runOfShowOrderedSteps, runOfShowDoneKeys]);

  /** Concise copy for the contextual floating Up Next cue (not the sticky header). */
  const runOfShowUpNextCueDetail = useMemo(() => {
    if (runOfShowUpNextMeta.banner !== "upNext" || !runOfShowUpNextMeta.upNextKey) return null;
    const key = runOfShowUpNextMeta.upNextKey;
    if (key.startsWith("c:")) {
      const id = key.slice(2);
      const item = ceremonyTimelineItems.find((row) => row.id === id);
      if (!item) return null;
      const song = [item.songTitle?.trim(), item.artist?.trim()].filter(Boolean).join(" - ");
      const time = item.timeOrOrder?.trim();
      const subline = song || time || undefined;
      return { title: item.moment?.trim() || "Untitled moment", subline };
    }
    if (key.startsWith("r:")) {
      const id = key.slice(2);
      const item = mergedTimelineItems.find((row) => row.id === id);
      if (!item) return null;
      const song = [item.songTitle?.trim(), item.artist?.trim()].filter(Boolean).join(" - ");
      const time = item.time?.trim();
      const subline = song || time || undefined;
      return { title: item.title?.trim() || "Untitled moment", subline };
    }
    return null;
  }, [runOfShowUpNextMeta, ceremonyTimelineItems, mergedTimelineItems]);

  useLayoutEffect(() => {
    if (!runOfShowOverlayActive) {
      window.setTimeout(() => setRunOfShowUpNextRowInView(true), 0);
      return;
    }
    if (runOfShowUpNextMeta.banner !== "upNext") {
      window.setTimeout(() => setRunOfShowUpNextRowInView(true), 0);
      return;
    }
    const root = runOfShowScrollRef.current;
    const target = root?.querySelector<HTMLElement>("[data-run-of-show-up-next]");
    if (!root || !target) {
      window.setTimeout(() => setRunOfShowUpNextRowInView(true), 0);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setRunOfShowUpNextRowInView(entry.isIntersecting);
      },
      { root, threshold: 0.1, rootMargin: "-10px 0px -28px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [runOfShowOverlayActive, runOfShowUpNextMeta, runOfShowUpNextCueDetail]);

  const receptionTimelineClockOrderConflict = useMemo(
    () => receptionTimelineHasClockOrderConflict(timelineItems),
    [timelineItems],
  );

  useEffect(() => {
    if (!runOfShowOverlayActive) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [runOfShowOverlayActive]);

  useEffect(() => {
    if (activeScreen === "Event Prep" && appMode === "event") return;
    const t = window.setTimeout(() => setRunOfShowOpen(false), 0);
    return () => window.clearTimeout(t);
  }, [activeScreen, appMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const syncFs = () => setRunOfShowIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", syncFs);
    return () => document.removeEventListener("fullscreenchange", syncFs);
  }, []);

  const showTimelinePresetOnboarding =
    mergedTimelineItems.length === 0 && ceremonyTimelineItems.length === 0;
  const hasAnyTimelinePresetTools =
    mergedTimelineItems.length > 0 || ceremonyTimelineItems.length > 0;

  const ceremonyTimelineRows = useMemo(() => {
    return ceremonyTimelineItems.map((item) => ({
      id: item.id,
      order: item.timeOrOrder?.trim() ?? "",
      moment: item.moment || "Untitled Moment",
      song: [item.songTitle?.trim(), item.artist?.trim()].filter(Boolean).join(" - ") ?? "",
      notes: [
        item.notes?.trim() || "",
        item.needsDjMcAttention ? "MC/DJ Attention" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    }));
  }, [ceremonyTimelineItems]);

  const parsePlaylistSongLine = useCallback((line: string) => {
    const raw = line.trim();
    if (!raw) return { song: "", artist: "" };
    const parts = raw.split(" - ");
    if (parts.length < 2) return { song: raw, artist: "" };
    return {
      song: parts.slice(0, parts.length - 1).join(" - ").trim(),
      artist: parts[parts.length - 1].trim(),
    };
  }, []);

  const planningInsights = useMemo(
    () =>
      buildPlanningInsights(
        mergedTimelineItems,
        mustPlaySongs,
        doNotPlaySongs,
        weddingPartyProcessional,
        brideGroomProcessional,
        microphoneNeeds,
        guestRequests,
      ),
    [
      mergedTimelineItems,
      mustPlaySongs,
      doNotPlaySongs,
      weddingPartyProcessional,
      brideGroomProcessional,
      microphoneNeeds,
      guestRequests,
    ],
  );

  const insightsForEventDashboard = useMemo(() => {
    if (effectiveRole === "Couple") {
      return planningInsights.filter(
        (i) => i.section !== "timeline" && i.section !== "ceremony",
      );
    }
    if (effectiveRole === "DJ") {
      return planningInsights.filter((i) =>
        ["music", "timeline", "guest", "ceremony"].includes(i.section),
      );
    }
    if (effectiveRole === "Planner") {
      return planningInsights.filter((i) =>
        ["timeline", "guest", "music", "ceremony"].includes(i.section),
      );
    }
    return planningInsights;
  }, [effectiveRole, planningInsights]);

  type EventReadinessTier = "attention" | "recommended" | "optional";

  type EventReadinessItem = {
    id: string;
    tier: EventReadinessTier;
    title: string;
    hint: string;
    actionLabel: string;
    targetScreen: Screen;
  };

  const eventReadinessGuide = useMemo((): EventReadinessItem[] => {
    const rows: EventReadinessItem[] = [];
    const tlScreen = primaryTimelineScreenForHome;

    if (!hasEventDetailsComplete) {
      rows.push({
        id: "rd-event-basics",
        tier: "attention",
        title: "Core event details unfinished",
        hint: "Add your event name, how you’d like to be introduced, date, and venue so everything downstream stays aligned.",
        actionLabel: "Complete details",
        targetScreen: "Event Settings",
      });
    }

    if (hasEventDetailsComplete) {
      const plannerMissing = !eventSettings.plannerName?.trim();
      const djMissing = !eventSettings.assignedDj?.trim();
      if (plannerMissing || djMissing) {
        rows.push({
          id: "rd-team-routing",
          tier: "attention",
          title: plannerMissing && djMissing ? "Planner & DJ not linked yet" : plannerMissing ? "Planner contact open" : "DJ assignment open",
          hint:
            plannerMissing && djMissing
              ? "Assign your planner and DJ in Event Settings—routing gets clearer for vendors and exports."
              : plannerMissing
                ? "Add who is coordinating day-of details so vendors know where to send updates."
                : "Assign your DJ so music notes and timelines attach to the right person.",
          actionLabel: "Event Settings",
          targetScreen: "Event Settings",
        });
      }
    }

    if (sectionReceptionTimelineEnabled && mergedTimelineItems.length === 0) {
      rows.push({
        id: "rd-reception-timeline-empty",
        tier: "attention",
        title: "Reception timeline not started",
        hint: "Even a short top-to-bottom flow helps you see the night clearly—presets are fine to start.",
        actionLabel: "Build timeline",
        targetScreen: tlScreen,
      });
    }

    if (sectionCeremonyEnabled && ceremonyTimelineItems.length === 0) {
      rows.push({
        id: "rd-ceremony-empty",
        tier: "attention",
        title: "Ceremony timeline still empty",
        hint: "Add procession through recessional beats when you’re ready—small steps still reduce day-of noise.",
        actionLabel: "Ceremony",
        targetScreen: "Ceremony",
      });
    }

    if (sectionCeremonyEnabled && ceremonyTimelineItems.length > 0 && !hasKeyCeremonySongs) {
      rows.push({
        id: "rd-ceremony-music",
        tier: "attention",
        title: "Ceremony music cues incomplete",
        hint: "Processional and recessional selections keep aisle timing calm for everyone involved.",
        actionLabel: "Set ceremony audio",
        targetScreen: "Ceremony",
      });
    }

    if (sectionPlanningQuestionsEnabled && coupleAttentionSummary.unansweredPlanningQuestionCount > 0) {
      rows.push({
        id: "rd-planning-prompts",
        tier: "attention",
        title: `${coupleAttentionSummary.unansweredPlanningQuestionCount} planning prompt${coupleAttentionSummary.unansweredPlanningQuestionCount === 1 ? "" : "s"} open`,
        hint: "Answers feed your Event Document and vendor brief—short responses are enough.",
        actionLabel: "Planning Questions",
        targetScreen: "Planning Questions",
      });
    }

    if (sectionGuestRequestsEnabled && coupleAttentionSummary.pendingGuestCount > 0) {
      rows.push({
        id: "rd-guest-queue",
        tier: "attention",
        title: `${coupleAttentionSummary.pendingGuestCount} guest song request${coupleAttentionSummary.pendingGuestCount === 1 ? "" : "s"} waiting`,
        hint: "Approve or decline when it fits your pace—the DJ sees the final list, not the inbox.",
        actionLabel: "Guest Requests",
        targetScreen: "Guest Requests",
      });
    }

    if (
      sectionReceptionTimelineEnabled &&
      mergedTimelineItems.length > 0 &&
      !hasKeyTimelineMoments
    ) {
      rows.push({
        id: "rd-reception-flow-beats",
        tier: "recommended",
        title: "Reception flow could use anchor moments",
        hint: "Consider marking cocktail, dinner, toasts, dancing, and a closing beat—gaps show up earlier when it’s calm.",
        actionLabel: "Review timeline",
        targetScreen: tlScreen,
      });
    }

    if (sectionReceptionTimelineEnabled && mergedTimelineItems.length > 0 && !hasKeyFormalDanceSongs) {
      rows.push({
        id: "rd-formal-dances",
        tier: "recommended",
        title: "Formal dances still open",
        hint: "First dance and parent dances carry a lot of emotion—set songs when it feels right.",
        actionLabel: "Timeline",
        targetScreen: tlScreen,
      });
    }

    const lastDanceRow = mergedTimelineItems.find((item) => /last\s*dance/i.test(item.title));
    if (
      sectionReceptionTimelineEnabled &&
      mergedTimelineItems.length > 0 &&
      lastDanceRow &&
      !(lastDanceRow.songTitle?.trim().length)
    ) {
      rows.push({
        id: "rd-last-dance",
        tier: "recommended",
        title: "Last dance song not chosen",
        hint: "A closing track helps your DJ land the night with intention—not a rush decision.",
        actionLabel: "Pick closing song",
        targetScreen: tlScreen,
      });
    }

    if (sectionMustPlayEnabled && mustPlaySongs.length === 0) {
      rows.push({
        id: "rd-must-play",
        tier: "recommended",
        title: "Must-play list is empty",
        hint: "Even a short list signals what absolutely needs airtime—five songs is a fine start.",
        actionLabel: "Music Hub",
        targetScreen: "Music Hub",
      });
    }

    if (sectionVendorContactsEnabled && vendors.length === 0) {
      rows.push({
        id: "rd-vendors",
        tier: "recommended",
        title: "Vendor contacts not captured",
        hint: "Photo, venue, catering, entertainment—light entries save frantic texting later.",
        actionLabel: "Vendors",
        targetScreen: "Vendors",
      });
    }

    const liveDocMuted =
      eventNavItems.includes("Event Prep") &&
      ((sectionPlanningQuestionsEnabled && !eventSettings.liveEventShowPlanningQuestions) ||
        (sectionGuestRequestsEnabled && !eventSettings.liveEventShowGuestRequests) ||
        (sectionMusicNotesEnabled && !eventSettings.liveEventShowMusicNotes) ||
        (sectionPlaylistsEnabled && !eventSettings.liveEventShowPlaylists) ||
        (sectionDoNotPlayEnabled && !eventSettings.liveEventShowDoNotPlay));

    if (liveDocMuted) {
      rows.push({
        id: "rd-live-doc-sections",
        tier: "recommended",
        title: "Event Document not showing every enabled area",
        hint: "Toggle sections on in Event Document options when you’re ready for vendors to read them.",
        actionLabel: "Event Document",
        targetScreen: "Event Prep",
      });
    }

    if (sectionDoNotPlayEnabled && doNotPlaySongs.length === 0) {
      rows.push({
        id: "rd-do-not-play",
        tier: "optional",
        title: "Do-not-play still blank",
        hint: "Totally optional—a gentle guardrail if certain songs or eras feel off-limits.",
        actionLabel: "Add guardrails",
        targetScreen: "Music Hub",
      });
    }

    if (sectionMusicNotesEnabled && !hasFinalDjNotes) {
      rows.push({
        id: "rd-dj-notes-length",
        tier: "optional",
        title: "DJ notes room to grow",
        hint: "Energy arc, dedications, surprises—add when inspiration strikes; nothing here is urgent.",
        actionLabel: "Music notes",
        targetScreen: "Music Hub",
      });
    }

    const tierRank = (t: EventReadinessTier) =>
      t === "attention" ? 0 : t === "recommended" ? 1 : 2;

    const seen = new Set<string>();
    return rows
      .filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      })
      .sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || a.title.localeCompare(b.title));
  }, [
    ceremonyTimelineItems.length,
    coupleAttentionSummary.pendingGuestCount,
    coupleAttentionSummary.unansweredPlanningQuestionCount,
    eventNavItems,
    eventSettings.assignedDj,
    eventSettings.liveEventShowDoNotPlay,
    eventSettings.liveEventShowGuestRequests,
    eventSettings.liveEventShowMusicNotes,
    eventSettings.liveEventShowPlanningQuestions,
    eventSettings.liveEventShowPlaylists,
    eventSettings.plannerName,
    hasEventDetailsComplete,
    hasFinalDjNotes,
    hasKeyCeremonySongs,
    hasKeyFormalDanceSongs,
    hasKeyTimelineMoments,
    mergedTimelineItems,
    mustPlaySongs.length,
    doNotPlaySongs.length,
    primaryTimelineScreenForHome,
    sectionCeremonyEnabled,
    sectionDoNotPlayEnabled,
    sectionGuestRequestsEnabled,
    sectionMusicNotesEnabled,
    sectionMustPlayEnabled,
    sectionPlanningQuestionsEnabled,
    sectionPlaylistsEnabled,
    sectionReceptionTimelineEnabled,
    sectionVendorContactsEnabled,
    vendors.length,
  ]);

  const liveEventText = useMemo(() => {
    const assignedDjLabel = (() => {
      const value = eventSettings.assignedDj || "";
      if (!value.trim()) return "TBD";
      return teamMembers.find((member) => member.id === value)?.name || value;
    })();

    const showMc = sectionMcScriptEnabled && eventSettings.liveEventShowMcScript;
    const showMusicNotes = sectionMusicNotesEnabled && eventSettings.liveEventShowMusicNotes;
    const showDnp = sectionDoNotPlayEnabled && eventSettings.liveEventShowDoNotPlay;
    const showVendors = sectionVendorContactsEnabled && eventSettings.liveEventShowVendorContacts;
    const showPlaylists = sectionPlaylistsEnabled && eventSettings.liveEventShowPlaylists;
    const showGuestRequestsDoc =
      sectionGuestRequestsEnabled && eventSettings.liveEventShowGuestRequests;
    const showPlanningQs =
      sectionPlanningQuestionsEnabled && eventSettings.liveEventShowPlanningQuestions;
    const liveEventPlanningQuestions = planningQuestionsForEvent.filter(
      (question) => question.showInLiveEventMode,
    );
    const layoutProf = eventSettings.eventLayoutProfile;
    const receptionPlainHeading =
      layoutProf === "Corporate"
        ? "RUN OF SHOW"
        : layoutProf === "School Dance" || layoutProf === "Private Party"
          ? "TIMELINE"
          : "RECEPTION TIMELINE";

    const cocktailLines = getPlaylistLines("cocktailHour");
    const dinnerLines = getPlaylistLines("dinner");
    const openLines = getPlaylistLines("openDancing");
    const afterpartyLines = getPlaylistLines("afterparty");
    const customLines = getPlaylistLines("custom");

    const lines: string[] = [
      `${appSettings.appName.toUpperCase()} - EVENT DOCUMENT`,
      "",
      "EVENT OVERVIEW",
      `Event Name: ${eventSettings.eventName || weddingDetails.couple || "TBD"}`,
      `${primaryPartyShortLabel}: ${eventSettings.coupleNames || weddingDetails.couple || "TBD"}`,
      `Date: ${eventSettings.weddingDate || weddingDetails.date || "TBD"}`,
      `Venue: ${eventSettings.venue || weddingDetails.venue || "TBD"}`,
      `Timezone: ${effectiveTimezone || "TBD"}`,
      `Event Type: ${effectiveEventType || "TBD"}`,
      `Package: ${eventSettings.packageName || "TBD"}`,
      `Assigned DJ: ${assignedDjLabel}`,
    ];

    if (sectionCeremonyEnabled) {
      lines.push(
        `Setup Time: ${eventSettings.eventStartTime || "TBD"}`,
        `Ceremony Start: ${ceremonyStartTime || "TBD"}`,
        `Ceremony Guest Arrival: ${ceremonyGuestArrivalTime || "TBD"}`,
        `Officiant: ${officiantName || "TBD"}`,
        `Microphones: ${microphoneNeeds || "TBD"}`,
      );
    }

    lines.push("", "");

    if (sectionCeremonyEnabled) {
      lines.push(
        "CEREMONY TIMELINE",
        ...ceremonyTimelineItems.map((item) => {
          const songBits = [item.songTitle?.trim(), item.artist?.trim()].filter(Boolean);
          const songLabel = songBits.length ? songBits.join(" - ") : "";
          const parts = [
            item.timeOrOrder?.trim(),
            item.moment?.trim() || "Untitled",
            songLabel || undefined,
            item.needsDjMcAttention ? "DJ/MC ATTENTION" : undefined,
            item.notes?.trim(),
          ].filter(Boolean);
          return `- ${parts.join(" | ")}`;
        }),
        `- General Ceremony Notes: ${ceremonyNotes || "None"}`,
        "",
      );
    }

    if (sectionReceptionTimelineEnabled) {
      lines.push(
        receptionPlainHeading,
        ...mergedTimelineItems.map((item) => {
          const songBits = [item.songTitle?.trim(), item.artist?.trim()].filter(Boolean);
          const songLabel = songBits.length ? songBits.join(" - ") : "";
          const fadePart = item.fadeOutEarly
            ? item.fadeOutTimestamp?.trim()
              ? `Fade at ${item.fadeOutTimestamp.trim()}`
              : "Fade early"
            : undefined;
          const parts = [
            item.time?.trim(),
            `${item.title} [${item.category}]`,
            songLabel || undefined,
            fadePart,
            item.needsDjMcAttention ? "DJ/MC ATTENTION" : undefined,
            item.notes?.trim(),
          ].filter(Boolean);
          return `- ${parts.join(" | ")}`;
        }),
        "",
      );
    }

    if (showPlanningQs) {
      const planningLines = formatPlanningQuestionsPlainTextLines(
        liveEventPlanningQuestions,
        eventSettings.planningQuestionAnswers,
      );
      planningLines[0] = "PLANNING NOTES / KEY ANSWERS";
      lines.push(...planningLines, "");
    }

    if (showMusicNotes) {
      lines.push("MUSIC NOTES");
      if (eventSettings.eventLayoutProfile === "School Dance") {
        lines.push("(Clean edits / school-appropriate content)");
      }
      lines.push(`Overall vibe: ${generalDjNotes || "None"}`);
      if (musicVibeDetail.genres?.trim()) lines.push(`Genres: ${musicVibeDetail.genres.trim()}`);
      if (musicVibeDetail.energy?.trim()) lines.push(`Energy: ${musicVibeDetail.energy.trim()}`);
      if (musicVibeDetail.crowdNotes?.trim()) lines.push(`Crowd: ${musicVibeDetail.crowdNotes.trim()}`);
      if (musicVibeDetail.cleanMusicPrefs?.trim())
        lines.push(`Clean / content prefs: ${musicVibeDetail.cleanMusicPrefs.trim()}`);
      lines.push("");
    }

    if (showDnp) {
      lines.push(
        "DO NOT PLAY",
        ...doNotPlaySongs.map(
          (song) =>
            `- ${song.title}${song.artist ? ` - ${song.artist}` : ""}${song.highPriority ? " (PRIORITY BLOCK)" : ""}${song.notes ? ` | ${song.notes}` : ""}`,
        ),
        "",
      );
    }

    if (showPlaylists) {
      const pushPlaylistBucket = (bucketLines: string[], header: string) => {
        lines.push(header);
        if (bucketLines.length === 0) {
          lines.push("(none)", "");
          return;
        }
        bucketLines.forEach((line, index) => {
          const parsed = parsePlaylistSongLine(line);
          lines.push(
            `${index + 1}. ${parsed.song || "-"}${parsed.artist ? ` - ${parsed.artist}` : ""}`,
          );
        });
        lines.push("");
      };

      pushPlaylistBucket(cocktailLines, "COCKTAIL HOUR");
      pushPlaylistBucket(dinnerLines, "DINNER");
      pushPlaylistBucket(openLines, "OPEN DANCING");
      pushPlaylistBucket(afterpartyLines, "AFTERPARTY");
      pushPlaylistBucket(customLines, "CUSTOM PLAYLIST");
    }

    if (showPlaylists && sectionMustPlayEnabled) {
      lines.push(
        "MUST PLAY SONGS",
        ...mustPlaySongs.map(
          (song) =>
            `- ${song.title}${song.artist ? ` - ${song.artist}` : ""}${song.highPriority ? " (PRIORITY)" : ""}${song.notes ? ` | ${song.notes}` : ""}`,
        ),
        "",
      );
    }

    if (showVendors) {
      const sorted = sortVendorsForEventDocument(vendors);
      lines.push(
        "EVENT TEAM & VENDOR CONTACTS",
        ...sorted.flatMap((vendor) => ["", ...formatVendorContactLines(vendor)]),
        "",
      );
    }

    if (showMc) {
      lines.push("MC SCRIPTS / ANNOUNCEMENTS", mcAnnouncements || "None", "");
    }

    if (showGuestRequestsDoc) {
      lines.push(
        "GUEST REQUESTS",
        ...guestRequests.map((request) => {
          const songLine = `${request.songTitle}${request.artist ? ` - ${request.artist}` : ""}`;
          const ded = request.dedication ? ` | Dedication: ${request.dedication}` : "";
          const playlist = [
            request.addedToMustPlay ? "Added to Must Play" : null,
            request.addedToDoNotPlay ? "Added to Do Not Play" : null,
          ]
            .filter(Boolean)
            .join(", ");
          const extra = playlist ? ` | ${playlist}` : "";
          return `- ${songLine} | ${request.guestName} | ${request.status}${ded}${extra}`;
        }),
        "",
      );
    }

    lines.push(
      "INTERNAL NOTES",
      eventSettings.internalNotes || "None",
      "",
      "CLIENT-FACING NOTES",
      eventSettings.clientFacingNotes || "None",
      "",
      "DOCUMENT FOOTER",
      effectivePrepSheetFooter || "None",
      "",
    );

    return lines.join("\n");
  }, [
    appSettings.appName,
    ceremonyGuestArrivalTime,
    ceremonyNotes,
    ceremonyStartTime,
    ceremonyTimelineItems,
    doNotPlaySongs,
    effectiveEventType,
    effectivePrepSheetFooter,
    effectiveTimezone,
    eventSettings.assignedDj,
    eventSettings.clientFacingNotes,
    eventSettings.coupleNames,
    eventSettings.eventName,
    eventSettings.eventStartTime,
    eventSettings.eventLayoutProfile,
    eventSettings.internalNotes,
    eventSettings.liveEventShowDoNotPlay,
    eventSettings.liveEventShowGuestRequests,
    eventSettings.liveEventShowMcScript,
    eventSettings.liveEventShowMusicNotes,
    eventSettings.liveEventShowPlanningQuestions,
    eventSettings.liveEventShowPlaylists,
    eventSettings.liveEventShowVendorContacts,
    eventSettings.packageName,
    eventSettings.planningQuestionAnswers,
    eventSettings.venue,
    eventSettings.weddingDate,
    generalDjNotes,
    getPlaylistLines,
    guestRequests,
    mcAnnouncements,
    musicVibeDetail,
    mergedTimelineItems,
    microphoneNeeds,
    mustPlaySongs,
    officiantName,
    parsePlaylistSongLine,
    planningQuestionsForEvent,
    primaryPartyShortLabel,
    sectionCeremonyEnabled,
    sectionDoNotPlayEnabled,
    sectionGuestRequestsEnabled,
    sectionMcScriptEnabled,
    sectionMusicNotesEnabled,
    sectionMustPlayEnabled,
    sectionPlanningQuestionsEnabled,
    sectionPlaylistsEnabled,
    sectionReceptionTimelineEnabled,
    sectionVendorContactsEnabled,
    teamMembers,
    vendors,
    weddingDetails.couple,
    weddingDetails.date,
    weddingDetails.venue,
  ]);

  const persistFeedback: PersistFeedback = useMemo(
    () => ({ phase: persistPhase, hasBaseline: persistBaseline }),
    [persistPhase, persistBaseline],
  );

  const closeRunOfShow = useCallback(() => {
    setRunOfShowOpen(false);
    setRunOfShowAnnotateMode(false);
    runOfShowAnnotationInProgressRef.current = null;
    if (typeof document !== "undefined" && document.fullscreenElement) {
      void document.exitFullscreen();
    }
  }, []);

  const scrollRunOfShowToUpNext = useCallback(() => {
    if (typeof document === "undefined") return;
    const root = runOfShowScrollRef.current;
    const target = root?.querySelector<HTMLElement>("[data-run-of-show-up-next]");
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
      inline: "nearest",
    });
  }, []);

  const persistRunOfShowDoneKeys = useCallback(
    (next: Set<string>) => {
      if (typeof window === "undefined" || !activeEventId) return;
      try {
        const raw = window.localStorage.getItem(RUN_OF_SHOW_DONE_STORAGE_KEY);
        const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
        map[activeEventId] = [...next];
        window.localStorage.setItem(RUN_OF_SHOW_DONE_STORAGE_KEY, JSON.stringify(map));
      } catch {
        /* ignore corrupt storage */
      }
    },
    [activeEventId],
  );

  const persistRunOfShowSectionUi = useCallback(
    (expandedWhileComplete: Set<string>) => {
      if (typeof window === "undefined" || !activeEventId || !hasHydrated) return;
      try {
        const raw = window.localStorage.getItem(RUN_OF_SHOW_SECTION_UI_STORAGE_KEY);
        const map = raw ? (JSON.parse(raw) as Record<string, { expandedWhileComplete?: string[] }>) : {};
        map[activeEventId] = { expandedWhileComplete: [...expandedWhileComplete] };
        window.localStorage.setItem(RUN_OF_SHOW_SECTION_UI_STORAGE_KEY, JSON.stringify(map));
      } catch {
        /* ignore corrupt storage */
      }
    },
    [activeEventId, hasHydrated],
  );

  const persistRunOfShowAnnotations = useCallback(
    (strokes: RunOfShowAnnotationStroke[]) => {
      if (typeof window === "undefined" || !activeEventId || !hasHydrated) return;
      try {
        const raw = window.localStorage.getItem(RUN_OF_SHOW_ANNOTATIONS_STORAGE_KEY);
        const map = raw ? (JSON.parse(raw) as Record<string, RunOfShowAnnotationStroke[]>) : {};
        map[activeEventId] = strokes;
        window.localStorage.setItem(RUN_OF_SHOW_ANNOTATIONS_STORAGE_KEY, JSON.stringify(map));
      } catch {
        /* ignore quota / corrupt storage */
      }
    },
    [activeEventId, hasHydrated],
  );

  const clearRunOfShowAnnotations = useCallback(() => {
    if (runOfShowAnnotationPersistTimerRef.current) {
      window.clearTimeout(runOfShowAnnotationPersistTimerRef.current);
      runOfShowAnnotationPersistTimerRef.current = null;
    }
    setRunOfShowAnnotationStrokes([]);
    persistRunOfShowAnnotations([]);
  }, [persistRunOfShowAnnotations]);

  const undoLastRunOfShowAnnotation = useCallback(() => {
    setRunOfShowAnnotationStrokes((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  }, []);

  const toggleRunOfShowDoneKey = useCallback(
    (key: string) => {
      setRunOfShowDoneKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        persistRunOfShowDoneKeys(next);
        return next;
      });
    },
    [persistRunOfShowDoneKeys],
  );

  const markRunOfShowSectionUserExpanded = useCallback(
    (sectionId: string) => {
      setRunOfShowUserExpandedWhileCompleteIds((prev) => {
        const next = new Set(prev);
        next.add(sectionId);
        persistRunOfShowSectionUi(next);
        return next;
      });
    },
    [persistRunOfShowSectionUi],
  );

  const collapseRunOfShowCompletedSection = useCallback(
    (sectionId: string) => {
      setRunOfShowUserExpandedWhileCompleteIds((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        persistRunOfShowSectionUi(next);
        return next;
      });
    },
    [persistRunOfShowSectionUi],
  );

  const resetRunOfShowDone = useCallback(() => {
    setRunOfShowDoneKeys(new Set());
    setRunOfShowUserExpandedWhileCompleteIds(new Set());
    setRunOfShowAnnotationStrokes([]);
    if (typeof window === "undefined" || !activeEventId) return;
    try {
      const raw = window.localStorage.getItem(RUN_OF_SHOW_DONE_STORAGE_KEY);
      if (raw) {
        const map = JSON.parse(raw) as Record<string, string[]>;
        delete map[activeEventId];
        window.localStorage.setItem(RUN_OF_SHOW_DONE_STORAGE_KEY, JSON.stringify(map));
      }
      const rawSec = window.localStorage.getItem(RUN_OF_SHOW_SECTION_UI_STORAGE_KEY);
      if (rawSec) {
        const mapSec = JSON.parse(rawSec) as Record<string, { expandedWhileComplete?: string[] }>;
        delete mapSec[activeEventId];
        window.localStorage.setItem(RUN_OF_SHOW_SECTION_UI_STORAGE_KEY, JSON.stringify(mapSec));
      }
      const rawAn = window.localStorage.getItem(RUN_OF_SHOW_ANNOTATIONS_STORAGE_KEY);
      if (rawAn) {
        const mapAn = JSON.parse(rawAn) as Record<string, RunOfShowAnnotationStroke[]>;
        delete mapAn[activeEventId];
        window.localStorage.setItem(RUN_OF_SHOW_ANNOTATIONS_STORAGE_KEY, JSON.stringify(mapAn));
      }
    } catch {
      /* ignore */
    }
  }, [activeEventId]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydrated || !activeEventId) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const raw = window.localStorage.getItem(RUN_OF_SHOW_DONE_STORAGE_KEY);
        if (!raw) {
          setRunOfShowDoneKeys(new Set());
        } else {
          const map = JSON.parse(raw) as Record<string, string[]>;
          const keys = map[activeEventId];
          setRunOfShowDoneKeys(new Set(Array.isArray(keys) ? keys : []));
        }
        const rawSec = window.localStorage.getItem(RUN_OF_SHOW_SECTION_UI_STORAGE_KEY);
        if (!rawSec) {
          setRunOfShowUserExpandedWhileCompleteIds(new Set());
        } else {
          const mapSec = JSON.parse(rawSec) as Record<string, { expandedWhileComplete?: string[] }>;
          const row = mapSec[activeEventId];
          const expanded = row?.expandedWhileComplete;
          setRunOfShowUserExpandedWhileCompleteIds(new Set(Array.isArray(expanded) ? expanded : []));
        }
        const rawAn = window.localStorage.getItem(RUN_OF_SHOW_ANNOTATIONS_STORAGE_KEY);
        if (!rawAn) {
          setRunOfShowAnnotationStrokes([]);
        } else {
          const mapAn = JSON.parse(rawAn) as Record<string, RunOfShowAnnotationStroke[]>;
          const ann = mapAn[activeEventId];
          setRunOfShowAnnotationStrokes(
            Array.isArray(ann)
              ? ann.filter(
                  (s) =>
                    s &&
                    Array.isArray(s.points) &&
                    s.points.every((p) => typeof p.x === "number" && typeof p.y === "number"),
                )
              : [],
          );
        }
      } catch {
        setRunOfShowDoneKeys(new Set());
        setRunOfShowUserExpandedWhileCompleteIds(new Set());
        setRunOfShowAnnotationStrokes([]);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [hasHydrated, activeEventId]);

  useEffect(() => {
    if (!hasHydrated || !activeEventId) return;
    /** Run after the hydration load effect (timeout 0) so we prune the loaded expanded set, not an empty default. */
    const t = window.setTimeout(() => {
      setRunOfShowUserExpandedWhileCompleteIds((prev) => {
        const validIds = new Set<string>([RUN_OF_SHOW_CEREMONY_SECTION_ID]);
        for (const phase of runOfShowReceptionPhaseGroups) validIds.add(phase.id);
        const filtered = new Set([...prev].filter((id) => validIds.has(id)));

        const ceremonyAll =
          sectionCeremonyEnabled &&
          ceremonyTimelineItems.length > 0 &&
          ceremonyTimelineItems.every((item) => runOfShowDoneKeys.has(`c:${item.id}`));
        if (!ceremonyAll) filtered.delete(RUN_OF_SHOW_CEREMONY_SECTION_ID);

        for (const phase of runOfShowReceptionPhaseGroups) {
          const allDone = phase.items.every((item) => runOfShowDoneKeys.has(`r:${item.id}`));
          if (!allDone) filtered.delete(phase.id);
        }

        if (filtered.size === prev.size && [...filtered].every((x) => prev.has(x))) return prev;
        persistRunOfShowSectionUi(filtered);
        return filtered;
      });
    }, 1);
    return () => window.clearTimeout(t);
  }, [
    hasHydrated,
    activeEventId,
    runOfShowDoneKeys,
    runOfShowReceptionPhaseGroups,
    ceremonyTimelineItems,
    sectionCeremonyEnabled,
    persistRunOfShowSectionUi,
  ]);

  useEffect(() => {
    if (canAccessRunOfShow) return;
    const t = window.setTimeout(() => setRunOfShowOpen(false), 0);
    return () => window.clearTimeout(t);
  }, [canAccessRunOfShow]);

  useEffect(() => {
    if (!runOfShowAnnotateMode) {
      runOfShowAnnotationInProgressRef.current = null;
    }
  }, [runOfShowAnnotateMode]);

  useEffect(() => {
    if (runOfShowAnnotationPersistTimerRef.current) {
      window.clearTimeout(runOfShowAnnotationPersistTimerRef.current);
      runOfShowAnnotationPersistTimerRef.current = null;
    }
    if (!hasHydrated || !activeEventId) return;
    runOfShowAnnotationPersistTimerRef.current = window.setTimeout(() => {
      persistRunOfShowAnnotations(runOfShowAnnotationStrokes);
      runOfShowAnnotationPersistTimerRef.current = null;
    }, 450);
    return () => {
      if (runOfShowAnnotationPersistTimerRef.current) {
        window.clearTimeout(runOfShowAnnotationPersistTimerRef.current);
        runOfShowAnnotationPersistTimerRef.current = null;
      }
    };
  }, [runOfShowAnnotationStrokes, hasHydrated, activeEventId, persistRunOfShowAnnotations]);

  useLayoutEffect(() => {
    if (!runOfShowOverlayActive) return;
    const main = runOfShowScrollRef.current;
    if (!main) return;
    const inner = main.querySelector<HTMLElement>("[data-run-of-show-inner]");
    const measure = () => {
      const w = main.clientWidth;
      const h = Math.max(main.scrollHeight, main.clientHeight);
      runOfShowAnnotationCanvasSizeRef.current = { w, h };
      setRunOfShowAnnotationCanvasSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(main);
    if (inner) ro.observe(inner);
    main.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      main.removeEventListener("scroll", measure);
    };
  }, [runOfShowOverlayActive]);

  useEffect(() => {
    if (!runOfShowOverlayActive) return;
    const canvas = runOfShowAnnotationCanvasRef.current;
    if (!canvas || runOfShowAnnotationCanvasSize.w <= 0 || runOfShowAnnotationCanvasSize.h <= 0) return;
    redrawRunOfShowAnnotationCanvas(
      canvas,
      runOfShowAnnotationStrokes,
      null,
      runOfShowAnnotationCanvasSize.w,
      runOfShowAnnotationCanvasSize.h,
    );
  }, [
    runOfShowOverlayActive,
    runOfShowAnnotationStrokes,
    runOfShowAnnotationCanvasSize.w,
    runOfShowAnnotationCanvasSize.h,
  ]);

  useEffect(() => {
    if (!runOfShowOverlayActive || !runOfShowAnnotateMode) return;
    const canvas = runOfShowAnnotationCanvasRef.current;
    const main = runOfShowScrollRef.current;
    if (!canvas || !main) return;

    const scheduleFlush = () => {
      if (runOfShowAnnotationPointerRafRef.current != null) return;
      runOfShowAnnotationPointerRafRef.current = window.requestAnimationFrame(() => {
        runOfShowAnnotationPointerRafRef.current = null;
        const c = runOfShowAnnotationCanvasRef.current;
        if (!c) return;
        redrawRunOfShowAnnotationCanvas(
          c,
          runOfShowAnnotationStrokesRef.current,
          runOfShowAnnotationInProgressRef.current,
          runOfShowAnnotationCanvasSizeRef.current.w,
          runOfShowAnnotationCanvasSizeRef.current.h,
        );
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType !== "mouse" && e.pointerType !== "pen" && e.pointerType !== "touch") return;
      e.preventDefault();
      runOfShowAnnotationInProgressRef.current = [
        runOfShowClientToContentCoords(e.clientX, e.clientY, main),
      ];
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      scheduleFlush();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!runOfShowAnnotationInProgressRef.current) return;
      if (e.cancelable) e.preventDefault();
      runOfShowAnnotationInProgressRef.current.push(
        runOfShowClientToContentCoords(e.clientX, e.clientY, main),
      );
      scheduleFlush();
    };

    const finishStroke = (e: PointerEvent) => {
      const stroke = runOfShowAnnotationInProgressRef.current;
      runOfShowAnnotationInProgressRef.current = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (stroke && stroke.length > 0) {
        setRunOfShowAnnotationStrokes((prev) => [...prev, { points: stroke }]);
      }
      scheduleFlush();
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", finishStroke);
    canvas.addEventListener("pointercancel", finishStroke);

    return () => {
      if (runOfShowAnnotationPointerRafRef.current != null) {
        window.cancelAnimationFrame(runOfShowAnnotationPointerRafRef.current);
        runOfShowAnnotationPointerRafRef.current = null;
      }
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", finishStroke);
      canvas.removeEventListener("pointercancel", finishStroke);
    };
  }, [runOfShowOverlayActive, runOfShowAnnotateMode]);

  const toggleRunOfShowFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Unsupported or denied — ignore.
    }
  }, []);

  const copyLiveEventText = async () => {
    try {
      await navigator.clipboard.writeText(liveEventText);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus(""), 2200);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-stone-900">
        <main className="mx-auto w-full max-w-md overflow-x-hidden px-4 pb-32 pt-5 sm:px-5">
          <AppHeader
            screenTitle={
              appMode === "events"
                ? navLabel(activeScreen)
                : appMode === "event" &&
                    (currentRole ?? rolePreview) === "Couple" &&
                    activeScreen === "Dashboard"
                  ? eventSettings.eventName || weddingDetails.couple || "Your celebration"
                  : screenTitle
            }
            weddingDetails={weddingDetails}
            persistFeedback={{ phase: "idle", hasBaseline: false }}
            appSettings={{
              ...appSettings,
              coupleWelcomeMessage: effectiveCoupleWelcomeMessage,
              logoUrl: appSettings.logoUrl.startsWith("/") ? appSettings.logoUrl : "/cmm-logo-white.png",
            }}
          />
          <section className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PremiumCard key={`skeleton-${index}`} className="animate-pulse">
                <div className="h-4 w-1/2 rounded bg-stone-200/80" />
                <div className="mt-3 h-3 w-full rounded bg-stone-100" />
                <div className="mt-2 h-3 w-4/5 rounded bg-stone-100" />
                <div className="mt-4 h-10 w-full rounded-xl bg-stone-200/70" />
              </PremiumCard>
            ))}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-stone-900">
      {showDesktopSidebar && (
        <aside className="no-print fixed left-5 top-5 z-30 hidden h-[calc(100vh-2.5rem)] w-60 overflow-y-auto rounded-2xl border border-stone-300 bg-white p-4 shadow-none lg:block">
          <p className="px-2 text-[11px] uppercase tracking-[0.14em] text-stone-500">
            {appMode === "events" ? "Workspace Mode" : "Event Mode"}
          </p>
          <div className="mt-3 space-y-2">
            {currentNavItems.map((item) => (
              <PrimaryButton
                key={`desktop-nav-${item}`}
                onClick={() => setActiveScreen(item)}
                className={`w-full justify-start rounded-xl border px-3 text-left ${
                  shellNavActiveScreen === item
                    ? "border-black bg-[#00D4FF] font-semibold text-black shadow-none"
                    : "border-stone-300 bg-white text-stone-800 hover:border-stone-900 hover:bg-stone-50"
                }`}
              >
                {navLabel(item)}
              </PrimaryButton>
            ))}
          </div>
        </aside>
      )}
      <main
        className={`mx-auto w-full max-w-full overflow-x-hidden px-4 pb-36 pt-5 transition-all max-lg:pb-40 sm:px-5 lg:pb-10 ${
          showDesktopSidebar
            ? "max-w-[1400px] lg:pl-[17.5rem] lg:pr-6"
            : "max-w-6xl"
        }`}
      >
        <AppHeader
          screenTitle={
            appMode === "events"
              ? navLabel(activeScreen)
              : appMode === "event" &&
                  (currentRole ?? rolePreview) === "Couple" &&
                  activeScreen === "Dashboard"
                ? eventSettings.eventName || weddingDetails.couple || "Your celebration"
                : screenTitle
          }
          weddingDetails={weddingDetails}
          persistFeedback={persistFeedback}
          appSettings={{
            ...appSettings,
            coupleWelcomeMessage: effectiveCoupleWelcomeMessage,
            logoUrl: appSettings.logoUrl.startsWith("/") ? appSettings.logoUrl : "/cmm-logo-white.png",
          }}
        />

        {authStage === "app" && (
          <div className="no-print mt-4 flex flex-col gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs shadow-none sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-stone-600">
                Viewing as{" "}
                <span className="font-semibold text-stone-950">
                  {perspectiveRoleLabel(currentRole ?? rolePreview)}
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PERSPECTIVE_ROLES.map((role) => (
                  <PrimaryButton
                    key={`perspective-${role}`}
                    type="button"
                    onClick={() => switchPerspectiveRole(role)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] ${
                      (currentRole ?? rolePreview) === role
                        ? "border border-black bg-[#00D4FF] font-semibold text-black shadow-none"
                        : "border border-stone-300 bg-white font-medium text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {perspectiveRoleLabel(role)}
                  </PrimaryButton>
                ))}
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col items-end gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              {(persistPhase !== "idle" || persistBaseline) && (
                <p
                  className="text-right text-[10px] font-medium leading-tight text-stone-500 sm:max-w-[10rem]"
                  aria-live="polite"
                >
                  {persistPhase === "pending"
                    ? "Saving…"
                    : persistPhase === "saved"
                      ? "Saved just now"
                      : "All changes saved"}
                </p>
              )}
              <div className="flex items-center gap-2">
              <PrimaryButton
                onClick={() => setActiveScreen("Notification Center")}
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-900 shadow-none hover:bg-stone-50"
              >
                Notifications
                {unreadBadgeCount > 0 && (
                  <span className="ml-1 rounded-full border border-black bg-[#00D4FF] px-1.5 py-0.5 text-[10px] font-bold text-black">
                    {unreadBadgeCount}
                  </span>
                )}
              </PrimaryButton>
              <PrimaryButton
                onClick={() => setAuthStage("login")}
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-900 shadow-none hover:bg-stone-50"
              >
                Sign out
              </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {authStage === "login" && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#00D4FF]/25 bg-zinc-950 border-zinc-800">
              <SectionTitle className="!text-zinc-100">Welcome to {appSettings.appName}</SectionTitle>
              <p className="mt-2 text-xs text-zinc-400">
                Prototype login for role-based planning access.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(["Admin", "DJ", "Couple", "Planner"] as UserRole[]).map((role) => (
                  <PrimaryButton
                    key={`login-${role}`}
                    onClick={() => {
                      setCurrentRole(role);
                      setRolePreview(role);

                      const pinned = activeEventId ? events.find((e) => e.id === activeEventId) : undefined;

                      let targetEvt: EventRecord | undefined;

                      if (pinned) {
                        targetEvt = pinned;
                      } else if (role === "Admin") {
                        targetEvt = events[0];
                      } else if (role === "DJ") {
                        const activeDj = teamMembers.find((m) => m.role === "DJ" && m.isActive);
                        if (activeDj) {
                          targetEvt = events.find(
                            (evt) =>
                              evt.settings?.assignedDj === activeDj.id ||
                              evt.settings?.assignedDj === activeDj.name,
                          );
                        }
                        if (!targetEvt) targetEvt = events[0];
                      } else {
                        targetEvt =
                          events.find((evt) =>
                            (evt.collaborators ?? []).some(
                              (c) => c.role === role && c.status === "Accepted",
                            ),
                          ) ?? events[0];
                      }

                      if (targetEvt) {
                        setActiveEventId(targetEvt.id);
                        loadEventPlanningIntoWorkingState(targetEvt);
                      }

                      const sameEventAsBefore = Boolean(
                        pinned && targetEvt && pinned.id === targetEvt.id,
                      );

                      const nextAppMode: AppMode =
                        role === "Couple"
                          ? "event"
                          : sameEventAsBefore && appMode === "event"
                            ? "event"
                            : "events";

                      setAppMode(nextAppMode);

                      let nextScreen: Screen;

                      if (sameEventAsBefore && targetEvt) {
                        let m = activeScreen;
                        const hubEligible =
                          (targetEvt.settings?.sectionReceptionTimelineEnabled ?? true) ||
                          (false);

                        if (m === "Reception Hub" && role !== "Couple") {
                          m = hubEligible ? "Reception Timeline" : "Timeline";
                        }
                        if (m === "Event Settings" && role === "DJ") {
                          m = "Dashboard";
                        }

                        if (nextAppMode === "event") {
                          const flags = eventNavFlagsFromRecord(targetEvt);
                          const eventNav = buildEventNavItemsForRole(role, flags);
                          const extras: Screen[] = [];
                          if (
                            hubEligible &&
                            ((targetEvt.settings?.sectionReceptionTimelineEnabled ?? true) ||
                              (false))
                          ) {
                            extras.push("Reception Timeline");
                          }
                          const allowed = [...eventNav, ...extras];
                          nextScreen = allowed.includes(m)
                            ? m
                            : eventNav.includes("Dashboard")
                              ? "Dashboard"
                              : (eventNav[0] ?? "Dashboard");
                        } else {
                          const wsNav = getWorkspaceNavItemsForRole(role);
                          nextScreen = wsNav.includes(m)
                            ? m
                            : role === "Admin" || role === "DJ"
                              ? "Command Center"
                              : "All Events";
                        }
                      } else {
                        nextScreen =
                          role === "Couple"
                            ? "Dashboard"
                            : role === "Admin" || role === "DJ"
                              ? "Command Center"
                              : "All Events";
                      }

                      setActiveScreen(nextScreen);
                      setAuthStage("app");
                    }}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50"
                  >
                    Continue as {perspectiveRoleLabel(role)}
                  </PrimaryButton>
                ))}
              </div>
              {inviteAccessPreview && (
                <PrimaryButton
                  onClick={() => setAuthStage("invite")}
                  className="mt-4 w-full rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-black shadow-none hover:brightness-[0.97]"
                >
                  Open Magic Invite Link
                </PrimaryButton>
              )}
            </PremiumCard>
          </section>
        )}

        {authStage === "invite" && inviteAccessPreview && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-stone-300 bg-white shadow-none">
              <SectionTitle className="text-stone-950">
                {INVITE_PREVIEW_TITLE[inviteLayoutProfile]}
              </SectionTitle>
              <div className="mt-3 space-y-1 text-xs text-zinc-300">
                <p>
                  Event: {invitePreviewEvent?.settings?.eventName || invitePreviewEvent?.meta.couple || "Event"}
                </p>
                <p>
                  Date: {invitePreviewEvent?.settings?.weddingDate || invitePreviewEvent?.meta.date || "TBD"}
                </p>
                <p>Venue: {invitePreviewEvent?.settings?.venue || invitePreviewEvent?.meta.venue || "TBD"}</p>
                <p>Role: {inviteAccessPreview.role}</p>
                <p className="break-all text-zinc-500">{inviteAccessPreview.link}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={() => setAuthStage("login")}
                  className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-white/15"
                >
                  Back
                </PrimaryButton>
                <PrimaryButton
                  onClick={() => {
                    const evt = events.find((e) => e.id === inviteAccessPreview.eventId);
                    if (evt) {
                      setCurrentRole(inviteAccessPreview.role);
                      setRolePreview(inviteAccessPreview.role);
                      setActiveEventId(evt.id);
                      loadEventPlanningIntoWorkingState(evt);
                      setAppMode("event");
                      setActiveScreen("Dashboard");
                    }
                    setAuthStage("app");
                  }}
                  className="w-full rounded-xl bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-black hover:brightness-110"
                >
                  Start Planning
                </PrimaryButton>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "Settings" && (
          <section className="mt-6 space-y-3">
            {!canManageEvents && (
              <PremiumCard className="border-amber-200/90 bg-amber-50">
                <p className="text-xs font-medium leading-relaxed text-amber-950">Global Settings are admin-only.</p>
              </PremiumCard>
            )}
            <PremiumCard>
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-stone-950">Global Admin Settings</SectionTitle>
                <PrimaryButton
                  onClick={() => setActiveScreen("All Events")}
                  className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
                >
                  Back to Events
                </PrimaryButton>
              </div>
              <p className="mt-2 text-xs text-stone-600">
                Global settings apply across all events and are stored outside event records.
              </p>

              <div className="mt-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-4">
                <aside className="hidden md:block">
                  <div className="sticky top-4 rounded-xl border border-stone-200 bg-stone-50 p-2">
                    <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
                      Settings Sections
                    </p>
                    <div className="mt-1 space-y-1">
                      {GLOBAL_SETTINGS_SECTIONS.map((section) => (
                        <PrimaryButton
                          key={`settings-side-${section}`}
                          onClick={() => setActiveGlobalSettingsSection(section)}
                          className={`w-full justify-start rounded-lg px-2.5 py-2 text-left text-[11px] font-medium ${
                            activeGlobalSettingsSection === section
                              ? "bg-[#00D4FF] text-stone-950 shadow-sm hover:brightness-105"
                              : "bg-transparent text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {section}
                        </PrimaryButton>
                      ))}
                    </div>
                  </div>
                </aside>

                <div>
                  <div className="sticky top-0 z-10 -mx-2 overflow-x-auto border-y border-stone-200 bg-stone-100 px-2 py-2 md:hidden">
                    <div className="flex gap-2">
                      {GLOBAL_SETTINGS_SECTIONS.map((section) => (
                        <PrimaryButton
                          key={`settings-tab-${section}`}
                          onClick={() => setActiveGlobalSettingsSection(section)}
                          className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
                            activeGlobalSettingsSection === section
                              ? "border-cyan-500/40 bg-[#00D4FF] text-stone-950 shadow-sm hover:brightness-105"
                              : "border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-50"
                          }`}
                        >
                          {section}
                        </PrimaryButton>
                      ))}
                    </div>
                  </div>

              {activeGlobalSettingsSection === "Event Types" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-stone-950">Event Types</SectionTitle>
                  <TextInput
                    id="global-event-type"
                    label="Default Event Type"
                    value={appSettings.defaultEventType}
                    onChange={(value) => setAppSettings((prev) => ({ ...prev, defaultEventType: value }))}
                    disabled={!canManageEvents}
                  />
                  <div className="space-y-2">
                    {EVENT_TYPES.map((profile) => {
                      const defaults = getLayoutProfileDefaults(profile);
                      return (
                        <div key={`etype-${profile}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                          <p className="text-sm font-semibold text-stone-950">{profile}</p>
                          <p className="mt-1 text-xs text-stone-600">
                            {LAYOUT_PROFILE_DESCRIPTIONS[profile]}
                          </p>
                          <p className="mt-2 text-[11px] text-stone-600">
                            Default sections: {getEnabledSectionLabels(profile, defaults).join(", ")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeGlobalSettingsSection === "Planning Questions" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-stone-950">Planning Question Sets</SectionTitle>
                  <p className="text-xs leading-relaxed text-stone-600">
                    Customize planning questions by Event Type. Existing event answers remain saved even if questions are hidden or removed.
                  </p>
                  {EVENT_TYPES.map((profile) => {
                    const questions = planningQuestionSetsForSettings[profile] ?? [];
                    return (
                      <div key={`pqset-${profile}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-stone-950">{profile}</p>
                          <div className="flex gap-2">
                            <PrimaryButton
                              onClick={() => addPlanningQuestionToSet(profile)}
                              disabled={!canManageEvents}
                              className="rounded-lg bg-[#00D4FF] px-2 py-1.5 text-[11px] font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-50"
                            >
                              Add Question
                            </PrimaryButton>
                            <PrimaryButton
                              onClick={() => resetPlanningQuestionSet(profile)}
                              disabled={!canManageEvents}
                              className="rounded-lg border border-stone-300 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-800 shadow-sm hover:bg-stone-100 disabled:opacity-50"
                            >
                              Reset Defaults
                            </PrimaryButton>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-stone-600">
                          Default set: {getPlanningQuestionsForProfile(profile).length} questions · Current set: {questions.length}
                        </p>
                        <div className="mt-3 space-y-2">
                          {questions.map((question, index) => (
                            <div key={`pq-row-${profile}-${question.id}`} className="rounded-lg border border-stone-200 bg-white p-2.5">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <TextInput
                                  id={`pq-label-${profile}-${question.id}`}
                                  label="Question Label"
                                  value={question.label}
                                  onChange={(value) =>
                                    updatePlanningQuestionSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === question.id ? { ...item, label: value } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                                <TextInput
                                  id={`pq-help-${profile}-${question.id}`}
                                  label="Help Text / Description"
                                  value={question.helpText ?? ""}
                                  onChange={(value) =>
                                    updatePlanningQuestionSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === question.id ? { ...item, helpText: value } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                                <div>
                                  <label className={lightUiFormLabelClass}>Answer Type</label>
                                  <select
                                    value={question.answerType}
                                    onChange={(event) =>
                                      updatePlanningQuestionSet(profile, (items) =>
                                        items.map((item) =>
                                          item.id === question.id
                                            ? { ...item, answerType: event.target.value as PlanningQuestionAnswerType }
                                            : item,
                                        ),
                                      )
                                    }
                                    disabled={!canManageEvents}
                                    className={lightUiSelectClass}
                                  >
                                    {QUESTION_ANSWER_TYPES.map((type) => (
                                      <option key={`pq-type-${type.value}`} value={type.value} className="bg-white text-stone-900">
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <TextInput
                                  id={`pq-placeholder-${profile}-${question.id}`}
                                  label="Placeholder"
                                  value={question.placeholder ?? ""}
                                  onChange={(value) =>
                                    updatePlanningQuestionSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === question.id ? { ...item, placeholder: value } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                              </div>
                              {question.answerType === "multiple_choice" && (
                                <TextInput
                                  id={`pq-options-${profile}-${question.id}`}
                                  label="Multiple Choice Options (comma-separated)"
                                  value={(question.options ?? []).join(", ")}
                                  onChange={(value) =>
                                    updatePlanningQuestionSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === question.id
                                          ? {
                                              ...item,
                                              options: value
                                                .split(",")
                                                .map((part) => part.trim())
                                                .filter(Boolean),
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                              )}
                              <div className="mt-2 flex flex-wrap gap-2">
                                <PrimaryButton
                                  onClick={() =>
                                    updatePlanningQuestionSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === question.id ? { ...item, required: !item.required } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                  className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${question.required ? "bg-[#00D4FF] text-stone-950 shadow-sm hover:brightness-105" : "border border-stone-300 bg-stone-50 text-stone-700 shadow-sm hover:bg-stone-100"} disabled:opacity-50`}
                                >
                                  {question.required ? "Required" : "Optional"}
                                </PrimaryButton>
                                <PrimaryButton
                                  onClick={() =>
                                    updatePlanningQuestionSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === question.id
                                          ? { ...item, showInLiveEventMode: !item.showInLiveEventMode }
                                          : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                  className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${question.showInLiveEventMode ? "bg-[#00D4FF] text-stone-950 shadow-sm hover:brightness-105" : "border border-stone-300 bg-stone-50 text-stone-700 shadow-sm hover:bg-stone-100"} disabled:opacity-50`}
                                >
                                  {question.showInLiveEventMode ? "Shown in Event Document" : "Hidden in Event Document"}
                                </PrimaryButton>
                                <PrimaryButton
                                  onClick={() =>
                                    updatePlanningQuestionSet(profile, (items) => {
                                      if (index === 0) return items;
                                      const next = [...items];
                                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                      return next;
                                    })
                                  }
                                  disabled={!canManageEvents || index === 0}
                                  className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-40"
                                >
                                  Move Up
                                </PrimaryButton>
                                <PrimaryButton
                                  onClick={() =>
                                    updatePlanningQuestionSet(profile, (items) => {
                                      if (index >= items.length - 1) return items;
                                      const next = [...items];
                                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                      return next;
                                    })
                                  }
                                  disabled={!canManageEvents || index >= questions.length - 1}
                                  className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-40"
                                >
                                  Move Down
                                </PrimaryButton>
                                <PrimaryButton
                                  onClick={() =>
                                    updatePlanningQuestionSet(profile, (items) =>
                                      items.filter((item) => item.id !== question.id),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                  className="rounded-lg border border-rose-300/90 bg-rose-50 px-2 py-1.5 text-[11px] font-semibold text-rose-950 shadow-sm hover:bg-rose-100/90 disabled:opacity-50"
                                >
                                  Delete
                                </PrimaryButton>
                              </div>
                            </div>
                          ))}
                          {questions.length === 0 && (
                            <p className="text-xs text-stone-600">No questions configured. Add your first question for this Event Type.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeGlobalSettingsSection === "Timeline Presets" && (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <SectionTitle className="text-stone-950">Timeline Presets</SectionTitle>
                      <p className="max-w-xl text-xs leading-relaxed text-stone-600">
                        One modular card per Event Type. Collapsed cards show a compact flow preview; expand to add,
                        reorder, or refine moments. Defaults apply to new events and “Apply presets” actions.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <PrimaryButton
                        type="button"
                        onClick={() =>
                          setTimelinePresetExpandedByProfile(
                            EVENT_TYPES.reduce<Partial<Record<EventLayoutProfile, boolean>>>((acc, p) => {
                              acc[p] = true;
                              return acc;
                            }, {}),
                          )
                        }
                        className={lightUiSecondaryButtonClass}
                      >
                        Expand all
                      </PrimaryButton>
                      <PrimaryButton
                        type="button"
                        onClick={() => setTimelinePresetExpandedByProfile({})}
                        className={lightUiSecondaryButtonClass}
                      >
                        Collapse all
                      </PrimaryButton>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-3">
                    {EVENT_TYPES.map((profile) => {
                      const presets = timelinePresetSetsForSettings[profile] ?? [];
                      const defaultCount = (getDefaultTimelinePresetSets()[profile] ?? []).length;
                      const expanded = timelinePresetExpandedByProfile[profile] === true;
                      const ceremonyCount = presets.filter((p) => p.timelineType === "ceremony").length;
                      const mainCount = presets.filter((p) => p.timelineType === "main").length;
                      const previewLabels = presets.map((p) => p.momentName.trim()).filter(Boolean);
                      const previewLine =
                        previewLabels.length === 0
                          ? "No moments yet — expand to add."
                          : `${previewLabels.slice(0, 6).join(" → ")}${previewLabels.length > 6 ? " → …" : ""}`;

                      return (
                        <div
                          key={`tpset-${profile}`}
                          className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-none"
                        >
                          <button
                            type="button"
                            className="flex min-h-[3.25rem] w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/[0.04] sm:min-h-0 sm:gap-4 sm:px-5 sm:py-3.5"
                            onClick={() =>
                              setTimelinePresetExpandedByProfile((prev) => ({
                                ...prev,
                                [profile]: !expanded,
                              }))
                            }
                            aria-expanded={expanded}
                          >
                            <span className="mt-0.5 shrink-0 font-mono text-zinc-500" aria-hidden>
                              {expanded ? "▼" : "▶"}
                            </span>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm font-semibold tracking-tight text-zinc-100">{profile}</span>
                                <span className="rounded-full border border-cyan-500/35 bg-[#00D4FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-950">
                                  {presets.length} moment{presets.length === 1 ? "" : "s"}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  {ceremonyCount} ceremony · {mainCount} main · defaults {defaultCount}
                                </span>
                              </div>
                              {!expanded && (
                                <p className="line-clamp-2 text-[13px] leading-snug text-zinc-300">{previewLine}</p>
                              )}
                            </div>
                          </button>

                          {expanded && (
                            <div className="border-t border-white/10 px-4 pb-4 pt-1 sm:px-5">
                              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
                                <PrimaryButton
                                  type="button"
                                  onClick={() => addTimelinePresetToSet(profile)}
                                  disabled={!canManageEvents}
                                  className={darkUiAccentPrimaryButtonClass}
                                >
                                  + Add moment
                                </PrimaryButton>
                                <PrimaryButton
                                  type="button"
                                  onClick={() => {
                                    if (
                                      typeof window !== "undefined" &&
                                      !window.confirm(
                                        `Reset “${profile}” timeline presets to built-in defaults? Custom edits for this event type will be replaced.`,
                                      )
                                    ) {
                                      return;
                                    }
                                    resetTimelinePresetSet(profile);
                                  }}
                                  disabled={!canManageEvents}
                                  className={darkUiSecondaryOutlineButtonClass}
                                >
                                  Reset to default
                                </PrimaryButton>
                                <span className="ml-auto text-[10px] text-zinc-500">
                                  Drag ⋮⋮ to reorder · duplicate creates a copy below
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {presets.map((preset, index) => (
                                  <div
                                    key={`tp-row-${profile}-${preset.id}`}
                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-3.5"
                                    onDragOver={(e) => {
                                      if (!canManageEvents) return;
                                      e.preventDefault();
                                      e.dataTransfer.dropEffect = "move";
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const src = timelinePresetDragRef.current;
                                      if (!src || src.profile !== profile) return;
                                      reorderTimelinePresetRows(profile, src.index, index);
                                      timelinePresetDragRef.current = null;
                                    }}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                      <div
                                        className={`flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2 py-3 text-zinc-500 sm:py-6 ${
                                          canManageEvents ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50"
                                        }`}
                                        draggable={canManageEvents}
                                        title="Drag to reorder"
                                        onDragStart={(e) => {
                                          if (!canManageEvents) return;
                                          timelinePresetDragRef.current = { profile, index };
                                          e.dataTransfer.effectAllowed = "move";
                                          e.dataTransfer.setData("text/plain", String(index));
                                        }}
                                        onDragEnd={() => {
                                          timelinePresetDragRef.current = null;
                                        }}
                                        role="presentation"
                                      >
                                        <span className="select-none text-sm leading-none tracking-tighter text-zinc-500">
                                          ⋮⋮
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1 space-y-2.5">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-3 lg:gap-y-2">
                                          <div className="lg:col-span-2">
                                            <label className={darkUiFieldLabelClass}>Type</label>
                                            <select
                                              value={preset.timelineType}
                                              onChange={(event) =>
                                                updateTimelinePresetSet(profile, (items) =>
                                                  items.map((item) =>
                                                    item.id === preset.id
                                                      ? {
                                                          ...item,
                                                          timelineType: event.target.value as "ceremony" | "main",
                                                        }
                                                      : item,
                                                  ),
                                                )
                                              }
                                              disabled={!canManageEvents}
                                              className={darkUiSelectClass}
                                            >
                                              <option value="ceremony" className="bg-zinc-950 text-zinc-100">
                                                Ceremony
                                              </option>
                                              <option value="main" className="bg-zinc-950 text-zinc-100">
                                                Main Event
                                              </option>
                                            </select>
                                          </div>
                                          <div className="lg:col-span-2">
                                            <TextInput
                                              id={`tp-time-${profile}-${preset.id}`}
                                              label="Time / order"
                                              value={preset.timeOrOrder}
                                              onChange={(value) =>
                                                updateTimelinePresetSet(profile, (items) =>
                                                  items.map((item) =>
                                                    item.id === preset.id ? { ...item, timeOrOrder: value } : item,
                                                  ),
                                                )
                                              }
                                              disabled={!canManageEvents}
                                              inputClassName={darkUiInputClass}
                                              labelClassName={darkUiFieldLabelClass}
                                            />
                                          </div>
                                          <div className="lg:col-span-4">
                                            <TextInput
                                              id={`tp-moment-${profile}-${preset.id}`}
                                              label="Moment name"
                                              value={preset.momentName}
                                              onChange={(value) =>
                                                updateTimelinePresetSet(profile, (items) =>
                                                  items.map((item) =>
                                                    item.id === preset.id ? { ...item, momentName: value } : item,
                                                  ),
                                                )
                                              }
                                              disabled={!canManageEvents}
                                              inputClassName={darkUiInputClass}
                                              labelClassName={darkUiFieldLabelClass}
                                            />
                                          </div>
                                          <div className="lg:col-span-4">
                                            <TextInput
                                              id={`tp-song-${profile}-${preset.id}`}
                                              label="Song placeholder"
                                              value={preset.songPlaceholder}
                                              onChange={(value) =>
                                                updateTimelinePresetSet(profile, (items) =>
                                                  items.map((item) =>
                                                    item.id === preset.id ? { ...item, songPlaceholder: value } : item,
                                                  ),
                                                )
                                              }
                                              disabled={!canManageEvents}
                                              inputClassName={darkUiInputClass}
                                              labelClassName={darkUiFieldLabelClass}
                                            />
                                          </div>
                                          <div className="sm:col-span-2 lg:col-span-12">
                                            <TextInput
                                              id={`tp-notes-${profile}-${preset.id}`}
                                              label="Notes placeholder"
                                              value={preset.notesPlaceholder}
                                              onChange={(value) =>
                                                updateTimelinePresetSet(profile, (items) =>
                                                  items.map((item) =>
                                                    item.id === preset.id ? { ...item, notesPlaceholder: value } : item,
                                                  ),
                                                )
                                              }
                                              disabled={!canManageEvents}
                                              inputClassName={darkUiInputClass}
                                              labelClassName={darkUiFieldLabelClass}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-2.5">
                                          <PrimaryButton
                                            type="button"
                                            onClick={() =>
                                              updateTimelinePresetSet(profile, (items) =>
                                                items.map((item) =>
                                                  item.id === preset.id
                                                    ? { ...item, defaultIncluded: !item.defaultIncluded }
                                                    : item,
                                                ),
                                              )
                                            }
                                            disabled={!canManageEvents}
                                            className={
                                              preset.defaultIncluded
                                                ? "rounded-lg bg-[#00D4FF] px-2.5 py-1.5 text-[11px] font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-50"
                                                : darkUiCompactGhostButtonClass
                                            }
                                          >
                                            {preset.defaultIncluded ? "Included by default" : "Excluded by default"}
                                          </PrimaryButton>
                                          <PrimaryButton
                                            type="button"
                                            onClick={() =>
                                              updateTimelinePresetSet(profile, (items) => {
                                                if (index === 0) return items;
                                                const next = [...items];
                                                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                                return next;
                                              })
                                            }
                                            disabled={!canManageEvents || index === 0}
                                            className={`${darkUiCompactGhostButtonClass} disabled:opacity-40`}
                                          >
                                            Up
                                          </PrimaryButton>
                                          <PrimaryButton
                                            type="button"
                                            onClick={() =>
                                              updateTimelinePresetSet(profile, (items) => {
                                                if (index >= items.length - 1) return items;
                                                const next = [...items];
                                                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                                return next;
                                              })
                                            }
                                            disabled={!canManageEvents || index >= presets.length - 1}
                                            className={`${darkUiCompactGhostButtonClass} disabled:opacity-40`}
                                          >
                                            Down
                                          </PrimaryButton>
                                          <PrimaryButton
                                            type="button"
                                            onClick={() => duplicateTimelinePresetMoment(profile, index)}
                                            disabled={!canManageEvents}
                                            className={darkUiCompactGhostButtonClass}
                                          >
                                            Duplicate
                                          </PrimaryButton>
                                          <PrimaryButton
                                            type="button"
                                            onClick={() =>
                                              updateTimelinePresetSet(profile, (items) =>
                                                items.filter((item) => item.id !== preset.id),
                                              )
                                            }
                                            disabled={!canManageEvents}
                                            className={darkUiDangerGhostButtonClass}
                                          >
                                            Delete
                                          </PrimaryButton>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {presets.length === 0 && (
                                  <p className={darkUiEmptyStateInPanelClass}>
                                    No moments yet. Use{" "}
                                    <span className="font-semibold text-zinc-200">Add moment</span> to create your first preset row.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeGlobalSettingsSection === "Event Document" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-stone-950">Event Document</SectionTitle>
                  <p className="text-xs leading-relaxed text-stone-600">Defaults for the printable Event Document. Live Event Mode refers to the same export.</p>
                  <TextArea
                    id="global-prep-footer"
                    label="Default Event Document Footer"
                    value={appSettings.prepSheetFooterText}
                    onChange={(value) => setAppSettings((prev) => ({ ...prev, prepSheetFooterText: value }))}
                    rows={3}
                    disabled={!canManageEvents}
                  />
                  <TextArea
                    id="global-guest-msg"
                    label="Default Guest Request Message"
                    value={appSettings.publicGuestRequestMessage}
                    onChange={(value) => setAppSettings((prev) => ({ ...prev, publicGuestRequestMessage: value }))}
                    rows={3}
                    disabled={!canManageEvents}
                  />
                  <TextInput
                    id="global-couple-welcome"
                    label="Default Welcome Message"
                    value={appSettings.coupleWelcomeMessage}
                    onChange={(value) => setAppSettings((prev) => ({ ...prev, coupleWelcomeMessage: value }))}
                    disabled={!canManageEvents}
                  />
                  <div className="space-y-2">
                    {EVENT_TYPES.map((profile) => {
                      const liveDefaults = getLiveEventDocumentDefaults(profile);
                      return (
                        <div key={`live-defaults-${profile}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                          <p className="font-semibold text-stone-950">{profile}</p>
                          <p className="mt-1 text-stone-600">
                            Music Notes: {liveDefaults.liveEventShowMusicNotes ? "On" : "Off"} ·
                            Do Not Play: {liveDefaults.liveEventShowDoNotPlay ? "On" : "Off"} ·
                            Vendors: {liveDefaults.liveEventShowVendorContacts ? "On" : "Off"} ·
                            MC: {liveDefaults.liveEventShowMcScript ? "On" : "Off"} ·
                            Playlists: {liveDefaults.liveEventShowPlaylists ? "On" : "Off"} ·
                            Questions: {liveDefaults.liveEventShowPlanningQuestions ? "On" : "Off"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeGlobalSettingsSection === "Team Management" && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SectionTitle className="text-stone-950">Team Management</SectionTitle>
                    <PrimaryButton
                      onClick={openAddTeamMemberModal}
                      disabled={!canManageEvents}
                      className="w-full shrink-0 rounded-xl bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-50 sm:w-auto sm:py-2"
                    >
                      Add Team Member
                    </PrimaryButton>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-600">
                    Manage users, role assignments, and planning permissions at the account level.
                  </p>
                  <p className="text-xs leading-relaxed text-stone-600">
                    Remove from Event unassigns someone from the event you last had selected (DJ assignment or planner fields that match a roster member) without deleting them from the team. To delete a profile entirely, use{" "}
                    <span className="font-medium text-stone-800">Workspace → Team → Delete from Team</span>.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-2 py-2.5 text-stone-600 sm:px-3 sm:py-2">
                      Admins:{" "}
                      <span className="font-semibold text-stone-950">{teamMembers.filter((m) => m.role === "Admin").length}</span>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-2 py-2.5 text-stone-600 sm:px-3 sm:py-2">
                      DJs:{" "}
                      <span className="font-semibold text-stone-950">{teamMembers.filter((m) => m.role === "DJ").length}</span>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-2 py-2.5 text-stone-600 sm:px-3 sm:py-2">
                      Planners:{" "}
                      <span className="font-semibold text-stone-950">{teamMembers.filter((m) => m.role === "Planner").length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={`settings-team-${member.id}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-950">{member.name}</p>
                            <p className="mt-1 truncate text-xs text-stone-600">{member.email}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${roleBadgeClass(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-stone-600">
                          Permissions: {member.role === "Admin" ? "Full settings + event management" : member.role === "DJ" ? "Timeline/music/event prep" : "Planning/timeline/vendor coordination"}
                        </p>
                        {canManageEvents &&
                        activeEventId &&
                        isTeamMemberAssignedToActiveEvent(member) ? (
                          <div className="mt-3">
                            <PrimaryButton
                              type="button"
                              onClick={() => removeTeamMemberFromActiveEvent(member)}
                              className="w-full rounded-lg border border-stone-300 bg-white px-2 py-2.5 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:py-2"
                            >
                              Remove from Event
                            </PrimaryButton>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {teamFormStatus && (
                    <p
                      className={`rounded-xl px-3 py-2 text-xs ${
                        teamFormStatus.kind === "success"
                          ? "border border-emerald-300/80 bg-emerald-50 text-emerald-950"
                          : "border border-rose-300/80 bg-rose-50 text-rose-950"
                      }`}
                    >
                      {teamFormStatus.message}
                    </p>
                  )}
                </div>
              )}

              {activeGlobalSettingsSection === "Branding / App" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-stone-950">Branding / App Settings</SectionTitle>
                  <TextInput id="global-company-name" label="Company Name" value={appSettings.companyName} onChange={(value) => setAppSettings((prev) => ({ ...prev, companyName: value }))} disabled={!canManageEvents} />
                  <TextInput id="global-app-name" label="App Name" value={appSettings.appName} onChange={(value) => setAppSettings((prev) => ({ ...prev, appName: value }))} disabled={!canManageEvents} />
                  <TextInput id="global-logo-url" label="Logo/Branding Path" value={appSettings.logoUrl} onChange={(value) => setAppSettings((prev) => ({ ...prev, logoUrl: value }))} disabled={!canManageEvents} />
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput id="global-brand-color" label="Brand Color" value={appSettings.brandColor} onChange={(value) => setAppSettings((prev) => ({ ...prev, brandColor: value }))} disabled={!canManageEvents} />
                    <TextInput id="global-accent-color" label="Accent Color" value={appSettings.accentColor} onChange={(value) => setAppSettings((prev) => ({ ...prev, accentColor: value }))} disabled={!canManageEvents} />
                  </div>
                  <TextInput id="global-timezone" label="Default Event Timezone" value={appSettings.defaultEventTimezone} onChange={(value) => setAppSettings((prev) => ({ ...prev, defaultEventTimezone: value }))} disabled={!canManageEvents} />
                  <TextArea id="global-template-defaults" label="Global Template Defaults" value={appSettings.globalTemplateDefaults} onChange={(value) => setAppSettings((prev) => ({ ...prev, globalTemplateDefaults: value }))} rows={3} disabled={!canManageEvents} />
                  <div className="rounded-xl border border-cyan-400/40 bg-cyan-50/90 p-3 text-xs font-medium leading-relaxed text-stone-800">
                    Backup recommended while this remains a frontend-only prototype.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PrimaryButton
                      onClick={exportBackupJson}
                      disabled={!canManageEvents}
                      className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100 disabled:opacity-50"
                    >
                      Export Backup JSON
                    </PrimaryButton>
                    <PrimaryButton
                      onClick={triggerBackupFilePicker}
                      disabled={!canManageEvents}
                      className="rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-50"
                    >
                      Import Backup JSON
                    </PrimaryButton>
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={importBackupJson}
                      className="hidden"
                    />
                  </div>
                  {backupStatus && (
                    <p
                      className={`rounded-xl px-3 py-2 text-xs ${
                        backupStatus.kind === "success"
                          ? "border border-emerald-300/80 bg-emerald-50 text-emerald-950"
                          : "border border-rose-300/80 bg-rose-50 text-rose-950"
                      }`}
                    >
                      {backupStatus.message}
                    </p>
                  )}
                </div>
              )}
                </div>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "Team" && (
          <section className="mt-6 space-y-3">
            {!canManageEvents && (
              <PremiumCard className="border-amber-200/90 bg-amber-50">
                <p className="text-xs font-medium leading-relaxed text-amber-950">Team Management is admin-only.</p>
              </PremiumCard>
            )}
            <PremiumCard>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionTitle className="text-stone-950">Team Management</SectionTitle>
                <PrimaryButton
                  onClick={openAddTeamMemberModal}
                  disabled={!canManageEvents}
                  className="w-full shrink-0 rounded-xl bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-50 sm:w-auto sm:py-2"
                >
                  Add Team Member
                </PrimaryButton>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Manage internal Admin, DJ, and Planner team members for assignments.
              </p>
              {teamFormStatus && (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                    teamFormStatus.kind === "success"
                      ? "border border-emerald-300/80 bg-emerald-50 text-emerald-950"
                      : "border border-rose-300/80 bg-rose-50 text-rose-950"
                  }`}
                >
                  {teamFormStatus.message}
                </p>
              )}
            </PremiumCard>

            <PremiumCard>
              <SectionTitle className="text-stone-950">Team Members</SectionTitle>
              <div className="mt-3 space-y-2">
                {teamMembers.map((member) => (
                  <div key={`team-member-${member.id}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-950">{member.name}</p>
                        <p className="mt-1 text-xs leading-relaxed text-stone-600">
                          <span className="font-medium text-stone-800">{member.role}</span>
                          {" · "}
                          <span className="break-all">{member.email}</span>
                          {member.phone ? (
                            <>
                              {" · "}
                              <span>{member.phone}</span>
                            </>
                          ) : null}
                        </p>
                        {member.notes && <p className="mt-1 text-xs text-stone-600">{member.notes}</p>}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                          member.isActive
                            ? "border border-emerald-300/80 bg-emerald-100 text-emerald-950"
                            : "border border-stone-200 bg-stone-100 text-stone-600"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <PrimaryButton
                        onClick={() => startEditingTeamMember(member)}
                        disabled={!canManageEvents}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-2.5 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:py-2"
                      >
                        Edit
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() => deleteTeamMember(member.id)}
                        disabled={!canManageEvents}
                        className="rounded-lg border border-rose-300/90 bg-rose-50 px-2 py-2.5 text-[11px] font-semibold text-rose-950 hover:bg-rose-100/90 sm:py-2"
                      >
                        Delete from Team
                      </PrimaryButton>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-stone-600">
                    No team members yet.
                  </p>
                )}
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "All Events" && (
          <section className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">Events</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {canManageEvents && (
                  <PrimaryButton
                    onClick={() => setActiveScreen("Settings")}
                    className={lightUiSecondaryButtonClass}
                  >
                    Global Settings
                  </PrimaryButton>
                )}
                {canManageEvents && (
                  <PrimaryButton
                    onClick={() => {
                      setEventModalMode("new");
                      setEventEditingId(null);
                      setEventDraft({
                        eventName: "",
                        coupleNames: "",
                        eventType: effectiveEventType,
                        eventLayoutProfile: inferLayoutProfileFromEventType(effectiveEventType),
                        weddingDate: "",
                        venue: "",
                        ceremonyLocation: "",
                        receptionLocation: "",
                        assignedDj: "",
                        packageName: "",
                        plannerName: "",
                        plannerEmail: "",
                        internalNotes: "",
                      });
                      setEventModalStatus(null);
                      setEventModalOpen(true);
                    }}
                    className={lightUiCyanPrimaryButtonClass}
                  >
                    New Event
                  </PrimaryButton>
                )}
              </div>
            </div>

            {visibleEvents.length === 0 ? (
              <PremiumCard className="border-dashed border-[#00D4FF]/40 bg-zinc-950 border-zinc-800">
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-zinc-100">
                    {canManageEvents ? "No events yet" : "No assigned events yet"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {canManageEvents
                      ? "Create your first event to start planning a full Cutmaster workflow."
                      : "Ask an admin to assign you to an event in Collaborators."}
                  </p>
                  {canManageEvents && (
                    <div className="mt-5">
                      <PrimaryButton
                        onClick={() => {
                          setEventModalMode("new");
                          setEventEditingId(null);
                          setEventDraft({
                            eventName: "",
                            coupleNames: "",
                            eventType: effectiveEventType,
                            eventLayoutProfile: inferLayoutProfileFromEventType(effectiveEventType),
                            weddingDate: "",
                            venue: "",
                            ceremonyLocation: "",
                            receptionLocation: "",
                            assignedDj: "",
                            packageName: "",
                            plannerName: "",
                            plannerEmail: "",
                            internalNotes: "",
                          });
                          setEventModalStatus(null);
                          setEventModalOpen(true);
                        }}
                        className={`w-full ${lightUiCyanPrimaryButtonClass} py-2.5 text-sm`}
                      >
                        Create Event
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </PremiumCard>
            ) : (
              <>
                <PremiumCard className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="all-events-search" className={lightUiFormLabelClass}>
                        Search
                      </label>
                      <input
                        id="all-events-search"
                        type="search"
                        value={allEventsSearch}
                        onChange={(e) => setAllEventsSearch(e.target.value)}
                        placeholder="Name, venue, event type, hosts…"
                        className={lightUiInputClass}
                      />
                    </div>
                    <PrimaryButton
                      type="button"
                      onClick={() => {
                        setAllEventsSearch("");
                        setAllEventsProfileFilter("all");
                        setAllEventsLifecycleFilter("open");
                        setAllEventsTimingFilter("all");
                        setAllEventsSort("date-asc");
                      }}
                      className={`shrink-0 ${lightUiSecondaryButtonClass} px-4 py-2.5 text-[11px]`}
                    >
                      Reset filters
                    </PrimaryButton>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label htmlFor="all-events-type-filter" className={lightUiFormLabelClass}>
                        Event type
                      </label>
                      <select
                        id="all-events-type-filter"
                        value={allEventsProfileFilter}
                        onChange={(e) =>
                          setAllEventsProfileFilter(e.target.value as EventLayoutProfile | "all")
                        }
                        className={lightUiSelectClass}
                      >
                        <option value="all" className="bg-white text-stone-900">
                          All types
                        </option>
                        {EVENT_TYPES.map((t) => (
                          <option key={`all-events-type-${t}`} value={t} className="bg-white text-stone-900">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="all-events-status-filter" className={lightUiFormLabelClass}>
                        Status
                      </label>
                      <select
                        id="all-events-status-filter"
                        value={allEventsLifecycleFilter}
                        onChange={(e) =>
                          setAllEventsLifecycleFilter(
                            e.target.value as typeof allEventsLifecycleFilter,
                          )
                        }
                        className={lightUiSelectClass}
                      >
                        <option value="open" className="bg-white text-stone-900">
                          Open (hide archived)
                        </option>
                        <option value="active" className="bg-white text-stone-900">
                          Active
                        </option>
                        <option value="completed" className="bg-white text-stone-900">
                          Completed
                        </option>
                        <option value="archived" className="bg-white text-stone-900">
                          Archived
                        </option>
                        <option value="all" className="bg-white text-stone-900">
                          All statuses
                        </option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="all-events-timing-filter" className={lightUiFormLabelClass}>
                        Timing
                      </label>
                      <select
                        id="all-events-timing-filter"
                        value={allEventsTimingFilter}
                        onChange={(e) =>
                          setAllEventsTimingFilter(e.target.value as typeof allEventsTimingFilter)
                        }
                        className={lightUiSelectClass}
                      >
                        <option value="all" className="bg-white text-stone-900">
                          All dates
                        </option>
                        <option value="upcoming" className="bg-white text-stone-900">
                          Upcoming
                        </option>
                        <option value="past" className="bg-white text-stone-900">
                          Past
                        </option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="all-events-sort" className={lightUiFormLabelClass}>
                        Sort
                      </label>
                      <select
                        id="all-events-sort"
                        value={allEventsSort}
                        onChange={(e) => setAllEventsSort(e.target.value as typeof allEventsSort)}
                        className={lightUiSelectClass}
                      >
                        <option value="date-asc" className="bg-white text-stone-900">
                          Event date (soonest first)
                        </option>
                        <option value="date-desc" className="bg-white text-stone-900">
                          Event date (latest first)
                        </option>
                        <option value="recently-updated" className="bg-white text-stone-900">
                          Recently updated
                        </option>
                        <option value="alpha" className="bg-white text-stone-900">
                          Alphabetical
                        </option>
                      </select>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-stone-600">
                    Showing <span className="font-semibold text-stone-900">{allEventsFilteredAndSorted.length}</span> of{" "}
                    <span className="font-semibold text-stone-900">{visibleEvents.length}</span> events in view.
                    Archived events stay hidden until you search or choose Archived / All statuses.
                  </p>
                </PremiumCard>

                {allEventsFilteredAndSorted.length === 0 ? (
                  <PremiumCard className="border-dashed border-[#00D4FF]/35 bg-zinc-950 border-zinc-800">
                    <div className="py-10 text-center">
                      <p className="text-sm font-semibold text-zinc-100">No events match</p>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                        Try clearing search or widening filters — archived events appear when they match search or when
                        Status is set to Archived or All statuses.
                      </p>
                      <PrimaryButton
                        type="button"
                        onClick={() => {
                          setAllEventsSearch("");
                          setAllEventsProfileFilter("all");
                          setAllEventsLifecycleFilter("open");
                          setAllEventsTimingFilter("all");
                          setAllEventsSort("date-asc");
                        }}
                        className={`mt-5 ${lightUiSecondaryButtonClass} px-5`}
                      >
                        Reset filters
                      </PrimaryButton>
                    </div>
                  </PremiumCard>
                ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {allEventsFilteredAndSorted.map((evt) => {
                  const isActive = evt.id === activeEventId;
                  const cardProfile = resolveLayoutProfileForDisplay(
                    evt.settings,
                    appSettings.defaultEventType,
                  );
                  const cardEventName = evt.settings?.eventName || evt.meta.couple || "Untitled Event";
                  const cardEventType = evt.settings?.eventType || "Event";
                  const cardCoupleNames = evt.settings?.coupleNames || evt.meta.couple || "TBD";
                  const cardEventDate = evt.settings?.weddingDate || evt.meta.date || "Date TBD";
                  const cardVenue = evt.settings?.venue || evt.meta.venue || "Venue TBD";
                  const cardProgress = approximatePlanningProgressPercent(evt);
                  const cardCover = evt.settings?.coverPhotoDataUrl;
                  const cardLifecycle: EventLifecycleStatus = evt.settings?.eventLifecycleStatus ?? "active";
                  const viewerBadge = viewerRoleBadgeForEvent(evt);
                  return (
                    <PremiumCard key={evt.id} className="overflow-hidden p-0">
                      <div className="relative aspect-[2.15/1] min-h-[118px] overflow-hidden">
                        {cardCover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cardCover}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className={`absolute inset-0 ${eventCoverFallbackClasses(cardProfile)}`}
                            aria-hidden
                          />
                        )}
                        <div className="absolute inset-0 bg-black/55" />
                        <div className="absolute right-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/15 ${
                              cardLifecycle === "archived"
                                ? "bg-black/60 text-zinc-200"
                                : cardLifecycle === "completed"
                                  ? "bg-emerald-500/25 text-emerald-100"
                                  : "bg-white/15 text-white"
                            }`}
                          >
                            {cardLifecycle === "archived"
                              ? "Archived"
                              : cardLifecycle === "completed"
                                ? "Completed"
                                : "Planning"}
                          </span>
                          {viewerBadge ? (
                            <span className="rounded-full bg-[#00D4FF]/28 px-2 py-0.5 text-[10px] font-medium text-[#fff8e8] ring-1 ring-[#00D4FF]/35">
                              {viewerBadge}
                            </span>
                          ) : null}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-white/75">{cardEventType}</p>
                          <p className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-white">
                            {cardEventName}
                          </p>
                          <p className="mt-1 text-[11px] text-white/85">{cardEventDate}</p>
                          {isActive ? (
                            <span className="mt-2 inline-flex rounded-full bg-[#00D4FF]/40 px-2 py-0.5 text-[10px] font-semibold text-[#fff8ea] ring-1 ring-[#00D4FF]/40">
                              Selected
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        <p className="line-clamp-2 text-xs text-stone-600">{cardVenue}</p>
                        <p className="text-[11px] text-stone-600">
                          {PRIMARY_PARTY_SHORT_LABEL[cardProfile]} · {cardCoupleNames}
                        </p>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-stone-600">
                            <span>Planning progress</span>
                            <span className="font-semibold tabular-nums text-stone-800">{cardProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                            <div
                              className="h-full rounded-full bg-[#00D4FF] transition-[width] duration-500"
                              style={{ width: `${cardProgress}%` }}
                            />
                          </div>
                        </div>

                      <div className="grid grid-cols-2 gap-2">
                        <PrimaryButton
                          onClick={() => {
                            switchToEvent(evt.id);
                          }}
                          className={lightUiCyanPrimaryButtonClass}
                        >
                          Select
                        </PrimaryButton>
                        {canManageEvents ? (
                          <PrimaryButton
                            onClick={() => {
                              setEventModalMode("edit");
                              setEventEditingId(evt.id);
                              const migratedProfile = migrateLegacyLayoutProfile(
                                evt.settings?.eventLayoutProfile,
                                evt.settings?.eventType || effectiveEventType,
                              );
                              setEventDraft({
                                eventName: evt.settings?.eventName || evt.meta.couple,
                                coupleNames: evt.settings?.coupleNames || evt.meta.couple,
                                eventType: migratedProfile,
                                eventLayoutProfile: migratedProfile,
                                weddingDate: evt.settings?.weddingDate || evt.meta.date,
                                venue: evt.settings?.venue || evt.meta.venue,
                                ceremonyLocation: evt.settings?.ceremonyLocation || "",
                                receptionLocation: evt.settings?.receptionLocation || "",
                                assignedDj: evt.settings?.assignedDj || "",
                                packageName: evt.settings?.packageName || "",
                                plannerName: evt.settings?.plannerName || "",
                                plannerEmail: evt.settings?.plannerEmail || "",
                                internalNotes: evt.settings?.internalNotes || "",
                              });
                              setEventModalStatus(null);
                              setEventModalOpen(true);
                            }}
                            className={lightUiSecondaryButtonClass}
                          >
                            Edit
                          </PrimaryButton>
                        ) : (
                          <PrimaryButton
                            onClick={() => switchToEvent(evt.id)}
                            className={lightUiSecondaryButtonClass}
                          >
                            Open
                          </PrimaryButton>
                        )}
                        {canManageEvents && (
                          <PrimaryButton
                            onClick={() => {
                              const ok = window.confirm(
                                `Delete "${evt.meta.couple || "this event"}"?`,
                              );
                              if (!ok) return;
                              commitActiveEventPlanningToEventsState();
                              setEvents((prev) => prev.filter((e) => e.id !== evt.id));
                              if (evt.id === activeEventId) {
                                const remaining = events.filter((e) => e.id !== evt.id);
                                const next = remaining[0];
                                if (next) {
                                  setActiveEventId(next.id);
                                  loadEventPlanningIntoWorkingState(next);
                                  setAppMode("event");
                                  setActiveScreen("Dashboard");
                                } else {
                                  setAppMode("events");
                                  setActiveScreen("All Events");
                                }
                              }
                            }}
                            className={`col-span-2 ${lightUiDestructiveButtonClass}`}
                          >
                            Delete
                          </PrimaryButton>
                        )}
                      </div>
                      <div className="mt-2">
                        <PrimaryButton
                          onClick={async () => {
                            const token = Math.random().toString(36).slice(2, 14);
                            const link = `https://app.cutmastermusic.com/invite?event=${encodeURIComponent(evt.id)}&role=Couple&token=${token}`;
                            try {
                              await navigator.clipboard.writeText(link);
                              setCopyStatus("copied");
                              setTimeout(() => setCopyStatus(""), 1800);
                            } catch {
                              setCopyStatus("error");
                              setTimeout(() => setCopyStatus(""), 2200);
                            }
                            setInviteAccessPreview({
                              eventId: evt.id,
                              role: "Couple",
                              token,
                              link,
                            });
                          }}
                          className={`w-full ${lightUiCyanPrimaryButtonClass} py-2.5 text-[11px]`}
                        >
                          {COPY_INVITE_LINK_LABEL[cardProfile]}
                        </PrimaryButton>
                      </div>
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
                )}
              </>
            )}
          </section>
        )}

        {authStage === "app" && appMode === "event" && (
          <div className="mt-4">
            <PrimaryButton
              onClick={() => {
                commitActiveEventPlanningToEventsState();
                setAppMode("events");
                setActiveScreen("All Events");
              }}
              className={`w-full ${lightUiSecondaryButtonClass}`}
            >
              Back to All Events
            </PrimaryButton>
          </div>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "Command Center" && (effectiveRole === "Admin" || effectiveRole === "DJ") && (
          <section className="mt-6 space-y-3 cm-section-enter">
            <div className="grid gap-3 xl:grid-cols-[1.8fr_1fr]">
              <div className="space-y-3">
                <PremiumCard className="border-[#00D4FF]/25 bg-zinc-950 border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <SectionTitle className="!text-zinc-100">Command Center</SectionTitle>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300">
                      {commandCenterEvents.length} events
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">
                    {effectiveRole === "Admin"
                      ? "Operational overview across all events."
                      : "Operational overview across your assigned events."}
                  </p>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle className="text-stone-950">Upcoming Events</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {commandCenterUpcomingEvents.map((evt) => {
                      const cmdProfile = resolveLayoutProfileForDisplay(
                        evt.settings,
                        appSettings.defaultEventType,
                      );
                      return (
                      <div key={`cmd-upcoming-${evt.id}`} className="rounded-xl border border-stone-200 bg-stone-50 p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{evt.settings.eventName || evt.meta.couple}</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                              {PRIMARY_PARTY_SHORT_LABEL[cmdProfile]}:{" "}
                              <span className="font-semibold text-stone-800">
                                {evt.settings.coupleNames || evt.meta.couple || "TBD"}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-stone-600">
                              {evt.settings.weddingDate || evt.meta.date || "TBD"} · {evt.settings.venue || evt.meta.venue || "TBD"}
                            </p>
                            <p className="mt-1 text-xs text-stone-600">
                              DJ: {getTeamMemberName(evt.settings.assignedDj || "")} · Planner: {evt.settings.plannerName || "TBD"}
                            </p>
                          </div>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Dashboard")}
                            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-900 shadow-none hover:bg-stone-50"
                          >
                            View Event
                          </PrimaryButton>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Dashboard")}
                            className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                          >
                            View Event
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Event Prep")}
                            className="rounded-lg border border-black bg-[#00D4FF] px-2 py-2 text-[11px] font-semibold text-black shadow-none hover:brightness-105"
                          >
                            Open Event Document
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Timeline")}
                            className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                          >
                            Review Timeline
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Guest Requests")}
                            className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                          >
                            Review Guest Requests
                          </PrimaryButton>
                        </div>
                      </div>
                      );
                    })}
                    {commandCenterUpcomingEvents.length === 0 && (
                      <p className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-medium text-stone-600">
                        No upcoming events available for this role.
                      </p>
                    )}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle className="text-stone-950">Events Needing Attention</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {commandCenterAttentionEvents.map(({ evt, pendingGuestRequests, incompleteChecklistCount }) => (
                      <div key={`cmd-attention-${evt.id}`} className="rounded-xl border border-[#00D4FF]/45 bg-[#00D4FF]/12 px-3 py-2.5 shadow-sm">
                        <p className="text-sm font-semibold text-stone-900">{evt.settings.eventName || evt.meta.couple}</p>
                        <p className="mt-1 text-xs font-medium text-stone-700">
                          {pendingGuestRequests} pending guest requests · {incompleteChecklistCount} incomplete planning areas
                        </p>
                      </div>
                    ))}
                    {commandCenterAttentionEvents.length === 0 && (
                      <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-950">
                        No urgent attention items across your events.
                      </p>
                    )}
                  </div>
                </PremiumCard>
              </div>

              <div className="space-y-3">
                <PremiumCard className="border-zinc-700 bg-zinc-950 shadow-none">
                  <SectionTitle className="!text-zinc-100">Recent Activity</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {activities
                      .filter((item) => commandCenterEvents.some((evt) => evt.id === item.eventId))
                      .slice(0, 8)
                      .map((item) => (
                        <div key={`cmd-activity-${item.id}`} className="rounded-xl bg-white/5 px-3 py-2 text-xs">
                          <p className="text-zinc-100">
                            <span className="mr-1">{activityTypeIcon(item.type)}</span>
                            {item.summary}
                          </p>
                          <p className="mt-1 text-zinc-500">
                            {item.eventName} · {formatRelativeTime(item.timestamp)}
                          </p>
                        </div>
                      ))}
                  </div>
                </PremiumCard>
                <PremiumCard className="border-zinc-700 bg-zinc-950 shadow-none">
                  <SectionTitle className="!text-zinc-100">Notifications</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {notifications
                      .filter((notice) => commandCenterEvents.some((evt) => evt.id === notice.eventId))
                      .slice(0, 6)
                      .map((notice) => (
                        <div key={`cmd-notice-${notice.id}`} className="rounded-xl bg-white/5 px-3 py-2 text-xs">
                          <p className="text-zinc-100">{notice.summary}</p>
                          <p className="mt-1 text-zinc-500">
                            {notice.eventName} · {formatRelativeTime(notice.timestamp)}
                          </p>
                        </div>
                      ))}
                  </div>
                </PremiumCard>
              </div>
            </div>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Dashboard" && (
          isCoupleView ? (
            <section className="mt-4 space-y-6 sm:mt-6 sm:space-y-8">
              <PremiumCard className="overflow-hidden border-[#00D4FF]/25 p-0 shadow-none sm:shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)]">
                <div className="relative aspect-[16/11] min-h-[200px] overflow-hidden sm:aspect-[21/9] sm:min-h-[220px]">
                  {eventSettings.coverPhotoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={eventSettings.coverPhotoDataUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 ${eventCoverFallbackClasses(layoutProfileForActiveEvent)}`}
                      aria-hidden
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="pointer-events-none absolute inset-0 bg-transparent" aria-hidden />
                  <div className="relative flex h-full flex-col justify-end p-5 pb-6 sm:p-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
                      {primaryPartyShortLabel}
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {eventDisplayName}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-zinc-100">{coupleDisplayName}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white">
                        {layoutProfileForActiveEvent}
                      </span>
                      <span className="inline-flex flex-col rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-left">
                        <span className="text-[9px] uppercase tracking-[0.12em] text-white/55">{eventDateGridLabel}</span>
                        <span className="text-[11px] text-zinc-100">{eventDateDisplay}</span>
                      </span>
                      <span className="inline-flex max-w-full rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] text-zinc-200">
                        {eventVenueDisplay}
                      </span>
                    </div>
                    <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Planning progress</p>
                        <div className="mt-2 h-2.5 max-w-md overflow-hidden rounded-full bg-black/45 ring-1 ring-white/10">
                          <div
                            className="h-full rounded-full bg-[#00D4FF] transition-[width] duration-700 ease-out"
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                      <p className="shrink-0 text-4xl font-semibold tabular-nums text-zinc-100">{completionPercent}%</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border-t border-stone-300 bg-stone-50/60 px-5 py-6 sm:p-7">
                  <p className="text-[11px] font-medium text-stone-600">
                    Viewing as{" "}
                    <span className="font-semibold text-stone-900">
                      {perspectiveRoleLabel(currentRole ?? rolePreview)}
                    </span>
                  </p>
                  {(eventSettings.assignedDj?.trim() || eventSettings.plannerName?.trim()) && (
                    <p className="text-[11px] text-stone-600">
                      <span className="font-medium text-stone-800">Your team</span>
                      {eventSettings.assignedDj?.trim() ? (
                        <>
                          {" "}
                          · DJ {getTeamMemberName(eventSettings.assignedDj)}
                        </>
                      ) : null}
                      {eventSettings.plannerName?.trim() ? (
                        <>
                          {" "}
                          · Planner {eventSettings.plannerName}
                        </>
                      ) : null}
                    </p>
                  )}
                  {canEditEventCover ? (
                    <div className="flex flex-wrap gap-2">
                      <PrimaryButton
                        type="button"
                        onClick={() => setActiveScreen("Event Settings")}
                        className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:min-h-11 sm:w-auto sm:px-3 sm:py-2 sm:text-[11px]"
                      >
                        Event details & cover photo
                      </PrimaryButton>
                    </div>
                  ) : null}
                </div>
              </PremiumCard>

              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-none sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                      Event readiness
                    </p>
                    <p className="mt-1 text-sm leading-snug text-stone-700">
                      Gentle guidance for what&apos;s next—not alerts or deadlines.
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] font-medium tabular-nums text-stone-500">{completionPercent}% plan</p>
                </div>

                {eventReadinessGuide.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-3 text-sm leading-relaxed text-stone-800">
                    Nothing needs attention right now—you&apos;re steady for this stage.
                  </p>
                ) : (
                  <div className="mt-4 space-y-5">
                    {(["attention", "recommended"] as const).map((tier) => {
                      const bucket = eventReadinessGuide.filter((r) => r.tier === tier);
                      if (bucket.length === 0) return null;
                      const tierLabel = tier === "attention" ? "Needs attention" : "Recommended";
                      return (
                        <div key={tier}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                            {tierLabel}
                          </p>
                          <ul className="mt-2 space-y-2">
                            {bucket.map((item) => (
                              <li
                                key={item.id}
                                className={
                                  tier === "attention"
                                    ? "rounded-xl border border-stone-200 border-l-[3px] border-l-stone-700 bg-stone-50/90 px-3 py-3 sm:px-4"
                                    : "rounded-xl border border-stone-200 border-l-[3px] border-l-[#00b8d9]/75 bg-white px-3 py-3 sm:px-4"
                                }
                              >
                                <p className="text-sm font-semibold leading-snug text-stone-900">{item.title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.hint}</p>
                                <button
                                  type="button"
                                  onClick={() => setActiveScreen(item.targetScreen)}
                                  className="mt-2.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-center text-xs font-semibold text-stone-900 hover:bg-stone-50 sm:w-auto sm:py-1.5"
                                >
                                  {item.actionLabel}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}

                    {eventReadinessGuide.some((r) => r.tier === "optional") ? (
                      <details className="rounded-xl border border-stone-200 bg-stone-50/60">
                        <summary className="cursor-pointer list-none px-3 py-3 text-sm font-semibold text-stone-800 sm:px-4 [&::-webkit-details-marker]:hidden">
                          <span className="flex items-center justify-between gap-2">
                            <span>Optional polish</span>
                            <span className="text-xs font-medium tabular-nums text-stone-500">
                              {eventReadinessGuide.filter((r) => r.tier === "optional").length}
                            </span>
                          </span>
                        </summary>
                        <ul className="space-y-2 border-t border-stone-200 px-3 pb-3 pt-2 sm:px-4">
                          {eventReadinessGuide
                            .filter((r) => r.tier === "optional")
                            .map((item) => (
                              <li
                                key={item.id}
                                className="rounded-lg border border-stone-200/90 bg-white px-3 py-2.5 sm:px-3.5"
                              >
                                <p className="text-sm font-semibold leading-snug text-stone-900">{item.title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.hint}</p>
                                <button
                                  type="button"
                                  onClick={() => setActiveScreen(item.targetScreen)}
                                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-center text-xs font-semibold text-stone-800 hover:bg-stone-100 sm:w-auto"
                                >
                                  {item.actionLabel}
                                </button>
                              </li>
                            ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                )}
              </div>

              <PrimaryButton
                type="button"
                onClick={() => setActiveScreen(coupleGuidedNextScreen)}
                className="min-h-[5rem] w-full justify-center rounded-2xl border-2 border-black bg-[#00D4FF] px-5 py-5 text-center shadow-none sm:min-h-[4.75rem]"
              >
                <span className="block text-base font-semibold text-black">Continue planning</span>
                <span className="mt-1 block text-xs font-semibold text-black/80">{coupleGuidedNextHint}</span>
              </PrimaryButton>

              <div className="space-y-3 px-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-800">
                  Your planning areas
                </p>
                <p className="text-sm leading-relaxed text-stone-700">
                  Ceremony, music, reception, planning questions, vendors, and your event document—each in one calm
                  place.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                {coupleHomePlanningSections.map((section) => (
                  <button
                    type="button"
                    key={section.id}
                    onClick={() => setActiveScreen(section.screen)}
                    className="group flex min-h-[11rem] flex-col rounded-2xl border border-stone-300 bg-white px-5 py-6 text-left shadow-none ring-1 ring-stone-200 transition hover:border-[#00D4FF]/55 hover:ring-[#00D4FF]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D4FF]/60 sm:min-h-0 sm:py-5 sm:shadow-[0_2px_10px_-4px_rgba(28,25,23,0.1)] sm:ring-0 sm:hover:shadow-[0_10px_28px_-10px_rgba(28,25,23,0.14)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                          {section.kicker}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold leading-snug text-stone-950 [overflow-wrap:anywhere]">
                          {section.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-stone-700 sm:text-xs sm:leading-relaxed sm:text-stone-600">
                          {section.description}
                        </p>
                      </div>
                      {section.pendingBadge ? (
                        <span className="shrink-0 rounded-full border border-[#7E52A0]/35 bg-[#7E52A0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5a3d72]">
                          {section.pendingBadge}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5">
                      <div className="mb-1 flex justify-between text-[11px] font-medium text-stone-600">
                        <span>{section.completionStatusLabel ?? "Progress"}</span>
                        <span className="tabular-nums font-semibold text-[#5c4a12]">{section.completion}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 ring-1 ring-inset ring-stone-400/35">
                        <div
                          className="h-full rounded-full bg-[#00D4FF] transition-[width] duration-500"
                          style={{ width: `${section.completion}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end border-t border-stone-200 pt-4">
                      <span className="text-xs font-semibold text-[#7a5e18] transition group-hover:text-[#5c4a12]">
                        {section.ctaLabel} →
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {(sectionPlanningChecklistEnabled || sectionMusicNotesEnabled) && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveScreen("Notes")}
                    className="text-xs font-medium text-stone-600 underline-offset-4 transition hover:text-stone-900 hover:underline"
                  >
                    Notes & personal reminders
                  </button>
                </div>
              )}
            </section>
          ) : (
          <>
            <section className="mt-6 space-y-3">
              <PremiumCard className="overflow-hidden border border-zinc-700 bg-zinc-950 p-0 shadow-none">
                <div className="relative aspect-[16/11] min-h-[168px] overflow-hidden sm:aspect-[21/9] sm:min-h-[200px]">
                  {eventSettings.coverPhotoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={eventSettings.coverPhotoDataUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 ${eventCoverFallbackClasses(layoutProfileForActiveEvent)}`}
                      aria-hidden
                    />
                  )}
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative flex h-full flex-col justify-end p-5 sm:p-7">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">{primaryPartyShortLabel}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      {eventDisplayName}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-300">{coupleDisplayName}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-100">
                        {layoutProfileForActiveEvent}
                      </span>
                      <span className="inline-flex flex-col rounded-full border border-white/12 bg-black/35 px-2.5 py-1.5 text-left">
                        <span className="text-[9px] uppercase tracking-[0.12em] text-white/55">{eventDateGridLabel}</span>
                        <span className="text-[11px] text-zinc-100">{eventDateDisplay}</span>
                      </span>
                      <span className="inline-flex max-w-full rounded-full border border-white/12 bg-black/35 px-2.5 py-1 text-[11px] text-zinc-200">
                        {eventVenueDisplay}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Planning progress</p>
                        <div className="mt-2 h-2 max-w-sm overflow-hidden rounded-full bg-black/45 ring-1 ring-white/10">
                          <div
                            className="h-full rounded-full bg-[#00D4FF] transition-[width] duration-700 ease-out"
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                      <p className="shrink-0 text-3xl font-semibold tabular-nums text-zinc-100">{completionPercent}%</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border-t border-stone-300 bg-stone-50/70 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b5420]">{dashboardEyebrowText}</p>
                      <p className="mt-1 text-[11px] font-medium text-stone-600">
                        Viewing as{" "}
                        <span className="font-semibold text-stone-900">
                          {perspectiveRoleLabel(currentRole ?? rolePreview)}
                        </span>
                      </p>
                    </div>
                    {canEditEventCover ? (
                      <PrimaryButton
                        type="button"
                        onClick={() => setActiveScreen("Event Settings")}
                        className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
                      >
                        Cover & details
                      </PrimaryButton>
                    ) : null}
                  </div>
                  <p className="text-xs font-medium text-stone-600">
                    Vendors: <span className="font-semibold text-stone-900">{vendors.length}</span>
                  </p>
                  <div className="rounded-xl border border-[#00D4FF]/45 bg-white px-3 py-2.5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c4a12]">{eventCountdownLabel}</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {daysUntilWedding === null
                        ? "Add an event date to start your countdown"
                        : `${daysUntilWedding} day${daysUntilWedding === 1 ? "" : "s"} until your event`}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 px-5 pb-5 sm:px-6">
                  <div className="mt-4">
                  <SectionTitle className="!text-zinc-100">{staffDashboardSectionTitles.nextTasks}</SectionTitle>
                  <div className="mt-2 space-y-2">
                    {nextChecklistTasks.length > 0 ? (
                      nextChecklistTasks.map((task) => (
                        <button
                          type="button"
                          key={`next-${task.id}`}
                          onClick={() => setActiveScreen(task.linkedSection)}
                          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-left text-xs text-stone-800 shadow-sm transition hover:border-[#00D4FF]/45 hover:bg-stone-50"
                        >
                          <p className="font-semibold text-stone-900">{task.title}</p>
                          <p className="mt-1 text-stone-600">{task.description}</p>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-xl border border-emerald-300/90 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-950">
                        Beautiful work. Your checklist is complete and event-ready.
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {staffHomeQuickActions.map((action, idx) => (
                    <PrimaryButton
                      key={`staff-quick-${idx}-${action.kind === "screen" ? action.screen : action.section}`}
                      type="button"
                      onClick={() => {
                        if (action.kind === "screen") {
                          setActiveScreen(action.screen);
                          return;
                        }
                        commitActiveEventPlanningToEventsState();
                        setAppMode("events");
                        setActiveScreen("Settings");
                        setActiveGlobalSettingsSection(action.section);
                      }}
                      className={
                        action.kind === "workspace"
                          ? darkUiWorkspaceJumpButtonClass
                          : `${lightUiSecondaryButtonClass} text-[11px] hover:-translate-y-0.5 active:scale-[0.99]`
                      }
                    >
                      {action.label}
                    </PrimaryButton>
                  ))}
                </div>
                </div>
              </PremiumCard>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {roleDashboardMetricCards.map((card) => (
                  <PremiumCard key={card.label}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-stone-700">{card.label}</p>
                      <span className="text-sm font-semibold tabular-nums text-[#5c4a12]">{card.value}</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-200 ring-1 ring-inset ring-stone-400/35">
                      <div
                        className="h-full rounded-full bg-[#00D4FF]"
                        style={{
                          width: /\d+%$/.test(String(card.value)) ? String(card.value) : "100%",
                          opacity: /\d+%$/.test(String(card.value)) ? 1 : 0.35,
                        }}
                      />
                    </div>
                    <p className="mt-3 text-xs font-medium text-stone-600">{card.detail}</p>
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="mt-6 space-y-3">
              <PremiumCard className="border-stone-300 bg-white shadow-[0_2px_12px_-4px_rgba(28,25,23,0.1)]">
                <div className="flex items-center justify-between">
                  <SectionTitle className="text-stone-950">{staffDashboardSectionTitles.milestones}</SectionTitle>
                  <span className="rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/22 px-2.5 py-1 text-xs font-semibold text-stone-950">
                    {completionPercent}%
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {upcomingMilestones.length > 0 ? (
                    upcomingMilestones.map((item) => (
                      <div key={item.id} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-stone-900">{item.title}</span>
                          <span className="text-stone-600">{item.dueDate}</span>
                        </div>
                        <p className="mt-1 text-stone-600">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    planningChecklist.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-stone-100 bg-white px-3 py-2 text-xs shadow-sm">
                        <span className="font-medium text-stone-800">{item.title}</span>
                        <span className="text-stone-600">{item.dueDate || "Set date"}</span>
                      </div>
                    ))
                  )}
                </div>
              </PremiumCard>

              <PremiumCard className="border-stone-300 bg-white shadow-[0_2px_12px_-4px_rgba(28,25,23,0.1)]">
                <div className="flex items-center justify-between">
                  <SectionTitle className="text-stone-950">{staffDashboardSectionTitles.updates}</SectionTitle>
                  <PrimaryButton
                    onClick={() => setActiveScreen("Notification Center")}
                    className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
                  >
                    View All
                  </PrimaryButton>
                </div>
                <div className="mt-3 space-y-2">
                  {recentActivityForActiveEvent.map((item) => (
                    <div key={`recent-${item.id}`} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs">
                      <p className="font-medium text-stone-900">
                        <span className="mr-1">{activityTypeIcon(item.type)}</span>
                        {item.summary}
                      </p>
                      <p className="mt-1 text-stone-600">
                        {item.userRole} · {item.eventName} · {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  ))}
                  {recentActivityForActiveEvent.length === 0 && (
                    <p className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-medium text-stone-600">
                      Activity will appear here as planning updates happen.
                    </p>
                  )}
                </div>
              </PremiumCard>

              <PremiumCard>
                <div className="flex items-center justify-between">
                  <SectionTitle className="text-stone-950">Recent Activity</SectionTitle>
                  <PrimaryButton
                    onClick={() => setActiveScreen("Notification Center")}
                    className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
                  >
                    View All
                  </PrimaryButton>
                </div>
                <div className="mt-3 space-y-2">
                  {activities
                    .filter((item) => item.eventId === activeEventId)
                    .slice(0, 4)
                    .map((item) => (
                      <div key={`recent-${item.id}`} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs">
                        <p className="font-medium text-stone-900">
                          <span className="mr-1">{activityTypeIcon(item.type)}</span>
                          {item.summary}
                        </p>
                        <p className="mt-1 text-stone-600">
                          {item.userRole} · {item.eventName} · {formatRelativeTime(item.timestamp)}
                        </p>
                      </div>
                    ))}
                  {activities.filter((item) => item.eventId === activeEventId).length === 0 && (
                    <p className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-medium text-stone-600">
                      Activity will appear here as planning updates happen.
                    </p>
                  )}
                </div>
              </PremiumCard>

            </section>

            <section className="mt-6 space-y-3">
              <SectionTitle className="mb-1 font-semibold text-stone-700">
                {staffDashboardSectionTitles.insightsIntro}
              </SectionTitle>
              <PremiumCard className="border-[#00D4FF]/45 bg-white shadow-[0_2px_12px_-4px_rgba(28,25,23,0.08)]">
                <SectionTitle className="text-stone-950">{staffDashboardSectionTitles.assistant}</SectionTitle>
                <p className="mt-1 text-xs font-medium text-stone-600">{staffDashboardSectionTitles.assistantHint}</p>
                <div className="mt-3">
                  <InsightStack
                    insights={insightsForEventDashboard}
                    emptyLabel="No assistant notes yet — your plan reads balanced."
                  />
                </div>
                <div className="mt-4">
                  <PrimaryButton
                    onClick={handleResetDemoData}
                    className="w-full rounded-xl border border-[#6f5353]/45 bg-[#6f5353]/15 px-3 py-2.5 text-sm font-semibold text-[#f2dede] hover:bg-[#6f5353]/25"
                  >
                    Reset demo data
                  </PrimaryButton>
                </div>
              </PremiumCard>
            </section>

            <section className="mt-6">
              <SectionTitle className="mb-3 font-medium !text-stone-800">
                {staffDashboardSectionTitles.allSections}
              </SectionTitle>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {prioritizedEventNavForDashboard.map((section) => (
                    <PrimaryButton
                      key={section}
                      onClick={() => setActiveScreen(section)}
                      className="rounded-2xl border border-stone-300 bg-white px-4 py-4 text-left text-sm font-semibold text-stone-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#00D4FF]/55 hover:bg-stone-50"
                    >
                      {navLabel(section)}
                    </PrimaryButton>
                  ))}
              </div>
            </section>
          </>
          )
        )}

        {authStage === "app" &&
          appMode === "event" &&
          activeScreen === "Reception Hub" &&
          receptionHubEligibleNav && (
            <section className="mt-6 space-y-3">
              <EventHomeNav
                trail={["Reception & timeline"]}
                onBack={() => setActiveScreen("Dashboard")}
              />
              <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
                <SectionTitle className="!text-zinc-100">Reception & main event</SectionTitle>
                <p className="mt-1 text-xs text-zinc-400">
                  Your timeline, special moments, and notes—everything for the heart of your celebration.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {sectionReceptionTimelineEnabled && (
                    <PrimaryButton
                      type="button"
                      onClick={() => setActiveScreen("Reception Timeline")}
                      className="min-h-[3.75rem] justify-start rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left hover:border-[#00D4FF]/35 sm:col-span-2"
                    >
                      <span className="block text-sm font-semibold text-zinc-100">Reception timeline</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                        Flow, formal moments, songs, and cues in one workspace
                      </span>
                    </PrimaryButton>
                  )}
                  {(sectionPlanningChecklistEnabled || sectionMusicNotesEnabled) && (
                    <PrimaryButton
                      type="button"
                      onClick={() => setActiveScreen("Notes")}
                      className="min-h-[3.75rem] justify-start rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left hover:border-[#00D4FF]/35 sm:col-span-2"
                    >
                      <span className="block text-sm font-semibold text-zinc-100">Planning notes</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                        Shared notes for your vendor team
                      </span>
                    </PrimaryButton>
                  )}
                </div>
              </PremiumCard>
            </section>
          )}

        {authStage === "app" && appMode === "event" && activeScreen === "Music Hub" && (sectionMustPlayEnabled || sectionDoNotPlayEnabled || sectionPlaylistsEnabled) && (
          <section className="mt-6 min-w-0 space-y-6 overflow-x-hidden sm:space-y-5 md:space-y-4">
            <EventHomeNav
              trail={["Music Hub"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={{
                label: "Add song",
                onClick: () => {
                  document.getElementById("music-hub-quick-add")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  window.setTimeout(() => document.getElementById("song-title")?.focus(), 250);
                },
                disabled: !canManageMusic,
              }}
            />

            <PremiumCard className="border-[#00D4FF]/35 bg-zinc-950 border-zinc-800">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#00D4FF]/75">Soundtrack</p>
                  <SectionTitle className="mt-1 !text-zinc-100">Music Hub</SectionTitle>
                </div>
                <PersistEcho persistFeedback={persistFeedback} variant="dark" className="pt-1" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Keep must-plays, playlists, guest requests, and vibe notes in one calm place—organized by moment, not spreadsheets.
              </p>
            </PremiumCard>

            {!canManageMusic && (
              <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                <p className="text-xs font-medium text-amber-950">
                  {effectiveRole} role can view music, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
            {!isCoupleView && (
              <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
                <SectionTitle className="!text-zinc-100">Music Assistant</SectionTitle>
                <p className="mt-1 text-xs text-zinc-500">
                  Playlist balance and formality song cues.
                </p>
                <div className="mt-3">
                  <InsightStack
                    insights={planningInsights.filter((i) => i.section === "music")}
                    emptyLabel="Music lists look intentional."
                  />
                </div>
              </PremiumCard>
            )}

            <PremiumCard id="music-hub-quick-add" className="border-stone-200 bg-white shadow-sm">
              <SectionTitle className="text-stone-950">Quick add</SectionTitle>
              <p className="mt-1 text-xs text-stone-600">
                Drop a song onto Must Play or Do Not Play—notes are optional.
              </p>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="song-title"
                  label="Song title"
                  value={newSongTitle}
                  onChange={setNewSongTitle}
                  placeholder="e.g. Crazy in Love"
                  disabled={!canManageMusic}
                />
                <TextInput
                  id="song-artist"
                  label="Artist (optional)"
                  value={newSongArtist}
                  onChange={setNewSongArtist}
                  placeholder="e.g. Beyonce"
                  disabled={!canManageMusic}
                />
                <TextArea
                  id="song-notes"
                  label="DJ notes (optional)"
                  value={newSongNotes}
                  onChange={setNewSongNotes}
                  placeholder="Special mix notes, timing cues, energy guidance..."
                  disabled={!canManageMusic}
                />
                <div className="grid grid-cols-2 gap-2">
                  <PrimaryButton
                    onClick={() => setNewSongListType("mustPlay")}
                    disabled={!canManageMusic}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold shadow-none ${
                      newSongListType === "mustPlay"
                        ? "border-black bg-[#00D4FF] text-black"
                        : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    Must Play
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setNewSongListType("doNotPlay")}
                    disabled={!canManageMusic}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold shadow-none ${
                      newSongListType === "doNotPlay"
                        ? "border-rose-600 bg-rose-100 text-rose-950"
                        : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    Do Not Play
                  </PrimaryButton>
                </div>
                <PrimaryButton
                  onClick={() => setNewSongHighPriority((prev) => !prev)}
                  disabled={!canManageMusic}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold shadow-none ${
                    newSongHighPriority
                      ? "border-[#00D4FF] bg-[#00D4FF]/15 text-stone-900"
                      : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {newSongHighPriority ? "High Priority Enabled" : "Mark as High Priority"}
                </PrimaryButton>
                <PrimaryButton
                  onClick={addSong}
                  disabled={!canManageMusic}
                  className="w-full border border-black bg-[#00D4FF] py-2.5 text-sm font-semibold text-black shadow-none hover:brightness-105"
                >
                  Add Song
                </PrimaryButton>
              </div>
            </PremiumCard>

            <div className="grid gap-5 lg:grid-cols-2 lg:gap-4">
              {sectionMustPlayEnabled && (
                <PremiumCard className="border-[#00D4FF]/25 bg-zinc-950">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <SectionTitle className="!text-zinc-100">Must play</SectionTitle>
                      <p className="mt-1 text-xs text-zinc-500">Non‑negotiable songs for your celebration.</p>
                    </div>
                    <span className="rounded-full border border-[#00D4FF]/35 bg-[#00D4FF]/15 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-zinc-100">
                      {mustPlaySongs.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {mustPlaySongs.length === 0 ? (
                      <SectionEmptyState
                        wrapWithCard={false}
                        title="No must-plays yet"
                        description="Lock in the songs that define your dance floor."
                        primaryAction={{
                          label: "Add from quick add",
                          onClick: () => {
                            setNewSongListType("mustPlay");
                            document.getElementById("music-hub-quick-add")?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            window.setTimeout(() => document.getElementById("song-title")?.focus(), 250);
                          },
                          disabled: !canManageMusic,
                        }}
                      />
                    ) : null}
                    {mustPlaySongs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        listType="mustPlay"
                        onTogglePriority={togglePriority}
                        onRemove={removeSong}
                        disabled={!canManageMusic}
                      />
                    ))}
                  </div>
                </PremiumCard>
              )}

              {sectionDoNotPlayEnabled && (
                <PremiumCard className="border-stone-300 bg-white shadow-none">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <SectionTitle className="text-stone-950">Do not play</SectionTitle>
                      <p className="mt-1 text-xs text-stone-600">
                        Songs, artists, genres, or vibes to steer away from—notes optional.
                      </p>
                    </div>
                    <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-900">
                      {doNotPlaySongs.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {doNotPlaySongs.length === 0 ? (
                      <SectionEmptyState
                        wrapWithCard={false}
                        title="Nothing on the block list"
                        description="A short “do not play” keeps the vibe aligned."
                        primaryAction={{
                          label: "Add from quick add",
                          onClick: () => {
                            setNewSongListType("doNotPlay");
                            document.getElementById("music-hub-quick-add")?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            window.setTimeout(() => document.getElementById("song-title")?.focus(), 250);
                          },
                          disabled: !canManageMusic,
                        }}
                      />
                    ) : null}
                    {doNotPlaySongs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        listType="doNotPlay"
                        onTogglePriority={togglePriority}
                        onRemove={removeSong}
                        disabled={!canManageMusic}
                      />
                    ))}
                  </div>
                </PremiumCard>
              )}
            </div>

            {sectionPlaylistsEnabled && (
              <div className="space-y-4">
                <div className="px-1">
                  <SectionTitle className="text-stone-950">Playlists by moment</SectionTitle>
                  <p className="mt-1 text-xs text-stone-600">
                    Each block is its own pocket—drag to reorder, or nudge with arrows.
                  </p>
                </div>
                <div className="grid gap-5 lg:grid-cols-2 lg:gap-4">
                  {PLAYLIST_BUCKET_IDS.map((bucketId) => {
                    const lines = getPlaylistLines(bucketId);
                    const usingDefaults = playlistVibeOverrides[bucketId] === undefined;
                    return (
                      <PremiumCard
                        key={bucketId}
                        className={`border ${MUSIC_HUB_BUCKET_SHELL[bucketId]}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <SectionTitle className="text-stone-950">
                              {PLAYLIST_BUCKET_LABELS[bucketId]}
                            </SectionTitle>
                            <p className="mt-1 text-[11px] text-stone-600">
                              {lines.length} song{lines.length === 1 ? "" : "s"}
                              {usingDefaults ? " · Includes starter ideas + imports" : " · Custom list"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <PrimaryButton
                              type="button"
                              onClick={() => resetPlaylistBucketToDefaults(bucketId)}
                              disabled={!canManageMusic || usingDefaults}
                              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-800 shadow-none hover:bg-stone-50 disabled:opacity-40"
                            >
                              Reset
                            </PrimaryButton>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                          <TextInput
                            id={`playlist-draft-${bucketId}`}
                            label="Add line (Song - Artist)"
                            value={playlistAddDrafts[bucketId] ?? ""}
                            onChange={(value) =>
                              setPlaylistAddDrafts((prev) => ({ ...prev, [bucketId]: value }))
                            }
                            placeholder="Levitating - Dua Lipa"
                            disabled={!canManageMusic}
                          />
                          <PrimaryButton
                            type="button"
                            onClick={() => {
                              addPlaylistLineToBucket(bucketId, playlistAddDrafts[bucketId] ?? "");
                              setPlaylistAddDrafts((prev) => ({ ...prev, [bucketId]: "" }));
                            }}
                            disabled={!canManageMusic}
                            className="rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-black shadow-none hover:brightness-105"
                          >
                            Add
                          </PrimaryButton>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {lines.length === 0 ? (
                            <li className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-left">
                              <p className="text-xs font-semibold text-stone-800">Empty for now</p>
                              <p className="mt-1 text-[11px] leading-snug text-stone-600">
                                Add a line above—pair energy with this part of the night.
                              </p>
                            </li>
                          ) : null}
                          {lines.map((line, index) => {
                            const parsed = parsePlaylistSongLine(line);
                            return (
                              <li
                                key={`${bucketId}-line-${index}`}
                                draggable={canManageMusic}
                                onDragStart={() => setPlaylistDrag({ id: bucketId, index })}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (!playlistDrag || playlistDrag.id !== bucketId) return;
                                  reorderPlaylistLineInBucket(bucketId, playlistDrag.index, index);
                                  setPlaylistDrag(null);
                                }}
                                className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-2 py-2.5 text-xs shadow-sm"
                              >
                                <span
                                  className="mt-0.5 cursor-grab select-none text-stone-500"
                                  title="Drag to reorder"
                                >
                                  ⋮⋮
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold text-stone-900">
                                    {parsed.song || line || "—"}
                                  </p>
                                  <p className="truncate text-[11px] font-medium text-stone-600">
                                    {parsed.artist ? parsed.artist : "—"}
                                  </p>
                                </div>
                                <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center">
                                  <PrimaryButton
                                    type="button"
                                    onClick={() =>
                                      reorderPlaylistLineInBucket(bucketId, index, index - 1)
                                    }
                                    disabled={!canManageMusic || index === 0}
                                    className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[10px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                                  >
                                    Up
                                  </PrimaryButton>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() =>
                                      reorderPlaylistLineInBucket(bucketId, index, index + 1)
                                    }
                                    disabled={!canManageMusic || index >= lines.length - 1}
                                    className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[10px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                                  >
                                    Down
                                  </PrimaryButton>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => removePlaylistLineFromBucket(bucketId, index)}
                                    disabled={!canManageMusic}
                                    className="rounded-lg border border-rose-400 bg-white px-2 py-1 text-[10px] font-semibold text-rose-900 shadow-none hover:bg-rose-50"
                                  >
                                    Remove
                                  </PrimaryButton>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </PremiumCard>
                    );
                  })}
                </div>
              </div>
            )}

            {sectionGuestRequestsEnabled ? (
              <PremiumCard className="border-zinc-700 bg-zinc-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <SectionTitle className="!text-zinc-100">Guest requests</SectionTitle>
                    <p className="mt-1 text-xs text-zinc-400">
                      What guests are asking for—approve in one tap on the full screen.
                    </p>
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={() => setActiveScreen("Guest Requests")}
                    className="rounded-xl border border-black bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black shadow-none hover:brightness-105"
                  >
                    Open guest requests
                  </PrimaryButton>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">Approved</p>
                    <div className="mt-2 space-y-2">
                      {guestRequests.filter((r) => r.status === "Approved").length === 0 ? (
                        <SectionEmptyState
                          wrapWithCard={false}
                          cardClassName="border-emerald-500/15 bg-emerald-500/[0.04] py-3"
                          title="No approvals yet"
                          description="Approved picks stay ready for the DJ."
                        />
                      ) : (
                        guestRequests
                          .filter((r) => r.status === "Approved")
                          .map((request) => (
                            <div
                              key={`hub-approved-${request.id}`}
                              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                            >
                              <p className="text-sm text-zinc-100">
                                {request.songTitle}
                                {request.artist ? (
                                  <span className="font-normal text-zinc-400"> — {request.artist}</span>
                                ) : null}
                              </p>
                              <p className="mt-1 text-[11px] text-zinc-500">{request.guestName}</p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#7E52A0]/25 bg-[#7E52A0]/[0.06] p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">Pending</p>
                    <div className="mt-2 space-y-2">
                      {guestRequests.filter((r) => r.status === "Pending").length === 0 ? (
                        <SectionEmptyState
                          wrapWithCard={false}
                          cardClassName="border-[#7E52A0]/20 bg-[#7E52A0]/[0.04] py-3"
                          title="Inbox is clear"
                          description="New requests appear here when guests submit."
                        />
                      ) : (
                        guestRequests
                          .filter((r) => r.status === "Pending")
                          .map((request) => (
                            <div
                              key={`hub-pending-${request.id}`}
                              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                            >
                              <p className="text-sm text-zinc-100">
                                {request.songTitle}
                                {request.artist ? (
                                  <span className="font-normal text-zinc-400"> — {request.artist}</span>
                                ) : null}
                              </p>
                              <p className="mt-1 text-[11px] text-zinc-500">{request.guestName}</p>
                              <span
                                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${guestRequestStatusBadgeClass(request.status)}`}
                              >
                                {request.status}
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </PremiumCard>
            ) : (
              <PremiumCard className="border-dashed border-stone-300 bg-stone-50">
                <SectionTitle className="text-stone-950">Guest requests</SectionTitle>
                <p className="mt-2 text-xs text-stone-600">
                  Guest requests are hidden for this event—flip them on under Event Settings → Sections when you want the queue
                  here.
                </p>
              </PremiumCard>
            )}

            {sectionMusicNotesEnabled && (
              <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
                <SectionTitle className="!text-zinc-100">Music notes &amp; vibe</SectionTitle>
                <p className="mt-1 text-xs text-zinc-500">
                  Give your DJ emotional guardrails—not just logistics.
                </p>
                <div className="mt-4 space-y-3">
                  <TextArea
                    id="music-hub-overall-vibe"
                    label="Overall vibe"
                    value={generalDjNotes}
                    onChange={setGeneralDjNotes}
                    rows={4}
                    disabled={!canManageMusic}
                    placeholder="Big-picture direction: nostalgic, sing-alongs, era mix…"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextArea
                      id="music-hub-genres"
                      label="Genres / eras"
                      value={musicVibeDetail.genres ?? ""}
                      onChange={(value) =>
                        setMusicVibeDetail((prev) => ({ ...prev, genres: value }))
                      }
                      rows={3}
                      disabled={!canManageMusic}
                      placeholder="e.g. 90s R&B, Latin nights, indie sing-alongs…"
                    />
                    <TextArea
                      id="music-hub-energy"
                      label="Energy arc"
                      value={musicVibeDetail.energy ?? ""}
                      onChange={(value) =>
                        setMusicVibeDetail((prev) => ({ ...prev, energy: value }))
                      }
                      rows={3}
                      disabled={!canManageMusic}
                      placeholder="Warm welcome → peak dance → softer landing…"
                    />
                    <TextArea
                      id="music-hub-crowd"
                      label="Crowd notes"
                      value={musicVibeDetail.crowdNotes ?? ""}
                      onChange={(value) =>
                        setMusicVibeDetail((prev) => ({ ...prev, crowdNotes: value }))
                      }
                      rows={3}
                      disabled={!canManageMusic}
                      placeholder="Families, college friends, shy dancers up front…"
                    />
                    <TextArea
                      id="music-hub-clean"
                      label={
                        layoutProfileForActiveEvent === "School Dance"
                          ? "Clean selections"
                          : "Clean / content preferences"
                      }
                      value={musicVibeDetail.cleanMusicPrefs ?? ""}
                      onChange={(value) =>
                        setMusicVibeDetail((prev) => ({ ...prev, cleanMusicPrefs: value }))
                      }
                      rows={3}
                      disabled={!canManageMusic}
                      placeholder="Radio edits, avoid explicit, requests handling…"
                    />
                  </div>
                </div>
              </PremiumCard>
            )}
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Music Import" && (
          <section className="mt-6 space-y-3">
            <EventHomeNav trail={["Music Import"]} onBack={() => setActiveScreen("Dashboard")} />
            <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
              <SectionTitle className="!text-zinc-100">Spotify Playlist Import (Prototype)</SectionTitle>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Paste a Spotify playlist link to simulate import and build event-ready song guidance.
              </p>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="spotify-playlist-url"
                  label="Spotify playlist URL"
                  value={playlistUrlInput}
                  onChange={setPlaylistUrlInput}
                  placeholder="https://open.spotify.com/playlist/..."
                  disabled={!canManageMusic || musicImportStage === "analyzing" || musicImportStage === "building"}
                />
                <PrimaryButton
                  onClick={handleImportPlaylist}
                  disabled={!canManageMusic || !playlistUrlInput.trim() || musicImportStage === "analyzing" || musicImportStage === "building"}
                  className="w-full bg-[#00D4FF] py-2.5 text-sm font-semibold text-black shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110 disabled:opacity-50"
                >
                  Import Playlist
                </PrimaryButton>
                {musicImportStage === "analyzing" && (
                  <p className="rounded-xl border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-200">
                    Analyzing playlist vibe...
                  </p>
                )}
                {musicImportStage === "building" && (
                  <p className="rounded-xl border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-200">
                    Building your event soundtrack...
                  </p>
                )}
              </div>
            </PremiumCard>

            {musicImportStage === "ready" && importedPlaylistSongs.length > 0 && (
              <PremiumCard className="border-zinc-700 bg-zinc-950 shadow-none">
                <SectionTitle className="!text-zinc-100">Playlist Preview</SectionTitle>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-800 text-[10px] uppercase tracking-wide text-zinc-400">
                    Artwork
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{importedPlaylistName}</p>
                    <p className="mt-1 text-xs text-zinc-400">{importedPlaylistSongs.length} songs</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {importedPlaylistSongs.map((song, index) => (
                    <div
                      key={`imported-${song.title}-${song.artist}-${index}`}
                      className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-200"
                    >
                      {song.title} - {song.artist}
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PrimaryButton
                    onClick={handleAddAllImportedToMustPlay}
                    disabled={!canManageMusic}
                    className={`w-full ${darkUiAccentPrimaryButtonClass}`}
                  >
                    Add All to Must Play
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => runAutoCategorization(importedPlaylistSongs)}
                    disabled={!canManageMusic}
                    className={`w-full ${darkUiSecondaryOutlineButtonClass}`}
                  >
                    Categorize Automatically
                  </PrimaryButton>
                </div>
              </PremiumCard>
            )}
          </section>
        )}

        {authStage === "app" &&
          appMode === "event" &&
          (activeScreen === "Timeline" || activeScreen === "Reception Timeline") &&
          sectionReceptionTimelineEnabled && (
          <section
            className={`mt-6 min-w-0 overflow-x-hidden ${isCoupleView ? "space-y-6 sm:space-y-5" : "space-y-5 sm:space-y-3"}`}
          >
            <EventHomeNav
              trail={
                activeScreen === "Reception Timeline"
                  ? ["Reception timeline"]
                  : ["Event timeline"]
              }
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={{
                label: "+ Add moment",
                onClick: () => {
                  resetTimelineForm();
                  setReceptionTimelineExpandedId(null);
                  setTimelineComposerOpen(true);
                  window.setTimeout(() => {
                    timelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }, 50);
                },
                disabled: !canEditTimeline,
              }}
            />
            {!canEditTimeline && (
              <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                <p className="text-xs font-medium text-amber-950">
                  {effectiveRole} role can view timeline, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
            <div className="no-print flex min-w-0 flex-col gap-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="min-w-0 text-xl font-semibold tracking-tight text-stone-900 sm:text-lg md:text-xl">
                      {activeScreen === "Reception Timeline" ? "Reception timeline" : "Event timeline"}
                    </h2>
                    <PersistEcho
                      persistFeedback={persistFeedback}
                      variant="light"
                      className="pt-1 sm:pt-0.5"
                    />
                  </div>
                  <p className="mt-2 max-w-prose text-sm text-stone-700 sm:mt-1 sm:text-xs md:text-sm">
                    {showTimelinePresetOnboarding
                      ? "Start with a suggested flow or add your own moments—everything stays editable."
                      : "Read top-to-bottom like the night itself—time, moment, music, then cues. Expand a row to edit."}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                  {hasAnyTimelinePresetTools && mainTimelinePresetsForActiveEvent.length > 0 ? (
                    <details className="group w-full rounded-xl border border-stone-300 bg-white shadow-sm sm:w-auto sm:min-w-[220px]">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[13px] font-semibold text-stone-900 sm:min-h-0 sm:text-[12px] [&::-webkit-details-marker]:hidden">
                        <span>Preset tools</span>
                        <span className="text-[10px] font-medium text-stone-500 transition-transform group-open:rotate-180">
                          ▼
                        </span>
                      </summary>
                      <div className="space-y-3 border-t border-stone-200 px-3 pb-3 pt-3">
                        <PrimaryButton
                          type="button"
                          onClick={() => applyTimelinePresetsForActiveEvent()}
                          disabled={!canEditTimeline}
                          className="w-full rounded-xl border border-black bg-[#00D4FF] px-3 py-2.5 text-[11px] font-semibold text-black shadow-none hover:brightness-105 disabled:opacity-45"
                        >
                          Apply preset again…
                        </PrimaryButton>
                        <div>
                          <label
                            htmlFor="timeline-preset-quick-add"
                            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600"
                          >
                            Add suggested moment
                          </label>
                          <select
                            id="timeline-preset-quick-add"
                            defaultValue=""
                            disabled={!canEditTimeline}
                            onChange={(event) => {
                              const id = event.target.value;
                              if (!id) return;
                              const preset = mainTimelinePresetsForActiveEvent.find((p) => p.id === id);
                              if (preset) addReceptionPreset(preset);
                              event.target.selectedIndex = 0;
                            }}
                            className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-none transition focus:border-[#00D4FF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/25 disabled:opacity-45"
                          >
                            <option value="">Choose a moment…</option>
                            {mainTimelinePresetsForActiveEvent.map((preset) => (
                              <option key={`preset-opt-${preset.id}`} value={preset.id}>
                                {preset.momentName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            </div>

            {showTimelinePresetOnboarding && (
              <PremiumCard className="no-print border-zinc-800 bg-zinc-950 py-5 shadow-none">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#00D4FF]/85">Get started</p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-100">Build your run of show</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Load the suggested {layoutProfileForActiveEvent} timeline (editable), or create your first moment from
                  scratch.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <PrimaryButton
                    type="button"
                    onClick={handleApplySuggestedTimelineSetup}
                    disabled={
                      !canEditTimeline ||
                      !timelinePresetsForActiveEvent.some((p) => p.defaultIncluded)
                    }
                    className="min-h-12 w-full rounded-xl border border-black bg-[#00D4FF] px-4 py-3 text-sm font-semibold text-black shadow-none hover:brightness-105 disabled:opacity-45 sm:w-auto sm:min-h-11 sm:py-2.5"
                  >
                    Apply suggested {layoutProfileForActiveEvent} timeline
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      resetTimelineForm();
                      setReceptionTimelineExpandedId(null);
                      setTimelineComposerOpen(true);
                      window.setTimeout(() => {
                        timelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }, 50);
                    }}
                    disabled={!canEditTimeline}
                    className="min-h-12 w-full rounded-xl border border-zinc-600 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-none hover:bg-zinc-50 disabled:opacity-45 sm:w-auto sm:min-h-11 sm:py-2.5"
                  >
                    Start from scratch
                  </PrimaryButton>
                </div>
                {!canEditTimeline ? (
                  <p className="mt-4 text-xs text-zinc-500">Editing presets isn&apos;t available for your role.</p>
                ) : !timelinePresetsForActiveEvent.some((p) => p.defaultIncluded) ? (
                  <p className="mt-4 text-xs text-zinc-500">
                    No default moments are enabled for this event type in Global Settings → Timeline Presets.
                  </p>
                ) : (
                  <p className="mt-4 text-xs text-zinc-500">
                    Tip: after your timeline has moments, preset shortcuts move under{" "}
                    <span className="font-medium text-zinc-400">Preset tools</span>.
                  </p>
                )}
              </PremiumCard>
            )}

            {timelineComposerOpen && (
              <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
                <div ref={timelineComposerRef}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <SectionTitle className="!text-zinc-100">New moment</SectionTitle>
                      <p className="mt-1 text-xs text-zinc-400">
                        Lightweight capture—fine-tune anytime inline on the timeline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetTimelineForm();
                        setTimelineComposerOpen(false);
                      }}
                      className="rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
                    >
                      Close
                    </button>
                  </div>
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addOrUpdateTimelineItem();
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextInput
                        id="timeline-time"
                        label="Time / order"
                        value={timelineTime}
                        onChange={setTimelineTime}
                        placeholder="e.g. 6:30 PM (optional)"
                        disabled={!canEditTimeline}
                      />
                      <div className="space-y-0">
                        <TextInput
                          id="timeline-title"
                          label="Moment"
                          value={timelineTitle}
                          onChange={(value) => {
                            setTimelineTitle(value);
                            setTimelineComposerError(null);
                          }}
                          placeholder="Required — e.g. Dinner service begins"
                          disabled={!canEditTimeline}
                        />
                        {timelineComposerError ? (
                          <p className="mt-1.5 text-xs text-rose-300">{timelineComposerError}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextInput
                        id="timeline-song-title"
                        label="Song title"
                        value={timelineSongTitle}
                        onChange={setTimelineSongTitle}
                        placeholder="Optional"
                        disabled={!canEditTimeline}
                      />
                      <TextInput
                        id="timeline-artist"
                        label="Artist"
                        value={timelineArtist}
                        onChange={setTimelineArtist}
                        placeholder="Optional"
                        disabled={!canEditTimeline}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="timeline-category"
                        className="text-[11px] uppercase tracking-wide text-zinc-400"
                      >
                        Category
                      </label>
                      <select
                        id="timeline-category"
                        value={timelineCategory}
                        disabled={!canEditTimeline}
                        onChange={(event) =>
                          setTimelineCategory(event.target.value as TimelineCategory)
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 transition focus:border-[#00D4FF]/70 focus:outline-none"
                      >
                        {timelineCategories.map((category) => (
                          <option key={category} value={category} className="bg-[#141419] text-zinc-100">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <TextArea
                      id="timeline-notes"
                      label="Notes / cues"
                      value={timelineNotes}
                      onChange={setTimelineNotes}
                      placeholder="Production notes, MC guidance…"
                      disabled={!canEditTimeline}
                    />
                    <PrimaryButton
                      type="button"
                      onClick={() => setTimelineNeedsAttention((prev) => !prev)}
                      disabled={!canEditTimeline}
                      className={`w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none ${
                        timelineNeedsAttention
                          ? "border-[#00D4FF] bg-[#00D4FF]/15 text-zinc-100"
                          : "border-white/20 bg-white/[0.06] text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      {timelineNeedsAttention
                        ? "DJ/MC attention marked"
                        : "Flag DJ/MC attention"}
                    </PrimaryButton>
                    <PrimaryButton
                      type="submit"
                      disabled={!canEditTimeline}
                      className="w-full border border-black bg-[#00D4FF] py-3 text-sm font-semibold text-black shadow-none hover:brightness-105"
                    >
                      Add to timeline
                    </PrimaryButton>
                  </form>
                </div>
              </PremiumCard>
            )}

            {mergedTimelineItems.length > 0 && receptionTimelineClockOrderConflict ? (
              <div className="no-print rounded-xl border border-stone-300 bg-stone-50/90 px-4 py-3 shadow-none sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">
                    Timeline order doesn&apos;t match entered times.
                  </p>
                  <p className="mt-1 text-xs leading-snug text-stone-600">
                    Review timing or re-sort chronologically.
                  </p>
                </div>
                <PrimaryButton
                  type="button"
                  disabled={!canEditTimeline}
                  onClick={sortReceptionTimelineByEnteredTime}
                  className="mt-3 w-full rounded-lg border border-stone-400 bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:mt-0 sm:w-auto sm:shrink-0 sm:py-2"
                >
                  Sort by Time
                </PrimaryButton>
              </div>
            ) : null}

            <div
              ref={timelineStreamRef}
              className="min-w-0 max-h-[min(72dvh,52rem)] space-y-5 overflow-x-hidden overflow-y-auto overscroll-y-contain sm:space-y-4 md:space-y-3"
            >
            {mergedTimelineItems.length === 0 ? (
              showTimelinePresetOnboarding ? null : (
                <SectionEmptyState
                  title="No reception moments yet"
                  description="Build your run of show—each row is time, moment, music, then cues."
                  primaryAction={{
                    label: "+ Add moment",
                    onClick: () => {
                      resetTimelineForm();
                      setReceptionTimelineExpandedId(null);
                      setTimelineComposerOpen(true);
                      window.setTimeout(() => {
                        timelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }, 50);
                    },
                    disabled: !canEditTimeline,
                  }}
                  secondaryAction={
                    mainTimelinePresetsForActiveEvent.length > 0 &&
                    timelinePresetsForActiveEvent.some((p) => p.defaultIncluded)
                      ? {
                          label: `Apply suggested ${layoutProfileForActiveEvent} timeline`,
                          onClick: handleApplySuggestedTimelineSetup,
                          disabled:
                            !canEditTimeline || !timelinePresetsForActiveEvent.some((p) => p.defaultIncluded),
                        }
                      : undefined
                  }
                />
              )
            ) : (
              mergedTimelineItems.map((item, index) => {
                const timelineRow = timelineItems.find((t) => t.id === item.id);
                const rowExpanded = receptionTimelineExpandedId === item.id;
                const songPreview =
                  [item.songTitle?.trim(), item.artist?.trim()].filter(Boolean).join(" · ") ||
                  (item.notes?.trim()
                    ? item.notes.trim().split(/\n/)[0].slice(0, 180)
                    : "—");
                const cueKind =
                  (item.songTitle?.trim() || item.artist?.trim()) ? "Song" : "Cue";
                const isDragging = draggingTimelineId === item.id;
                const isDropTarget = dropTargetTimelineId === item.id && draggingTimelineId !== item.id;
                return (
                <PremiumCard
                  key={item.id}
                  className={`rounded-xl border-2 border-stone-300 bg-white transition-all duration-200 !p-0 px-4 py-6 sm:px-5 sm:py-5 ${
                    index % 2 === 1 ? "bg-stone-50" : ""
                  } ${
                    isDragging ? "scale-[1.005] border-stone-800 shadow-sm" : ""
                  } ${isDropTarget ? "ring-2 ring-[#00D4FF] ring-offset-2 ring-offset-white" : ""}`}
                  onDragOver={(event) => {
                    if (!canEditTimeline || !draggingTimelineId) return;
                    event.preventDefault();
                    if (draggingTimelineId !== item.id) {
                      dropTargetTimelineIdRef.current = item.id;
                      setDropTargetTimelineId(item.id);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!canEditTimeline || !draggingTimelineId) return;
                    reorderTimelineItemToTarget(draggingTimelineId, item.id);
                    setDraggingTimelineId(null);
                    setDropTargetTimelineId(null);
                    dropTargetTimelineIdRef.current = null;
                    touchDragTimelineSourceRef.current = null;
                  }}
                  onDragEnd={() => {
                    setDraggingTimelineId(null);
                    setDropTargetTimelineId(null);
                    dropTargetTimelineIdRef.current = null;
                    touchDragTimelineSourceRef.current = null;
                  }}
                  data-timeline-id={item.id}
                >
                  {isDropTarget && (
                    <div className="mb-2 h-0.5 w-full rounded-full bg-[#00D4FF]" />
                  )}
                  {!rowExpanded && (
                    <div className="flex flex-col gap-5 sm:gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold leading-snug tracking-tight text-stone-900 [overflow-wrap:anywhere]">
                            {item.title}
                          </h3>
                          <p className="mt-1.5 font-mono text-base font-semibold tabular-nums text-stone-800 sm:text-sm">
                            {item.time?.trim() || "—"}
                          </p>
                        </div>
                        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:max-w-[55%] sm:justify-end lg:max-w-none">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              item.category === "Formalities"
                                ? "border-stone-500 bg-stone-200 text-stone-900"
                                : "border-stone-300 bg-white text-stone-700"
                            }`}
                          >
                            {item.category}
                          </span>
                          {item.needsDjMcAttention ? (
                            <span className="rounded-md border border-[#7E52A0]/55 bg-[#7E52A0]/12 px-2 py-0.5 text-[10px] font-semibold text-[#4c3266]">
                              DJ/MC
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="break-words text-[15px] leading-snug text-stone-900 sm:text-sm [overflow-wrap:anywhere]">
                        <span className="font-medium text-stone-500">{cueKind} · </span>
                        {songPreview}
                      </p>
                      {item.notes?.trim() ? (
                        <p className="line-clamp-2 text-xs leading-relaxed text-stone-600 [overflow-wrap:anywhere]">
                          {item.notes}
                        </p>
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                        <PrimaryButton
                          type="button"
                          onClick={() => setReceptionTimelineExpandedId(item.id)}
                          disabled={!canEditTimeline}
                          className="min-h-12 flex-1 rounded-lg border border-stone-400 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:py-2 sm:text-[12px] sm:flex-none sm:px-4"
                        >
                          Edit
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => prepareAddMomentAfterTimelineItem(item.id)}
                          disabled={!canEditTimeline}
                          className="min-h-12 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-medium text-stone-800 shadow-none hover:border-stone-500 hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:py-2 sm:text-[12px] sm:flex-none"
                        >
                          + After
                        </PrimaryButton>
                        <details className="min-h-12 flex-1 sm:min-h-10 sm:max-w-[8.5rem] sm:flex-none">
                          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center rounded-lg border border-stone-300 bg-stone-50 px-2 text-[12px] font-semibold text-stone-800 shadow-none [&::-webkit-details-marker]:hidden hover:bg-white sm:min-h-10 sm:text-[11px]">
                            More
                          </summary>
                          <div className="mt-2 space-y-2 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
                            <div className="grid grid-cols-2 gap-2">
                              <PrimaryButton
                                type="button"
                                onClick={() => moveTimelineItem(item.id, "up")}
                                disabled={!canEditTimeline}
                                className="rounded-lg border border-stone-300 bg-white py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                              >
                                Up
                              </PrimaryButton>
                              <PrimaryButton
                                type="button"
                                onClick={() => moveTimelineItem(item.id, "down")}
                                disabled={!canEditTimeline}
                                className="rounded-lg border border-stone-300 bg-white py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                              >
                                Down
                              </PrimaryButton>
                            </div>
                            <PrimaryButton
                              type="button"
                              onClick={() => {
                                const row = timelineItems.find((t) => t.id === item.id);
                                if (row) duplicateTimelineItem(row);
                              }}
                              disabled={!canEditTimeline}
                              className="w-full rounded-lg border border-stone-300 bg-white py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                            >
                              Duplicate
                            </PrimaryButton>
                            <PrimaryButton
                              type="button"
                              onClick={() => deleteTimelineItem(item.id)}
                              disabled={!canEditTimeline}
                              className="w-full rounded-lg border border-rose-400 bg-white py-2 text-[11px] font-semibold text-rose-900 shadow-none hover:bg-rose-50"
                            >
                              Delete
                            </PrimaryButton>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                  {rowExpanded && (
                    <>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                        <p className="text-[13px] font-semibold tracking-tight text-stone-900">Edit moment</p>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <details className="min-h-10 sm:max-w-[8.5rem]">
                            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-lg border border-stone-300 bg-stone-50 px-3 text-[11px] font-semibold text-stone-800 shadow-none [&::-webkit-details-marker]:hidden hover:bg-white">
                              More
                            </summary>
                            <div className="mt-2 space-y-2 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
                              <div className="grid grid-cols-2 gap-2">
                                <PrimaryButton
                                  type="button"
                                  onClick={() => moveTimelineItem(item.id, "up")}
                                  disabled={!canEditTimeline}
                                  className="rounded-lg border border-stone-300 bg-white py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                                >
                                  Up
                                </PrimaryButton>
                                <PrimaryButton
                                  type="button"
                                  onClick={() => moveTimelineItem(item.id, "down")}
                                  disabled={!canEditTimeline}
                                  className="rounded-lg border border-stone-300 bg-white py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                                >
                                  Down
                                </PrimaryButton>
                              </div>
                              <PrimaryButton
                                type="button"
                                onClick={() => {
                                  const row = timelineItems.find((t) => t.id === item.id);
                                  if (row) duplicateTimelineItem(row);
                                }}
                                disabled={!canEditTimeline}
                                className="w-full rounded-lg border border-stone-300 bg-white py-2 text-[11px] font-medium text-stone-900 shadow-none hover:bg-stone-50"
                              >
                                Duplicate
                              </PrimaryButton>
                              <PrimaryButton
                                type="button"
                                onClick={() => deleteTimelineItem(item.id)}
                                disabled={!canEditTimeline}
                                className="w-full rounded-lg border border-rose-400 bg-white py-2 text-[11px] font-semibold text-rose-900 shadow-none hover:bg-rose-50"
                              >
                                Delete
                              </PrimaryButton>
                            </div>
                          </details>
                          <PrimaryButton
                            type="button"
                            onClick={() => setReceptionTimelineExpandedId(null)}
                            className="min-h-10 rounded-lg border border-stone-400 bg-white px-4 py-2 text-[12px] font-semibold text-stone-900 shadow-none hover:bg-stone-50"
                          >
                            Done
                          </PrimaryButton>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <TextInput
                          id={`timeline-inline-title-${item.id}`}
                          label="Moment"
                          value={item.title}
                          onChange={(value) => {
                            setTimelineItems((prev) =>
                              prev.map((existing) =>
                                existing.id === item.id ? { ...existing, title: value } : existing,
                              ),
                            );
                          }}
                          disabled={!canEditTimeline}
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <TextInput
                            id={`timeline-inline-time-${item.id}`}
                            label="Time"
                            value={item.time}
                            onChange={(value) => {
                              setTimelineItems((prev) =>
                                prev.map((existing) =>
                                  existing.id === item.id ? { ...existing, time: value } : existing,
                                ),
                              );
                            }}
                            disabled={!canEditTimeline}
                          />
                          <div>
                            <label
                              htmlFor={`timeline-inline-cat-${item.id}`}
                              className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-600"
                            >
                              Category
                            </label>
                            <select
                              id={`timeline-inline-cat-${item.id}`}
                              value={timelineRow?.category ?? item.category}
                              disabled={!canEditTimeline}
                              onChange={(event) => {
                                const next = event.target.value as TimelineCategory;
                                setTimelineItems((prev) =>
                                  prev.map((existing) =>
                                    existing.id === item.id ? { ...existing, category: next } : existing,
                                  ),
                                );
                              }}
                              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-none transition focus:border-[#00D4FF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/25"
                            >
                              {timelineCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <TextInput
                            id={`timeline-inline-song-${item.id}`}
                            label="Song"
                            value={timelineRow?.songTitle ?? ""}
                            onChange={(value) => {
                              setTimelineItems((prev) =>
                                prev.map((existing) =>
                                  existing.id === item.id ? { ...existing, songTitle: value } : existing,
                                ),
                              );
                            }}
                            placeholder="Song title"
                            disabled={!canEditTimeline}
                          />
                          <TextInput
                            id={`timeline-inline-song-artist-${item.id}`}
                            label="Artist"
                            value={timelineRow?.artist ?? ""}
                            onChange={(value) => {
                              setTimelineItems((prev) =>
                                prev.map((existing) =>
                                  existing.id === item.id ? { ...existing, artist: value } : existing,
                                ),
                              );
                            }}
                            placeholder="Artist"
                            disabled={!canEditTimeline}
                          />
                        </div>
                        <TextArea
                          id={`timeline-inline-notes-${item.id}`}
                          label="Notes"
                          value={item.notes}
                          onChange={(value) => {
                            setTimelineItems((prev) =>
                              prev.map((existing) =>
                                existing.id === item.id ? { ...existing, notes: value } : existing,
                              ),
                            );
                          }}
                          rows={2}
                          disabled={!canEditTimeline}
                        />
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setTimelineItems((prev) =>
                              prev.map((existing) =>
                                existing.id === item.id
                                  ? { ...existing, needsDjMcAttention: !existing.needsDjMcAttention }
                                  : existing,
                              ),
                            )
                          }
                          disabled={!canEditTimeline}
                          className={`w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none ${
                            timelineRow?.needsDjMcAttention
                              ? "border-[#00D4FF] bg-[#00D4FF]/12 text-stone-900"
                              : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                          }`}
                        >
                          {timelineRow?.needsDjMcAttention ? "DJ/MC flagged" : "Flag DJ / MC"}
                        </PrimaryButton>

                        <details className="rounded-lg border border-stone-200 bg-stone-50">
                          <summary className="flex min-h-10 cursor-pointer list-none items-center px-3 py-2 text-[11px] font-semibold text-stone-700 [&::-webkit-details-marker]:hidden hover:bg-white">
                            Fade / advanced timing
                          </summary>
                          <div className="space-y-2 border-t border-stone-200 bg-white p-3">
                            <p className="text-[10px] leading-relaxed text-stone-600">
                              Optional cue — common for introductions and formalities.
                            </p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <PrimaryButton
                                type="button"
                                onClick={() =>
                                  setTimelineItems((prev) =>
                                    prev.map((existing) =>
                                      existing.id === item.id
                                        ? { ...existing, fadeOutEarly: !existing.fadeOutEarly }
                                        : existing,
                                    ),
                                  )
                                }
                                disabled={!canEditTimeline}
                                className={`w-full rounded-lg border py-2 text-[12px] font-semibold shadow-none ${
                                  timelineRow?.fadeOutEarly
                                    ? "border-[#00D4FF] bg-[#00D4FF]/12 text-stone-900"
                                    : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                                }`}
                              >
                                {timelineRow?.fadeOutEarly ? "Fade out early: On" : "Fade out early"}
                              </PrimaryButton>
                              <TextInput
                                id={`timeline-inline-fade-${item.id}`}
                                label="Fade timestamp"
                                value={timelineRow?.fadeOutTimestamp ?? ""}
                                onChange={(value) =>
                                  setTimelineItems((prev) =>
                                    prev.map((existing) =>
                                      existing.id === item.id
                                        ? { ...existing, fadeOutTimestamp: value }
                                        : existing,
                                    ),
                                  )
                                }
                                placeholder="e.g. 1:20"
                                disabled={!canEditTimeline}
                              />
                            </div>
                          </div>
                        </details>
                      </div>
                    </>
                  )}
                  <div className="mt-5 flex flex-col gap-2 border-t border-stone-200 pt-4 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pt-3">
                    <button
                      type="button"
                      draggable={canEditTimeline}
                      onDragStart={(event) => {
                        if (!canEditTimeline) return;
                        touchDragTimelineSourceRef.current = null;
                        event.dataTransfer.effectAllowed = "move";
                        setDraggingTimelineId(item.id);
                      }}
                      onDragEnd={() => {
                        setDraggingTimelineId(null);
                        setDropTargetTimelineId(null);
                        dropTargetTimelineIdRef.current = null;
                        touchDragTimelineSourceRef.current = null;
                      }}
                      onTouchStart={() => {
                        if (!canEditTimeline) return;
                        touchDragTimelineSourceRef.current = item.id;
                        setDraggingTimelineId(item.id);
                      }}
                      className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-stone-400 bg-stone-100 px-4 py-3 text-[13px] font-semibold text-stone-900 shadow-none transition hover:border-stone-500 hover:bg-stone-200 active:scale-[0.98] disabled:opacity-50 sm:min-h-11 sm:w-auto sm:py-2.5 sm:text-[12px] md:min-w-[9rem]"
                      disabled={!canEditTimeline}
                      aria-label={`Drag handle for ${item.title}`}
                    >
                      <span className="text-[10px] tracking-wide text-stone-500">::</span>
                      <span>Reorder</span>
                    </button>
                    <p className="shrink-0 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-700 sm:text-left sm:text-[10px] sm:font-medium sm:text-stone-600">
                      {index + 1} / {mergedTimelineItems.length}
                    </p>
                  </div>
                </PremiumCard>
              )})
            )}
            </div>

            {!isCoupleView && (
              <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
                <SectionTitle className="!text-zinc-100">Timeline Assistant</SectionTitle>
                <p className="mt-1 text-xs text-zinc-500">
                  Reception flow, spacing, and overlap checks.
                </p>
                <div className="mt-3">
                  <InsightStack
                    insights={planningInsights.filter((i) => i.section === "timeline")}
                    emptyLabel="Timeline spacing reads smooth."
                  />
                </div>
              </PremiumCard>
            )}
          </section>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "Timeline Templates" && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
              <SectionTitle className="!text-zinc-100">Timeline Templates</SectionTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Apply a preset, save current flow as a custom template, or refine custom templates.
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Global defaults: {appSettings.globalTemplateDefaults}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={openCreateTemplateModal}
                  className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
                >
                  Save Current as Template
                </PrimaryButton>
              </div>
            </PremiumCard>

            {templates.map((template) => (
              <PremiumCard key={template.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SectionTitle className="text-stone-950">{template.name}</SectionTitle>
                    <p className="mt-1 text-xs text-stone-600">
                      {template.timelineItems.length} timeline items (formal moments included)
                    </p>
                    <span className="mt-2 inline-flex rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-800">
                      {template.kind === "built_in" ? "Built-in" : "Custom"}
                    </span>
                  </div>
                </div>
                {template.planningSuggestions.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-stone-600">
                    {template.planningSuggestions.slice(0, 2).map((tip) => (
                      <li key={`${template.id}-${tip}`}>- {tip}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <PrimaryButton
                    onClick={() => {
                      setTimelineItems(
                        migrateFormalitiesIntoTimelineItems(
                          cloneJson(template.timelineItems),
                          cloneJson(template.formalities ?? []),
                        ),
                      );
                      setPlannerNotes(cloneJson(template.planningSuggestions));
                      logActivity("template_applied", `Applied template: ${template.name}`);
                      setActiveScreen("Timeline");
                    }}
                    className="rounded-xl border border-black bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black shadow-none hover:brightness-105"
                  >
                    Apply Template
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => {
                      const duplicate: TimelineTemplate = {
                        ...cloneJson(template),
                        id: `tpl-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        name: `${template.name} Copy`,
                        kind: "custom",
                      };
                      setTemplates((prev) => [...prev, duplicate]);
                    }}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 shadow-none hover:bg-stone-50"
                  >
                    Duplicate
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => openEditTemplateModal(template)}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 shadow-none hover:bg-stone-50"
                  >
                    Edit
                  </PrimaryButton>
                  {template.kind === "custom" && (
                    <PrimaryButton
                      onClick={() => {
                        const ok = window.confirm(`Delete template "${template.name}"?`);
                        if (!ok) return;
                        setTemplates((prev) => prev.filter((tpl) => tpl.id !== template.id));
                      }}
                      className="rounded-xl border border-rose-400 bg-white px-3 py-2 text-xs font-semibold text-rose-900 shadow-none hover:bg-rose-50"
                    >
                      Delete
                    </PrimaryButton>
                  )}
                </div>
              </PremiumCard>
            ))}
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Collaborators" && (
          <section className="mt-6 space-y-3">
            <EventHomeNav
              trail={["Collaborators"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={{
                label: "Invite",
                onClick: () => setInviteModalOpen(true),
              }}
            />
            <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
              <SectionTitle className="!text-zinc-100">Collaborators</SectionTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Prototype event access and role visibility. Invites are simulated locally.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">
                  Accepted: <span className="text-white">{acceptedCollaborators.length}</span>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">
                  Pending: <span className="text-white">{pendingCollaborators.length}</span>
                </div>
              </div>
            </PremiumCard>

            {(activeEvent?.collaborators ?? []).map((collab) => (
              <PremiumCard key={collab.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{collab.name}</p>
                    <p className="mt-1 text-xs text-zinc-400">{collab.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${roleBadgeClass(collab.role)}`}>
                        {collab.role}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${collab.status === "Accepted" ? "bg-emerald-500/20 text-emerald-200" : "bg-[#7E52A0]/22 text-violet-200"}`}>
                        {collab.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <select
                    value={collab.role}
                    onChange={(event) =>
                      updateCollaboratorsForActiveEvent((current) =>
                        current.map((c) =>
                          c.id === collab.id ? { ...c, role: event.target.value as UserRole } : c,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-100"
                  >
                    {(["Couple", "DJ", "Planner", "Admin"] as UserRole[]).map((role) => (
                      <option key={`${collab.id}-${role}`} value={role} className="bg-[#141419]">
                        {role}
                      </option>
                    ))}
                  </select>
                  <PrimaryButton
                    onClick={() =>
                      updateCollaboratorsForActiveEvent((current) =>
                        current.map((c) =>
                          c.id === collab.id ? { ...c, status: c.status === "Pending" ? "Accepted" : "Pending" } : c,
                        ),
                      )
                    }
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
                  >
                    {collab.status === "Pending" ? "Simulate Accept" : "Set Pending"}
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => {
                      const ok =
                        typeof window === "undefined" ||
                        window.confirm(
                          `Remove "${collab.name}" from this event? They lose access until invited again.`,
                        );
                      if (!ok) return;
                      updateCollaboratorsForActiveEvent((current) =>
                        current.filter((c) => c.id !== collab.id),
                      );
                      logActivity(
                        "collaborator_removed_from_event",
                        `Removed collaborator ${collab.name} (${collab.role}) from event`,
                      );
                    }}
                    disabled={!canInviteCollaborators}
                    className="col-span-2 rounded-xl bg-[#6f5353]/40 px-3 py-2 text-xs font-semibold text-[#f2dede] hover:bg-[#6f5353]/55 disabled:opacity-45"
                  >
                    Remove from Event
                  </PrimaryButton>
                </div>
              </PremiumCard>
            ))}

            <PremiumCard>
              <SectionTitle className="text-stone-950">Event Access Cards</SectionTitle>
              <div className="mt-3 space-y-2 text-xs">
                <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">Couple: edit planning, submit music, manage guest requests</div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">DJ: edit timeline, manage music, view prep sheet</div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">Planner: edit timeline, add notes, view progress</div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">Admin: full access</div>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Guest Requests" && sectionGuestRequestsEnabled && (
          <section className="mt-6 space-y-3">
            <EventHomeNav
              trail={["Guest Requests"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={
                guestRequestView === "admin" && coupleAttentionSummary.pendingGuestCount > 0
                  ? {
                      label: "Review queue",
                      onClick: () =>
                        document.getElementById("guest-requests-queue-anchor")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                    }
                  : undefined
              }
            />
            {!canManageGuestRequests && (
              <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                <p className="text-xs font-medium text-amber-950">
                  {effectiveRole} role can view guest requests, but management actions are limited.
                </p>
              </PremiumCard>
            )}
            <PremiumCard>
              <div className="flex items-center justify-between gap-2">
                <SectionTitle className="text-stone-950">Guest Requests</SectionTitle>
                <div className="flex rounded-xl border border-stone-300 bg-stone-100 p-0.5">
                  <PrimaryButton
                    onClick={() => setGuestRequestView("admin")}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold shadow-none ${
                      guestRequestView === "admin"
                        ? "border border-black bg-[#00D4FF] text-black"
                        : "bg-transparent text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Couple / Admin
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setGuestRequestView("guest")}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold shadow-none ${
                      guestRequestView === "guest"
                        ? "border border-black bg-[#00D4FF] text-black"
                        : "bg-transparent text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Guest View
                  </PrimaryButton>
                </div>
              </div>
              <p className="mt-2 text-xs text-stone-600">
                Switch views to test the public request flow versus couple review.
              </p>
            </PremiumCard>

            {guestRequestView === "admin" ? (
              <>
                <PremiumCard>
                  <SectionTitle className="text-stone-950">Public Request Link</SectionTitle>
                  <p className="mt-2 text-xs text-stone-600">
                    {effectiveGuestRequestMessage}
                  </p>
                  <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs font-medium text-stone-900">
                    cutmasterplanning.com/request/alex-jordan
                  </div>
                </PremiumCard>

                <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
                  <SectionTitle className="!text-zinc-100">Guest Requests Assistant</SectionTitle>
                  <p className="mt-1 text-xs text-zinc-500">
                    Queue health for approvals.
                  </p>
                  <div className="mt-3">
                    <InsightStack
                      insights={planningInsights.filter((i) => i.section === "guest")}
                      emptyLabel="Guest queue looks manageable."
                    />
                  </div>
                </PremiumCard>

                <div id="guest-requests-queue-anchor">
                <PremiumCard>
                  <SectionTitle className="text-stone-950">Guest-Submitted Songs</SectionTitle>
                  {guestRequests.length === 0 ? (
                    <div className="mt-3">
                      <SectionEmptyState
                        wrapWithCard={false}
                        title="No requests yet"
                        description="Share the link above—submissions land here for review."
                        secondaryAction={{
                          label: "Preview guest view",
                          onClick: () => setGuestRequestView("guest"),
                        }}
                      />
                    </div>
                  ) : (
                  <div className="mt-3 space-y-3">
                    {guestRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-stone-900">
                              {request.songTitle}
                              {request.artist ? (
                                <span className="font-medium text-stone-600">
                                  {" "}
                                  - {request.artist}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-stone-600">
                              Requested by {request.guestName}
                            </p>
                            {request.dedication ? (
                              <p className="mt-2 text-xs italic text-stone-700">
                                &ldquo;{request.dedication}&rdquo;
                              </p>
                            ) : null}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${guestRequestStatusBadgeClass(request.status)}`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton
                            onClick={() => setGuestRequestStatus(request.id, "Approved")}
                            disabled={!canManageGuestRequests || request.status === "Approved"}
                            className="flex-1 min-w-[6rem] rounded-lg border border-black bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black shadow-none hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Approve
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => setGuestRequestStatus(request.id, "Rejected")}
                            disabled={!canManageGuestRequests || request.status === "Rejected"}
                            className="flex-1 min-w-[6rem] rounded-lg border border-rose-400 bg-white px-3 py-2 text-xs font-semibold text-rose-900 shadow-none hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Reject
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => setGuestRequestStatus(request.id, "Pending")}
                            disabled={!canManageGuestRequests || request.status === "Pending"}
                            className="flex-1 min-w-[6rem] rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-none hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Pending
                          </PrimaryButton>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <PrimaryButton
                            onClick={() => addGuestRequestToMustPlay(request)}
                            disabled={
                              !canManageGuestRequests ||
                              request.addedToMustPlay ||
                              request.status === "Rejected"
                            }
                            className="flex-1 min-w-[8rem] rounded-lg border border-[#00D4FF] bg-[#00D4FF]/12 px-3 py-2 text-[11px] font-semibold text-stone-900 shadow-none hover:bg-[#00D4FF]/22 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {request.addedToMustPlay ? "On Must Play" : "Add to Must Play"}
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => addGuestRequestToDoNotPlay(request)}
                            disabled={
                              !canManageGuestRequests ||
                              request.addedToDoNotPlay ||
                              request.status === "Rejected"
                            }
                            className="flex-1 min-w-[8rem] rounded-lg border border-[#7a5c5c]/40 bg-[#6f5353]/25 px-3 py-2 text-[11px] text-[#f2dede] hover:bg-[#6f5353]/40 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {request.addedToDoNotPlay ? "On Do Not Play" : "Add to Do Not Play"}
                          </PrimaryButton>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </PremiumCard>
                </div>
              </>
            ) : (
              <PremiumCard>
                <SectionTitle className="text-stone-950">Request a Song</SectionTitle>
                <p className="mt-2 text-xs text-stone-600">
                  {effectiveGuestRequestMessage}
                </p>
                {guestSubmitBanner ? (
                  <p className="mt-3 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/12 px-3 py-2 text-xs font-medium text-stone-900">
                    {guestSubmitBanner}
                  </p>
                ) : null}
                <div className="mt-4 space-y-3">
                  <TextInput
                    id="guest-form-name"
                    label="Your Name"
                    value={guestFormName}
                    onChange={setGuestFormName}
                    placeholder="e.g. Jamie Lee"
                    disabled={!canManageGuestRequests}
                  />
                  <TextInput
                    id="guest-form-title"
                    label="Song Title"
                    value={guestFormTitle}
                    onChange={setGuestFormTitle}
                    placeholder="e.g. Levitating"
                    disabled={!canManageGuestRequests}
                  />
                  <TextInput
                    id="guest-form-artist"
                    label="Artist"
                    value={guestFormArtist}
                    onChange={setGuestFormArtist}
                    placeholder="e.g. Dua Lipa"
                    disabled={!canManageGuestRequests}
                  />
                  <TextArea
                    id="guest-form-dedication"
                    label="Dedication or message"
                    value={guestFormDedication}
                    onChange={setGuestFormDedication}
                    placeholder="Optional shout-out or memory..."
                    rows={3}
                    disabled={!canManageGuestRequests}
                  />
                  <PrimaryButton
                    onClick={submitGuestRequestForm}
                    disabled={!canManageGuestRequests}
                    className="w-full border border-black bg-[#00D4FF] py-2.5 text-sm font-semibold text-black shadow-none hover:brightness-105"
                  >
                    Submit Request
                  </PrimaryButton>
                </div>
              </PremiumCard>
            )}
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Ceremony" && sectionCeremonyEnabled && (
          <section
            className={`mt-6 min-w-0 overflow-x-hidden ${isCoupleView ? "space-y-6 sm:space-y-5" : "space-y-5 sm:space-y-3"}`}
          >
            <EventHomeNav
              trail={["Ceremony"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={{
                label: "+ Add ceremony moment",
                onClick: openCeremonyTimelineComposer,
                disabled: !canEditTimeline,
              }}
            />
            {!canEditTimeline && (
              <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                <p className="text-xs font-medium text-amber-950">
                  {effectiveRole} role can view ceremony timeline, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}

            <div className="no-print">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-lg md:text-xl">
                  Ceremony timeline
                </h2>
                <p className="mt-2 max-w-prose text-sm text-stone-700 sm:mt-1 sm:text-xs md:text-sm">
                  Read top-to-bottom like the ceremony itself—time, moment, music, then cues. Expand a row to edit.
                </p>
              </div>
            </div>

            <PremiumCard className="border-stone-200 bg-white px-4 py-5 shadow-sm sm:px-5 sm:py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">
                    Ceremony presets
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Drop in common beats—still editable on the timeline.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-3">
                {ceremonyPresetsForActiveEvent.map((preset) => (
                  <PrimaryButton
                    key={`ceremony-preset-${preset.id}`}
                    type="button"
                    onClick={() => addCeremonyPreset(preset)}
                    disabled={!canEditTimeline}
                    className="min-h-11 rounded-full border border-stone-300 bg-white px-4 py-2 text-[12px] font-semibold text-stone-900 shadow-none hover:border-stone-500 hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:px-3 sm:py-1.5 sm:text-[11px] sm:font-medium"
                  >
                    + {preset.momentName}
                  </PrimaryButton>
                ))}
              </div>
            </PremiumCard>

            {ceremonyTimelineComposerOpen && (
              <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
                <div ref={ceremonyTimelineComposerRef}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <SectionTitle className="!text-zinc-100">New ceremony moment</SectionTitle>
                      <p className="mt-1 text-xs text-zinc-400">
                        Lightweight capture—fine-tune anytime inline on the timeline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetCeremonyTimelineDraft();
                        setCeremonyTimelineComposerOpen(false);
                      }}
                      className="rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <TextInput
                      id="ceremony-composer-time-order"
                      label="Time / order"
                      value={ceremonyTimelineDraftTimeOrOrder}
                      onChange={setCeremonyTimelineDraftTimeOrOrder}
                      placeholder="e.g. 3:30 PM or Prelude"
                      disabled={!canEditTimeline}
                    />
                    <TextInput
                      id="ceremony-composer-moment"
                      label="Moment"
                      value={ceremonyTimelineDraftMoment}
                      onChange={setCeremonyTimelineDraftMoment}
                      placeholder="e.g. Processional"
                      disabled={!canEditTimeline}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextInput
                      id="ceremony-composer-song-title"
                      label="Song title"
                      value={ceremonyTimelineDraftSongTitle}
                      onChange={setCeremonyTimelineDraftSongTitle}
                      placeholder="Song title"
                      disabled={!canEditTimeline}
                    />
                    <TextInput
                      id="ceremony-composer-artist"
                      label="Artist"
                      value={ceremonyTimelineDraftArtist}
                      onChange={setCeremonyTimelineDraftArtist}
                      placeholder="Artist"
                      disabled={!canEditTimeline}
                    />
                  </div>
                  <div className="mt-3">
                    <TextArea
                      id="ceremony-composer-notes"
                      label="Notes / cues"
                      value={ceremonyTimelineDraftNotes}
                      onChange={setCeremonyTimelineDraftNotes}
                      placeholder="Cue notes, transitions, and callouts..."
                      rows={3}
                      disabled={!canEditTimeline}
                    />
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={() => setCeremonyTimelineDraftNeedsAttention((prev) => !prev)}
                    disabled={!canEditTimeline}
                    className={`mt-3 w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none ${
                      ceremonyTimelineDraftNeedsAttention
                        ? "border-[#00D4FF] bg-[#00D4FF]/15 text-zinc-100"
                        : "border-white/20 bg-white/[0.06] text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {ceremonyTimelineDraftNeedsAttention
                      ? "DJ/MC attention marked"
                      : "Flag DJ/MC attention"}
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={saveCeremonyTimelineComposerItem}
                    disabled={!canEditTimeline}
                    className="mt-4 w-full border border-black bg-[#00D4FF] py-3 text-sm font-semibold text-black shadow-none hover:brightness-105"
                  >
                    Add to ceremony timeline
                  </PrimaryButton>
                </div>
              </PremiumCard>
            )}

            <div
              ref={ceremonyTimelineStreamRef}
              className="min-w-0 max-h-[min(72dvh,52rem)] space-y-5 overflow-x-hidden overflow-y-auto overscroll-y-contain sm:space-y-4 md:space-y-3"
            >
              {ceremonyTimelineItems.length === 0 ? (
                <SectionEmptyState
                  title="No ceremony moments yet"
                  description="Preset chips above are the fastest start—or add your own aisle-to-recessional flow."
                  primaryAction={{
                    label: "+ Add ceremony moment",
                    onClick: openCeremonyTimelineComposer,
                    disabled: !canEditTimeline,
                  }}
                />
              ) : (
                ceremonyTimelineItems.map((item, index) => {
                  const rowExpanded = ceremonyTimelineExpandedId === item.id;
                  const songLine = [item.songTitle?.trim(), item.artist?.trim()]
                    .filter(Boolean)
                    .join(" · ");
                  const isDragging = draggingCeremonyTimelineId === item.id;
                  const isDropTarget =
                    dropTargetCeremonyTimelineId === item.id && draggingCeremonyTimelineId !== item.id;
                  return (
                    <PremiumCard
                      key={item.id}
                      className={`rounded-xl border-2 border-stone-300 bg-white px-4 py-6 sm:px-5 sm:py-5 ${
                        index % 2 === 1 ? "bg-stone-50" : ""
                      } transition-all duration-200 ${
                        isDragging ? "scale-[1.005] border-stone-800 shadow-sm" : ""
                      } ${isDropTarget ? "ring-2 ring-[#00D4FF] ring-offset-2 ring-offset-white" : ""}`}
                      data-ceremony-timeline-id={item.id}
                      onDragOver={(event) => {
                        if (!canEditTimeline || !draggingCeremonyTimelineId) return;
                        event.preventDefault();
                        if (draggingCeremonyTimelineId !== item.id) {
                          dropTargetCeremonyTimelineIdRef.current = item.id;
                          setDropTargetCeremonyTimelineId(item.id);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!canEditTimeline || !draggingCeremonyTimelineId) return;
                        reorderCeremonyTimelineItemToTarget(draggingCeremonyTimelineId, item.id);
                        setDraggingCeremonyTimelineId(null);
                        setDropTargetCeremonyTimelineId(null);
                        dropTargetCeremonyTimelineIdRef.current = null;
                        touchDragCeremonyTimelineSourceRef.current = null;
                      }}
                      onDragEnd={() => {
                        setDraggingCeremonyTimelineId(null);
                        setDropTargetCeremonyTimelineId(null);
                        dropTargetCeremonyTimelineIdRef.current = null;
                        touchDragCeremonyTimelineSourceRef.current = null;
                      }}
                    >
                      {isDropTarget ? (
                        <div className="mb-2 h-0.5 w-full rounded-full bg-[#00D4FF]" />
                      ) : null}
                      {!rowExpanded && (
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-6">
                            <div className="shrink-0 pt-0.5 sm:w-24 sm:text-right">
                              <p className="font-mono text-sm font-semibold tabular-nums text-stone-800 sm:text-xs md:text-sm">
                                {item.timeOrOrder?.trim() || "—"}
                              </p>
                            </div>
                            <div className="relative min-w-0 flex-1 border-l-2 border-stone-300 pl-4 sm:pl-5">
                              <span className="absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-white bg-stone-700 shadow-sm ring-2 ring-stone-200" />
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                                  Ceremony
                                </span>
                                {item.needsDjMcAttention ? (
                                  <span className="rounded-md border border-[#7E52A0]/55 bg-[#7E52A0]/12 px-2 py-0.5 text-[10px] font-semibold text-[#4c3266]">
                                    DJ/MC
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-900 [overflow-wrap:anywhere]">
                                {item.moment}
                              </h3>
                              <p className="mt-2 text-[15px] leading-snug text-stone-900 sm:mt-1.5 sm:text-sm sm:leading-normal sm:text-stone-800">
                                <span className="font-medium text-stone-500">Song · </span>
                                {songLine || "—"}
                              </p>
                              {item.notes?.trim() ? (
                                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-600">
                                  {item.notes}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                            <PrimaryButton
                              type="button"
                              onClick={() => setCeremonyTimelineExpandedId(item.id)}
                              disabled={!canEditTimeline}
                              className="min-h-12 w-full rounded-lg border border-stone-400 bg-white px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:w-auto sm:py-2 sm:text-[11px]"
                            >
                              Details
                            </PrimaryButton>
                            <PrimaryButton
                              type="button"
                              onClick={() => prepareAddCeremonyMomentAfter(item.id)}
                              disabled={!canEditTimeline}
                              className="min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-medium text-stone-800 shadow-none hover:border-stone-500 hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:w-auto sm:py-2 sm:text-[11px]"
                            >
                              + After
                            </PrimaryButton>
                          </div>
                        </div>
                      )}
                      {rowExpanded && (
                        <>
                          <div className="mb-3 flex justify-end border-b border-stone-200 pb-3">
                            <button
                              type="button"
                              onClick={() => setCeremonyTimelineExpandedId(null)}
                              className="text-[11px] font-semibold text-stone-700 underline-offset-2 transition hover:text-stone-900 hover:underline"
                            >
                              Collapse view
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <TextInput
                              id={`ceremony-inline-time-${item.id}`}
                              label="Time / order"
                              value={item.timeOrOrder}
                              onChange={(value) =>
                                setCeremonyTimelineItems((prev) =>
                                  prev.map((existing) =>
                                    existing.id === item.id
                                      ? { ...existing, timeOrOrder: value }
                                      : existing,
                                  ),
                                )
                              }
                              disabled={!canEditTimeline}
                            />
                            <TextInput
                              id={`ceremony-inline-moment-${item.id}`}
                              label="Moment"
                              value={item.moment}
                              onChange={(value) =>
                                setCeremonyTimelineItems((prev) =>
                                  prev.map((existing) =>
                                    existing.id === item.id
                                      ? { ...existing, moment: value }
                                      : existing,
                                  ),
                                )
                              }
                              disabled={!canEditTimeline}
                            />
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <TextInput
                              id={`ceremony-inline-song-${item.id}`}
                              label="Song title"
                              value={item.songTitle}
                              onChange={(value) =>
                                setCeremonyTimelineItems((prev) =>
                                  prev.map((existing) =>
                                    existing.id === item.id
                                      ? { ...existing, songTitle: value }
                                      : existing,
                                  ),
                                )
                              }
                              disabled={!canEditTimeline}
                            />
                            <TextInput
                              id={`ceremony-inline-artist-${item.id}`}
                              label="Artist"
                              value={item.artist}
                              onChange={(value) =>
                                setCeremonyTimelineItems((prev) =>
                                  prev.map((existing) =>
                                    existing.id === item.id
                                      ? { ...existing, artist: value }
                                      : existing,
                                  ),
                                )
                              }
                              disabled={!canEditTimeline}
                            />
                          </div>
                          <TextArea
                            id={`ceremony-inline-notes-${item.id}`}
                            label="Notes"
                            value={item.notes}
                            onChange={(value) =>
                              setCeremonyTimelineItems((prev) =>
                                prev.map((existing) =>
                                  existing.id === item.id
                                    ? { ...existing, notes: value }
                                    : existing,
                                ),
                              )
                            }
                            rows={2}
                            disabled={!canEditTimeline}
                          />
                          <PrimaryButton
                            type="button"
                            onClick={() =>
                              setCeremonyTimelineItems((prev) =>
                                prev.map((existing) =>
                                  existing.id === item.id
                                    ? {
                                        ...existing,
                                        needsDjMcAttention: !existing.needsDjMcAttention,
                                      }
                                    : existing,
                                ),
                              )
                            }
                            disabled={!canEditTimeline}
                            className={`mt-3 w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none ${
                              item.needsDjMcAttention
                                ? "border-[#00D4FF] bg-[#00D4FF]/12 text-stone-900"
                                : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                            }`}
                          >
                            {item.needsDjMcAttention
                              ? "DJ/MC attention: On"
                              : "Flag DJ/MC attention"}
                          </PrimaryButton>
                        </>
                      )}
                      <div className="mt-5 flex flex-col gap-2 border-t border-stone-200 pt-4 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:pt-3">
                        <button
                          type="button"
                          draggable={canEditTimeline}
                          onDragStart={(event) => {
                            if (!canEditTimeline) return;
                            touchDragCeremonyTimelineSourceRef.current = null;
                            event.dataTransfer.effectAllowed = "move";
                            setDraggingCeremonyTimelineId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggingCeremonyTimelineId(null);
                            setDropTargetCeremonyTimelineId(null);
                            dropTargetCeremonyTimelineIdRef.current = null;
                            touchDragCeremonyTimelineSourceRef.current = null;
                          }}
                          onTouchStart={() => {
                            if (!canEditTimeline) return;
                            touchDragCeremonyTimelineSourceRef.current = item.id;
                            setDraggingCeremonyTimelineId(item.id);
                          }}
                          className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg border border-stone-400 bg-stone-100 px-3 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none transition hover:border-stone-500 hover:bg-stone-200 active:scale-[0.98] disabled:opacity-50 sm:min-h-10 sm:w-auto sm:py-2 sm:text-[11px]"
                          disabled={!canEditTimeline}
                          aria-label={`Drag handle for ${item.moment}`}
                        >
                          <span className="text-[10px] tracking-wide text-stone-500">::</span>
                          <span>Reorder</span>
                        </button>
                        <PrimaryButton
                          type="button"
                          onClick={() => moveCeremonyTimelineItem(item.id, "up")}
                          disabled={!canEditTimeline}
                          className="min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-medium text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-10 sm:w-auto sm:py-2 sm:text-[11px]"
                        >
                          Move Up
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => moveCeremonyTimelineItem(item.id, "down")}
                          disabled={!canEditTimeline}
                          className="min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-medium text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-10 sm:w-auto sm:py-2 sm:text-[11px]"
                        >
                          Move Down
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => deleteCeremonyTimelineItem(item.id)}
                          disabled={!canEditTimeline}
                          className="min-h-12 w-full rounded-lg border border-rose-400 bg-white px-3 py-2.5 text-[13px] font-semibold text-rose-900 shadow-none hover:bg-rose-50 sm:min-h-10 sm:w-auto sm:py-2 sm:text-[11px]"
                        >
                          Delete
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => duplicateCeremonyTimelineItem(item)}
                          disabled={!canEditTimeline}
                          className="min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] font-medium text-stone-900 shadow-none hover:bg-stone-50 sm:min-h-10 sm:w-auto sm:py-2 sm:text-[11px]"
                        >
                          Duplicate
                        </PrimaryButton>
                      </div>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-stone-600">
                        {index + 1} / {ceremonyTimelineItems.length}
                      </p>
                    </PremiumCard>
                  );
                })
              )}
            </div>

            {!isCoupleView && (
              <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
                <SectionTitle className="!text-zinc-100">Ceremony Assistant</SectionTitle>
                <p className="mt-1 text-xs text-zinc-500">
                  Processionals and audio readiness.
                </p>
                <div className="mt-3">
                  <InsightStack
                    insights={planningInsights.filter((i) => i.section === "ceremony")}
                    emptyLabel="Ceremony prep looks complete."
                  />
                </div>
              </PremiumCard>
            )}

            <PremiumCard>
              <SectionTitle className="text-stone-950">Ceremony Details</SectionTitle>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="ceremony-location"
                  label="Ceremony Location"
                  value={eventSettings.ceremonyLocation}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, ceremonyLocation: value }))
                  }
                  placeholder="e.g. Garden Courtyard"
                />
                <TextInput
                  id="ceremony-start-time"
                  label="Ceremony Start Time"
                  value={ceremonyStartTime}
                  onChange={setCeremonyStartTime}
                  placeholder="e.g. 4:00 PM"
                />
                <TextInput
                  id="ceremony-guest-arrival-time"
                  label="Guest Arrival Time"
                  value={ceremonyGuestArrivalTime}
                  onChange={setCeremonyGuestArrivalTime}
                  placeholder="e.g. 3:30 PM"
                />
                <TextInput
                  id="officiant-name"
                  label="Officiant Name"
                  value={officiantName}
                  onChange={setOfficiantName}
                  placeholder="e.g. Reverend Taylor Brooks"
                />
                <TextArea
                  id="microphone-needs"
                  label="Microphone Needs"
                  value={microphoneNeeds}
                  onChange={setMicrophoneNeeds}
                  placeholder="List mics, placement, and backups..."
                  rows={2}
                />
                <TextArea
                  id="ceremony-notes"
                  label="Ceremony Notes"
                  value={ceremonyNotes}
                  onChange={setCeremonyNotes}
                  placeholder="Cue notes, coordinator timing, special moments..."
                  rows={3}
                />
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Notes" && (
          <section className="mt-6 space-y-3">
            <EventHomeNav trail={["Planning notes"]} onBack={() => setActiveScreen("Dashboard")} />
            {!canEditNotes && (
              <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                <p className="text-xs font-medium text-amber-950">
                  {effectiveRole} role can view notes, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
            <PremiumCard>
              <SectionTitle className="text-stone-950">Planner Notes</SectionTitle>
              <div className="mt-3 space-y-3">
                <TextArea
                  id="planner-notes-editor"
                  label="One note per line"
                  value={plannerNotes.join("\n")}
                  onChange={(value) =>
                    setPlannerNotes(
                      value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean),
                    )
                  }
                  rows={6}
                  disabled={!canEditNotes}
                  placeholder="Add planning notes..."
                />
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Vendors" && sectionVendorContactsEnabled && (
          <section className="mt-6 min-w-0 space-y-5 overflow-x-hidden sm:space-y-4 md:space-y-3">
            <EventHomeNav
              trail={["Vendors / Team"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={{
                label: "Add vendor",
                onClick: openAddVendorModal,
              }}
            />
            <PremiumCard className="border-[#00D4FF]/20 bg-zinc-950">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <SectionTitle className="!text-zinc-100">Your event team</SectionTitle>
                <PersistEcho persistFeedback={persistFeedback} variant="dark" className="pt-0.5" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                One calm snapshot of everyone involved—organized by role, fast to reach from your phone, and aligned with your Event Document.
              </p>
              {vendorStatus && (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                    vendorStatus.kind === "success"
                      ? "border border-emerald-500/40 bg-emerald-950/35 text-emerald-50"
                      : "border border-rose-500/40 bg-rose-950/35 text-rose-50"
                  }`}
                >
                  {vendorStatus.message}
                </p>
              )}
            </PremiumCard>

            {vendors.length === 0 ? (
              <SectionEmptyState
                title="No contacts yet"
                description="Add planners, venue, photo + video, catering, and entertainment so day-of calls and texts stay in one place—not buried in threads."
                primaryAction={{ label: "Add vendor", onClick: openAddVendorModal }}
                cardClassName="border-dashed border-stone-300 bg-stone-50"
              />
            ) : (
              <>
                {cutmasterTeamVendors.length > 0 ? (
                  <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
                    <div className="min-w-0">
                      <SectionTitle className="!text-zinc-100">Cutmaster event team</SectionTitle>
                      <p className="mt-1 text-[11px] leading-snug text-zinc-400">
                        Internal production and coordination on this event—distinct from external partners below.
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {cutmasterTeamVendors.map((vendor) => (
                        <VendorEventCard
                          key={vendor.id}
                          vendor={vendor}
                          variant="cutmaster"
                          onEdit={openEditVendorModal}
                          onDelete={deleteVendor}
                          onCopy={copyVendorContactInfo}
                        />
                      ))}
                    </div>
                  </PremiumCard>
                ) : null}

                <PremiumCard>
                  <SectionTitle className="text-stone-950">Arrival & load-in</SectionTitle>
                  <p className={lightUiSectionCaptionClass}>
                    Quick scan of who is on-site and when—pair with coordination notes for timing-sensitive moments.
                  </p>
                  <div className="mt-3 space-y-2">
                    {vendors
                      .filter((vendor) => vendor.arrivalTime.trim())
                      .sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))
                      .map((vendor) => (
                        <div
                          key={`arrival-${vendor.id}`}
                          className={lightUiListRowClass}
                        >
                          <span className="font-semibold text-stone-950">{vendor.arrivalTime}</span>
                          <span className="text-stone-500"> · </span>
                          <span className="font-medium text-stone-800">{vendor.companyName}</span>
                          <span className="text-stone-500"> · </span>
                          <span className="text-stone-600">{vendorTypeLabel(vendor.vendorType)}</span>
                        </div>
                      ))}
                    {vendors.filter((vendor) => vendor.arrivalTime.trim()).length === 0 ? (
                      <p className={lightUiEmptyHintInCardClass}>
                        Add arrival times on each vendor to build a shareable load-in picture for the day.
                      </p>
                    ) : null}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle className="text-stone-950">Coordination notes</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {vendors
                      .filter((vendor) => vendor.specialCoordinationNotes.trim())
                      .map((vendor) => (
                        <div
                          key={`coord-${vendor.id}`}
                          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs"
                        >
                          <p className="font-semibold text-stone-950">{vendor.companyName}</p>
                          <p className="mt-1 leading-relaxed text-stone-700">{vendor.specialCoordinationNotes}</p>
                        </div>
                      ))}
                    {vendors.filter((vendor) => vendor.specialCoordinationNotes.trim()).length === 0 ? (
                      <p className={lightUiEmptyHintInCardClass}>
                        Special instructions from vendors appear here—parking, power, staging, or ceremony cues.
                      </p>
                    ) : null}
                  </div>
                </PremiumCard>

                {VENDOR_UI_SECTIONS.map((section) => {
                  const inSection = filterVendorsByTypes(partnerVendors, section.types);
                  if (inSection.length === 0) return null;
                  return (
                    <PremiumCard key={`vendor-section-${section.id}`}>
                      <SectionTitle className="text-stone-950">{section.label}</SectionTitle>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {inSection.map((vendor) => (
                          <VendorEventCard
                            key={vendor.id}
                            vendor={vendor}
                            variant="partner"
                            onEdit={openEditVendorModal}
                            onDelete={deleteVendor}
                            onCopy={copyVendorContactInfo}
                          />
                        ))}
                      </div>
                    </PremiumCard>
                  );
                })}
              </>
            )}
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Event Prep" && (
          <section className="mt-6 min-w-0 space-y-4 overflow-x-hidden print-doc sm:space-y-3">
            <EventHomeNav trail={["Event Document"]} onBack={() => setActiveScreen("Dashboard")} />
            <div className="no-print rounded-xl border border-stone-300 bg-white px-4 py-4 shadow-none sm:px-5 sm:py-3.5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-800">
                    Export packet
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700 sm:mt-1 sm:text-[11px] sm:leading-snug">
                    Uses your browser print dialog—pick{" "}
                    <span className="font-semibold text-stone-900">Save as PDF</span> when offered.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-stretch sm:gap-2">
                  {canAccessRunOfShow ? (
                    <PrimaryButton
                      type="button"
                      onClick={() => setRunOfShowOpen(true)}
                      className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-none hover:border-stone-400 hover:bg-stone-50 sm:min-h-11 sm:min-w-[11rem]"
                    >
                      Enter Run Of Show
                    </PrimaryButton>
                  ) : null}
                  <PrimaryButton
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-11 w-full border border-black bg-[#00D4FF] px-5 py-2.5 text-sm font-semibold text-black shadow-none hover:brightness-105 sm:min-w-[12.5rem] sm:py-2.5"
                  >
                    Print / Save PDF
                  </PrimaryButton>
                </div>
              </div>
            </div>
            <PremiumCard className="no-print border border-stone-200 bg-white py-4 shadow-none sm:py-3">
              <details className="group rounded-xl">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 text-left sm:min-h-0 sm:py-1 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <SectionTitle className="text-stone-950">Event Packet Options</SectionTitle>
                    <p className="mt-1 text-[11px] leading-snug text-stone-600 sm:text-stone-500">
                      Choose what appears in your packet—updates the preview below and print / PDF export.
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <PersistEcho persistFeedback={persistFeedback} variant="light" />
                    <span className="text-[10px] text-stone-500 transition group-open:rotate-180">
                      ▼
                    </span>
                  </span>
                </summary>
                <div className="mt-4 space-y-4 border-t border-stone-200 pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">Core sections</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-stone-600">Timelines follow your Event Settings—toggle extra narrative blocks here.</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sectionPlanningQuestionsEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setEventSettings((prev) => ({
                              ...prev,
                              liveEventShowPlanningQuestions: !prev.liveEventShowPlanningQuestions,
                            }))
                          }
                          className={
                            eventSettings.liveEventShowPlanningQuestions
                              ? EVENT_PACKET_SECTION_TOGGLE_ON
                              : EVENT_PACKET_SECTION_TOGGLE_OFF
                          }
                        >
                          {eventSettings.liveEventShowPlanningQuestions ? "Planning Q&A on" : "Planning Q&A off"}
                        </PrimaryButton>
                      ) : null}
                      {sectionGuestRequestsEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setEventSettings((prev) => ({
                              ...prev,
                              liveEventShowGuestRequests: !prev.liveEventShowGuestRequests,
                            }))
                          }
                          className={
                            eventSettings.liveEventShowGuestRequests
                              ? EVENT_PACKET_SECTION_TOGGLE_ON
                              : EVENT_PACKET_SECTION_TOGGLE_OFF
                          }
                        >
                          {eventSettings.liveEventShowGuestRequests ? "Guest requests on" : "Guest requests off"}
                        </PrimaryButton>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Music sections</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sectionMusicNotesEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setEventSettings((prev) => ({
                              ...prev,
                              liveEventShowMusicNotes: !prev.liveEventShowMusicNotes,
                            }))
                          }
                          className={
                            eventSettings.liveEventShowMusicNotes
                              ? EVENT_PACKET_SECTION_TOGGLE_ON
                              : EVENT_PACKET_SECTION_TOGGLE_OFF
                          }
                        >
                          {eventSettings.liveEventShowMusicNotes ? "Music notes on" : "Music notes off"}
                        </PrimaryButton>
                      ) : null}
                      {sectionDoNotPlayEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setEventSettings((prev) => ({
                              ...prev,
                              liveEventShowDoNotPlay: !prev.liveEventShowDoNotPlay,
                            }))
                          }
                          className={
                            eventSettings.liveEventShowDoNotPlay
                              ? EVENT_PACKET_SECTION_TOGGLE_ON
                              : EVENT_PACKET_SECTION_TOGGLE_OFF
                          }
                        >
                          {eventSettings.liveEventShowDoNotPlay ? "Do not play on" : "Do not play off"}
                        </PrimaryButton>
                      ) : null}
                      {sectionPlaylistsEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setEventSettings((prev) => ({
                              ...prev,
                              liveEventShowPlaylists: !prev.liveEventShowPlaylists,
                            }))
                          }
                          className={
                            eventSettings.liveEventShowPlaylists
                              ? EVENT_PACKET_SECTION_TOGGLE_ON
                              : EVENT_PACKET_SECTION_TOGGLE_OFF
                          }
                        >
                          {eventSettings.liveEventShowPlaylists ? "Playlists on" : "Playlists off"}
                        </PrimaryButton>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Vendor / contact sections
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sectionVendorContactsEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setEventSettings((prev) => ({
                              ...prev,
                              liveEventShowVendorContacts: !prev.liveEventShowVendorContacts,
                            }))
                          }
                          className={
                            eventSettings.liveEventShowVendorContacts
                              ? EVENT_PACKET_SECTION_TOGGLE_ON
                              : EVENT_PACKET_SECTION_TOGGLE_OFF
                          }
                        >
                          {eventSettings.liveEventShowVendorContacts ? "Vendor contacts on" : "Vendor contacts off"}
                        </PrimaryButton>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Scripts / notes</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sectionMcScriptEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            setEventSettings((prev) => ({
                              ...prev,
                              liveEventShowMcScript: !prev.liveEventShowMcScript,
                            }))
                          }
                          className={
                            eventSettings.liveEventShowMcScript
                              ? EVENT_PACKET_SECTION_TOGGLE_ON
                              : EVENT_PACKET_SECTION_TOGGLE_OFF
                          }
                        >
                          {eventSettings.liveEventShowMcScript ? "MC script on" : "MC script off"}
                        </PrimaryButton>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Packet layout</p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">Screen preview and printed pages.</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <PrimaryButton
                        type="button"
                        onClick={() =>
                          setEventSettings((prev) => ({
                            ...prev,
                            liveEventCompactMode: !prev.liveEventCompactMode,
                          }))
                        }
                        className={
                          eventSettings.liveEventCompactMode
                            ? EVENT_PACKET_SECTION_TOGGLE_ON
                            : EVENT_PACKET_SECTION_TOGGLE_OFF
                        }
                      >
                        {eventSettings.liveEventCompactMode ? "Compact layout on" : "Compact layout off"}
                      </PrimaryButton>
                      <PrimaryButton
                        type="button"
                        onClick={() =>
                          setEventSettings((prev) => ({
                            ...prev,
                            liveEventLargePrintMode: !prev.liveEventLargePrintMode,
                          }))
                        }
                        className={
                          eventSettings.liveEventLargePrintMode
                            ? EVENT_PACKET_SECTION_TOGGLE_ON
                            : EVENT_PACKET_SECTION_TOGGLE_OFF
                        }
                      >
                        {eventSettings.liveEventLargePrintMode ? "Large print on" : "Large print off"}
                      </PrimaryButton>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Export</p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      Uses your browser print dialog—choose “Save as PDF” where supported.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <PrimaryButton
                        type="button"
                        onClick={() => window.print()}
                        className="min-h-11 w-full bg-[#00D4FF] px-4 py-2.5 text-sm font-semibold text-black shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110 sm:min-w-[12rem]"
                      >
                        Print / Save PDF
                      </PrimaryButton>
                      <PrimaryButton
                        type="button"
                        onClick={copyLiveEventText}
                        className="min-h-11 w-full border border-white/14 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-white/10 sm:w-auto"
                      >
                        Copy plain text
                      </PrimaryButton>
                    </div>
                    {copyStatus === "copied" ? (
                      <p className="mt-2 text-[11px] text-emerald-400/95">Copied to clipboard.</p>
                    ) : null}
                    {copyStatus === "error" ? (
                      <p className="mt-2 text-[11px] text-rose-300/95">Copy failed. Try again.</p>
                    ) : null}
                  </div>
                </div>
              </details>
            </PremiumCard>
            <div
              className={`-mx-1 max-w-[calc(100vw-2rem)] overflow-x-auto px-1 sm:mx-0 sm:max-w-none sm:overflow-visible sm:px-0 print:!m-0 print:!max-w-none print:!overflow-visible print:!p-0`}
            >
            <div
              className={`doc-sheet ${eventSettings.liveEventCompactMode ? "doc-mode-compact" : ""} ${eventSettings.liveEventLargePrintMode ? "doc-mode-large-print" : ""}`}
            >

              <div role="banner" className="doc-header print-break-avoid">
                <div className="doc-header-main">
                  <div className="doc-header-brand">
                    <div className="doc-header-logo-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolvedDocLogoSrc}
                        alt={appSettings.companyName}
                        width={360}
                        height={112}
                        className="doc-header-logo-img"
                      />
                    </div>
                    <p className="doc-header-brand-tagline">Event Production Timeline</p>
                  </div>
                  <div className="doc-header-event">
                    <h1 className="doc-event-title">
                      {eventSettings.eventName?.trim() || eventDisplayName || "Event"}
                    </h1>
                    {(eventSettings.weddingDate || weddingDetails.date)?.trim() ? (
                      <p className="doc-header-event-date">
                        {eventSettings.weddingDate || weddingDetails.date}
                      </p>
                    ) : null}
                    {(eventSettings.venue || weddingDetails.venue)?.trim() ? (
                      <p className="doc-header-event-venue">{eventSettings.venue || weddingDetails.venue}</p>
                    ) : null}
                    {(effectiveEventType ?? "").trim() ? (
                      <p className="doc-event-type-pill doc-header-event-type">{effectiveEventType}</p>
                    ) : null}
                    {!(
                      (eventSettings.weddingDate || weddingDetails.date)?.trim() ||
                      (eventSettings.venue || weddingDetails.venue)?.trim()
                    ) ? (
                      <p className="doc-header-event-placeholder">Date and venue — add in Event Settings</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <p className="doc-subtitle no-print mb-4 text-[11px] uppercase tracking-[0.14em] text-stone-600">
                Live Event Mode · printable working packet
              </p>

              <div className="doc-section doc-section--lead print-break-avoid">
                <h3>Event Overview</h3>
                <table className="doc-table">
                  <tbody>
                    <tr><th>Event</th><td>{eventSettings.eventName || weddingDetails.couple || "TBD"}</td><th>{primaryPartyShortLabel}</th><td>{eventSettings.coupleNames || weddingDetails.couple || "TBD"}</td></tr>
                    <tr><th>Date</th><td>{eventSettings.weddingDate || weddingDetails.date || "TBD"}</td><th>Venue</th><td>{eventSettings.venue || weddingDetails.venue || "TBD"}</td></tr>
                    <tr><th>Timezone</th><td>{effectiveTimezone || "TBD"}</td><th>Event type</th><td>{effectiveEventType || "TBD"}</td></tr>
                    <tr><th>Package</th><td>{eventSettings.packageName || "TBD"}</td><th>Assigned DJ</th><td>{getTeamMemberName(eventSettings.assignedDj || "")}</td></tr>
                  </tbody>
                </table>
              </div>

              {sectionCeremonyEnabled && (
                <>
                  <p className="doc-subtitle no-print">Print · ceremony follows overview on page 1</p>
                  <div className="doc-section print-break-avoid">
                    <h3>Ceremony Timeline</h3>
                    <table className="doc-table">
                      <tbody>
                        <tr><th>Ceremony Start</th><td>{ceremonyStartTime || "TBD"}</td><th>Guest Arrival</th><td>{ceremonyGuestArrivalTime || "TBD"}</td></tr>
                        <tr><th>Location</th><td>{eventSettings.ceremonyLocation || eventSettings.venue || weddingDetails.venue || "TBD"}</td><th>Officiant</th><td>{officiantName || "TBD"}</td></tr>
                        <tr><th>Microphone Needs</th><td>{microphoneNeeds || "None"}</td><th>Ceremony Notes</th><td>{ceremonyNotes || "None"}</td></tr>
                      </tbody>
                    </table>
                    <div className="doc-table-scroll -mx-1 max-w-[100vw] print:!overflow-visible sm:mx-0">
                      <table className="doc-table doc-ceremony-timeline mt-2 min-w-[520px] sm:min-w-0">
                        <thead>
                          <tr>
                            <th scope="col">Time / Order</th>
                            <th scope="col">Moment</th>
                            <th scope="col">Song</th>
                            <th scope="col">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ceremonyTimelineRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="py-4 text-center text-xs leading-snug text-zinc-600 print:text-black"
                              >
                                No ceremony moments yet — add them under Ceremony.
                              </td>
                            </tr>
                          ) : (
                            ceremonyTimelineRows.map((row) => (
                              <tr key={`live-ceremony-row-${row.id}`}>
                                <td>{row.order}</td>
                                <td>{row.moment}</td>
                                <td>{row.song}</td>
                                <td>{row.notes}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              {sectionReceptionTimelineEnabled && (
              <>
              <p className="doc-subtitle no-print">
                Print · reception / main timeline begins on the next page
              </p>
              <div className="doc-section live-reception-page-break print-break-avoid">
                <h3>{eventPrepReceptionHeading}</h3>
                <div className="doc-table-scroll -mx-1 max-w-[100vw] print:!overflow-visible sm:mx-0">
                  <table className="doc-table live-event-timeline-table min-w-[520px] sm:min-w-0">
                  <thead>
                    <tr>
                      <th scope="col">Time</th>
                      <th scope="col">Moment</th>
                      <th scope="col">Song</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedTimelineItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-4 text-center text-xs leading-snug text-zinc-600 print:text-black"
                        >
                          No reception moments yet — add them under Timeline / Reception.
                        </td>
                      </tr>
                    ) : (
                      mergedTimelineItems.map((item) => {
                        const songLabel = [item.songTitle?.trim(), item.artist?.trim()]
                          .filter(Boolean)
                          .join(" - ");
                        const fadeSuffix = item.fadeOutEarly
                          ? item.fadeOutTimestamp?.trim()
                            ? ` (Fade ${item.fadeOutTimestamp.trim()})`
                            : " (Fade early)"
                          : "";
                        const songCell = `${songLabel}${fadeSuffix}`.trim();
                        const notesLabel = [item.notes?.trim() || "", item.needsDjMcAttention ? "MC/DJ Attention" : ""]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <tr key={`live-timeline-${item.id}`}>
                            <td>{item.time?.trim() ?? ""}</td>
                            <td>{item.title}</td>
                            <td>{songCell}</td>
                            <td>{notesLabel}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  </table>
                </div>
              </div>
              </>
              )}
              {sectionPlanningQuestionsEnabled && eventSettings.liveEventShowPlanningQuestions && (
                <div className="doc-section print-break-avoid">
                  <h3>Planning Notes / Key Answers</h3>
                  <table className="doc-table">
                    <tbody>
                      {planningQuestionsForEvent
                        .filter((q) => q.showInLiveEventMode)
                        .map((q) => (
                        <tr key={`live-planned-q-${q.id}`}>
                          <th className="max-w-[36%] align-top text-left font-medium">{q.label}</th>
                          <td>{(eventSettings.planningQuestionAnswers[q.id] ?? "").trim() || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sectionMusicNotesEnabled && eventSettings.liveEventShowMusicNotes && (
                <div className="doc-section">
                  <h3>Music Notes</h3>
                  {layoutProfileForActiveEvent === "School Dance" ? (
                    <p className="doc-note mb-2 text-[11px] leading-snug text-zinc-600 print:text-black">
                      Clean edits and school-appropriate selections.
                    </p>
                  ) : null}
                  <p className="doc-note mb-1 font-medium text-zinc-700 print:text-black">Overall vibe</p>
                  <p className="mb-3">{generalDjNotes || "None"}</p>
                  {(musicVibeDetail.genres ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700 print:text-black">Genres / eras: </span>
                      {musicVibeDetail.genres}
                    </p>
                  ) : null}
                  {(musicVibeDetail.energy ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700 print:text-black">Energy: </span>
                      {musicVibeDetail.energy}
                    </p>
                  ) : null}
                  {(musicVibeDetail.crowdNotes ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700 print:text-black">Crowd: </span>
                      {musicVibeDetail.crowdNotes}
                    </p>
                  ) : null}
                  {(musicVibeDetail.cleanMusicPrefs ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700 print:text-black">
                        {layoutProfileForActiveEvent === "School Dance" ? "Clean selections: " : "Clean / content: "}
                      </span>
                      {musicVibeDetail.cleanMusicPrefs}
                    </p>
                  ) : null}
                </div>
              )}
              {sectionDoNotPlayEnabled && eventSettings.liveEventShowDoNotPlay && (
                <div className="doc-section">
                  <h3>Do Not Play</h3>
                  <ul>
                    {doNotPlaySongs.map((song) => (
                      <li key={`live-dnp-${song.id}`}>
                        {song.title}
                        {song.artist ? ` - ${song.artist}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sectionPlaylistsEnabled && eventSettings.liveEventShowPlaylists && (
                <div className="doc-playlists-page-start">
                  <p className="doc-subtitle no-print">
                    Print · playlists & must-play start after timeline sections on a new page
                  </p>
                  {PLAYLIST_BUCKET_IDS.map((bucketId) => (
                    <div key={`doc-pl-${bucketId}`} className="doc-section">
                      <h3>{PLAYLIST_BUCKET_LABELS[bucketId]}</h3>
                      <table className="doc-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Song</th>
                            <th>Artist</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPlaylistLines(bucketId).map((line, index) => {
                            const parsed = parsePlaylistSongLine(line);
                            return (
                              <tr key={`playlist-${bucketId}-${index}-${line}`}>
                                <td>{index + 1}</td>
                                <td>{parsed.song || "-"}</td>
                                <td>{parsed.artist}</td>
                                <td />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  <div className="doc-section">
                    <h3>Must Play</h3>
                    <table className="doc-table">
                      <thead><tr><th>#</th><th>Song</th><th>Artist</th><th>Notes</th></tr></thead>
                      <tbody>
                        {(sectionMustPlayEnabled ? mustPlaySongs : []).map((song, index) => (
                          <tr key={`playlist-must-${song.id}`}>
                            <td>{index + 1}</td>
                            <td>{song.title || "-"}</td>
                            <td>{song.artist || ""}</td>
                            <td>{song.notes || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!eventSettings.liveEventShowGuestRequests ? (
                  <div className="doc-section">
                    <h3>Guest Approved Requests</h3>
                    <table className="doc-table">
                      <thead><tr><th>#</th><th>Song</th><th>Artist</th><th>Notes</th></tr></thead>
                      <tbody>
                        {(sectionGuestRequestsEnabled ? guestRequests : [])
                          .filter((request) => request.status === "Approved")
                          .map((request, index) => (
                            <tr key={`playlist-approved-${request.id}`}>
                              <td>{index + 1}</td>
                              <td>{request.songTitle || "-"}</td>
                              <td>{request.artist || ""}</td>
                              <td>{request.dedication || ""}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  ) : null}
                </div>
              )}
              {sectionVendorContactsEnabled &&
                eventSettings.liveEventShowVendorContacts &&
                vendors.length > 0 && (
                  <div className="doc-section print-break-avoid">
                    <h3>Event team & vendor contacts</h3>
                    <p className="doc-note mb-3 text-[11px] leading-snug text-zinc-600 print:text-black">
                      Cutmaster team, coordinator, and key partners (venue, catering, photo, video, entertainment)
                      are prioritized at the top for fast scanning.
                    </p>
                    <div className="space-y-3">
                      {sortVendorsForEventDocument(vendors).map((vendor) => {
                        const headline =
                          vendor.contactName.trim() || vendor.companyName.trim() || "Contact";
                        const companyLine =
                          vendor.contactName.trim() && vendor.companyName.trim()
                            ? vendor.companyName.trim()
                            : null;
                        return (
                          <div
                            key={`live-vendor-${vendor.id}`}
                            className="rounded-lg border border-zinc-200/90 bg-zinc-50/60 p-3 text-[11px] leading-snug text-zinc-800 print:border-zinc-400 print:bg-white print:text-black"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200/70 pb-2 print:border-zinc-400">
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold leading-tight text-zinc-900 print:text-black">
                                  {headline}
                                </p>
                                {companyLine ? (
                                  <p className="mt-0.5 text-[11px] text-zinc-600 print:text-black">{companyLine}</p>
                                ) : null}
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 print:text-black">
                                  {vendorTypeLabel(vendor.vendorType)}
                                </p>
                                {isCutmasterEventTeam(vendor) ? (
                                  <p className="text-[10px] font-medium text-[#8f6b2f] print:text-black">
                                    Cutmaster event team
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <ul className="mt-2 list-none space-y-0.5 pl-0 text-[11px] text-zinc-700 print:text-black">
                              {vendor.phone.trim() ? <li>Phone: {vendor.phone.trim()}</li> : null}
                              {vendor.email.trim() ? <li>Email: {vendor.email.trim()}</li> : null}
                              {vendor.website.trim() ? <li>Web: {vendor.website.trim()}</li> : null}
                              {vendor.instagram.trim() ? <li>Social: {vendor.instagram.trim()}</li> : null}
                              {vendor.arrivalTime.trim() ? (
                                <li>Arrival: {vendor.arrivalTime.trim()}</li>
                              ) : null}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              {sectionMcScriptEnabled && eventSettings.liveEventShowMcScript && (
                <div className="doc-section">
                  <h3>{eventPrepMcHeading}</h3>
                  <p>{mcAnnouncements || "None"}</p>
                </div>
              )}
              {sectionGuestRequestsEnabled && eventSettings.liveEventShowGuestRequests && (
                <div className="doc-section print-break-avoid">
                  <h3>Guest Requests</h3>
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Guest</th>
                        <th>Song</th>
                        <th>Artist</th>
                        <th>Status</th>
                        <th>Dedication</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestRequests.map((request, index) => (
                        <tr key={`live-guest-doc-${request.id}`}>
                          <td>{index + 1}</td>
                          <td>{request.guestName}</td>
                          <td>{request.songTitle || "—"}</td>
                          <td>{request.artist || "—"}</td>
                          <td>{request.status}</td>
                          <td>{request.dedication || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="doc-section"><h3>Important DJ Notes</h3><p className="doc-note">{eventSettings.internalNotes || "None"}</p></div>
              {(eventSettings.clientFacingNotes ?? "").trim() ? (
                <div className="doc-section"><h3>Client-facing notes</h3><p className="doc-note">{eventSettings.clientFacingNotes}</p></div>
              ) : null}
              <div className="doc-section"><h3>Document footer</h3><p>{effectivePrepSheetFooter}</p></div>
              <footer className="doc-footer-brand print-break-avoid" aria-label="Producer">
                <p className="doc-footer-brand-line">
                  Prepared by{" "}
                  <span className="doc-footer-brand-name">{appSettings.companyName}</span>
                </p>
                <p className="doc-footer-brand-url">cutmastermusic.com</p>
              </footer>
            </div>
            </div>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Event Settings" && (
          <section className="mt-6 space-y-3">
            <EventHomeNav trail={["Event Settings"]} onBack={() => setActiveScreen("Dashboard")} />
            <input
              ref={eventCoverPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleEventCoverPhotoChange}
            />
            <PremiumCard>
              <SectionTitle className="text-stone-950">Visual identity & cover photo</SectionTitle>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Give this event a face. Your cover appears on the home hero and the All Events grid. Images are stored in
                this browser only (local storage).
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
                <div className="relative aspect-[21/9] min-h-[140px] w-full sm:min-h-[160px]">
                  {eventSettings.coverPhotoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={eventSettings.coverPhotoDataUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 ${eventCoverFallbackClasses(layoutProfileForActiveEvent)}`}
                      aria-hidden
                    />
                  )}
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">Preview</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-white drop-shadow">
                      {eventSettings.eventName || eventDisplayName}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryButton
                  type="button"
                  disabled={!canEditEventCover}
                  onClick={() => eventCoverPhotoInputRef.current?.click()}
                  className={lightUiCyanPrimaryButtonClass}
                >
                  {eventSettings.coverPhotoDataUrl ? "Replace image" : "Upload image"}
                </PrimaryButton>
                {eventSettings.coverPhotoDataUrl ? (
                  <PrimaryButton
                    type="button"
                    disabled={!canEditEventCover}
                    onClick={() => {
                      if (!window.confirm("Remove the cover image?")) return;
                      applyEventCoverPhoto(undefined);
                    }}
                    className={lightUiSecondaryButtonClass}
                  >
                    Remove
                  </PrimaryButton>
                ) : null}
              </div>
              {!canEditEventCover ? (
                <p className="mt-3 text-xs leading-relaxed text-stone-600">Cover editing is not available for the DJ role in this build.</p>
              ) : null}
            </PremiumCard>
            <PremiumCard>
              <SectionTitle className="text-stone-950">Event status</SectionTitle>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Control how this event appears on All Events. Archived events stay in your data and remain findable via
                search, but are hidden from the default list.
              </p>
              <div className="mt-3">
                <label htmlFor="event-lifecycle-status" className={lightUiFormLabelClass}>
                  Status
                </label>
                <select
                  id="event-lifecycle-status"
                  value={eventSettings.eventLifecycleStatus ?? "active"}
                  disabled={!canEditEventLifecycle}
                  onChange={(e) => applyEventLifecycleStatus(e.target.value as EventLifecycleStatus)}
                  className={lightUiSelectClass}
                >
                  <option value="active" className="bg-white text-stone-900">
                    Active — in progress
                  </option>
                  <option value="completed" className="bg-white text-stone-900">
                    Completed
                  </option>
                  <option value="archived" className="bg-white text-stone-900">
                    Archived
                  </option>
                </select>
              </div>
              {!canEditEventLifecycle ? (
                <p className="mt-2 text-xs leading-relaxed text-stone-600">Only Admin and Planner can change event status.</p>
              ) : null}
            </PremiumCard>
            <PremiumCard>
              <SectionTitle className="text-stone-950">Event Type & Sections</SectionTitle>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Event Type is the primary workflow selector. It applies defaults, then you can fine-tune section visibility. Hiding a
                section only tucks it out of the way; your data stays in the file.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="event-layout-profile" className={lightUiFormLabelClass}>
                    Event Type
                  </label>
                  <select
                    id="event-layout-profile"
                    value={eventSettings.eventLayoutProfile}
                    onChange={(event) =>
                      setEventSettings((prev) => ({
                        ...prev,
                        eventLayoutProfile: event.target.value as EventLayoutProfile,
                        eventType: event.target.value as EventLayoutProfile,
                        ...getLayoutProfileDefaults(event.target.value as EventLayoutProfile),
                        ...getLiveEventDocumentDefaults(event.target.value as EventLayoutProfile),
                      }))
                    }
                    className={lightUiSelectClass}
                  >
                    {EVENT_TYPES.map((profile) => (
                      <option key={`layout-profile-${profile}`} value={profile} className="bg-white text-stone-900">
                        {profile}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-relaxed text-stone-600">
                    {LAYOUT_PROFILE_DESCRIPTIONS[eventSettings.eventLayoutProfile]}
                  </p>
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Apply the default sections for this event type? Existing planning data is kept even when a section is hidden.",
                        )
                      ) {
                        return;
                      }
                      setEventSettings((prev) => ({
                        ...prev,
                        ...getLayoutProfileDefaults(prev.eventLayoutProfile),
                        ...getLiveEventDocumentDefaults(prev.eventLayoutProfile),
                      }));
                    }}
                    className={`mt-3 w-full ${lightUiSecondaryButtonClass}`}
                  >
                    Apply Event Type Defaults
                  </PrimaryButton>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "sectionCeremonyEnabled", label: "Ceremony" },
                    { key: "sectionReceptionTimelineEnabled", label: "Reception Timeline" },
                    { key: "sectionPlaylistsEnabled", label: "Playlists" },
                    { key: "sectionMustPlayEnabled", label: "Must Play" },
                    { key: "sectionDoNotPlayEnabled", label: "Do Not Play" },
                    { key: "sectionMcScriptEnabled", label: "MC Script" },
                    { key: "sectionVendorContactsEnabled", label: "Vendor Contacts" },
                    { key: "sectionMusicNotesEnabled", label: "Music Notes" },
                    { key: "sectionGuestRequestsEnabled", label: "Guest Requests" },
                    { key: "sectionPlanningChecklistEnabled", label: "Planning Checklist" },
                    { key: "sectionPlanningQuestionsEnabled", label: "Planning Questions" },
                  ].map((item) => {
                    const enabled = Boolean(
                      eventSettings[item.key as keyof EventSettings],
                    );
                    return (
                      <PrimaryButton
                        key={`event-section-toggle-${item.key}`}
                        onClick={() =>
                          setEventSettings((prev) => ({
                            ...prev,
                            [item.key]:
                              !Boolean(
                                prev[item.key as keyof EventSettings],
                              ),
                          }))
                        }
                        className={`w-full ${
                          enabled
                            ? "rounded-xl bg-[#00D4FF] text-[11px] font-semibold leading-snug text-stone-950 shadow-sm hover:brightness-105 sm:text-xs"
                            : `${lightUiSecondaryButtonClass} text-[11px] leading-snug sm:text-xs`
                        }`}
                      >
                        {enabled ? `Hide ${item.label}` : `Show ${item.label}`}
                      </PrimaryButton>
                    );
                  })}
                </div>
              </div>
            </PremiumCard>
            <PremiumCard>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <SectionTitle className="text-stone-950">Event Settings</SectionTitle>
                <PersistEcho persistFeedback={persistFeedback} variant="light" className="pt-0.5" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Event-specific details and overrides for this event only.
              </p>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="event-settings-event-name"
                  label="Event Name"
                  value={eventSettings.eventName}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, eventName: value }))}
                />
                <TextInput
                  id="event-settings-couple-names"
                  label={primaryPartyFieldLabel}
                  value={eventSettings.coupleNames}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, coupleNames: value }))}
                />
                <div>
                  <label
                    htmlFor="event-settings-event-type"
                    className={lightUiFormLabelClass}
                  >
                    Event Type
                  </label>
                  <select
                    id="event-settings-event-type"
                    value={eventSettings.eventLayoutProfile}
                    onChange={(event) => {
                      const nextType = event.target.value as EventLayoutProfile;
                      setEventSettings((prev) => ({
                        ...prev,
                        eventLayoutProfile: nextType,
                        eventType: nextType,
                        ...getLayoutProfileDefaults(nextType),
                        ...getLiveEventDocumentDefaults(nextType),
                      }));
                    }}
                    className={lightUiSelectClass}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={`event-type-setting-${type}`} value={type} className="bg-white text-stone-900">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <TextInput
                  id="event-settings-date"
                  label={eventDateFieldLabel}
                  value={eventSettings.weddingDate}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, weddingDate: value }))}
                />
                <TextInput
                  id="event-settings-venue"
                  label="Venue"
                  value={eventSettings.venue}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, venue: value }))}
                />
                <TextInput
                  id="event-settings-ceremony-location"
                  label="Ceremony Location"
                  value={eventSettings.ceremonyLocation}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, ceremonyLocation: value }))
                  }
                />
                <TextInput
                  id="event-settings-reception-location"
                  label="Reception Location"
                  value={eventSettings.receptionLocation}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, receptionLocation: value }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    id="event-settings-start-time"
                    label="Event Start Time"
                    value={eventSettings.eventStartTime}
                    onChange={(value) =>
                      setEventSettings((prev) => ({ ...prev, eventStartTime: value }))
                    }
                  />
                  <TextInput
                    id="event-settings-end-time"
                    label="Event End Time"
                    value={eventSettings.eventEndTime}
                    onChange={(value) =>
                      setEventSettings((prev) => ({ ...prev, eventEndTime: value }))
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="event-settings-assigned-dj-select"
                    className={lightUiFormLabelClass}
                  >
                    Assigned DJ from Team
                  </label>
                  <select
                    id="event-settings-assigned-dj-select"
                    value={eventSettings.assignedDj}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const nextName = getTeamMemberName(nextId);
                      setEventSettings((prev) => ({ ...prev, assignedDj: nextId }));
                      if (nextId && nextId !== eventSettings.assignedDj) {
                        logActivity("team_member_assigned", `Assigned DJ: ${nextName}`);
                      }
                    }}
                    className={lightUiSelectClass}
                  >
                    <option value="" className="bg-white text-stone-900">
                      Select a DJ
                    </option>
                    {activeDjTeamMembers.map((member) => (
                      <option key={member.id} value={member.id} className="bg-white text-stone-900">
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {canManageEvents && Boolean(eventSettings.assignedDj?.trim()) ? (
                    <div className="mt-2">
                      <PrimaryButton
                        type="button"
                        onClick={clearAssignedDjFromActiveEvent}
                        className={`w-full ${lightUiSecondaryButtonClass}`}
                      >
                        Remove from Event
                      </PrimaryButton>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-stone-600">
                        Clears the DJ assignment for this event only; team roster profiles are unchanged.
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    id="event-settings-planner-name"
                    label="Planner Name"
                    value={eventSettings.plannerName}
                    onChange={(value) =>
                      setEventSettings((prev) => ({ ...prev, plannerName: value }))
                    }
                  />
                  <TextInput
                    id="event-settings-planner-email"
                    label="Planner Email"
                    value={eventSettings.plannerEmail}
                    onChange={(value) =>
                      setEventSettings((prev) => ({ ...prev, plannerEmail: value }))
                    }
                  />
                </div>
                {canManageEvents && assignedPlannerTeamMemberForEvent ? (
                  <div className="mt-1">
                    <PrimaryButton
                      type="button"
                      onClick={() =>
                        removeTeamMemberFromActiveEvent(assignedPlannerTeamMemberForEvent)
                      }
                      className={`w-full ${lightUiSecondaryButtonClass}`}
                    >
                      Remove from Event
                    </PrimaryButton>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-stone-600">
                      Clears planner name and email on this event when they match team member{" "}
                      {assignedPlannerTeamMemberForEvent.name}. The roster entry is not deleted.
                    </p>
                  </div>
                ) : null}
                <TextInput
                  id="event-settings-package-name"
                  label="Package Name"
                  value={eventSettings.packageName}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, packageName: value }))}
                />
                <TextArea
                  id="event-settings-internal-notes"
                  label="Internal Notes"
                  value={eventSettings.internalNotes}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, internalNotes: value }))
                  }
                  rows={3}
                />
                <TextArea
                  id="event-settings-client-notes"
                  label="Client-facing Notes"
                  value={eventSettings.clientFacingNotes}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, clientFacingNotes: value }))
                  }
                  rows={3}
                />
                <TextArea
                  id="event-settings-guestmsg"
                  label="Event-specific Guest Request Message Override"
                  value={eventSettings.guestRequestMessageOverride}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, guestRequestMessageOverride: value }))
                  }
                  rows={2}
                  placeholder={appSettings.publicGuestRequestMessage}
                />
                <TextArea
                  id="event-settings-prep"
                  label="Event-specific Prep Footer Override"
                  value={eventSettings.prepSheetFooterOverride}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, prepSheetFooterOverride: value }))
                  }
                  rows={2}
                  placeholder={appSettings.prepSheetFooterText}
                />
                <TextInput
                  id="event-settings-welcome"
                  label="Event-specific Couple Welcome Override"
                  value={eventSettings.coupleWelcomeMessageOverride}
                  onChange={(value) =>
                    setEventSettings((prev) => ({ ...prev, coupleWelcomeMessageOverride: value }))
                  }
                  placeholder={appSettings.coupleWelcomeMessage}
                />
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs leading-relaxed text-stone-700">
                  Collaborators are event-specific and managed in the Collaborators screen.
                </div>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Planning Checklist" && sectionPlanningChecklistEnabled && (
          <section className="mt-6 space-y-3">
            <EventHomeNav trail={["Planning Checklist"]} onBack={() => setActiveScreen("Dashboard")} />
            <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
              <div className="flex items-center justify-between">
                <SectionTitle className="!text-zinc-100">Planning Checklist</SectionTitle>
                <span className="rounded-full bg-[#00D4FF]/20 px-2.5 py-1 text-xs font-semibold text-zinc-100">
                  {completionPercent}% complete
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Track major planning milestones and jump directly to the linked section.
              </p>
            </PremiumCard>

            {planningChecklist.map((task) => (
              <PremiumCard key={`task-${task.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SectionTitle className="text-stone-950">{task.title}</SectionTitle>
                    <p className="mt-1 text-xs text-stone-600">{task.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      task.status === "Complete"
                        ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
                        : task.status === "In Progress"
                          ? "border border-[#00D4FF]/50 bg-[#00D4FF]/12 text-stone-900"
                          : "border border-stone-300 bg-stone-100 text-stone-700"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <TextInput
                    id={`task-due-${task.id}`}
                    label="Due Date"
                    value={task.dueDate}
                    onChange={(value) =>
                      setEventSettings((prev) => ({
                        ...prev,
                        checklistDueDates: {
                          ...(prev.checklistDueDates ?? {}),
                          [task.id]: value,
                        },
                      }))
                    }
                    placeholder="e.g. 2 weeks before event"
                  />
                  <div>
                    <label
                      htmlFor={`task-status-${task.id}`}
                      className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600"
                    >
                      Status
                    </label>
                    <select
                      id={`task-status-${task.id}`}
                      value={task.status}
                      onChange={(event) =>
                        setEventSettings((prev) => ({
                          ...prev,
                          checklistManualStatuses: {
                            ...(prev.checklistManualStatuses ?? {}),
                            [task.id]: event.target.value as ChecklistStatus,
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-none focus:border-[#00D4FF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/25"
                    >
                      {(["Not Started", "In Progress", "Complete"] as ChecklistStatus[]).map(
                        (status) => (
                          <option key={`${task.id}-${status}`} value={status}>
                            {status}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <PrimaryButton
                    onClick={() => setActiveScreen(task.linkedSection)}
                    className="w-full rounded-xl border border-stone-400 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:bg-stone-50"
                  >
                    Go to {navLabel(task.linkedSection)}
                  </PrimaryButton>
                </div>
              </PremiumCard>
            ))}
          </section>
        )}

        {authStage === "app" &&
          appMode === "event" &&
          activeScreen === "Planning Questions" &&
          sectionPlanningQuestionsEnabled && (
          <section className="mt-6 space-y-3">
            <EventHomeNav
              trail={["Planning Questions"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={
                coupleAttentionSummary.unansweredPlanningQuestionCount > 0
                  ? {
                      label: "Review questions",
                      onClick: () =>
                        document.getElementById("planning-questions-anchor")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                    }
                  : undefined
              }
            />
            <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <SectionTitle className="!text-zinc-100">Planning Questions</SectionTitle>
                <PersistEcho persistFeedback={persistFeedback} variant="dark" className="pt-0.5" />
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Prompts match your event type and are grouped by topic. Expand a section to answer or edit—responses save with this event and can surface in the Event Document when that block is turned on.
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Event Type · {layoutProfileForActiveEvent}
              </p>
            </PremiumCard>
            {planningQuestionsForEvent.length === 0 ? (
              <SectionEmptyState
                title="No prompts for this profile"
                description="Questions follow your event type—adjust layout or profile in Event Settings if needed."
                primaryAction={{
                  label: "Open Event Settings",
                  onClick: () => setActiveScreen("Event Settings"),
                }}
                cardClassName="border-dashed border-white/15 bg-white/[0.03]"
              />
            ) : (
              <div id="planning-questions-anchor" className="space-y-3">
                {planningQuestionsGroupedBySection.map((row) => {
                  const pct = computePlanningQuestionGroupCompletion(
                    row.questions,
                    eventSettings.planningQuestionAnswers,
                  );
                  const isExpanded = expandedPlanningQuestionGroups[row.group.id] ?? true;
                  return (
                    <PremiumCard
                      key={`pq-group-${row.group.id}`}
                      className="border-zinc-700 bg-zinc-900 shadow-none"
                    >
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 rounded-xl text-left transition hover:bg-white/[0.04] sm:items-center sm:justify-between"
                        onClick={() =>
                          setExpandedPlanningQuestionGroups((p) => ({
                            ...p,
                            [row.group.id]: !(p[row.group.id] ?? true),
                          }))
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-zinc-100">{row.group.label}</p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {pct}% answered · {row.questions.length}{" "}
                            {row.questions.length === 1 ? "question" : "questions"}
                          </p>
                          <div className="mt-2 h-1.5 max-w-full overflow-hidden rounded-full bg-zinc-800/90 sm:max-w-xs">
                            <div
                              className="h-full rounded-full bg-[#00D4FF]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span
                          className="shrink-0 pt-0.5 text-sm text-zinc-500"
                          aria-hidden
                        >
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </button>
                      {isExpanded ? (
                        <div className="mt-4 border-t border-white/10 pt-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            {row.questions.map((q) => (
                              <PlanningQuestionAnswerEditor
                                key={q.id}
                                q={q}
                                value={eventSettings.planningQuestionAnswers[q.id] ?? ""}
                                onChange={(next) =>
                                  setEventSettings((prev) => ({
                                    ...prev,
                                    planningQuestionAnswers: {
                                      ...(prev.planningQuestionAnswers ?? {}),
                                      [q.id]: next,
                                    },
                                  }))
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </PremiumCard>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {authStage === "app" && activeScreen === "Notification Center" && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-zinc-800 bg-zinc-950 shadow-none">
              <div className="flex items-center justify-between">
                <SectionTitle className="!text-zinc-100">Notification Center</SectionTitle>
                <span className="rounded-full bg-[#00D4FF]/20 px-2.5 py-1 text-xs font-semibold text-zinc-100">
                  {unreadBadgeCount} unread
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-zinc-400">Filter Event</label>
                  <select
                    value={activityEventFilter}
                    onChange={(event) => setActivityEventFilter(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-100"
                  >
                    <option value="all" className="bg-[#141419]">All Events</option>
                    {events.map((evt) => (
                      <option key={`flt-evt-${evt.id}`} value={evt.id} className="bg-[#141419]">
                        {evt.settings?.eventName || evt.meta.couple || "Event"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-zinc-400">Filter Type</label>
                  <select
                    value={activityTypeFilter}
                    onChange={(event) => setActivityTypeFilter(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-100"
                  >
                    <option value="all" className="bg-[#141419]">All Types</option>
                    {[
                      "event_created",
                      "timeline_updated",
                      "timeline_item_added",
                      "song_added",
                      "guest_request_submitted",
                      "guest_request_reviewed",
                      "ceremony_updated",
                      "formality_updated",
                      "collaborator_invited",
                      "collaborator_removed_from_event",
                      "team_member_added",
                      "team_member_assigned",
                      "team_member_removed_from_event",
                      "vendor_updated",
                      "checklist_completed",
                      "template_applied",
                    ].map((type) => (
                      <option key={`flt-type-${type}`} value={type} className="bg-[#141419]">
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </PremiumCard>

            {notifications.slice(0, 3).map((notice) => (
              <PremiumCard key={`notice-${notice.id}`} className="border-[#00D4FF]/20">
                <p className="text-sm text-zinc-100">
                  <span className="mr-1">{activityTypeIcon(notice.type)}</span>
                  {notice.summary}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {notice.eventName} · {formatRelativeTime(notice.timestamp)}
                </p>
              </PremiumCard>
            ))}

            {filteredActivities.map((item) => (
              <PremiumCard key={`activity-${item.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-zinc-100">
                    <span className="mr-1">{activityTypeIcon(item.type)}</span>
                    {item.summary}
                  </p>
                  {item.unread && (
                    <span className="rounded-full bg-[#00D4FF]/20 px-2 py-1 text-[10px] text-zinc-100">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.userRole} · {item.eventName} · {formatRelativeTime(item.timestamp)}
                </p>
              </PremiumCard>
            ))}
            {filteredActivities.length === 0 && (
              <PremiumCard>
                <p className="text-xs text-zinc-400">
                  No activity matches the current filters. Try broadening event or type selection.
                </p>
              </PremiumCard>
            )}
          </section>
        )}
      </main>

      {authStage === "app" && quickActions.length > 0 && (
        <>
          <div
            onClick={() => setQuickActionsOpen(false)}
            className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 lg:hidden ${
              quickActionsOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
          <div className="fixed bottom-24 right-4 z-50 flex w-[calc(100%-2rem)] max-w-[260px] flex-col items-end gap-2 lg:hidden">
            <div
              className={`w-full space-y-2 transition-all duration-200 ${
                quickActionsOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              {quickActions.slice(0, 6).map((action) => (
                <PrimaryButton
                  key={`qa-${action.id}`}
                  onClick={() => {
                    action.onClick();
                    setQuickActionsOpen(false);
                  }}
                  className="w-full rounded-xl border border-white/15 bg-[#141419]/90 text-zinc-100 shadow-[0_10px_28px_rgba(0,0,0,0.35)] hover:border-[#00D4FF]/35 hover:bg-[#191920]"
                >
                  {action.label}
                </PrimaryButton>
              ))}
            </div>
            <PrimaryButton
              onClick={() => setQuickActionsOpen((prev) => !prev)}
              className={`rounded-2xl border border-[#00D4FF]/35 bg-[#00D4FF] px-4 text-sm font-semibold text-black shadow-[0_10px_28px_rgba(143,107,47,0.35)] transition-transform ${
                quickActionsOpen ? "rotate-45" : ""
              }`}
            >
              +
            </PrimaryButton>
          </div>
        </>
      )}

      {teamModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 lg:items-stretch lg:justify-end lg:p-5">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12 lg:h-full lg:max-w-lg lg:rounded-3xl">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">
                {teamEditingId ? "Edit Team Member" : "Add Team Member"}
              </SectionTitle>
              <PrimaryButton
                onClick={closeTeamMemberModal}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
              >
                Close
              </PrimaryButton>
            </div>
            <div className="mt-4 space-y-3">
              <TextInput
                id="team-member-name"
                label="Name"
                value={teamNameDraft}
                onChange={setTeamNameDraft}
                disabled={!canManageEvents}
              />
              <div>
                <label htmlFor="team-member-role" className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-600">
                  Role
                </label>
                <select
                  id="team-member-role"
                  value={teamRoleDraft}
                  disabled={!canManageEvents}
                  onChange={(event) => setTeamRoleDraft(event.target.value as "Admin" | "DJ" | "Planner")}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900 shadow-sm transition focus:border-cyan-500/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
                >
                  {(["Admin", "DJ", "Planner"] as const).map((role) => (
                    <option key={`team-role-${role}`} value={role} className="bg-white text-stone-900">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  id="team-member-email"
                  label="Email"
                  value={teamEmailDraft}
                  onChange={setTeamEmailDraft}
                  disabled={!canManageEvents}
                />
                <TextInput
                  id="team-member-phone"
                  label="Phone"
                  value={teamPhoneDraft}
                  onChange={setTeamPhoneDraft}
                  disabled={!canManageEvents}
                />
              </div>
              <TextArea
                id="team-member-notes"
                label="Notes"
                value={teamNotesDraft}
                onChange={setTeamNotesDraft}
                rows={3}
                disabled={!canManageEvents}
              />
              <PrimaryButton
                onClick={() => setTeamActiveDraft((prev) => !prev)}
                disabled={!canManageEvents}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold ${
                  teamActiveDraft
                    ? "border-emerald-300/90 bg-emerald-50 text-emerald-950 shadow-sm hover:bg-emerald-100/80"
                    : "border-stone-300 bg-stone-50 text-stone-700 shadow-sm hover:bg-stone-100"
                }`}
              >
                {teamActiveDraft ? "Active Member" : "Inactive Member"}
              </PrimaryButton>
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={closeTeamMemberModal}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
                >
                  {teamEditingId ? "Cancel Edit" : "Cancel"}
                </PrimaryButton>
                <PrimaryButton
                  onClick={saveTeamMember}
                  disabled={!canManageEvents}
                  className="rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-60"
                >
                  {teamEditingId ? "Save Changes" : "Add Team Member"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">Invite Collaborator</SectionTitle>
              <PrimaryButton
                onClick={() => setInviteModalOpen(false)}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Close
              </PrimaryButton>
            </div>
            <div className="mt-4 space-y-3">
              <TextInput
                id="invite-name"
                label="Name"
                value={inviteName}
                onChange={setInviteName}
                placeholder="e.g. Jamie Planner"
              />
              <TextInput
                id="invite-email"
                label="Email"
                value={inviteEmail}
                onChange={setInviteEmail}
                placeholder="e.g. jamie@example.com"
              />
              <div>
                <label htmlFor="invite-role" className="text-[11px] uppercase tracking-wide text-zinc-400">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100"
                >
                  {(["Couple", "DJ", "Planner", "Admin"] as UserRole[]).map((role) => (
                    <option key={`invite-${role}`} value={role} className="bg-[#141419]">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <PrimaryButton
                onClick={() => setInviteModalOpen(false)}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                onClick={handleInviteCollaborator}
                className="w-full rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
              >
                Send Invite
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">
                {templateModalMode === "new" ? "Save Template" : "Edit Template"}
              </SectionTitle>
              <PrimaryButton
                onClick={() => {
                  setTemplateModalOpen(false);
                  setTemplateEditingId(null);
                }}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Close
              </PrimaryButton>
            </div>
            <div className="mt-4 space-y-3">
              <TextInput
                id="template-name"
                label="Template Name"
                value={templateDraftName}
                onChange={setTemplateDraftName}
                placeholder="e.g. Summer Garden Wedding"
              />
              <p className="text-xs text-zinc-500">
                Saves current reception timeline and planning suggestions.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <PrimaryButton
                onClick={() => {
                  setTemplateModalOpen(false);
                  setTemplateEditingId(null);
                }}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                onClick={handleSaveTemplateModal}
                className="w-full rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
              >
                {templateModalMode === "new" ? "Save" : "Update"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {authStage === "app" && canManageEvents && eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-5">
          <div className="max-h-[min(92vh,880px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12 cm-section-enter sm:max-h-[88vh] sm:max-w-2xl">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">
                {eventModalMode === "new" ? "Create Event" : "Edit Event"}
              </SectionTitle>
              <PrimaryButton
                onClick={() => {
                  setEventModalOpen(false);
                  setEventEditingId(null);
                  setEventModalStatus(null);
                }}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Close
              </PrimaryButton>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveEventModal();
              }}
              className="mt-4 space-y-4"
            >
              <TextInput
                id="event-name"
                label="Event Name"
                value={eventDraft.eventName}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, eventName: value }))
                }
                placeholder="e.g. Jordan Graduation Celebration"
              />
              <TextInput
                id="event-couple-names"
                label={PRIMARY_PARTY_FIELD_LABEL[eventDraft.eventLayoutProfile]}
                value={eventDraft.coupleNames}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, coupleNames: value }))
                }
                placeholder="e.g. Jordan Vega"
              />
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <label
                  htmlFor="event-type"
                  className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                >
                  Event Type
                </label>
                <select
                  id="event-type"
                  value={eventDraft.eventLayoutProfile}
                  onChange={(event) =>
                    setEventDraft((prev) => ({
                      ...prev,
                      eventLayoutProfile: event.target.value as EventLayoutProfile,
                      eventType: event.target.value as EventLayoutProfile,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#00D4FF]/70 focus:outline-none"
                >
                  {EVENT_TYPES.map((profile) => (
                    <option key={`draft-layout-${profile}`} value={profile} className="bg-[#141419] text-zinc-100">
                      {profile}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-relaxed text-zinc-500">
                  {LAYOUT_PROFILE_DESCRIPTIONS[eventDraft.eventLayoutProfile]}
                </p>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Event Type Preview</p>
                  <p className="mt-2 text-xs text-zinc-300">{EVENT_TYPE_USE_CASE[eventDraft.eventLayoutProfile]}</p>
                  <div className="mt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Enabled Sections
                    </p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {getEnabledLayoutSectionLabels(getLayoutProfileDefaults(eventDraft.eventLayoutProfile)).join(" · ")}
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Default Planning Questions
                    </p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {getPlanningQuestionsForProfile(eventDraft.eventLayoutProfile)
                        .map((q) => q.label)
                        .slice(0, 4)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Event Document Default Sections
                    </p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {getDefaultLiveEventSectionLabels(eventDraft.eventLayoutProfile).join(" · ")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Sections enabled by default
                  </p>
                  <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-zinc-300 sm:grid-cols-2">
                    {getEnabledLayoutSectionLabels(
                      getLayoutProfileDefaults(eventDraft.eventLayoutProfile),
                    ).map((label) => (
                      <li key={`draft-section-${label}`} className="flex gap-2">
                        <span className="text-[#00D4FF]" aria-hidden>
                          ✓
                        </span>
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <TextInput
                id="event-date"
                label={
                  eventDraft.eventLayoutProfile === "Wedding" ||
                  eventDraft.eventLayoutProfile === "Gender-Neutral Wedding"
                    ? "Wedding Date"
                    : "Event Date"
                }
                value={eventDraft.weddingDate}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, weddingDate: value }))
                }
                placeholder="e.g. Saturday, September 21, 2026"
              />
              <TextInput
                id="event-venue"
                label="Venue"
                value={eventDraft.venue}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, venue: value }))
                }
                placeholder="e.g. The Grand Willow Estate"
              />
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  id="event-ceremony-location"
                  label="Ceremony Location"
                  value={eventDraft.ceremonyLocation}
                  onChange={(value) =>
                    setEventDraft((prev) => ({ ...prev, ceremonyLocation: value }))
                  }
                  placeholder="e.g. Garden Lawn"
                />
                <TextInput
                  id="event-reception-location"
                  label="Reception Location"
                  value={eventDraft.receptionLocation}
                  onChange={(value) =>
                    setEventDraft((prev) => ({ ...prev, receptionLocation: value }))
                  }
                  placeholder="e.g. Main Ballroom"
                />
              </div>
              <div>
                <label
                  htmlFor="event-assigned-dj"
                  className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
                >
                  Assigned DJ
                </label>
                <select
                  id="event-assigned-dj"
                  value={eventDraft.assignedDj}
                  onChange={(event) =>
                    setEventDraft((prev) => ({ ...prev, assignedDj: event.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#00D4FF]/70 focus:outline-none"
                >
                  <option value="" className="bg-[#141419] text-zinc-100">
                    Select a DJ
                  </option>
                  {activeDjTeamMembers.map((member) => (
                    <option key={`event-modal-dj-${member.id}`} value={member.id} className="bg-[#141419] text-zinc-100">
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <TextInput
                id="event-package"
                label="Package"
                value={eventDraft.packageName}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, packageName: value }))
                }
                placeholder="e.g. Signature Wedding Experience"
              />
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  id="event-planner-name"
                  label="Planner Name"
                  value={eventDraft.plannerName}
                  onChange={(value) =>
                    setEventDraft((prev) => ({ ...prev, plannerName: value }))
                  }
                />
                <TextInput
                  id="event-planner-email"
                  label="Planner Email"
                  value={eventDraft.plannerEmail}
                  onChange={(value) =>
                    setEventDraft((prev) => ({ ...prev, plannerEmail: value }))
                  }
                />
              </div>
              <TextArea
                id="event-internal-notes"
                label="Internal Notes"
                value={eventDraft.internalNotes}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, internalNotes: value }))
                }
                rows={3}
              />
              {eventModalStatus && (
                <p
                  className={`rounded-xl px-3 py-2 text-xs ${
                    eventModalStatus.kind === "success"
                      ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                      : "border border-rose-400/25 bg-rose-500/10 text-rose-100"
                  }`}
                >
                  {eventModalStatus.message}
                </p>
              )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <PrimaryButton
                type="button"
                onClick={() => {
                  setEventModalOpen(false);
                  setEventEditingId(null);
                  setEventModalStatus(null);
                }}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                type="submit"
                className="w-full rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
              >
                {eventModalMode === "new" ? "Create Event" : "Save Changes"}
              </PrimaryButton>
            </div>
            </form>
          </div>
        </div>
      )}

      {vendorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-5">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/98 shadow-2xl shadow-stone-900/12 sm:max-w-2xl sm:max-h-[90vh]">
            <div className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-stone-950">
                  {vendorEditingId ? "Edit Vendor" : "Add Vendor"}
                </SectionTitle>
                <PrimaryButton
                  onClick={closeVendorModal}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
                >
                  Close
                </PrimaryButton>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveVendor();
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="space-y-3 overflow-y-auto px-5 py-4">
                <div>
                  <label htmlFor="vendor-affiliation" className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    On this event
                  </label>
                  <select
                    id="vendor-affiliation"
                    value={vendorAffiliationDraft}
                    onChange={(event) =>
                      setVendorAffiliationDraft(event.target.value as VendorAffiliation)
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#00D4FF]/70 focus:outline-none"
                  >
                    <option value="event_partner" className="bg-[#141419] text-zinc-100">
                      Event partner (external vendor)
                    </option>
                    <option value="cutmaster_event_team" className="bg-[#141419] text-zinc-100">
                      Cutmaster event team
                    </option>
                  </select>
                  <p className="mt-1.5 text-[11px] leading-snug text-zinc-500">
                    Cutmaster team appears in its own block; partners group by category below.
                  </p>
                </div>
                <div>
                  <label htmlFor="vendor-type" className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Role / category
                  </label>
                  <select
                    id="vendor-type"
                    value={vendorTypeDraft}
                    onChange={(event) => setVendorTypeDraft(event.target.value as VendorType)}
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#00D4FF]/70 focus:outline-none"
                  >
                    {VENDOR_TYPES_ORDERED.map((type) => (
                      <option key={`vendor-type-option-${type}`} value={type} className="bg-[#141419] text-zinc-100">
                        {vendorTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
                <TextInput id="vendor-company" label="Company Name" value={vendorCompanyDraft} onChange={setVendorCompanyDraft} />
                <TextInput id="vendor-contact" label="Contact Name" value={vendorContactDraft} onChange={setVendorContactDraft} />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput id="vendor-email" label="Email" value={vendorEmailDraft} onChange={setVendorEmailDraft} />
                  <TextInput id="vendor-phone" label="Phone" value={vendorPhoneDraft} onChange={setVendorPhoneDraft} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput id="vendor-website" label="Website" value={vendorWebsiteDraft} onChange={setVendorWebsiteDraft} />
                  <TextInput id="vendor-instagram" label="Instagram" value={vendorInstagramDraft} onChange={setVendorInstagramDraft} />
                </div>
                <TextInput id="vendor-arrival-time" label="Arrival Time" value={vendorArrivalDraft} onChange={setVendorArrivalDraft} placeholder="e.g. 2:00 PM" />
                <TextArea id="vendor-notes" label="Notes" value={vendorNotesDraft} onChange={setVendorNotesDraft} rows={2} />
                <TextArea
                  id="vendor-coordination"
                  label="Special Coordination Notes"
                  value={vendorCoordinationDraft}
                  onChange={setVendorCoordinationDraft}
                  rows={3}
                />
              </div>

              <div className="shrink-0 border-t border-white/10 bg-white/98 px-5 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <PrimaryButton
                    type="button"
                    onClick={closeVendorModal}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs text-zinc-200 hover:bg-white/15"
                  >
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton
                    type="submit"
                    className="rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black hover:brightness-110"
                  >
                    Save Vendor
                  </PrimaryButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {authStage === "app" &&
        appMode === "event" &&
        activeScreen === "Event Prep" &&
        canAccessRunOfShow &&
        runOfShowOpen && (
          <div
            className="no-print fixed inset-0 z-[200] flex flex-col bg-white text-stone-950"
            role="dialog"
            aria-label="Run of show"
          >
            <header className="sticky top-0 z-10 shrink-0 border-b border-stone-200 bg-white pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_0_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-4 px-4 py-3.5 sm:gap-x-6 sm:px-8 sm:py-4">
                <div className="min-w-0 flex-1 basis-full pr-0 sm:basis-[min(100%,32rem)] sm:pr-2 md:max-w-[min(100%,42rem)]">
                  <h2 className="text-[1.35rem] font-semibold leading-[1.2] tracking-tight text-stone-950 sm:text-[1.75rem] md:text-[2rem]">
                    {runOfShowHeadline}
                  </h2>
                  <p className="mt-1.5 max-w-3xl text-[12px] font-medium leading-snug text-stone-500 sm:text-[13px]">
                    {runOfShowSubline}
                  </p>
                  {runOfShowUpNextMeta.banner === "upNext" ? (
                    <p className="mt-2 max-w-3xl text-[12px] font-semibold leading-snug text-stone-800 sm:text-[13px]">
                      Up Next:{" "}
                      <span className="font-semibold text-stone-950">{runOfShowUpNextMeta.upNextTitle}</span>
                    </p>
                  ) : runOfShowUpNextMeta.banner === "complete" ? (
                    <p className="mt-2 max-w-3xl text-[12px] font-medium leading-snug text-stone-600 sm:text-[13px]">
                      Run Of Show complete
                    </p>
                  ) : null}
                </div>
                <div className="ml-auto flex w-full shrink-0 flex-wrap items-start justify-end gap-3 sm:w-auto sm:flex-nowrap sm:items-center sm:gap-4 sm:pt-0.5">
                  {/*
                    White-label: this block is the Run Of Show brand slot — replace `runOfShowHeaderBrand`
                    (or source from tenant config) so logo, companyName, and brandAccentColor stay swappable.
                  */}
                  <div
                    className="flex max-w-[11rem] flex-col items-end gap-1 border-l border-stone-200 pl-3 sm:max-w-[10.5rem] sm:pl-4 md:max-w-[12rem]"
                    style={{
                      borderLeftColor: `${runOfShowHeaderBrand.brandAccentColor}33`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={runOfShowHeaderBrand.logoSrc}
                      alt=""
                      className="hidden h-7 w-auto max-w-[118px] object-contain object-right brightness-0 sm:block md:h-[2.1rem] md:max-w-[140px]"
                    />
                    <p className="text-right text-[12px] font-semibold leading-snug text-stone-700 sm:hidden">
                      {runOfShowHeaderBrand.companyName}
                    </p>
                    <p className="hidden max-w-full text-right text-[9px] font-semibold uppercase leading-tight tracking-[0.12em] text-stone-400 sm:block sm:truncate">
                      {runOfShowHeaderBrand.companyName}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-stretch justify-end gap-2 sm:flex-none sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setRunOfShowAnnotateMode((v) => !v)}
                      className={`min-h-10 shrink-0 rounded-xl border px-3 py-2 text-[12px] font-semibold transition sm:min-h-10 ${
                        runOfShowAnnotateMode
                          ? "border-stone-800 bg-stone-900 text-white shadow-sm"
                          : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
                      }`}
                      aria-pressed={runOfShowAnnotateMode}
                    >
                      {runOfShowAnnotateMode ? "Annotating" : "Annotate"}
                    </button>
                    {runOfShowAnnotateMode ? (
                      <>
                        <button
                          type="button"
                          onClick={clearRunOfShowAnnotations}
                          className="min-h-10 shrink-0 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-[11px] font-semibold text-stone-600 transition hover:border-stone-300 hover:bg-stone-100"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={undoLastRunOfShowAnnotation}
                          disabled={runOfShowAnnotationStrokes.length === 0}
                          className="min-h-10 shrink-0 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-[11px] font-semibold text-stone-600 transition enabled:hover:border-stone-300 enabled:hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Undo
                        </button>
                      </>
                    ) : null}
                    {typeof document !== "undefined" && document.fullscreenEnabled ? (
                      <PrimaryButton
                        type="button"
                        onClick={() => void toggleRunOfShowFullscreen()}
                        className="min-h-11 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:flex-none sm:min-h-10 sm:px-4 sm:py-2"
                      >
                        {runOfShowIsFullscreen ? "Exit fullscreen" : "Fullscreen"}
                      </PrimaryButton>
                    ) : null}
                    <PrimaryButton
                      type="button"
                      onClick={closeRunOfShow}
                      className="min-h-11 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-800 shadow-none hover:bg-stone-100 sm:flex-none sm:min-h-10 sm:px-4 sm:py-2"
                    >
                      Exit Run Of Show
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={resetRunOfShowDone}
                      className="min-h-9 w-full flex-[1_1_100%] text-center text-[11px] font-medium text-stone-400 underline decoration-stone-300 underline-offset-[5px] transition hover:text-stone-600 sm:min-h-0 sm:w-auto sm:flex-none sm:text-left"
                    >
                      Reset Run Of Show
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <main
              ref={runOfShowScrollRef}
              className="relative min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 pb-16 pt-6 sm:px-10 sm:pb-20 sm:pt-10 lg:px-20"
            >
              <div className="relative z-0 mx-auto max-w-5xl" data-run-of-show-inner="">
                {sectionCeremonyEnabled ? (
                  <section className="mb-14 sm:mb-16">
                    <h3 className="border-b border-stone-200 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Ceremony
                    </h3>
                    <div className="mt-6 grid gap-2 text-sm text-stone-700 sm:grid-cols-2 sm:gap-x-10">
                      <p>
                        <span className="font-semibold text-stone-900">Ceremony start</span>{" "}
                        {ceremonyStartTime || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-stone-900">Guest arrival</span>{" "}
                        {ceremonyGuestArrivalTime || "—"}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-semibold text-stone-900">Location</span>{" "}
                        {eventSettings.ceremonyLocation?.trim() ||
                          eventSettings.venue?.trim() ||
                          weddingDetails.venue?.trim() ||
                          "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-stone-900">Officiant</span>{" "}
                        {officiantName?.trim() || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-stone-900">Microphones</span>{" "}
                        {microphoneNeeds?.trim() || "—"}
                      </p>
                      {ceremonyNotes?.trim() ? (
                        <p className="sm:col-span-2">
                          <span className="font-semibold text-stone-900">Ceremony notes</span> {ceremonyNotes}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-10 space-y-0 divide-y divide-stone-200 border-t border-stone-200">
                      {ceremonyTimelineRows.length === 0 ? (
                        <p className="py-8 text-base text-stone-600">No ceremony moments in this packet.</p>
                      ) : runOfShowCeremonyAllMomentsDone &&
                        !runOfShowUserExpandedWhileCompleteIds.has(RUN_OF_SHOW_CEREMONY_SECTION_ID) ? (
                        <button
                          type="button"
                          onClick={() => markRunOfShowSectionUserExpanded(RUN_OF_SHOW_CEREMONY_SECTION_ID)}
                          className="group flex w-full min-h-[3.25rem] items-start gap-3 rounded-xl border border-dashed border-stone-300/90 bg-white px-4 py-3.5 text-left text-stone-800 shadow-[inset_3px_0_0_0_rgb(120_113_108/0.35)] transition-colors duration-150 hover:border-stone-400/90 hover:bg-stone-50/80"
                          aria-expanded="false"
                        >
                          <span
                            className="mt-0.5 shrink-0 text-lg leading-none text-stone-400 transition group-hover:text-stone-600"
                            aria-hidden
                          >
                            ▸
                          </span>
                          <span className="shrink-0 text-base text-stone-500" aria-hidden>
                            ✓
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                              Summary · list hidden
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-snug text-stone-900">
                              Ceremony <span className="font-medium text-stone-600">complete</span>
                              <span className="font-normal text-stone-400"> · </span>
                              <span className="font-medium text-stone-600">
                                {ceremonyTimelineRows.length}{" "}
                                {ceremonyTimelineRows.length === 1 ? "moment" : "moments"}
                              </span>
                            </p>
                            <p className="mt-1.5 text-[11px] font-medium leading-snug text-stone-500">
                              Tap to show the full ceremony moment list
                            </p>
                          </div>
                        </button>
                      ) : (
                        <>
                          {runOfShowCeremonyAllMomentsDone &&
                          runOfShowUserExpandedWhileCompleteIds.has(RUN_OF_SHOW_CEREMONY_SECTION_ID) ? (
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-300/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                  Full list visible
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-stone-900">
                                  Ceremony moments · all marked done
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  collapseRunOfShowCompletedSection(RUN_OF_SHOW_CEREMONY_SECTION_ID)
                                }
                                className="shrink-0 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-[12px] font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-100"
                              >
                                Collapse list
                              </button>
                            </div>
                          ) : null}
                          {ceremonyTimelineRows.map((row) => {
                          const doneKey = `c:${row.id}`;
                          const done = runOfShowDoneKeys.has(doneKey);
                          const isUpNext =
                            runOfShowUpNextMeta.banner === "upNext" &&
                            runOfShowUpNextMeta.upNextKey === doneKey;
                          const rowSurface = done
                            ? "rounded-2xl bg-stone-100/95 px-3 py-8 ring-1 ring-inset ring-stone-200/80 sm:px-4 sm:py-10"
                            : isUpNext
                              ? "rounded-2xl border border-stone-300/90 bg-white px-3 py-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:px-4 sm:py-10"
                              : "py-8 sm:py-10";
                          return (
                            <article
                              key={`ros-ceremony-${row.id}`}
                              {...(isUpNext && !done ? { "data-run-of-show-up-next": "" } : {})}
                              className={`flex gap-4 sm:gap-6 ${rowSurface}`}
                            >
                              <div className="shrink-0 pt-0.5 sm:pt-1">
                                <button
                                  type="button"
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-none transition active:scale-[0.98] ${
                                    done
                                      ? "border-stone-300/90 bg-stone-200/40 hover:border-stone-400 hover:bg-stone-200/60"
                                      : "border-stone-300 bg-stone-50 text-stone-800 hover:border-stone-400 hover:bg-white"
                                  }`}
                                  aria-pressed={done}
                                  aria-label={done ? "Mark moment as not done" : "Mark moment as done"}
                                  onClick={() => toggleRunOfShowDoneKey(doneKey)}
                                >
                                  {done ? (
                                    <span className="text-xl font-semibold leading-none text-stone-600" aria-hidden>
                                      ✓
                                    </span>
                                  ) : (
                                    <span
                                      className="h-6 w-6 rounded-full border-2 border-stone-400"
                                      aria-hidden
                                    />
                                  )}
                                </button>
                              </div>
                              <div className="min-w-0 flex-1">
                                {isUpNext && !done ? (
                                  <p className="mb-2.5 inline-block rounded-md border border-stone-400/80 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-900 shadow-sm">
                                    Up next
                                  </p>
                                ) : null}
                                <p
                                  className={`font-mono text-2xl font-light tabular-nums sm:text-3xl ${
                                    done ? "text-stone-500" : "text-stone-900"
                                  }`}
                                >
                                  {row.order.trim() ? row.order : "—"}
                                </p>
                                <h4
                                  className={`mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl ${
                                    done
                                      ? "text-stone-600 line-through decoration-stone-400 decoration-[1.5px]"
                                      : "text-stone-950"
                                  }`}
                                >
                                  {row.moment}
                                </h4>
                                {row.song ? (
                                  <p
                                    className={`mt-5 text-lg leading-snug sm:text-xl ${
                                      done ? "text-stone-500" : "text-stone-800"
                                    }`}
                                  >
                                    {row.song}
                                  </p>
                                ) : null}
                                {row.notes ? (
                                  <p
                                    className={`mt-4 max-w-4xl text-base leading-relaxed sm:text-lg ${
                                      done ? "text-stone-500" : "text-stone-600"
                                    }`}
                                  >
                                    {row.notes}
                                  </p>
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                        </>
                      )}
                    </div>
                  </section>
                ) : null}

                {sectionReceptionTimelineEnabled ? (
                  <section className="mb-14 sm:mb-16">
                    <h3 className="border-b border-stone-200 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      {eventPrepReceptionHeading}
                    </h3>
                    <div className="mt-8 space-y-0 divide-y divide-stone-200 border-t border-stone-200">
                      {mergedTimelineItems.length === 0 ? (
                        <p className="py-8 text-base text-stone-600">No reception moments in this packet.</p>
                      ) : (
                        runOfShowReceptionPhaseGroups.map((phase) => {
                          const phaseCount = phase.items.length;
                          const phaseAllDone =
                            phaseCount > 0 &&
                            phase.items.every((row) => runOfShowDoneKeys.has(`r:${row.id}`));
                          const phaseCollapsed =
                            phaseAllDone &&
                            !runOfShowUserExpandedWhileCompleteIds.has(phase.id);
                          return (
                            <div key={phase.id} className="contents">
                              {phaseCollapsed ? (
                                <button
                                  type="button"
                                  onClick={() => markRunOfShowSectionUserExpanded(phase.id)}
                                  className="group flex w-full min-h-[3.25rem] items-start gap-3 rounded-xl border border-dashed border-stone-300/90 bg-white px-4 py-3.5 text-left text-stone-800 shadow-[inset_3px_0_0_0_rgb(120_113_108/0.35)] transition-colors duration-150 hover:border-stone-400/90 hover:bg-stone-50/80"
                                  aria-expanded="false"
                                >
                                  <span
                                    className="mt-0.5 shrink-0 text-lg leading-none text-stone-400 transition group-hover:text-stone-600"
                                    aria-hidden
                                  >
                                    ▸
                                  </span>
                                  <span className="shrink-0 text-base text-stone-500" aria-hidden>
                                    ✓
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                      Summary · list hidden
                                    </p>
                                    <p className="mt-1 text-sm font-semibold leading-snug text-stone-900">
                                      {phase.category}{" "}
                                      <span className="font-medium text-stone-600">complete</span>
                                      <span className="font-normal text-stone-400"> · </span>
                                      <span className="font-medium text-stone-600">
                                        {phaseCount} {phaseCount === 1 ? "moment" : "moments"}
                                      </span>
                                    </p>
                                    <p className="mt-1.5 text-[11px] font-medium leading-snug text-stone-500">
                                      Tap to show every moment in this block
                                    </p>
                                  </div>
                                </button>
                              ) : (
                                <>
                                  {phaseAllDone &&
                                  runOfShowUserExpandedWhileCompleteIds.has(phase.id) ? (
                                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-300/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                          Full list visible
                                        </p>
                                        <p className="mt-0.5 text-sm font-semibold text-stone-900">
                                          {phase.category} moments · all marked done
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => collapseRunOfShowCompletedSection(phase.id)}
                                        className="shrink-0 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-[12px] font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-100"
                                      >
                                        Collapse list
                                      </button>
                                    </div>
                                  ) : null}
                                  {phase.items.map((item) => {
                                  const doneKey = `r:${item.id}`;
                                  const done = runOfShowDoneKeys.has(doneKey);
                                  const isUpNext =
                                    runOfShowUpNextMeta.banner === "upNext" &&
                                    runOfShowUpNextMeta.upNextKey === doneKey;
                                  const songLabel = [item.songTitle?.trim(), item.artist?.trim()]
                                    .filter(Boolean)
                                    .join(" - ");
                                  const fadeSuffix = item.fadeOutEarly
                                    ? item.fadeOutTimestamp?.trim()
                                      ? ` (Fade ${item.fadeOutTimestamp.trim()})`
                                      : " (Fade early)"
                                    : "";
                                  const songCell = `${songLabel}${fadeSuffix}`.trim();
                                  const notesLabel = [
                                    item.notes?.trim() || "",
                                    item.needsDjMcAttention ? "MC/DJ attention" : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" · ");
                                  const rowSurface = done
                                    ? "rounded-2xl bg-stone-100/95 px-3 py-8 ring-1 ring-inset ring-stone-200/80 sm:px-4 sm:py-10"
                                    : isUpNext
                                      ? "rounded-2xl border border-stone-300/90 bg-white px-3 py-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:px-4 sm:py-10"
                                      : "py-8 sm:py-10";
                                  return (
                                    <article
                                      key={`ros-recv-${item.id}`}
                                      {...(isUpNext && !done ? { "data-run-of-show-up-next": "" } : {})}
                                      className={`flex gap-4 sm:gap-6 ${rowSurface}`}
                                    >
                                      <div className="shrink-0 pt-1 sm:pt-1.5">
                                        <button
                                          type="button"
                                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-none transition active:scale-[0.98] ${
                                            done
                                              ? "border-stone-300/90 bg-stone-200/40 hover:border-stone-400 hover:bg-stone-200/60"
                                              : "border-stone-300 bg-stone-50 text-stone-800 hover:border-stone-400 hover:bg-white"
                                          }`}
                                          aria-pressed={done}
                                          aria-label={
                                            done ? "Mark moment as not done" : "Mark moment as done"
                                          }
                                          onClick={() => toggleRunOfShowDoneKey(doneKey)}
                                        >
                                          {done ? (
                                            <span
                                              className="text-xl font-semibold leading-none text-stone-600"
                                              aria-hidden
                                            >
                                              ✓
                                            </span>
                                          ) : (
                                            <span
                                              className="h-6 w-6 rounded-full border-2 border-stone-400"
                                              aria-hidden
                                            />
                                          )}
                                        </button>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        {isUpNext && !done ? (
                                          <p className="mb-2.5 inline-block rounded-md border border-stone-400/80 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-900 shadow-sm">
                                            Up next
                                          </p>
                                        ) : null}
                                        <p
                                          className={`font-mono text-3xl font-light tabular-nums sm:text-4xl ${
                                            done ? "text-stone-500" : "text-stone-900"
                                          }`}
                                        >
                                          {item.time?.trim() ? item.time.trim() : "—"}
                                        </p>
                                        <h4
                                          className={`mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl ${
                                            done
                                              ? "text-stone-600 line-through decoration-stone-400 decoration-[1.5px]"
                                              : "text-stone-950"
                                          }`}
                                        >
                                          {item.title}
                                        </h4>
                                        <p
                                          className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
                                            done ? "text-stone-400" : "text-stone-500"
                                          }`}
                                        >
                                          {item.category}
                                        </p>
                                        {songCell ? (
                                          <p
                                            className={`mt-6 text-lg leading-snug sm:text-xl ${
                                              done ? "text-stone-500" : "text-stone-800"
                                            }`}
                                          >
                                            {songCell}
                                          </p>
                                        ) : null}
                                        {notesLabel ? (
                                          <p
                                            className={`mt-4 max-w-4xl text-base leading-relaxed sm:text-lg ${
                                              done ? "text-stone-500" : "text-stone-600"
                                            }`}
                                          >
                                            {notesLabel}
                                          </p>
                                        ) : null}
                                      </div>
                                    </article>
                                  );
                                })}
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                ) : null}

                {sectionMusicNotesEnabled && eventSettings.liveEventShowMusicNotes ? (
                  <section className="mb-8 border-t border-stone-200 pt-12">
                    <h3 className="border-b border-stone-200 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Music notes
                    </h3>
                    <div className="mt-8 space-y-4 text-base leading-relaxed text-stone-800 sm:text-lg">
                      {layoutProfileForActiveEvent === "School Dance" ? (
                        <p className="text-sm text-stone-600">Clean edits and school-appropriate selections.</p>
                      ) : null}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Overall vibe</p>
                        <p className="mt-2">{generalDjNotes?.trim() ? generalDjNotes : "—"}</p>
                      </div>
                      {(musicVibeDetail.genres ?? "").trim() ? (
                        <p>
                          <span className="font-semibold text-stone-900">Genres / eras · </span>
                          {musicVibeDetail.genres}
                        </p>
                      ) : null}
                      {(musicVibeDetail.energy ?? "").trim() ? (
                        <p>
                          <span className="font-semibold text-stone-900">Energy · </span>
                          {musicVibeDetail.energy}
                        </p>
                      ) : null}
                      {(musicVibeDetail.crowdNotes ?? "").trim() ? (
                        <p>
                          <span className="font-semibold text-stone-900">Crowd · </span>
                          {musicVibeDetail.crowdNotes}
                        </p>
                      ) : null}
                      {(musicVibeDetail.cleanMusicPrefs ?? "").trim() ? (
                        <p>
                          <span className="font-semibold text-stone-900">
                            {layoutProfileForActiveEvent === "School Dance"
                              ? "Clean selections · "
                              : "Clean / content · "}
                          </span>
                          {musicVibeDetail.cleanMusicPrefs}
                        </p>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                {!sectionCeremonyEnabled && !sectionReceptionTimelineEnabled ? (
                  <p className="py-12 text-center text-base text-stone-600">
                    No ceremony or reception timeline is enabled for this event.
                  </p>
                ) : null}
              </div>
              {(runOfShowAnnotateMode || runOfShowAnnotationStrokes.length > 0) &&
              runOfShowAnnotationCanvasSize.w > 0 &&
              runOfShowAnnotationCanvasSize.h > 0 ? (
                <canvas
                  ref={runOfShowAnnotationCanvasRef}
                  className={`absolute left-0 top-0 z-[6] ${
                    runOfShowAnnotateMode ? "pointer-events-auto touch-none" : "pointer-events-none"
                  }`}
                  style={{
                    width: runOfShowAnnotationCanvasSize.w,
                    height: runOfShowAnnotationCanvasSize.h,
                  }}
                  aria-hidden={!runOfShowAnnotateMode}
                />
              ) : null}
            </main>

            {runOfShowOverlayActive &&
            runOfShowUpNextMeta.banner === "upNext" &&
            runOfShowUpNextCueDetail ? (
              <button
                type="button"
                onClick={scrollRunOfShowToUpNext}
                tabIndex={runOfShowUpNextRowInView ? -1 : 0}
                aria-hidden={runOfShowUpNextRowInView}
                aria-label={`Scroll to up next: ${runOfShowUpNextCueDetail.title}`}
                className={`no-print fixed z-[8] flex min-h-[3rem] min-w-[10.5rem] max-w-[min(18rem,calc(100vw-2rem))] flex-col justify-center rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-left shadow-[0_2px_14px_rgba(15,23,42,0.06)] transition-[opacity,transform] duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:transition-opacity ${
                  runOfShowUpNextRowInView
                    ? "pointer-events-none translate-y-1 opacity-0 motion-reduce:translate-y-0"
                    : "translate-y-0 opacity-100"
                }`}
                style={{
                  bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
                  right: "max(1rem, env(safe-area-inset-right, 0px))",
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">Up Next</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                  {runOfShowUpNextCueDetail.title}
                </p>
                {runOfShowUpNextCueDetail.subline ? (
                  <p className="mt-1 line-clamp-1 text-xs font-medium leading-snug text-stone-500">
                    {runOfShowUpNextCueDetail.subline}
                  </p>
                ) : null}
              </button>
            ) : null}
          </div>
        )}

      {authStage === "app" && (persistPhase === "pending" || persistPhase === "saved") && (
        <div
          className="no-print pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 lg:hidden"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <span
            className="rounded-full border border-stone-200/90 bg-white/95 px-3 py-1.5 text-[11px] font-medium text-stone-800 shadow-sm backdrop-blur-sm"
            aria-live="polite"
          >
            {persistPhase === "pending" ? "Saving…" : "Saved just now"}
          </span>
        </div>
      )}

      {authStage === "app" && (
        <BottomNav
          items={currentNavItems.map((screen) => ({ screen, label: navLabel(screen) }))}
          activeScreen={shellNavActiveScreen}
          onSelect={setActiveScreen}
        />
      )}
    </div>
  );
}
