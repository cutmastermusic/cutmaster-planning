"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppHeader,
  BottomNav,
  InsightStack,
  PremiumCard,
  PrimaryButton,
  SectionTitle,
  SongCard,
  TextArea,
  TextInput,
} from "@/components/planning-ui";
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
  initialFormalities,
  initialGeneralDjNotes,
  initialGuestRequests,
  initialMcAnnouncements,
  initialMicrophoneNeeds,
  initialMustPlaySongs,
  initialOfficiantName,
  initialPlannerNotes,
  initialRecessionalSong,
  initialTemplates,
  initialTimelineItems,
  initialTeamMembers,
  initialVendors,
  initialUnityCeremonySong,
  initialWeddingPartyProcessional,
  progressCards,
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
  EventSettings,
  EventRecord,
  FormalityItem,
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
  VendorType,
  WeddingDetails,
  NotificationItem,
  MusicVibeDetail,
  PlaylistBucketId,
} from "@/types/planning";
import { PLAYLIST_BUCKET_IDS, PLAYLIST_BUCKET_LABELS } from "@/types/planning";
import { buildPlanningInsights, cloneJson } from "@/utils/planning";
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
          <p className="mt-2 text-xs text-zinc-500">{q.helpText}</p>
        ) : null}
      </PremiumCard>
    );
  }

  if (q.answerType === "yes_no") {
    return (
      <PremiumCard>
        <label className="text-[11px] uppercase tracking-wide text-zinc-400">
          {q.label}
          {labelSuffix}
        </label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100"
        >
          <option value="" className="bg-[#141419] text-zinc-100">
            Select…
          </option>
          <option value="Yes" className="bg-[#141419] text-zinc-100">
            Yes
          </option>
          <option value="No" className="bg-[#141419] text-zinc-100">
            No
          </option>
        </select>
        {(q.helpText ?? "").trim() ? (
          <p className="mt-2 text-xs text-zinc-500">{q.helpText}</p>
        ) : null}
      </PremiumCard>
    );
  }

  if (q.answerType === "multiple_choice") {
    return (
      <PremiumCard>
        <label className="text-[11px] uppercase tracking-wide text-zinc-400">
          {q.label}
          {labelSuffix}
        </label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100"
        >
          <option value="" className="bg-[#141419] text-zinc-100">
            Select…
          </option>
          {(q.options ?? []).map((option) => (
            <option key={`pq-option-${q.id}-${option}`} value={option} className="bg-[#141419] text-zinc-100">
              {option}
            </option>
          ))}
        </select>
        {(q.helpText ?? "").trim() ? (
          <p className="mt-2 text-xs text-zinc-500">{q.helpText}</p>
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
        <p className="mt-2 text-xs text-zinc-500">{q.helpText}</p>
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
  cocktailHour:
    "border-amber-400/25 bg-[radial-gradient(circle_at_0%_0%,rgba(251,191,36,0.09),transparent_50%)]",
  dinner:
    "border-rose-400/20 bg-[radial-gradient(circle_at_100%_0%,rgba(251,113,133,0.07),transparent_48%)]",
  openDancing:
    "border-violet-400/25 bg-[radial-gradient(circle_at_0%_100%,rgba(167,139,250,0.08),transparent_50%)]",
  afterparty:
    "border-fuchsia-400/20 bg-[radial-gradient(circle_at_100%_100%,rgba(232,121,249,0.07),transparent_48%)]",
  custom:
    "border-emerald-400/20 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.07),transparent_45%)]",
};

const VENDOR_TYPES: VendorType[] = [
  "Planner",
  "Photographer",
  "Videographer",
  "Venue",
  "Caterer",
  "Florist",
  "Hair/Makeup",
  "Photo Booth",
  "Officiant",
  "Band",
  "Content Creator",
  "Other",
];

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
  "Live Event Mode",
  "Team Management",
  "Branding / App",
] as const;

type GlobalSettingsSection = (typeof GLOBAL_SETTINGS_SECTIONS)[number];

const getDefaultTimelinePresetSets = (): Record<EventLayoutProfile, TimelinePresetItem[]> => ({
  Wedding: [
    { id: "w-cer-1", timelineType: "ceremony", timeOrOrder: "Prelude", momentName: "Prelude", songPlaceholder: "Instrumental Prelude", notesPlaceholder: "Guest arrival ambience.", defaultIncluded: true },
    { id: "w-cer-2", timelineType: "ceremony", timeOrOrder: "Processional", momentName: "Wedding Party Processional", songPlaceholder: "Processional Song", notesPlaceholder: "Cue wedding party entrance.", defaultIncluded: true },
    { id: "w-cer-3", timelineType: "ceremony", timeOrOrder: "Processional", momentName: "Partner/Couple Processional", songPlaceholder: "Partner Processional Song", notesPlaceholder: "Final processional cue.", defaultIncluded: true },
    { id: "w-main-1", timelineType: "main", timeOrOrder: "5:00 PM", momentName: "Cocktail Hour", songPlaceholder: "Cocktail Playlist", notesPlaceholder: "Soft open while guests mingle.", defaultIncluded: true },
    { id: "w-main-2", timelineType: "main", timeOrOrder: "6:15 PM", momentName: "Dinner", songPlaceholder: "Dinner Playlist", notesPlaceholder: "Lower volume for meal service.", defaultIncluded: true },
    { id: "w-main-3", timelineType: "main", timeOrOrder: "8:00 PM", momentName: "Open Dancing", songPlaceholder: "Dance Set", notesPlaceholder: "Energy ramp and transitions.", defaultIncluded: true },
  ],
  "Gender-Neutral Wedding": [
    { id: "gnw-cer-1", timelineType: "ceremony", timeOrOrder: "Prelude", momentName: "Prelude", songPlaceholder: "Instrumental Prelude", notesPlaceholder: "Guest arrival ambience.", defaultIncluded: true },
    { id: "gnw-cer-2", timelineType: "ceremony", timeOrOrder: "Processional", momentName: "Wedding Party Processional", songPlaceholder: "Processional Song", notesPlaceholder: "Cue wedding party entrance.", defaultIncluded: true },
    { id: "gnw-cer-3", timelineType: "ceremony", timeOrOrder: "Processional", momentName: "Partner/Couple Processional", songPlaceholder: "Partner Processional Song", notesPlaceholder: "Final processional cue.", defaultIncluded: true },
    { id: "gnw-main-1", timelineType: "main", timeOrOrder: "5:00 PM", momentName: "Cocktail Hour", songPlaceholder: "Cocktail Playlist", notesPlaceholder: "Soft open while guests mingle.", defaultIncluded: true },
    { id: "gnw-main-2", timelineType: "main", timeOrOrder: "6:15 PM", momentName: "Dinner", songPlaceholder: "Dinner Playlist", notesPlaceholder: "Lower volume for meal service.", defaultIncluded: true },
    { id: "gnw-main-3", timelineType: "main", timeOrOrder: "8:00 PM", momentName: "Open Dancing", songPlaceholder: "Dance Set", notesPlaceholder: "Energy ramp and transitions.", defaultIncluded: true },
  ],
  Corporate: [
    { id: "co-main-1", timelineType: "main", timeOrOrder: "6:00 PM", momentName: "Guest Arrival", songPlaceholder: "Background Set", notesPlaceholder: "Low-volume welcome music.", defaultIncluded: true },
    { id: "co-main-2", timelineType: "main", timeOrOrder: "6:30 PM", momentName: "Run of Show: Welcome Remarks", songPlaceholder: "Walk-up Stinger", notesPlaceholder: "MC/presenter intro.", defaultIncluded: true },
    { id: "co-main-3", timelineType: "main", timeOrOrder: "7:00 PM", momentName: "Program Segment", songPlaceholder: "Segment Bed", notesPlaceholder: "Cue transitions cleanly.", defaultIncluded: true },
  ],
  "Holiday Party": [
    { id: "hp-main-1", timelineType: "main", timeOrOrder: "6:30 PM", momentName: "Doors Open", songPlaceholder: "Holiday Welcome Set", notesPlaceholder: "Seasonal background music.", defaultIncluded: true },
    { id: "hp-main-2", timelineType: "main", timeOrOrder: "7:30 PM", momentName: "Announcements", songPlaceholder: "Announcement Bed", notesPlaceholder: "Housekeeping + acknowledgements.", defaultIncluded: true },
    { id: "hp-main-3", timelineType: "main", timeOrOrder: "8:30 PM", momentName: "Dance Floor Opens", songPlaceholder: "Party Set", notesPlaceholder: "Transition to dance energy.", defaultIncluded: true },
  ],
  "Graduation Celebration": [
    { id: "gc-main-1", timelineType: "main", timeOrOrder: "6:00 PM", momentName: "Guest Arrival", songPlaceholder: "Welcome Set", notesPlaceholder: "Family/friends arrival.", defaultIncluded: true },
    { id: "gc-main-2", timelineType: "main", timeOrOrder: "6:45 PM", momentName: "Family / Special Moments", songPlaceholder: "Special Moment Song", notesPlaceholder: "Graduate recognition cues.", defaultIncluded: true },
    { id: "gc-main-3", timelineType: "main", timeOrOrder: "8:00 PM", momentName: "Open Dancing", songPlaceholder: "Dance Set", notesPlaceholder: "Energy lift for celebration.", defaultIncluded: true },
  ],
  "Birthday Party": [
    { id: "bd-main-1", timelineType: "main", timeOrOrder: "6:00 PM", momentName: "Guest Arrival", songPlaceholder: "Welcome Playlist", notesPlaceholder: "Warm-up while guests arrive.", defaultIncluded: true },
    { id: "bd-main-2", timelineType: "main", timeOrOrder: "7:15 PM", momentName: "Special Moments", songPlaceholder: "Special Moment Song", notesPlaceholder: "Cake / toast / dedication cues.", defaultIncluded: true },
    { id: "bd-main-3", timelineType: "main", timeOrOrder: "7:45 PM", momentName: "Open Dancing", songPlaceholder: "Dance Set", notesPlaceholder: "Main dance-floor arc.", defaultIncluded: true },
  ],
  "Private Party": [
    { id: "pp-main-1", timelineType: "main", timeOrOrder: "6:00 PM", momentName: "Guest Arrival", songPlaceholder: "Welcome Playlist", notesPlaceholder: "Low-key opening.", defaultIncluded: true },
    { id: "pp-main-2", timelineType: "main", timeOrOrder: "7:00 PM", momentName: "Main Event Timeline", songPlaceholder: "Core Set", notesPlaceholder: "Flexible flow by host cues.", defaultIncluded: true },
    { id: "pp-main-3", timelineType: "main", timeOrOrder: "8:00 PM", momentName: "Open Dancing", songPlaceholder: "Dance Set", notesPlaceholder: "Raise energy.", defaultIncluded: true },
  ],
  "Bar/Club Event": [
    { id: "bc-main-1", timelineType: "main", timeOrOrder: "9:00 PM", momentName: "Set Time 1", songPlaceholder: "Opening Set", notesPlaceholder: "Start room-building set.", defaultIncluded: true },
    { id: "bc-main-2", timelineType: "main", timeOrOrder: "10:30 PM", momentName: "Set Time 2", songPlaceholder: "Peak Set", notesPlaceholder: "Main floor energy.", defaultIncluded: true },
    { id: "bc-main-3", timelineType: "main", timeOrOrder: "12:00 AM", momentName: "Set Time 3", songPlaceholder: "Late Set", notesPlaceholder: "Maintain momentum.", defaultIncluded: true },
  ],
  "School Dance": [
    { id: "sd-main-1", timelineType: "main", timeOrOrder: "7:00 PM", momentName: "Doors Open", songPlaceholder: "Clean Opening Set", notesPlaceholder: "Set expectations and tone.", defaultIncluded: true },
    { id: "sd-main-2", timelineType: "main", timeOrOrder: "7:30 PM", momentName: "Announcements", songPlaceholder: "Announcement Bed", notesPlaceholder: "Admin/chaperone lines.", defaultIncluded: true },
    { id: "sd-main-3", timelineType: "main", timeOrOrder: "8:00 PM", momentName: "Dance Set", songPlaceholder: "Clean Dance Set", notesPlaceholder: "School-appropriate energy ramp.", defaultIncluded: true },
  ],
});

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
      sectionFormalitiesEnabled: true,
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
    sectionFormalitiesEnabled: true,
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
    "Full planning suite with ceremony, reception, formalities, music, vendors, and Event Prep export",
  "Gender-Neutral Wedding":
    "Inclusive wedding profile with ceremony, reception, formalities, and full music planning",
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
  { key: "sectionFormalitiesEnabled", label: "Formalities" },
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
  Wedding: "Full wedding-day planning with ceremony cues, formalities, and vendor coordination.",
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
    labels.push(profile === "Corporate" ? "Run of Show" : "Timeline");
  }
  if (layoutDefaults.sectionFormalitiesEnabled) labels.push("Formal Dances / Special Moments");
  if (visibility.liveEventShowMcScript) {
    labels.push(profile === "Corporate" ? "Announcements / Script Notes" : "Announcements / MC Script");
  }
  if (visibility.liveEventShowVendorContacts) labels.push("Vendors");
  if (visibility.liveEventShowPlaylists) labels.push("Playlists");
  if (visibility.liveEventShowGuestRequests) labels.push("Guest Requests");
  if (visibility.liveEventShowDoNotPlay) labels.push("Do Not Play");
  if (visibility.liveEventShowMusicNotes) {
    labels.push(profile === "School Dance" ? "Clean Music Notes" : "Music Notes");
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
  sectionFormalitiesEnabled: boolean;
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
    s.sectionFormalitiesEnabled ||
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
    ...(s.sectionReceptionTimelineEnabled || s.sectionFormalitiesEnabled
      ? (["Timeline"] as Screen[])
      : []),
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
  const receptionHubEligible = s.sectionReceptionTimelineEnabled || s.sectionFormalitiesEnabled;
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
    sectionFormalitiesEnabled: evt.settings?.sectionFormalitiesEnabled ?? true,
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

const PERSPECTIVE_ROLES: UserRole[] = ["Couple", "Planner", "DJ", "Admin"];

export default function Home() {
  const timelineFormRef = useRef<HTMLDivElement | null>(null);
  const hasParsedInviteParams = useRef(false);
  const {
    activeScreen,
    setActiveScreen,
    hasHydrated,
    setHasHydrated,
    savedLocally,
    setSavedLocally,
    authStage,
    setAuthStage,
    currentRole,
    setCurrentRole,
    inviteAccessPreview,
    setInviteAccessPreview,
  } = usePlanningApp();
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
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(initialTimelineItems);
  const [ceremonyTimelineItems, setCeremonyTimelineItems] = useState<CeremonyTimelineItem[]>(
    initialCeremonyTimelineItems,
  );
  const [formalities, setFormalities] = useState<FormalityItem[]>(initialFormalities);
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineTime, setTimelineTime] = useState("");
  const [timelineCategory, setTimelineCategory] =
    useState<TimelineCategory>("Ceremony");
  const [timelineNotes, setTimelineNotes] = useState("");
  const [timelineNeedsAttention, setTimelineNeedsAttention] = useState(false);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [draggingTimelineId, setDraggingTimelineId] = useState<string | null>(null);
  const [dropTargetTimelineId, setDropTargetTimelineId] = useState<string | null>(null);
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
    sectionFormalitiesEnabled: true,
    sectionPlanningChecklistEnabled: true,
    sectionPlanningQuestionsEnabled: true,
    planningQuestionAnswers: {},
    checklistDueDates: {},
    checklistManualStatuses: {},
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

  // `weddingDetails` is derived from the active event (see event management state below).

  const [plannerNotes, setPlannerNotes] = useState<string[]>(initialPlannerNotes);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);

  const [appMode, setAppMode] = useState<AppMode>("events");
  const [activeEventId, setActiveEventId] = useState<string>("evt-1");

  const [events, setEvents] = useState<EventRecord[]>(() =>
    buildSeedEvents({
      timelineItems,
      ceremonyTimelineItems,
      formalities,
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
  const [ceremonyTimelineModalOpen, setCeremonyTimelineModalOpen] = useState(false);
  const [ceremonyTimelineEditingId, setCeremonyTimelineEditingId] = useState<string | null>(null);
  const [ceremonyTimelineDraftTimeOrOrder, setCeremonyTimelineDraftTimeOrOrder] = useState("");
  const [ceremonyTimelineDraftMoment, setCeremonyTimelineDraftMoment] = useState("");
  const [ceremonyTimelineDraftSongTitle, setCeremonyTimelineDraftSongTitle] = useState("");
  const [ceremonyTimelineDraftArtist, setCeremonyTimelineDraftArtist] = useState("");
  const [ceremonyTimelineDraftNotes, setCeremonyTimelineDraftNotes] = useState("");
  const [ceremonyTimelineDraftNeedsAttention, setCeremonyTimelineDraftNeedsAttention] = useState(false);
  const [draggingCeremonyTimelineId, setDraggingCeremonyTimelineId] = useState<string | null>(null);
  const [dropTargetCeremonyTimelineId, setDropTargetCeremonyTimelineId] = useState<string | null>(null);

  const commitActiveEventPlanningToEventsState = useCallback(() => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === activeEventId
          ? {
              ...evt,
              meta: {
                ...evt.meta,
                couple: eventSettings.coupleNames || evt.meta.couple,
                date: eventSettings.weddingDate || evt.meta.date,
                venue: eventSettings.venue || evt.meta.venue,
              },
              timelineItems,
              ceremonyTimelineItems,
              formalities,
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
    formalities,
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
    setTimelineItems(cloneJson(evt.timelineItems));
    setCeremonyTimelineItems(cloneJson(evt.ceremonyTimelineItems ?? []));
    setFormalities(cloneJson(evt.formalities));
    setMustPlaySongs(cloneJson(evt.mustPlaySongs));
    setDoNotPlaySongs(cloneJson(evt.doNotPlaySongs));
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
    setVendors(cloneJson(evt.vendors ?? []));
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
        sectionFormalitiesEnabled: evt.settings?.sectionFormalitiesEnabled ?? true,
        sectionPlanningChecklistEnabled: evt.settings?.sectionPlanningChecklistEnabled ?? true,
        sectionPlanningQuestionsEnabled: evt.settings?.sectionPlanningQuestionsEnabled ?? true,
        planningQuestionAnswers: evt.settings?.planningQuestionAnswers ?? {},
        checklistDueDates: evt.settings?.checklistDueDates ?? {},
        checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
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
    if (type === "song_added") return "🎵";
    if (type === "guest_request_submitted") return "📩";
    if (type === "guest_request_reviewed") return "✅";
    if (type === "ceremony_updated") return "💍";
    if (type === "formality_updated") return "💃";
    if (type === "collaborator_invited") return "👥";
    if (type === "team_member_added") return "🧑‍💼";
    if (type === "team_member_assigned") return "🎧";
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
    const templateTimeline = template ? cloneJson(template.timelineItems) : cloneJson(timelineItems);
    const templateFormalities = template ? cloneJson(template.formalities) : cloneJson(formalities);
    const templateSuggestions = template ? cloneJson(template.planningSuggestions) : cloneJson(plannerNotes);
    return {
      id: ids.eventId,
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
      formalities: templateFormalities,
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
        sectionFormalitiesEnabled: true,
        sectionPlanningChecklistEnabled: true,
        sectionPlanningQuestionsEnabled: true,
        planningQuestionAnswers: {},
        checklistDueDates: {},
        checklistManualStatuses: {},
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
        .map((item) => ({
          id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timeOrOrder: item.timeOrOrder,
          moment: item.momentName,
          songTitle: item.songPlaceholder,
          artist: "",
          notes: item.notesPlaceholder,
          needsDjMcAttention: false,
        }));
      newEvent.timelineItems = enabledPresets
        .filter((item) => item.timelineType === "main")
        .map((item) => ({
          id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: item.momentName,
          time: item.timeOrOrder,
          category: "Reception",
          notes: item.songPlaceholder
            ? `${item.notesPlaceholder}${item.notesPlaceholder ? " " : ""}Song: ${item.songPlaceholder}`.trim()
            : item.notesPlaceholder,
          needsDjMcAttention: false,
        }));
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
        formalities: cloneJson(formalities),
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
              formalities: cloneJson(formalities),
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
      .map((item) => ({
        id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timeOrOrder: item.timeOrOrder,
        moment: item.momentName,
        songTitle: item.songPlaceholder,
        artist: "",
        notes: item.notesPlaceholder,
        needsDjMcAttention: false,
      }));
    const mainItems: TimelineItem[] = enabledPresets
      .filter((item) => item.timelineType === "main")
      .map((item) => ({
        id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: item.momentName,
        time: item.timeOrOrder,
        category: "Reception",
        notes: item.songPlaceholder
          ? `${item.notesPlaceholder}${item.notesPlaceholder ? " " : ""}Song: ${item.songPlaceholder}`.trim()
          : item.notesPlaceholder,
        needsDjMcAttention: false,
      }));
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
        momentName: "New preset moment",
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

  const dashboardEyebrowText = useMemo(() => {
    const coupleView = (currentRole ?? rolePreview) === "Couple";
    if (coupleView) {
      if (layoutProfileForActiveEvent === "Wedding") return "Your wedding planning journey";
      if (layoutProfileForActiveEvent === "Gender-Neutral Wedding") return "Your wedding planning journey";
      return "Your event planning journey";
    }
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
  const canAddFormality = effectiveRole === "Admin" || effectiveRole === "DJ" || effectiveRole === "Planner";
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
  const sectionFormalitiesEnabled = eventSettings.sectionFormalitiesEnabled;
  const sectionPlanningChecklistEnabled = eventSettings.sectionPlanningChecklistEnabled;
  const sectionPlanningQuestionsEnabled = eventSettings.sectionPlanningQuestionsEnabled;
  /** Used for Reception Hub + distinct reception timeline / formalities routes (couple-friendly). */
  const receptionHubEligibleNav =
    sectionReceptionTimelineEnabled || sectionFormalitiesEnabled;
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
    formalities.find((f) => /first dance/i.test(f.momentName) && f.songTitle.trim()) &&
      formalities.find((f) => /father\/daughter/i.test(f.momentName) && f.songTitle.trim()) &&
      formalities.find((f) => /mother\/son/i.test(f.momentName) && f.songTitle.trim()),
  );
  const combinedTimelineTitles = [
    ...timelineItems.map((item) => item.title.toLowerCase()),
    ...formalities
      .filter((item) => item.includeInTimeline)
      .map((item) => item.momentName.toLowerCase()),
  ];
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
        title: "Add Formal Dance Songs",
        description: "Set first dance and parent dance songs.",
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
        linkedSection: (receptionHubEligibleNav &&
        (sectionReceptionTimelineEnabled || sectionFormalitiesEnabled)
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
      sectionFormalitiesEnabled,
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
  const eventDisplayName = eventSettings.eventName || weddingDetails.couple;
  const coupleDisplayName = eventSettings.coupleNames || weddingDetails.couple;
  const eventDateDisplay = eventSettings.weddingDate || weddingDetails.date || "TBD";
  const eventVenueDisplay = eventSettings.venue || weddingDetails.venue || "TBD";
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
            (sectionReceptionTimelineEnabled || sectionFormalitiesEnabled)
              ? "Reception Timeline"
              : "Timeline";
          setActiveScreen(timelineScreen);
          setTimelineTitle("");
          setTimelineTime("");
          setTimelineCategory("Ceremony");
          setTimelineNotes("");
          setTimelineNeedsAttention(false);
          setEditingTimelineId(null);
          window.setTimeout(() => {
            timelineFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 0);
        },
        priority:
          activeScreen === "Timeline" || activeScreen === "Reception Timeline" ? 100 : 39,
      },
      {
        id: "add-formality",
        label: "Add Formality",
        visible: appMode === "event" && canAddFormality && sectionFormalitiesEnabled,
        onClick: () => {
          const timelineScreen: Screen =
            isCoupleView && receptionHubEligibleNav ? "Reception Timeline" : "Timeline";
          setActiveScreen(timelineScreen);
          const newItem: FormalityItem = {
            id: `formality-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            momentName: "New special moment",
            time: "",
            songTitle: "",
            artist: "",
            notes: "",
            fadeOutEarly: false,
            fadeOutTimestamp: "",
            includeInTimeline: true,
            needsDjMcAttention: false,
          };
          setFormalities((prev) => [...prev, newItem]);
          logActivity("formality_updated", "Added formality");
          pushNotification("Timeline updated", "timeline_updated");
          window.setTimeout(() => {
            timelineFormRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          }, 0);
        },
        priority:
          activeScreen === "Timeline" || activeScreen === "Reception Timeline" ? 100 : 38,
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
    canAddFormality,
    canEditTimeline,
    isCoupleView,
    receptionHubEligibleNav,
    sectionFormalitiesEnabled,
    sectionReceptionTimelineEnabled,
    canInviteCollaborators,
    canManageEvents,
    canManageGuestRequests,
    canManageMusic,
    effectiveEventType,
    logActivity,
    pushNotification,
    setActiveScreen,
    setFormalities,
    timelineFormRef,
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
          evt.timelineItems.length === 0 && !evt.formalities.some((f) => f.includeInTimeline),
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
    const ok = typeof window === "undefined" ? true : window.confirm(`Delete team member "${target?.name || "this member"}"?`);
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
    if (teamEditingId === teamMemberId) {
      closeTeamMemberModal();
    }
  };

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
      sectionFormalitiesEnabled,
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
    sectionFormalitiesEnabled,
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

  const dashboardQuickScreens = useMemo((): Screen[] => {
    const includeExportScreens =
      sectionReceptionTimelineEnabled ||
      sectionCeremonyEnabled ||
      sectionFormalitiesEnabled ||
      sectionMustPlayEnabled ||
      sectionPlaylistsEnabled ||
      sectionDoNotPlayEnabled ||
      sectionGuestRequestsEnabled ||
      sectionVendorContactsEnabled ||
      sectionMcScriptEnabled ||
      sectionMusicNotesEnabled ||
      sectionPlanningChecklistEnabled ||
      sectionPlanningQuestionsEnabled;

    const base: Screen[] = [
      ...(sectionMustPlayEnabled || sectionDoNotPlayEnabled || sectionPlaylistsEnabled
        ? (["Music Hub"] as Screen[])
        : []),
      ...(sectionReceptionTimelineEnabled || sectionFormalitiesEnabled
        ? (["Timeline"] as Screen[])
        : []),
      ...(sectionCeremonyEnabled ? (["Ceremony"] as Screen[]) : []),
      ...(sectionGuestRequestsEnabled ? (["Guest Requests"] as Screen[]) : []),
      ...(sectionVendorContactsEnabled ? (["Vendors"] as Screen[]) : []),
      ...(sectionPlanningChecklistEnabled ? (["Planning Checklist"] as Screen[]) : []),
      ...(sectionPlanningQuestionsEnabled ? (["Planning Questions"] as Screen[]) : []),
      ...(includeExportScreens ? (["Event Prep"] as Screen[]) : []),
    ];
    const receptionHubEligibleQuick =
      sectionReceptionTimelineEnabled || sectionFormalitiesEnabled;
    if (effectiveRole !== "Couple" || !receptionHubEligibleQuick) return base;
    return base.map((s) => {
      if (s === "Timeline" && (sectionReceptionTimelineEnabled || sectionFormalitiesEnabled)) {
        return "Reception Timeline";
      }
      return s;
    });
  }, [
    effectiveRole,
    sectionCeremonyEnabled,
    sectionDoNotPlayEnabled,
    sectionFormalitiesEnabled,
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
    if (sectionReceptionTimelineEnabled || sectionFormalitiesEnabled) return "Timeline";
    return null;
  }, [
    receptionHubEligibleNav,
    sectionFormalitiesEnabled,
    sectionReceptionTimelineEnabled,
  ]);

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

    if (sectionReceptionTimelineEnabled && !hasKeyTimelineMoments) {
      return receptionHubEligibleNav ? "Reception Timeline" : "Timeline";
    }
    if (sectionFormalitiesEnabled && !hasKeyFormalDanceSongs) {
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
    sectionFormalitiesEnabled,
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
      if (receptionHubEligibleNav && sectionReceptionTimelineEnabled && sectionFormalitiesEnabled) {
        completion = Math.round(
          (hasKeyTimelineMoments ? 50 : 0) + (hasKeyFormalDanceSongs ? 50 : 0),
        );
      } else if (sectionReceptionTimelineEnabled) {
        completion = hasKeyTimelineMoments ? 100 : 42;
      } else if (sectionFormalitiesEnabled) {
        completion = hasKeyFormalDanceSongs ? 100 : 42;
      }
      const needsWork = completion < 100;
      cards.push({
        id: "reception",
        kicker: "Main event",
        title: receptionHubEligibleNav ? "Reception & main event" : "Reception / main event",
        description: receptionHubEligibleNav
          ? "Timeline and formalities in one guided workspace."
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

    return cards;
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
    sectionFormalitiesEnabled,
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
      if (sectionReceptionTimelineEnabled || sectionFormalitiesEnabled) {
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
    sectionFormalitiesEnabled,
  ]);

  const switchPerspectiveRole = useCallback(
    (nextRole: UserRole) => {
      commitActiveEventPlanningToEventsState();
      setCurrentRole(nextRole);
      setRolePreview(nextRole);

      const flags: EventNavSectionFlags = {
        sectionCeremonyEnabled,
        sectionReceptionTimelineEnabled,
        sectionFormalitiesEnabled,
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
      sectionFormalitiesEnabled,
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
    if (screen === "Reception Formalities") return "Special moments";
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
  const vendorsByType = useMemo(
    () =>
      VENDOR_TYPES.reduce<Record<VendorType, Vendor[]>>((acc, type) => {
        acc[type] = vendors.filter((vendor) => vendor.vendorType === type);
        return acc;
      }, {
        Planner: [],
        Photographer: [],
        Videographer: [],
        Venue: [],
        Caterer: [],
        Florist: [],
        "Hair/Makeup": [],
        "Photo Booth": [],
        Officiant: [],
        Band: [],
        "Content Creator": [],
        Other: [],
      }),
    [vendors],
  );

  const EVENTS_STORAGE_KEY = "cutmaster_planning_events_v1";
  const GLOBAL_SETTINGS_STORAGE_KEY = "cutmaster_planning_global_settings_v1";

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
          sectionFormalitiesEnabled: evt.settings?.sectionFormalitiesEnabled ?? true,
          sectionPlanningChecklistEnabled: evt.settings?.sectionPlanningChecklistEnabled ?? true,
          sectionPlanningQuestionsEnabled: evt.settings?.sectionPlanningQuestionsEnabled ?? true,
          planningQuestionAnswers: evt.settings?.planningQuestionAnswers ?? {},
          checklistDueDates: evt.settings?.checklistDueDates ?? {},
          checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
        },
      }));
      setEvents(loadedEvents);
      setAppMode(loadedEvents.length > 0 ? "event" : "events");
      if (Array.isArray(parsed.templates)) setTemplates(parsed.templates);
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
        parsed.activeEventId || (loadedEvents[0] ? loadedEvents[0].id : "");
      if (nextActiveId) setActiveEventId(nextActiveId);

      const active = nextActiveId
        ? loadedEvents.find((e) => e.id === nextActiveId) ?? loadedEvents[0]
        : undefined;

      if (active) {
        setTimelineItems(active.timelineItems);
        setCeremonyTimelineItems(active.ceremonyTimelineItems ?? []);
        setFormalities(active.formalities);
        setMustPlaySongs(active.mustPlaySongs);
        setDoNotPlaySongs(active.doNotPlaySongs);
        setCeremonyStartTime(active.ceremonyStartTime);
        setCeremonyGuestArrivalTime(active.ceremonyGuestArrivalTime ?? "");
        setOfficiantName(active.officiantName);
        setCeremonyNotes(active.ceremonyNotes);
        setMicrophoneNeeds(active.microphoneNeeds);
        setWeddingPartyProcessional(active.weddingPartyProcessional);
        setBrideGroomProcessional(active.brideGroomProcessional);
        setUnityCeremonySong(active.unityCeremonySong);
        setRecessionalSong(active.recessionalSong);
        setPlannerNotes(active.plannerNotes);
        setVendors(active.vendors ?? []);
        setGuestRequests(active.guestRequests);
        setGeneralDjNotes(active.generalDjNotes);
        setPlaylistVibeOverrides(cloneJson(active.playlistVibeOverrides ?? {}));
        setMusicVibeDetail(cloneJson(active.musicVibeDetail ?? {}));
        setMcAnnouncements(active.mcAnnouncements);
        setEventSettings({
          eventLayoutProfile: migrateLegacyLayoutProfile(
            active.settings?.eventLayoutProfile,
            active.settings?.eventType ?? "",
          ),
          eventName: active.settings?.eventName ?? active.meta.couple ?? "",
          coupleNames: active.settings?.coupleNames ?? active.meta.couple ?? "",
          eventType: migrateLegacyLayoutProfile(
            active.settings?.eventLayoutProfile ?? active.settings?.eventType,
            active.settings?.eventType ?? "",
          ),
          weddingDate: active.settings?.weddingDate ?? active.meta.date ?? "",
          venue: active.settings?.venue ?? active.meta.venue ?? "",
          ceremonyLocation: active.settings?.ceremonyLocation ?? "",
          receptionLocation: active.settings?.receptionLocation ?? "",
          eventStartTime: active.settings?.eventStartTime ?? "",
          eventEndTime: active.settings?.eventEndTime ?? "",
          assignedDj: active.settings?.assignedDj ?? "",
          plannerName: active.settings?.plannerName ?? "",
          plannerEmail: active.settings?.plannerEmail ?? "",
          packageName: active.settings?.packageName ?? "",
          internalNotes: active.settings?.internalNotes ?? "",
          clientFacingNotes: active.settings?.clientFacingNotes ?? "",
          prepSheetFooterOverride: active.settings?.prepSheetFooterOverride ?? "",
          guestRequestMessageOverride: active.settings?.guestRequestMessageOverride ?? "",
          coupleWelcomeMessageOverride: active.settings?.coupleWelcomeMessageOverride ?? "",
          liveEventShowMusicNotes: active.settings?.liveEventShowMusicNotes ?? true,
          liveEventShowDoNotPlay: active.settings?.liveEventShowDoNotPlay ?? true,
          liveEventShowVendorContacts: active.settings?.liveEventShowVendorContacts ?? true,
          liveEventShowMcScript: active.settings?.liveEventShowMcScript ?? true,
          liveEventShowPlaylists: active.settings?.liveEventShowPlaylists ?? true,
          liveEventShowPlanningQuestions: active.settings?.liveEventShowPlanningQuestions ?? true,
          liveEventShowGuestRequests:
            typeof active.settings?.liveEventShowGuestRequests === "boolean"
              ? active.settings.liveEventShowGuestRequests
              : getLiveEventDocumentDefaults(
                  (active.settings?.eventLayoutProfile as EventLayoutProfile) ?? "Wedding",
                ).liveEventShowGuestRequests,
          liveEventCompactMode: active.settings?.liveEventCompactMode ?? false,
          liveEventLargePrintMode: active.settings?.liveEventLargePrintMode ?? false,
          sectionCeremonyEnabled: active.settings?.sectionCeremonyEnabled ?? true,
          sectionReceptionTimelineEnabled: active.settings?.sectionReceptionTimelineEnabled ?? true,
          sectionPlaylistsEnabled: active.settings?.sectionPlaylistsEnabled ?? true,
          sectionMustPlayEnabled: active.settings?.sectionMustPlayEnabled ?? true,
          sectionDoNotPlayEnabled: active.settings?.sectionDoNotPlayEnabled ?? true,
          sectionMcScriptEnabled: active.settings?.sectionMcScriptEnabled ?? true,
          sectionVendorContactsEnabled: active.settings?.sectionVendorContactsEnabled ?? true,
          sectionMusicNotesEnabled: active.settings?.sectionMusicNotesEnabled ?? true,
          sectionGuestRequestsEnabled: active.settings?.sectionGuestRequestsEnabled ?? true,
          sectionFormalitiesEnabled: active.settings?.sectionFormalitiesEnabled ?? true,
          sectionPlanningChecklistEnabled: active.settings?.sectionPlanningChecklistEnabled ?? true,
          sectionPlanningQuestionsEnabled: active.settings?.sectionPlanningQuestionsEnabled ?? true,
          planningQuestionAnswers: active.settings?.planningQuestionAnswers ?? {},
          checklistDueDates: active.settings?.checklistDueDates ?? {},
          checklistManualStatuses: active.settings?.checklistManualStatuses ?? {},
        });
      } else {
        // If there is no saved event yet, keep the seeded working state.
      }

      setSavedLocally(false);
      window.setTimeout(() => setHasHydrated(true), 0);
    } catch {
      window.setTimeout(() => setHasHydrated(true), 0);
    }
  }, [
    setAppSettings,
    setHasHydrated,
    setSavedLocally,
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
            formalities,
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

    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(payload));
        setSavedLocally(true);
        window.setTimeout(() => setSavedLocally(false), 1400);
      } catch {
        // Ignore localStorage quota / private mode issues for prototype safety.
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
    formalities,
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
    setSavedLocally,
  ]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (typeof window === "undefined") return;

    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          GLOBAL_SETTINGS_STORAGE_KEY,
          JSON.stringify(appSettings),
        );
      } catch {
        // ignore local storage failures in prototype mode
      }
    }, 250);

    return () => window.clearTimeout(t);
  }, [appSettings, hasHydrated]);

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
              formalities,
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
      formalities,
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
        sectionFormalitiesEnabled: evt.settings?.sectionFormalitiesEnabled ?? true,
        sectionPlanningChecklistEnabled: evt.settings?.sectionPlanningChecklistEnabled ?? true,
        sectionPlanningQuestionsEnabled: evt.settings?.sectionPlanningQuestionsEnabled ?? true,
        planningQuestionAnswers: evt.settings?.planningQuestionAnswers ?? {},
        checklistDueDates: evt.settings?.checklistDueDates ?? {},
        checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
      },
    }));
    if (normalizedEvents.length === 0) {
      setBackupStatus({ kind: "error", message: "Backup has no events to restore." });
      return;
    }
    const nextActiveId = normalizedEvents.some((evt) => evt.id === payload.activeEventId)
      ? payload.activeEventId
      : normalizedEvents[0].id;
    const nextActiveEvent = normalizedEvents.find((evt) => evt.id === nextActiveId) ?? normalizedEvents[0];

    setEvents(normalizedEvents);
    setActiveEventId(nextActiveId);
    loadEventPlanningIntoWorkingState(nextActiveEvent);
    setTemplates(Array.isArray(payload.templates) ? payload.templates : []);
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
    if (role === "Admin") return "bg-[#c9a35c]/25 text-[#f5e6c8]";
    if (role === "DJ") return "bg-violet-500/20 text-violet-200";
    if (role === "Planner") return "bg-sky-500/20 text-sky-200";
    return "bg-emerald-500/20 text-emerald-200";
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
    if (status === "Pending") return "bg-amber-400/15 text-amber-100";
    if (status === "Approved") return "bg-emerald-500/20 text-emerald-100";
    return "bg-[#6f5353]/45 text-[#f2dede]";
  };

  const resetTimelineForm = () => {
    setTimelineTitle("");
    setTimelineTime("");
    setTimelineCategory("Ceremony");
    setTimelineNotes("");
    setTimelineNeedsAttention(false);
    setEditingTimelineId(null);
  };

  const addOrUpdateTimelineItem = () => {
    const cleanTitle = timelineTitle.trim();
    const cleanTime = timelineTime.trim();
    if (!cleanTitle || !cleanTime) return;

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
                needsDjMcAttention: timelineNeedsAttention,
              }
            : item,
        ),
      );
      logActivity("timeline_updated", `Updated timeline item: ${cleanTitle}`);
      pushNotification("Timeline updated", "timeline_updated");
      resetTimelineForm();
      return;
    }

    const newItem: TimelineItem = {
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: cleanTitle,
      time: cleanTime,
      category: timelineCategory,
      notes: timelineNotes.trim(),
      needsDjMcAttention: timelineNeedsAttention,
    };

    setTimelineItems((prev) => [...prev, newItem]);
    logActivity("timeline_updated", `Added timeline item: ${cleanTitle}`);
    pushNotification("Timeline updated", "timeline_updated");
    resetTimelineForm();
  };

  const editTimelineItem = (item: TimelineItem) => {
    setTimelineTitle(item.title);
    setTimelineTime(item.time);
    setTimelineCategory(item.category);
    setTimelineNotes(item.notes);
    setTimelineNeedsAttention(item.needsDjMcAttention);
    setEditingTimelineId(item.id);
    timelineFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteTimelineItem = (itemId: string) => {
    setTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    if (editingTimelineId === itemId) {
      resetTimelineForm();
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

  const duplicateTimelineItem = (item: TimelineItem) => {
    const duplicate: TimelineItem = {
      ...item,
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${item.title} (Copy)`,
    };
    setTimelineItems((prev) => [...prev, duplicate]);
    logActivity("timeline_updated", `Duplicated timeline item: ${item.title}`);
    pushNotification("Timeline updated", "timeline_updated");
  };

  const duplicateFormality = (item: FormalityItem) => {
    const duplicate: FormalityItem = {
      ...item,
      id: `formality-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      momentName: `${item.momentName} (Copy)`,
    };
    setFormalities((prev) => [...prev, duplicate]);
    logActivity("formality_updated", `Duplicated formality: ${item.momentName}`);
    pushNotification("Timeline updated", "timeline_updated");
  };

  const deleteFormality = (formalityId: string) => {
    setFormalities((prev) => prev.filter((f) => f.id !== formalityId));
    logActivity("formality_updated", "Removed formality");
    pushNotification("Timeline updated", "timeline_updated");
  };

  const moveFormalityAmongIncluded = (formalityId: string, direction: "up" | "down") => {
    setFormalities((prev) => {
      const includedOrder = prev.filter((f) => f.includeInTimeline);
      const idxInIncluded = includedOrder.findIndex((f) => f.id === formalityId);
      if (idxInIncluded === -1) return prev;
      const swapIdxInIncluded = direction === "up" ? idxInIncluded - 1 : idxInIncluded + 1;
      if (swapIdxInIncluded < 0 || swapIdxInIncluded >= includedOrder.length) return prev;
      const idA = formalityId;
      const idB = includedOrder[swapIdxInIncluded].id;
      const fullIdxA = prev.findIndex((f) => f.id === idA);
      const fullIdxB = prev.findIndex((f) => f.id === idB);
      if (fullIdxA === -1 || fullIdxB === -1) return prev;
      const next = [...prev];
      [next[fullIdxA], next[fullIdxB]] = [next[fullIdxB], next[fullIdxA]];
      return next;
    });
    logActivity("timeline_updated", "Reordered formalities");
    pushNotification("Timeline updated", "timeline_updated");
  };

  const addReceptionPreset = (preset: TimelinePresetItem) => {
    const newItem: TimelineItem = {
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: preset.momentName,
      time: preset.timeOrOrder,
      category: "Reception",
      notes: preset.songPlaceholder
        ? `${preset.notesPlaceholder}${preset.notesPlaceholder ? " " : ""}Song: ${preset.songPlaceholder}`.trim()
        : preset.notesPlaceholder,
      needsDjMcAttention: false,
    };
    setTimelineItems((prev) => [...prev, newItem]);
    logActivity("timeline_updated", `Added preset: ${preset.momentName}`);
    pushNotification("Timeline updated", "timeline_updated");
  };

  const addCeremonyPreset = (preset: TimelinePresetItem) => {
    const newItem: CeremonyTimelineItem = {
      id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timeOrOrder: preset.timeOrOrder,
      moment: preset.momentName,
      songTitle: preset.songPlaceholder,
      artist: "",
      notes: preset.notesPlaceholder,
      needsDjMcAttention: false,
    };
    setCeremonyTimelineItems((prev) => [...prev, newItem]);
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

  const resetCeremonyTimelineDraft = () => {
    setCeremonyTimelineEditingId(null);
    setCeremonyTimelineDraftTimeOrOrder("");
    setCeremonyTimelineDraftMoment("");
    setCeremonyTimelineDraftSongTitle("");
    setCeremonyTimelineDraftArtist("");
    setCeremonyTimelineDraftNotes("");
    setCeremonyTimelineDraftNeedsAttention(false);
  };

  const openCreateCeremonyTimelineModal = () => {
    resetCeremonyTimelineDraft();
    setCeremonyTimelineModalOpen(true);
  };

  const openEditCeremonyTimelineModal = (item: CeremonyTimelineItem) => {
    setCeremonyTimelineEditingId(item.id);
    setCeremonyTimelineDraftTimeOrOrder(item.timeOrOrder);
    setCeremonyTimelineDraftMoment(item.moment);
    setCeremonyTimelineDraftSongTitle(item.songTitle);
    setCeremonyTimelineDraftArtist(item.artist);
    setCeremonyTimelineDraftNotes(item.notes);
    setCeremonyTimelineDraftNeedsAttention(item.needsDjMcAttention);
    setCeremonyTimelineModalOpen(true);
  };

  const saveCeremonyTimelineItem = () => {
    const cleanMoment = ceremonyTimelineDraftMoment.trim();
    if (!cleanMoment) return;

    if (ceremonyTimelineEditingId) {
      setCeremonyTimelineItems((prev) =>
        prev.map((item) =>
          item.id === ceremonyTimelineEditingId
            ? {
                ...item,
                timeOrOrder: ceremonyTimelineDraftTimeOrOrder.trim(),
                moment: cleanMoment,
                songTitle: ceremonyTimelineDraftSongTitle.trim(),
                artist: ceremonyTimelineDraftArtist.trim(),
                notes: ceremonyTimelineDraftNotes.trim(),
                needsDjMcAttention: ceremonyTimelineDraftNeedsAttention,
              }
            : item,
        ),
      );
      logActivity("ceremony_updated", `Updated ceremony moment: ${cleanMoment}`);
      pushNotification("Ceremony timeline updated", "ceremony_updated");
    } else {
      setCeremonyTimelineItems((prev) => [
        ...prev,
        {
          id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timeOrOrder: ceremonyTimelineDraftTimeOrOrder.trim(),
          moment: cleanMoment,
          songTitle: ceremonyTimelineDraftSongTitle.trim(),
          artist: ceremonyTimelineDraftArtist.trim(),
          notes: ceremonyTimelineDraftNotes.trim(),
          needsDjMcAttention: ceremonyTimelineDraftNeedsAttention,
        },
      ]);
      logActivity("ceremony_updated", `Added ceremony moment: ${cleanMoment}`);
      pushNotification("Ceremony timeline updated", "ceremony_updated");
    }

    setCeremonyTimelineModalOpen(false);
    resetCeremonyTimelineDraft();
  };

  const deleteCeremonyTimelineItem = (itemId: string) => {
    setCeremonyTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    logActivity("ceremony_updated", "Removed ceremony moment");
    pushNotification("Ceremony timeline updated", "ceremony_updated");
  };

  const duplicateCeremonyTimelineItem = (item: CeremonyTimelineItem) => {
    const duplicate: CeremonyTimelineItem = {
      ...item,
      id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      moment: `${item.moment} (Copy)`,
    };
    setCeremonyTimelineItems((prev) => [...prev, duplicate]);
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

  const updateFormality = (
    formalityId: string,
    updates: Partial<FormalityItem>,
  ) => {
    const name =
      formalities.find((item) => item.id === formalityId)?.momentName || "Formality";
    if (
      updates.songTitle !== undefined ||
      updates.time !== undefined ||
      updates.includeInTimeline !== undefined
    ) {
      logActivity("formality_updated", `Updated ${name}`);
    }
    setFormalities((prev) =>
      prev.map((item) => (item.id === formalityId ? { ...item, ...updates } : item)),
    );
  };

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

  const includedFormalityNames = useMemo(
    () =>
      new Set(
        (sectionFormalitiesEnabled ? formalities : [])
          .filter((item) => item.includeInTimeline)
          .map((item) => item.momentName.trim().toLowerCase()),
      ),
    [formalities, sectionFormalitiesEnabled],
  );

  const mergedTimelineItems: DisplayTimelineItem[] = useMemo(
    () => [
      ...timelineItems
        .filter((item) => !includedFormalityNames.has(item.title.trim().toLowerCase()))
        .map((item) => ({
          id: item.id,
          source: "timeline" as const,
          time: item.time,
          title: item.title,
          category: item.category,
          notes: item.notes,
          needsDjMcAttention: item.needsDjMcAttention,
        })),
      ...(sectionFormalitiesEnabled ? formalities : [])
        .filter((item) => item.includeInTimeline)
        .map((item) => ({
          id: item.id,
          source: "formality" as const,
          time: item.time,
          title: item.momentName,
          category: "Formality" as const,
          notes: item.notes,
          needsDjMcAttention: item.needsDjMcAttention,
        })),
    ],
    [formalities, includedFormalityNames, sectionFormalitiesEnabled, timelineItems],
  );

  const ceremonyTimelineRows = useMemo(() => {
    return ceremonyTimelineItems.map((item) => ({
      order: item.timeOrOrder || "TBD",
      moment: item.moment || "Untitled Moment",
      song: item.songTitle
        ? `${item.songTitle}${item.artist ? ` - ${item.artist}` : ""}`
        : "-",
      notes: [
        item.notes || "",
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
        formalities,
        mustPlaySongs,
        doNotPlaySongs,
        weddingPartyProcessional,
        brideGroomProcessional,
        microphoneNeeds,
        guestRequests,
      ),
    [
      mergedTimelineItems,
      formalities,
      mustPlaySongs,
      doNotPlaySongs,
      weddingPartyProcessional,
      brideGroomProcessional,
      microphoneNeeds,
      guestRequests,
    ],
  );

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
      `${appSettings.appName.toUpperCase()} - EVENT PREP`,
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
        ...ceremonyTimelineItems.map(
          (item) =>
            `- ${item.timeOrOrder || "TBD"} | ${item.moment || "Untitled"} | ${item.songTitle || "Song TBD"}${item.artist ? ` - ${item.artist}` : ""}${item.needsDjMcAttention ? " | DJ/MC ATTENTION" : ""}${item.notes ? ` | ${item.notes}` : ""}`,
        ),
        `- General Ceremony Notes: ${ceremonyNotes || "None"}`,
        "",
      );
    }

    if (sectionReceptionTimelineEnabled) {
      lines.push(
        receptionPlainHeading,
        ...mergedTimelineItems.map(
          (item) =>
            `- ${item.time || "TBD"} | ${item.title} [${item.category}]${item.needsDjMcAttention ? " (DJ/MC ATTENTION)" : ""}${item.notes ? ` - ${item.notes}` : ""}`,
        ),
        "",
      );
    }

    if (sectionFormalitiesEnabled) {
      lines.push(
        "FORMAL DANCES / FORMALITIES",
        ...formalities.map(
          (item) =>
            `- ${item.time || "TBD"} | ${item.momentName || "Untitled"} | ${item.songTitle || "Song TBD"}${item.artist ? ` - ${item.artist}` : ""}${item.fadeOutEarly ? ` | Fade at ${item.fadeOutTimestamp || "TBD"}` : ""}${item.includeInTimeline ? " | In Timeline" : ""}${item.needsDjMcAttention ? " | DJ/MC ATTENTION" : ""}${item.notes ? ` | ${item.notes}` : ""}`,
        ),
        "",
      );
    }

    if (sectionMustPlayEnabled) {
      lines.push(
        "MUST PLAY SONGS",
        ...mustPlaySongs.map(
          (song) =>
            `- ${song.title}${song.artist ? ` - ${song.artist}` : ""}${song.highPriority ? " (PRIORITY)" : ""}${song.notes ? ` | ${song.notes}` : ""}`,
        ),
        "",
      );
    }

    if (showMc) {
      lines.push("MC SCRIPTS / ANNOUNCEMENTS", mcAnnouncements || "None", "");
    }

    if (showVendors) {
      lines.push(
        "VENDOR CONTACTS",
        ...vendors.map(
          (vendor) =>
            `- ${vendor.vendorType}: ${vendor.companyName} | ${vendor.contactName || "No Contact"}${vendor.phone ? ` | ${vendor.phone}` : ""}${vendor.email ? ` | ${vendor.email}` : ""}${vendor.arrivalTime ? ` | Arrival ${vendor.arrivalTime}` : ""}`,
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

    if (showPlanningQs) {
      lines.push(
        "",
        ...formatPlanningQuestionsPlainTextLines(
          liveEventPlanningQuestions,
          eventSettings.planningQuestionAnswers,
        ),
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
      "PREP FOOTER",
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
    formalities,
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
    sectionFormalitiesEnabled,
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(201,163,92,0.12),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#090909_0%,#101012_55%,#0b0b0c_100%)] text-zinc-100">
        <main className="mx-auto w-full max-w-md px-4 pb-32 pt-5">
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
            savedLocally={false}
            appSettings={{
              ...appSettings,
              coupleWelcomeMessage: effectiveCoupleWelcomeMessage,
              logoUrl: appSettings.logoUrl.startsWith("/") ? appSettings.logoUrl : "/cmm-logo-white.png",
            }}
          />
          <section className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PremiumCard key={`skeleton-${index}`} className="animate-pulse">
                <div className="h-4 w-1/2 rounded bg-white/10" />
                <div className="mt-3 h-3 w-full rounded bg-white/5" />
                <div className="mt-2 h-3 w-4/5 rounded bg-white/5" />
                <div className="mt-4 h-10 w-full rounded-xl bg-white/10" />
              </PremiumCard>
            ))}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(201,163,92,0.12),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#090909_0%,#101012_55%,#0b0b0c_100%)] text-zinc-100">
      {showDesktopSidebar && (
        <aside className="no-print fixed left-5 top-5 z-30 hidden h-[calc(100vh-2.5rem)] w-60 overflow-y-auto rounded-3xl border border-white/10 bg-[#111115]/88 p-4 backdrop-blur-md lg:block">
          <p className="px-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            {appMode === "events" ? "Workspace Mode" : "Event Mode"}
          </p>
          <div className="mt-3 space-y-2">
            {currentNavItems.map((item) => (
              <PrimaryButton
                key={`desktop-nav-${item}`}
                onClick={() => setActiveScreen(item)}
                className={`w-full justify-start rounded-xl border px-3 text-left ${
                  shellNavActiveScreen === item
                    ? "border-[#c9a35c]/35 bg-[#c9a35c]/20 text-[#f5e6c8]"
                    : "border-transparent bg-white/5 text-zinc-300 hover:border-white/10 hover:bg-white/10"
                }`}
              >
                {navLabel(item)}
              </PrimaryButton>
            ))}
          </div>
        </aside>
      )}
      <main
        className={`mx-auto w-full px-4 pb-32 pt-5 transition-all lg:pb-10 ${
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
          savedLocally={savedLocally}
          appSettings={{
            ...appSettings,
            coupleWelcomeMessage: effectiveCoupleWelcomeMessage,
            logoUrl: appSettings.logoUrl.startsWith("/") ? appSettings.logoUrl : "/cmm-logo-white.png",
          }}
        />

        {authStage === "app" &&
          appMode === "event" &&
          (currentRole ?? rolePreview) === "Couple" &&
          activeScreen !== "Dashboard" && (
            <div className="no-print mt-4">
              <PrimaryButton
                type="button"
                onClick={() => setActiveScreen("Dashboard")}
                className="w-full justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-[#f5e6c8] transition hover:border-[#c9a35c]/35 hover:bg-white/10 sm:inline-flex sm:w-auto"
              >
                ← Back to your event
              </PrimaryButton>
            </div>
          )}

        {authStage === "app" && (
          <div className="no-print mt-4 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-400">
                Viewing as{" "}
                <span className="font-semibold text-[#f5e6c8]">
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
                        ? "border border-[#c9a35c]/40 bg-[#c9a35c]/25 text-[#f5e6c8]"
                        : "border border-transparent bg-white/10 text-zinc-200 hover:bg-white/15"
                    }`}
                  >
                    {perspectiveRoleLabel(role)}
                  </PrimaryButton>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PrimaryButton
                onClick={() => setActiveScreen("Notification Center")}
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15"
              >
                Notifications
                {unreadBadgeCount > 0 && (
                  <span className="ml-1 rounded-full bg-[#c9a35c]/30 px-1.5 py-0.5 text-[10px] text-[#f5e6c8]">
                    {unreadBadgeCount}
                  </span>
                )}
              </PrimaryButton>
              <PrimaryButton
                onClick={() => setAuthStage("login")}
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15"
              >
                Sign out
              </PrimaryButton>
            </div>
          </div>
        )}

        {authStage === "login" && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/25 bg-gradient-to-b from-[#1a1a20] to-[#121218]">
              <SectionTitle className="text-[#e9d5a8]">Welcome to {appSettings.appName}</SectionTitle>
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
                          (targetEvt.settings?.sectionFormalitiesEnabled ?? true);

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
                              (targetEvt.settings?.sectionFormalitiesEnabled ?? true))
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
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
                  >
                    Continue as {perspectiveRoleLabel(role)}
                  </PrimaryButton>
                ))}
              </div>
              {inviteAccessPreview && (
                <PrimaryButton
                  onClick={() => setAuthStage("invite")}
                  className="mt-4 w-full rounded-xl bg-[#c9a35c]/20 px-3 py-2.5 text-xs font-semibold text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                >
                  Open Magic Invite Link
                </PrimaryButton>
              )}
            </PremiumCard>
          </section>
        )}

        {authStage === "invite" && inviteAccessPreview && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/30 bg-gradient-to-b from-[#1d1a14] to-[#141419]">
              <SectionTitle className="text-[#f5e6c8]">
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
                  className="w-full rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2.5 text-xs font-semibold text-white hover:brightness-110"
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
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">Global Settings are admin-only.</p>
              </PremiumCard>
            )}
            <PremiumCard>
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-[#e9d5a8]">Global Admin Settings</SectionTitle>
                <PrimaryButton
                  onClick={() => setActiveScreen("All Events")}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs text-zinc-200 hover:bg-white/15"
                >
                  Back to Events
                </PrimaryButton>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Global settings apply across all events and are stored outside event records.
              </p>

              <div className="mt-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-4">
                <aside className="hidden md:block">
                  <div className="sticky top-4 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                    <p className="px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      Settings Sections
                    </p>
                    <div className="mt-1 space-y-1">
                      {GLOBAL_SETTINGS_SECTIONS.map((section) => (
                        <PrimaryButton
                          key={`settings-side-${section}`}
                          onClick={() => setActiveGlobalSettingsSection(section)}
                          className={`w-full justify-start rounded-lg px-2.5 py-2 text-left text-[11px] ${
                            activeGlobalSettingsSection === section
                              ? "bg-[#c9a35c]/25 text-[#f5e6c8]"
                              : "bg-white/5 text-zinc-300 hover:bg-white/10"
                          }`}
                        >
                          {section}
                        </PrimaryButton>
                      ))}
                    </div>
                  </div>
                </aside>

                <div>
                  <div className="sticky top-0 z-10 -mx-2 overflow-x-auto border-y border-white/10 bg-[#141419]/95 px-2 py-2 backdrop-blur md:hidden">
                    <div className="flex gap-2">
                      {GLOBAL_SETTINGS_SECTIONS.map((section) => (
                        <PrimaryButton
                          key={`settings-tab-${section}`}
                          onClick={() => setActiveGlobalSettingsSection(section)}
                          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] ${
                            activeGlobalSettingsSection === section
                              ? "bg-[#c9a35c]/25 text-[#f5e6c8]"
                              : "bg-white/10 text-zinc-300 hover:bg-white/15"
                          }`}
                        >
                          {section}
                        </PrimaryButton>
                      ))}
                    </div>
                  </div>

              {activeGlobalSettingsSection === "Event Types" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-[#e9d5a8]">Event Types</SectionTitle>
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
                        <div key={`etype-${profile}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm font-semibold text-zinc-100">{profile}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {LAYOUT_PROFILE_DESCRIPTIONS[profile]}
                          </p>
                          <p className="mt-2 text-[11px] text-zinc-400">
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
                  <SectionTitle className="text-[#e9d5a8]">Planning Question Sets</SectionTitle>
                  <p className="text-xs text-zinc-400">
                    Customize planning questions by Event Type. Existing event answers remain saved even if questions are hidden or removed.
                  </p>
                  {EVENT_TYPES.map((profile) => {
                    const questions = planningQuestionSetsForSettings[profile] ?? [];
                    return (
                      <div key={`pqset-${profile}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-100">{profile}</p>
                          <div className="flex gap-2">
                            <PrimaryButton
                              onClick={() => addPlanningQuestionToSet(profile)}
                              disabled={!canManageEvents}
                              className="rounded-lg bg-[#c9a35c]/20 px-2 py-1.5 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30 disabled:opacity-50"
                            >
                              Add Question
                            </PrimaryButton>
                            <PrimaryButton
                              onClick={() => resetPlanningQuestionSet(profile)}
                              disabled={!canManageEvents}
                              className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-white/15 disabled:opacity-50"
                            >
                              Reset Defaults
                            </PrimaryButton>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Default set: {getPlanningQuestionsForProfile(profile).length} questions · Current set: {questions.length}
                        </p>
                        <div className="mt-3 space-y-2">
                          {questions.map((question, index) => (
                            <div key={`pq-row-${profile}-${question.id}`} className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
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
                                  <label className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">Answer Type</label>
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
                                    className="mt-1 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm text-zinc-100"
                                  >
                                    {QUESTION_ANSWER_TYPES.map((type) => (
                                      <option key={`pq-type-${type.value}`} value={type.value} className="bg-[#141419]">
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
                                  className={`rounded-lg px-2 py-1.5 text-[11px] ${question.required ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"} disabled:opacity-50`}
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
                                  className={`rounded-lg px-2 py-1.5 text-[11px] ${question.showInLiveEventMode ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"} disabled:opacity-50`}
                                >
                                  {question.showInLiveEventMode ? "Shown in Event Prep" : "Hidden in Event Prep"}
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
                                  className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-300 disabled:opacity-40"
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
                                  className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-300 disabled:opacity-40"
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
                                  className="rounded-lg bg-rose-500/20 px-2 py-1.5 text-[11px] text-rose-100 disabled:opacity-50"
                                >
                                  Delete
                                </PrimaryButton>
                              </div>
                            </div>
                          ))}
                          {questions.length === 0 && (
                            <p className="text-xs text-zinc-500">No questions configured. Add your first question for this Event Type.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeGlobalSettingsSection === "Timeline Presets" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-[#e9d5a8]">Timeline Presets</SectionTitle>
                  <p className="text-xs text-zinc-400">
                    Customize default ceremony and main-event timeline moments by Event Type. New events use these presets.
                  </p>
                  {EVENT_TYPES.map((profile) => {
                    const presets = timelinePresetSetsForSettings[profile] ?? [];
                    const defaultCount = (getDefaultTimelinePresetSets()[profile] ?? []).length;
                    return (
                      <div key={`tpset-${profile}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-100">{profile}</p>
                          <div className="flex gap-2">
                            <PrimaryButton
                              onClick={() => addTimelinePresetToSet(profile)}
                              disabled={!canManageEvents}
                              className="rounded-lg bg-[#c9a35c]/20 px-2 py-1.5 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30 disabled:opacity-50"
                            >
                              Add Preset
                            </PrimaryButton>
                            <PrimaryButton
                              onClick={() => resetTimelinePresetSet(profile)}
                              disabled={!canManageEvents}
                              className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-white/15 disabled:opacity-50"
                            >
                              Reset Defaults
                            </PrimaryButton>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Default set: {defaultCount} moments · Current set: {presets.length}
                        </p>
                        <div className="mt-3 space-y-2">
                          {presets.map((preset, index) => (
                            <div key={`tp-row-${profile}-${preset.id}`} className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div>
                                  <label className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">Timeline Type</label>
                                  <select
                                    value={preset.timelineType}
                                    onChange={(event) =>
                                      updateTimelinePresetSet(profile, (items) =>
                                        items.map((item) =>
                                          item.id === preset.id
                                            ? { ...item, timelineType: event.target.value as "ceremony" | "main" }
                                            : item,
                                        ),
                                      )
                                    }
                                    disabled={!canManageEvents}
                                    className="mt-1 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm text-zinc-100"
                                  >
                                    <option value="ceremony" className="bg-[#141419]">Ceremony</option>
                                    <option value="main" className="bg-[#141419]">Main Event</option>
                                  </select>
                                </div>
                                <TextInput
                                  id={`tp-time-${profile}-${preset.id}`}
                                  label="Time / Order Label"
                                  value={preset.timeOrOrder}
                                  onChange={(value) =>
                                    updateTimelinePresetSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === preset.id ? { ...item, timeOrOrder: value } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                                <TextInput
                                  id={`tp-moment-${profile}-${preset.id}`}
                                  label="Moment Name"
                                  value={preset.momentName}
                                  onChange={(value) =>
                                    updateTimelinePresetSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === preset.id ? { ...item, momentName: value } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                                <TextInput
                                  id={`tp-song-${profile}-${preset.id}`}
                                  label="Song Placeholder"
                                  value={preset.songPlaceholder}
                                  onChange={(value) =>
                                    updateTimelinePresetSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === preset.id ? { ...item, songPlaceholder: value } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                                <TextInput
                                  id={`tp-notes-${profile}-${preset.id}`}
                                  label="Notes Placeholder"
                                  value={preset.notesPlaceholder}
                                  onChange={(value) =>
                                    updateTimelinePresetSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === preset.id ? { ...item, notesPlaceholder: value } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <PrimaryButton
                                  onClick={() =>
                                    updateTimelinePresetSet(profile, (items) =>
                                      items.map((item) =>
                                        item.id === preset.id ? { ...item, defaultIncluded: !item.defaultIncluded } : item,
                                      ),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                  className={`rounded-lg px-2 py-1.5 text-[11px] ${preset.defaultIncluded ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"} disabled:opacity-50`}
                                >
                                  {preset.defaultIncluded ? "Included by Default" : "Excluded by Default"}
                                </PrimaryButton>
                                <PrimaryButton
                                  onClick={() =>
                                    updateTimelinePresetSet(profile, (items) => {
                                      if (index === 0) return items;
                                      const next = [...items];
                                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                      return next;
                                    })
                                  }
                                  disabled={!canManageEvents || index === 0}
                                  className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-300 disabled:opacity-40"
                                >
                                  Move Up
                                </PrimaryButton>
                                <PrimaryButton
                                  onClick={() =>
                                    updateTimelinePresetSet(profile, (items) => {
                                      if (index >= items.length - 1) return items;
                                      const next = [...items];
                                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                      return next;
                                    })
                                  }
                                  disabled={!canManageEvents || index >= presets.length - 1}
                                  className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-300 disabled:opacity-40"
                                >
                                  Move Down
                                </PrimaryButton>
                                <PrimaryButton
                                  onClick={() =>
                                    updateTimelinePresetSet(profile, (items) =>
                                      items.filter((item) => item.id !== preset.id),
                                    )
                                  }
                                  disabled={!canManageEvents}
                                  className="rounded-lg bg-rose-500/20 px-2 py-1.5 text-[11px] text-rose-100 disabled:opacity-50"
                                >
                                  Delete
                                </PrimaryButton>
                              </div>
                            </div>
                          ))}
                          {presets.length === 0 && (
                            <p className="text-xs text-zinc-500">No timeline presets configured. Add your first preset moment.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeGlobalSettingsSection === "Live Event Mode" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-[#e9d5a8]">Live Event Mode</SectionTitle>
                  <TextArea
                    id="global-prep-footer"
                    label="Default Event Prep Footer"
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
                        <div key={`live-defaults-${profile}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                          <p className="font-semibold text-zinc-100">{profile}</p>
                          <p className="mt-1 text-zinc-500">
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
                  <div className="flex items-center justify-between gap-3">
                    <SectionTitle className="text-[#e9d5a8]">Team Management</SectionTitle>
                    <PrimaryButton
                      onClick={openAddTeamMemberModal}
                      disabled={!canManageEvents}
                      className="rounded-xl bg-[#c9a35c]/20 px-3 py-2 text-xs text-[#f5e6c8] hover:bg-[#c9a35c]/30 disabled:opacity-50"
                    >
                      Add Team Member
                    </PrimaryButton>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Manage users, role assignments, and planning permissions at the account level.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">
                      Admins: <span className="text-white">{teamMembers.filter((m) => m.role === "Admin").length}</span>
                    </div>
                    <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">
                      DJs: <span className="text-white">{teamMembers.filter((m) => m.role === "DJ").length}</span>
                    </div>
                    <div className="rounded-xl bg-white/5 px-3 py-2 text-zinc-300">
                      Planners: <span className="text-white">{teamMembers.filter((m) => m.role === "Planner").length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={`settings-team-${member.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-zinc-100">{member.name}</p>
                            <p className="mt-1 text-xs text-zinc-500">{member.email}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${roleBadgeClass(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-400">
                          Permissions: {member.role === "Admin" ? "Full settings + event management" : member.role === "DJ" ? "Timeline/music/event prep" : "Planning/timeline/vendor coordination"}
                        </p>
                      </div>
                    ))}
                  </div>
                  {teamFormStatus && (
                    <p
                      className={`rounded-xl px-3 py-2 text-xs ${
                        teamFormStatus.kind === "success"
                          ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                          : "border border-rose-400/25 bg-rose-500/10 text-rose-100"
                      }`}
                    >
                      {teamFormStatus.message}
                    </p>
                  )}
                </div>
              )}

              {activeGlobalSettingsSection === "Branding / App" && (
                <div className="mt-4 space-y-3">
                  <SectionTitle className="text-[#e9d5a8]">Branding / App Settings</SectionTitle>
                  <TextInput id="global-company-name" label="Company Name" value={appSettings.companyName} onChange={(value) => setAppSettings((prev) => ({ ...prev, companyName: value }))} disabled={!canManageEvents} />
                  <TextInput id="global-app-name" label="App Name" value={appSettings.appName} onChange={(value) => setAppSettings((prev) => ({ ...prev, appName: value }))} disabled={!canManageEvents} />
                  <TextInput id="global-logo-url" label="Logo/Branding Path" value={appSettings.logoUrl} onChange={(value) => setAppSettings((prev) => ({ ...prev, logoUrl: value }))} disabled={!canManageEvents} />
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput id="global-brand-color" label="Brand Color" value={appSettings.brandColor} onChange={(value) => setAppSettings((prev) => ({ ...prev, brandColor: value }))} disabled={!canManageEvents} />
                    <TextInput id="global-accent-color" label="Accent Color" value={appSettings.accentColor} onChange={(value) => setAppSettings((prev) => ({ ...prev, accentColor: value }))} disabled={!canManageEvents} />
                  </div>
                  <TextInput id="global-timezone" label="Default Event Timezone" value={appSettings.defaultEventTimezone} onChange={(value) => setAppSettings((prev) => ({ ...prev, defaultEventTimezone: value }))} disabled={!canManageEvents} />
                  <TextArea id="global-template-defaults" label="Global Template Defaults" value={appSettings.globalTemplateDefaults} onChange={(value) => setAppSettings((prev) => ({ ...prev, globalTemplateDefaults: value }))} rows={3} disabled={!canManageEvents} />
                  <div className="rounded-xl border border-[#c9a35c]/25 bg-[#c9a35c]/10 p-3 text-xs text-[#f5e6c8]">
                    Backup recommended while this remains a frontend-only prototype.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PrimaryButton
                      onClick={exportBackupJson}
                      disabled={!canManageEvents}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs text-zinc-100 hover:bg-white/15 disabled:opacity-50"
                    >
                      Export Backup JSON
                    </PrimaryButton>
                    <PrimaryButton
                      onClick={triggerBackupFilePicker}
                      disabled={!canManageEvents}
                      className="rounded-xl bg-[#c9a35c]/20 px-3 py-2 text-xs text-[#f5e6c8] hover:bg-[#c9a35c]/30 disabled:opacity-50"
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
                          ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                          : "border border-rose-400/25 bg-rose-500/10 text-rose-100"
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
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">Team Management is admin-only.</p>
              </PremiumCard>
            )}
            <PremiumCard>
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-[#e9d5a8]">Team Management</SectionTitle>
                <PrimaryButton
                  onClick={openAddTeamMemberModal}
                  disabled={!canManageEvents}
                  className="rounded-xl bg-[#c9a35c]/20 px-3 py-2 text-xs text-[#f5e6c8] hover:bg-[#c9a35c]/30 disabled:opacity-50"
                >
                  Add Team Member
                </PrimaryButton>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Manage internal Admin, DJ, and Planner team members for assignments.
              </p>
              {teamFormStatus && (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                    teamFormStatus.kind === "success"
                      ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                      : "border border-rose-400/25 bg-rose-500/10 text-rose-100"
                  }`}
                >
                  {teamFormStatus.message}
                </p>
              )}
            </PremiumCard>

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Team Members</SectionTitle>
              <div className="mt-3 space-y-2">
                {teamMembers.map((member) => (
                  <div key={`team-member-${member.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{member.name}</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {member.role} · {member.email} {member.phone ? `· ${member.phone}` : ""}
                        </p>
                        {member.notes && <p className="mt-1 text-xs text-zinc-500">{member.notes}</p>}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] ${
                          member.isActive ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-zinc-400"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <PrimaryButton
                        onClick={() => startEditingTeamMember(member)}
                        disabled={!canManageEvents}
                        className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                      >
                        Edit
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() => deleteTeamMember(member.id)}
                        disabled={!canManageEvents}
                        className="rounded-lg bg-[#6f5353]/40 px-2 py-2 text-[11px] text-[#f2dede] hover:bg-[#6f5353]/55"
                      >
                        Delete
                      </PrimaryButton>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
                    No team members yet.
                  </p>
                )}
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "All Events" && (
          <section className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-[#e9d5a8]">Events</SectionTitle>
              <div className="flex gap-2">
                {canManageEvents && (
                  <PrimaryButton
                    onClick={() => setActiveScreen("Settings")}
                    className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10"
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
                    className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10"
                  >
                    New Event
                  </PrimaryButton>
                )}
              </div>
            </div>

            {visibleEvents.length === 0 ? (
              <PremiumCard className="border-dashed border-[#c9a35c]/40 bg-gradient-to-b from-[#18181d] to-[#111115]">
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-[#f5e6c8]">
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
                        className="w-full rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
                      >
                        Create Event
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </PremiumCard>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleEvents.map((evt) => {
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
                  const eventProgressChecks = [
                    evt.timelineItems.length > 0,
                    evt.mustPlaySongs.length > 0,
                    evt.formalities.some((f) => f.includeInTimeline),
                    evt.guestRequests.length > 0,
                  ];
                  const eventProgress = Math.round(
                    (eventProgressChecks.filter(Boolean).length / eventProgressChecks.length) * 100,
                  );
                  return (
                    <PremiumCard key={evt.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            Event
                          </p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {cardEventName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                            {cardEventType}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                            {PRIMARY_PARTY_SHORT_LABEL[cardProfile]}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {cardCoupleNames} · {cardEventDate}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {cardVenue}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">Progress: {eventProgress}%</p>
                          {isActive && (
                            <span className="mt-2 inline-flex rounded-full bg-[#c9a35c]/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#f5e6c8]">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <PrimaryButton
                          onClick={() => {
                            switchToEvent(evt.id);
                          }}
                          className="rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2.5 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
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
                            className="rounded-xl bg-white/5 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/10"
                          >
                            Edit
                          </PrimaryButton>
                        ) : (
                          <PrimaryButton
                            onClick={() => switchToEvent(evt.id)}
                            className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
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
                            className="col-span-2 rounded-xl bg-[#6f5353]/40 px-3 py-2.5 text-xs font-semibold text-[#f2dede] hover:bg-[#6f5353]/55"
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
                          className="w-full rounded-xl bg-[#c9a35c]/18 px-3 py-2 text-[11px] font-semibold text-[#f5e6c8] hover:bg-[#c9a35c]/28"
                        >
                          {COPY_INVITE_LINK_LABEL[cardProfile]}
                        </PrimaryButton>
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
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
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10"
            >
              Back to All Events
            </PrimaryButton>
          </div>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "Command Center" && (effectiveRole === "Admin" || effectiveRole === "DJ") && (
          <section className="mt-6 space-y-3 cm-section-enter">
            <div className="grid gap-3 xl:grid-cols-[1.8fr_1fr]">
              <div className="space-y-3">
                <PremiumCard className="border-[#c9a35c]/25 bg-gradient-to-b from-[#1a1a20] to-[#131318]">
                  <div className="flex items-center justify-between gap-2">
                    <SectionTitle className="text-[#e9d5a8]">Command Center</SectionTitle>
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
                  <SectionTitle className="text-[#e9d5a8]">Upcoming Events</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {commandCenterUpcomingEvents.map((evt) => {
                      const cmdProfile = resolveLayoutProfileForDisplay(
                        evt.settings,
                        appSettings.defaultEventType,
                      );
                      return (
                      <div key={`cmd-upcoming-${evt.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-zinc-100">{evt.settings.eventName || evt.meta.couple}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
                              {PRIMARY_PARTY_SHORT_LABEL[cmdProfile]}:{" "}
                              <span className="font-medium text-zinc-300">
                                {evt.settings.coupleNames || evt.meta.couple || "TBD"}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {evt.settings.weddingDate || evt.meta.date || "TBD"} · {evt.settings.venue || evt.meta.venue || "TBD"}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              DJ: {getTeamMemberName(evt.settings.assignedDj || "")} · Planner: {evt.settings.plannerName || "TBD"}
                            </p>
                          </div>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Dashboard")}
                            className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            View Event
                          </PrimaryButton>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Dashboard")}
                            className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            View Event
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Event Prep")}
                            className="rounded-lg bg-[#c9a35c]/20 px-2 py-2 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                          >
                            Open Event Prep
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Timeline")}
                            className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            Review Timeline
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => openCommandCenterEvent(evt.id, "Guest Requests")}
                            className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            Review Guest Requests
                          </PrimaryButton>
                        </div>
                      </div>
                      );
                    })}
                    {commandCenterUpcomingEvents.length === 0 && (
                      <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
                        No upcoming events available for this role.
                      </p>
                    )}
                  </div>
                </PremiumCard>

                <PremiumCard>
                  <SectionTitle className="text-[#e9d5a8]">Events Needing Attention</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {commandCenterAttentionEvents.map(({ evt, pendingGuestRequests, incompleteChecklistCount }) => (
                      <div key={`cmd-attention-${evt.id}`} className="rounded-xl border border-[#c9a35c]/25 bg-[#c9a35c]/10 px-3 py-2.5">
                        <p className="text-sm font-medium text-zinc-100">{evt.settings.eventName || evt.meta.couple}</p>
                        <p className="mt-1 text-xs text-zinc-300">
                          {pendingGuestRequests} pending guest requests · {incompleteChecklistCount} incomplete planning areas
                        </p>
                      </div>
                    ))}
                    {commandCenterAttentionEvents.length === 0 && (
                      <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-100">
                        No urgent attention items across your events.
                      </p>
                    )}
                  </div>
                </PremiumCard>
              </div>

              <div className="space-y-3">
                <PremiumCard className="border-white/15 bg-white/5 backdrop-blur-md">
                  <SectionTitle className="text-[#e9d5a8]">Recent Activity</SectionTitle>
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
                <PremiumCard className="border-white/15 bg-white/5 backdrop-blur-md">
                  <SectionTitle className="text-[#e9d5a8]">Notifications</SectionTitle>
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
            <section className="mt-6 space-y-8">
              <PremiumCard className="overflow-hidden border-[#c9a35c]/25 p-0 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)]">
                <div className="relative aspect-[20/9] min-h-[140px] overflow-hidden bg-gradient-to-br from-[#3a2e1f] via-[#1a1820] to-[#0c0c0f]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(201,163,92,0.18),transparent_55%)]" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-1 px-6 py-8 text-center">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Cover photo</p>
                    <p className="text-sm text-zinc-400">A beautiful image of your day will live here</p>
                  </div>
                </div>
                <div className="space-y-5 p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{primaryPartyShortLabel}</p>
                      <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight text-[#f7ecd4] sm:text-3xl">
                        {eventDisplayName}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-400">{coupleDisplayName}</p>
                      <p className="mt-3 inline-flex rounded-full border border-[#c9a35c]/30 bg-[#c9a35c]/10 px-3 py-1 text-[11px] font-medium text-[#e9d5a8]">
                        {layoutProfileForActiveEvent}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">Planning</p>
                      <p className="text-3xl font-semibold tabular-nums text-[#f5e6c8]">{completionPercent}%</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">overall</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-zinc-500">{eventDateGridLabel}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{eventDateDisplay}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-zinc-500">Venue</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{eventVenueDisplay}</p>
                    </div>
                  </div>
                  {(eventSettings.assignedDj?.trim() || eventSettings.plannerName?.trim()) && (
                    <p className="text-[11px] text-zinc-500">
                      <span className="text-zinc-600">Your team</span>
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
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                      <span>Planning progress</span>
                      <span className="font-medium text-[#e9d5a8]">{completionPercent}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/90">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8f6b2f] via-[#c9a35c] to-[#e9d5a8] transition-[width] duration-700 ease-out"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </PremiumCard>

              {(coupleAttentionSummary.unansweredPlanningQuestionCount > 0 ||
                coupleAttentionSummary.pendingGuestCount > 0) && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Still needs love</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                    {sectionPlanningQuestionsEnabled &&
                    coupleAttentionSummary.unansweredPlanningQuestionCount > 0 ? (
                      <li className="flex flex-wrap items-baseline justify-between gap-2">
                        <span>
                          {coupleAttentionSummary.unansweredPlanningQuestionCount} planning question
                          {coupleAttentionSummary.unansweredPlanningQuestionCount === 1 ? "" : "s"} open
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveScreen("Planning Questions")}
                          className="text-xs font-medium text-[#c9a35c] underline-offset-4 hover:underline"
                        >
                          Answer
                        </button>
                      </li>
                    ) : null}
                    {sectionGuestRequestsEnabled && coupleAttentionSummary.pendingGuestCount > 0 ? (
                      <li className="flex flex-wrap items-baseline justify-between gap-2">
                        <span>
                          {coupleAttentionSummary.pendingGuestCount} guest request
                          {coupleAttentionSummary.pendingGuestCount === 1 ? "" : "s"} waiting
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveScreen("Guest Requests")}
                          className="text-xs font-medium text-[#c9a35c] underline-offset-4 hover:underline"
                        >
                          Review
                        </button>
                      </li>
                    ) : null}
                  </ul>
                </div>
              )}

              <PrimaryButton
                type="button"
                onClick={() => setActiveScreen(coupleGuidedNextScreen)}
                className="w-full min-h-[4.75rem] justify-center rounded-2xl border border-[#c9a35c]/40 bg-gradient-to-br from-[#c9a35c]/22 to-white/5 px-5 py-5 text-center shadow-[0_12px_40px_-18px_rgba(201,163,92,0.55)]"
              >
                <span className="block text-base font-semibold text-[#f5e6c8]">Continue planning</span>
                <span className="mt-1 block text-xs font-normal text-zinc-400">{coupleGuidedNextHint}</span>
              </PrimaryButton>

              <div className="space-y-3 px-0.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Your planning areas</p>
                <p className="text-sm text-zinc-400">
                  Open a section when you are ready—everything stays organized in its own pocket.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {coupleHomePlanningSections.map((section) => (
                  <button
                    type="button"
                    key={section.id}
                    onClick={() => setActiveScreen(section.screen)}
                    className="group flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-5 py-5 text-left transition hover:border-[#c9a35c]/38 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a35c]/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{section.kicker}</p>
                        <h3 className="mt-1 text-lg font-semibold text-[#f5e6c8]">{section.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{section.description}</p>
                      </div>
                      {section.pendingBadge ? (
                        <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-100/95">
                          {section.pendingBadge}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5">
                      <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
                        <span>{section.completionStatusLabel ?? "Progress"}</span>
                        <span className="tabular-nums text-[#e9d5a8]">{section.completion}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/90">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8f6b2f] via-[#c9a35c] to-[#e9d5a8] transition-[width] duration-500"
                          style={{ width: `${section.completion}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end border-t border-white/5 pt-4">
                      <span className="text-xs font-semibold text-[#c9a35c] transition group-hover:text-[#e9d5a8]">
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
                    className="text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
                  >
                    Notes & personal reminders
                  </button>
                </div>
              )}
            </section>
          ) : (
          <>
            <section className="mt-6 space-y-3">
              <PremiumCard className="border-[#c9a35c]/30 bg-gradient-to-br from-[#20160a]/55 via-[#17171d]/85 to-[#121217]/95 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#c9a35c]">
                  {dashboardEyebrowText}
                </p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      {primaryPartyShortLabel}
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#f7ecd4]">{coupleDisplayName}</h2>
                    <p className="mt-1 text-xs text-zinc-400">{eventDisplayName}</p>
                  </div>
                  <span className="rounded-full border border-[#c9a35c]/35 bg-[#c9a35c]/15 px-2.5 py-1 text-xs font-semibold text-[#f5e6c8]">
                    {completionPercent}% complete
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-zinc-500">{eventDateGridLabel}</p>
                    <p className="mt-1 font-medium text-zinc-100">{eventDateDisplay}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-zinc-500">Venue</p>
                    <p className="mt-1 font-medium text-zinc-100">{eventVenueDisplay}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Vendors: <span className="text-zinc-200">{vendors.length}</span>
                </p>
                <div className="mt-3 rounded-xl border border-[#c9a35c]/25 bg-gradient-to-r from-[#c9a35c]/15 to-transparent px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-[#d8b874]">{eventCountdownLabel}</p>
                  <p className="mt-1 text-sm font-medium text-[#f7ecd4]">
                    {daysUntilWedding === null
                      ? "Add an event date to start your countdown"
                      : `${daysUntilWedding} day${daysUntilWedding === 1 ? "" : "s"} until your event`}
                  </p>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-zinc-400">Planning completion percentage</p>
                    <p className="font-semibold text-[#f5e6c8]">{completionPercent}%</p>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8f6b2f] via-[#c9a35c] to-[#e9d5a8] transition-[width] duration-700 ease-out"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <SectionTitle className="text-[#e9d5a8]">
                    {isCoupleView ? "Your celebration is coming together beautifully" : "Next recommended tasks"}
                  </SectionTitle>
                  <div className="mt-2 space-y-2">
                    {nextChecklistTasks.length > 0 ? (
                      nextChecklistTasks.map((task) => (
                        <button
                          type="button"
                          key={`next-${task.id}`}
                          onClick={() => setActiveScreen(task.linkedSection)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-zinc-200 transition hover:border-[#c9a35c]/35 hover:bg-white/10"
                        >
                          <p className="font-medium text-zinc-100">{task.title}</p>
                          <p className="mt-1 text-zinc-500">
                            {isCoupleView
                              ? task.id === "choose-ceremony-songs"
                                ? "Set the music moments that will define your ceremony."
                                : task.id === "build-must-play-list"
                                  ? "Shape the soundtrack that fills your floor all night."
                                  : task.id === "review-timeline"
                                    ? "Refine the flow so each moment lands exactly right."
                                    : task.description
                              : task.description}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                        {isCoupleView
                          ? "Beautiful work. Your celebration is set for an unforgettable night."
                          : "Beautiful work. Your checklist is complete and event-ready."}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {dashboardQuickScreens.map((target) => (
                    <PrimaryButton
                      key={`quick-${target}`}
                      onClick={() => setActiveScreen(target)}
                      className="rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-[11px] text-zinc-200 transition hover:-translate-y-0.5 hover:border-[#c9a35c]/35 hover:bg-white/15"
                    >
                      {target === "Planning Checklist"
                        ? "Checklist"
                        : target === "Planning Questions"
                          ? "Questions"
                          : target === "Reception Timeline"
                            ? "Timeline"
                            : target}
                    </PrimaryButton>
                  ))}
                </div>
              </PremiumCard>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {progressCards.map((card) => (
                  <PremiumCard key={card.label}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-300">{card.label}</p>
                      <span className="text-sm font-semibold text-[#e9d5a8]">{card.value}</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800/90">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#8f6b2f] to-[#e9d5a8]" style={{ width: card.value }} />
                    </div>
                    <p className="mt-3 text-xs text-zinc-400">{card.detail}</p>
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="mt-6 space-y-3">
              <PremiumCard className="border-white/15 bg-white/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <SectionTitle className="text-[#e9d5a8]">
                    {isCoupleView ? "Upcoming moments to personalize" : "Upcoming planning milestones"}
                  </SectionTitle>
                  <span className="rounded-full bg-[#c9a35c]/20 px-2.5 py-1 text-xs font-semibold text-[#f5e6c8]">
                    {completionPercent}%
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {upcomingMilestones.length > 0 ? (
                    upcomingMilestones.map((item) => (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-200">{item.title}</span>
                          <span className="text-zinc-400">{item.dueDate}</span>
                        </div>
                        <p className="mt-1 text-zinc-500">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    planningChecklist.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                        <span className="text-zinc-300">{item.title}</span>
                        <span className="text-zinc-500">{item.dueDate || "Set date"}</span>
                      </div>
                    ))
                  )}
                </div>
              </PremiumCard>

              <PremiumCard className="border-white/15 bg-white/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <SectionTitle className="text-[#e9d5a8]">
                    {isCoupleView ? "Most recent updates to your celebration" : "Most recent updates"}
                  </SectionTitle>
                  <PrimaryButton
                    onClick={() => setActiveScreen("Notification Center")}
                    className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15"
                  >
                    View All
                  </PrimaryButton>
                </div>
                <div className="mt-3 space-y-2">
                  {recentActivityForActiveEvent.map((item) => (
                    <div key={`recent-${item.id}`} className="rounded-xl bg-white/5 px-3 py-2 text-xs">
                      <p className="text-zinc-100">
                        <span className="mr-1">{activityTypeIcon(item.type)}</span>
                        {item.summary}
                      </p>
                      <p className="mt-1 text-zinc-500">
                        {item.userRole} · {item.eventName} · {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  ))}
                  {recentActivityForActiveEvent.length === 0 && (
                    <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
                      {isCoupleView
                        ? "Updates will appear here as your celebration takes shape."
                        : "Activity will appear here as planning updates happen."}
                    </p>
                  )}
                </div>
              </PremiumCard>

              <PremiumCard>
                <div className="flex items-center justify-between">
                  <SectionTitle className="text-[#e9d5a8]">Recent Activity</SectionTitle>
                  <PrimaryButton
                    onClick={() => setActiveScreen("Notification Center")}
                    className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15"
                  >
                    View All
                  </PrimaryButton>
                </div>
                <div className="mt-3 space-y-2">
                  {activities
                    .filter((item) => item.eventId === activeEventId)
                    .slice(0, 4)
                    .map((item) => (
                      <div key={`recent-${item.id}`} className="rounded-xl bg-white/5 px-3 py-2 text-xs">
                        <p className="text-zinc-100">
                          <span className="mr-1">{activityTypeIcon(item.type)}</span>
                          {item.summary}
                        </p>
                        <p className="mt-1 text-zinc-500">
                          {item.userRole} · {item.eventName} · {formatRelativeTime(item.timestamp)}
                        </p>
                      </div>
                    ))}
                  {activities.filter((item) => item.eventId === activeEventId).length === 0 && (
                    <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
                      Activity will appear here as planning updates happen.
                    </p>
                  )}
                </div>
              </PremiumCard>

            </section>

            <section className="mt-6 space-y-3">
              <SectionTitle className="mb-1 font-medium text-zinc-300">
                {isCoupleView ? "Let's make this night unforgettable" : "Planning Insights"}
              </SectionTitle>
              <PremiumCard className="border-[#c9a35c]/30 bg-gradient-to-b from-amber-950/20 via-[#17171c] to-[#141419]">
                <SectionTitle className="text-[#e9d5a8]">
                  {isCoupleView ? "Celebration Guidance" : "Smart Planning Assistant"}
                </SectionTitle>
                <p className="mt-1 text-xs text-zinc-500">
                  {isCoupleView
                    ? "A refined read on timing, music, and guest flow to keep your celebration feeling effortless."
                    : "A concise read on timing, music, ceremony, and guest flow — update any section to refresh."}
                </p>
                <div className="mt-3">
                  <InsightStack
                    insights={
                      isCoupleView
                        ? planningInsights.filter(
                            (i) => i.section !== "timeline" && i.section !== "ceremony",
                          )
                        : planningInsights
                    }
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
              <SectionTitle className="mb-3 font-medium text-zinc-300">Planning Sections</SectionTitle>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {eventNavItems
                  .filter((section) => section !== "Dashboard")
                  .map((section) => (
                    <PrimaryButton
                      key={section}
                      onClick={() => setActiveScreen(section)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-zinc-100 transition duration-200 hover:-translate-y-0.5 hover:border-[#c9a35c]/45 hover:bg-white/10"
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
              <div className="no-print">
                <PrimaryButton
                  type="button"
                  onClick={() => setActiveScreen("Dashboard")}
                  className="w-full justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-[#f5e6c8] transition hover:border-[#c9a35c]/35 hover:bg-white/10 sm:inline-flex sm:w-auto"
                >
                  ← Back to event
                </PrimaryButton>
              </div>
              <PremiumCard className="border-[#c9a35c]/25 bg-gradient-to-b from-[#1f1a14]/80 to-transparent">
                <SectionTitle className="text-[#e9d5a8]">Reception & main event</SectionTitle>
                <p className="mt-1 text-xs text-zinc-500">
                  Your timeline, special moments, and notes—everything for the heart of your celebration.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(sectionReceptionTimelineEnabled || sectionFormalitiesEnabled) && (
                    <PrimaryButton
                      type="button"
                      onClick={() => setActiveScreen("Reception Timeline")}
                      className="min-h-[3.75rem] justify-start rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left hover:border-[#c9a35c]/35 sm:col-span-2"
                    >
                      <span className="block text-sm font-semibold text-zinc-100">
                        {sectionReceptionTimelineEnabled && sectionFormalitiesEnabled
                          ? "Timeline & special moments"
                          : sectionFormalitiesEnabled
                            ? "Special moments & timeline"
                            : "Timeline"}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                        {sectionFormalitiesEnabled && sectionReceptionTimelineEnabled
                          ? "Flow, dances, and spotlight moments in one workspace"
                          : sectionFormalitiesEnabled
                            ? "Dances and spotlight moments—edited alongside your flow"
                            : "Flow and timing for your event"}
                      </span>
                    </PrimaryButton>
                  )}
                  {(sectionPlanningChecklistEnabled || sectionMusicNotesEnabled) && (
                    <PrimaryButton
                      type="button"
                      onClick={() => setActiveScreen("Notes")}
                      className="min-h-[3.75rem] justify-start rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left hover:border-[#c9a35c]/35 sm:col-span-2"
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
          <section className="mt-6 space-y-4">
            {!isCoupleView && (
              <div className="no-print">
                <PrimaryButton
                  type="button"
                  onClick={() => setActiveScreen("Dashboard")}
                  className="w-full justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-[#f5e6c8] transition hover:border-[#c9a35c]/35 hover:bg-white/10 sm:inline-flex sm:w-auto"
                >
                  ← Back to event
                </PrimaryButton>
              </div>
            )}

            <PremiumCard className="border-[#c9a35c]/35 bg-gradient-to-br from-amber-950/30 via-[#17171f]/90 to-[#121218]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#c9a35c]/75">Soundtrack</p>
              <SectionTitle className="mt-1 text-[#f5e6c8]">Music Hub</SectionTitle>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Keep must-plays, playlists, guest requests, and vibe notes in one calm place—organized by moment, not spreadsheets.
              </p>
            </PremiumCard>

            {!canManageMusic && (
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">
                  {effectiveRole} role can view music, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
            {!isCoupleView && (
              <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
                <SectionTitle className="text-[#e9d5a8]">Music Assistant</SectionTitle>
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

            <PremiumCard className="border-white/10 bg-white/[0.03]">
              <SectionTitle className="text-[#e9d5a8]">Quick add</SectionTitle>
              <p className="mt-1 text-xs text-zinc-400">
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
                    className={`rounded-xl px-3 py-2 text-xs font-medium ${
                      newSongListType === "mustPlay"
                        ? "bg-[#c9a35c]/25 text-[#f5e6c8]"
                        : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    Must Play
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setNewSongListType("doNotPlay")}
                    disabled={!canManageMusic}
                    className={`rounded-xl px-3 py-2 text-xs font-medium ${
                      newSongListType === "doNotPlay"
                        ? "bg-[#6f5353]/40 text-[#f5e6c8]"
                        : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    Do Not Play
                  </PrimaryButton>
                </div>
                <PrimaryButton
                  onClick={() => setNewSongHighPriority((prev) => !prev)}
                  disabled={!canManageMusic}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-medium ${
                    newSongHighPriority
                      ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {newSongHighPriority ? "High Priority Enabled" : "Mark as High Priority"}
                </PrimaryButton>
                <PrimaryButton
                  onClick={addSong}
                  disabled={!canManageMusic}
                  className="w-full bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
                >
                  Add Song
                </PrimaryButton>
              </div>
            </PremiumCard>

            <div className="grid gap-4 lg:grid-cols-2">
              {sectionMustPlayEnabled && (
                <PremiumCard className="border-[#c9a35c]/25 bg-gradient-to-b from-[#c9a35c]/[0.06] to-transparent">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <SectionTitle className="text-[#e9d5a8]">Must play</SectionTitle>
                      <p className="mt-1 text-xs text-zinc-500">Non‑negotiable songs for your celebration.</p>
                    </div>
                    <span className="rounded-full bg-[#c9a35c]/15 px-2.5 py-1 text-[11px] text-[#e9d5a8]">
                      {mustPlaySongs.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {mustPlaySongs.length === 0 ? (
                      <p className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">
                        Add the songs that have to hit the speakers.
                      </p>
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
                <PremiumCard className="border-[#7a5c5c]/35 bg-gradient-to-b from-[#6f5353]/[0.12] to-transparent">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <SectionTitle className="text-[#e5d7be]">Do not play</SectionTitle>
                      <p className="mt-1 text-xs text-zinc-500">
                        Songs, artists, genres, or vibes to steer away from—notes optional.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#6f5353]/35 px-2.5 py-1 text-[11px] text-[#e5d7be]">
                      {doNotPlaySongs.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {doNotPlaySongs.length === 0 ? (
                      <p className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">
                        Clear guardrails help the DJ protect the mood.
                      </p>
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
                  <SectionTitle className="text-[#e9d5a8]">Playlists by moment</SectionTitle>
                  <p className="mt-1 text-xs text-zinc-500">
                    Each block is its own pocket—drag to reorder, or nudge with arrows.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
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
                            <SectionTitle className="text-[#f5e6c8]">
                              {PLAYLIST_BUCKET_LABELS[bucketId]}
                            </SectionTitle>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              {lines.length} song{lines.length === 1 ? "" : "s"}
                              {usingDefaults ? " · Includes starter ideas + imports" : " · Custom list"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <PrimaryButton
                              type="button"
                              onClick={() => resetPlaylistBucketToDefaults(bucketId)}
                              disabled={!canManageMusic || usingDefaults}
                              className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15 disabled:opacity-40"
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
                            className="rounded-xl bg-[#c9a35c]/20 px-3 py-2.5 text-xs font-semibold text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                          >
                            Add
                          </PrimaryButton>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {lines.length === 0 ? (
                            <li className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">
                              Drop songs here—think energy and pacing for this chapter of the night.
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
                                className="flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-2 py-2.5 text-xs"
                              >
                                <span
                                  className="mt-0.5 cursor-grab select-none text-zinc-600"
                                  title="Drag to reorder"
                                >
                                  ⋮⋮
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-zinc-100">
                                    {parsed.song || line || "—"}
                                  </p>
                                  <p className="truncate text-[11px] text-zinc-500">
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
                                    className="rounded-lg bg-white/10 px-2 py-1 text-[10px] text-zinc-200"
                                  >
                                    Up
                                  </PrimaryButton>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() =>
                                      reorderPlaylistLineInBucket(bucketId, index, index + 1)
                                    }
                                    disabled={!canManageMusic || index >= lines.length - 1}
                                    className="rounded-lg bg-white/10 px-2 py-1 text-[10px] text-zinc-200"
                                  >
                                    Down
                                  </PrimaryButton>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => removePlaylistLineFromBucket(bucketId, index)}
                                    disabled={!canManageMusic}
                                    className="rounded-lg bg-[#6f5353]/35 px-2 py-1 text-[10px] text-[#f2dede]"
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
              <PremiumCard className="border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <SectionTitle className="text-[#e9d5a8]">Guest requests</SectionTitle>
                    <p className="mt-1 text-xs text-zinc-500">
                      What guests are asking for—approve in one tap on the full screen.
                    </p>
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={() => setActiveScreen("Guest Requests")}
                    className="rounded-xl bg-[#c9a35c]/20 px-3 py-2 text-xs text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                  >
                    Open guest requests
                  </PrimaryButton>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/90">Approved</p>
                    <div className="mt-2 space-y-2">
                      {guestRequests.filter((r) => r.status === "Approved").length === 0 ? (
                        <p className="text-xs text-zinc-500">No approved songs yet.</p>
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
                  <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-amber-100/90">Pending</p>
                    <div className="mt-2 space-y-2">
                      {guestRequests.filter((r) => r.status === "Pending").length === 0 ? (
                        <p className="text-xs text-zinc-500">Inbox is quiet.</p>
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
              <PremiumCard className="border-white/8 bg-white/[0.02]">
                <SectionTitle className="text-zinc-300">Guest requests</SectionTitle>
                <p className="mt-2 text-xs text-zinc-500">
                  Guest requests are hidden for this event—flip them on under Event Settings → Sections when you want the queue
                  here.
                </p>
              </PremiumCard>
            )}

            {sectionMusicNotesEnabled && (
              <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/12 to-transparent">
                <SectionTitle className="text-[#e9d5a8]">Music notes &amp; vibe</SectionTitle>
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
            <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/20 via-[#17171c] to-[#141419]">
              <SectionTitle className="text-[#e9d5a8]">Spotify Playlist Import (Prototype)</SectionTitle>
              <p className="mt-1 text-xs text-zinc-500">
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
                  className="w-full bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110 disabled:opacity-50"
                >
                  Import Playlist
                </PrimaryButton>
                {musicImportStage === "analyzing" && (
                  <p className="rounded-xl border border-[#c9a35c]/25 bg-[#c9a35c]/10 px-3 py-2 text-xs text-[#f5e6c8]">
                    Analyzing playlist vibe...
                  </p>
                )}
                {musicImportStage === "building" && (
                  <p className="rounded-xl border border-[#c9a35c]/25 bg-[#c9a35c]/10 px-3 py-2 text-xs text-[#f5e6c8]">
                    Building your event soundtrack...
                  </p>
                )}
              </div>
            </PremiumCard>

            {musicImportStage === "ready" && importedPlaylistSongs.length > 0 && (
              <PremiumCard className="border-white/15 bg-white/5 backdrop-blur-md">
                <SectionTitle className="text-[#e9d5a8]">Playlist Preview</SectionTitle>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-[#2a2a32] to-[#15151b] text-[10px] uppercase tracking-wide text-zinc-400">
                    Artwork
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{importedPlaylistName}</p>
                    <p className="mt-1 text-xs text-zinc-500">{importedPlaylistSongs.length} songs</p>
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
                    className="rounded-xl bg-[#c9a35c]/20 px-3 py-2 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                  >
                    Add All to Must Play
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => runAutoCategorization(importedPlaylistSongs)}
                    disabled={!canManageMusic}
                    className="rounded-xl bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
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
          (sectionReceptionTimelineEnabled || sectionFormalitiesEnabled) && (
          <section className={`mt-6 ${isCoupleView ? "space-y-5" : "space-y-3"}`}>
            {activeScreen === "Reception Timeline" && (
              <div className="no-print">
                <PrimaryButton
                  type="button"
                  onClick={() => setActiveScreen("Reception Hub")}
                  className="w-full justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-[#f5e6c8] transition hover:border-[#c9a35c]/35 hover:bg-white/10 sm:inline-flex sm:w-auto"
                >
                  ← Back to Reception
                </PrimaryButton>
              </div>
            )}
            {!canEditTimeline && (
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">
                  {effectiveRole} role can view timeline, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
            {!isCoupleView && (
              <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
                <SectionTitle className="text-[#e9d5a8]">Timeline Assistant</SectionTitle>
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

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Quick Add Presets</SectionTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Tap a common moment to add it instantly, then fine-tune inline.
              </p>
              <div className="mt-3">
                <PrimaryButton
                  onClick={applyTimelinePresetsForActiveEvent}
                  disabled={!canEditTimeline}
                  className="w-full rounded-xl bg-[#c9a35c]/20 px-3 py-2 text-xs font-semibold text-[#f5e6c8] hover:bg-[#c9a35c]/30 disabled:opacity-45"
                >
                  Apply Timeline Presets
                </PrimaryButton>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {mainTimelinePresetsForActiveEvent.map((preset) => (
                  <PrimaryButton
                    key={`timeline-preset-${preset.id}`}
                    onClick={() => addReceptionPreset(preset)}
                    disabled={!canEditTimeline}
                    className="rounded-lg bg-white/10 px-2.5 py-2 text-[11px] text-zinc-200 hover:bg-white/15 disabled:opacity-45"
                  >
                    {preset.momentName}
                  </PrimaryButton>
                ))}
              </div>
            </PremiumCard>

            <PremiumCard>
              <div ref={timelineFormRef} />
              <SectionTitle className="text-[#e9d5a8]">
                {editingTimelineId ? "Edit Timeline Item" : "Add Timeline Item"}
              </SectionTitle>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="timeline-time"
                  label="Time"
                  value={timelineTime}
                  onChange={setTimelineTime}
                  placeholder="e.g. 6:30 PM"
                  disabled={!canEditTimeline}
                />
                <TextInput
                  id="timeline-title"
                  label="Title"
                  value={timelineTitle}
                  onChange={setTimelineTitle}
                  placeholder="e.g. Dinner Service Begins"
                  disabled={!canEditTimeline}
                />
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
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
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
                  label="Notes"
                  value={timelineNotes}
                  onChange={setTimelineNotes}
                  placeholder="Add production notes, cue details, or MC guidance..."
                  disabled={!canEditTimeline}
                />
                <PrimaryButton
                  onClick={() => setTimelineNeedsAttention((prev) => !prev)}
                  disabled={!canEditTimeline}
                  className={`w-full ${
                    timelineNeedsAttention
                      ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {timelineNeedsAttention
                    ? "DJ/MC Attention Required"
                    : "Mark as DJ/MC Attention"}
                </PrimaryButton>
                <div className="grid grid-cols-2 gap-2">
                  <PrimaryButton
                    onClick={addOrUpdateTimelineItem}
                    disabled={!canEditTimeline}
                    className="w-full bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
                  >
                    {editingTimelineId ? "Save Changes" : "Add Item"}
                  </PrimaryButton>
                  {editingTimelineId ? (
                    <PrimaryButton
                      onClick={resetTimelineForm}
                      disabled={!canEditTimeline}
                      className="w-full bg-white/10 py-2.5 text-sm text-zinc-200 hover:bg-white/15"
                    >
                      Cancel Edit
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton className="w-full bg-white/5 py-2.5 text-sm text-zinc-500">
                      Timeline Planner
                    </PrimaryButton>
                  )}
                </div>
              </div>
            </PremiumCard>

            {mergedTimelineItems.length === 0 ? (
              <PremiumCard className="border-dashed border-[#c9a35c]/40 bg-gradient-to-b from-[#18181d] to-[#111115]">
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-[#f5e6c8]">Your timeline is empty</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    Add your first timeline moment to shape an intentional event flow.
                  </p>
                </div>
              </PremiumCard>
            ) : (
              mergedTimelineItems.map((item, index) => {
                const isTimelineItem = item.source === "timeline";
                const formalityRow =
                  item.source === "formality"
                    ? formalities.find((f) => f.id === item.id)
                    : undefined;
                const isDragging = draggingTimelineId === item.id;
                const isDropTarget = dropTargetTimelineId === item.id && draggingTimelineId !== item.id;
                return (
                <PremiumCard
                  key={item.id}
                  className={`transition-all duration-200 ${isDragging ? "scale-[1.01] border-[#c9a35c]/55 shadow-[0_16px_36px_rgba(201,163,92,0.20)]" : ""} ${isDropTarget ? "ring-2 ring-[#c9a35c]/35" : ""}`}
                  onDragOver={
                    isTimelineItem
                      ? (event) => {
                          if (!canEditTimeline || !draggingTimelineId) return;
                          event.preventDefault();
                          if (draggingTimelineId !== item.id) setDropTargetTimelineId(item.id);
                        }
                      : undefined
                  }
                  onDrop={
                    isTimelineItem
                      ? (event) => {
                          event.preventDefault();
                          if (!canEditTimeline || !draggingTimelineId) return;
                          reorderTimelineItemToTarget(draggingTimelineId, item.id);
                          setDraggingTimelineId(null);
                          setDropTargetTimelineId(null);
                        }
                      : undefined
                  }
                  onDragEnd={
                    isTimelineItem
                      ? () => {
                          setDraggingTimelineId(null);
                          setDropTargetTimelineId(null);
                        }
                      : undefined
                  }
                  onTouchMove={
                    isTimelineItem
                      ? (event) => {
                          if (!canEditTimeline || !draggingTimelineId) return;
                          event.preventDefault();
                          const touch = event.touches[0];
                          if (!touch) return;
                          const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
                          const card = targetElement?.closest("[data-timeline-id]") as HTMLElement | null;
                          const targetId = card?.dataset.timelineId;
                          if (targetId && targetId !== draggingTimelineId) setDropTargetTimelineId(targetId);
                        }
                      : undefined
                  }
                  onTouchEnd={
                    isTimelineItem
                      ? () => {
                          if (!canEditTimeline || !draggingTimelineId || !dropTargetTimelineId) {
                            setDraggingTimelineId(null);
                            setDropTargetTimelineId(null);
                            return;
                          }
                          reorderTimelineItemToTarget(draggingTimelineId, dropTargetTimelineId);
                          setDraggingTimelineId(null);
                          setDropTargetTimelineId(null);
                        }
                      : undefined
                  }
                  data-timeline-id={isTimelineItem ? item.id : undefined}
                >
                  {isDropTarget && (
                    <div className="mb-2 h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-[#c9a35c] to-transparent" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] ${
                        item.category === "Formality"
                          ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                          : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <TextInput
                      id={`timeline-inline-time-${item.id}`}
                      label="Time"
                      value={item.time}
                      onChange={(value) => {
                        if (item.source === "formality") {
                          updateFormality(item.id, { time: value });
                          return;
                        }
                        setTimelineItems((prev) =>
                          prev.map((existing) =>
                            existing.id === item.id ? { ...existing, time: value } : existing,
                          ),
                        );
                      }}
                      disabled={!canEditTimeline}
                    />
                    <TextInput
                      id={`timeline-inline-title-${item.id}`}
                      label="Moment"
                      value={item.title}
                      onChange={(value) => {
                        if (item.source === "formality") {
                          updateFormality(item.id, { momentName: value });
                          return;
                        }
                        setTimelineItems((prev) =>
                          prev.map((existing) =>
                            existing.id === item.id ? { ...existing, title: value } : existing,
                          ),
                        );
                      }}
                      disabled={!canEditTimeline}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <TextInput
                      id={`timeline-inline-song-${item.id}`}
                      label="Song"
                      value={
                        item.source === "formality"
                          ? `${
                              formalities.find((f) => f.id === item.id)?.songTitle || ""
                            }`
                          : ""
                      }
                      onChange={(value) => {
                        if (item.source === "formality") {
                          updateFormality(item.id, { songTitle: value });
                        }
                      }}
                      placeholder={item.source === "formality" ? "Song title" : "Optional — add song in notes"}
                      disabled={!canEditTimeline || item.source !== "formality"}
                    />
                    <TextInput
                      id={`timeline-inline-song-artist-${item.id}`}
                      label="Artist"
                      value={item.source === "formality" ? `${formalities.find((f) => f.id === item.id)?.artist || ""}` : ""}
                      onChange={(value) => {
                        if (item.source === "formality") {
                          updateFormality(item.id, { artist: value });
                        }
                      }}
                      placeholder={item.source === "formality" ? "Artist" : "-"}
                      disabled={!canEditTimeline || item.source !== "formality"}
                    />
                  </div>
                  <TextArea
                    id={`timeline-inline-notes-${item.id}`}
                    label="Notes"
                    value={item.notes}
                    onChange={(value) => {
                      if (item.source === "formality") {
                        updateFormality(item.id, { notes: value });
                        return;
                      }
                      setTimelineItems((prev) =>
                        prev.map((existing) =>
                          existing.id === item.id ? { ...existing, notes: value } : existing,
                        ),
                      );
                    }}
                    rows={2}
                    disabled={!canEditTimeline}
                  />
                  {item.source === "formality" && formalityRow ? (
                    <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            updateFormality(formalityRow.id, {
                              fadeOutEarly: !formalityRow.fadeOutEarly,
                            })
                          }
                          disabled={!canEditTimeline}
                          className={`w-full ${
                            formalityRow.fadeOutEarly
                              ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                              : "bg-white/5 text-zinc-400"
                          }`}
                        >
                          {formalityRow.fadeOutEarly ? "Fade out early: On" : "Fade out early"}
                        </PrimaryButton>
                        <TextInput
                          id={`timeline-inline-fade-${item.id}`}
                          label="Fade timestamp"
                          value={formalityRow.fadeOutTimestamp}
                          onChange={(value) =>
                            updateFormality(formalityRow.id, { fadeOutTimestamp: value })
                          }
                          placeholder="e.g. 1:20"
                          disabled={!canEditTimeline}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            updateFormality(formalityRow.id, {
                              includeInTimeline: !formalityRow.includeInTimeline,
                            })
                          }
                          disabled={!canEditTimeline}
                          className={`w-full ${
                            formalityRow.includeInTimeline
                              ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                              : "bg-white/5 text-zinc-400"
                          }`}
                        >
                          {formalityRow.includeInTimeline
                            ? "Shown on timeline"
                            : "Include on timeline"}
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() =>
                            updateFormality(formalityRow.id, {
                              needsDjMcAttention: !formalityRow.needsDjMcAttention,
                            })
                          }
                          disabled={!canEditTimeline}
                          className={`w-full ${
                            formalityRow.needsDjMcAttention
                              ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                              : "bg-white/5 text-zinc-400"
                          }`}
                        >
                          {formalityRow.needsDjMcAttention
                            ? "DJ/MC attention: On"
                            : "DJ/MC attention"}
                        </PrimaryButton>
                      </div>
                    </div>
                  ) : null}
                  {item.needsDjMcAttention && item.source === "timeline" && (
                    <span className="mt-2 inline-flex rounded-full bg-[#c9a35c]/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#f5e6c8]">
                      DJ/MC Attention
                    </span>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.source === "timeline" ? (
                      <>
                        <button
                          type="button"
                          draggable={canEditTimeline}
                          onDragStart={(event) => {
                            if (!canEditTimeline) return;
                            event.dataTransfer.effectAllowed = "move";
                            setDraggingTimelineId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggingTimelineId(null);
                            setDropTargetTimelineId(null);
                          }}
                          onTouchStart={(event) => {
                            if (!canEditTimeline) return;
                            event.preventDefault();
                            setDraggingTimelineId(item.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a35c]/55 bg-gradient-to-b from-[#c9a35c]/25 to-[#c9a35c]/10 px-3 py-2 text-[11px] font-semibold text-[#f5e6c8] transition hover:border-[#c9a35c]/70 hover:bg-[#c9a35c]/30 active:scale-[0.98] disabled:opacity-50"
                          disabled={!canEditTimeline}
                          aria-label={`Drag handle for ${item.title}`}
                        >
                          <span className="text-[10px] tracking-wide text-[#e9d5a8]">::</span>
                          <span>Reorder</span>
                        </button>
                        <PrimaryButton
                          onClick={() => moveTimelineItem(item.id, "up")}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Move Up
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => moveTimelineItem(item.id, "down")}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Move Down
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() =>
                            editTimelineItem({
                              id: item.id,
                              title: item.title,
                              time: item.time,
                              category: item.category as TimelineCategory,
                              notes: item.notes,
                              needsDjMcAttention: item.needsDjMcAttention,
                            })
                          }
                          disabled={!canEditTimeline}
                          className="bg-[#c9a35c]/20 px-3 py-2 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                        >
                          Edit
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => deleteTimelineItem(item.id)}
                          disabled={!canEditTimeline}
                          className="bg-[#6f5353]/40 px-3 py-2 text-[11px] text-[#f2dede] hover:bg-[#6f5353]/55"
                        >
                          Delete
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() =>
                            duplicateTimelineItem({
                              id: item.id,
                              title: item.title,
                              time: item.time,
                              category: item.category as TimelineCategory,
                              notes: item.notes,
                              needsDjMcAttention: item.needsDjMcAttention,
                            })
                          }
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Duplicate
                        </PrimaryButton>
                      </>
                    ) : (
                      <>
                        <PrimaryButton
                          onClick={() => moveFormalityAmongIncluded(item.id, "up")}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Move Up
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => moveFormalityAmongIncluded(item.id, "down")}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Move Down
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => {
                            const formality = formalities.find((f) => f.id === item.id);
                            if (formality) duplicateFormality(formality);
                          }}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Duplicate
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => deleteFormality(item.id)}
                          disabled={!canEditTimeline}
                          className="bg-[#6f5353]/40 px-3 py-2 text-[11px] text-[#f2dede] hover:bg-[#6f5353]/55"
                        >
                          Delete
                        </PrimaryButton>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                    Item {index + 1} of {mergedTimelineItems.length}
                  </p>
                </PremiumCard>
              )})
            )}
          </section>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "Timeline Templates" && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
              <SectionTitle className="text-[#e9d5a8]">Timeline Templates</SectionTitle>
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
                    <SectionTitle className="text-[#e9d5a8]">{template.name}</SectionTitle>
                    <p className="mt-1 text-xs text-zinc-400">
                      {template.timelineItems.length} timeline items · {template.formalities.length} formalities
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
                      {template.kind === "built_in" ? "Built-in" : "Custom"}
                    </span>
                  </div>
                </div>
                {template.planningSuggestions.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                    {template.planningSuggestions.slice(0, 2).map((tip) => (
                      <li key={`${template.id}-${tip}`}>- {tip}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <PrimaryButton
                    onClick={() => {
                      setTimelineItems(cloneJson(template.timelineItems));
                      setFormalities(cloneJson(template.formalities));
                      setPlannerNotes(cloneJson(template.planningSuggestions));
                      logActivity("template_applied", `Applied template: ${template.name}`);
                      setActiveScreen("Timeline");
                    }}
                    className="rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
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
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
                  >
                    Duplicate
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => openEditTemplateModal(template)}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
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
                      className="rounded-xl bg-[#6f5353]/40 px-3 py-2 text-xs font-semibold text-[#f2dede] hover:bg-[#6f5353]/55"
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
            <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-[#e9d5a8]">Collaborators</SectionTitle>
                <PrimaryButton
                  onClick={() => setInviteModalOpen(true)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/15"
                >
                  Invite
                </PrimaryButton>
              </div>
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
                      <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${collab.status === "Accepted" ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
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
                    onClick={() =>
                      updateCollaboratorsForActiveEvent((current) =>
                        current.filter((c) => c.id !== collab.id),
                      )
                    }
                    className="col-span-2 rounded-xl bg-[#6f5353]/40 px-3 py-2 text-xs font-semibold text-[#f2dede] hover:bg-[#6f5353]/55"
                  >
                    Remove Collaborator
                  </PrimaryButton>
                </div>
              </PremiumCard>
            ))}

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Event Access Cards</SectionTitle>
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
            {!canManageGuestRequests && (
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">
                  {effectiveRole} role can view guest requests, but management actions are limited.
                </p>
              </PremiumCard>
            )}
            <PremiumCard>
              <div className="flex items-center justify-between gap-2">
                <SectionTitle className="text-[#e9d5a8]">Guest Requests</SectionTitle>
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                  <PrimaryButton
                    onClick={() => setGuestRequestView("admin")}
                    className={`px-2.5 py-1.5 text-[11px] ${
                      guestRequestView === "admin"
                        ? "bg-[#c9a35c]/25 text-[#f5e6c8]"
                        : "bg-transparent text-zinc-500"
                    }`}
                  >
                    Couple / Admin
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setGuestRequestView("guest")}
                    className={`px-2.5 py-1.5 text-[11px] ${
                      guestRequestView === "guest"
                        ? "bg-[#c9a35c]/25 text-[#f5e6c8]"
                        : "bg-transparent text-zinc-500"
                    }`}
                  >
                    Guest View
                  </PrimaryButton>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Switch views to test the public request flow versus couple review.
              </p>
            </PremiumCard>

            {guestRequestView === "admin" ? (
              <>
                <PremiumCard>
                  <SectionTitle className="text-zinc-100">Public Request Link</SectionTitle>
                  <p className="mt-2 text-xs text-zinc-400">
                    {effectiveGuestRequestMessage}
                  </p>
                  <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-[#e9d5a8]">
                    cutmasterplanning.com/request/alex-jordan
                  </div>
                </PremiumCard>

                <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
                  <SectionTitle className="text-[#e9d5a8]">Guest Requests Assistant</SectionTitle>
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

                <PremiumCard>
                  <SectionTitle className="text-zinc-100">Guest-Submitted Songs</SectionTitle>
                  <div className="mt-3 space-y-3">
                    {guestRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_4px_14px_rgba(0,0,0,0.28)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              {request.songTitle}
                              {request.artist ? (
                                <span className="font-normal text-zinc-400">
                                  {" "}
                                  - {request.artist}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] text-zinc-400">
                              Requested by {request.guestName}
                            </p>
                            {request.dedication ? (
                              <p className="mt-2 text-xs text-zinc-500 italic">
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
                            className="flex-1 min-w-[6rem] rounded-lg bg-[#c9a35c]/20 px-3 py-2 text-xs text-[#f5e6c8] hover:bg-[#c9a35c]/30 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Approve
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => setGuestRequestStatus(request.id, "Rejected")}
                            disabled={!canManageGuestRequests || request.status === "Rejected"}
                            className="flex-1 min-w-[6rem] rounded-lg bg-[#6f5353]/40 px-3 py-2 text-xs text-[#f2dede] hover:bg-[#6f5353]/55 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Reject
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => setGuestRequestStatus(request.id, "Pending")}
                            disabled={!canManageGuestRequests || request.status === "Pending"}
                            className="flex-1 min-w-[6rem] rounded-lg bg-white/10 px-3 py-2 text-xs text-zinc-200 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="flex-1 min-w-[8rem] rounded-lg border border-[#c9a35c]/30 bg-[#c9a35c]/10 px-3 py-2 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                </PremiumCard>
              </>
            ) : (
              <PremiumCard>
                <SectionTitle className="text-[#e9d5a8]">Request a Song</SectionTitle>
                <p className="mt-2 text-xs text-zinc-400">
                  {effectiveGuestRequestMessage}
                </p>
                {guestSubmitBanner ? (
                  <p className="mt-3 rounded-xl bg-[#c9a35c]/15 px-3 py-2 text-xs text-[#f5e6c8]">
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
                    className="w-full bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
                  >
                    Submit Request
                  </PrimaryButton>
                </div>
              </PremiumCard>
            )}
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Ceremony" && sectionCeremonyEnabled && (
          <section className={`mt-6 ${isCoupleView ? "space-y-5" : "space-y-3"}`}>
            {!isCoupleView && (
              <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
                <SectionTitle className="text-[#e9d5a8]">Ceremony Assistant</SectionTitle>
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
              <SectionTitle className="text-[#e9d5a8]">Ceremony Details</SectionTitle>
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

            <PremiumCard>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SectionTitle className="text-[#e9d5a8]">Ceremony Timeline</SectionTitle>
                  <p className="mt-1 text-xs text-zinc-500">
                    Add, edit, and reorder ceremony moments with songs and cues.
                  </p>
                </div>
                <PrimaryButton
                  onClick={openCreateCeremonyTimelineModal}
                  disabled={!canEditTimeline}
                  className="rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110 disabled:opacity-45"
                >
                  Add Ceremony Moment
                </PrimaryButton>
              </div>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ceremonyPresetsForActiveEvent.map((preset) => (
                    <PrimaryButton
                      key={`ceremony-preset-${preset.id}`}
                      onClick={() => addCeremonyPreset(preset)}
                      disabled={!canEditTimeline}
                      className="rounded-lg bg-white/10 px-2.5 py-2 text-[11px] text-zinc-200 hover:bg-white/15 disabled:opacity-45"
                    >
                      {preset.momentName}
                    </PrimaryButton>
                  ))}
                </div>
                {ceremonyTimelineItems.map((item, index) => {
                  const isDragging = draggingCeremonyTimelineId === item.id;
                  const isDropTarget =
                    dropTargetCeremonyTimelineId === item.id && draggingCeremonyTimelineId !== item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-200 ${isDragging ? "scale-[1.01] border-[#c9a35c]/55 shadow-[0_16px_36px_rgba(201,163,92,0.20)]" : ""} ${isDropTarget ? "ring-2 ring-[#c9a35c]/35" : ""}`}
                      onDragOver={(event) => {
                        if (!canEditTimeline || !draggingCeremonyTimelineId) return;
                        event.preventDefault();
                        if (draggingCeremonyTimelineId !== item.id) {
                          setDropTargetCeremonyTimelineId(item.id);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!canEditTimeline || !draggingCeremonyTimelineId) return;
                        reorderCeremonyTimelineItemToTarget(draggingCeremonyTimelineId, item.id);
                        setDraggingCeremonyTimelineId(null);
                        setDropTargetCeremonyTimelineId(null);
                      }}
                      onDragEnd={() => {
                        setDraggingCeremonyTimelineId(null);
                        setDropTargetCeremonyTimelineId(null);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-full">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <TextInput
                              id={`ceremony-inline-time-${item.id}`}
                              label="Time / Order"
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
                              label="Song Title"
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
                          {item.needsDjMcAttention ? (
                            <span className="mt-2 inline-flex rounded-full bg-[#c9a35c]/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#f5e6c8]">
                              DJ/MC Attention
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          draggable={canEditTimeline}
                          onDragStart={(event) => {
                            if (!canEditTimeline) return;
                            event.dataTransfer.effectAllowed = "move";
                            setDraggingCeremonyTimelineId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggingCeremonyTimelineId(null);
                            setDropTargetCeremonyTimelineId(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a35c]/55 bg-gradient-to-b from-[#c9a35c]/25 to-[#c9a35c]/10 px-3 py-2 text-[11px] font-semibold text-[#f5e6c8] transition hover:border-[#c9a35c]/70 hover:bg-[#c9a35c]/30 active:scale-[0.98] disabled:opacity-50"
                          disabled={!canEditTimeline}
                        >
                          <span className="text-[10px] tracking-wide text-[#e9d5a8]">::</span>
                          <span>Reorder</span>
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <PrimaryButton
                          onClick={() => moveCeremonyTimelineItem(item.id, "up")}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Move Up
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => moveCeremonyTimelineItem(item.id, "down")}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Move Down
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => openEditCeremonyTimelineModal(item)}
                          disabled={!canEditTimeline}
                          className="bg-[#c9a35c]/20 px-3 py-2 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                        >
                          Edit
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => deleteCeremonyTimelineItem(item.id)}
                          disabled={!canEditTimeline}
                          className="bg-[#6f5353]/40 px-3 py-2 text-[11px] text-[#f2dede] hover:bg-[#6f5353]/55"
                        >
                          Delete
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => duplicateCeremonyTimelineItem(item)}
                          disabled={!canEditTimeline}
                          className="bg-white/10 px-3 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                        >
                          Duplicate
                        </PrimaryButton>
                      </div>
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                        Item {index + 1} of {ceremonyTimelineItems.length}
                      </p>
                    </div>
                  );
                })}
                {ceremonyTimelineItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#c9a35c]/40 bg-gradient-to-b from-[#18181d] to-[#111115] p-4 text-center">
                    <p className="text-sm font-semibold text-[#f5e6c8]">
                      No ceremony moments yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Add your first moment to build a clean ceremony cue sheet.
                    </p>
                  </div>
                ) : null}
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" &&
          appMode === "event" &&
          (activeScreen === "Formal Dances" || activeScreen === "Reception Formalities") &&
          sectionFormalitiesEnabled && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/30 bg-gradient-to-b from-[#1d1a14]/90 to-[#141419]">
              <SectionTitle className="text-[#e9d5a8]">Special moments moved to your timeline</SectionTitle>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Formal dances and spotlight moments are edited in the Reception Timeline—same song,
                notes, and DJ cues, without switching screens.
              </p>
              <PrimaryButton
                type="button"
                onClick={() =>
                  setActiveScreen(
                    receptionHubEligibleNav ? "Reception Timeline" : "Timeline",
                  )
                }
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110 sm:w-auto"
              >
                Open reception timeline
              </PrimaryButton>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Notes" && (
          <section className="mt-6 space-y-3">
            {!canEditNotes && (
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">
                  {effectiveRole} role can view notes, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
            <PremiumCard>
              <SectionTitle className="text-zinc-100">Planner Notes</SectionTitle>
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
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
              <div className="flex items-center justify-between gap-2">
                <SectionTitle className="text-[#e9d5a8]">Vendor Collaboration</SectionTitle>
                <PrimaryButton
                  onClick={openAddVendorModal}
                  className="rounded-xl bg-[#c9a35c]/20 px-3 py-2 text-xs text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                >
                  Add Vendor
                </PrimaryButton>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Keep contacts, arrival timing, and coordination details aligned across your event team.
              </p>
              {vendorStatus && (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                    vendorStatus.kind === "success"
                      ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                      : "border border-rose-400/25 bg-rose-500/10 text-rose-100"
                  }`}
                >
                  {vendorStatus.message}
                </p>
              )}
            </PremiumCard>

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Vendor Arrival Timeline</SectionTitle>
              <div className="mt-3 space-y-2">
                {vendors
                  .filter((vendor) => vendor.arrivalTime.trim())
                  .sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))
                  .map((vendor) => (
                    <div key={`arrival-${vendor.id}`} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-300">
                      <span className="text-zinc-100">{vendor.arrivalTime}</span> - {vendor.companyName} ({vendor.vendorType})
                    </div>
                  ))}
                {vendors.filter((vendor) => vendor.arrivalTime.trim()).length === 0 && (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
                    Add arrival times to build your vendor timeline.
                  </p>
                )}
              </div>
            </PremiumCard>

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Coordination Notes</SectionTitle>
              <div className="mt-3 space-y-2">
                {vendors
                  .filter((vendor) => vendor.specialCoordinationNotes.trim())
                  .map((vendor) => (
                    <div key={`coord-${vendor.id}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <p className="text-zinc-100">{vendor.companyName}</p>
                      <p className="mt-1 text-zinc-400">{vendor.specialCoordinationNotes}</p>
                    </div>
                  ))}
                {vendors.filter((vendor) => vendor.specialCoordinationNotes.trim()).length === 0 && (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
                    No special coordination notes yet.
                  </p>
                )}
              </div>
            </PremiumCard>

            {VENDOR_TYPES.map((type) => (
              <PremiumCard key={`vendor-type-${type}`}>
                <SectionTitle className="text-[#e9d5a8]">{type}</SectionTitle>
                <div className="mt-3 space-y-2">
                  {vendorsByType[type].map((vendor) => (
                    <div key={`vendor-card-${vendor.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">{vendor.companyName}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {vendor.contactName || "No contact"} {vendor.email ? `· ${vendor.email}` : ""} {vendor.phone ? `· ${vendor.phone}` : ""}
                          </p>
                          {vendor.notes && <p className="mt-1 text-xs text-zinc-500">{vendor.notes}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <PrimaryButton
                            onClick={() => openEditVendorModal(vendor)}
                            className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            Edit
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => deleteVendor(vendor.id)}
                            className="rounded-lg bg-[#6f5353]/40 px-2 py-1.5 text-[11px] text-[#f2dede] hover:bg-[#6f5353]/55"
                          >
                            Delete
                          </PrimaryButton>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {vendor.email && (
                          <PrimaryButton
                            onClick={() => window.open(`mailto:${vendor.email}`, "_blank")}
                            className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            Email
                          </PrimaryButton>
                        )}
                        {vendor.phone && (
                          <PrimaryButton
                            onClick={() => window.open(`tel:${vendor.phone}`, "_blank")}
                            className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            Call
                          </PrimaryButton>
                        )}
                        {(vendor.email || vendor.phone) && (
                          <PrimaryButton
                            onClick={async () => {
                              const text = `${vendor.companyName}\n${vendor.contactName}\n${vendor.email}\n${vendor.phone}`.trim();
                              try {
                                await navigator.clipboard.writeText(text);
                                setVendorStatus({ kind: "success", message: `Copied contact info for ${vendor.companyName}.` });
                              } catch {
                                setVendorStatus({ kind: "error", message: "Could not copy contact info." });
                              }
                            }}
                            className="rounded-lg bg-[#c9a35c]/20 px-2 py-2 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                          >
                            Copy Contact
                          </PrimaryButton>
                        )}
                        {vendor.website && (
                          <PrimaryButton
                            onClick={() => window.open(vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`, "_blank")}
                            className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            Website
                          </PrimaryButton>
                        )}
                        {vendor.instagram && (
                          <PrimaryButton
                            onClick={() =>
                              window.open(
                                vendor.instagram.startsWith("http")
                                  ? vendor.instagram
                                  : `https://instagram.com/${vendor.instagram.replace(/^@/, "")}`,
                                "_blank",
                              )
                            }
                            className="rounded-lg bg-white/10 px-2 py-2 text-[11px] text-zinc-200 hover:bg-white/15"
                          >
                            Instagram
                          </PrimaryButton>
                        )}
                      </div>
                    </div>
                  ))}
                  {vendorsByType[type].length === 0 && (
                    <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
                      No {type.toLowerCase()} vendor added yet.
                    </p>
                  )}
                </div>
              </PremiumCard>
            ))}
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Event Prep" && (
          <section className="mt-6 space-y-3 print-doc">
            <PremiumCard className="no-print">
              <SectionTitle className="text-[#e9d5a8]">Document Options</SectionTitle>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {sectionMusicNotesEnabled ? (
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventShowMusicNotes: !prev.liveEventShowMusicNotes,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventShowMusicNotes ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventShowMusicNotes ? "Hide Music Notes" : "Show Music Notes"}
                </PrimaryButton>
                ) : null}
                {sectionDoNotPlayEnabled ? (
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventShowDoNotPlay: !prev.liveEventShowDoNotPlay,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventShowDoNotPlay ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventShowDoNotPlay ? "Hide Do Not Play" : "Show Do Not Play"}
                </PrimaryButton>
                ) : null}
                {sectionVendorContactsEnabled ? (
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventShowVendorContacts: !prev.liveEventShowVendorContacts,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventShowVendorContacts ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventShowVendorContacts ? "Hide Vendor Contacts" : "Show Vendor Contacts"}
                </PrimaryButton>
                ) : null}
                {sectionMcScriptEnabled ? (
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventShowMcScript: !prev.liveEventShowMcScript,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventShowMcScript ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventShowMcScript ? "Hide MC Script" : "Show MC Script"}
                </PrimaryButton>
                ) : null}
                {sectionPlaylistsEnabled ? (
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventShowPlaylists: !prev.liveEventShowPlaylists,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventShowPlaylists ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventShowPlaylists ? "Hide Playlists" : "Show Playlists"}
                </PrimaryButton>
                ) : null}
                {sectionGuestRequestsEnabled ? (
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventShowGuestRequests: !prev.liveEventShowGuestRequests,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventShowGuestRequests ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventShowGuestRequests ? "Hide Guest Requests" : "Show Guest Requests"}
                </PrimaryButton>
                ) : null}
                {sectionPlanningQuestionsEnabled ? (
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventShowPlanningQuestions: !prev.liveEventShowPlanningQuestions,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventShowPlanningQuestions ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventShowPlanningQuestions ? "Hide Planning Q&A" : "Show Planning Q&A"}
                </PrimaryButton>
                ) : null}
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventCompactMode: !prev.liveEventCompactMode,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventCompactMode ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventCompactMode ? "Compact Mode: On" : "Compact Mode"}
                </PrimaryButton>
                <PrimaryButton
                  onClick={() =>
                    setEventSettings((prev) => ({
                      ...prev,
                      liveEventLargePrintMode: !prev.liveEventLargePrintMode,
                    }))
                  }
                  className={`w-full ${eventSettings.liveEventLargePrintMode ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                >
                  {eventSettings.liveEventLargePrintMode ? "Large Print: On" : "Large Print Mode"}
                </PrimaryButton>
              </div>
            </PremiumCard>
            <div
              className={`doc-sheet ${eventSettings.liveEventCompactMode ? "doc-mode-compact" : ""} ${eventSettings.liveEventLargePrintMode ? "doc-mode-large-print" : ""}`}
            >
              <div className="no-print mb-3 grid grid-cols-3 gap-2">
                <PrimaryButton onClick={() => window.print()} className="w-full bg-zinc-900 text-white hover:bg-zinc-800">Print Event Prep</PrimaryButton>
                <PrimaryButton onClick={() => window.print()} className="w-full bg-zinc-700 text-white hover:bg-zinc-600">Export / Save as PDF</PrimaryButton>
                <PrimaryButton onClick={copyLiveEventText} className="w-full bg-zinc-200 text-zinc-900 hover:bg-zinc-300">Copy Plain Text</PrimaryButton>
              </div>
              {copyStatus === "copied" && <p className="doc-subtitle no-print">Text copied.</p>}
              {copyStatus === "error" && <p className="doc-subtitle no-print">Copy failed. Please try again.</p>}

              <p className="doc-title">Event Prep</p>
              <p className="doc-subtitle">
                {eventSettings.eventName || weddingDetails.couple || "TBD"} · {primaryPartyShortLabel}:{" "}
                {eventSettings.coupleNames || weddingDetails.couple || "TBD"} ·{" "}
                {eventSettings.weddingDate || weddingDetails.date || "TBD"}
              </p>

              <div className="doc-section print-break-avoid">
                <h3>Event overview</h3>
                <table className="doc-table">
                  <tbody>
                    <tr><th>Event</th><td>{eventSettings.eventName || weddingDetails.couple || "TBD"}</td><th>{primaryPartyShortLabel}</th><td>{eventSettings.coupleNames || weddingDetails.couple || "TBD"}</td></tr>
                    <tr><th>Date</th><td>{eventSettings.weddingDate || weddingDetails.date || "TBD"}</td><th>Venue</th><td>{eventSettings.venue || weddingDetails.venue || "TBD"}</td></tr>
                    <tr><th>Timezone</th><td>{effectiveTimezone || "TBD"}</td><th>Event type</th><td>{effectiveEventType || "TBD"}</td></tr>
                    <tr><th>Package</th><td>{eventSettings.packageName || "TBD"}</td><th>Assigned DJ</th><td>{getTeamMemberName(eventSettings.assignedDj || "")}</td></tr>
                  </tbody>
                </table>
              </div>

              {sectionPlanningQuestionsEnabled && eventSettings.liveEventShowPlanningQuestions && (
                <div className="doc-section print-break-avoid">
                  <h3>Planning Questions</h3>
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

              {sectionCeremonyEnabled && (
                <>
                  <p className="doc-subtitle no-print">Page 1: Event Overview + Ceremony Timeline</p>
                  <div className="doc-section">
                    <h3>Ceremony Timeline</h3>
                    <table className="doc-table">
                      <tbody>
                        <tr><th>Ceremony Start</th><td>{ceremonyStartTime || "TBD"}</td><th>Guest Arrival</th><td>{ceremonyGuestArrivalTime || "TBD"}</td></tr>
                        <tr><th>Location</th><td>{eventSettings.ceremonyLocation || eventSettings.venue || weddingDetails.venue || "TBD"}</td><th>Officiant</th><td>{officiantName || "TBD"}</td></tr>
                        <tr><th>Microphone Needs</th><td>{microphoneNeeds || "None"}</td><th>Ceremony Notes</th><td>{ceremonyNotes || "None"}</td></tr>
                      </tbody>
                    </table>
                    <table className="doc-table mt-2">
                      <thead>
                        <tr>
                          <th>Time / Order</th>
                          <th>Moment</th>
                          <th>Song</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ceremonyTimelineRows.map((row, index) => (
                          <tr key={`live-ceremony-row-${index}-${row.moment}`}>
                            <td>{row.order}</td>
                            <td>{row.moment}</td>
                            <td>{row.song}</td>
                            <td>{row.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {sectionReceptionTimelineEnabled && (
              <>
              <p className="doc-subtitle no-print">Page 2: {eventPrepReceptionHeading}</p>
              <div className="doc-section live-reception-page-break print-break-avoid">
                <h3>{eventPrepReceptionHeading}</h3>
                <table className="doc-table live-event-timeline-table">
                  <thead>
                    <tr>
                      <th className="text-[15px] font-bold leading-[1.25]">Time</th>
                      <th className="text-[15px] font-bold leading-[1.25]">Moment</th>
                      <th className="text-[12.5px] font-medium leading-[1.3]">Song</th>
                      <th className="text-[11.5px] font-medium leading-[1.35]">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedTimelineItems.map((item) => {
                      const formalitySource =
                        item.source === "formality"
                          ? formalities.find((f) => f.id === item.id)
                          : null;
                      const songLabel = formalitySource?.songTitle
                        ? `${formalitySource.songTitle}${formalitySource.artist ? ` - ${formalitySource.artist}` : ""}`
                        : "";
                      const songWithFade = songLabel
                        ? `${songLabel}${formalitySource?.fadeOutEarly ? ` (Fade ${formalitySource.fadeOutTimestamp || "TBD"})` : ""}`
                        : "-";
                      const notesLabel = [
                        item.notes || "",
                        formalitySource?.notes || "",
                        item.needsDjMcAttention ? "MC/DJ Attention" : "",
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <tr key={`live-timeline-${item.source}-${item.id}`}>
                          <td className="text-[15px] font-bold leading-[1.25]">{item.time || "TBD"}</td>
                          <td className="text-[15px] font-bold leading-[1.25]">{item.title}</td>
                          <td className="text-[12.5px] font-medium leading-[1.3]">{songWithFade}</td>
                          <td className="text-[11.5px] leading-[1.35]">{notesLabel || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
              )}
              {sectionFormalitiesEnabled && (
                <div className="doc-section print-break-avoid">
                  <h3>Formal Dances & Formalities</h3>
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Moment</th>
                        <th>Song</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formalities.map((item) => (
                        <tr key={`live-formality-${item.id}`}>
                          <td>{item.time || "TBD"}</td>
                          <td>{item.momentName || "Untitled"}</td>
                          <td>
                            {item.songTitle || "Song TBD"}
                            {item.artist ? ` - ${item.artist}` : ""}
                            {item.fadeOutEarly ? ` (Fade ${item.fadeOutTimestamp || "TBD"})` : ""}
                          </td>
                          <td>
                            {[
                              item.notes || "",
                              item.needsDjMcAttention ? "MC/DJ Attention" : "",
                              item.includeInTimeline ? "In timeline" : "",
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sectionMcScriptEnabled && eventSettings.liveEventShowMcScript && (
                <div className="doc-section"><h3>{eventPrepMcHeading}</h3><p>{mcAnnouncements || "None"}</p></div>
              )}
              {sectionVendorContactsEnabled && eventSettings.liveEventShowVendorContacts && (
                <div className="doc-section"><h3>Vendor Contacts</h3><table className="doc-table"><thead><tr><th>Type</th><th>Company</th><th>Contact</th></tr></thead><tbody>{vendors.map((vendor) => <tr key={`live-vendor-${vendor.id}`}><td>{vendor.vendorType}</td><td>{vendor.companyName}</td><td>{vendor.contactName || "No Contact"}{vendor.phone ? ` · ${vendor.phone}` : ""}{vendor.email ? ` · ${vendor.email}` : ""}</td></tr>)}</tbody></table></div>
              )}
              {sectionPlaylistsEnabled && eventSettings.liveEventShowPlaylists && (
                <>
                  <p className="doc-subtitle no-print">Page 3+: Playlists</p>
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
                </>
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
              {sectionDoNotPlayEnabled && eventSettings.liveEventShowDoNotPlay && (
                <div className="doc-section"><h3>Do Not Play List</h3><ul>{doNotPlaySongs.map((song) => <li key={`live-dnp-${song.id}`}>{song.title}{song.artist ? ` - ${song.artist}` : ""}</li>)}</ul></div>
              )}
              {sectionMusicNotesEnabled && eventSettings.liveEventShowMusicNotes && (
                <div className="doc-section">
                  <h3>Music Notes</h3>
                  {layoutProfileForActiveEvent === "School Dance" ? (
                    <p className="doc-note mb-2 text-[11px] leading-snug text-zinc-600">Clean edits and school-appropriate selections.</p>
                  ) : null}
                  <p className="doc-note mb-1 font-medium text-zinc-700">Overall vibe</p>
                  <p className="mb-3">{generalDjNotes || "None"}</p>
                  {(musicVibeDetail.genres ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700">Genres / eras: </span>
                      {musicVibeDetail.genres}
                    </p>
                  ) : null}
                  {(musicVibeDetail.energy ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700">Energy: </span>
                      {musicVibeDetail.energy}
                    </p>
                  ) : null}
                  {(musicVibeDetail.crowdNotes ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700">Crowd: </span>
                      {musicVibeDetail.crowdNotes}
                    </p>
                  ) : null}
                  {(musicVibeDetail.cleanMusicPrefs ?? "").trim() ? (
                    <p className="mb-2">
                      <span className="font-medium text-zinc-700">
                        {layoutProfileForActiveEvent === "School Dance" ? "Clean selections: " : "Clean / content: "}
                      </span>
                      {musicVibeDetail.cleanMusicPrefs}
                    </p>
                  ) : null}
                </div>
              )}
              <div className="doc-section"><h3>Important DJ Notes</h3><p className="doc-note">{eventSettings.internalNotes || "None"}</p></div>
              {(eventSettings.clientFacingNotes ?? "").trim() ? (
                <div className="doc-section"><h3>Client-facing notes</h3><p className="doc-note">{eventSettings.clientFacingNotes}</p></div>
              ) : null}
              <div className="doc-section"><h3>Prep footer</h3><p>{effectivePrepSheetFooter}</p></div>
            </div>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Event Settings" && (
          <section className="mt-6 space-y-3">
            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Event Type & Sections</SectionTitle>
              <p className="mt-2 text-xs text-zinc-400">
                Event Type is the primary workflow selector. It applies defaults, then you can fine-tune section visibility. Hiding a
                section only tucks it out of the way; your data stays in the file.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="event-layout-profile" className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
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
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
                  >
                    {EVENT_TYPES.map((profile) => (
                      <option key={`layout-profile-${profile}`} value={profile} className="bg-[#141419] text-zinc-100">
                        {profile}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
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
                    className="mt-3 w-full rounded-xl border border-white/12 bg-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
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
                    { key: "sectionFormalitiesEnabled", label: "Formalities" },
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
                        className={`w-full ${enabled ? "bg-[#c9a35c]/20 text-[#f5e6c8]" : "bg-white/10 text-zinc-300"}`}
                      >
                        {enabled ? `Hide ${item.label}` : `Show ${item.label}`}
                      </PrimaryButton>
                    );
                  })}
                </div>
              </div>
            </PremiumCard>
            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Event Settings</SectionTitle>
              <p className="mt-2 text-xs text-zinc-400">
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
                    className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
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
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={`event-type-setting-${type}`} value={type} className="bg-[#141419] text-zinc-100">
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
                    className="text-[11px] uppercase tracking-[0.12em] text-zinc-400"
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
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
                  >
                    <option value="" className="bg-[#141419] text-zinc-100">
                      Select a DJ
                    </option>
                    {activeDjTeamMembers.map((member) => (
                      <option key={member.id} value={member.id} className="bg-[#141419] text-zinc-100">
                        {member.name}
                      </option>
                    ))}
                  </select>
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
                <div className="rounded-xl bg-white/5 p-3 text-xs text-zinc-400">
                  Collaborators are event-specific and managed in the Collaborators screen.
                </div>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Planning Checklist" && sectionPlanningChecklistEnabled && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/25 bg-gradient-to-b from-[#1b1b21] to-[#141419]">
              <div className="flex items-center justify-between">
                <SectionTitle className="text-[#e9d5a8]">Planning Checklist</SectionTitle>
                <span className="rounded-full bg-[#c9a35c]/20 px-2.5 py-1 text-xs font-semibold text-[#f5e6c8]">
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
                    <SectionTitle className="text-zinc-100">{task.title}</SectionTitle>
                    <p className="mt-1 text-xs text-zinc-400">{task.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ${
                      task.status === "Complete"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : task.status === "In Progress"
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-white/10 text-zinc-300"
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
                      className="text-[11px] uppercase tracking-wide text-zinc-400"
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
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100"
                    >
                      {(["Not Started", "In Progress", "Complete"] as ChecklistStatus[]).map(
                        (status) => (
                          <option key={`${task.id}-${status}`} value={status} className="bg-[#141419]">
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
                    className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
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
            {isCoupleView && (
              <div className="no-print">
                <PrimaryButton
                  type="button"
                  onClick={() => setActiveScreen("Dashboard")}
                  className="w-full justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-[#f5e6c8] transition hover:border-[#c9a35c]/35 hover:bg-white/10 sm:inline-flex sm:w-auto"
                >
                  ← Back to Event
                </PrimaryButton>
              </div>
            )}
            <PremiumCard className="border-[#c9a35c]/25 bg-gradient-to-b from-[#1b1b21] to-[#141419]">
              <SectionTitle className="text-[#e9d5a8]">Planning Questions</SectionTitle>
              <p className="mt-2 text-xs text-zinc-400">
                Prompts match your event type and are grouped by topic. Expand a section to answer or edit—responses save with this event and can surface in Event Prep when that block is turned on.
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Event Type · {layoutProfileForActiveEvent}
              </p>
            </PremiumCard>
            {planningQuestionsForEvent.length === 0 ? (
              <PremiumCard className="border-dashed border-white/15 bg-white/[0.03]">
                <p className="text-sm text-zinc-400">
                  No planning questions are configured for this event type yet.
                </p>
              </PremiumCard>
            ) : (
              <div className="space-y-3">
                {planningQuestionsGroupedBySection.map((row) => {
                  const pct = computePlanningQuestionGroupCompletion(
                    row.questions,
                    eventSettings.planningQuestionAnswers,
                  );
                  const isExpanded = expandedPlanningQuestionGroups[row.group.id] ?? true;
                  return (
                    <PremiumCard
                      key={`pq-group-${row.group.id}`}
                      className="border-white/12 bg-gradient-to-br from-white/[0.05] to-transparent"
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
                          <p className="text-base font-semibold text-[#f5e6c8]">{row.group.label}</p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {pct}% answered · {row.questions.length}{" "}
                            {row.questions.length === 1 ? "question" : "questions"}
                          </p>
                          <div className="mt-2 h-1.5 max-w-full overflow-hidden rounded-full bg-zinc-800/90 sm:max-w-xs">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#8f6b2f] via-[#c9a35c] to-[#e9d5a8]"
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
            <PremiumCard className="border-[#c9a35c]/25 bg-gradient-to-b from-[#1b1b21] to-[#141419]">
              <div className="flex items-center justify-between">
                <SectionTitle className="text-[#e9d5a8]">Notification Center</SectionTitle>
                <span className="rounded-full bg-[#c9a35c]/20 px-2.5 py-1 text-xs font-semibold text-[#f5e6c8]">
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
                      "song_added",
                      "guest_request_submitted",
                      "guest_request_reviewed",
                      "ceremony_updated",
                      "formality_updated",
                      "collaborator_invited",
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
              <PremiumCard key={`notice-${notice.id}`} className="border-[#c9a35c]/20">
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
                    <span className="rounded-full bg-[#c9a35c]/20 px-2 py-1 text-[10px] text-[#f5e6c8]">
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
            className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
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
                  className="w-full rounded-xl border border-white/15 bg-[#141419]/90 text-zinc-100 shadow-[0_10px_28px_rgba(0,0,0,0.35)] hover:border-[#c9a35c]/35 hover:bg-[#191920]"
                >
                  {action.label}
                </PrimaryButton>
              ))}
            </div>
            <PrimaryButton
              onClick={() => setQuickActionsOpen((prev) => !prev)}
              className={`rounded-2xl border border-[#c9a35c]/35 bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(143,107,47,0.35)] transition-transform ${
                quickActionsOpen ? "rotate-45" : ""
              }`}
            >
              +
            </PrimaryButton>
          </div>
        </>
      )}

      {teamModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 backdrop-blur lg:items-stretch lg:justify-end lg:p-5">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b14]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)] lg:h-full lg:max-w-lg lg:rounded-3xl">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-[#e9d5a8]">
                {teamEditingId ? "Edit Team Member" : "Add Team Member"}
              </SectionTitle>
              <PrimaryButton
                onClick={closeTeamMemberModal}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
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
                <label htmlFor="team-member-role" className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                  Role
                </label>
                <select
                  id="team-member-role"
                  value={teamRoleDraft}
                  disabled={!canManageEvents}
                  onChange={(event) => setTeamRoleDraft(event.target.value as "Admin" | "DJ" | "Planner")}
                  className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none disabled:opacity-60"
                >
                  {(["Admin", "DJ", "Planner"] as const).map((role) => (
                    <option key={`team-role-${role}`} value={role} className="bg-[#141419] text-zinc-100">
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
                className={`w-full rounded-xl px-3 py-2 text-xs ${
                  teamActiveDraft ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-zinc-300"
                }`}
              >
                {teamActiveDraft ? "Active Member" : "Inactive Member"}
              </PrimaryButton>
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={closeTeamMemberModal}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs text-zinc-200 hover:bg-white/15"
                >
                  {teamEditingId ? "Cancel Edit" : "Cancel"}
                </PrimaryButton>
                <PrimaryButton
                  onClick={saveTeamMember}
                  disabled={!canManageEvents}
                  className="rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                >
                  {teamEditingId ? "Save Changes" : "Add Team Member"}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b14]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-[#e9d5a8]">Invite Collaborator</SectionTitle>
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
                className="w-full rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
              >
                Send Invite
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b14]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-[#e9d5a8]">
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
                Saves current timeline, formalities, and planning suggestions.
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
                className="w-full rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
              >
                {templateModalMode === "new" ? "Save" : "Update"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {authStage === "app" && canManageEvents && eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur sm:items-center sm:p-5">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b14]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)] cm-section-enter sm:max-w-2xl sm:max-h-[88vh] sm:overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-[#e9d5a8]">
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
                  className="mt-1 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
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
                      Event Prep Default Sections
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
                        <span className="text-[#c9a35c]" aria-hidden>
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
                  className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
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
                className="w-full rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
              >
                {eventModalMode === "new" ? "Create Event" : "Save Changes"}
              </PrimaryButton>
            </div>
            </form>
          </div>
        </div>
      )}

      {vendorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 backdrop-blur sm:items-center sm:p-5">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b14]/95 shadow-[0_20px_80px_rgba(0,0,0,0.6)] sm:max-w-2xl sm:max-h-[90vh]">
            <div className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-[#e9d5a8]">
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
                  <label htmlFor="vendor-type" className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                    Vendor Type
                  </label>
                  <select
                    id="vendor-type"
                    value={vendorTypeDraft}
                    onChange={(event) => setVendorTypeDraft(event.target.value as VendorType)}
                    className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
                  >
                    {VENDOR_TYPES.map((type) => (
                      <option key={`vendor-type-option-${type}`} value={type} className="bg-[#141419] text-zinc-100">
                        {type}
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

              <div className="shrink-0 border-t border-white/10 bg-[#0b0b14]/95 px-5 py-3">
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
                    className="rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                  >
                    Save Vendor
                  </PrimaryButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {ceremonyTimelineModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 backdrop-blur sm:items-center sm:p-5">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b14]/95 shadow-[0_20px_80px_rgba(0,0,0,0.6)] sm:max-w-2xl sm:max-h-[90vh]">
            <div className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-[#e9d5a8]">
                  {ceremonyTimelineEditingId ? "Edit Ceremony Moment" : "Add Ceremony Moment"}
                </SectionTitle>
                <PrimaryButton
                  onClick={() => {
                    setCeremonyTimelineModalOpen(false);
                    resetCeremonyTimelineDraft();
                  }}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
                >
                  Close
                </PrimaryButton>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveCeremonyTimelineItem();
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="space-y-3 overflow-y-auto px-5 py-4">
                <TextInput
                  id="ceremony-timeline-time-order"
                  label="Time / Order"
                  value={ceremonyTimelineDraftTimeOrOrder}
                  onChange={setCeremonyTimelineDraftTimeOrOrder}
                  placeholder="e.g. 3:30 PM or Prelude"
                />
                <TextInput
                  id="ceremony-timeline-moment"
                  label="Moment Name"
                  value={ceremonyTimelineDraftMoment}
                  onChange={setCeremonyTimelineDraftMoment}
                    placeholder="e.g. Processional"
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    id="ceremony-timeline-song-title"
                    label="Song Title"
                    value={ceremonyTimelineDraftSongTitle}
                    onChange={setCeremonyTimelineDraftSongTitle}
                    placeholder="Song title"
                  />
                  <TextInput
                    id="ceremony-timeline-artist"
                    label="Artist"
                    value={ceremonyTimelineDraftArtist}
                    onChange={setCeremonyTimelineDraftArtist}
                    placeholder="Artist"
                  />
                </div>
                <TextArea
                  id="ceremony-timeline-notes"
                  label="Notes"
                  value={ceremonyTimelineDraftNotes}
                  onChange={setCeremonyTimelineDraftNotes}
                  placeholder="Cue notes, transitions, and callouts..."
                  rows={3}
                />
                <PrimaryButton
                  type="button"
                  onClick={() => setCeremonyTimelineDraftNeedsAttention((prev) => !prev)}
                  className={`w-full ${
                    ceremonyTimelineDraftNeedsAttention
                      ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {ceremonyTimelineDraftNeedsAttention
                    ? "DJ/MC Attention Required"
                    : "Mark as DJ/MC Attention"}
                </PrimaryButton>
              </div>
              <div className="shrink-0 border-t border-white/10 bg-[#0b0b14]/95 px-5 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      setCeremonyTimelineModalOpen(false);
                      resetCeremonyTimelineDraft();
                    }}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs text-zinc-200 hover:bg-white/15"
                  >
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                  >
                    {ceremonyTimelineEditingId ? "Save Changes" : "Add Moment"}
                  </PrimaryButton>
                </div>
              </div>
            </form>
          </div>
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
