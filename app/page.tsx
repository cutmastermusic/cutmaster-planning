"use client";

import { EventModalContent } from "@/components/events/EventModalContent";
import { EventModalBody } from "@/components/events/EventModalBody";
import { EventInternalNotesField } from "@/components/events/EventInternalNotesField";
import { EventBasicDetailsFields } from "@/components/events/EventBasicDetailsFields";
import { EventLocationsFields } from "@/components/events/EventLocationsFields";
import { EventAssignedDjField } from "@/components/events/EventAssignedDjField";
import { EventPlannerFields } from "@/components/events/EventPlannerFields";
import { EventModalStatus } from "@/components/events/EventModalStatus";
import { EventModalActions } from "@/components/events/EventModalActions";
import { EventTypeSection } from "@/components/events/EventTypeSection";
import { EventModalForm } from "@/components/events/EventModalForm";
import { EventModal } from "@/components/events/EventModal";
/**
 * Server Actions are imported through `eventsClient` wrappers so every call
 * is size-checked before being placed on the wire. This surfaces the
 * exact offending field if a payload approaches the Next.js Server Action
 * body limit (~1 MB), instead of failing with a cryptic 413.
 */
import {
  createEventGuarded as createDatabaseEvent,
  getEvents as getDatabaseEvents,
  updateEventGuarded as updateDatabaseEvent,
  replaceGuestRequestsGuarded as replaceGuestRequests,
  replaceEventTeamMembersGuarded as replaceEventTeamMembers,
  replaceEventNotesGuarded as replaceEventNotes,
  replaceMainTimelineItemsGuarded as replaceMainTimelineItems,
  replaceCeremonyTimelineItemsGuarded as replaceCeremonyTimelineItems,
  replaceEventSongsGuarded as replaceEventSongs,
  updateGrandEntranceDetailGuarded as updateGrandEntranceDetail,
} from "@/lib/actions/eventsClient";
import {
  EVENT_STATUSES,
  eventStatusPillClassOnCover,
  eventStatusPillClassOnLight,
  isArchivedEventStatus,
  normalizeEventStatus,
} from "@/lib/eventStatus";
import {
  Fragment,
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
  cmAppShellClass,
  EventHomeNav,
  EventNavSegmented,
  InsightStack,
  PersistEcho,
  PersistMobileChip,
  PremiumCard,
  PrimaryButton,
  SectionEmptyState,
  SectionTitle,
  SongCard,
  TextArea,
  TextInput,
  darkUiWorkspaceJumpButtonClass,
  lightUiCyanPrimaryButtonClass,
  lightUiDestructiveButtonClass,
  lightUiEmptyHintInCardClass,
  lightUiFormLabelClass,
  lightUiGhostButtonClass,
  lightUiInputClass,
  lightUiTextControlClass,
  lightUiListRowClass,
  lightUiSecondaryButtonClass,
  lightUiSectionCaptionClass,
  lightUiSelectClass,
  premiumFormSectionCardClass,
  workspaceSectionClass,
  workspaceSectionDashboardClass,
  workspaceSectionLooseClass,
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
import { MUSIC_GENRE_ERA_OPTIONS } from "@/data/musicGenreEraOptions";
import {
  MUSIC_TASTE_BEHAVIOR_OPTIONS,
  MUSIC_TASTE_CROWD_OPTIONS,
  MUSIC_TASTE_DANCE_FLOOR_OPTIONS,
  emptyMusicTasteProfile,
  musicTasteProfileHasSelections,
  normalizeMusicTasteProfile,
} from "@/data/musicTasteProfileCatalog";
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
  EventStatus,
  EventSettings,
  EventRecord,
  GuestRequestEntry,
  GuestRequestStatus,
  ChecklistDueDate,
  ChecklistStatus,
  PlanningQuestionAnswerType,
  PlanningQuestionDef,
  Screen,
  AuthStage,
  SharedPlaylistLink,
  SongEntry,
  SongListType,
  TimelineCategory,
  TimelineItem,
  TimelinePresetItem,
  TimelineTemplate,
  EventNote,
  TeamMember,
  TeamMemberRole,
  UserRole,
  Vendor,
  VendorAffiliation,
  VendorType,
  WeddingDetails,
  NotificationItem,
  MusicVibeDetail,
  MusicTasteProfile,
  PlaylistBucketId,
} from "@/types/planning";
import { PLAYLIST_BUCKET_IDS, PLAYLIST_BUCKET_LABELS } from "@/types/planning";
import {
  DEFAULT_EVENT_TEAM_VENDOR_ROLE,
  VENDOR_TYPES_ORDERED,
  canActorManageEventTeamMember,
  eventTeamRoleGroupsForActor,
  formatVendorContactLines,
  isCutmasterEventTeam,
  isInternalTeamRole,
  normalizeVendorsArray,
  smsHref,
  sortVendorsForEventDocument,
  teamMemberRoleLabel,
  vendorTypeLabel,
} from "@/utils/vendors";
import {
  approximatePlanningProgressPercent,
  buildPlanningInsights,
  cloneJson,
  insertCeremonyTimelineItemChronologically,
  insertReceptionTimelineItemChronologically,
  migrateFormalitiesIntoTimelineItems,
  normalizeEventRecordAfterFormalitiesMerge,
  readImageFileAsDataUrl,
  mainTimelineItemFromPreset,
  ceremonyTimelineItemFromPreset,
  mapCeremonyTimelineItemsForDatabase,
  mapDatabaseRowsToCeremonyTimelineItems,
  mapDatabaseRowsToMainTimelineItems,
  mapMainTimelineItemsForDatabase,
  dedupeSongEntries,
  receptionTimelineHasClockOrderConflict,
  sortTimelineItemsChronologically,
} from "@/utils/planning";
import {
  parsePastedTimelineText,
  timelineItemsFromImportDrafts,
  type PastedTimelineImportDraft,
} from "@/utils/timelinePasteImport";
import { buildCouplePlanningGaps } from "@/utils/couplePlanningGaps";
import {
  buildPlanningChecklist,
  CHECKLIST_DUE_OFFSET_PRESETS,
  DEFAULT_PLANNING_CHECKLIST_TEMPLATE,
  formatChecklistDueOffsetDescription,
  getDefaultChecklistDueDateSets,
  getDefaultChecklistDueDateSetsForProfiles,
  hasCeremonyMusic as computeCeremonyMusicComplete,
  hasEventDetailsComplete as computeEventDetailsComplete,
  hasFinalDjNotes as computeFinalDjNotesComplete,
  hasKeyFormalDanceSongs as computeKeyFormalDanceSongs,
  hasKeyTimelineMoments as computeKeyTimelineMoments,
  hasMusicTasteSignal as computeMusicTasteSignal,
  normalizeChecklistDueDatesRecord,
  planningChecklistCompletionPercent,
  shouldShowPlanningChecklistMissingNotes,
  templateDefaultDueDate,
  type PlanningChecklistDueConfig,
  type PlanningChecklistInput,
} from "@/lib/planningChecklist";
import { buildPlanningProgressChecks } from "@/utils/planningProgress";
import {
  buildNewWeddingCeremonyTimelineItems,
  buildNewWeddingMainTimelineItems,
} from "@/lib/weddingDefaultTimelineMoments";
import {
  isGrandEntranceTimelineItem,
  mergeGrandEntranceDbIntoPlanningAnswers,
  mergeGrandEntranceDetailIntoAnswers,
  readGrandEntranceDetail,
} from "@/lib/grandEntranceDetail";
import {
  buildRunOfShowDoneKeysFromTimeline,
  mergeLocalRunOfShowDoneKeysIntoTimeline,
  readLocalRunOfShowDoneKeysForEvent,
  RUN_OF_SHOW_DONE_STORAGE_KEY,
} from "@/lib/runOfShowDone";
import { EventHeroCover } from "@/components/event-hero-cover";
import { GrandEntranceDetailSheet, type GrandEntranceDetailDraft } from "@/components/grand-entrance-detail-sheet";
import { RunOfShowCardNote } from "@/components/run-of-show-card-note";
import { RunOfShowCardNoteEditor } from "@/components/run-of-show-card-note-editor";
import {
  appendRunOfShowStrokePoint,
  ensureRunOfShowAnnotationCanvas,
  paintRunOfShowInkIncrement,
  redrawRunOfShowCommittedStrokes,
  RUN_OF_SHOW_ANNOTATION_ENABLED,
  runOfShowAnnotationAcceptsPointer,
  runOfShowAnnotationStrokeWidth,
  runOfShowClientToContentCoords,
  type RunOfShowAnnotationStroke,
} from "@/lib/runOfShowAnnotations";
import {
  computePlanningQuestionGroupCompletion,
  groupPlanningQuestionsBySection,
} from "@/data/planningQuestionGroups";

/** Nested field block inside Planning Questions section groups — generous padding, clear vertical rhythm. */
const planningQuestionFieldShellClass =
  "rounded-xl border border-stone-200/95 bg-stone-50/90 px-5 py-5 shadow-none sm:px-6 sm:py-6";

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
  const helpBlock =
    (q.helpText ?? "").trim() ? (
      <p className="text-xs leading-relaxed text-stone-600">{q.helpText}</p>
    ) : null;

  if (q.answerType === "long_text") {
    return (
      <div className={planningQuestionFieldShellClass}>
        <div className="flex flex-col gap-4">
          <TextArea
            id={`planning-q-${q.id}`}
            label={`${q.label}${labelSuffix}`}
            value={value}
            onChange={onChange}
            rows={3}
            placeholder={q.placeholder ?? "Add notes…"}
            labelClassName={`block ${lightUiFormLabelClass}`}
          />
          {helpBlock ? <div className="border-t border-stone-200/80 pt-3">{helpBlock}</div> : null}
        </div>
      </div>
    );
  }

  if (q.answerType === "yes_no") {
    return (
      <div className={planningQuestionFieldShellClass}>
        <div className="flex flex-col gap-3.5">
          <label className={`block ${lightUiFormLabelClass}`}>
            {q.label}
            {labelSuffix}
          </label>
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`${lightUiSelectClass} !mt-0`}
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
          {helpBlock ? <div className="border-t border-stone-200/80 pt-3">{helpBlock}</div> : null}
        </div>
      </div>
    );
  }

  if (q.answerType === "multiple_choice") {
    return (
      <div className={planningQuestionFieldShellClass}>
        <div className="flex flex-col gap-3.5">
          <label className={`block ${lightUiFormLabelClass}`}>
            {q.label}
            {labelSuffix}
          </label>
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={`${lightUiSelectClass} !mt-0`}
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
          {helpBlock ? <div className="border-t border-stone-200/80 pt-3">{helpBlock}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={planningQuestionFieldShellClass}>
      <div className="flex flex-col gap-4">
        <TextInput
          id={`planning-q-${q.id}`}
          label={`${q.label}${labelSuffix}`}
          value={value}
          onChange={onChange}
          placeholder={q.placeholder ?? "Add answer…"}
          labelClassName={`block ${lightUiFormLabelClass}`}
        />
        {helpBlock ? <div className="border-t border-stone-200/80 pt-3">{helpBlock}</div> : null}
      </div>
    </div>
  );
}

const MUSIC_GENRE_ERA_ORDER = new Map(
  MUSIC_GENRE_ERA_OPTIONS.map((label, index) => [label, index]),
);

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

function musicHubScrollToSection(elementId: string) {
  document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function musicPlaylistLinkHost(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, "");
  } catch {
    const trimmed = url.trim();
    return trimmed.length > 36 ? `${trimmed.slice(0, 36)}…` : trimmed || "Link";
  }
}

type MusicHubPrepSnapshotProps = {
  playlistCount: number;
  mustPlayCount: number;
  playIfPossibleCount: number;
  doNotPlayCount: number;
  showMustPlay: boolean;
  showDoNotPlay: boolean;
};

function MusicHubPrepSnapshot({
  playlistCount,
  mustPlayCount,
  playIfPossibleCount,
  doNotPlayCount,
  showMustPlay,
  showDoNotPlay,
}: MusicHubPrepSnapshotProps) {
  const chips: Array<{
    id: string;
    label: string;
    count: number;
    shell: string;
  }> = [
    {
      id: "music-hub-playlist-links",
      label: "Playlist links",
      count: playlistCount,
      shell: "border-[#00D4FF]/35 bg-[#00D4FF]/10 hover:border-[#00D4FF]/55 hover:bg-[#00D4FF]/15",
    },
  ];
  if (showMustPlay) {
    chips.push(
      {
        id: "music-hub-must-play",
        label: "Must play",
        count: mustPlayCount,
        shell: "border-[#7E52A0]/30 bg-[#7E52A0]/[0.07] hover:border-[#7E52A0]/45 hover:bg-[#7E52A0]/[0.11]",
      },
      {
        id: "music-hub-play-if-possible",
        label: "Play if possible",
        count: playIfPossibleCount,
        shell: "border-emerald-300/80 bg-emerald-50/90 hover:border-emerald-400 hover:bg-emerald-50",
      },
    );
  }
  if (showDoNotPlay) {
    chips.push({
      id: "music-hub-do-not-play",
      label: "Do not play",
      count: doNotPlayCount,
      shell: "border-rose-300/70 bg-rose-50/70 hover:border-rose-400 hover:bg-rose-50",
    });
  }

  const totalSongs = mustPlayCount + playIfPossibleCount + doNotPlayCount;
  const summaryLine =
    playlistCount === 0 && totalSongs === 0
      ? "Nothing shared yet — start with a playlist link or a few must-plays."
      : [
          playlistCount > 0 ? `${playlistCount} playlist${playlistCount === 1 ? "" : "s"}` : null,
          mustPlayCount > 0 ? `${mustPlayCount} must-play${mustPlayCount === 1 ? "" : "s"}` : null,
          playIfPossibleCount > 0
            ? `${playIfPossibleCount} play-if-possible`
            : null,
          doNotPlayCount > 0 ? `${doNotPlayCount} blocked` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3.5 shadow-none sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Prep snapshot
          </p>
          <p className="mt-1 text-xs leading-snug text-stone-600">{summaryLine}</p>
        </div>
        <p className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-stone-400">
          Tap to jump
        </p>
      </div>
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => musicHubScrollToSection(chip.id)}
            className={`flex min-h-11 min-w-[7.25rem] shrink-0 flex-col items-start rounded-xl border px-3 py-2.5 text-left transition sm:min-h-10 ${chip.shell}`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600">
              {chip.label}
            </span>
            <span className="mt-0.5 text-lg font-semibold tabular-nums leading-none text-stone-950">
              {chip.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Event Packet Options: on = solid cyan + dark text; off = white + readable gray + border */
const EVENT_PACKET_SECTION_TOGGLE_ON =
  "w-full border border-stone-900/20 bg-[#00D4FF] text-stone-950 shadow-none hover:brightness-[1.02]";
const EVENT_PACKET_SECTION_TOGGLE_OFF =
  "w-full border border-stone-300 bg-white text-stone-700 shadow-none hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900";

const TIMELINE_DRAG_EDGE_PX = 76;
const TIMELINE_DRAG_SCROLL_STEP = 18;

const TIMELINE_DRAG_HANDLE_CLASS =
  "inline-flex min-h-12 w-full cursor-grab touch-none select-none items-center justify-center gap-2 rounded-lg border border-dashed border-stone-400/90 bg-stone-100/90 px-4 py-3 text-[13px] font-semibold text-stone-900 shadow-none transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out hover:border-stone-500 hover:bg-stone-200/90 active:cursor-grabbing active:scale-[0.99] disabled:opacity-50 max-md:min-h-11 max-md:rounded-md max-md:px-3.5 max-md:py-3 max-md:text-xs max-md:font-medium sm:min-h-11 sm:w-auto sm:px-4 sm:py-2.5 sm:text-[12px] md:min-w-[9rem] md:py-3 md:text-[13px] lg:min-h-9 lg:w-auto lg:shrink-0 lg:rounded-md lg:border-stone-300 lg:border-solid lg:bg-stone-50 lg:px-3 lg:py-2 lg:text-[11px] lg:font-medium lg:text-stone-700 lg:hover:bg-stone-100 xl:px-3.5 xl:text-xs";

function timelineReorderRowSurfaceClass(opts: {
  isDragging: boolean;
  isDropTarget: boolean;
  dragActive: boolean;
  zebra?: boolean;
}): string {
  const base =
    "touch-pan-y rounded-xl border-2 bg-white transition-[transform,box-shadow,opacity,border-color,background-color] duration-200 ease-out motion-reduce:transition-none";
  const zebra = opts.zebra ? "bg-stone-50" : "";
  if (opts.isDragging) {
    return `${base} ${zebra} z-10 scale-[1.02] border-stone-900 opacity-100 shadow-[0_14px_32px_rgba(15,23,42,0.14)] ring-1 ring-stone-900/10`;
  }
  if (opts.isDropTarget) {
    return `${base} ${zebra} border-[#00D4FF] bg-[#00D4FF]/[0.06] shadow-[0_0_0_1px_rgba(0,212,255,0.35)] ring-2 ring-[#00D4FF]/75 ring-offset-2 ring-offset-white`;
  }
  if (opts.dragActive) {
    return `${base} ${zebra} border-stone-200 opacity-[0.88]`;
  }
  return `${base} ${zebra} border-stone-300`;
}

function TimelineDragGripDots({ emphasized = false }: { emphasized?: boolean }) {
  return (
    <span
      className={`inline-grid shrink-0 grid-cols-2 gap-[3px] ${emphasized ? "opacity-100" : "opacity-80"}`}
      aria-hidden
    >
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className={`size-1 rounded-full ${emphasized ? "bg-stone-700" : "bg-stone-500"}`}
        />
      ))}
    </span>
  );
}

function TimelineDropTargetMarker() {
  return (
    <div className="mb-3 flex items-center gap-2 px-0.5" aria-hidden>
      <div className="h-1 flex-1 rounded-full bg-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.35)]" />
    </div>
  );
}

function insertTimelineItemAfterId<T extends { id: string }>(
  items: T[],
  afterId: string,
  newItem: T,
): T[] {
  const index = items.findIndex((row) => row.id === afterId);
  if (index === -1) return [...items, newItem];
  const next = [...items];
  next.splice(index + 1, 0, newItem);
  return next;
}

type TimelinePhaseSectionHeaderProps = {
  id: string;
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;
};

function TimelinePhaseSectionHeader({
  id,
  title,
  onAdd,
  addLabel,
  addDisabled,
}: TimelinePhaseSectionHeaderProps) {
  return (
    <div id={id} className={TIMELINE_SECTION_HEADER_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold tracking-tight text-stone-950 sm:text-lg">
          {title}
        </h3>
        {onAdd && addLabel ? (
          <PrimaryButton
            type="button"
            onClick={onAdd}
            disabled={addDisabled}
            className="min-h-10 w-auto shrink-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-[11px] font-semibold text-stone-900 shadow-none hover:border-[#00D4FF]/45 hover:bg-stone-50 disabled:opacity-45 sm:min-h-9 sm:px-3.5 sm:py-2 sm:text-[11px]"
          >
            {addLabel}
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}

type ReceptionTimelineMomentFormProps = {
  idPrefix: string;
  canEdit: boolean;
  anchorLabel?: string;
  timelineTime: string;
  setTimelineTime: (value: string) => void;
  timelineTitle: string;
  setTimelineTitle: (value: string) => void;
  timelineSongTitle: string;
  setTimelineSongTitle: (value: string) => void;
  timelineArtist: string;
  setTimelineArtist: (value: string) => void;
  timelineCategory: TimelineCategory;
  setTimelineCategory: (value: TimelineCategory) => void;
  timelineNotes: string;
  setTimelineNotes: (value: string) => void;
  timelineNeedsAttention: boolean;
  setTimelineNeedsAttention: (updater: (prev: boolean) => boolean) => void;
  composerError: string | null;
  setComposerError: (value: string | null) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
};

function ReceptionTimelineMomentForm({
  idPrefix,
  canEdit,
  anchorLabel,
  timelineTime,
  setTimelineTime,
  timelineTitle,
  setTimelineTitle,
  timelineSongTitle,
  setTimelineSongTitle,
  timelineArtist,
  setTimelineArtist,
  timelineCategory,
  setTimelineCategory,
  timelineNotes,
  setTimelineNotes,
  timelineNeedsAttention,
  setTimelineNeedsAttention,
  composerError,
  setComposerError,
  onCancel,
  onSubmit,
  submitLabel,
}: ReceptionTimelineMomentFormProps) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {anchorLabel ? (
        <p className="text-[11px] font-medium leading-snug text-stone-600">
          Adding after <span className="font-semibold text-stone-800">{anchorLabel}</span>
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput
          id={`${idPrefix}-timeline-time`}
          label="Time / order"
          value={timelineTime}
          onChange={setTimelineTime}
          placeholder="e.g. 6:30 PM (optional)"
          disabled={!canEdit}
        />
        <div className="space-y-0">
          <TextInput
            id={`${idPrefix}-timeline-title`}
            label="Moment"
            value={timelineTitle}
            onChange={(value) => {
              setTimelineTitle(value);
              setComposerError(null);
            }}
            placeholder="Required — e.g. Dinner service begins"
            disabled={!canEdit}
          />
          {composerError ? (
            <p className="mt-1.5 text-xs font-medium text-rose-700">{composerError}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput
          id={`${idPrefix}-timeline-song-title`}
          label="Song title"
          value={timelineSongTitle}
          onChange={setTimelineSongTitle}
          placeholder="Optional"
          disabled={!canEdit}
        />
        <TextInput
          id={`${idPrefix}-timeline-artist`}
          label="Artist"
          value={timelineArtist}
          onChange={setTimelineArtist}
          placeholder="Optional"
          disabled={!canEdit}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-timeline-category`} className={lightUiFormLabelClass}>
          Category
        </label>
        <select
          id={`${idPrefix}-timeline-category`}
          value={timelineCategory}
          disabled={!canEdit}
          onChange={(event) => setTimelineCategory(event.target.value as TimelineCategory)}
          className={lightUiSelectClass}
        >
          {timelineCategories.map((category) => (
            <option key={category} value={category} className="bg-white text-stone-900">
              {category}
            </option>
          ))}
        </select>
      </div>
      <TextArea
        id={`${idPrefix}-timeline-notes`}
        label="Notes / cues"
        value={timelineNotes}
        onChange={setTimelineNotes}
        placeholder="Production notes, MC guidance…"
        disabled={!canEdit}
      />
      <PrimaryButton
        type="button"
        onClick={() => setTimelineNeedsAttention((prev) => !prev)}
        disabled={!canEdit}
        className={`w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none ${timelineNeedsAttention
          ? "border-cyan-500/50 bg-cyan-50 text-stone-900"
          : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
          }`}
      >
        {timelineNeedsAttention ? "DJ/MC attention marked" : "Flag DJ/MC attention"}
      </PrimaryButton>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <PrimaryButton
          type="button"
          onClick={onCancel}
          disabled={!canEdit}
          className={`w-full border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-800 shadow-none hover:bg-stone-50 sm:w-auto sm:min-w-[7rem] ${lightUiSecondaryButtonClass}`}
        >
          Cancel
        </PrimaryButton>
        <PrimaryButton
          type="submit"
          disabled={!canEdit}
          className="w-full border border-black bg-[#00D4FF] py-2.5 text-sm font-semibold text-black shadow-none hover:brightness-105 sm:w-auto sm:min-w-[10rem]"
        >
          {submitLabel}
        </PrimaryButton>
      </div>
    </form>
  );
}

type CeremonyTimelineMomentFormProps = {
  idPrefix: string;
  canEdit: boolean;
  anchorLabel?: string;
  timeOrOrder: string;
  setTimeOrOrder: (value: string) => void;
  moment: string;
  setMoment: (value: string) => void;
  songTitle: string;
  setSongTitle: (value: string) => void;
  artist: string;
  setArtist: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  needsAttention: boolean;
  setNeedsAttention: (updater: (prev: boolean) => boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
};

function CeremonyTimelineMomentForm({
  idPrefix,
  canEdit,
  anchorLabel,
  timeOrOrder,
  setTimeOrOrder,
  moment,
  setMoment,
  songTitle,
  setSongTitle,
  artist,
  setArtist,
  notes,
  setNotes,
  needsAttention,
  setNeedsAttention,
  onCancel,
  onSubmit,
  submitLabel,
}: CeremonyTimelineMomentFormProps) {
  return (
    <div className="space-y-4">
      {anchorLabel ? (
        <p className="text-[11px] font-medium leading-snug text-stone-600">
          Adding after <span className="font-semibold text-stone-800">{anchorLabel}</span>
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id={`${idPrefix}-ceremony-time-order`}
          label="Time / order"
          value={timeOrOrder}
          onChange={setTimeOrOrder}
          placeholder="e.g. 3:30 PM or Prelude"
          disabled={!canEdit}
        />
        <TextInput
          id={`${idPrefix}-ceremony-moment`}
          label="Moment"
          value={moment}
          onChange={setMoment}
          placeholder="e.g. Processional"
          disabled={!canEdit}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          id={`${idPrefix}-ceremony-song-title`}
          label="Song title"
          value={songTitle}
          onChange={setSongTitle}
          placeholder="Song title"
          disabled={!canEdit}
        />
        <TextInput
          id={`${idPrefix}-ceremony-artist`}
          label="Artist"
          value={artist}
          onChange={setArtist}
          placeholder="Artist"
          disabled={!canEdit}
        />
      </div>
      <TextArea
        id={`${idPrefix}-ceremony-notes`}
        label="Notes / cues"
        value={notes}
        onChange={setNotes}
        placeholder="Cue notes, transitions, and callouts..."
        rows={3}
        disabled={!canEdit}
      />
      <PrimaryButton
        type="button"
        onClick={() => setNeedsAttention((prev) => !prev)}
        disabled={!canEdit}
        className={`w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none ${needsAttention
          ? "border-cyan-500/50 bg-cyan-50 text-stone-900"
          : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
          }`}
      >
        {needsAttention ? "DJ/MC attention marked" : "Flag DJ/MC attention"}
      </PrimaryButton>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <PrimaryButton
          type="button"
          onClick={onCancel}
          disabled={!canEdit}
          className={`w-full border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-800 shadow-none hover:bg-stone-50 sm:w-auto sm:min-w-[7rem] ${lightUiSecondaryButtonClass}`}
        >
          Cancel
        </PrimaryButton>
        <PrimaryButton
          type="button"
          onClick={onSubmit}
          disabled={!canEdit}
          className="w-full border border-black bg-[#00D4FF] py-2.5 text-sm font-semibold text-black shadow-none hover:brightness-105 sm:w-auto sm:min-w-[10rem]"
        >
          {submitLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

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

type ReceptionTimelineInlineEditDraftValues = {
  title: string;
  time: string;
  category: TimelineCategory;
  notes: string;
  songTitle: string;
  artist: string;
  needsDjMcAttention: boolean;
  fadeOutEarly: boolean;
  fadeOutTimestamp: string;
};

type CeremonyTimelineInlineEditDraftValues = {
  timeOrOrder: string;
  moment: string;
  songTitle: string;
  artist: string;
  notes: string;
  needsDjMcAttention: boolean;
};

function receptionTimelineInlineDraftFromRow(row: TimelineItem): ReceptionTimelineInlineEditDraftValues {
  return {
    title: row.title,
    time: row.time,
    category: row.category,
    notes: row.notes,
    songTitle: row.songTitle ?? "",
    artist: row.artist ?? "",
    needsDjMcAttention: row.needsDjMcAttention,
    fadeOutEarly: row.fadeOutEarly ?? false,
    fadeOutTimestamp: row.fadeOutTimestamp ?? "",
  };
}

function applyReceptionTimelineInlineDraftToRow(
  row: TimelineItem,
  v: ReceptionTimelineInlineEditDraftValues,
): TimelineItem {
  return {
    ...row,
    title: v.title,
    time: v.time,
    category: v.category,
    notes: v.notes,
    songTitle: v.songTitle.trim() ? v.songTitle : undefined,
    artist: v.artist.trim() ? v.artist : undefined,
    needsDjMcAttention: v.needsDjMcAttention,
    fadeOutEarly: v.fadeOutEarly,
    fadeOutTimestamp: v.fadeOutTimestamp.trim() ? v.fadeOutTimestamp : undefined,
  };
}

function ceremonyTimelineInlineDraftFromRow(row: CeremonyTimelineItem): CeremonyTimelineInlineEditDraftValues {
  return {
    timeOrOrder: row.timeOrOrder,
    moment: row.moment,
    songTitle: row.songTitle,
    artist: row.artist,
    notes: row.notes,
    needsDjMcAttention: row.needsDjMcAttention,
  };
}

function applyCeremonyTimelineInlineDraftToRow(
  row: CeremonyTimelineItem,
  v: CeremonyTimelineInlineEditDraftValues,
): CeremonyTimelineItem {
  return {
    ...row,
    timeOrOrder: v.timeOrOrder,
    moment: v.moment,
    songTitle: v.songTitle,
    artist: v.artist,
    notes: v.notes,
    needsDjMcAttention: v.needsDjMcAttention,
  };
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
  "Planning Checklist",
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
  if (raw === "Music Import") {
    return "Music Hub";
  }
  if (raw === "Vendors" || raw === "Collaborators") {
    return "Event Team";
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
    { key: "sectionVendorContactsEnabled", label: "Event team contacts" },
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
    labels.push("Event team");
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
      ? (["Music Hub"] as Screen[])
      : []),
    ...(s.sectionReceptionTimelineEnabled ? (["Timeline"] as Screen[]) : []),
    ...(s.sectionPlanningChecklistEnabled ? (["Planning Checklist"] as Screen[]) : []),
    ...(s.sectionPlanningQuestionsEnabled ? (["Planning Questions"] as Screen[]) : []),
    ...(s.sectionCeremonyEnabled && !s.sectionReceptionTimelineEnabled ? (["Ceremony"] as Screen[]) : []),
    ...(s.sectionPlanningChecklistEnabled || s.sectionMusicNotesEnabled ? (["Notes"] as Screen[]) : []),
    ...(s.sectionGuestRequestsEnabled ? (["Guest Requests"] as Screen[]) : []),
    "Event Team",
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
  const coupleAllowedScreens: Screen[] = [
    "Dashboard",
    "Reception Timeline",
    "Music Hub",
    "Planning Checklist",
    "Planning Questions",
    "Ceremony",
    "Timeline",
    "Event Team",
    "Guest Requests",
    "Event Settings",
    "Event Prep",
  ];
  let coupleNav = base.filter((item) => coupleAllowedScreens.includes(item));
  coupleNav = coupleNav.filter((item) => item !== "Notes");
  const ti = coupleNav.indexOf("Timeline");
  const di = coupleNav.indexOf("Dashboard");
  if (ti !== -1 && di !== -1 && ti !== di + 1) {
    const [t] = coupleNav.splice(ti, 1);
    const dashIdx = coupleNav.indexOf("Dashboard");
    coupleNav.splice(dashIdx + 1, 0, t);
  }
  return coupleNav;
}

/** When DB hydration completes, use DB playlist rows (deduped) as source of truth. */
function mergeHydratedEventsPreservingPlaylists(
  _priorEvents: EventRecord[],
  hydratedEvents: EventRecord[],
): EventRecord[] {
  return hydratedEvents.map((hydrated) => ({
    ...hydrated,
    mustPlaySongs: dedupeSongEntries(hydrated.mustPlaySongs ?? []),
    doNotPlaySongs: dedupeSongEntries(hydrated.doNotPlaySongs ?? []),
    playIfPossibleSongs: dedupeSongEntries(hydrated.playIfPossibleSongs ?? []),
  }));
}

/** Keep browser-local Grand Entrance detail until the event has DB-backed values. */
function mergeHydratedEventsPreservingGrandEntranceDetail(
  priorEvents: EventRecord[],
  hydratedEvents: EventRecord[],
): EventRecord[] {
  const priorMap = new Map(priorEvents.map((e) => [e.id, e]));
  return hydratedEvents.map((hydrated) => {
    const prior = priorMap.get(hydrated.id);
    if (!prior?.settings) return hydrated;

    const hydratedDetail = readGrandEntranceDetail(
      hydrated.settings?.planningQuestionAnswers ?? {},
      "",
    );
    const hasDbBackedDetail = Boolean(
      hydratedDetail.script || hydratedDetail.lineup || hydratedDetail.coupleEntrance,
    );
    if (hasDbBackedDetail) return hydrated;

    const priorDetail = readGrandEntranceDetail(
      prior.settings?.planningQuestionAnswers ?? {},
      prior.settings?.coupleNames ?? prior.meta?.couple ?? "",
    );
    const hasPriorDetail = Boolean(
      priorDetail.script || priorDetail.lineup || priorDetail.coupleEntrance,
    );
    if (!hasPriorDetail) return hydrated;

    return {
      ...hydrated,
      settings: {
        ...hydrated.settings,
        planningQuestionAnswers: mergeGrandEntranceDetailIntoAnswers(
          hydrated.settings?.planningQuestionAnswers ?? {},
          priorDetail,
        ),
      },
    };
  });
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

/** Client-friendly summary of what app access a collaborator role implies. */
function collaboratorAccessPermissionLine(role: UserRole): string {
  if (role === "Couple") return "Can edit planning, music, and guest requests";
  if (role === "DJ") return "Can edit timeline, music, and day-of prep views";
  if (role === "Planner") return "Can edit timeline, notes, and vendor-facing areas";
  if (role === "Admin") return "Full access (internal)";
  return "Custom permissions";
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

/** Desktop-only (md+) — timeline inline edit; mobile keeps default control sizing. */
const TIMELINE_DESKTOP_INPUT_CLASS = `${lightUiInputClass} md:min-h-12 md:px-4 md:py-3.5 md:text-base`;
const TIMELINE_DESKTOP_TEXTAREA_CLASS = `mt-1.5 ${lightUiTextControlClass} min-h-[5.5rem] resize-y placeholder:text-[var(--cm-text-subtle)] md:min-h-[6.25rem] md:px-4 md:py-3.5 md:text-base`;
const TIMELINE_DESKTOP_LABEL_CLASS = `${lightUiFormLabelClass} md:text-[12px] md:tracking-[0.14em]`;
/** Outer timeline row padding — tuned for phone, iPad landscape, and desktop scan density. */
const TIMELINE_CARD_SHELL_CLASS =
  "!p-0 px-4 py-4 sm:px-5 sm:py-4 md:px-5 md:py-4 lg:px-5 lg:py-4 xl:px-6";
const TIMELINE_STREAM_CLASS =
  "min-w-0 space-y-2.5 overflow-x-hidden max-md:max-h-none max-md:overflow-y-visible sm:space-y-3 md:max-h-[min(72dvh,52rem)] md:space-y-2.5 md:overflow-y-auto md:overscroll-y-contain";
const TIMELINE_STREAM_UNIFIED_CLASS =
  "min-w-0 space-y-2.5 overflow-x-hidden sm:space-y-3 md:space-y-2.5";
const TIMELINE_SECTION_HEADER_CLASS =
  "scroll-mt-4 border-b border-stone-200/90 bg-white px-4 py-3 sm:px-5 sm:py-3";
const TIMELINE_CARD_TIME_TITLE_ROW_CLASS =
  "flex flex-wrap items-baseline gap-x-3 gap-y-0.5 sm:gap-x-3.5";
const TIMELINE_CARD_TIME_INLINE_CLASS =
  "shrink-0 font-mono text-[13px] font-semibold tabular-nums tracking-tight text-stone-500 sm:text-sm lg:min-w-[5rem] lg:text-[13px]";
const TIMELINE_CARD_TITLE_CLASS =
  "text-base font-semibold leading-snug tracking-tight text-stone-950 [overflow-wrap:anywhere] md:text-lg lg:text-[1.0625rem] lg:leading-tight";
const TIMELINE_CARD_CUE_CLASS =
  "text-sm leading-snug text-stone-700 [overflow-wrap:anywhere] md:text-[14px]";
const TIMELINE_CARD_NOTES_CLASS =
  "line-clamp-2 mt-1 text-[11px] leading-snug text-stone-500 [overflow-wrap:anywhere] md:mt-1.5 md:text-xs";
const TIMELINE_CARD_FOOTER_CLASS =
  "mt-4 flex flex-col gap-2.5 border-t border-stone-200/90 pt-3.5 max-md:mt-3.5 max-md:gap-2 max-md:pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 lg:mt-3.5 lg:flex-nowrap lg:gap-2.5 lg:pt-3";
const GRAND_ENTRANCE_DETAIL_BTN_CLASS =
  "min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 md:text-sm";
const TIMELINE_CARD_POSITION_CLASS =
  "shrink-0 self-end text-right text-[10px] font-medium tabular-nums uppercase tracking-wide text-stone-500";
const TIMELINE_CARD_ACTION_RAIL_CLASS =
  "flex w-full min-w-0 shrink-0 flex-col gap-2.5 border-t border-stone-200/80 pt-3.5 md:pt-3.5 lg:w-auto lg:max-w-[min(22rem,100%)] lg:flex-none lg:border-l lg:border-t-0 lg:pt-0 lg:pl-4 xl:pl-5";
const TIMELINE_CARD_ACTION_ROW_CLASS =
  "flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end lg:gap-2";
const TIMELINE_CARD_ACTION_BTN_CLASS =
  "min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-[13px] font-medium text-stone-800 shadow-none hover:border-stone-500 hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:w-auto sm:px-3.5 sm:py-2.5 sm:text-[11px] md:min-h-11 md:px-4 md:py-2.5 md:text-[13px] lg:min-h-9 lg:w-auto lg:shrink-0 lg:px-3 lg:py-2 lg:text-[11px] xl:px-3.5 xl:text-xs";
const TIMELINE_CARD_ACTION_BTN_PRIMARY_CLASS =
  "min-h-11 w-full rounded-lg border border-stone-500 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 disabled:opacity-45 sm:min-h-10 sm:w-auto sm:px-3.5 sm:py-2.5 sm:text-[11px] md:min-h-11 md:px-4 md:py-2.5 md:text-[13px] lg:min-h-9 lg:w-auto lg:shrink-0 lg:px-3 lg:py-2 lg:text-[11px] xl:px-3.5 xl:text-xs";
const TIMELINE_CARD_ACTION_BTN_DELETE_CLASS =
  "min-h-11 w-full touch-manipulation rounded-lg border border-rose-300/80 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-rose-900/90 shadow-none transition hover:border-rose-400 hover:bg-rose-50/90 sm:min-h-10 sm:w-auto sm:px-3.5 sm:py-2.5 sm:text-[11px] md:min-h-11 md:px-4 md:py-2.5 md:text-sm lg:min-h-9 lg:w-auto lg:shrink-0 lg:px-3 lg:py-2 lg:text-[11px] xl:px-3.5 xl:text-xs";
const TIMELINE_CARD_MOBILE_ACTION_GRID_CLASS = "grid grid-cols-2 gap-2";
const TIMELINE_CARD_MOBILE_ACTION_BTN_CLASS =
  "min-h-11 min-w-0 touch-manipulation rounded-lg border border-stone-300 bg-white px-2.5 py-2.5 text-[11px] font-medium leading-tight text-stone-800 shadow-none hover:border-stone-500 hover:bg-stone-50 disabled:opacity-45";
const TIMELINE_CARD_MOBILE_ACTION_BTN_PRIMARY_CLASS =
  "min-h-11 min-w-0 touch-manipulation rounded-lg border border-stone-400 bg-white px-2.5 py-2.5 text-[11px] font-semibold leading-tight text-stone-900 shadow-none hover:bg-stone-50 disabled:opacity-45";
const TIMELINE_CARD_MOBILE_ACTION_BTN_DELETE_CLASS =
  "min-h-11 min-w-0 touch-manipulation rounded-lg border border-rose-200/80 bg-white px-2.5 py-2.5 text-[11px] font-semibold leading-tight text-rose-800/90 shadow-none transition hover:border-rose-300 hover:bg-rose-50/40";
const TIMELINE_CARD_MOBILE_READ_SHELL_CLASS =
  "touch-pan-y rounded-lg border border-stone-200/90 bg-stone-50/50 px-3.5 py-3.5 shadow-none outline-none ring-stone-900/10 transition-[box-shadow,transform] focus-visible:ring-2";
const TIMELINE_CARD_EXPANDED_HEADER_ACTIONS_CLASS =
  "flex flex-wrap items-center justify-end gap-2.5";
const TIMELINE_CARD_EXPANDED_HEADER_BTN_CLASS =
  "min-h-10 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-[12px] font-medium text-stone-900 shadow-none hover:bg-stone-50 md:min-h-11 md:px-4 md:py-2.5 md:text-[13px]";
const TIMELINE_CARD_EXPANDED_HEADER_DELETE_CLASS =
  "min-h-10 touch-manipulation rounded-lg border border-transparent bg-transparent px-3 py-2 text-[12px] font-medium text-rose-700/90 shadow-none transition hover:border-rose-200/90 hover:bg-rose-50/70 md:min-h-10 md:px-3.5 md:py-2 md:text-[13px]";
const TIMELINE_CARD_FOOTER_ACTIONS_CLASS =
  "ml-auto flex w-full flex-col items-end gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2.5";
const TIMELINE_CARD_EDIT_FIELDS_CLASS = "space-y-2.5 md:space-y-3";
const TIMELINE_CARD_EDIT_DONE_ROW_CLASS =
  "mt-4 flex flex-col items-stretch gap-2 border-t border-stone-200/70 pt-3.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2.5 md:mt-4 md:pt-4";
const TIMELINE_CARD_EDIT_DONE_BTN_CLASS =
  "min-h-11 w-full rounded-lg border border-stone-800/15 bg-[#00D4FF] px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-none hover:brightness-[1.03] sm:w-auto sm:min-w-[9rem] md:min-h-10 md:py-2.5";
const TIMELINE_DRAG_HANDLE_EDITING_CLASS =
  "border-solid border-stone-300/75 bg-stone-50/90 text-stone-600 max-md:min-h-9 max-md:py-2 sm:min-h-9 md:py-2.5 lg:min-h-8 lg:py-1.5 lg:text-[10px] lg:text-stone-500";
/**
 * Calm accent surface applied to a timeline row when its inline editor is open.
 * Subtle tint + soft ring so editing reads as "embedded in the timeline" without
 * flashing into a stark form panel. Keeps drag/reorder unaffected.
 */
const TIMELINE_CARD_EDITING_CLASS =
  "!border-[#00D4FF]/28 !bg-[#00D4FF]/[0.025] ring-1 ring-[#00D4FF]/10 shadow-none";

function TimelineCardPositionIndicator({
  index,
  total,
}: {
  index: number;
  total: number;
}) {
  return (
    <p
      className={TIMELINE_CARD_POSITION_CLASS}
      aria-label={`Moment ${index + 1} of ${total}`}
    >
      {index + 1} / {total}
    </p>
  );
}

function TimelineMomentHeadline({
  timeLabel,
  title,
  titleClassName = "",
}: {
  timeLabel: string;
  title: string;
  titleClassName?: string;
}) {
  const time = timeLabel.trim() || "—";
  return (
    <div className={TIMELINE_CARD_TIME_TITLE_ROW_CLASS}>
      <p className={TIMELINE_CARD_TIME_INLINE_CLASS}>{time}</p>
      <h3 className={`${TIMELINE_CARD_TITLE_CLASS} min-w-0 flex-1 ${titleClassName}`.trim()}>
        {title}
      </h3>
    </div>
  );
}

function ChecklistGlobalRelativeDueSelect({
  idPrefix,
  offsetDays,
  onChange,
  disabled = false,
}: {
  idPrefix: string;
  offsetDays: number;
  onChange: (offsetDays: number) => void;
  disabled?: boolean;
}) {
  const options =
    !CHECKLIST_DUE_OFFSET_PRESETS.some((days) => -days === offsetDays)
      ? [offsetDays, ...CHECKLIST_DUE_OFFSET_PRESETS.map((days) => -days)]
      : CHECKLIST_DUE_OFFSET_PRESETS.map((days) => -days);

  return (
    <div>
      <label htmlFor={`${idPrefix}-global-offset`} className={lightUiFormLabelClass}>
        Relative to event date
      </label>
      <select
        id={`${idPrefix}-global-offset`}
        value={offsetDays}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={lightUiSelectClass}
      >
        {options.map((value) => (
          <option key={`${idPrefix}-global-${value}`} value={value}>
            {formatChecklistDueOffsetDescription(value)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChecklistDueDateFields({
  idPrefix,
  value,
  onChange,
  disabled = false,
}: {
  idPrefix: string;
  value: ChecklistDueDate;
  onChange: (next: ChecklistDueDate) => void;
  disabled?: boolean;
}) {
  const relativeOptions =
    value.type === "relative" &&
    !CHECKLIST_DUE_OFFSET_PRESETS.some((days) => -days === value.offsetDays)
      ? [value.offsetDays, ...CHECKLIST_DUE_OFFSET_PRESETS.map((days) => -days)]
      : CHECKLIST_DUE_OFFSET_PRESETS.map((days) => -days);

  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={`${idPrefix}-due-type`} className={lightUiFormLabelClass}>
          Due date type
        </label>
        <select
          id={`${idPrefix}-due-type`}
          value={value.type}
          disabled={disabled}
          onChange={(event) => {
            const nextType = event.target.value;
            if (nextType === "custom") {
              onChange({
                type: "custom",
                date: value.type === "custom" ? value.date : "",
              });
              return;
            }
            onChange({
              type: "relative",
              offsetDays: value.type === "relative" ? value.offsetDays : -14,
            });
          }}
          className={lightUiSelectClass}
        >
          <option value="relative">Relative to event date</option>
          <option value="custom">Custom date</option>
        </select>
      </div>
      {value.type === "relative" ? (
        <div>
          <label htmlFor={`${idPrefix}-due-offset`} className={lightUiFormLabelClass}>
            Relative timing
          </label>
          <select
            id={`${idPrefix}-due-offset`}
            value={value.offsetDays}
            disabled={disabled}
            onChange={(event) =>
              onChange({ type: "relative", offsetDays: Number(event.target.value) })
            }
            className={lightUiSelectClass}
          >
            {relativeOptions.map((offsetDays) => (
              <option key={`${idPrefix}-offset-${offsetDays}`} value={offsetDays}>
                {formatChecklistDueOffsetDescription(offsetDays)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label htmlFor={`${idPrefix}-due-custom`} className={lightUiFormLabelClass}>
            Custom date
          </label>
          <input
            id={`${idPrefix}-due-custom`}
            type="date"
            value={value.date}
            disabled={disabled}
            onChange={(event) => onChange({ type: "custom", date: event.target.value })}
            className={lightUiInputClass}
          />
        </div>
      )}
    </div>
  );
}

function PlanningChecklistMissingNotesBlock({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <div
      className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2"
      role="status"
    >
      <div className="flex items-start gap-2">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-800">
            Attention needed
          </p>
          <ul className="mt-1 space-y-0.5">
            {notes.map((note) => (
              <li key={note} className="text-[11px] font-medium leading-snug text-amber-900/90">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TimelineSongCueLine({
  kind,
  preview,
  hasSong,
  className = TIMELINE_CARD_CUE_CLASS,
}: {
  kind: string;
  preview: string;
  hasSong: boolean;
  className?: string;
}) {
  return (
    <p className={className}>
      <span className="font-medium text-stone-400">{kind}</span>
      <span className="mx-1.5 text-stone-300" aria-hidden>
        ·
      </span>
      <span className={hasSong ? "font-medium text-stone-900" : "text-stone-600"}>{preview}</span>
    </p>
  );
}

const EVENT_NOTE_CATEGORIES = [
  "General",
  "Planning",
  "Music",
  "Timeline",
  "Vendor",
  "Day-of",
  "Internal",
] as const;

export default function Home() {
  const timelineComposerRef = useRef<HTMLDivElement | null>(null);
  const timelineStreamRef = useRef<HTMLDivElement | null>(null);
  const ceremonyTimelineComposerRef = useRef<HTMLDivElement | null>(null);
  const ceremonyTimelineStreamRef = useRef<HTMLDivElement | null>(null);
  /** Tracks last main nav context so we scroll to top only on real section/mode/auth changes. */
  const prevMainNavScrollRef = useRef<{ screen: Screen; mode: AppMode; auth: AuthStage } | null>(null);
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
  const databaseHydrationCompleteRef = useRef(false);
  const persistPhaseHideTimeoutRef = useRef<number | null>(null);
  const [mustPlaySongs, setMustPlaySongs] = useState<SongEntry[]>(initialMustPlaySongs);
  const [doNotPlaySongs, setDoNotPlaySongs] = useState<SongEntry[]>(initialDoNotPlaySongs);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongArtist, setNewSongArtist] = useState("");
  const [newSongNotes, setNewSongNotes] = useState("");
  const [newSongHighPriority, setNewSongHighPriority] = useState(false);
  const [newSongListType, setNewSongListType] = useState<SongListType>("mustPlay");
  const [musicPlaylistLinks, setMusicPlaylistLinks] = useState<SharedPlaylistLink[]>([]);
  const [musicGenreEraSelections, setMusicGenreEraSelections] = useState<string[]>([]);
  const [playIfPossibleSongs, setPlayIfPossibleSongs] = useState<SongEntry[]>([]);
  const [musicNewPlaylistUrl, setMusicNewPlaylistUrl] = useState("");
  const [musicNewPlaylistLabel, setMusicNewPlaylistLabel] = useState("");
  const [musicNewPlaylistNotes, setMusicNewPlaylistNotes] = useState("");
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
  const runOfShowDoneKeys = useMemo(
    () => buildRunOfShowDoneKeysFromTimeline(ceremonyTimelineItems, timelineItems),
    [ceremonyTimelineItems, timelineItems],
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
  /** Inline expanded row: field edits stay local until flush (avoids full-tree persist on each keystroke). */
  const [receptionTimelineInlineEditDraft, setReceptionTimelineInlineEditDraft] = useState<{
    itemId: string;
    values: ReceptionTimelineInlineEditDraftValues;
  } | null>(null);
  /** Confirm before removing reception or ceremony timeline rows from the planning UI */
  const [pendingTimelineDelete, setPendingTimelineDelete] = useState<
    | { kind: "reception"; id: string; label: string }
    | { kind: "ceremony"; id: string; label: string }
    | null
  >(null);
  const [timelineImportOpen, setTimelineImportOpen] = useState(false);
  const [timelineImportRaw, setTimelineImportRaw] = useState("");
  const [timelineImportDrafts, setTimelineImportDrafts] = useState<PastedTimelineImportDraft[]>([]);
  const [timelineImportStep, setTimelineImportStep] = useState<"paste" | "review">("paste");
  const [timelineImportParseError, setTimelineImportParseError] = useState<string | null>(null);
  const [timelineImportReplaceDanger, setTimelineImportReplaceDanger] = useState(false);
  /** Compact add/edit panel for new items (not inline-expanded rows) */
  const [timelineComposerOpen, setTimelineComposerOpen] = useState(false);
  /** Inline insert directly after a reception timeline row (+ After). */
  const [timelineInsertAfterId, setTimelineInsertAfterId] = useState<string | null>(null);
  const timelineInlineInsertRef = useRef<HTMLDivElement | null>(null);
  /** Event Document: distraction-free live execution view (same timeline order as packet). */
  const [runOfShowOpen, setRunOfShowOpen] = useState(false);
  const [runOfShowIsFullscreen, setRunOfShowIsFullscreen] = useState(false);
  /** Per-card operational notes in Run Of Show (`c:{id}` / `r:{id}`), local to device. */
  const [runOfShowCardNotes, setRunOfShowCardNotes] = useState<Record<string, string>>({});
  const [runOfShowCardNoteEditor, setRunOfShowCardNoteEditor] = useState<{
    cardKey: string;
    cardLabel: string;
    cardSubline?: string;
  } | null>(null);
  const [runOfShowCardNoteEditorDraft, setRunOfShowCardNoteEditorDraft] = useState("");
  const [runOfShowCardNoteEditorSavedValue, setRunOfShowCardNoteEditorSavedValue] = useState("");
  const [grandEntranceDetailEditor, setGrandEntranceDetailEditor] = useState<{
    itemId: string;
    title: string;
    subline?: string;
    songLabel?: string;
  } | null>(null);
  const [grandEntranceDetailDraft, setGrandEntranceDetailDraft] = useState<GrandEntranceDetailDraft>({
    script: "",
    lineup: "",
    coupleEntrance: "",
    sideNote: "",
  });
  const [grandEntranceDetailSavedDraft, setGrandEntranceDetailSavedDraft] =
    useState<GrandEntranceDetailDraft>({
      script: "",
      lineup: "",
      coupleEntrance: "",
      sideNote: "",
    });
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
  const runOfShowAnnotationInProgressRef = useRef<{
    points: { x: number; y: number }[];
    width: number;
  } | null>(null);
  const runOfShowAnnotationStrokesRef = useRef<RunOfShowAnnotationStroke[]>([]);
  const runOfShowAnnotationCanvasSizeRef = useRef({ w: 0, h: 0 });
  const runOfShowAnnotationPersistTimerRef = useRef<number | null>(null);
  const runOfShowAnnotationPointerRafRef = useRef<number | null>(null);
  const runOfShowAnnotationPaintedPointCountRef = useRef(0);
  const runOfShowCardNotesPersistTimerRef = useRef<number | null>(null);
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
  const [musicTasteProfile, setMusicTasteProfile] = useState<MusicTasteProfile>(emptyMusicTasteProfile);
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
    eventStatus: "Planning",
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
  // Tracks event ids that exist in the Postgres database. Server actions like
  // `replaceEventTeamMembers` require a real DB event id (FK constraint), so
  // we use this set to avoid hitting Postgres with seed/local ids like "evt-1".
  const databaseEventIdsRef = useRef<Set<string>>(new Set<string>());
  const lastMergedHydratedEventsRef = useRef<EventRecord[] | null>(null);

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
  const [allEventsShowArchived, setAllEventsShowArchived] = useState(false);
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
  const [teamRoleDraft, setTeamRoleDraft] = useState<TeamMemberRole>("DJ");
  const [teamCompanyDraft, setTeamCompanyDraft] = useState("");
  const [teamEmailDraft, setTeamEmailDraft] = useState("");
  const [teamPhoneDraft, setTeamPhoneDraft] = useState("");
  const [teamNotesDraft, setTeamNotesDraft] = useState("");
  const [teamWebsiteDraft, setTeamWebsiteDraft] = useState("");
  const [teamInstagramDraft, setTeamInstagramDraft] = useState("");
  const [teamArrivalDraft, setTeamArrivalDraft] = useState("");
  const [teamCoordinationDraft, setTeamCoordinationDraft] = useState("");
  const [teamActiveDraft, setTeamActiveDraft] = useState(true);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamFormStatus, setTeamFormStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [eventNotes, setEventNotes] = useState<EventNote[]>([]);
  const [noteEditingId, setNoteEditingId] = useState<string | null>(null);
  const [noteCategoryDraft, setNoteCategoryDraft] = useState<string>("General");
  const [noteTitleDraft, setNoteTitleDraft] = useState("");
  const [noteBodyDraft, setNoteBodyDraft] = useState("");
  const [notePinnedDraft, setNotePinnedDraft] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteFormStatus, setNoteFormStatus] = useState<{
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
  /** Inline expanded ceremony row: local draft until flush */
  const [ceremonyTimelineInlineEditDraft, setCeremonyTimelineInlineEditDraft] = useState<{
    itemId: string;
    values: CeremonyTimelineInlineEditDraftValues;
  } | null>(null);
  /** Compact composer for new ceremony moments */
  const [ceremonyTimelineComposerOpen, setCeremonyTimelineComposerOpen] = useState(false);
  const [ceremonyTimelineInsertAfterId, setCeremonyTimelineInsertAfterId] = useState<string | null>(
    null,
  );
  const ceremonyTimelineInlineInsertRef = useRef<HTMLDivElement | null>(null);
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
  const reorderTimelineItemToTargetRef = useRef<(itemId: string, targetId: string) => void>(() => { });
  const reorderCeremonyTimelineItemToTargetRef = useRef<(itemId: string, targetId: string) => void>(
    () => { },
  );

  const receptionTimelineInlineEditDraftRef = useRef(receptionTimelineInlineEditDraft);
  receptionTimelineInlineEditDraftRef.current = receptionTimelineInlineEditDraft;
  const ceremonyTimelineInlineEditDraftRef = useRef(ceremonyTimelineInlineEditDraft);
  ceremonyTimelineInlineEditDraftRef.current = ceremonyTimelineInlineEditDraft;

  const flushReceptionTimelineInlineEditDraftIntoTimeline = useCallback(() => {
    const draft = receptionTimelineInlineEditDraftRef.current;
    if (!draft) return;
    setTimelineItems((prev) =>
      prev.map((t) => (t.id === draft.itemId ? applyReceptionTimelineInlineDraftToRow(t, draft.values) : t)),
    );
    setReceptionTimelineInlineEditDraft(null);
  }, []);

  const closeReceptionTimelineCardExpanded = useCallback(() => {
    flushReceptionTimelineInlineEditDraftIntoTimeline();
    setReceptionTimelineExpandedId(null);
  }, [flushReceptionTimelineInlineEditDraftIntoTimeline]);

  const openReceptionTimelineCardExpanded = useCallback((row: TimelineItem) => {
    const prevDraft = receptionTimelineInlineEditDraftRef.current;
    if (prevDraft && prevDraft.itemId !== row.id) {
      setTimelineItems((prev) =>
        prev.map((t) =>
          t.id === prevDraft.itemId ? applyReceptionTimelineInlineDraftToRow(t, prevDraft.values) : t,
        ),
      );
      setReceptionTimelineInlineEditDraft(null);
    } else if (prevDraft?.itemId === row.id) {
      setReceptionTimelineExpandedId(row.id);
      return;
    }
    setReceptionTimelineInlineEditDraft({
      itemId: row.id,
      values: receptionTimelineInlineDraftFromRow(row),
    });
    setReceptionTimelineExpandedId(row.id);
  }, []);

  const flushCeremonyTimelineInlineEditDraftIntoTimeline = useCallback(() => {
    const draft = ceremonyTimelineInlineEditDraftRef.current;
    if (!draft) return;
    setCeremonyTimelineItems((prev) =>
      prev.map((t) => (t.id === draft.itemId ? applyCeremonyTimelineInlineDraftToRow(t, draft.values) : t)),
    );
    setCeremonyTimelineInlineEditDraft(null);
  }, []);

  const closeCeremonyTimelineCardExpanded = useCallback(() => {
    flushCeremonyTimelineInlineEditDraftIntoTimeline();
    setCeremonyTimelineExpandedId(null);
  }, [flushCeremonyTimelineInlineEditDraftIntoTimeline]);

  const openCeremonyTimelineCardExpanded = useCallback((row: CeremonyTimelineItem) => {
    const prevDraft = ceremonyTimelineInlineEditDraftRef.current;
    if (prevDraft && prevDraft.itemId !== row.id) {
      setCeremonyTimelineItems((prev) =>
        prev.map((t) =>
          t.id === prevDraft.itemId ? applyCeremonyTimelineInlineDraftToRow(t, prevDraft.values) : t,
        ),
      );
      setCeremonyTimelineInlineEditDraft(null);
    } else if (prevDraft?.itemId === row.id) {
      setCeremonyTimelineExpandedId(row.id);
      return;
    }
    setCeremonyTimelineInlineEditDraft({
      itemId: row.id,
      values: ceremonyTimelineInlineDraftFromRow(row),
    });
    setCeremonyTimelineExpandedId(row.id);
  }, []);

  const patchReceptionTimelineInlineDraft = useCallback(
    (itemId: string, patch: Partial<ReceptionTimelineInlineEditDraftValues>, anchorRow: TimelineItem | null) => {
      setReceptionTimelineInlineEditDraft((prev) => {
        if (prev && prev.itemId === itemId) {
          return { ...prev, values: { ...prev.values, ...patch } };
        }
        if (anchorRow && anchorRow.id === itemId) {
          return {
            itemId,
            values: { ...receptionTimelineInlineDraftFromRow(anchorRow), ...patch },
          };
        }
        return prev;
      });
    },
    [],
  );

  const patchCeremonyTimelineInlineDraft = useCallback(
    (itemId: string, patch: Partial<CeremonyTimelineInlineEditDraftValues>, anchorRow: CeremonyTimelineItem | null) => {
      setCeremonyTimelineInlineEditDraft((prev) => {
        if (prev && prev.itemId === itemId) {
          return { ...prev, values: { ...prev.values, ...patch } };
        }
        if (anchorRow && anchorRow.id === itemId) {
          return {
            itemId,
            values: { ...ceremonyTimelineInlineDraftFromRow(anchorRow), ...patch },
          };
        }
        return prev;
      });
    },
    [],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const flushInlineTimelineDrafts = () => {
      flushReceptionTimelineInlineEditDraftIntoTimeline();
      flushCeremonyTimelineInlineEditDraftIntoTimeline();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushInlineTimelineDrafts();
    };
    const onPageHide = () => flushInlineTimelineDrafts();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushCeremonyTimelineInlineEditDraftIntoTimeline, flushReceptionTimelineInlineEditDraftIntoTimeline]);

  const persistTimelinesToDatabase = useCallback(
    async (
      eventId: string,
      mainItems: TimelineItem[],
      ceremonyItems: CeremonyTimelineItem[],
    ): Promise<{ ok: true } | { ok: false; error: unknown }> => {
      if (!databaseEventIdsRef.current.has(eventId)) {
        return {
          ok: false,
          error: new Error(`Event "${eventId}" is not a database-backed event.`),
        };
      }
      try {
        await replaceMainTimelineItems(eventId, mapMainTimelineItemsForDatabase(mainItems));
        await replaceCeremonyTimelineItems(
          eventId,
          mapCeremonyTimelineItemsForDatabase(ceremonyItems),
        );
        return { ok: true };
      } catch (error) {
        console.error("Failed to persist timelines to database:", error);
        return { ok: false, error };
      }
    },
    [],
  );

  const persistRunOfShowTimelineFlags = useCallback(
    async (mainItems: TimelineItem[], ceremonyItems: CeremonyTimelineItem[]) => {
      if (!activeEventId || !databaseEventIdsRef.current.has(activeEventId)) return;
      const result = await persistTimelinesToDatabase(activeEventId, mainItems, ceremonyItems);
      if (!result.ok) return;
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === activeEventId
            ? {
                ...evt,
                timelineItems: cloneJson(mainItems),
                ceremonyTimelineItems: cloneJson(ceremonyItems),
              }
            : evt,
        ),
      );
    },
    [activeEventId, persistTimelinesToDatabase],
  );

  const persistSongsToDatabase = useCallback(
    async (
      eventId: string,
      mustPlay: SongEntry[],
      doNotPlay: SongEntry[],
      playIfPossible: SongEntry[],
    ): Promise<{ ok: true } | { ok: false; error: unknown }> => {
      if (!databaseEventIdsRef.current.has(eventId)) {
        return {
          ok: false,
          error: new Error(`Event "${eventId}" is not a database-backed event.`),
        };
      }
      try {
        await replaceEventSongs(
          eventId,
          "mustPlay",
          dedupeSongEntries(mustPlay).map((song, index) => ({
            title: song.title,
            artist: song.artist,
            notes: song.notes,
            highPriority: song.highPriority,
            order: index,
          })),
        );
        await replaceEventSongs(
          eventId,
          "doNotPlay",
          dedupeSongEntries(doNotPlay).map((song, index) => ({
            title: song.title,
            artist: song.artist,
            notes: song.notes,
            highPriority: song.highPriority,
            order: index,
          })),
        );
        await replaceEventSongs(
          eventId,
          "playIfPossible",
          dedupeSongEntries(playIfPossible).map((song, index) => ({
            title: song.title,
            artist: song.artist,
            notes: song.notes,
            highPriority: song.highPriority,
            order: index,
          })),
        );
        return { ok: true };
      } catch (error) {
        console.error("Failed to persist songs to database:", error);
        return { ok: false, error };
      }
    },
    [],
  );

  const commitActiveEventPlanningToEventsState = useCallback(async () => {
    const recvDraft = receptionTimelineInlineEditDraftRef.current;
    const timelinePayload =
      recvDraft === null
        ? timelineItems
        : timelineItems.map((t) =>
          t.id === recvDraft.itemId ? applyReceptionTimelineInlineDraftToRow(t, recvDraft.values) : t,
        );
    const cerDraft = ceremonyTimelineInlineEditDraftRef.current;
    const ceremonyPayload =
      cerDraft === null
        ? ceremonyTimelineItems
        : ceremonyTimelineItems.map((t) =>
          t.id === cerDraft.itemId ? applyCeremonyTimelineInlineDraftToRow(t, cerDraft.values) : t,
        );

        try {
          await updateDatabaseEvent(activeEventId, {
            title: eventSettings.eventName,
            date: eventSettings.weddingDate
              ? new Date(eventSettings.weddingDate)
              : null,
            type: eventSettings.eventType,
            venue: eventSettings.venue,
            assignedDj: eventSettings.assignedDj,
            packageName: eventSettings.packageName,
            plannerName: eventSettings.plannerName,
            plannerEmail: eventSettings.plannerEmail,
            ceremonyLocation: eventSettings.ceremonyLocation,
            receptionLocation: eventSettings.receptionLocation,
            internalNotes: eventSettings.internalNotes,
            eventStatus: normalizeEventStatus(eventSettings.eventStatus),
          });

          await replaceGuestRequests(
            activeEventId,
            guestRequests.map((request, index) => ({
              guestName: request.guestName,
              songTitle: request.songTitle,
              artist: request.artist,
              dedication: request.dedication,
              status: request.status,
              addedToMustPlay: request.addedToMustPlay,
              addedToDoNotPlay: request.addedToDoNotPlay,
              order: index,
            })),
          );

          console.log("[TEAM-DEBUG] commit → replaceEventTeamMembers", {
            activeEventId,
            count: teamMembers.length,
            dbEventIds: Array.from(databaseEventIdsRef.current),
          });
          await replaceEventTeamMembers(
            activeEventId,
            teamMembers.map((member, index) => ({
              name: member.name,
              role: member.role,
              email: member.email || null,
              phone: member.phone || null,
              notes: member.notes || null,
              isActive: member.isActive,
              order: index,
            })),
          );
          console.log("[TEAM-DEBUG] commit → replaceEventTeamMembers OK");

          await persistTimelinesToDatabase(activeEventId, timelinePayload, ceremonyPayload);

          await persistSongsToDatabase(
            activeEventId,
            mustPlaySongs,
            doNotPlaySongs,
            playIfPossibleSongs,
          );
        } catch (error) {
          console.error("Failed to persist event settings:", error);
        }

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
            timelineItems: timelinePayload,
            ceremonyTimelineItems: ceremonyPayload,
            formalities: [],
            mustPlaySongs,
            doNotPlaySongs,
            playIfPossibleSongs,
            musicPlaylistLinks,
            musicGenreEraSelections,
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
            musicTasteProfile: cloneJson(musicTasteProfile),
            mcAnnouncements,
            settings: eventSettings,
          }
          : evt,
      ),
    );
    if (recvDraft) {
      setTimelineItems(timelinePayload);
      setReceptionTimelineInlineEditDraft(null);
      setReceptionTimelineExpandedId(null);
    }
    if (cerDraft) {
      setCeremonyTimelineItems(ceremonyPayload);
      setCeremonyTimelineInlineEditDraft(null);
      setCeremonyTimelineExpandedId(null);
    }
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
    musicTasteProfile,
    mustPlaySongs,
    doNotPlaySongs,
    playIfPossibleSongs,
    musicPlaylistLinks,
    musicGenreEraSelections,
    officiantName,
    plannerNotes,
    playlistVibeOverrides,
    recessionalSong,
    teamMembers,
    timelineItems,
    unityCeremonySong,
    vendors,
    weddingPartyProcessional,
    persistTimelinesToDatabase,
    persistSongsToDatabase,
  ]);

  const loadEventPlanningIntoWorkingState = (evt: EventRecord) => {
    const normalized = normalizeEventRecordAfterFormalitiesMerge(evt);
    let nextTimelineItems = cloneJson(normalized.timelineItems);
    let nextCeremonyTimelineItems = cloneJson(normalized.ceremonyTimelineItems ?? []);
    const hasDbRunOfShowDone =
      nextTimelineItems.some((item) => item.runOfShowDone) ||
      nextCeremonyTimelineItems.some((item) => item.runOfShowDone);
    if (!hasDbRunOfShowDone) {
      const localDoneKeys = readLocalRunOfShowDoneKeysForEvent(
        RUN_OF_SHOW_DONE_STORAGE_KEY,
        evt.id,
      );
      if (localDoneKeys.length > 0) {
        const merged = mergeLocalRunOfShowDoneKeysIntoTimeline(
          nextCeremonyTimelineItems,
          nextTimelineItems,
          localDoneKeys,
        );
        nextCeremonyTimelineItems = merged.ceremonyItems;
        nextTimelineItems = merged.receptionItems;
        if (merged.changed && databaseEventIdsRef.current.has(evt.id)) {
          queueMicrotask(() => {
            void persistRunOfShowTimelineFlags(nextTimelineItems, nextCeremonyTimelineItems);
          });
        }
      }
    }
    setTimelineItems(nextTimelineItems);
    setCeremonyTimelineItems(nextCeremonyTimelineItems);
    setMustPlaySongs(dedupeSongEntries(cloneJson(normalized.mustPlaySongs)));
    setDoNotPlaySongs(dedupeSongEntries(cloneJson(normalized.doNotPlaySongs)));
    setPlayIfPossibleSongs(dedupeSongEntries(cloneJson(normalized.playIfPossibleSongs ?? [])));
    setMusicPlaylistLinks(cloneJson(normalized.musicPlaylistLinks ?? []));
    setMusicGenreEraSelections(cloneJson(normalized.musicGenreEraSelections ?? []));
    setMusicTasteProfile(normalizeMusicTasteProfile(normalized.musicTasteProfile));
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
    // Team members are per-event (DB-backed via EventTeamMember rows). Drive
    // the global `teamMembers` working state from the event we're entering so
    // the Event Team UI reflects the selected event, not whatever set was
    // last loaded for another event. We ALWAYS reset from the active event's
    // shadow field — defaulting to [] when it is missing — so per-event
    // scoping is definitive. Previously we only updated when the shadow was
    // an array, which left stale state when the shadow was undefined (legacy
    // localStorage record, race with DB hydration, etc.).
    const evtTeamMembers = (evt as EventRecord & {
      eventTeamMembers?: TeamMember[];
    }).eventTeamMembers;
    const nextTeamMembers = Array.isArray(evtTeamMembers)
      ? cloneJson(evtTeamMembers)
      : [];
    console.log("[HYDRATE-DEBUG] loadEventPlanningIntoWorkingState →", {
      evtId: evt.id,
      hasShadow: Array.isArray(evtTeamMembers),
      shadowLength: Array.isArray(evtTeamMembers)
        ? evtTeamMembers.length
        : null,
      nextTeamMembers,
    });
    setTeamMembers(nextTeamMembers);
    const evtNotes = (evt as EventRecord & { eventNotes?: EventNote[] }).eventNotes;
    setEventNotes(Array.isArray(evtNotes) ? cloneJson(evtNotes) : []);
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
        checklistDueDates: normalizeChecklistDueDatesRecord(
          evt.settings?.checklistDueDates,
          evt.settings?.checklistDueOffsets,
        ),
        checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
        coverPhotoDataUrl: evt.settings?.coverPhotoDataUrl,
        eventStatus: normalizeEventStatus(
          evt.settings?.eventStatus,
          (evt.settings as EventSettings & { eventLifecycleStatus?: string }).eventLifecycleStatus,
        ),
      }),
    );

    // Reset local editing modes when switching context.
    setEditingTimelineId(null);
    setTimelineNeedsAttention(false);
    setReceptionTimelineInlineEditDraft(null);
    setCeremonyTimelineInlineEditDraft(null);
    setReceptionTimelineExpandedId(null);
    setCeremonyTimelineExpandedId(null);
  };

  const switchToEvent = (nextEventId: string) => {
    // Locate the full hydrated event by id from the live events state.
    // This is the canonical record: it carries the DB-backed per-event
    // shadow fields (e.g. `eventTeamMembers`) populated by the DB hydration
    // effect. We must NOT rebuild it from template/seed data here, or we
    // strip those shadow fields and lose persisted per-event data on the
    // very next render.
    const fullEvent = events.find((e) => e.id === nextEventId) as
      | (EventRecord & { eventTeamMembers?: TeamMember[] })
      | undefined;
    if (!fullEvent) return;

    // Only flush working state back to the previously-active event when we
    // are actually transitioning BETWEEN two events (`appMode === "event"`).
    // When opening an event from the All Events list (`appMode === "events"`),
    // there is no "from" event being edited — the global working state may
    // simply be stale/empty after refresh, and committing it would issue a
    // destructive `replaceEventTeamMembers` (deleteMany+createMany) with
    // that stale payload, wiping the persisted roster for the event we're
    // about to open.
    if (appMode === "event" && activeEventId !== nextEventId) {
      commitActiveEventPlanningToEventsState();
    }

    loadEventPlanningIntoWorkingState(fullEvent);
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
      playIfPossibleSongs: cloneJson(playIfPossibleSongs),
      musicPlaylistLinks: cloneJson(musicPlaylistLinks),
      musicGenreEraSelections: cloneJson(musicGenreEraSelections),
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
      musicTasteProfile: cloneJson(musicTasteProfile),
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
        eventStatus: "Planning",
      },
    };
  };

  const buildCeremonyTimelineFromLegacyEvent = (evt: Partial<EventRecord>): CeremonyTimelineItem[] => {
    const inferredProfile = inferLayoutProfileFromEventType(evt.settings?.eventType ?? "");
    const partnerProcessionalLabel =
      inferredProfile === "Gender-Neutral Wedding"
        ? "Partner/Couple Processional"
        : "Bride/Groom Processional";
    // Respect explicit user state: if the ceremony field is present on the
    // stored event — even as an empty array — that reflects a real save (the
    // user may have intentionally deleted every moment). Only fall through to
    // the legacy-defaults backfill when the field is genuinely absent
    // (truly legacy events that pre-date the ceremonyTimelineItems schema).
    if (Array.isArray(evt.ceremonyTimelineItems)) {
      return evt.ceremonyTimelineItems.map((item, index) => ({
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

  const handleSaveEventModal = async () => {
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
        eventStatus: "Planning",
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
      const weddingProfileWithCeremony =
        (createLayoutProfile === "Wedding" || createLayoutProfile === "Gender-Neutral Wedding") &&
        profileDefaults.sectionCeremonyEnabled;
      newEvent.ceremonyTimelineItems = weddingProfileWithCeremony
        ? buildNewWeddingCeremonyTimelineItems()
        : profileDefaults.sectionCeremonyEnabled
          ? enabledPresets
              .filter((item) => item.timelineType === "ceremony")
              .map((item) =>
                ceremonyTimelineItemFromPreset(
                  item,
                  `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                ),
              )
          : [];
      newEvent.timelineItems =
        createLayoutProfile === "Wedding"
          ? buildNewWeddingMainTimelineItems()
          : enabledPresets
              .filter((item) => item.timelineType === "main")
              .map((item) =>
                mainTimelineItemFromPreset(
                  item,
                  `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                ),
              );
        try {
          const savedDatabaseEvent = await createDatabaseEvent({
            title: eventName,
            date: date ? new Date(date) : null,
            type: draft.eventType || newEvent.settings.eventType,
            venue,
            assignedDj: draft.assignedDj,
            packageName: draft.packageName.trim(),
            plannerName: draft.plannerName.trim(),
            plannerEmail: draft.plannerEmail.trim(),
            ceremonyLocation: draft.ceremonyLocation.trim(),
            receptionLocation: draft.receptionLocation.trim(),
            internalNotes: draft.internalNotes.trim(),
            eventStatus: "Planning",
          });
        
          newEvent.id = savedDatabaseEvent.id;
          databaseEventIdsRef.current.add(savedDatabaseEvent.id);
        } catch (error) {
          console.error("Failed to save event to database:", error);
          setEventModalStatus({
            kind: "error",
            message: "Event was created locally, but failed to save to the database.",
          });
        }

      // Initialize the per-event team-member shadow field so this event has a
      // consistent shape across selection, hydration, and persistence cycles.
      (newEvent as EventRecord & { eventTeamMembers: TeamMember[] }).eventTeamMembers = [];
      (newEvent as EventRecord & { eventNotes: EventNote[] }).eventNotes = [];

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
      const editingEvent = events.find((e) => e.id === eventEditingId);
      const editingEventStatus = normalizeEventStatus(
        editingEvent?.settings?.eventStatus,
        (editingEvent?.settings as EventSettings & { eventLifecycleStatus?: string })
          ?.eventLifecycleStatus,
      );
      console.log("Updating database event:", eventEditingId);
      try {
        await updateDatabaseEvent(eventEditingId, {
          title: eventName,
          date: date ? new Date(date) : null,
          type: draft.eventType,
          venue,
          assignedDj: draft.assignedDj,
          packageName: draft.packageName.trim(),
          plannerName: draft.plannerName.trim(),
          plannerEmail: draft.plannerEmail.trim(),
          ceremonyLocation: draft.ceremonyLocation.trim(),
          receptionLocation: draft.receptionLocation.trim(),
          internalNotes: draft.internalNotes.trim(),
          eventStatus: editingEventStatus,
        });
      } catch (error) {
        console.error("Failed to update event in database:", error);
        setEventModalStatus({
          kind: "error",
          message: "Event was updated locally, but failed to save to the database.",
        });
      }
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
                eventStatus: editingEventStatus,
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
    activeScreen === "Dashboard"
      ? `${appSettings.appName} Dashboard`
      : (currentRole ?? rolePreview) === "Couple" && activeScreen === "Reception Timeline"
        ? "Timeline"
        : activeScreen;
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

  const checklistDueDateSetsForSettings = useMemo(() => {
    const defaults = getDefaultChecklistDueDateSetsForProfiles();
    return EVENT_TYPES.reduce((acc, profile) => {
      acc[profile] = normalizeChecklistDueDatesRecord(
        appSettings.checklistDueDateSets?.[profile],
        appSettings.checklistDueOffsetSets?.[profile],
      );
      if (Object.keys(acc[profile]).length === 0) {
        acc[profile] = defaults[profile] ?? getDefaultChecklistDueDateSets();
      }
      return acc;
    }, {} as Record<EventLayoutProfile, Record<string, ChecklistDueDate>>);
  }, [appSettings.checklistDueDateSets, appSettings.checklistDueOffsetSets]);

  const updateChecklistGlobalDueDate = useCallback(
    (profile: EventLayoutProfile, taskId: string, offsetDays: number) => {
      setAppSettings((prev) => {
        const defaults = getDefaultChecklistDueDateSetsForProfiles();
        const current = {
          ...(prev.checklistDueDateSets?.[profile] ??
            normalizeChecklistDueDatesRecord(undefined, prev.checklistDueOffsetSets?.[profile]) ??
            defaults[profile] ??
            getDefaultChecklistDueDateSets()),
        };
        current[taskId] = { type: "relative", offsetDays };
        return {
          ...prev,
          checklistDueDateSets: {
            ...(prev.checklistDueDateSets ?? {}),
            [profile]: current,
          },
        };
      });
    },
    [setAppSettings],
  );

  const resetChecklistGlobalDueDateSet = useCallback(
    (profile: EventLayoutProfile) => {
      setAppSettings((prev) => ({
        ...prev,
        checklistDueDateSets: {
          ...(prev.checklistDueDateSets ?? {}),
          [profile]: { ...getDefaultChecklistDueDateSets() },
        },
      }));
    },
    [setAppSettings],
  );

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
  const mainTimelinePresetsForActiveEvent = useMemo(
    () => timelinePresetsForActiveEvent.filter((item) => item.timelineType === "main"),
    [timelinePresetsForActiveEvent],
  );

  const buildTimelineItemsFromPresets = useCallback(
    (presets: TimelinePresetItem[], layoutProfile: EventLayoutProfile) => {
      const enabledPresets = presets.filter((item) => item.defaultIncluded);
      const weddingProfileWithCeremony =
        (layoutProfile === "Wedding" || layoutProfile === "Gender-Neutral Wedding") &&
        eventSettings.sectionCeremonyEnabled;
      const ceremonyItems: CeremonyTimelineItem[] = weddingProfileWithCeremony
        ? buildNewWeddingCeremonyTimelineItems()
        : enabledPresets
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
  },
  [eventSettings.sectionCeremonyEnabled],
);

  const applyPresetItemsToTimelineState = useCallback(
    (presets: TimelinePresetItem[], replaceExisting: boolean) => {
      closeReceptionTimelineCardExpanded();
      closeCeremonyTimelineCardExpanded();
      const { ceremonyItems, mainItems } = buildTimelineItemsFromPresets(
        presets,
        layoutProfileForActiveEvent,
      );

      setCeremonyTimelineItems((prev) => (replaceExisting ? ceremonyItems : [...prev, ...ceremonyItems]));
      setTimelineItems((prev) => (replaceExisting ? mainItems : [...prev, ...mainItems]));
    },
    [buildTimelineItemsFromPresets, closeCeremonyTimelineCardExpanded, closeReceptionTimelineCardExpanded, layoutProfileForActiveEvent],
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
  const canManageInternalEventTeam = canManageEvents;
  const canManageEventTeamPartners =
    canManageInternalEventTeam ||
    effectiveRole === "Couple" ||
    effectiveRole === "Planner" ||
    effectiveRole === "DJ";
  const eventTeamRoleGroupsForModal = useMemo(
    () => eventTeamRoleGroupsForActor(canManageInternalEventTeam),
    [canManageInternalEventTeam],
  );
  const teamMemberBeingEdited = teamEditingId
    ? teamMembers.find((member) => member.id === teamEditingId)
    : undefined;
  const canSaveTeamModal =
    canManageEventTeamPartners &&
    (!teamMemberBeingEdited ||
      canActorManageEventTeamMember(teamMemberBeingEdited, canManageInternalEventTeam));
  const teamModalShowsCompanyField =
    teamRoleDraft !== "Admin" && teamRoleDraft !== "DJ";
  const canEditEventCover = effectiveRole !== "DJ";
  const canEditEventStatus = effectiveRole === "Admin" || effectiveRole === "Planner";
  /** Session-only hero preview — not sent to server actions (Base64 exceeds action body limit). */
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

  const openEventCoverSettings = useCallback(() => {
    setActiveScreen("Event Settings");
  }, []);

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

  const openEventCoverPhotoPicker = useCallback(() => {
    eventCoverPhotoInputRef.current?.click();
  }, []);

  const applyEventStatus = useCallback(
    async (status: EventStatus) => {
      setEventSettings((prev) => ({ ...prev, eventStatus: status }));
      if (!activeEventId) return;
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === activeEventId
            ? {
              ...evt,
              lastUpdatedAt: Date.now(),
              settings: { ...evt.settings, eventStatus: status },
            }
            : evt,
        ),
      );
      if (!databaseEventIdsRef.current.has(activeEventId)) return;
      try {
        await updateDatabaseEvent(activeEventId, {
          title: eventSettings.eventName,
          date: eventSettings.weddingDate ? new Date(eventSettings.weddingDate) : null,
          type: eventSettings.eventType,
          venue: eventSettings.venue,
          assignedDj: eventSettings.assignedDj,
          packageName: eventSettings.packageName,
          plannerName: eventSettings.plannerName,
          plannerEmail: eventSettings.plannerEmail,
          ceremonyLocation: eventSettings.ceremonyLocation,
          receptionLocation: eventSettings.receptionLocation,
          internalNotes: eventSettings.internalNotes,
          eventStatus: status,
        });
      } catch (error) {
        console.error("Failed to persist event status:", error);
      }
    },
    [activeEventId, eventSettings],
  );

  const activeEventStatus = useMemo(
    () => normalizeEventStatus(eventSettings.eventStatus),
    [eventSettings.eventStatus],
  );

  const eventStatusDashboardControl = useMemo(
    () =>
      canEditEventStatus ? (
        <label className="inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full border border-white/25 bg-black/45 py-1 pl-3 pr-2 ring-1 ring-white/15">
          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Status
          </span>
          <select
            value={activeEventStatus}
            onChange={(e) => void applyEventStatus(e.target.value as EventStatus)}
            className="min-h-9 min-w-[8.5rem] max-w-[12rem] flex-1 cursor-pointer appearance-none rounded-lg bg-transparent text-[11px] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/55 sm:text-xs"
            aria-label="Event status"
          >
            {EVENT_STATUSES.map((status) => (
              <option key={`dash-hero-status-${status}`} value={status} className="bg-white text-stone-900">
                {status}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span
          className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-white/15 sm:text-xs ${eventStatusPillClassOnCover(activeEventStatus)}`}
        >
          {activeEventStatus}
        </span>
      ),
    [activeEventStatus, applyEventStatus, canEditEventStatus],
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
  const unifiedEventTimeline = sectionCeremonyEnabled && sectionReceptionTimelineEnabled;
  const isTimelineWorkspaceScreen =
    activeScreen === "Timeline" || activeScreen === "Reception Timeline";
  const showUnifiedTimelineWorkspace =
    authStage === "app" &&
    appMode === "event" &&
    isTimelineWorkspaceScreen &&
    unifiedEventTimeline;
  const showCeremonyOnlyTimelineWorkspace =
    authStage === "app" &&
    appMode === "event" &&
    activeScreen === "Ceremony" &&
    sectionCeremonyEnabled &&
    !unifiedEventTimeline;
  const showReceptionOnlyTimelineWorkspace =
    authStage === "app" &&
    appMode === "event" &&
    isTimelineWorkspaceScreen &&
    sectionReceptionTimelineEnabled &&
    !unifiedEventTimeline;
  useEffect(() => {
    if (!hasHydrated) return;
    if (unifiedEventTimeline && activeScreen === "Ceremony") {
      setActiveScreen("Timeline");
    }
  }, [hasHydrated, unifiedEventTimeline, activeScreen, setActiveScreen]);

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
  const acceptedCollaborators = activeEvent?.collaborators?.filter((c) => c.status === "Accepted") ?? [];
  const pendingCollaborators = activeEvent?.collaborators?.filter((c) => c.status === "Pending") ?? [];

  const planningChecklistInput = useMemo(
    (): PlanningChecklistInput => ({
      eventName: eventSettings.eventName,
      coupleNames: eventSettings.coupleNames,
      venue: eventSettings.venue,
      weddingDate: eventSettings.weddingDate,
      plannerName: eventSettings.plannerName,
      plannerEmail: eventSettings.plannerEmail,
      teamMembers,
      planningQuestionAnswers: eventSettings.planningQuestionAnswers ?? {},
      mustPlaySongs,
      doNotPlaySongs,
      playIfPossibleSongs,
      musicPlaylistLinks,
      musicGenreEraSelections,
      musicTasteProfile,
      playlistVibeOverrides,
      weddingPartyProcessional,
      brideGroomProcessional,
      recessionalSong,
      ceremonyTimelineItems,
      timelineItems,
      guestRequests,
      generalDjNotes,
      sectionReceptionTimelineEnabled,
      receptionHubEligibleNav,
    }),
    [
      eventSettings.eventName,
      eventSettings.coupleNames,
      eventSettings.venue,
      eventSettings.weddingDate,
      eventSettings.plannerName,
      eventSettings.plannerEmail,
      eventSettings.planningQuestionAnswers,
      teamMembers,
      mustPlaySongs,
      doNotPlaySongs,
      playIfPossibleSongs,
      musicPlaylistLinks,
      musicGenreEraSelections,
      musicTasteProfile,
      playlistVibeOverrides,
      weddingPartyProcessional,
      brideGroomProcessional,
      recessionalSong,
      ceremonyTimelineItems,
      timelineItems,
      guestRequests,
      generalDjNotes,
      sectionReceptionTimelineEnabled,
      receptionHubEligibleNav,
    ],
  );

  const hasKeyCeremonySongs = computeCeremonyMusicComplete(planningChecklistInput);
  const hasKeyFormalDanceSongs = computeKeyFormalDanceSongs(planningChecklistInput);
  const hasKeyTimelineMoments = computeKeyTimelineMoments(planningChecklistInput);
  const hasFinalDjNotes = computeFinalDjNotesComplete(planningChecklistInput);
  const hasEventDetailsComplete = computeEventDetailsComplete(planningChecklistInput);

  const planningChecklistDueConfig = useMemo(
    (): PlanningChecklistDueConfig => ({
      eventDueOverrides: eventSettings.checklistDueDates,
      globalDefaultDueDates: checklistDueDateSetsForSettings[layoutProfileForActiveEvent],
    }),
    [
      eventSettings.checklistDueDates,
      checklistDueDateSetsForSettings,
      layoutProfileForActiveEvent,
    ],
  );

  const planningChecklist = useMemo(
    () =>
      buildPlanningChecklist(
        planningChecklistInput,
        planningChecklistDueConfig,
        eventSettings.checklistManualStatuses,
      ),
    [
      planningChecklistInput,
      planningChecklistDueConfig,
      eventSettings.checklistManualStatuses,
    ],
  );

  const completionPercent = planningChecklistCompletionPercent(planningChecklist);
  const canEditChecklistDueTiming = effectiveRole === "Admin" || effectiveRole === "DJ";
  const isCoupleView = effectiveRole === "Couple";
  /** Run Of Show is operator-facing only — not for couple/client packet review. */
  const canAccessRunOfShow = effectiveRole !== "Couple";
  /** Couple role cannot see ROS UI; keeps scroll lock off if `runOfShowOpen` is stale. */
  const runOfShowOverlayActive = runOfShowOpen && canAccessRunOfShow;

  useLayoutEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return;
    if (runOfShowOverlayActive) return;

    const next = { screen: activeScreen, mode: appMode, auth: authStage };
    const prev = prevMainNavScrollRef.current;
    prevMainNavScrollRef.current = next;
    if (!prev) return;
    if (prev.screen === next.screen && prev.mode === next.mode && prev.auth === next.auth) return;

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (timelineStreamRef.current) timelineStreamRef.current.scrollTop = 0;
    if (ceremonyTimelineStreamRef.current) ceremonyTimelineStreamRef.current.scrollTop = 0;
  }, [activeScreen, appMode, authStage, hasHydrated]);

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
      cocktailHour: [...cocktailSeed],
      dinner: [...dinnerSeed],
      openDancing: [...openSeed],
      afterparty: [],
      custom: [],
    };
  }, []);

  const hasMomentPlaylistLines = useMemo(
    () => PLAYLIST_BUCKET_IDS.some((id) => (playlistVibeOverrides[id]?.length ?? 0) > 0),
    [playlistVibeOverrides],
  );

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
            openReceptionTimelineComposerAtTop();
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
          id: "invite-team-member",
          label: "Invite to app",
          visible: appMode === "event" && canInviteCollaborators,
          onClick: () => {
            setActiveScreen("Event Team");
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

    const matchesArchivedVisibility = (evt: EventRecord) => {
      const status = normalizeEventStatus(
        evt.settings?.eventStatus,
        (evt.settings as EventSettings & { eventLifecycleStatus?: string }).eventLifecycleStatus,
      );
      if (!isArchivedEventStatus(status)) return true;
      return allEventsShowArchived;
    };

    let rows = visibleEvents.filter((evt) => {
      if (!matchesArchivedVisibility(evt)) return false;
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
    allEventsShowArchived,
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
        const evtMusicTaste =
          (evt.mustPlaySongs?.length ?? 0) > 0 ||
          (evt.playIfPossibleSongs?.length ?? 0) > 0 ||
          (evt.musicPlaylistLinks?.length ?? 0) > 0 ||
          (evt.musicGenreEraSelections?.length ?? 0) > 0 ||
          musicTasteProfileHasSelections(normalizeMusicTasteProfile(evt.musicTasteProfile)) ||
          PLAYLIST_BUCKET_IDS.some((id) => (evt.playlistVibeOverrides?.[id]?.length ?? 0) > 0);
        const incompleteChecklistCount = [
          !evt.settings?.eventName?.trim(),
          !evt.settings?.coupleNames?.trim(),
          !evt.settings?.venue?.trim(),
          !evt.settings?.weddingDate?.trim(),
          (evt.settings?.sectionMustPlayEnabled || evt.settings?.sectionPlaylistsEnabled) &&
          !evtMusicTaste,
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
    setTeamRoleDraft(
      canManageInternalEventTeam ? "DJ" : DEFAULT_EVENT_TEAM_VENDOR_ROLE,
    );
    setTeamCompanyDraft("");
    setTeamEmailDraft("");
    setTeamPhoneDraft("");
    setTeamNotesDraft("");
    setTeamWebsiteDraft("");
    setTeamInstagramDraft("");
    setTeamArrivalDraft("");
    setTeamCoordinationDraft("");
    setTeamActiveDraft(true);
  };

  const startEditingTeamMember = (member: TeamMember) => {
    if (!canActorManageEventTeamMember(member, canManageInternalEventTeam)) {
      setTeamFormStatus({
        kind: "error",
        message:
          "This contact is managed by your Cutmaster team. You can add and edit vendors and day-of partners.",
      });
      return;
    }
    setTeamEditingId(member.id);
    setTeamNameDraft(member.name);
    setTeamRoleDraft(member.role);
    setTeamCompanyDraft(member.company ?? "");
    setTeamEmailDraft(member.email);
    setTeamPhoneDraft(member.phone);
    setTeamNotesDraft(member.notes);
    setTeamWebsiteDraft(member.website ?? "");
    setTeamInstagramDraft(member.instagram ?? "");
    setTeamArrivalDraft(member.arrivalTime ?? "");
    setTeamCoordinationDraft(member.specialCoordinationNotes ?? "");
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

  // Persist the new roster to the database. Returns a result object so the
  // caller can branch on success/failure (keep the modal open on failure,
  // close on success). No silent skips: if there's no active event id we
  // return ok:false so the caller can surface that to the user. If the
  // server action throws, we return ok:false with the error.
  const writeTeamMembersToDatabase = async (
    nextTeamMembers: TeamMember[],
  ): Promise<
    | { ok: true; rows: Awaited<ReturnType<typeof replaceEventTeamMembers>> }
    | { ok: false; error: unknown }
  > => {
    if (!activeEventId) {
      const error = new Error("No active event id; cannot persist team members.");
      console.warn(
        "writeTeamMembersToDatabase: skipping — no activeEventId",
      );
      return { ok: false, error };
    }
    // Optimistic shadow update so the in-memory event keeps the new roster
    // even before the server roundtrip completes.
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === activeEventId
          ? ({
              ...evt,
              eventTeamMembers: cloneJson(nextTeamMembers),
            } as EventRecord)
          : evt,
      ),
    );

    try {
      console.log("CALLING replaceEventTeamMembers", {
        activeEventId,
        count: nextTeamMembers.length,
        names: nextTeamMembers.map((m) => m.name),
      });
      const savedRows = await replaceEventTeamMembers(
        activeEventId,
        nextTeamMembers.map((member, index) => ({
          name: member.name,
          role: member.role,
          company: member.company || null,
          email: member.email || null,
          phone: member.phone || null,
          notes: member.notes || null,
          website: member.website || null,
          instagram: member.instagram || null,
          arrivalTime: member.arrivalTime || null,
          specialCoordinationNotes: member.specialCoordinationNotes || null,
          isActive: member.isActive,
          order: index,
        })),
      );
      console.log("replaceEventTeamMembers returned", {
        activeEventId,
        rowsReturned: Array.isArray(savedRows) ? savedRows.length : null,
        savedRows,
      });

      if (
        Array.isArray(savedRows) &&
        savedRows.length === nextTeamMembers.length
      ) {
        const reconciled = savedRows
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((row, index) => ({
            ...nextTeamMembers[index],
            id: row.id,
            isActive: row.isActive,
          }));
        setTeamMembers(reconciled);
        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === activeEventId
              ? ({
                  ...evt,
                  eventTeamMembers: reconciled,
                } as EventRecord)
              : evt,
          ),
        );
      } else if (Array.isArray(savedRows) && savedRows.length === 0) {
        // The server returned an empty result — typically because the event
        // id didn't exist in the DB (server-side findUnique safety check).
        // Surface that to the caller so the modal can keep itself open and
        // show an error.
        const error = new Error(
          `Server returned no rows for event "${activeEventId}". The event may not exist in the database yet.`,
        );
        return { ok: false, error };
      }
      return { ok: true, rows: savedRows };
    } catch (error) {
      console.error("replaceEventTeamMembers threw", error);
      return { ok: false, error };
    }
  };

  const saveTeamMember = async () => {
    console.log("SAVE TEAM MEMBER CLICKED");

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

    if (
      !canManageInternalEventTeam &&
      (teamRoleDraft === "Admin" ||
        teamRoleDraft === "DJ" ||
        (teamRoleDraft === "Planner" && !teamCompanyDraft.trim()))
    ) {
      setTeamFormStatus({
        kind: "error",
        message:
          "Add vendors and day-of contacts here. For a wedding planner, choose Planner and enter their company name.",
      });
      return;
    }

    if (teamEditingId) {
      const existing = teamMembers.find((member) => member.id === teamEditingId);
      if (existing && !canActorManageEventTeamMember(existing, canManageInternalEventTeam)) {
        setTeamFormStatus({
          kind: "error",
          message: "You cannot edit internal Cutmaster staff on this event.",
        });
        return;
      }
    }

    const company = teamCompanyDraft.trim();
    const phone = teamPhoneDraft.trim();
    const notes = teamNotesDraft.trim();
    const website = teamWebsiteDraft.trim();
    const instagram = teamInstagramDraft.trim();
    const arrivalTime = teamArrivalDraft.trim();
    const specialCoordinationNotes = teamCoordinationDraft.trim();

    // Build the next roster up front so we can log it and pass it directly
    // to `replaceEventTeamMembers`. Add path prepends a fresh member; edit
    // path patches the matching entry in place.
    const newMember: TeamMember | null = teamEditingId
      ? null
      : {
          id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          role: teamRoleDraft,
          company,
          email,
          phone,
          notes,
          website,
          instagram,
          arrivalTime,
          specialCoordinationNotes,
          isActive: teamActiveDraft,
        };

    const nextTeamMembers: TeamMember[] = newMember
      ? [newMember, ...teamMembers]
      : teamMembers.map((member) =>
          member.id === teamEditingId
            ? {
                ...member,
                name,
                role: teamRoleDraft,
                company,
                email,
                phone,
                notes,
                website,
                instagram,
                arrivalTime,
                specialCoordinationNotes,
                isActive: teamActiveDraft,
              }
            : member,
        );

    console.log("activeEventId", activeEventId);
    console.log("nextTeamMembers", nextTeamMembers);

    if (!activeEventId) {
      setTeamFormStatus({
        kind: "error",
        message:
          "Cannot save: no active event id. Open or create an event first.",
      });
      return;
    }

    setTeamSaving(true);
    setTeamFormStatus({ kind: "success", message: "Saving…" });

    try {
      // Optimistic UI: render the new roster immediately so the modal's
      // status banner and the list under it reflect what we're attempting
      // to save. The DB write happens next, awaited.
      setTeamMembers(nextTeamMembers);
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === activeEventId
            ? ({
                ...evt,
                eventTeamMembers: cloneJson(nextTeamMembers),
              } as EventRecord)
            : evt,
        ),
      );

      // *** The single, direct DB call the user asked for. ***
      const savedRows = await replaceEventTeamMembers(
        activeEventId,
        nextTeamMembers.map((member, index) => ({
          name: member.name,
          role: member.role,
          company: member.company || null,
          email: member.email || null,
          phone: member.phone || null,
          notes: member.notes || null,
          website: member.website || null,
          instagram: member.instagram || null,
          arrivalTime: member.arrivalTime || null,
          specialCoordinationNotes: member.specialCoordinationNotes || null,
          isActive: member.isActive,
          order: index,
        })),
      );
      console.log("replaceEventTeamMembers returned", {
        activeEventId,
        rowsReturned: Array.isArray(savedRows) ? savedRows.length : null,
        savedRows,
      });

      // If the server returned 0 rows for a non-empty payload, that means
      // the event id isn't in the DB (server-side safety check). Surface
      // that and keep the modal open.
      if (
        nextTeamMembers.length > 0 &&
        Array.isArray(savedRows) &&
        savedRows.length === 0
      ) {
        setTeamFormStatus({
          kind: "error",
          message: `Save failed: event "${activeEventId}" does not exist in the database. Open or create a DB-backed event.`,
        });
        return;
      }

      // Reconcile local cuids with what Prisma just assigned so subsequent
      // edits/deletes target the right rows.
      if (
        Array.isArray(savedRows) &&
        savedRows.length === nextTeamMembers.length
      ) {
        const reconciled = savedRows
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((row, index) => ({
            ...nextTeamMembers[index],
            id: row.id,
            isActive: row.isActive,
          }));
        setTeamMembers(reconciled);
        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === activeEventId
              ? ({
                  ...evt,
                  eventTeamMembers: reconciled,
                } as EventRecord)
              : evt,
          ),
        );
      }

      logActivity(
        "team_member_added",
        teamEditingId ? `Updated team member: ${name}` : `Added team member: ${name}`,
      );
      setTeamFormStatus({
        kind: "success",
        message: teamEditingId
          ? `Saved updates for ${name}.`
          : `Added ${name} to the team.`,
      });
      closeTeamMemberModal();
    } catch (error) {
      console.error("replaceEventTeamMembers threw", error);
      setTeamFormStatus({
        kind: "error",
        message: `Save failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setTeamSaving(false);
    }
  };

  const deleteTeamMember = async (teamMemberId: string) => {
    const target = teamMembers.find((member) => member.id === teamMemberId);
    if (target && !canActorManageEventTeamMember(target, canManageInternalEventTeam)) {
      setTeamFormStatus({
        kind: "error",
        message: "You cannot remove internal Cutmaster staff from this event.",
      });
      return;
    }
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm(
          appMode === "event"
            ? `Remove "${target?.name || "this contact"}" from this event's team?`
            : `Permanently delete "${target?.name || "this team member"}" from your workspace team? This does not delete events, but DJ assignments to this person are cleared.`,
        );
    if (!ok) return;
    const nextMembers = teamMembers.filter((member) => member.id !== teamMemberId);
    console.log("DELETE TEAM MEMBER nextTeamMembers", {
      activeEventId,
      appMode,
      teamMemberId,
      names: nextMembers.map((m) => m.name),
      nextMembers,
    });
    setTeamMembers(nextMembers);
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
    const result = await writeTeamMembersToDatabase(nextMembers);
    if (!result.ok) {
      setTeamFormStatus({
        kind: "error",
        message: `Delete failed: ${
          result.error instanceof Error
            ? result.error.message
            : "Unknown error"
        }`,
      });
    }
  };

  const resetEventNoteDraft = () => {
    setNoteEditingId(null);
    setNoteCategoryDraft("General");
    setNoteTitleDraft("");
    setNoteBodyDraft("");
    setNotePinnedDraft(false);
  };

  const openAddEventNoteModal = () => {
    resetEventNoteDraft();
    setNoteFormStatus(null);
    setNoteModalOpen(true);
  };

  const startEditingEventNote = (note: EventNote) => {
    setNoteEditingId(note.id);
    setNoteCategoryDraft(note.category || "General");
    setNoteTitleDraft(note.title);
    setNoteBodyDraft(note.body);
    setNotePinnedDraft(note.isPinned);
    setNoteFormStatus(null);
    setNoteModalOpen(true);
  };

  const closeEventNoteModal = () => {
    setNoteModalOpen(false);
    resetEventNoteDraft();
  };

  const sortEventNotesForDisplay = (notes: EventNote[]) =>
    notes
      .slice()
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return 0;
      });

  const persistEventNotesToDatabase = async (
    nextNotes: EventNote[],
  ): Promise<
    | { ok: true; rows: Awaited<ReturnType<typeof replaceEventNotes>> }
    | { ok: false; error: unknown }
  > => {
    if (!activeEventId) {
      return { ok: false, error: new Error("No active event id; cannot persist notes.") };
    }
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === activeEventId
          ? ({ ...evt, eventNotes: cloneJson(nextNotes) } as EventRecord)
          : evt,
      ),
    );
    try {
      const savedRows = await replaceEventNotes(
        activeEventId,
        nextNotes.map((note, index) => ({
          category: note.category || "General",
          title: note.title?.trim() || null,
          body: note.body,
          isPinned: note.isPinned,
          order: index,
        })),
      );
      if (nextNotes.length > 0 && Array.isArray(savedRows) && savedRows.length === 0) {
        return {
          ok: false,
          error: new Error(
            `Server returned no rows for event "${activeEventId}". The event may not exist in the database yet.`,
          ),
        };
      }
      if (Array.isArray(savedRows) && savedRows.length === nextNotes.length) {
        const reconciled = savedRows
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((row, index) => ({
            ...nextNotes[index],
            id: row.id,
            category: row.category,
            title: row.title ?? "",
            body: row.body,
            isPinned: row.isPinned,
          }));
        setEventNotes(reconciled);
        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === activeEventId
              ? ({ ...evt, eventNotes: reconciled } as EventRecord)
              : evt,
          ),
        );
      }
      return { ok: true, rows: savedRows };
    } catch (error) {
      console.error("replaceEventNotes threw", error);
      return { ok: false, error };
    }
  };

  const saveEventNote = async () => {
    const body = noteBodyDraft.trim();
    if (!body) {
      setNoteFormStatus({ kind: "error", message: "Note body is required." });
      return;
    }
    if (!activeEventId) {
      setNoteFormStatus({
        kind: "error",
        message: "Cannot save: no active event id. Open or create an event first.",
      });
      return;
    }
    if (noteSaving) return;

    const category = noteCategoryDraft.trim() || "General";
    const title = noteTitleDraft.trim();
    const newNote: EventNote | null = noteEditingId
      ? null
      : {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category,
          title,
          body,
          isPinned: notePinnedDraft,
        };

    const nextNotes: EventNote[] = newNote
      ? [newNote, ...eventNotes]
      : eventNotes.map((note) =>
          note.id === noteEditingId
            ? { ...note, category, title, body, isPinned: notePinnedDraft }
            : note,
        );

    setNoteSaving(true);
    setNoteFormStatus({ kind: "success", message: "Saving…" });
    setEventNotes(nextNotes);

    const result = await persistEventNotesToDatabase(nextNotes);
    if (!result.ok) {
      setNoteFormStatus({
        kind: "error",
        message: `Save failed: ${
          result.error instanceof Error ? result.error.message : "Unknown error"
        }`,
      });
      setNoteSaving(false);
      return;
    }

    setNoteFormStatus({
      kind: "success",
      message: noteEditingId ? "Saved note." : "Added note.",
    });
    closeEventNoteModal();
    setNoteSaving(false);
  };

  const deleteEventNote = async (noteId: string) => {
    const target = eventNotes.find((note) => note.id === noteId);
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm(`Delete note "${target?.title?.trim() || "this note"}"?`);
    if (!ok) return;
    const nextNotes = eventNotes.filter((note) => note.id !== noteId);
    if (noteEditingId === noteId) closeEventNoteModal();
    setEventNotes(nextNotes);
    const result = await persistEventNotesToDatabase(nextNotes);
    if (!result.ok) {
      setNoteFormStatus({
        kind: "error",
        message: `Delete failed: ${
          result.error instanceof Error ? result.error.message : "Unknown error"
        }`,
      });
    }
  };

  const toggleEventNotePinned = async (noteId: string) => {
    if (!canEditNotes || !activeEventId) return;
    const nextNotes = eventNotes.map((note) =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note,
    );
    setEventNotes(nextNotes);
    const result = await persistEventNotesToDatabase(nextNotes);
    if (!result.ok) {
      setNoteFormStatus({
        kind: "error",
        message: `Pin update failed: ${
          result.error instanceof Error ? result.error.message : "Unknown error"
        }`,
      });
    }
  };

  const displayedEventNotes = useMemo(
    () => sortEventNotesForDisplay(eventNotes),
    [eventNotes],
  );

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
      setVendorStatus({ kind: "error", message: "Role is required." });
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
    if (!sectionReceptionTimelineEnabled) return null;
    return "Timeline";
  }, [sectionReceptionTimelineEnabled]);

  const coupleGuidedNextScreen = useMemo((): Screen => {
    const answers = eventSettings.planningQuestionAnswers ?? {};
    const unansweredPlanningQuestionCount = planningQuestionsForEvent.filter(
      (q) => !answers[q.id]?.trim(),
    ).length;
    const pendingGuestCount = guestRequests.filter((r) => r.status === "Pending").length;
    const hasMusicTasteSignal = computeMusicTasteSignal(planningChecklistInput);

    if (!hasEventDetailsComplete) return "Event Settings";
    if (sectionCeremonyEnabled && !hasKeyCeremonySongs) return unifiedEventTimeline ? "Timeline" : "Ceremony";

    if (sectionReceptionTimelineEnabled && (!hasKeyTimelineMoments || !hasKeyFormalDanceSongs)) {
      return "Timeline";
    }

    if (
      (sectionMustPlayEnabled || sectionPlaylistsEnabled) &&
      !hasMusicTasteSignal
    ) {
      return "Music Hub";
    }

    if (sectionPlanningQuestionsEnabled && unansweredPlanningQuestionCount > 0) {
      return "Planning Questions";
    }
    if (sectionGuestRequestsEnabled && pendingGuestCount > 0) return "Guest Requests";

    const nextIncomplete = planningChecklist.find((t) => t.status !== "Complete");
    if (nextIncomplete) return nextIncomplete.linkedSection;

    if (sectionPlanningChecklistEnabled) return "Planning Checklist";
    return eventNavItems.includes("Event Prep") ? "Event Prep" : "Music Hub";
  }, [
    planningChecklist,
    planningChecklistInput,
    eventSettings.planningQuestionAnswers,
    eventNavItems,
    guestRequests,
    hasEventDetailsComplete,
    hasKeyCeremonySongs,
    hasKeyFormalDanceSongs,
    hasKeyTimelineMoments,
    sectionMustPlayEnabled,
    sectionPlaylistsEnabled,
    planningQuestionsForEvent,
    sectionCeremonyEnabled,
    sectionGuestRequestsEnabled,
    sectionPlanningChecklistEnabled,
    sectionPlanningQuestionsEnabled,
    sectionReceptionTimelineEnabled,
    unifiedEventTimeline,
  ]);

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
      statLine?: string;
      statSubline?: string;
    };
    const cards: CoupleHomeSectionCard[] = [];

    const relTime = (ts: number) => {
      const diffMs = nowTick - ts;
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    };

    const lastTimelineActivity = activities
      .filter((a) => a.eventId === activeEventId && a.type === "timeline_updated")
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    const timelineUpdatedLabel = lastTimelineActivity ? relTime(lastTimelineActivity.timestamp) : null;

    const lastCeremonyActivity = activities
      .filter((a) => a.eventId === activeEventId && a.type === "ceremony_updated")
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    const ceremonyUpdatedLabel = lastCeremonyActivity ? relTime(lastCeremonyActivity.timestamp) : null;

    const receptionMomentCount = timelineItems.length;
    const ceremonyMomentCount = ceremonyTimelineItems.length;

    if (sectionCeremonyEnabled && !unifiedEventTimeline) {
      cards.push({
        id: "ceremony",
        kicker: "Ceremony",
        title: "Ceremony",
        description: "Aisle to recessional—moments, music, and cues in order.",
        screen: "Ceremony",
        completion: hasKeyCeremonySongs ? 100 : 38,
        ctaLabel: hasKeyCeremonySongs ? "Review" : "Continue",
        statLine: `${ceremonyMomentCount} ceremony moment${ceremonyMomentCount === 1 ? "" : "s"}`,
        statSubline: ceremonyUpdatedLabel
          ? `Last updated ${ceremonyUpdatedLabel}`
          : ceremonyMomentCount > 0
            ? "Refine anytime before the rehearsal"
            : "Start with a preset or your own flow",
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
        kicker: "Timeline",
        title: unifiedEventTimeline ? "Event timeline" : "Reception timeline",
        description: unifiedEventTimeline
          ? "Ceremony through reception—one continuous flow for the full event day."
          : "Your evening in order—times, moments, songs, and MC notes.",
        screen: coupleTimelineEntryScreen,
        completion,
        ctaLabel: needsWork ? "Continue" : "Review",
        statLine: unifiedEventTimeline
          ? `${ceremonyMomentCount + receptionMomentCount} moment${ceremonyMomentCount + receptionMomentCount === 1 ? "" : "s"} · ceremony & reception`
          : `${receptionMomentCount} moment${receptionMomentCount === 1 ? "" : "s"} planned`,
        statSubline: timelineUpdatedLabel
          ? `Last updated ${timelineUpdatedLabel}`
          : receptionMomentCount > 0
            ? "Scroll top to bottom like the night itself"
            : "Add your first moment when timing feels real",
      });
    }

    if (sectionMustPlayEnabled || sectionDoNotPlayEnabled || sectionPlaylistsEnabled) {
      const tasteDone =
        musicPlaylistLinks.length > 0 ||
        musicGenreEraSelections.length > 0 ||
        mustPlaySongs.length > 0 ||
        playIfPossibleSongs.length > 0 ||
        hasMomentPlaylistLines ||
        musicTasteProfileHasSelections(musicTasteProfile);
      const completion = tasteDone ? 100 : 40;
      const pl = musicPlaylistLinks.length;
      const ge = musicGenreEraSelections.length;
      const tp =
        musicTasteProfile.danceFloorStyles.length +
        musicTasteProfile.crowdPreferences.length +
        musicTasteProfile.musicBehavior.length;
      const tpNotes = Boolean(musicTasteProfile.danceFloorVibeNotes?.trim());
      const tasteParts: string[] = [];
      if (pl > 0) tasteParts.push(`${pl} playlist${pl === 1 ? "" : "s"}`);
      if (ge > 0) tasteParts.push(`${ge} style ${ge === 1 ? "pick" : "picks"}`);
      if (tp > 0) tasteParts.push(`${tp} taste ${tp === 1 ? "tag" : "tags"}`);
      if (tpNotes) tasteParts.push("Vibe notes");
      const must = mustPlaySongs.length;
      const pif = playIfPossibleSongs.length;
      if (must > 0) tasteParts.push(`${must} must-play${must === 1 ? "" : "s"}`);
      if (pif > 0) tasteParts.push(`${pif} play-if-possible`);
      const statLineMusic =
        tasteParts.length > 0
          ? tasteParts.join(" · ")
          : hasMomentPlaylistLines
            ? "Vibe buckets have song ideas"
            : "No playlists or picks yet";
      cards.push({
        id: "music",
        kicker: "Music",
        title: "Music hub",
        description: "Playlists, vibe, and the songs that matter—without overwhelming your DJ.",
        screen: "Music Hub",
        completion,
        ctaLabel: completion >= 100 ? "Review" : "Continue",
        statLine: statLineMusic,
        statSubline: tasteDone
          ? "Your DJ can prep from what you’ve shared"
          : "Share a link or tag a few eras to get started",
      });
    }

    if (eventNavItems.includes("Event Team")) {
      const collabs = activeEvent?.collaborators ?? [];
      const acc = acceptedCollaborators.length;
      const pend = pendingCollaborators.length;
      const v = sectionVendorContactsEnabled ? vendors.length : 0;
      const hasAny = v > 0 || collabs.length > 0;
      const completion = !hasAny
        ? 28
        : Math.min(
          100,
          38 + Math.min(v, 5) * 11 + Math.min(collabs.length, 5) * 9 + (pend > 0 ? -6 : 0),
        );
      const statParts: string[] = [];
      if (sectionVendorContactsEnabled) {
        statParts.push(`${v} day-of contact${v === 1 ? "" : "s"}`);
      }
      if (collabs.length > 0) {
        statParts.push(`${acc} with app access${pend > 0 ? ` · ${pend} invite${pend === 1 ? "" : "s"} pending` : ""}`);
      } else {
        statParts.push("App access: couple account only");
      }
      cards.push({
        id: "event-team",
        kicker: "Team",
        title: "Event team",
        description:
          "People helping with your event—reach them in one place, and see who can edit or view the plan in the app.",
        screen: "Event Team",
        completion,
        ctaLabel: hasAny ? "Review" : "Continue",
        statLine: statParts.join(" · "),
        statSubline: sectionVendorContactsEnabled
          ? v === 0 && collabs.length <= 1
            ? "Add planners, venue, photo, or entertainment when contracts land"
            : "Keep phones and emails current for day-of"
          : "Vendor list is off in Event Settings—you can still manage app access here",
      });
    }

    if (sectionGuestRequestsEnabled) {
      const pendingGuestCount = guestRequests.filter((r) => r.status === "Pending").length;
      const approvedGuestCount = guestRequests.filter((r) => r.status === "Approved").length;
      const completion =
        pendingGuestCount > 0 ? 52 : guestRequests.length === 0 ? 72 : 100;
      cards.push({
        id: "guest-requests",
        kicker: "Guests",
        title: "Guest requests",
        description: "Song ideas and notes from the people celebrating with you.",
        screen: "Guest Requests",
        completion,
        ctaLabel: pendingGuestCount > 0 ? "Continue" : "Review",
        pendingBadge: pendingGuestCount > 0 ? `${pendingGuestCount} pending` : undefined,
        statLine:
          guestRequests.length === 0
            ? "No requests yet"
            : `${guestRequests.length} total · ${approvedGuestCount} approved`,
        statSubline:
          pendingGuestCount > 0
            ? `${pendingGuestCount} waiting for your review`
            : guestRequests.length > 0
              ? "Inbox is clear"
              : "Share the link when invitations go out",
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
        pqCta = "Start questions";
      } else if (!requiredComplete) {
        completionStatus = "In Progress";
        pqCta = "Continue questions";
      } else {
        completionStatus = "Complete";
        pqCta = "Review answers";
      }
      const pqPct =
        pqList.length === 0 ? 100 : Math.round((answeredCount / pqList.length) * 100);
      cards.push({
        id: "planning-questions",
        kicker: "Questions",
        title: "Planning questions",
        description: "Short prompts so nothing important gets lost in the shuffle.",
        screen: "Planning Questions",
        completion: pqPct,
        ctaLabel: pqCta,
        completionStatusLabel: completionStatus,
        statLine: `${pqPct}% complete (${answeredCount}/${pqList.length})`,
        statSubline:
          completionStatus === "Complete"
            ? "Required prompts are covered—you can still edit anytime"
            : completionStatus === "Not Started"
              ? "About five minutes to get momentum"
              : "Pick up where you left off",
      });
    }

    if (eventNavItems.includes("Event Prep")) {
      cards.push({
        id: "event-prep",
        kicker: "Day-of",
        title: "Event document",
        description: "Printable packet and live view for your team when the day arrives.",
        screen: "Event Prep",
        completion: hasFinalDjNotes ? 100 : 48,
        ctaLabel: hasFinalDjNotes ? "Review" : "Continue",
        statLine: hasFinalDjNotes ? "Music notes feel ready to export" : "Add a short overall note for your DJ",
        statSubline: "Same export your vendors use on the day",
      });
    }

    const clientHomeOrder = [
      "reception",
      "music",
      "event-team",
      "planning-questions",
      "ceremony",
      "event-prep",
      "guest-requests",
    ];
    return clientHomeOrder
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is (typeof cards)[number] => Boolean(c));
  }, [
    activeEventId,
    activities,
    ceremonyTimelineItems.length,
    coupleTimelineEntryScreen,
    eventNavItems,
    eventSettings.planningQuestionAnswers,
    guestRequests,
    hasFinalDjNotes,
    hasKeyCeremonySongs,
    hasKeyFormalDanceSongs,
    hasKeyTimelineMoments,
    hasMomentPlaylistLines,
    mustPlaySongs.length,
    playIfPossibleSongs.length,
    musicPlaylistLinks.length,
    musicGenreEraSelections.length,
    musicTasteProfile,
    nowTick,
    sectionCeremonyEnabled,
    sectionDoNotPlayEnabled,
    sectionGuestRequestsEnabled,
    sectionMustPlayEnabled,
    sectionPlanningQuestionsEnabled,
    sectionPlaylistsEnabled,
    sectionReceptionTimelineEnabled,
    sectionVendorContactsEnabled,
    timelineItems.length,
    unifiedEventTimeline,
    vendors.length,
    activeEvent?.collaborators,
    acceptedCollaborators.length,
    pendingCollaborators.length,
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
        { kind: "screen", screen: "Event Team", label: "Event team" },
        { kind: "screen", screen: "Planning Questions", label: "Planning questions" },
        { kind: "screen", screen: "Planning Checklist", label: "Planning progress" },
        { kind: "screen", screen: "Notes", label: "Planning notes" },
        { kind: "screen", screen: "Event Settings", label: "Event logistics" },
      ]);
    }

    if (effectiveRole === "DJ") {
      return filterScreens([
        { kind: "screen", screen: "Event Prep", label: "Event Document" },
        { kind: "screen", screen: "Music Hub", label: "Music hub · playlists & taste" },
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
          label: "Event team contacts",
          value: `${vendors.length}`,
          detail: "Partners and contacts on file for coordination.",
        },
      ];
    }

    if (effectiveRole === "DJ") {
      const musicTasteDone =
        musicPlaylistLinks.length > 0 ||
        musicGenreEraSelections.length > 0 ||
        mustPlaySongs.length > 0 ||
        playIfPossibleSongs.length > 0 ||
        hasMomentPlaylistLines ||
        musicTasteProfileHasSelections(musicTasteProfile);
      const musicReady =
        (!sectionMustPlayEnabled && !sectionPlaylistsEnabled) ||
        musicTasteDone ||
        generalDjNotes.trim().length > 0;
      return [
        {
          label: "Music readiness",
          value: musicReady ? pctLabel : "In progress",
          detail: "Playlist links, genre picks, must-plays, and guardrails for show time.",
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
          label: "Event team",
          value: `${collaboratorCount} with access`,
          detail: `${vendors.length} vendor-style contact${vendors.length === 1 ? "" : "s"} on file for this event.`,
        },
      ];
    }

    return [];
  }, [
    activeEvent?.collaborators,
    completionPercent,
    coupleAttentionSummary.unansweredPlanningQuestionCount,
    effectiveRole,
    enabledSectionToggleCount,
    generalDjNotes,
    musicGenreEraSelections.length,
    musicTasteProfile,
    musicPlaylistLinks.length,
    mustPlaySongs.length,
    playIfPossibleSongs.length,
    hasMomentPlaylistLines,
    sectionMustPlayEnabled,
    sectionPlaylistsEnabled,
    mcAnnouncements,
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
          "Event Team",
          "Planning Questions",
          "Planning Checklist",
          "Notes",
          "Event Settings",
          "Guest Requests",
          "Ceremony",
          "Music Hub",
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
          "Event Team",
          "Notes",
        ];
      } else if (effectiveRole === "Admin") {
        preferred = [
          "Event Settings",
          "Event Prep",
          "Music Hub",
          tl,
          "Event Team",
          "Planning Questions",
          "Ceremony",
          "Guest Requests",
          "Planning Checklist",
          "Notes",
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
      return "Timeline";
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

      if (activeScreen === "Reception Hub") {
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
  useEffect(() => {
    const loadDatabaseEvents = async () => {
      try {
        const databaseEvents = await getDatabaseEvents();

        // Always populate the DB-event-id set, even when the database is empty,
        // so any per-event-id guards consult an accurate snapshot.
        databaseEventIdsRef.current = new Set(databaseEvents.map((evt) => evt.id));

        console.log(
          "[HYDRATE-DEBUG] DB hydration → events from server:",
          databaseEvents.map((evt) => ({
            id: evt.id,
            title: evt.title,
            teamMemberCount: evt.eventTeamMembers?.length ?? 0,
            teamMembers: evt.eventTeamMembers?.map((m) => ({
              id: m.id,
              name: m.name,
              role: m.role,
              order: m.order,
              isActive: m.isActive,
            })),
          })),
        );

        if (!databaseEvents.length) {
          return;
        }

        const hydratedEvents: EventRecord[] = databaseEvents.map((dbEvent) => {
          const seededEvent = buildEventFromTemplate(
            {
              couple: dbEvent.title,
              date: dbEvent.date
                ? new Date(dbEvent.date).toISOString().split("T")[0]
                : "",
              venue: dbEvent.venue || "",
            },
            undefined,
            {
              eventId: dbEvent.id,
              collaboratorId: `col-${dbEvent.id}`,
            },
          );

          seededEvent.settings = {
            ...seededEvent.settings,
            eventLayoutProfile: migrateLegacyLayoutProfile(
              dbEvent.type,
              dbEvent.type || "Wedding",
            ),
            eventName: dbEvent.title,
            coupleNames: dbEvent.title,
            eventType: dbEvent.type || "Wedding",
            venue: dbEvent.venue || "",
            assignedDj: dbEvent.assignedDj || "",
            packageName: dbEvent.packageName || "",
            plannerName: dbEvent.plannerName || "",
            plannerEmail: dbEvent.plannerEmail || "",
            ceremonyLocation: dbEvent.ceremonyLocation || "",
            receptionLocation: dbEvent.receptionLocation || "",
            internalNotes: dbEvent.internalNotes || "",
            weddingDate: dbEvent.date
              ? new Date(dbEvent.date).toISOString().split("T")[0]
              : "",
            eventStatus: normalizeEventStatus(dbEvent.eventStatus),
          };

          seededEvent.settings.planningQuestionAnswers =
            mergeGrandEntranceDbIntoPlanningAnswers(
              seededEvent.settings.planningQuestionAnswers ?? {},
              dbEvent,
            );

          seededEvent.meta = {
            couple: dbEvent.title,
            date: dbEvent.date
              ? new Date(dbEvent.date).toISOString().split("T")[0]
              : "",
            venue: dbEvent.venue || "",
          };

          seededEvent.mustPlaySongs = dedupeSongEntries(
            (dbEvent.songs || [])
              .filter((song) => song.listType === "mustPlay")
              .sort((a, b) => a.order - b.order)
              .map((song) => ({
                id: song.id,
                title: song.title,
                artist: song.artist || "",
                notes: song.notes || "",
                highPriority: song.highPriority,
              })),
          );

          seededEvent.doNotPlaySongs = dedupeSongEntries(
            (dbEvent.songs || [])
              .filter((song) => song.listType === "doNotPlay")
              .sort((a, b) => a.order - b.order)
              .map((song) => ({
                id: song.id,
                title: song.title,
                artist: song.artist || "",
                notes: song.notes || "",
                highPriority: song.highPriority,
              })),
          );

          seededEvent.playIfPossibleSongs = dedupeSongEntries(
            (dbEvent.songs || [])
              .filter((song) => song.listType === "playIfPossible")
              .sort((a, b) => a.order - b.order)
              .map((song) => ({
                id: song.id,
                title: song.title,
                artist: song.artist || "",
                notes: song.notes || "",
                highPriority: song.highPriority,
              })),
          );

          seededEvent.guestRequests = (dbEvent.guestRequests ?? [])
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((request) => ({
              id: request.id,
              guestName: request.guestName,
              songTitle: request.songTitle,
              artist: request.artist,
              dedication: request.dedication,
              status: request.status as GuestRequestStatus,
              addedToMustPlay: request.addedToMustPlay,
              addedToDoNotPlay: request.addedToDoNotPlay,
            }));

          (seededEvent as EventRecord & { eventTeamMembers: TeamMember[] }).eventTeamMembers =
            (dbEvent.eventTeamMembers ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((member) => ({
                id: member.id,
                name: member.name,
                role: (member.role as TeamMember["role"]) ?? "DJ",
                company: member.company ?? "",
                email: member.email ?? "",
                phone: member.phone ?? "",
                notes: member.notes ?? "",
                website: member.website ?? "",
                instagram: member.instagram ?? "",
                arrivalTime: member.arrivalTime ?? "",
                specialCoordinationNotes: member.specialCoordinationNotes ?? "",
                isActive: member.isActive,
              }));

          (seededEvent as EventRecord & { eventNotes: EventNote[] }).eventNotes =
            (dbEvent.eventNotes ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((note) => ({
                id: note.id,
                category: note.category || "General",
                title: note.title ?? "",
                body: note.body,
                isPinned: note.isPinned,
              }));

          const mainDbTimeline = dbEvent.timelines?.find((t) => t.title === "Main Timeline");
          const ceremonyDbTimeline = dbEvent.timelines?.find((t) => t.title === "Ceremony Timeline");
          seededEvent.timelineItems = mapDatabaseRowsToMainTimelineItems(
            mainDbTimeline?.items ?? [],
          );
          seededEvent.ceremonyTimelineItems = mapDatabaseRowsToCeremonyTimelineItems(
            ceremonyDbTimeline?.items ?? [],
          );

          return seededEvent;
        });

        setEvents((prev) => {
          const merged = mergeHydratedEventsPreservingGrandEntranceDetail(
            prev,
            mergeHydratedEventsPreservingPlaylists(prev, hydratedEvents),
          );
          lastMergedHydratedEventsRef.current = merged;
          return merged;
        });

        if (hydratedEvents.length > 0) {
          // Reconcile activeEventId to a real DB id and drive teamMembers from
          // that event's persisted team. This is what makes "Add team member ->
          // back to All Events -> refresh -> reopen event" round-trip cleanly,
          // because team membership is scoped to the active event.
          setActiveEventId((prev) => {
            const mergedEvents =
              lastMergedHydratedEventsRef.current ?? hydratedEvents;
            const resolvedId = databaseEventIdsRef.current.has(prev)
              ? prev
              : mergedEvents[0].id;
            const resolvedEvent =
              mergedEvents.find((evt) => evt.id === resolvedId) ??
              mergedEvents[0];
            const evtTeam = (resolvedEvent as EventRecord & {
              eventTeamMembers?: TeamMember[];
            }).eventTeamMembers;
            const nextTeam = Array.isArray(evtTeam) ? cloneJson(evtTeam) : [];
            console.log("[HYDRATE-DEBUG] DB hydration → setTeamMembers", {
              prevActiveEventId: prev,
              resolvedId,
              resolvedEventTitle: resolvedEvent.meta?.couple,
              hasShadow: Array.isArray(evtTeam),
              teamMemberCount: nextTeam.length,
              nextTeam,
            });
            setTeamMembers(nextTeam);
            const evtNotes = (resolvedEvent as EventRecord & {
              eventNotes?: EventNote[];
            }).eventNotes;
            setEventNotes(Array.isArray(evtNotes) ? cloneJson(evtNotes) : []);
            setMustPlaySongs(dedupeSongEntries(cloneJson(resolvedEvent.mustPlaySongs ?? [])));
            setDoNotPlaySongs(dedupeSongEntries(cloneJson(resolvedEvent.doNotPlaySongs ?? [])));
            setPlayIfPossibleSongs(
              dedupeSongEntries(cloneJson(resolvedEvent.playIfPossibleSongs ?? [])),
            );
            return resolvedId;
          });
        }
      } catch (error) {
        console.error("Failed to load database events:", error);
      } finally {
        databaseHydrationCompleteRef.current = true;
      }
    };

    loadDatabaseEvents();
  }, []);

  useEffect(() => {
    if (authStage !== "app" || appMode !== "event" || !isCoupleView) return;
    if (activeScreen === "Reception Hub") {
      setActiveScreen(sectionReceptionTimelineEnabled ? "Timeline" : "Dashboard");
      return;
    }
    if (activeScreen === "Notes") {
      setActiveScreen("Dashboard");
    }
  }, [authStage, appMode, isCoupleView, activeScreen, sectionReceptionTimelineEnabled, setActiveScreen]);

  const EVENTS_STORAGE_KEY = "cutmaster_planning_events_v1";
  const GLOBAL_SETTINGS_STORAGE_KEY = "cutmaster_planning_global_settings_v1";
  const RUN_OF_SHOW_SECTION_UI_STORAGE_KEY = "cutmaster_run_of_show_section_ui_v1";
  const RUN_OF_SHOW_CARD_NOTES_STORAGE_KEY = "cutmaster_run_of_show_card_notes_v1";
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
        mustPlaySongs: dedupeSongEntries(Array.isArray(evt.mustPlaySongs) ? evt.mustPlaySongs : []),
        doNotPlaySongs: dedupeSongEntries(Array.isArray(evt.doNotPlaySongs) ? evt.doNotPlaySongs : []),
        playIfPossibleSongs: dedupeSongEntries(
          Array.isArray(evt.playIfPossibleSongs) ? evt.playIfPossibleSongs : [],
        ),
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
          checklistDueDates: normalizeChecklistDueDatesRecord(
          evt.settings?.checklistDueDates,
          evt.settings?.checklistDueOffsets,
        ),
          checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
          coverPhotoDataUrl: evt.settings?.coverPhotoDataUrl,
          eventStatus: normalizeEventStatus(
          evt.settings?.eventStatus,
          (evt.settings as EventSettings & { eventLifecycleStatus?: string }).eventLifecycleStatus,
        ),
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

    const recvDraft = receptionTimelineInlineEditDraft;
    const timelineForStore =
      recvDraft === null
        ? timelineItems
        : timelineItems.map((t) =>
          t.id === recvDraft.itemId ? applyReceptionTimelineInlineDraftToRow(t, recvDraft.values) : t,
        );
    const cerDraft = ceremonyTimelineInlineEditDraft;
    const ceremonyForStore =
      cerDraft === null
        ? ceremonyTimelineItems
        : ceremonyTimelineItems.map((t) =>
          t.id === cerDraft.itemId ? applyCeremonyTimelineInlineDraftToRow(t, cerDraft.values) : t,
        );

    const stripCoverPhotoFromSettings = (settings: EventSettings): EventSettings => {
      const next = { ...settings };
      delete next.coverPhotoDataUrl;
      return next;
    };

    const payloadEvents = events.map((e) => {
      const merged =
        e.id === activeEventId
          ? {
            ...e,
            timelineItems: timelineForStore,
            ceremonyTimelineItems: ceremonyForStore,
            formalities: [],
            mustPlaySongs,
            doNotPlaySongs,
            playIfPossibleSongs,
            musicPlaylistLinks,
            musicGenreEraSelections,
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
            musicTasteProfile: cloneJson(musicTasteProfile),
            mcAnnouncements,
            settings: eventSettings,
          }
          : e;
      return merged.settings
        ? { ...merged, settings: stripCoverPhotoFromSettings(merged.settings) }
        : merged;
    });

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
        if (
          databaseEventIdsRef.current.has(activeEventId) &&
          databaseHydrationCompleteRef.current &&
          persistUiSuppressBootCountRef.current <= 0
        ) {
          void persistTimelinesToDatabase(activeEventId, timelineForStore, ceremonyForStore);
          void persistSongsToDatabase(
            activeEventId,
            mustPlaySongs,
            doNotPlaySongs,
            playIfPossibleSongs,
          );
        }
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
    receptionTimelineInlineEditDraft,
    ceremonyTimelineItems,
    ceremonyTimelineInlineEditDraft,
    persistTimelinesToDatabase,
    persistSongsToDatabase,
    mustPlaySongs,
    doNotPlaySongs,
    playIfPossibleSongs,
    musicPlaylistLinks,
    musicGenreEraSelections,
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
    musicTasteProfile,
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
            playIfPossibleSongs,
            musicPlaylistLinks,
            musicGenreEraSelections,
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
            musicTasteProfile: cloneJson(musicTasteProfile),
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
      playIfPossibleSongs,
      musicPlaylistLinks,
      musicGenreEraSelections,
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
      musicTasteProfile,
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
        checklistDueDates: normalizeChecklistDueDatesRecord(
          evt.settings?.checklistDueDates,
          evt.settings?.checklistDueOffsets,
        ),
        checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
        coverPhotoDataUrl: evt.settings?.coverPhotoDataUrl,
        eventStatus: normalizeEventStatus(
          evt.settings?.eventStatus,
          (evt.settings as EventSettings & { eventLifecycleStatus?: string }).eventLifecycleStatus,
        ),
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
    const restoredTeamMembers = Array.isArray(payload.teamMembers)
      ? payload.teamMembers
      : [];
    setTeamMembers(restoredTeamMembers);
    if (databaseEventIdsRef.current.has(nextActiveId)) {
      void replaceEventTeamMembers(
        nextActiveId,
        restoredTeamMembers.map((member, index) => ({
          name: member.name,
          role: member.role,
          email: member.email || null,
          phone: member.phone || null,
          notes: member.notes || null,
          isActive: member.isActive,
          order: index,
        })),
      ).catch((error) => {
        console.error("Failed to persist restored team members:", error);
      });
    } else {
      console.warn(
        `Skipping team-member persistence on backup restore: event "${nextActiveId}" is not a database event yet.`,
      );
    }
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
    } else if (newSongListType === "playIfPossible") {
      setPlayIfPossibleSongs((prev) => [newEntry, ...prev]);
    } else {
      setDoNotPlaySongs((prev) => [newEntry, ...prev]);
    }
    logActivity("song_added", `Added song: ${cleanedTitle}`);

    setNewSongTitle("");
    setNewSongArtist("");
    setNewSongNotes("");
    setNewSongHighPriority(false);
  };

  const addMusicPlaylistLink = () => {
    const url = musicNewPlaylistUrl.trim();
    if (!url) return;
    const entry: SharedPlaylistLink = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      label: musicNewPlaylistLabel.trim() || undefined,
      notes: musicNewPlaylistNotes.trim() || undefined,
    };
    setMusicPlaylistLinks((prev) => [...prev, entry]);
    setMusicNewPlaylistUrl("");
    setMusicNewPlaylistLabel("");
    setMusicNewPlaylistNotes("");
    logActivity("song_added", `Added playlist link${entry.label ? `: ${entry.label}` : ""}`);
  };

  const updateMusicPlaylistLink = (id: string, patch: Partial<SharedPlaylistLink>) => {
    setMusicPlaylistLinks((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeMusicPlaylistLink = (id: string) => {
    setMusicPlaylistLinks((prev) => prev.filter((row) => row.id !== id));
  };

  const toggleGenreEraChip = (label: string) => {
    setMusicGenreEraSelections((prev) => {
      if (prev.includes(label)) return prev.filter((x) => x !== label);
      const next = [...prev, label];
      next.sort(
        (a, b) => (MUSIC_GENRE_ERA_ORDER.get(a) ?? 0) - (MUSIC_GENRE_ERA_ORDER.get(b) ?? 0),
      );
      return next;
    });
  };

  const toggleMusicTasteChip = (
    field: "danceFloorStyles" | "crowdPreferences" | "musicBehavior",
    label: string,
  ) => {
    setMusicTasteProfile((prev) => {
      const arr = prev[field];
      if (arr.includes(label)) return { ...prev, [field]: arr.filter((x) => x !== label) };
      return { ...prev, [field]: [...arr, label] };
    });
  };

  const removeSong = (listType: SongListType, songId: string) => {
    if (listType === "mustPlay") {
      setMustPlaySongs((prev) => prev.filter((song) => song.id !== songId));
      return;
    }
    if (listType === "playIfPossible") {
      setPlayIfPossibleSongs((prev) => prev.filter((song) => song.id !== songId));
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
    if (listType === "playIfPossible") {
      setPlayIfPossibleSongs((prev) => updatePriority(prev));
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

  const roleBadgeClass = (role: UserRole | TeamMemberRole | string) => {
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

  const cancelReceptionTimelineInlineInsert = () => {
    resetTimelineForm();
    setTimelineInsertAfterId(null);
  };

  const openReceptionTimelineComposerAtTop = () => {
    resetTimelineForm();
    closeReceptionTimelineCardExpanded();
    setTimelineInsertAfterId(null);
    setTimelineComposerOpen(true);
    window.setTimeout(() => {
      timelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const prepareAddMomentAfterTimelineItem = (timelineItemId: string) => {
    const item = timelineItems.find((t) => t.id === timelineItemId);
    if (!item) return;
    closeReceptionTimelineCardExpanded();
    resetTimelineForm();
    setTimelineTime(item.time);
    setTimelineCategory(item.category);
    setTimelineComposerOpen(false);
    setTimelineInsertAfterId(timelineItemId);
  };

  useEffect(() => {
    if (!timelineInsertAfterId) return;
    const t = window.setTimeout(() => {
      timelineInlineInsertRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [timelineInsertAfterId]);

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

    const insertAfterId = timelineInsertAfterId;
    setTimelineItems((prev) =>
      insertAfterId
        ? insertTimelineItemAfterId(prev, insertAfterId, newItem)
        : insertReceptionTimelineItemChronologically(prev, newItem),
    );
    logActivity("timeline_item_added", `Added timeline moment: ${cleanTitle}`);
    pushNotification("Timeline moment added", "timeline_item_added");
    resetTimelineForm();
    setTimelineInsertAfterId(null);
    setTimelineComposerOpen(false);
  };

  const deleteTimelineItem = (itemId: string) => {
    setTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    if (editingTimelineId === itemId) {
      resetTimelineForm();
    }
    if (receptionTimelineExpandedId === itemId) {
      setReceptionTimelineExpandedId(null);
      setReceptionTimelineInlineEditDraft(null);
    }
  };

  const closeTimelineImport = useCallback(() => {
    setTimelineImportOpen(false);
    setTimelineImportRaw("");
    setTimelineImportDrafts([]);
    setTimelineImportStep("paste");
    setTimelineImportParseError(null);
    setTimelineImportReplaceDanger(false);
  }, []);

  const handleParseTimelineImport = useCallback(() => {
    setTimelineImportParseError(null);
    const drafts = parsePastedTimelineText(timelineImportRaw);
    if (drafts.length === 0) {
      setTimelineImportParseError(
        "No moments could be parsed. Try lines that start with a time, like 4:30 PM or 6pm.",
      );
      return;
    }
    setTimelineImportDrafts(drafts);
    setTimelineImportStep("review");
  }, [timelineImportRaw]);

  const applyTimelineImport = useCallback(
    (mode: "add" | "replace") => {
      if (timelineImportDrafts.length === 0) return;
      closeReceptionTimelineCardExpanded();
      const items = timelineItemsFromImportDrafts(timelineImportDrafts);
      if (mode === "replace") {
        setTimelineItems(sortTimelineItemsChronologically(items));
        logActivity("timeline_updated", `Replaced timeline with ${items.length} imported moments`);
        pushNotification("Timeline replaced", "timeline_updated");
      } else {
        setTimelineItems((prev) => {
          let next = [...prev];
          for (const it of items) {
            next = insertReceptionTimelineItemChronologically(next, it);
          }
          return next;
        });
        logActivity("timeline_item_added", `Imported ${items.length} paste timeline moments`);
        pushNotification("Timeline updated", "timeline_updated");
      }
      closeTimelineImport();
    },
    [closeReceptionTimelineCardExpanded, closeTimelineImport, logActivity, pushNotification, timelineImportDrafts],
  );

  const updateTimelineImportDraft = useCallback((key: string, patch: Partial<PastedTimelineImportDraft>) => {
    setTimelineImportDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }, []);

  const removeTimelineImportDraft = useCallback((key: string) => {
    setTimelineImportDrafts((prev) => prev.filter((d) => d.key !== key));
  }, []);

  const reorderTimelineItemToTarget = (itemId: string, targetId: string) => {
    if (!itemId || !targetId || itemId === targetId) return;
    flushReceptionTimelineInlineEditDraftIntoTimeline();
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
    setTimelineItems((prev) => {
      const draft = receptionTimelineInlineEditDraftRef.current;
      const base =
        draft === null
          ? prev
          : prev.map((t) => (t.id === draft.itemId ? applyReceptionTimelineInlineDraftToRow(t, draft.values) : t));
      return sortTimelineItemsChronologically(base);
    });
    setReceptionTimelineInlineEditDraft(null);
    setReceptionTimelineExpandedId(null);
    logActivity("timeline_updated", "Sorted reception timeline by entered time");
  };

  const duplicateTimelineItem = (item: TimelineItem) => {
    const draft = receptionTimelineInlineEditDraftRef.current;
    const base =
      draft && draft.itemId === item.id
        ? applyReceptionTimelineInlineDraftToRow(item, draft.values)
        : item;
    const duplicate: TimelineItem = {
      ...base,
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${base.title} (Copy)`,
      songTitle: base.songTitle,
      artist: base.artist,
      fadeOutEarly: base.fadeOutEarly,
      fadeOutTimestamp: base.fadeOutTimestamp,
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
    openCeremonyTimelineComposerAtTop();
  };

  const cancelCeremonyTimelineInlineInsert = () => {
    resetCeremonyTimelineDraft();
    setCeremonyTimelineInsertAfterId(null);
  };

  const openCeremonyTimelineComposerAtTop = () => {
    resetCeremonyTimelineDraft();
    closeCeremonyTimelineCardExpanded();
    setCeremonyTimelineInsertAfterId(null);
    setCeremonyTimelineComposerOpen(true);
    window.setTimeout(() => {
      ceremonyTimelineComposerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const prepareAddCeremonyMomentAfter = (afterItemId: string) => {
    const prior = ceremonyTimelineItems.find((t) => t.id === afterItemId);
    if (!prior) return;
    closeCeremonyTimelineCardExpanded();
    resetCeremonyTimelineDraft();
    setCeremonyTimelineDraftTimeOrOrder(prior.timeOrOrder);
    setCeremonyTimelineComposerOpen(false);
    setCeremonyTimelineInsertAfterId(afterItemId);
  };

  useEffect(() => {
    if (!ceremonyTimelineInsertAfterId) return;
    const t = window.setTimeout(() => {
      ceremonyTimelineInlineInsertRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [ceremonyTimelineInsertAfterId]);

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
    const insertAfterId = ceremonyTimelineInsertAfterId;
    setCeremonyTimelineItems((prev) =>
      insertAfterId
        ? insertTimelineItemAfterId(prev, insertAfterId, newCeremonyItem)
        : insertCeremonyTimelineItemChronologically(prev, newCeremonyItem),
    );
    logActivity("ceremony_updated", `Added ceremony moment: ${cleanMoment}`);
    pushNotification("Ceremony timeline updated", "ceremony_updated");
    resetCeremonyTimelineDraft();
    setCeremonyTimelineInsertAfterId(null);
    setCeremonyTimelineComposerOpen(false);
  };

  const deleteCeremonyTimelineItem = (itemId: string) => {
    setCeremonyTimelineItems((prev) => prev.filter((item) => item.id !== itemId));
    if (ceremonyTimelineExpandedId === itemId) {
      setCeremonyTimelineExpandedId(null);
      setCeremonyTimelineInlineEditDraft(null);
    }
    logActivity("ceremony_updated", "Removed ceremony moment");
    pushNotification("Ceremony timeline updated", "ceremony_updated");
  };

  const duplicateCeremonyTimelineItem = (item: CeremonyTimelineItem) => {
    const draft = ceremonyTimelineInlineEditDraftRef.current;
    const base =
      draft && draft.itemId === item.id
        ? applyCeremonyTimelineInlineDraftToRow(item, draft.values)
        : item;
    const duplicate: CeremonyTimelineItem = {
      ...base,
      id: `ceremony-timeline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      moment: `${base.moment} (Copy)`,
    };
    setCeremonyTimelineItems((prev) =>
      insertCeremonyTimelineItemChronologically(prev, duplicate),
    );
    logActivity("ceremony_updated", `Duplicated ceremony moment: ${item.moment}`);
    pushNotification("Ceremony timeline updated", "ceremony_updated");
  };

  const reorderCeremonyTimelineItemToTarget = (itemId: string, targetId: string) => {
    if (!itemId || !targetId || itemId === targetId) return;
    flushCeremonyTimelineInlineEditDraftIntoTimeline();
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
    document.body.classList.add("cm-ros-scroll-lock");
    return () => {
      document.body.classList.remove("cm-ros-scroll-lock");
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

  const planningProgressChecks = useMemo(
    () =>
      buildPlanningProgressChecks({
        eventStatus: activeEventStatus,
        layoutProfile: layoutProfileForActiveEvent,
        sectionCeremonyEnabled,
        sectionMustPlayEnabled,
        timelineItems,
        ceremonyTimelineItems,
        teamMemberCount: teamMembers.length,
        mustPlayCount: mustPlaySongs.length,
        eventNotesCount: eventNotes.length,
        hasKeyCeremonySongs,
        primaryTimelineScreen: primaryTimelineScreenForHome,
      }),
    [
      activeEventStatus,
      ceremonyTimelineItems,
      eventNotes.length,
      hasKeyCeremonySongs,
      layoutProfileForActiveEvent,
      mustPlaySongs.length,
      primaryTimelineScreenForHome,
      sectionCeremonyEnabled,
      sectionMustPlayEnabled,
      teamMembers.length,
      timelineItems,
    ],
  );

  const planningProgressDashboardCard = useMemo(() => {
    const attentionCount = planningProgressChecks.filter((c) => c.state === "attention").length;
    return (
      <PremiumCard className="border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <SectionTitle className="text-stone-950">Planning progress</SectionTitle>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${
              attentionCount === 0
                ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                : "bg-amber-50 text-amber-950 ring-amber-200/90"
            }`}
          >
            {attentionCount === 0 ? "On track" : `${attentionCount} to revisit`}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-stone-600">
          A quick read on what&apos;s in place—pulled from your timeline, team, music, and notes.
        </p>
        <ul className="mt-4 space-y-2">
          {planningProgressChecks.map((check) => {
            const rowBody = (
              <>
                <span className="shrink-0 text-base leading-none" aria-hidden>
                  {check.state === "complete" ? "✅" : "⚠️"}
                </span>
                <span className="min-w-0 flex-1 text-left text-sm leading-snug text-stone-900">
                  {check.label}
                </span>
              </>
            );
            return (
              <li key={check.id}>
                {check.targetScreen ? (
                  <button
                    type="button"
                    onClick={() => setActiveScreen(check.targetScreen!)}
                    className="flex w-full min-h-11 items-start gap-3 rounded-xl border border-stone-200/90 bg-stone-50/40 px-3 py-3 text-left transition-colors hover:border-stone-300 hover:bg-stone-50 sm:min-h-10"
                  >
                    {rowBody}
                  </button>
                ) : (
                  <div className="flex min-h-11 items-start gap-3 rounded-xl border border-stone-200/90 bg-stone-50/40 px-3 py-3 sm:min-h-10">
                    {rowBody}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </PremiumCard>
    );
  }, [planningProgressChecks, setActiveScreen]);

  const couplePlanningGapsForDashboard = useMemo(
    () =>
      buildCouplePlanningGaps({
        timelineScreen: primaryTimelineScreenForHome,
        sectionCeremonyEnabled,
        sectionReceptionTimelineEnabled,
        sectionMustPlayEnabled,
        sectionPlaylistsEnabled,
        sectionVendorContactsEnabled,
        sectionPlanningQuestionsEnabled,
        ceremonyStartTime,
        hasKeyCeremonySongs,
        ceremonyTimelineItemCount: ceremonyTimelineItems.length,
        timelineRows: mergedTimelineItems,
        musicPlaylistLinksCount: musicPlaylistLinks.length,
        musicGenreEraSelectionsCount: musicGenreEraSelections.length,
        mustPlaySongsCount: mustPlaySongs.length,
        playIfPossibleSongsCount: playIfPossibleSongs.length,
        playlistVibeOverrides,
        musicTasteProfileRaw: musicTasteProfile,
        vendors,
        planningQuestions: planningQuestionsForEvent,
        planningQuestionAnswers: eventSettings.planningQuestionAnswers ?? {},
      }),
    [
      ceremonyStartTime,
      ceremonyTimelineItems.length,
      eventSettings.planningQuestionAnswers,
      hasKeyCeremonySongs,
      mergedTimelineItems,
      musicGenreEraSelections.length,
      musicPlaylistLinks.length,
      musicTasteProfile,
      mustPlaySongs.length,
      playIfPossibleSongs.length,
      planningQuestionsForEvent,
      playlistVibeOverrides,
      primaryTimelineScreenForHome,
      sectionCeremonyEnabled,
      sectionMustPlayEnabled,
      sectionPlanningQuestionsEnabled,
      sectionPlaylistsEnabled,
      sectionReceptionTimelineEnabled,
      sectionVendorContactsEnabled,
      vendors,
    ],
  );

  const coupleNextStep = useMemo(() => {
    const attentionBodies: Partial<Record<string, string>> = {
      "timeline-started":
        "Review your timeline and add the moments you already know—cocktail, dinner, and dancing are a great start.",
      "event-team":
        "Add your vendor team so we can coordinate with your planner, photographer, and venue.",
      "ceremony-music":
        "Add ceremony music cues when timing firms up—processional and recessional are enough to start.",
      "must-play": "Share a few must-play songs or a playlist link so your DJ can read your vibe early.",
      "parent-dances":
        "Add songs for your formal dances on the timeline when you're ready—first dance and parent dances matter most.",
      "event-notes": "Drop a short note for your DJ or planner when something important comes to mind.",
      "final-review": "When you're ready, mark planning as final review so your team knows you're steady.",
    };

    const firstAttention = planningProgressChecks.find((c) => c.state === "attention");
    if (firstAttention?.targetScreen) {
      const screenCtas: Partial<Record<Screen, string>> = {
        "Event Settings": "Event details",
        Ceremony: "Ceremony",
        Timeline: "Timeline",
        "Reception Timeline": "Timeline",
        "Music Hub": "Music",
        "Event Team": "Event team",
        Notes: "Notes",
      };
      return {
        body:
          attentionBodies[firstAttention.id] ??
          firstAttention.label.replace(/ missing$/i, " when you're ready."),
        ctaLabel: screenCtas[firstAttention.targetScreen] ?? "Continue",
        targetScreen: firstAttention.targetScreen,
      };
    }

    if (sectionVendorContactsEnabled && teamMembers.length === 0) {
      return {
        body: "Add your vendor team so we can coordinate with your planner, photographer, and venue.",
        ctaLabel: "Event team",
        targetScreen: "Event Team" as Screen,
      };
    }

    const firstGap = couplePlanningGapsForDashboard[0];
    if (firstGap) {
      const gapCtas: Partial<Record<Screen, string>> = {
        Ceremony: "Ceremony",
        Timeline: "Timeline",
        "Reception Timeline": "Timeline",
        "Music Hub": "Music",
        "Event Team": "Event team",
        "Planning Questions": "Questions",
      };
      return {
        body: firstGap.message,
        ctaLabel: gapCtas[firstGap.targetScreen] ?? "Continue",
        targetScreen: firstGap.targetScreen,
      };
    }

    const guidedBodies: Partial<Record<Screen, string>> = {
      "Event Settings": "Confirm your names, date, and venue so everything else stays aligned.",
      Ceremony: "Add ceremony music when your venue confirms timing—small steps still help day-of.",
      Timeline: "Review your timeline and add the moments you already know.",
      "Reception Timeline": "Review your timeline and add the moments you already know.",
      "Music Hub": "Share taste, playlists, or a few must-plays so your DJ can prep calmly.",
      "Planning Questions": "Answer a few planning prompts when you have a quiet moment—they feed your event document.",
      "Guest Requests": "Review guest song ideas when you're ready—approve or decline at your pace.",
      "Planning Checklist": "Glance at your checklist when you want a structured pass.",
      "Event Prep": "Open your event document when you want a single shareable packet.",
      "Event Team": "Add your vendor team so we can coordinate with your planner, photographer, and venue.",
      Notes: "Add a note for your DJ or planner when something important comes to mind.",
    };

    const guidedCtas: Partial<Record<Screen, string>> = {
      "Event Settings": "Event details",
      Ceremony: "Ceremony",
      Timeline: "Timeline",
      "Reception Timeline": "Timeline",
      "Music Hub": "Music",
      "Planning Questions": "Questions",
      "Guest Requests": "Guest requests",
      "Planning Checklist": "Checklist",
      "Event Prep": "Event document",
      "Event Team": "Event team",
      Notes: "Notes",
    };

    return {
      body:
        guidedBodies[coupleGuidedNextScreen] ??
        "You're in a steady place—open any section below when you want to refine details.",
      ctaLabel: guidedCtas[coupleGuidedNextScreen] ?? "Continue planning",
      targetScreen: coupleGuidedNextScreen,
    };
  }, [
    coupleGuidedNextScreen,
    couplePlanningGapsForDashboard,
    planningProgressChecks,
    sectionVendorContactsEnabled,
    teamMembers.length,
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
      if (musicGenreEraSelections.length > 0) {
        lines.push(`Genre / era picks: ${musicGenreEraSelections.join(", ")}`);
      }
      if (musicTasteProfileHasSelections(musicTasteProfile)) {
        lines.push("Music taste profile (structured)");
        if (musicTasteProfile.danceFloorStyles.length > 0) {
          lines.push(`Dance floor style: ${musicTasteProfile.danceFloorStyles.join(", ")}`);
        }
        if (musicTasteProfile.crowdPreferences.length > 0) {
          lines.push(`Crowd preferences: ${musicTasteProfile.crowdPreferences.join(", ")}`);
        }
        if (musicTasteProfile.musicBehavior.length > 0) {
          lines.push(`Music behavior: ${musicTasteProfile.musicBehavior.join(", ")}`);
        }
        if (musicTasteProfile.danceFloorVibeNotes?.trim()) {
          lines.push(`Ideal dance floor vibe: ${musicTasteProfile.danceFloorVibeNotes.trim()}`);
        }
      }
      if (musicVibeDetail.genres?.trim()) lines.push(`Extra genre notes: ${musicVibeDetail.genres.trim()}`);
      if (musicVibeDetail.energy?.trim()) lines.push(`Energy: ${musicVibeDetail.energy.trim()}`);
      if (musicVibeDetail.crowdNotes?.trim()) lines.push(`Crowd: ${musicVibeDetail.crowdNotes.trim()}`);
      if (musicVibeDetail.cleanMusicPrefs?.trim())
        lines.push(`Clean / content prefs: ${musicVibeDetail.cleanMusicPrefs.trim()}`);
      lines.push("");
    }

    if (musicPlaylistLinks.length > 0) {
      lines.push(
        "PLAYLIST LINKS (CLIENT)",
        ...musicPlaylistLinks.map((link, i) => {
          const bits = [
            `${i + 1}. ${link.url.trim()}`,
            link.label?.trim() ? `Label: ${link.label.trim()}` : null,
            link.notes?.trim() ? `Notes: ${link.notes.trim()}` : null,
          ].filter(Boolean);
          return bits.join(" | ");
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

    if (showPlaylists && sectionMustPlayEnabled && playIfPossibleSongs.length > 0) {
      lines.push(
        "PLAY IF POSSIBLE",
        ...playIfPossibleSongs.map(
          (song) =>
            `- ${song.title}${song.artist ? ` - ${song.artist}` : ""}${song.highPriority ? " (PRIORITY)" : ""}${song.notes ? ` | ${song.notes}` : ""}`,
        ),
        "",
      );
    }

    if (showVendors) {
      const sorted = sortVendorsForEventDocument(vendors);
      lines.push(
        "EVENT TEAM",
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
    musicTasteProfile,
    mergedTimelineItems,
    microphoneNeeds,
    mustPlaySongs,
    playIfPossibleSongs,
    musicPlaylistLinks,
    musicGenreEraSelections,
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

  const closeGrandEntranceDetailEditor = useCallback(() => {
    setGrandEntranceDetailEditor(null);
    setGrandEntranceDetailDraft({
      script: "",
      lineup: "",
      coupleEntrance: "",
      sideNote: "",
    });
    setGrandEntranceDetailSavedDraft({
      script: "",
      lineup: "",
      coupleEntrance: "",
      sideNote: "",
    });
  }, []);

  const closeRunOfShow = useCallback(() => {
    setRunOfShowOpen(false);
    setRunOfShowAnnotateMode(false);
    setRunOfShowCardNoteEditor(null);
    setRunOfShowCardNoteEditorDraft("");
    setRunOfShowCardNoteEditorSavedValue("");
    closeGrandEntranceDetailEditor();
    runOfShowAnnotationInProgressRef.current = null;
    if (typeof document !== "undefined" && document.fullscreenElement) {
      void document.exitFullscreen();
    }
  }, [closeGrandEntranceDetailEditor]);

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

  const persistRunOfShowCardNotes = useCallback(
    (notes: Record<string, string>) => {
      if (typeof window === "undefined" || !activeEventId || !hasHydrated) return;
      try {
        const raw = window.localStorage.getItem(RUN_OF_SHOW_CARD_NOTES_STORAGE_KEY);
        const map = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
        const cleaned: Record<string, string> = {};
        for (const [key, value] of Object.entries(notes)) {
          if (value.trim()) cleaned[key] = value;
        }
        map[activeEventId] = cleaned;
        window.localStorage.setItem(RUN_OF_SHOW_CARD_NOTES_STORAGE_KEY, JSON.stringify(map));
      } catch {
        /* ignore quota / corrupt storage */
      }
    },
    [activeEventId, hasHydrated],
  );

  const setRunOfShowCardNote = useCallback(
    (cardKey: string, value: string) => {
      setRunOfShowCardNotes((prev) => {
        const next = { ...prev, [cardKey]: value };
        if (!value.trim()) delete next[cardKey];
        if (runOfShowCardNotesPersistTimerRef.current != null) {
          window.clearTimeout(runOfShowCardNotesPersistTimerRef.current);
          runOfShowCardNotesPersistTimerRef.current = null;
        }
        if (!value.trim()) {
          persistRunOfShowCardNotes(next);
        } else {
          runOfShowCardNotesPersistTimerRef.current = window.setTimeout(() => {
            persistRunOfShowCardNotes(next);
            runOfShowCardNotesPersistTimerRef.current = null;
          }, 400);
        }
        return next;
      });
    },
    [persistRunOfShowCardNotes],
  );

  const openGrandEntranceDetail = useCallback(
    (item: {
      id: string;
      title: string;
      time?: string;
      category?: string;
      songTitle?: string;
      artist?: string;
    }) => {
      const coupleDefault =
        eventSettings.coupleNames?.trim() || weddingDetails.couple?.trim() || "";
      const detail = readGrandEntranceDetail(
        eventSettings.planningQuestionAnswers ?? {},
        coupleDefault,
      );
      const doneKey = `r:${item.id}`;
      const draft: GrandEntranceDetailDraft = {
        ...detail,
        sideNote: runOfShowCardNotes[doneKey] ?? "",
      };
      const songLabel = [item.songTitle?.trim(), item.artist?.trim()]
        .filter(Boolean)
        .join(" - ");
      const subline = [item.time?.trim(), item.category].filter(Boolean).join(" · ");
      setGrandEntranceDetailEditor({
        itemId: item.id,
        title: item.title,
        subline: subline || undefined,
        songLabel: songLabel || undefined,
      });
      setGrandEntranceDetailDraft(draft);
      setGrandEntranceDetailSavedDraft(draft);
    },
    [
      eventSettings.planningQuestionAnswers,
      eventSettings.coupleNames,
      weddingDetails.couple,
      runOfShowCardNotes,
    ],
  );

  const doneGrandEntranceDetail = useCallback(async () => {
    if (!grandEntranceDetailEditor) return;
    const { script, lineup, coupleEntrance, sideNote } = grandEntranceDetailDraft;
    const mergedAnswers = mergeGrandEntranceDetailIntoAnswers(
      eventSettings.planningQuestionAnswers ?? {},
      { script, lineup, coupleEntrance },
    );
    setEventSettings((prev) => ({
      ...prev,
      planningQuestionAnswers: mergedAnswers,
    }));
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === activeEventId
          ? {
              ...evt,
              settings: {
                ...evt.settings,
                planningQuestionAnswers: mergedAnswers,
              },
            }
          : evt,
      ),
    );
    setRunOfShowCardNote(`r:${grandEntranceDetailEditor.itemId}`, sideNote);
    closeGrandEntranceDetailEditor();
    if (databaseEventIdsRef.current.has(activeEventId)) {
      try {
        await updateGrandEntranceDetail(activeEventId, {
          script,
          lineup,
          coupleEntrance,
        });
      } catch (error) {
        console.error("Failed to persist Grand Entrance detail to database:", error);
      }
    }
  }, [
    grandEntranceDetailEditor,
    grandEntranceDetailDraft,
    eventSettings.planningQuestionAnswers,
    activeEventId,
    setRunOfShowCardNote,
    closeGrandEntranceDetailEditor,
  ]);

  const openRunOfShowCardNoteEditor = useCallback(
    (cardKey: string, cardLabel: string, cardSubline?: string) => {
      const saved = runOfShowCardNotes[cardKey] ?? "";
      setRunOfShowCardNoteEditor({ cardKey, cardLabel, cardSubline });
      setRunOfShowCardNoteEditorSavedValue(saved);
      setRunOfShowCardNoteEditorDraft(saved);
    },
    [runOfShowCardNotes],
  );

  const cancelRunOfShowCardNoteEditor = useCallback(() => {
    setRunOfShowCardNoteEditor(null);
    setRunOfShowCardNoteEditorDraft("");
    setRunOfShowCardNoteEditorSavedValue("");
  }, []);

  const doneRunOfShowCardNoteEditor = useCallback(() => {
    if (runOfShowCardNoteEditor) {
      setRunOfShowCardNote(runOfShowCardNoteEditor.cardKey, runOfShowCardNoteEditorDraft);
    }
    setRunOfShowCardNoteEditor(null);
    setRunOfShowCardNoteEditorDraft("");
    setRunOfShowCardNoteEditorSavedValue("");
  }, [runOfShowCardNoteEditor, runOfShowCardNoteEditorDraft, setRunOfShowCardNote]);

  const clearRunOfShowCardNoteEditorDraft = useCallback(() => {
    setRunOfShowCardNoteEditorDraft("");
  }, []);

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
      if (key.startsWith("c:")) {
        const itemId = key.slice(2);
        const nextCeremony = ceremonyTimelineItems.map((item) =>
          item.id === itemId ? { ...item, runOfShowDone: !item.runOfShowDone } : item,
        );
        setCeremonyTimelineItems(nextCeremony);
        void persistRunOfShowTimelineFlags(timelineItems, nextCeremony);
        return;
      }
      if (key.startsWith("r:")) {
        const itemId = key.slice(2);
        const nextMain = timelineItems.map((item) =>
          item.id === itemId ? { ...item, runOfShowDone: !item.runOfShowDone } : item,
        );
        setTimelineItems(nextMain);
        void persistRunOfShowTimelineFlags(nextMain, ceremonyTimelineItems);
      }
    },
    [timelineItems, ceremonyTimelineItems, persistRunOfShowTimelineFlags],
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
    const nextMain = timelineItems.map((item) =>
      item.runOfShowDone ? { ...item, runOfShowDone: false } : item,
    );
    const nextCeremony = ceremonyTimelineItems.map((item) =>
      item.runOfShowDone ? { ...item, runOfShowDone: false } : item,
    );
    setTimelineItems(nextMain);
    setCeremonyTimelineItems(nextCeremony);
    void persistRunOfShowTimelineFlags(nextMain, nextCeremony);
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
  }, [activeEventId, ceremonyTimelineItems, persistRunOfShowTimelineFlags, timelineItems]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydrated || !activeEventId) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const rawSec = window.localStorage.getItem(RUN_OF_SHOW_SECTION_UI_STORAGE_KEY);
        if (!rawSec) {
          setRunOfShowUserExpandedWhileCompleteIds(new Set());
        } else {
          const mapSec = JSON.parse(rawSec) as Record<string, { expandedWhileComplete?: string[] }>;
          const row = mapSec[activeEventId];
          const expanded = row?.expandedWhileComplete;
          setRunOfShowUserExpandedWhileCompleteIds(new Set(Array.isArray(expanded) ? expanded : []));
        }
        const rawNotes = window.localStorage.getItem(RUN_OF_SHOW_CARD_NOTES_STORAGE_KEY);
        if (!rawNotes) {
          setRunOfShowCardNotes({});
        } else {
          const mapNotes = JSON.parse(rawNotes) as Record<string, Record<string, string>>;
          const notes = mapNotes[activeEventId];
          if (notes && typeof notes === "object" && !Array.isArray(notes)) {
            const cleaned: Record<string, string> = {};
            for (const [key, value] of Object.entries(notes)) {
              if (typeof value === "string" && value.trim()) cleaned[key] = value;
            }
            setRunOfShowCardNotes(cleaned);
          } else {
            setRunOfShowCardNotes({});
          }
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
        setRunOfShowUserExpandedWhileCompleteIds(new Set());
        setRunOfShowCardNotes({});
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
      runOfShowAnnotationPaintedPointCountRef.current = 0;
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
    if (!RUN_OF_SHOW_ANNOTATION_ENABLED || !runOfShowOverlayActive) return;
    const main = runOfShowScrollRef.current;
    if (!main) return;
    const inner = main.querySelector<HTMLElement>("[data-run-of-show-inner]");
    const measure = () => {
      const w = main.clientWidth;
      const h = Math.max(main.scrollHeight, main.clientHeight);
      const prev = runOfShowAnnotationCanvasSizeRef.current;
      if (prev.w === w && prev.h === h) return;
      runOfShowAnnotationCanvasSizeRef.current = { w, h };
      setRunOfShowAnnotationCanvasSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(main);
    if (inner) ro.observe(inner);
    return () => {
      ro.disconnect();
    };
  }, [runOfShowOverlayActive]);

  useEffect(() => {
    if (!RUN_OF_SHOW_ANNOTATION_ENABLED || !runOfShowOverlayActive) return;
    const canvas = runOfShowAnnotationCanvasRef.current;
    if (!canvas || runOfShowAnnotationCanvasSize.w <= 0 || runOfShowAnnotationCanvasSize.h <= 0) return;
    redrawRunOfShowCommittedStrokes(
      canvas,
      runOfShowAnnotationStrokes,
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
    if (!RUN_OF_SHOW_ANNOTATION_ENABLED || !runOfShowOverlayActive || !runOfShowAnnotateMode) return;
    const canvas = runOfShowAnnotationCanvasRef.current;
    const main = runOfShowScrollRef.current;
    if (!canvas || !main) return;

    const scheduleInkFlush = () => {
      if (runOfShowAnnotationPointerRafRef.current != null) return;
      runOfShowAnnotationPointerRafRef.current = window.requestAnimationFrame(() => {
        runOfShowAnnotationPointerRafRef.current = null;
        const c = runOfShowAnnotationCanvasRef.current;
        const inProgress = runOfShowAnnotationInProgressRef.current;
        if (!c || !inProgress) return;
        const { w, h } = runOfShowAnnotationCanvasSizeRef.current;
        const ctx = ensureRunOfShowAnnotationCanvas(c, w, h);
        if (!ctx) return;
        runOfShowAnnotationPaintedPointCountRef.current = paintRunOfShowInkIncrement(
          ctx,
          inProgress.points,
          runOfShowAnnotationPaintedPointCountRef.current,
          inProgress.width,
        );
      });
    };

    const appendCoalescedPoints = (e: PointerEvent) => {
      const stroke = runOfShowAnnotationInProgressRef.current;
      if (!stroke) return;
      const events =
        typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
      for (const ev of events) {
        appendRunOfShowStrokePoint(
          stroke.points,
          runOfShowClientToContentCoords(ev.clientX, ev.clientY, main),
        );
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!runOfShowAnnotationAcceptsPointer(e.pointerType, e.button)) return;
      e.preventDefault();
      const { w, h } = runOfShowAnnotationCanvasSizeRef.current;
      redrawRunOfShowCommittedStrokes(canvas, runOfShowAnnotationStrokesRef.current, w, h);
      runOfShowAnnotationPaintedPointCountRef.current = 0;
      runOfShowAnnotationInProgressRef.current = {
        points: [],
        width: runOfShowAnnotationStrokeWidth(e.pointerType, e.pressure),
      };
      appendCoalescedPoints(e);
      main.style.overflow = "hidden";
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      scheduleInkFlush();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!runOfShowAnnotationInProgressRef.current) return;
      if (e.pointerType === "touch") return;
      if (e.cancelable) e.preventDefault();
      appendCoalescedPoints(e);
      scheduleInkFlush();
    };

    const finishStroke = (e: PointerEvent) => {
      const stroke = runOfShowAnnotationInProgressRef.current;
      runOfShowAnnotationInProgressRef.current = null;
      runOfShowAnnotationPaintedPointCountRef.current = 0;
      main.style.overflow = "";
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (stroke && stroke.points.length > 0) {
        const next: RunOfShowAnnotationStroke[] = [
          ...runOfShowAnnotationStrokesRef.current,
          { points: stroke.points, width: stroke.width },
        ];
        runOfShowAnnotationStrokesRef.current = next;
        setRunOfShowAnnotationStrokes(next);
        const { w, h } = runOfShowAnnotationCanvasSizeRef.current;
        redrawRunOfShowCommittedStrokes(canvas, next, w, h);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", finishStroke);
    canvas.addEventListener("pointercancel", finishStroke);

    return () => {
      main.style.overflow = "";
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
        <main className="mx-auto w-full max-w-md overflow-x-hidden px-5 pb-32 pt-6 sm:px-6">
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
          <section className={workspaceSectionClass}>
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
    <div className={cmAppShellClass}>
      <div className="mx-auto w-full min-w-0 max-w-[1400px] overflow-visible px-5 pt-6 sm:px-6">
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
                    className={`rounded-lg px-2.5 py-1 text-[11px] ${(currentRole ?? rolePreview) === role
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
              <PersistEcho
                persistFeedback={persistFeedback}
                showWhenIdle
                labelStyle="full"
                className="text-right sm:max-w-[10rem]"
              />
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
      </div>

      <main className="mx-auto w-full min-w-0 max-w-[1400px] overflow-visible px-5 pb-28 sm:px-6 md:pb-10">
        {authStage === "app" && (
          <EventNavSegmented
            items={currentNavItems.map((screen) => ({ screen, label: navLabel(screen) }))}
            activeScreen={shellNavActiveScreen}
            onSelect={setActiveScreen}
          />
        )}

        {authStage === "login" && (
          <section className={workspaceSectionClass}>
            <PremiumCard variant="accent">
              <SectionTitle>Welcome to {appSettings.appName}</SectionTitle>
              <p className="mt-2 text-xs text-stone-600">
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

                        if (m === "Reception Hub") {
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
          <section className={workspaceSectionClass}>
            <PremiumCard className="border-stone-300 bg-white shadow-none">
              <SectionTitle className="text-stone-950">
                {INVITE_PREVIEW_TITLE[inviteLayoutProfile]}
              </SectionTitle>
              <div className="mt-3 space-y-1 text-xs text-stone-600">
                <p>
                  Event: {invitePreviewEvent?.settings?.eventName || invitePreviewEvent?.meta.couple || "Event"}
                </p>
                <p>
                  Date: {invitePreviewEvent?.settings?.weddingDate || invitePreviewEvent?.meta.date || "TBD"}
                </p>
                <p>Venue: {invitePreviewEvent?.settings?.venue || invitePreviewEvent?.meta.venue || "TBD"}</p>
                <p>Role: {inviteAccessPreview.role}</p>
                <p className="break-all text-stone-500">{inviteAccessPreview.link}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={() => setAuthStage("login")}
                  className={`w-full ${lightUiSecondaryButtonClass}`}
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
          <section className={workspaceSectionClass}>
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
                          className={`w-full justify-start rounded-lg px-2.5 py-2 text-left text-[11px] font-medium ${activeGlobalSettingsSection === section
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
                          className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${activeGlobalSettingsSection === section
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

                  {activeGlobalSettingsSection === "Planning Checklist" && (
                    <div className="mt-4 space-y-3">
                      <SectionTitle className="text-stone-950">Planning Checklist Defaults</SectionTitle>
                      <p className="max-w-xl text-xs leading-relaxed text-stone-600">
                        Set default due-date timing for checklist items by Event Type. New events inherit these
                        defaults automatically; DJs can override timing per event.
                      </p>
                      {EVENT_TYPES.map((profile) => {
                        const dueDates = checklistDueDateSetsForSettings[profile] ?? {};
                        return (
                          <div
                            key={`checklist-due-set-${profile}`}
                            className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-semibold text-stone-950">{profile}</p>
                              <PrimaryButton
                                onClick={() => resetChecklistGlobalDueDateSet(profile)}
                                disabled={!canManageEvents}
                                className="rounded-lg border border-stone-300 bg-stone-50 px-2 py-1.5 text-[11px] font-semibold text-stone-800 shadow-sm hover:bg-stone-100 disabled:opacity-50"
                              >
                                Reset Defaults
                              </PrimaryButton>
                            </div>
                            <div className="mt-3 space-y-2">
                              {DEFAULT_PLANNING_CHECKLIST_TEMPLATE.map((item) => {
                                const due =
                                  dueDates[item.id] ?? templateDefaultDueDate(item);
                                const offsetDays =
                                  due?.type === "relative"
                                    ? due.offsetDays
                                    : (item.dueOffsetDays ?? -14);
                                return (
                                  <div
                                    key={`checklist-global-${profile}-${item.id}`}
                                    className="rounded-lg border border-stone-200 bg-white p-2.5"
                                  >
                                    <p className="text-sm font-semibold text-stone-950">{item.label}</p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600">
                                      {item.description}
                                    </p>
                                    <div className="mt-2">
                                      <ChecklistGlobalRelativeDueSelect
                                        idPrefix={`checklist-global-${profile}-${item.id}`}
                                        offsetDays={offsetDays}
                                        onChange={(nextOffset) =>
                                          updateChecklistGlobalDueDate(profile, item.id, nextOffset)
                                        }
                                        disabled={!canManageEvents}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
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
                              className="overflow-hidden rounded-2xl border border-[var(--cm-border)] bg-[var(--cm-surface)] shadow-[var(--cm-shadow-card)]"
                            >
                              <button
                                type="button"
                                className="flex min-h-[3.25rem] w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-[var(--cm-surface-muted)] sm:min-h-0 sm:gap-4 sm:px-5 sm:py-3.5"
                                onClick={() =>
                                  setTimelinePresetExpandedByProfile((prev) => ({
                                    ...prev,
                                    [profile]: !expanded,
                                  }))
                                }
                                aria-expanded={expanded}
                              >
                                <span className="mt-0.5 shrink-0 font-mono text-stone-500" aria-hidden>
                                  {expanded ? "▼" : "▶"}
                                </span>
                                <div className="min-w-0 flex-1 space-y-2">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="text-sm font-semibold tracking-tight text-stone-950">{profile}</span>
                                    <span className="rounded-full border border-cyan-500/35 bg-[#00D4FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-950">
                                      {presets.length} moment{presets.length === 1 ? "" : "s"}
                                    </span>
                                    <span className="text-[11px] text-stone-500">
                                      {ceremonyCount} ceremony · {mainCount} main · defaults {defaultCount}
                                    </span>
                                  </div>
                                  {!expanded && (
                                    <p className="line-clamp-2 text-[13px] leading-snug text-stone-600">{previewLine}</p>
                                  )}
                                </div>
                              </button>

                              {expanded && (
                                <div className="border-t border-[var(--cm-border)] px-4 pb-4 pt-1 sm:px-5">
                                  <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-stone-200/90 pb-3">
                                    <PrimaryButton
                                      type="button"
                                      onClick={() => addTimelinePresetToSet(profile)}
                                      disabled={!canManageEvents}
                                      className={lightUiCyanPrimaryButtonClass}
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
                                      className={lightUiSecondaryButtonClass}
                                    >
                                      Reset to default
                                    </PrimaryButton>
                                    <span className="ml-auto text-[10px] text-stone-500">
                                      Drag ⋮⋮ to reorder · duplicate creates a copy below
                                    </span>
                                  </div>

                                  <div className="space-y-2.5">
                                    {presets.map((preset, index) => (
                                      <div
                                        key={`tp-row-${profile}-${preset.id}`}
                                        className="rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-3.5"
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
                                            className={`flex shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white px-2 py-3 text-stone-500 sm:py-6 ${canManageEvents ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50"
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
                                            <span className="select-none text-sm leading-none tracking-tighter text-stone-500">
                                              ⋮⋮
                                            </span>
                                          </div>
                                          <div className="min-w-0 flex-1 space-y-2.5">
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-3 lg:gap-y-2">
                                              <div className="lg:col-span-2">
                                                <label className={lightUiFormLabelClass}>Type</label>
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
                                                  className={lightUiSelectClass}
                                                >
                                                  <option value="ceremony" className="bg-white text-stone-900">
                                                    Ceremony
                                                  </option>
                                                  <option value="main" className="bg-white text-stone-900">
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
                                                  inputClassName={lightUiInputClass}
                                                  labelClassName={lightUiFormLabelClass}
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
                                                  inputClassName={lightUiInputClass}
                                                  labelClassName={lightUiFormLabelClass}
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
                                                  inputClassName={lightUiInputClass}
                                                  labelClassName={lightUiFormLabelClass}
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
                                                  inputClassName={lightUiInputClass}
                                                  labelClassName={lightUiFormLabelClass}
                                                />
                                              </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 border-t border-stone-200/90 pt-2.5">
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
                                                    : lightUiGhostButtonClass
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
                                                className={`${lightUiGhostButtonClass} disabled:opacity-40`}
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
                                                className={`${lightUiGhostButtonClass} disabled:opacity-40`}
                                              >
                                                Down
                                              </PrimaryButton>
                                              <PrimaryButton
                                                type="button"
                                                onClick={() => duplicateTimelinePresetMoment(profile, index)}
                                                disabled={!canManageEvents}
                                                className={lightUiGhostButtonClass}
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
                                                className={lightUiDestructiveButtonClass}
                                              >
                                                Delete
                                              </PrimaryButton>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {presets.length === 0 && (
                                      <p className={lightUiEmptyHintInCardClass}>
                                        No moments yet. Use{" "}
                                        <span className="font-semibold text-stone-800">Add moment</span> to create your first preset row.
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
                                Event team: {liveDefaults.liveEventShowVendorContacts ? "On" : "Off"} ·
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
                          className={`rounded-xl px-3 py-2 text-xs ${teamFormStatus.kind === "success"
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
                          className={`rounded-xl px-3 py-2 text-xs ${backupStatus.kind === "success"
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
          <section className={workspaceSectionClass}>
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
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${teamFormStatus.kind === "success"
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
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${member.isActive
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
          <section className={workspaceSectionClass}>
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
              <PremiumCard variant="accentDashed">
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-stone-900">
                    {canManageEvents ? "No events yet" : "No assigned events yet"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-stone-600">
                    {canManageEvents
                      ? "Create your first event to start planning a full Cutmaster workflow."
                      : "Ask an admin to assign you to an event from Event Team."}
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
                        setAllEventsShowArchived(false);
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
                    <div className="flex flex-col justify-end">
                      <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2.5">
                        <input
                          id="all-events-show-archived"
                          type="checkbox"
                          checked={allEventsShowArchived}
                          onChange={(e) => setAllEventsShowArchived(e.target.checked)}
                          className="h-4 w-4 rounded border-stone-300 text-[#00D4FF] focus:ring-[#00D4FF]/40"
                        />
                        <span className="text-xs font-medium text-stone-800">Show archived</span>
                      </label>
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
                    Archived events stay hidden unless Show archived is on.
                  </p>
                </PremiumCard>

                {allEventsFilteredAndSorted.length === 0 ? (
                  <PremiumCard variant="accentDashed">
                    <div className="py-10 text-center">
                      <p className="text-sm font-semibold text-stone-900">No events match</p>
                      <p className="mt-2 text-xs leading-relaxed text-stone-600">
                        Try clearing search or turn on Show archived to include archived events.
                      </p>
                      <PrimaryButton
                        type="button"
                        onClick={() => {
                          setAllEventsSearch("");
                          setAllEventsProfileFilter("all");
                          setAllEventsShowArchived(false);
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
                      const cardStatus = normalizeEventStatus(
                        evt.settings?.eventStatus,
                        (evt.settings as EventSettings & { eventLifecycleStatus?: string })
                          .eventLifecycleStatus,
                      );
                      const viewerBadge = viewerRoleBadgeForEvent(evt);
                      return (
                        <PremiumCard key={evt.id} className="overflow-hidden p-0">
                          <div className="relative aspect-[2.15/1] min-h-[118px] overflow-hidden">
                            <EventHeroCover
                              coverPhotoDataUrl={cardCover}
                              showPersonalizeGuidance={false}
                            />
                            <div className="absolute inset-0 bg-black/55" />
                            <div className="absolute right-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/15 ${eventStatusPillClassOnCover(cardStatus)}`}
                              >
                                {cardStatus}
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
                void commitActiveEventPlanningToEventsState().then(() => {
                  setAppMode("events");
                  setActiveScreen("All Events");
                });
              }}
              className={`w-full ${lightUiSecondaryButtonClass}`}
            >
              Back to All Events
            </PrimaryButton>
          </div>
        )}

        {authStage === "app" && appMode === "events" && activeScreen === "Command Center" && (effectiveRole === "Admin" || effectiveRole === "DJ") && (
          <section className={`${workspaceSectionClass} cm-section-enter`}>
            <div className="grid gap-3 xl:grid-cols-[1.8fr_1fr]">
              <div className="space-y-3">
                <PremiumCard variant="accent">
                  <div className="flex items-center justify-between gap-2">
                    <SectionTitle>Command Center</SectionTitle>
                    <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                      {commandCenterEvents.length} events
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-600">
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
                <PremiumCard variant="accent">
                  <SectionTitle>Recent Activity</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {activities
                      .filter((item) => commandCenterEvents.some((evt) => evt.id === item.eventId))
                      .slice(0, 8)
                      .map((item) => (
                        <div key={`cmd-activity-${item.id}`} className="rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2 text-xs">
                          <p className="text-stone-900">
                            <span className="mr-1">{activityTypeIcon(item.type)}</span>
                            {item.summary}
                          </p>
                          <p className="mt-1 text-stone-600">
                            {item.eventName} · {formatRelativeTime(item.timestamp)}
                          </p>
                        </div>
                      ))}
                  </div>
                </PremiumCard>
                <PremiumCard variant="accent">
                  <SectionTitle>Notifications</SectionTitle>
                  <div className="mt-3 space-y-2">
                    {notifications
                      .filter((notice) => commandCenterEvents.some((evt) => evt.id === notice.eventId))
                      .slice(0, 6)
                      .map((notice) => (
                        <div key={`cmd-notice-${notice.id}`} className="rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2 text-xs">
                          <p className="text-stone-900">{notice.summary}</p>
                          <p className="mt-1 text-stone-600">
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
            <section className={workspaceSectionDashboardClass}>
              <PremiumCard className="overflow-hidden border-stone-200 bg-white !p-0 shadow-sm sm:shadow-[0_20px_50px_-36px_rgba(28,25,23,0.18)]">
                <div className="relative aspect-[16/11] min-h-[200px] overflow-hidden sm:aspect-[21/9] sm:min-h-[220px]">
                  <EventHeroCover
                    coverPhotoDataUrl={eventSettings.coverPhotoDataUrl}
                    onRequestCoverPhoto={canEditEventCover ? openEventCoverSettings : undefined}
                    personalizeDisabled={!canEditEventCover}
                  />
                  <div className="pointer-events-none absolute inset-0 z-[1] bg-black/50" />
                  <div className="pointer-events-none absolute inset-0 bg-transparent" aria-hidden />
                  <div className="relative z-[3] flex h-full flex-col justify-end p-5 pb-6 sm:p-8 pointer-events-none">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-200">
                      {primaryPartyShortLabel}
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {eventDisplayName}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-zinc-100">{coupleDisplayName}</p>
                    <div className="pointer-events-auto mt-4 flex flex-wrap items-center gap-2">
                      {eventStatusDashboardControl}
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
                        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-200">Planning progress</p>
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
                  <div className="rounded-xl border border-stone-200/90 bg-white px-3 py-3 shadow-sm sm:px-4 sm:py-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{eventCountdownLabel}</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-stone-900">
                      {daysUntilWedding === null
                        ? "Add your event date to unlock a gentle countdown"
                        : daysUntilWedding === 0
                          ? "It’s event day—breathe, you’ve got this"
                          : layoutProfileForActiveEvent === "Wedding" ||
                            layoutProfileForActiveEvent === "Gender-Neutral Wedding"
                            ? `${daysUntilWedding} day${daysUntilWedding === 1 ? "" : "s"} until you say “I do”`
                            : `${daysUntilWedding} day${daysUntilWedding === 1 ? "" : "s"} until your event`}
                    </p>
                  </div>
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

              <div className="rounded-2xl border border-stone-200/90 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Next step</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">{coupleNextStep.body}</p>
                <PrimaryButton
                  type="button"
                  onClick={() => setActiveScreen(coupleNextStep.targetScreen)}
                  className="mt-4 min-h-11 w-full rounded-xl border border-stone-800 bg-[#00D4FF] px-4 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:brightness-[1.02] sm:w-auto sm:min-w-[10rem]"
                >
                  {coupleNextStep.ctaLabel}
                </PrimaryButton>
                <p className="mt-3 text-[11px] tabular-nums text-stone-500">
                  {completionPercent}% of your plan in place
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5">
                {coupleHomePlanningSections.map((section) => {
                  return (
                    <button
                      type="button"
                      key={section.id}
                      onClick={() => setActiveScreen(section.screen)}
                      className="group flex min-h-[10.5rem] flex-col rounded-2xl border border-stone-300 bg-white px-5 py-5 text-left shadow-none ring-1 ring-stone-200 transition hover:border-[#00D4FF]/55 hover:ring-[#00D4FF]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D4FF]/60 sm:min-h-0 sm:py-5 sm:shadow-[0_2px_10px_-4px_rgba(28,25,23,0.1)] sm:ring-0 sm:hover:shadow-[0_10px_28px_-10px_rgba(28,25,23,0.14)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
                              {section.kicker}
                            </p>
                          </div>
                          <h3 className="mt-1.5 text-lg font-semibold leading-snug text-stone-950 [overflow-wrap:anywhere]">
                            {section.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-stone-700 sm:text-[13px] sm:leading-relaxed sm:text-stone-600">
                            {section.description}
                          </p>
                          {section.statLine || section.statSubline ? (
                            <div className="mt-3 space-y-1 rounded-xl border border-stone-200/90 bg-stone-50/90 px-3 py-2.5">
                              {section.statLine ? (
                                <p className="text-sm font-medium text-stone-900">{section.statLine}</p>
                              ) : null}
                              {section.statSubline ? (
                                <p className="text-xs leading-relaxed text-stone-600">{section.statSubline}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {section.pendingBadge ? (
                          <span className="shrink-0 rounded-full border border-[#7E52A0]/35 bg-[#7E52A0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5a3d72]">
                            {section.pendingBadge}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-[11px] font-medium text-stone-600">
                          <span>{section.completionStatusLabel ?? "At-a-glance"}</span>
                          <span className="tabular-nums font-semibold text-stone-700">{section.completion}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 ring-1 ring-inset ring-stone-300/40">
                          <div
                            className="h-full rounded-full bg-[#00D4FF] transition-[width] duration-500"
                            style={{ width: `${section.completion}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end border-t border-stone-200 pt-3.5">
                        <span className="text-xs font-semibold text-stone-700 transition group-hover:text-stone-900">
                          {section.ctaLabel} →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

            </section>
          ) : (
            <>
              <section className={workspaceSectionClass}>
                <PremiumCard className="overflow-hidden !p-0 border-stone-200 bg-white shadow-sm">
                  <div className="relative aspect-[16/11] min-h-[168px] overflow-hidden sm:aspect-[21/9] sm:min-h-[200px]">
                    <EventHeroCover
                      coverPhotoDataUrl={eventSettings.coverPhotoDataUrl}
                      onRequestCoverPhoto={canEditEventCover ? openEventCoverSettings : undefined}
                      personalizeDisabled={!canEditEventCover}
                    />
                    <div className="pointer-events-none absolute inset-0 z-[1] bg-black/45" />
                    <div className="relative z-[3] flex h-full flex-col justify-end p-5 sm:p-7 pointer-events-none">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-200">{primaryPartyShortLabel}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {eventDisplayName}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{coupleDisplayName}</p>
                      <div className="pointer-events-auto mt-3 flex flex-wrap items-center gap-2">
                        {eventStatusDashboardControl}
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
                          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-200">Planning progress</p>
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
                      Event team contacts:{" "}
                      <span className="font-semibold text-stone-900">{vendors.length}</span>
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
                      <SectionTitle>{staffDashboardSectionTitles.nextTasks}</SectionTitle>
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
                {planningProgressDashboardCard}
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

              <section className={workspaceSectionClass}>
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
                            <span className="text-stone-600">{item.dueDateLabel}</span>
                          </div>
                          <p className="mt-1 text-stone-600">{item.description}</p>
                        </div>
                      ))
                    ) : (
                      planningChecklist.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-stone-100 bg-white px-3 py-2 text-xs shadow-sm">
                          <span className="font-medium text-stone-800">{item.title}</span>
                          <span className="text-stone-600">{item.dueDateLabel || "No due timing"}</span>
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

              <section className={workspaceSectionClass}>
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

              <section className={workspaceSectionClass}>
                <SectionTitle className="font-medium !text-stone-800">
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
          receptionHubEligibleNav &&
          !isCoupleView && (
            <section className={workspaceSectionClass}>
              <EventHomeNav
                trail={["Reception & timeline"]}
                onBack={() => setActiveScreen("Dashboard")}
              />
              <PremiumCard variant="accent">
                <SectionTitle>Reception & main event</SectionTitle>
                <p className="mt-1 text-xs text-stone-600">
                  Your timeline, special moments, and notes—everything for the heart of your celebration.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {sectionReceptionTimelineEnabled && (
                    <PrimaryButton
                      type="button"
                      onClick={() => setActiveScreen("Reception Timeline")}
                      className="min-h-[3.75rem] justify-start rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#00D4FF]/45 hover:bg-stone-50 sm:col-span-2"
                    >
                      <span className="block text-sm font-semibold text-stone-900">Reception timeline</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-stone-600">
                        Flow, formal moments, songs, and cues in one workspace
                      </span>
                    </PrimaryButton>
                  )}
                  {(sectionPlanningChecklistEnabled || sectionMusicNotesEnabled) && (
                    <PrimaryButton
                      type="button"
                      onClick={() => setActiveScreen("Notes")}
                      className="min-h-[3.75rem] justify-start rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#00D4FF]/45 hover:bg-stone-50 sm:col-span-2"
                    >
                      <span className="block text-sm font-semibold text-stone-900">Planning notes</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-stone-600">
                        Shared notes for your vendor team
                      </span>
                    </PrimaryButton>
                  )}
                </div>
              </PremiumCard>
            </section>
          )}

        {authStage === "app" && appMode === "event" && activeScreen === "Music Hub" && (sectionMustPlayEnabled || sectionDoNotPlayEnabled || sectionPlaylistsEnabled) && (
          <section
            className={`${workspaceSectionClass} overflow-x-hidden`}
          >
            <EventHomeNav
              trail={["Music Hub"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={{
                label: "Add playlist link",
                onClick: () => {
                  document.getElementById("music-hub-playlist-links")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  window.setTimeout(() => document.getElementById("music-new-playlist-url")?.focus(), 250);
                },
                disabled: !canManageMusic,
              }}
            />

            <PremiumCard variant="accent">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#00D4FF]/75">Music planning</p>
                  <SectionTitle className="mt-1">Music Hub</SectionTitle>
                </div>
                <PersistEcho persistFeedback={persistFeedback} className="pt-1" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Share playlists and the sounds you love—your DJ uses this to prepare, not to replace their judgment on the night.
              </p>
            </PremiumCard>

            {!canManageMusic && (
              <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                <p className="text-xs font-medium text-amber-950">
                  {effectiveRole} role can view music, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}

            <MusicHubPrepSnapshot
              playlistCount={musicPlaylistLinks.length}
              mustPlayCount={mustPlaySongs.length}
              playIfPossibleCount={playIfPossibleSongs.length}
              doNotPlayCount={doNotPlaySongs.length}
              showMustPlay={sectionMustPlayEnabled}
              showDoNotPlay={sectionDoNotPlayEnabled}
            />

            <PremiumCard
              id="music-hub-playlist-links"
              className="border-stone-200 bg-white shadow-sm ring-1 ring-stone-200/80"
            >
              <SectionTitle className="text-stone-950">Playlist links</SectionTitle>
              <p className="mt-1 text-sm leading-snug text-stone-600">
                Share Spotify, Apple Music, YouTube, or other playlist links so your DJ can understand your music taste.
              </p>
              <p className="mt-2 text-xs text-stone-500">
                Playlist song extraction coming later—we never pull tracks from a link automatically today.
              </p>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="music-new-playlist-url"
                  label="Playlist URL"
                  value={musicNewPlaylistUrl}
                  onChange={setMusicNewPlaylistUrl}
                  placeholder="https://open.spotify.com/playlist/… or Apple Music / YouTube link"
                  disabled={!canManageMusic}
                />
                <TextInput
                  id="music-new-playlist-label"
                  label="Label (optional)"
                  value={musicNewPlaylistLabel}
                  onChange={setMusicNewPlaylistLabel}
                  placeholder="e.g. Cocktail hour ideas"
                  disabled={!canManageMusic}
                />
                <TextArea
                  id="music-new-playlist-notes"
                  label="Notes (optional)"
                  value={musicNewPlaylistNotes}
                  onChange={setMusicNewPlaylistNotes}
                  rows={2}
                  placeholder="Anything your DJ should know about this list…"
                  disabled={!canManageMusic}
                />
                <PrimaryButton
                  type="button"
                  onClick={addMusicPlaylistLink}
                  disabled={!canManageMusic || !musicNewPlaylistUrl.trim()}
                  className="w-full border border-black bg-[#00D4FF] py-2.5 text-sm font-semibold text-black shadow-none hover:brightness-105 disabled:opacity-45"
                >
                  Save playlist link
                </PrimaryButton>
              </div>
              {musicPlaylistLinks.length > 0 ? (
                <ul className="mt-5 space-y-3">
                  {musicPlaylistLinks.map((link) => {
                    const linkLabel = link.label?.trim() || "Playlist";
                    const linkHost = musicPlaylistLinkHost(link.url);
                    const linkNotesPreview = link.notes?.trim();
                    return (
                      <li key={link.id}>
                        <details className="group rounded-xl border border-stone-200 bg-stone-50/90 open:bg-white">
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-3 sm:p-4 [&::-webkit-details-marker]:hidden">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-stone-900">{linkLabel}</p>
                              <p className="mt-0.5 truncate text-xs font-medium text-stone-600">{linkHost}</p>
                              {linkNotesPreview ? (
                                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-stone-500">
                                  {linkNotesPreview}
                                </p>
                              ) : null}
                              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-stone-400 group-open:hidden">
                                Tap to edit
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span className="text-[11px] font-medium text-stone-400 transition-transform group-open:rotate-180">
                                ▼
                              </span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  removeMusicPlaylistLink(link.id);
                                }}
                                disabled={!canManageMusic}
                                className="text-[12px] font-medium text-rose-800 hover:underline disabled:opacity-40"
                              >
                                Remove
                              </button>
                            </div>
                          </summary>
                          <div className="border-t border-stone-200 px-3 pb-4 pt-3 sm:px-4">
                            <TextInput
                              id={`pl-url-${link.id}`}
                              label="URL"
                              value={link.url}
                              onChange={(v) => updateMusicPlaylistLink(link.id, { url: v })}
                              disabled={!canManageMusic}
                            />
                            <div className="mt-3">
                              <TextInput
                                id={`pl-label-${link.id}`}
                                label="Label (optional)"
                                value={link.label ?? ""}
                                onChange={(v) =>
                                  updateMusicPlaylistLink(link.id, { label: v.trim() || undefined })
                                }
                                disabled={!canManageMusic}
                              />
                            </div>
                            <div className="mt-3">
                              <TextArea
                                id={`pl-notes-${link.id}`}
                                label="Notes (optional)"
                                value={link.notes ?? ""}
                                onChange={(v) =>
                                  updateMusicPlaylistLink(link.id, { notes: v.trim() || undefined })
                                }
                                rows={2}
                                disabled={!canManageMusic}
                              />
                            </div>
                            <div
                              className="mt-3 rounded-lg border border-dashed border-stone-300/80 bg-stone-50/80 px-3 py-2.5"
                              aria-label="Imported tracks placeholder"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                Imported tracks
                              </p>
                              <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                                Track import is coming later. For now, your DJ uses this link to listen and prep manually.
                              </p>
                            </div>
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-4">
                  <SectionEmptyState
                    wrapWithCard={false}
                    title="No playlist links yet"
                    description="Paste a Spotify, Apple Music, or YouTube link in the field above—your DJ uses it to read your taste."
                  />
                </div>
              )}
            </PremiumCard>

            <PremiumCard
              id="music-hub-taste-profile"
              className="border-stone-200 bg-white shadow-sm ring-1 ring-stone-200/80"
            >
              <SectionTitle className="text-stone-950">Music taste profile</SectionTitle>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                How do you want the event to feel? Tap what fits—this guides your DJ and keeps planning collaborative,
                not a giant manual playlist.
              </p>
              <div className="mt-5 space-y-6">
                <div>
                  <p className={lightUiFormLabelClass}>Dance floor style</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {MUSIC_TASTE_DANCE_FLOOR_OPTIONS.map((label) => {
                      const on = musicTasteProfile.danceFloorStyles.includes(label);
                      return (
                        <button
                          key={`taste-dance-${label}`}
                          type="button"
                          disabled={!canManageMusic}
                          onClick={() => toggleMusicTasteChip("danceFloorStyles", label)}
                          className={`min-h-10 rounded-full border px-3.5 py-2 text-left text-[13px] font-medium transition sm:min-h-9 ${on
                            ? "border-black bg-[#00D4FF] text-black shadow-none"
                            : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
                            } disabled:opacity-45`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className={lightUiFormLabelClass}>Crowd preferences</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {MUSIC_TASTE_CROWD_OPTIONS.map((label) => {
                      const on = musicTasteProfile.crowdPreferences.includes(label);
                      return (
                        <button
                          key={`taste-crowd-${label}`}
                          type="button"
                          disabled={!canManageMusic}
                          onClick={() => toggleMusicTasteChip("crowdPreferences", label)}
                          className={`min-h-10 rounded-full border px-3.5 py-2 text-left text-[13px] font-medium transition sm:min-h-9 ${on
                            ? "border-black bg-[#00D4FF] text-black shadow-none"
                            : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
                            } disabled:opacity-45`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className={lightUiFormLabelClass}>Music behavior</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {MUSIC_TASTE_BEHAVIOR_OPTIONS.map((label) => {
                      const on = musicTasteProfile.musicBehavior.includes(label);
                      return (
                        <button
                          key={`taste-behavior-${label}`}
                          type="button"
                          disabled={!canManageMusic}
                          onClick={() => toggleMusicTasteChip("musicBehavior", label)}
                          className={`min-h-10 rounded-full border px-3.5 py-2 text-left text-[13px] font-medium transition sm:min-h-9 ${on
                            ? "border-black bg-[#00D4FF] text-black shadow-none"
                            : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
                            } disabled:opacity-45`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-6 border-t border-stone-100 pt-6">
                <TextArea
                  id="music-taste-dance-floor-vibe"
                  label="Describe your ideal dance floor vibe (optional)"
                  value={musicTasteProfile.danceFloorVibeNotes ?? ""}
                  onChange={(v) => setMusicTasteProfile((p) => ({ ...p, danceFloorVibeNotes: v }))}
                  rows={3}
                  placeholder="e.g. Big energy after dinner, singalongs guests know, then room for a few surprises…"
                  disabled={!canManageMusic}
                />
                <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                  Describe the kind of energy or atmosphere you want your guests to experience.
                </p>
              </div>
            </PremiumCard>

            <PremiumCard className="border-stone-200 bg-white shadow-sm">
              <SectionTitle className="text-stone-950">Genres &amp; eras</SectionTitle>
              <p className="mt-1 text-sm text-stone-600">
                Tap everything that fits—this is a quick map, not a test.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {MUSIC_GENRE_ERA_OPTIONS.map((label) => {
                  const on = musicGenreEraSelections.includes(label);
                  return (
                    <button
                      key={`genre-${label}`}
                      type="button"
                      disabled={!canManageMusic}
                      onClick={() => toggleGenreEraChip(label)}
                      className={`min-h-10 rounded-full border px-3.5 py-2 text-left text-[13px] font-medium transition sm:min-h-9 ${on
                        ? "border-black bg-[#00D4FF] text-black shadow-none"
                        : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50"
                        } disabled:opacity-45`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </PremiumCard>

            <PremiumCard id="music-hub-quick-add" className="border border-dashed border-stone-300 bg-stone-50/60 shadow-none">
              <SectionTitle className="text-stone-950">Individual songs (optional)</SectionTitle>
              <p className="mt-1 text-sm text-stone-600">
                Add individual songs only if there are specific tracks we should know about. Most couples stop at playlists and genres.
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <PrimaryButton
                    onClick={() => setNewSongListType("mustPlay")}
                    disabled={!canManageMusic}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold shadow-none ${newSongListType === "mustPlay"
                      ? "border-black bg-[#00D4FF] text-black"
                      : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                      }`}
                  >
                    Must play
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setNewSongListType("playIfPossible")}
                    disabled={!canManageMusic}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold shadow-none ${newSongListType === "playIfPossible"
                      ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                      : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                      }`}
                  >
                    Play if possible
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setNewSongListType("doNotPlay")}
                    disabled={!canManageMusic}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold shadow-none ${newSongListType === "doNotPlay"
                      ? "border-rose-600 bg-rose-100 text-rose-950"
                      : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                      }`}
                  >
                    Do not play
                  </PrimaryButton>
                </div>
                <PrimaryButton
                  onClick={() => setNewSongHighPriority((prev) => !prev)}
                  disabled={!canManageMusic}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold shadow-none ${newSongHighPriority
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

            {(sectionMustPlayEnabled || sectionDoNotPlayEnabled) && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Priority songs
                </p>
                <p className="text-xs leading-relaxed text-stone-600">
                  Three operational tiers your DJ scans on event day — what to play, what to slide in if it fits, and what to steer away from.
                </p>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-3 lg:gap-4">
              {sectionMustPlayEnabled && (
                <PremiumCard variant="accent" id="music-hub-must-play">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <SectionTitle>Must play</SectionTitle>
                      <p className="mt-1 text-xs text-stone-600">Songs that should absolutely make the night.</p>
                    </div>
                    <span className="rounded-full border border-[#00D4FF]/35 bg-[#00D4FF]/15 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-stone-900">
                      {mustPlaySongs.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {mustPlaySongs.length === 0 ? (
                      <SectionEmptyState
                        wrapWithCard={false}
                        title="No must-plays yet"
                        description="Name a few songs your DJ should absolutely work in—three strong picks is a great start."
                        primaryAction={{
                          label: "Add must-play song",
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

              {sectionMustPlayEnabled && (
                <PremiumCard className="border border-emerald-200/80 bg-white shadow-none" id="music-hub-play-if-possible">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <SectionTitle className="text-stone-950">Play if possible</SectionTitle>
                      <p className="mt-1 text-xs text-stone-600">
                        Nice-to-haves when the moment feels right—never a guarantee.
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-950">
                      {playIfPossibleSongs.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {playIfPossibleSongs.length === 0 ? (
                      <SectionEmptyState
                        wrapWithCard={false}
                        title="No “play if possible” yet"
                        description="Optional—add a few if specific songs would make you smile."
                        primaryAction={{
                          label: "Add from box above",
                          onClick: () => {
                            setNewSongListType("playIfPossible");
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
                    {playIfPossibleSongs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        listType="playIfPossible"
                        onTogglePriority={togglePriority}
                        onRemove={removeSong}
                        disabled={!canManageMusic}
                      />
                    ))}
                  </div>
                </PremiumCard>
              )}

              {sectionDoNotPlayEnabled && (
                <PremiumCard className="border-stone-300 bg-white shadow-none" id="music-hub-do-not-play">
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
              <details className="group no-print rounded-2xl border border-stone-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold text-stone-900 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <span>Song ideas by part of the night (optional)</span>
                  <span className="text-[11px] font-medium text-stone-500 transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="border-t border-stone-200 px-4 pb-4 pt-2 sm:px-5">
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
                                  {usingDefaults ? " · Includes starter ideas" : " · Custom list"}
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
                                <li>
                                  <SectionEmptyState
                                    wrapWithCard={false}
                                    cardClassName="py-3"
                                    title="No songs for this moment"
                                    description="Add a line above—one title and artist is enough to set the vibe."
                                  />
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
                </div>
              </details>
            )}

            {sectionGuestRequestsEnabled ? (
              <PremiumCard>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <SectionTitle>Guest requests</SectionTitle>
                    <p className="mt-1 text-xs text-stone-600">
                      What guests are asking for—approve in one tap on the full screen.
                    </p>
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={() => setActiveScreen("Guest Requests")}
                    className={lightUiCyanPrimaryButtonClass}
                  >
                    Open guest requests
                  </PrimaryButton>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-800">Approved</p>
                    <div className="mt-2 space-y-2">
                      {guestRequests.filter((r) => r.status === "Approved").length === 0 ? (
                        <SectionEmptyState
                          wrapWithCard={false}
                          cardClassName="border-emerald-200/80 bg-white py-3"
                          title="No approvals yet"
                          description="Approved picks stay ready for the DJ."
                        />
                      ) : (
                        guestRequests
                          .filter((r) => r.status === "Approved")
                          .map((request) => (
                            <div
                              key={`hub-approved-${request.id}`}
                              className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm"
                            >
                              <p className="text-sm text-stone-900">
                                {request.songTitle}
                                {request.artist ? (
                                  <span className="font-normal text-stone-600"> — {request.artist}</span>
                                ) : null}
                              </p>
                              <p className="mt-1 text-[11px] text-stone-500">{request.guestName}</p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-violet-200/90 bg-violet-50/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-violet-900">Pending</p>
                    <div className="mt-2 space-y-2">
                      {guestRequests.filter((r) => r.status === "Pending").length === 0 ? (
                        <SectionEmptyState
                          wrapWithCard={false}
                          cardClassName="border-violet-200/80 bg-white py-3"
                          title="Inbox is clear"
                          description="New requests appear here when guests submit."
                        />
                      ) : (
                        guestRequests
                          .filter((r) => r.status === "Pending")
                          .map((request) => (
                            <div
                              key={`hub-pending-${request.id}`}
                              className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm"
                            >
                              <p className="text-sm text-stone-900">
                                {request.songTitle}
                                {request.artist ? (
                                  <span className="font-normal text-stone-600"> — {request.artist}</span>
                                ) : null}
                              </p>
                              <p className="mt-1 text-[11px] text-stone-500">{request.guestName}</p>
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
              <PremiumCard variant="accent">
                <SectionTitle>Music notes &amp; vibe</SectionTitle>
                <p className="mt-1 text-xs text-stone-600">
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

        {authStage === "app" &&
          appMode === "event" &&
          (showCeremonyOnlyTimelineWorkspace || showUnifiedTimelineWorkspace) && (
          <section
            className={`${workspaceSectionClass} overflow-x-hidden md:mx-auto md:w-full md:max-w-5xl md:px-3 lg:max-w-6xl lg:px-6 xl:px-8 ${showUnifiedTimelineWorkspace ? "pb-0" : ""}`}
          >
            {showUnifiedTimelineWorkspace ? (
              <>
                <EventHomeNav
                  trail={["Event timeline"]}
                  onBack={() => setActiveScreen("Dashboard")}
                />
                {!canEditTimeline && (
                  <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                    <p className="text-xs font-medium text-amber-950">
                      {effectiveRole} role can view timeline, but editing is limited in this prototype.
                    </p>
                  </PremiumCard>
                )}
                <div className="no-print flex min-w-0 items-start justify-between gap-2">
                  <h2 className="min-w-0 text-xl font-semibold tracking-tight text-stone-900 sm:text-lg md:text-xl">
                    Event timeline
                  </h2>
                  <PersistEcho
                    persistFeedback={persistFeedback}
                    variant="light"
                    className="pt-1 sm:pt-0.5"
                  />
                </div>
                <TimelinePhaseSectionHeader
                  id="timeline-section-ceremony"
                  title="Ceremony"
                  onAdd={openCeremonyTimelineComposer}
                  addLabel="+ Ceremony moment"
                  addDisabled={!canEditTimeline}
                />
              </>
            ) : (
              <>
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
              </>
            )}

            {ceremonyTimelineComposerOpen && (
              <PremiumCard variant="accent" className={premiumFormSectionCardClass}>
                <div ref={ceremonyTimelineComposerRef}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <SectionTitle>New ceremony moment</SectionTitle>
                      <p className="text-xs leading-relaxed text-stone-600">
                        Lightweight capture—fine-tune anytime inline on the timeline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        cancelCeremonyTimelineInlineInsert();
                        setCeremonyTimelineComposerOpen(false);
                      }}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-6">
                    <CeremonyTimelineMomentForm
                      idPrefix="ceremony-top"
                      canEdit={canEditTimeline}
                      timeOrOrder={ceremonyTimelineDraftTimeOrOrder}
                      setTimeOrOrder={setCeremonyTimelineDraftTimeOrOrder}
                      moment={ceremonyTimelineDraftMoment}
                      setMoment={setCeremonyTimelineDraftMoment}
                      songTitle={ceremonyTimelineDraftSongTitle}
                      setSongTitle={setCeremonyTimelineDraftSongTitle}
                      artist={ceremonyTimelineDraftArtist}
                      setArtist={setCeremonyTimelineDraftArtist}
                      notes={ceremonyTimelineDraftNotes}
                      setNotes={setCeremonyTimelineDraftNotes}
                      needsAttention={ceremonyTimelineDraftNeedsAttention}
                      setNeedsAttention={setCeremonyTimelineDraftNeedsAttention}
                      onCancel={() => {
                        cancelCeremonyTimelineInlineInsert();
                        setCeremonyTimelineComposerOpen(false);
                      }}
                      onSubmit={saveCeremonyTimelineComposerItem}
                      submitLabel="Add to ceremony timeline"
                    />
                  </div>
                </div>
              </PremiumCard>
            )}

            <div
              ref={ceremonyTimelineStreamRef}
              className={
                showUnifiedTimelineWorkspace
                  ? `${TIMELINE_STREAM_UNIFIED_CLASS} px-4 pb-4 sm:px-5 md:px-6`
                  : TIMELINE_STREAM_CLASS
              }
            >
              {ceremonyTimelineItems.length === 0 ? (
                <SectionEmptyState
                  title="Build your ceremony flow"
                  description="Add aisle-to-recessional moments one at a time. Times and songs can stay blank for now."
                  primaryAction={{
                    label: "+ Add ceremony moment",
                    onClick: openCeremonyTimelineComposer,
                    disabled: !canEditTimeline,
                  }}
                />
              ) : (
                <>
                {ceremonyTimelineItems.map((item, index) => {
                  const rowExpanded = ceremonyTimelineExpandedId === item.id;
                  const songLine = [item.songTitle?.trim(), item.artist?.trim()]
                    .filter(Boolean)
                    .join(" · ");
                  const cerInlineVals =
                    ceremonyTimelineInlineEditDraft?.itemId === item.id
                      ? ceremonyTimelineInlineEditDraft.values
                      : null;
                  const cerTime = cerInlineVals?.timeOrOrder ?? item.timeOrOrder;
                  const cerMoment = cerInlineVals?.moment ?? item.moment;
                  const cerSong = cerInlineVals?.songTitle ?? item.songTitle;
                  const cerArtist = cerInlineVals?.artist ?? item.artist;
                  const cerNotes = cerInlineVals?.notes ?? item.notes;
                  const cerNeedsMc = cerInlineVals?.needsDjMcAttention ?? item.needsDjMcAttention;
                  const isDragging = draggingCeremonyTimelineId === item.id;
                  const isDropTarget =
                    dropTargetCeremonyTimelineId === item.id && draggingCeremonyTimelineId !== item.id;
                  const ceremonyDragActive = draggingCeremonyTimelineId !== null;
                  return (
                    <Fragment key={item.id}>
                    <PremiumCard
                      className={`${timelineReorderRowSurfaceClass({
                        isDragging,
                        isDropTarget,
                        dragActive: ceremonyDragActive && !isDragging,
                        zebra: index % 2 === 1,
                      })} ${TIMELINE_CARD_SHELL_CLASS} ${ceremonyDragActive ? "select-none" : ""} ${rowExpanded ? TIMELINE_CARD_EDITING_CLASS : ""}`}
                      aria-grabbed={isDragging}
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
                      {isDropTarget ? <TimelineDropTargetMarker /> : null}
                      {!rowExpanded && (
                        <>
                          <div className="hidden md:mx-auto md:flex md:w-full md:max-w-[44rem] md:flex-col md:gap-3 lg:max-w-[56rem] lg:flex-row lg:items-start lg:justify-between lg:gap-4 xl:max-w-[60rem] xl:gap-5">
                            <div className="min-w-0 flex-1 space-y-1.5 lg:max-w-[40rem] xl:max-w-[42rem]">
                              <TimelineMomentHeadline
                                timeLabel={item.timeOrOrder ?? ""}
                                title={item.moment}
                              />
                              <TimelineSongCueLine kind="Song" preview={songLine || "—"} hasSong={Boolean(songLine)} />
                              {item.notes?.trim() ? (
                                <p className={TIMELINE_CARD_NOTES_CLASS}>{item.notes}</p>
                              ) : null}
                            </div>
                            <div className={TIMELINE_CARD_ACTION_RAIL_CLASS}>
                              <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                                <span className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700 md:rounded-md md:px-2 md:py-0.5 md:text-[11px]">
                                  Ceremony
                                </span>
                                {item.needsDjMcAttention ? (
                                  <span className="rounded border border-[#7E52A0]/55 bg-[#7E52A0]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#4c3266] md:rounded-md md:px-2 md:py-0.5 md:text-[11px]">
                                    DJ/MC
                                  </span>
                                ) : null}
                              </div>
                              <div className={TIMELINE_CARD_ACTION_ROW_CLASS}>
                                <PrimaryButton
                                  type="button"
                                  onClick={() => openCeremonyTimelineCardExpanded(item)}
                                  disabled={!canEditTimeline}
                                  className={TIMELINE_CARD_ACTION_BTN_PRIMARY_CLASS}
                                >
                                  Edit
                                </PrimaryButton>
                                <PrimaryButton
                                  type="button"
                                  onClick={() => prepareAddCeremonyMomentAfter(item.id)}
                                  disabled={!canEditTimeline}
                                  className={TIMELINE_CARD_ACTION_BTN_CLASS}
                                >
                                  + After
                                </PrimaryButton>
                                <PrimaryButton
                                  type="button"
                                  onClick={() => duplicateCeremonyTimelineItem(item)}
                                  disabled={!canEditTimeline}
                                  className={TIMELINE_CARD_ACTION_BTN_CLASS}
                                >
                                  Duplicate
                                </PrimaryButton>
                                {canEditTimeline ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingTimelineDelete({
                                        kind: "ceremony",
                                        id: item.id,
                                        label: item.moment.trim() || "this moment",
                                      })
                                    }
                                    className={TIMELINE_CARD_ACTION_BTN_DELETE_CLASS}
                                  >
                                    Delete
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2.5 md:hidden">
                            <div
                              role="button"
                              tabIndex={canEditTimeline ? 0 : -1}
                              onClick={() => {
                                if (!canEditTimeline) return;
                                openCeremonyTimelineCardExpanded(item);
                              }}
                              onKeyDown={(event) => {
                                if (!canEditTimeline) return;
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openCeremonyTimelineCardExpanded(item);
                                }
                              }}
                              className={`${TIMELINE_CARD_MOBILE_READ_SHELL_CLASS} ${canEditTimeline
                                ? "cursor-pointer active:scale-[0.995]"
                                : "cursor-default opacity-80"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                  <TimelineMomentHeadline
                                    timeLabel={item.timeOrOrder ?? ""}
                                    title={item.moment}
                                    titleClassName="text-[1.05rem]"
                                  />
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                  <span className="rounded-md border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                                    Ceremony
                                  </span>
                                  {item.needsDjMcAttention ? (
                                    <span className="rounded-md border border-[#7E52A0]/55 bg-[#7E52A0]/12 px-2 py-0.5 text-[10px] font-semibold text-[#4c3266]">
                                      DJ/MC
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              {songLine ? (
                                <TimelineSongCueLine
                                  kind="Song"
                                  preview={songLine}
                                  hasSong
                                  className={`mt-2 ${TIMELINE_CARD_CUE_CLASS} text-[15px]`}
                                />
                              ) : null}
                              {item.notes?.trim() ? (
                                <p className={`mt-2 ${TIMELINE_CARD_NOTES_CLASS} line-clamp-3`}>
                                  {item.notes.trim()}
                                </p>
                              ) : null}
                              {canEditTimeline ? (
                                <p className="mt-2.5 text-[10px] font-medium text-stone-400">
                                  Tap card to edit
                                </p>
                              ) : (
                                <p className="mt-2.5 text-[10px] font-medium text-stone-400">View only</p>
                              )}
                            </div>
                            <div className={TIMELINE_CARD_MOBILE_ACTION_GRID_CLASS}>
                              <PrimaryButton
                                type="button"
                                onClick={() => openCeremonyTimelineCardExpanded(item)}
                                disabled={!canEditTimeline}
                                className={`${TIMELINE_CARD_MOBILE_ACTION_BTN_PRIMARY_CLASS} ${!canEditTimeline ? "col-span-2" : ""}`}
                              >
                                Expand
                              </PrimaryButton>
                              {canEditTimeline ? (
                                <>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => prepareAddCeremonyMomentAfter(item.id)}
                                    disabled={!canEditTimeline}
                                    className={TIMELINE_CARD_MOBILE_ACTION_BTN_CLASS}
                                  >
                                    + After
                                  </PrimaryButton>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => duplicateCeremonyTimelineItem(item)}
                                    disabled={!canEditTimeline}
                                    className={TIMELINE_CARD_MOBILE_ACTION_BTN_CLASS}
                                  >
                                    Duplicate
                                  </PrimaryButton>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingTimelineDelete({
                                        kind: "ceremony",
                                        id: item.id,
                                        label: item.moment.trim() || "this moment",
                                      })
                                    }
                                    className={TIMELINE_CARD_MOBILE_ACTION_BTN_DELETE_CLASS}
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </>
                      )}
                      {rowExpanded && (
                        <div className="md:mx-auto md:w-full md:max-w-[44rem]">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-stone-200 pb-3.5 md:mb-5 md:gap-3 md:pb-4">
                            <p className="text-[13px] font-semibold tracking-tight text-stone-900 md:text-sm">
                              Edit moment
                            </p>
                            <div className={TIMELINE_CARD_EXPANDED_HEADER_ACTIONS_CLASS}>
                              {canEditTimeline ? (
                                <>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => duplicateCeremonyTimelineItem(item)}
                                    disabled={!canEditTimeline}
                                    className={TIMELINE_CARD_EXPANDED_HEADER_BTN_CLASS}
                                  >
                                    Duplicate
                                  </PrimaryButton>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingTimelineDelete({
                                        kind: "ceremony",
                                        id: item.id,
                                        label: item.moment.trim() || "this moment",
                                      })
                                    }
                                    className={TIMELINE_CARD_EXPANDED_HEADER_DELETE_CLASS}
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className={TIMELINE_CARD_EDIT_FIELDS_CLASS}>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
                            <TextInput
                              id={`ceremony-inline-time-${item.id}`}
                              label="Time / order"
                              value={cerTime}
                              inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                              labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                              onChange={(value) =>
                                patchCeremonyTimelineInlineDraft(item.id, { timeOrOrder: value }, item)
                              }
                              disabled={!canEditTimeline}
                            />
                            <TextInput
                              id={`ceremony-inline-moment-${item.id}`}
                              label="Moment"
                              value={cerMoment}
                              inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                              labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                              onChange={(value) =>
                                patchCeremonyTimelineInlineDraft(item.id, { moment: value }, item)
                              }
                              disabled={!canEditTimeline}
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
                            <TextInput
                              id={`ceremony-inline-song-${item.id}`}
                              label="Song title"
                              value={cerSong}
                              inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                              labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                              onChange={(value) =>
                                patchCeremonyTimelineInlineDraft(item.id, { songTitle: value }, item)
                              }
                              disabled={!canEditTimeline}
                            />
                            <TextInput
                              id={`ceremony-inline-artist-${item.id}`}
                              label="Artist"
                              value={cerArtist}
                              inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                              labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                              onChange={(value) =>
                                patchCeremonyTimelineInlineDraft(item.id, { artist: value }, item)
                              }
                              disabled={!canEditTimeline}
                            />
                          </div>
                          <TextArea
                            id={`ceremony-inline-notes-${item.id}`}
                            label="Notes"
                            value={cerNotes}
                            textareaClassName={TIMELINE_DESKTOP_TEXTAREA_CLASS}
                            labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                            onChange={(value) =>
                              patchCeremonyTimelineInlineDraft(item.id, { notes: value }, item)
                            }
                            rows={2}
                            disabled={!canEditTimeline}
                          />
                          <PrimaryButton
                            type="button"
                            onClick={() =>
                              patchCeremonyTimelineInlineDraft(
                                item.id,
                                { needsDjMcAttention: !cerNeedsMc },
                                item,
                              )
                            }
                            disabled={!canEditTimeline}
                            className={`w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none md:py-2.5 md:text-[13px] ${cerNeedsMc
                              ? "border-[#00D4FF] bg-[#00D4FF]/12 text-stone-900"
                              : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                              }`}
                          >
                            {cerNeedsMc
                              ? "DJ/MC attention: On"
                              : "Flag DJ/MC attention"}
                          </PrimaryButton>
                          <div className={TIMELINE_CARD_EDIT_DONE_ROW_CLASS}>
                            <PrimaryButton
                              type="button"
                              onClick={() => closeCeremonyTimelineCardExpanded()}
                              className={TIMELINE_CARD_EDIT_DONE_BTN_CLASS}
                            >
                              Done
                            </PrimaryButton>
                          </div>
                          </div>
                        </div>
                      )}
                      <div className={TIMELINE_CARD_FOOTER_CLASS}>
                        <button
                          type="button"
                          draggable={canEditTimeline}
                          title="Press and drag to reorder"
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
                          onTouchStart={(event) => {
                            if (!canEditTimeline || event.touches.length > 1) return;
                            touchDragCeremonyTimelineSourceRef.current = item.id;
                            setDraggingCeremonyTimelineId(item.id);
                          }}
                          className={`${TIMELINE_DRAG_HANDLE_CLASS} ${rowExpanded ? TIMELINE_DRAG_HANDLE_EDITING_CLASS : ""} ${isDragging ? "cursor-grabbing border-stone-600 bg-stone-200 shadow-sm ring-2 ring-stone-300/70" : ""}`}
                          disabled={!canEditTimeline}
                          aria-label={`Drag to reorder ${item.moment}`}
                        >
                          <TimelineDragGripDots emphasized={isDragging} />
                          <span className="flex flex-col items-start leading-tight sm:items-center">
                            <span>Reorder</span>
                            <span className="text-[10px] font-medium text-stone-500 sm:hidden">
                              Hold &amp; drag
                            </span>
                          </span>
                        </button>
                        <div className={TIMELINE_CARD_FOOTER_ACTIONS_CLASS}>
                          <TimelineCardPositionIndicator
                            index={index}
                            total={ceremonyTimelineItems.length}
                          />
                        </div>
                      </div>
                    </PremiumCard>
                    {ceremonyTimelineInsertAfterId === item.id ? (
                      <div ref={ceremonyTimelineInlineInsertRef} className="-mt-0.5">
                        <PremiumCard
                          variant="accent"
                          className={`${premiumFormSectionCardClass} rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/[0.05] shadow-none ring-1 ring-[#00D4FF]/20`}
                        >
                          <SectionTitle className="text-base">New ceremony moment</SectionTitle>
                          <p className="mt-1 text-xs text-stone-600">
                            Placed directly after the moment above.
                          </p>
                          <div className="mt-3">
                            <CeremonyTimelineMomentForm
                              idPrefix={`inline-cer-${item.id}`}
                              canEdit={canEditTimeline}
                              anchorLabel={item.moment}
                              timeOrOrder={ceremonyTimelineDraftTimeOrOrder}
                              setTimeOrOrder={setCeremonyTimelineDraftTimeOrOrder}
                              moment={ceremonyTimelineDraftMoment}
                              setMoment={setCeremonyTimelineDraftMoment}
                              songTitle={ceremonyTimelineDraftSongTitle}
                              setSongTitle={setCeremonyTimelineDraftSongTitle}
                              artist={ceremonyTimelineDraftArtist}
                              setArtist={setCeremonyTimelineDraftArtist}
                              notes={ceremonyTimelineDraftNotes}
                              setNotes={setCeremonyTimelineDraftNotes}
                              needsAttention={ceremonyTimelineDraftNeedsAttention}
                              setNeedsAttention={setCeremonyTimelineDraftNeedsAttention}
                              onCancel={cancelCeremonyTimelineInlineInsert}
                              onSubmit={saveCeremonyTimelineComposerItem}
                              submitLabel="Add moment"
                            />
                          </div>
                        </PremiumCard>
                      </div>
                    ) : null}
                    </Fragment>
                  );
                })}
                {ceremonyTimelineItems.length >= 1 && ceremonyTimelineItems.length <= 3 ? (
                  <div className="rounded-xl border border-dashed border-stone-300/80 bg-stone-50/50 px-4 py-3 text-center sm:px-5">
                    <p className="text-[12px] leading-relaxed text-stone-600 md:text-[13px]">
                      Add the next ceremony moment with{" "}
                      <span className="font-semibold text-stone-800">+ Ceremony moment</span> above,
                      or use <span className="font-semibold text-stone-800">+ After</span> on any row.
                    </p>
                  </div>
                ) : null}
                </>
              )}
            </div>

            {!showUnifiedTimelineWorkspace && !isCoupleView && (
              <PremiumCard variant="accent" className={premiumFormSectionCardClass}>
                <SectionTitle>Ceremony Assistant</SectionTitle>
                <p className="mt-3 text-xs leading-relaxed text-stone-600">
                  Processionals and audio readiness.
                </p>
                <div className="mt-5">
                  <InsightStack
                    insights={planningInsights.filter((i) => i.section === "ceremony")}
                    emptyLabel="Ceremony prep looks complete."
                  />
                </div>
              </PremiumCard>
            )}

            {!showUnifiedTimelineWorkspace ? (
            <PremiumCard className={premiumFormSectionCardClass}>
              <SectionTitle className="text-stone-950">Ceremony Details</SectionTitle>
              <div className="mt-6 space-y-4">
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
            ) : null}
          </section>
        )}
        {authStage === "app" &&
          appMode === "event" &&
          (showReceptionOnlyTimelineWorkspace || showUnifiedTimelineWorkspace) && (
            <section
              className={`${workspaceSectionClass} overflow-x-hidden md:mx-auto md:w-full md:max-w-5xl md:px-3 lg:max-w-6xl lg:px-6 xl:px-8 ${showUnifiedTimelineWorkspace ? "pt-0" : ""}`}
            >
              {showUnifiedTimelineWorkspace ? (
                <>
                  <div className="scroll-mt-6 mt-4 border-t border-stone-200/90 sm:mt-5">
                    <TimelinePhaseSectionHeader
                      id="timeline-section-reception"
                      title={
                        eventPrepReceptionHeading === "Reception Timeline"
                          ? "Reception"
                          : eventPrepReceptionHeading
                      }
                      onAdd={openReceptionTimelineComposerAtTop}
                      addLabel="+ Reception moment"
                      addDisabled={!canEditTimeline}
                    />
                  </div>
                </>
              ) : null}
              {!showUnifiedTimelineWorkspace ? (
              <>
              <EventHomeNav
                trail={
                  isCoupleView
                    ? ["Timeline"]
                    : activeScreen === "Reception Timeline"
                      ? ["Reception timeline"]
                      : ["Event timeline"]
                }
                onBack={() => setActiveScreen("Dashboard")}
                primaryAction={{
                  label: "+ Add moment",
                  onClick: openReceptionTimelineComposerAtTop,
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
                        {isCoupleView
                          ? "Timeline"
                          : activeScreen === "Reception Timeline"
                            ? "Reception timeline"
                            : "Event timeline"}
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
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    {canEditTimeline ? (
                      <PrimaryButton
                        type="button"
                        onClick={() => {
                          setTimelineImportOpen(true);
                          setTimelineImportStep("paste");
                          setTimelineImportParseError(null);
                          setTimelineImportReplaceDanger(false);
                        }}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[12px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:w-auto sm:shrink-0"
                      >
                        Import Timeline
                      </PrimaryButton>
                    ) : null}
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
              </>
              ) : null}

              {showTimelinePresetOnboarding && (
                <PremiumCard className="no-print overflow-hidden !p-0 border-stone-200 bg-white shadow-sm">
                  <div className="p-5 sm:p-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-700">Get started</p>
                    <h3 className="mt-2 text-lg font-semibold text-stone-950">Build your run of show</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
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
                        onClick={openReceptionTimelineComposerAtTop}
                        disabled={!canEditTimeline}
                        className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-none hover:bg-stone-50 disabled:opacity-45 sm:w-auto sm:min-h-11 sm:py-2.5"
                      >
                        Start from scratch
                      </PrimaryButton>
                    </div>
                    {!canEditTimeline ? (
                      <p className="mt-4 text-xs text-stone-600">Editing presets isn&apos;t available for your role.</p>
                    ) : !timelinePresetsForActiveEvent.some((p) => p.defaultIncluded) ? (
                      <p className="mt-4 text-xs text-stone-600">
                        No default moments are enabled for this event type in Global Settings → Timeline Presets.
                      </p>
                    ) : (
                      <p className="mt-4 text-xs text-stone-600">
                        Tip: after your timeline has moments, preset shortcuts move under{" "}
                        <span className="font-medium text-stone-700">Preset tools</span>.
                      </p>
                    )}
                  </div>
                </PremiumCard>
              )}

              {timelineComposerOpen && (
                <PremiumCard variant="accent">
                  <div ref={timelineComposerRef}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <SectionTitle>New moment</SectionTitle>
                        <p className="mt-1 text-xs text-stone-600">
                          Lightweight capture—fine-tune anytime inline on the timeline.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          cancelReceptionTimelineInlineInsert();
                          setTimelineComposerOpen(false);
                        }}
                        className="rounded-lg px-2 py-1 text-[11px] text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-4">
                      <ReceptionTimelineMomentForm
                        idPrefix="timeline-top"
                        canEdit={canEditTimeline}
                        timelineTime={timelineTime}
                        setTimelineTime={setTimelineTime}
                        timelineTitle={timelineTitle}
                        setTimelineTitle={setTimelineTitle}
                        timelineSongTitle={timelineSongTitle}
                        setTimelineSongTitle={setTimelineSongTitle}
                        timelineArtist={timelineArtist}
                        setTimelineArtist={setTimelineArtist}
                        timelineCategory={timelineCategory}
                        setTimelineCategory={setTimelineCategory}
                        timelineNotes={timelineNotes}
                        setTimelineNotes={setTimelineNotes}
                        timelineNeedsAttention={timelineNeedsAttention}
                        setTimelineNeedsAttention={setTimelineNeedsAttention}
                        composerError={timelineComposerError}
                        setComposerError={setTimelineComposerError}
                        onCancel={() => {
                          cancelReceptionTimelineInlineInsert();
                          setTimelineComposerOpen(false);
                        }}
                        onSubmit={addOrUpdateTimelineItem}
                        submitLabel="Add to timeline"
                      />
                    </div>
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
                className={
                  showUnifiedTimelineWorkspace
                    ? `${TIMELINE_STREAM_UNIFIED_CLASS} px-4 pb-4 sm:px-5 md:px-6`
                    : TIMELINE_STREAM_CLASS
                }
              >
                {mergedTimelineItems.length === 0 ? (
                  showTimelinePresetOnboarding ? null : (
                    <SectionEmptyState
                      title="Build your reception flow"
                      description="Add moments from cocktail through last dance. Times can stay blank until your DJ locks the schedule."
                      primaryAction={{
                        label: "Add first moment",
                        onClick: openReceptionTimelineComposerAtTop,
                        disabled: !canEditTimeline,
                      }}
                      secondaryAction={
                        mainTimelinePresetsForActiveEvent.length > 0 &&
                          timelinePresetsForActiveEvent.some((p) => p.defaultIncluded)
                          ? {
                            label: "Use suggested moments",
                            onClick: handleApplySuggestedTimelineSetup,
                            disabled:
                              !canEditTimeline || !timelinePresetsForActiveEvent.some((p) => p.defaultIncluded),
                          }
                          : undefined
                      }
                    />
                  )
                ) : (
                  <>
                  {mergedTimelineItems.map((item, index) => {
                    const timelineRow = timelineItems.find((t) => t.id === item.id);
                    const rowExpanded = receptionTimelineExpandedId === item.id;
                    const songPreview =
                      [item.songTitle?.trim(), item.artist?.trim()].filter(Boolean).join(" · ") ||
                      (item.notes?.trim()
                        ? item.notes.trim().split(/\n/)[0].slice(0, 180)
                        : "—");
                    const cueKind =
                      (item.songTitle?.trim() || item.artist?.trim()) ? "Song" : "Cue";
                    const songArtistCompact = [item.songTitle?.trim(), item.artist?.trim()]
                      .filter(Boolean)
                      .join(" · ");
                    const recvInlineVals =
                      receptionTimelineInlineEditDraft?.itemId === item.id
                        ? receptionTimelineInlineEditDraft.values
                        : null;
                    const recvTitle = recvInlineVals?.title ?? timelineRow?.title ?? item.title;
                    const recvTime = recvInlineVals?.time ?? timelineRow?.time ?? item.time;
                    const recvNotes = recvInlineVals?.notes ?? timelineRow?.notes ?? item.notes;
                    const recvSong = recvInlineVals?.songTitle ?? timelineRow?.songTitle ?? "";
                    const recvArtist = recvInlineVals?.artist ?? timelineRow?.artist ?? "";
                    const recvCategory = recvInlineVals?.category ?? timelineRow?.category ?? item.category;
                    const recvNeedsMc = recvInlineVals?.needsDjMcAttention ?? timelineRow?.needsDjMcAttention ?? false;
                    const recvFadeEarly = recvInlineVals?.fadeOutEarly ?? timelineRow?.fadeOutEarly ?? false;
                    const recvFadeTs = recvInlineVals?.fadeOutTimestamp ?? timelineRow?.fadeOutTimestamp ?? "";
                    const isDragging = draggingTimelineId === item.id;
                    const isDropTarget = dropTargetTimelineId === item.id && draggingTimelineId !== item.id;
                    const timelineDragActive = draggingTimelineId !== null;
                    const isGrandEntrance = isGrandEntranceTimelineItem(item.title);
                    return (
                      <Fragment key={item.id}>
                      <PremiumCard
                        className={`${timelineReorderRowSurfaceClass({
                          isDragging,
                          isDropTarget,
                          dragActive: timelineDragActive && !isDragging,
                          zebra: index % 2 === 1,
                        })} ${TIMELINE_CARD_SHELL_CLASS} ${timelineDragActive ? "select-none" : ""} ${rowExpanded ? TIMELINE_CARD_EDITING_CLASS : ""}`}
                        aria-grabbed={isDragging}
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
                        {isDropTarget ? <TimelineDropTargetMarker /> : null}
                        {!rowExpanded && (
                          <>
                            <div className="hidden md:mx-auto md:flex md:w-full md:max-w-[44rem] md:flex-col md:gap-3 lg:max-w-[56rem] lg:flex-row lg:items-start lg:justify-between lg:gap-4 xl:max-w-[60rem] xl:gap-5">
                              <div className="min-w-0 flex-1 space-y-1.5 lg:max-w-[40rem] xl:max-w-[42rem]">
                                <TimelineMomentHeadline timeLabel={item.time ?? ""} title={item.title} />
                                <TimelineSongCueLine
                                  kind={cueKind}
                                  preview={songPreview}
                                  hasSong={Boolean(songArtistCompact)}
                                />
                                {item.notes?.trim() ? (
                                  <p className={TIMELINE_CARD_NOTES_CLASS}>{item.notes}</p>
                                ) : null}
                              </div>
                              <div className={TIMELINE_CARD_ACTION_RAIL_CLASS}>
                                <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                                  <span
                                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:rounded-md md:px-2 md:py-0.5 md:text-[11px] ${item.category === "Formalities"
                                      ? "border-stone-500 bg-stone-200 text-stone-900"
                                      : "border-stone-300 bg-white text-stone-700"
                                      }`}
                                  >
                                    {item.category}
                                  </span>
                                  {item.needsDjMcAttention ? (
                                    <span className="rounded border border-[#7E52A0]/55 bg-[#7E52A0]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#4c3266] md:rounded-md md:px-2 md:py-0.5 md:text-[11px]">
                                      DJ/MC
                                    </span>
                                  ) : null}
                                </div>
                                <div className={TIMELINE_CARD_ACTION_ROW_CLASS}>
                                  {isGrandEntrance ? (
                                    <button
                                      type="button"
                                      onClick={() => openGrandEntranceDetail(item)}
                                      className={`${GRAND_ENTRANCE_DETAIL_BTN_CLASS} w-full lg:w-auto`}
                                    >
                                      Open Entrance Details
                                    </button>
                                  ) : null}
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => {
                                      if (timelineRow) openReceptionTimelineCardExpanded(timelineRow);
                                    }}
                                    disabled={!canEditTimeline}
                                    className={TIMELINE_CARD_ACTION_BTN_PRIMARY_CLASS}
                                  >
                                    Edit
                                  </PrimaryButton>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => prepareAddMomentAfterTimelineItem(item.id)}
                                    disabled={!canEditTimeline}
                                    className={TIMELINE_CARD_ACTION_BTN_CLASS}
                                  >
                                    + After
                                  </PrimaryButton>
                                  <PrimaryButton
                                    type="button"
                                    onClick={() => {
                                      const row = timelineItems.find((t) => t.id === item.id);
                                      if (row) duplicateTimelineItem(row);
                                    }}
                                    disabled={!canEditTimeline}
                                    className={TIMELINE_CARD_ACTION_BTN_CLASS}
                                  >
                                    Duplicate
                                  </PrimaryButton>
                                  {canEditTimeline ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPendingTimelineDelete({
                                          kind: "reception",
                                          id: item.id,
                                          label: item.title.trim() || "this moment",
                                        })
                                      }
                                      className={TIMELINE_CARD_ACTION_BTN_DELETE_CLASS}
                                    >
                                      Delete
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2.5 md:hidden">
                              <div
                                role="button"
                                tabIndex={canEditTimeline ? 0 : -1}
                                onClick={() => {
                                  if (!canEditTimeline) return;
                                  if (timelineRow) openReceptionTimelineCardExpanded(timelineRow);
                                }}
                                onKeyDown={(event) => {
                                  if (!canEditTimeline) return;
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    if (timelineRow) openReceptionTimelineCardExpanded(timelineRow);
                                  }
                                }}
                                className={`${TIMELINE_CARD_MOBILE_READ_SHELL_CLASS} ${canEditTimeline
                                  ? "cursor-pointer active:scale-[0.995]"
                                  : "cursor-default opacity-80"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="min-w-0 flex-1">
                                    <TimelineMomentHeadline
                                      timeLabel={item.time ?? ""}
                                      title={item.title}
                                      titleClassName="text-[1.05rem]"
                                    />
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                                    <span
                                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${item.category === "Formalities"
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
                                {songArtistCompact ? (
                                  <TimelineSongCueLine
                                    kind={cueKind}
                                    preview={songArtistCompact}
                                    hasSong
                                    className={`mt-2 ${TIMELINE_CARD_CUE_CLASS} text-[15px]`}
                                  />
                                ) : null}
                                {item.notes?.trim() ? (
                                  <p className={`mt-2 ${TIMELINE_CARD_NOTES_CLASS} line-clamp-3`}>
                                    {item.notes.trim()}
                                  </p>
                                ) : null}
                                {canEditTimeline ? (
                                  <p className="mt-2.5 text-[10px] font-medium text-stone-400">
                                    Tap card to edit
                                  </p>
                                ) : (
                                  <p className="mt-2.5 text-[10px] font-medium text-stone-400">View only</p>
                                )}
                              </div>
                              <div className={TIMELINE_CARD_MOBILE_ACTION_GRID_CLASS}>
                                {isGrandEntrance ? (
                                  <button
                                    type="button"
                                    onClick={() => openGrandEntranceDetail(item)}
                                    className={`${GRAND_ENTRANCE_DETAIL_BTN_CLASS} col-span-2 w-full`}
                                  >
                                    Open Entrance Details
                                  </button>
                                ) : null}
                                <PrimaryButton
                                  type="button"
                                  onClick={() => {
                                    if (timelineRow) openReceptionTimelineCardExpanded(timelineRow);
                                  }}
                                  disabled={!canEditTimeline}
                                  className={`${TIMELINE_CARD_MOBILE_ACTION_BTN_PRIMARY_CLASS} ${!canEditTimeline ? "col-span-2" : ""}`}
                                >
                                  Expand
                                </PrimaryButton>
                                {canEditTimeline ? (
                                  <>
                                    <PrimaryButton
                                      type="button"
                                      onClick={() => prepareAddMomentAfterTimelineItem(item.id)}
                                      disabled={!canEditTimeline}
                                      className={TIMELINE_CARD_MOBILE_ACTION_BTN_CLASS}
                                    >
                                      + After
                                    </PrimaryButton>
                                    <PrimaryButton
                                      type="button"
                                      onClick={() => {
                                        const row = timelineItems.find((t) => t.id === item.id);
                                        if (row) duplicateTimelineItem(row);
                                      }}
                                      disabled={!canEditTimeline}
                                      className={TIMELINE_CARD_MOBILE_ACTION_BTN_CLASS}
                                    >
                                      Duplicate
                                    </PrimaryButton>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPendingTimelineDelete({
                                          kind: "reception",
                                          id: item.id,
                                          label: item.title.trim() || "this moment",
                                        })
                                      }
                                      className={TIMELINE_CARD_MOBILE_ACTION_BTN_DELETE_CLASS}
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </>
                        )}
                        {rowExpanded && (
                          <div className="md:mx-auto md:w-full md:max-w-[44rem]">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-stone-200 pb-3.5 md:mb-5 md:gap-3 md:pb-4">
                              <p className="text-[13px] font-semibold tracking-tight text-stone-900 md:text-sm">
                                Edit moment
                              </p>
                              <div className={TIMELINE_CARD_EXPANDED_HEADER_ACTIONS_CLASS}>
                                {canEditTimeline ? (
                                  <>
                                    <PrimaryButton
                                      type="button"
                                      onClick={() => {
                                        const row = timelineItems.find((t) => t.id === item.id);
                                        if (row) duplicateTimelineItem(row);
                                      }}
                                      disabled={!canEditTimeline}
                                      className={TIMELINE_CARD_EXPANDED_HEADER_BTN_CLASS}
                                    >
                                      Duplicate
                                    </PrimaryButton>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPendingTimelineDelete({
                                          kind: "reception",
                                          id: item.id,
                                          label: item.title.trim() || "this moment",
                                        })
                                      }
                                      className={TIMELINE_CARD_EXPANDED_HEADER_DELETE_CLASS}
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            <div className={TIMELINE_CARD_EDIT_FIELDS_CLASS}>
                              <TextInput
                                id={`timeline-inline-title-${item.id}`}
                                label="Moment"
                                value={recvTitle}
                                inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                                labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                                onChange={(value) => patchReceptionTimelineInlineDraft(item.id, { title: value }, timelineRow ?? null)}
                                disabled={!canEditTimeline}
                              />
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
                                <TextInput
                                  id={`timeline-inline-time-${item.id}`}
                                  label="Time"
                                  value={recvTime}
                                  inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                                  labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                                  onChange={(value) => patchReceptionTimelineInlineDraft(item.id, { time: value }, timelineRow ?? null)}
                                  disabled={!canEditTimeline}
                                />
                                <div>
                                  <label
                                    htmlFor={`timeline-inline-cat-${item.id}`}
                                    className={TIMELINE_DESKTOP_LABEL_CLASS}
                                  >
                                    Category
                                  </label>
                                  <select
                                    id={`timeline-inline-cat-${item.id}`}
                                    value={recvCategory}
                                    disabled={!canEditTimeline}
                                    onChange={(event) => {
                                      const next = event.target.value as TimelineCategory;
                                      patchReceptionTimelineInlineDraft(item.id, { category: next }, timelineRow ?? null);
                                    }}
                                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-none transition focus:border-[#00D4FF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/25 md:min-h-12 md:px-4 md:py-3 md:text-base"
                                  >
                                    {timelineCategories.map((category) => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
                                <TextInput
                                  id={`timeline-inline-song-${item.id}`}
                                  label="Song"
                                  value={recvSong}
                                  inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                                  labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                                  onChange={(value) => patchReceptionTimelineInlineDraft(item.id, { songTitle: value }, timelineRow ?? null)}
                                  placeholder="Song title"
                                  disabled={!canEditTimeline}
                                />
                                <TextInput
                                  id={`timeline-inline-song-artist-${item.id}`}
                                  label="Artist"
                                  value={recvArtist}
                                  inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                                  labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                                  onChange={(value) => patchReceptionTimelineInlineDraft(item.id, { artist: value }, timelineRow ?? null)}
                                  placeholder="Artist"
                                  disabled={!canEditTimeline}
                                />
                              </div>
                              <TextArea
                                id={`timeline-inline-notes-${item.id}`}
                                label="Notes"
                                value={recvNotes}
                                textareaClassName={TIMELINE_DESKTOP_TEXTAREA_CLASS}
                                labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                                onChange={(value) => patchReceptionTimelineInlineDraft(item.id, { notes: value }, timelineRow ?? null)}
                                rows={2}
                                disabled={!canEditTimeline}
                              />
                              <PrimaryButton
                                type="button"
                                onClick={() =>
                                  patchReceptionTimelineInlineDraft(
                                    item.id,
                                    { needsDjMcAttention: !recvNeedsMc },
                                    timelineRow ?? null,
                                  )
                                }
                                disabled={!canEditTimeline}
                                className={`w-full rounded-lg border py-2.5 text-[12px] font-semibold shadow-none md:py-3 md:text-[13px] ${recvNeedsMc
                                  ? "border-[#00D4FF] bg-[#00D4FF]/12 text-stone-900"
                                  : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                                  }`}
                              >
                                {recvNeedsMc ? "DJ/MC flagged" : "Flag DJ / MC"}
                              </PrimaryButton>

                              <details className="rounded-lg border border-stone-200 bg-stone-50">
                                <summary className="flex min-h-10 cursor-pointer list-none items-center px-3 py-2 text-[11px] font-semibold text-stone-700 [&::-webkit-details-marker]:hidden hover:bg-white md:min-h-11 md:px-4 md:text-xs">
                                  Fade / advanced timing
                                </summary>
                                <div className="space-y-2 border-t border-stone-200 bg-white p-3 md:space-y-3 md:p-4">
                                  <p className="text-[10px] leading-relaxed text-stone-600 md:text-[11px] md:leading-relaxed">
                                    Optional cue — common for introductions and formalities.
                                  </p>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
                                    <PrimaryButton
                                      type="button"
                                      onClick={() =>
                                        patchReceptionTimelineInlineDraft(
                                          item.id,
                                          { fadeOutEarly: !recvFadeEarly },
                                          timelineRow ?? null,
                                        )
                                      }
                                      disabled={!canEditTimeline}
                                      className={`w-full rounded-lg border py-2 text-[12px] font-semibold shadow-none md:py-2.5 md:text-[13px] ${recvFadeEarly
                                        ? "border-[#00D4FF] bg-[#00D4FF]/12 text-stone-900"
                                        : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
                                        }`}
                                    >
                                      {recvFadeEarly ? "Fade out early: On" : "Fade out early"}
                                    </PrimaryButton>
                                    <TextInput
                                      id={`timeline-inline-fade-${item.id}`}
                                      label="Fade timestamp"
                                      value={recvFadeTs}
                                      inputClassName={TIMELINE_DESKTOP_INPUT_CLASS}
                                      labelClassName={TIMELINE_DESKTOP_LABEL_CLASS}
                                      onChange={(value) =>
                                        patchReceptionTimelineInlineDraft(item.id, { fadeOutTimestamp: value }, timelineRow ?? null)
                                      }
                                      placeholder="e.g. 1:20"
                                      disabled={!canEditTimeline}
                                    />
                                  </div>
                                </div>
                              </details>
                              <div className={TIMELINE_CARD_EDIT_DONE_ROW_CLASS}>
                                <PrimaryButton
                                  type="button"
                                  onClick={() => closeReceptionTimelineCardExpanded()}
                                  className={TIMELINE_CARD_EDIT_DONE_BTN_CLASS}
                                >
                                  Done
                                </PrimaryButton>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className={TIMELINE_CARD_FOOTER_CLASS}>
                          <button
                            type="button"
                            draggable={canEditTimeline}
                            title="Press and drag to reorder"
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
                            onTouchStart={(event) => {
                              if (!canEditTimeline || event.touches.length > 1) return;
                              touchDragTimelineSourceRef.current = item.id;
                              setDraggingTimelineId(item.id);
                            }}
                            className={`${TIMELINE_DRAG_HANDLE_CLASS} ${rowExpanded ? TIMELINE_DRAG_HANDLE_EDITING_CLASS : ""} ${isDragging ? "cursor-grabbing border-stone-600 bg-stone-200 shadow-sm ring-2 ring-stone-300/70" : ""}`}
                            disabled={!canEditTimeline}
                            aria-label={`Drag to reorder ${item.title}`}
                          >
                            <TimelineDragGripDots emphasized={isDragging} />
                            <span className="flex flex-col items-start leading-tight sm:items-center">
                              <span>Reorder</span>
                              <span className="text-[10px] font-medium text-stone-500 sm:hidden">
                                Hold &amp; drag
                              </span>
                            </span>
                          </button>
                          <TimelineCardPositionIndicator
                            index={index}
                            total={mergedTimelineItems.length}
                          />
                        </div>
                      </PremiumCard>
                      {timelineInsertAfterId === item.id ? (
                        <div ref={timelineInlineInsertRef} className="-mt-0.5">
                          <PremiumCard
                            variant="accent"
                            className="rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/[0.05] shadow-none ring-1 ring-[#00D4FF]/20"
                          >
                            <SectionTitle className="text-base">New moment</SectionTitle>
                            <p className="mt-1 text-xs text-stone-600">
                              Placed directly after the moment above.
                            </p>
                            <div className="mt-3">
                              <ReceptionTimelineMomentForm
                                idPrefix={`inline-recv-${item.id}`}
                                canEdit={canEditTimeline}
                                anchorLabel={item.title}
                                timelineTime={timelineTime}
                                setTimelineTime={setTimelineTime}
                                timelineTitle={timelineTitle}
                                setTimelineTitle={setTimelineTitle}
                                timelineSongTitle={timelineSongTitle}
                                setTimelineSongTitle={setTimelineSongTitle}
                                timelineArtist={timelineArtist}
                                setTimelineArtist={setTimelineArtist}
                                timelineCategory={timelineCategory}
                                setTimelineCategory={setTimelineCategory}
                                timelineNotes={timelineNotes}
                                setTimelineNotes={setTimelineNotes}
                                timelineNeedsAttention={timelineNeedsAttention}
                                setTimelineNeedsAttention={setTimelineNeedsAttention}
                                composerError={timelineComposerError}
                                setComposerError={setTimelineComposerError}
                                onCancel={cancelReceptionTimelineInlineInsert}
                                onSubmit={addOrUpdateTimelineItem}
                                submitLabel="Add moment"
                              />
                            </div>
                          </PremiumCard>
                        </div>
                      ) : null}
                      </Fragment>
                    )
                  })}
                  {mergedTimelineItems.length >= 1 && mergedTimelineItems.length <= 3 ? (
                    <div className="rounded-xl border border-dashed border-stone-300/80 bg-stone-50/50 px-4 py-3 text-center sm:px-5">
                      <p className="text-[12px] leading-relaxed text-stone-600 md:text-[13px]">
                        Add the next reception moment with{" "}
                        <span className="font-semibold text-stone-800">+ Reception moment</span> above,
                        or use <span className="font-semibold text-stone-800">+ After</span> on any row.
                      </p>
                    </div>
                  ) : null}
                  </>
                )}
              </div>

              {!isCoupleView && (
                <PremiumCard variant="accent">
                  <SectionTitle>Timeline Assistant</SectionTitle>
                  <p className="mt-1 text-xs text-stone-600">
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
          <section className={workspaceSectionClass}>
            <PremiumCard variant="accent">
              <SectionTitle>Timeline Templates</SectionTitle>
              <p className="mt-1 text-xs text-stone-600">
                Apply a preset, save current flow as a custom template, or refine custom templates.
              </p>
              <p className="mt-1 text-[11px] text-stone-600">
                Global defaults: {appSettings.globalTemplateDefaults}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={openCreateTemplateModal}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
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

        {authStage === "app" && appMode === "event" && activeScreen === "Guest Requests" && sectionGuestRequestsEnabled && (
          <section className={workspaceSectionClass}>
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
                    className={`px-2.5 py-1.5 text-[11px] font-semibold shadow-none ${guestRequestView === "admin"
                      ? "border border-black bg-[#00D4FF] text-black"
                      : "bg-transparent text-stone-600 hover:text-stone-900"
                      }`}
                  >
                    Couple / Admin
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={() => setGuestRequestView("guest")}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold shadow-none ${guestRequestView === "guest"
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

                <PremiumCard variant="accent">
                  <SectionTitle>Guest Requests Assistant</SectionTitle>
                  <p className="mt-1 text-xs text-stone-600">
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
                          title="No guest requests yet"
                          description="Share your request link—submitted songs appear here for you to approve or decline."
                          primaryAction={{
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


        {authStage === "app" && appMode === "event" && activeScreen === "Notes" && !isCoupleView && (
          <section className={workspaceSectionClass}>
            <EventHomeNav
              trail={["Event notes"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={
                canEditNotes
                  ? { label: "Add note", onClick: openAddEventNoteModal }
                  : undefined
              }
            />
            {!canEditNotes && (
              <PremiumCard className="border-[#00D4FF]/20 bg-amber-950/10">
                <p className="text-xs font-medium text-amber-950">
                  {effectiveRole} role can view notes, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
            <PremiumCard variant="accent">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <SectionTitle className="text-stone-950">Event Notes</SectionTitle>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    Saved per event in the database. Click Save Note in the modal to persist—nothing
                    auto-saves.
                  </p>
                </div>
                <PrimaryButton
                  onClick={openAddEventNoteModal}
                  disabled={!canEditNotes}
                  className="w-full shrink-0 rounded-xl bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-50 sm:w-auto sm:py-2"
                >
                  Add Note
                </PrimaryButton>
              </div>
              {noteFormStatus && !noteModalOpen && (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${noteFormStatus.kind === "success"
                    ? "border border-emerald-300/80 bg-emerald-50 text-emerald-950"
                    : "border border-rose-300/80 bg-rose-50 text-rose-950"
                    }`}
                >
                  {noteFormStatus.message}
                </p>
              )}
              <div className="mt-3 space-y-2">
                {displayedEventNotes.map((note) => (
                  <div
                    key={`event-note-${note.id}`}
                    className={`rounded-xl border p-3 ${note.isPinned
                      ? "border-cyan-300/80 bg-cyan-50/60"
                      : "border-stone-200 bg-stone-50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                            {note.category || "General"}
                          </span>
                          {note.isPinned ? (
                            <span className="rounded-full border border-cyan-400/80 bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-950">
                              Pinned
                            </span>
                          ) : null}
                        </div>
                        {note.title ? (
                          <p className="mt-2 text-sm font-semibold text-stone-950 [overflow-wrap:anywhere]">
                            {note.title}
                          </p>
                        ) : null}
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-700 [overflow-wrap:anywhere]">
                          {note.body}
                        </p>
                      </div>
                    </div>
                    {canEditNotes ? (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <PrimaryButton
                          type="button"
                          onClick={() => toggleEventNotePinned(note.id)}
                          className="rounded-lg border border-stone-300 bg-white px-2 py-2.5 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:py-2"
                        >
                          {note.isPinned ? "Unpin" : "Pin"}
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => startEditingEventNote(note)}
                          className="rounded-lg border border-stone-300 bg-white px-2 py-2.5 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:py-2"
                        >
                          Edit
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => deleteEventNote(note.id)}
                          className="rounded-lg border border-rose-300/90 bg-rose-50 px-2 py-2.5 text-[11px] font-semibold text-rose-950 hover:bg-rose-100/90 sm:py-2"
                        >
                          Delete
                        </PrimaryButton>
                      </div>
                    ) : null}
                  </div>
                ))}
                {displayedEventNotes.length === 0 && (
                  <SectionEmptyState
                    wrapWithCard={false}
                    title="No notes yet"
                    description="Capture venue details, reminders, or day-of cues your team should see."
                    primaryAction={
                      canEditNotes
                        ? { label: "Add note", onClick: openAddEventNoteModal }
                        : undefined
                    }
                  />
                )}
              </div>
            </PremiumCard>
            <PremiumCard className={premiumFormSectionCardClass}>
              <SectionTitle className="text-stone-950">Planner scratchpad</SectionTitle>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                Quick local lines (not saved to EventNote yet). Use Event Notes above for persisted
                records.
              </p>
              <div className="mt-4 space-y-4">
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

        {authStage === "app" && appMode === "event" && activeScreen === "Event Team" && (
          <section
            className={`${workspaceSectionClass} overflow-x-hidden`}
          >
            <EventHomeNav
              trail={["Event Team"]}
              onBack={() => setActiveScreen("Dashboard")}
              primaryAction={
                canManageEventTeamPartners
                  ? {
                      label: isCoupleView ? "Add vendor / contact" : "Add team member",
                      onClick: openAddTeamMemberModal,
                    }
                  : canInviteCollaborators
                    ? { label: "Invite to app", onClick: () => setInviteModalOpen(true) }
                    : undefined
              }
            />
            <PremiumCard variant="accent">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <SectionTitle>Event Team</SectionTitle>
                <PersistEcho persistFeedback={persistFeedback} variant="light" className="pt-0.5" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {isCoupleView
                  ? "Add photographers, caterers, officiants, venues, planners, and other partners here—the same list your Cutmaster team uses on event day."
                  : "People helping with your event—internal Cutmaster staff, external partners, and who can open this plan in the app."}
              </p>
              {vendorStatus && (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${vendorStatus.kind === "success"
                    ? "border border-emerald-500/40 bg-emerald-950/35 text-emerald-50"
                    : "border border-rose-500/40 bg-rose-950/35 text-rose-50"
                    }`}
                >
                  {vendorStatus.message}
                </p>
              )}
            </PremiumCard>

            <PremiumCard variant="accent">
              <SectionTitle>App access</SectionTitle>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Who can sign in to this event in Cutmaster Planning. Invites are simulated locally in this prototype.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-stone-200 bg-stone-50/95 px-3 py-2.5 text-stone-700">
                  Active:{" "}
                  <span className="font-semibold tabular-nums text-stone-950">{acceptedCollaborators.length}</span>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50/95 px-3 py-2.5 text-stone-700">
                  Pending invite:{" "}
                  <span className="font-semibold tabular-nums text-stone-950">{pendingCollaborators.length}</span>
                </div>
              </div>
              {canInviteCollaborators && (
                <div className="mt-3">
                  <PrimaryButton
                    onClick={() => setInviteModalOpen(true)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:w-auto"
                  >
                    Invite to app
                  </PrimaryButton>
                </div>
              )}
            </PremiumCard>

            <PremiumCard>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <SectionTitle className="text-stone-950">Team Members</SectionTitle>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    {isCoupleView
                      ? "Vendors and day-of contacts (photo, video, catering, venue, planner, etc.)—same cards as your Cutmaster team. Saved to this event when you tap Save."
                      : "Internal Cutmaster staff plus external partners (venue, photo, catering, entertainment, etc.). Saved per event."}
                  </p>
                </div>
                {canManageEventTeamPartners ? (
                  <PrimaryButton
                    onClick={openAddTeamMemberModal}
                    className="w-full shrink-0 rounded-xl bg-[#00D4FF] px-3 py-2.5 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 sm:w-auto sm:py-2"
                  >
                    {isCoupleView ? "Add vendor / contact" : "Add team member"}
                  </PrimaryButton>
                ) : null}
              </div>
              {teamFormStatus && (
                <p
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${teamFormStatus.kind === "success"
                    ? "border border-emerald-300/80 bg-emerald-50 text-emerald-950"
                    : "border border-rose-300/80 bg-rose-50 text-rose-950"
                    }`}
                >
                  {teamFormStatus.message}
                </p>
              )}
              <div className="mt-3 space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={`event-team-member-${member.id}`}
                    className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-950 [overflow-wrap:anywhere]">
                          {member.name}
                          {member.company ? (
                            <span className="ml-1 font-normal text-stone-600">
                              · {member.company}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-stone-600 [overflow-wrap:anywhere]">
                          <span className="font-medium text-stone-800">
                            {teamMemberRoleLabel(member.role)}
                          </span>
                          {member.email ? (
                            <>
                              {" · "}
                              <span className="break-all">{member.email}</span>
                            </>
                          ) : null}
                          {member.phone ? (
                            <>
                              {" · "}
                              <span>{member.phone}</span>
                            </>
                          ) : null}
                        </p>
                        {(member.website || member.instagram || member.arrivalTime) && (
                          <p className="mt-1 text-[11px] leading-relaxed text-stone-600 [overflow-wrap:anywhere]">
                            {member.website ? (
                              <span className="break-all">Web: {member.website}</span>
                            ) : null}
                            {member.website && (member.instagram || member.arrivalTime) ? " · " : null}
                            {member.instagram ? (
                              <span className="break-all">Social: {member.instagram}</span>
                            ) : null}
                            {member.instagram && member.arrivalTime ? " · " : null}
                            {member.arrivalTime ? (
                              <span>Arrival: {member.arrivalTime}</span>
                            ) : null}
                          </p>
                        )}
                        {member.specialCoordinationNotes && (
                          <p className="mt-1 text-[11px] leading-relaxed text-stone-700 [overflow-wrap:anywhere]">
                            <span className="font-semibold text-stone-800">Coordination:</span>{" "}
                            {member.specialCoordinationNotes}
                          </p>
                        )}
                        {member.notes && (
                          <p className="mt-1 text-xs leading-relaxed text-stone-600 [overflow-wrap:anywhere]">
                            {member.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${member.isActive
                          ? "border border-emerald-300/80 bg-emerald-100 text-emerald-950"
                          : "border border-stone-200 bg-stone-100 text-stone-600"
                          }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {canActorManageEventTeamMember(member, canManageInternalEventTeam) ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <PrimaryButton
                          onClick={() => startEditingTeamMember(member)}
                          className="min-h-11 rounded-lg border border-stone-300 bg-white px-2 py-2.5 text-[11px] font-semibold text-stone-900 shadow-sm hover:bg-stone-50 sm:min-h-0 sm:py-2"
                        >
                          Edit
                        </PrimaryButton>
                        <PrimaryButton
                          onClick={() => deleteTeamMember(member.id)}
                          className="min-h-11 rounded-lg border border-rose-300/90 bg-rose-50 px-2 py-2.5 text-[11px] font-semibold text-rose-950 hover:bg-rose-100/90 sm:min-h-0 sm:py-2"
                        >
                          Remove
                        </PrimaryButton>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                        Managed by your Cutmaster team.
                      </p>
                    )}
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <SectionEmptyState
                    wrapWithCard={false}
                    title="No team members yet"
                    description={
                      isCoupleView
                        ? "Add photographers, caterers, your planner, and other day-of contacts in one list."
                        : "Add internal staff and external partners—venue, photo, catering, and entertainment."
                    }
                    primaryAction={
                      canManageEventTeamPartners
                        ? {
                            label: isCoupleView ? "Add vendor / contact" : "Add team member",
                            onClick: openAddTeamMemberModal,
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            </PremiumCard>

            {(activeEvent?.collaborators ?? []).map((collab) => (
              <PremiumCard
                key={collab.id}
                className="border-stone-200 bg-white p-4 shadow-sm ring-1 ring-stone-200/80 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-snug text-stone-950 [overflow-wrap:anywhere]">
                      {collab.name}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-stone-700 [overflow-wrap:anywhere]">
                      {collab.email}
                    </p>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-stone-600">
                      <span className="font-semibold text-stone-800">Permissions · </span>
                      {collaboratorAccessPermissionLine(collab.role)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(collab.role)}`}
                      >
                        Access: {collab.role}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${collab.status === "Accepted"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                          : "border-violet-300 bg-violet-50 text-violet-950"
                          }`}
                      >
                        {collab.status === "Accepted" ? "Can open app" : "Invite pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-stone-100 pt-4 sm:grid-cols-2 sm:items-end">
                  <div>
                    <label htmlFor={`collab-role-${collab.id}`} className={lightUiFormLabelClass}>
                      Access level
                    </label>
                    <select
                      id={`collab-role-${collab.id}`}
                      value={collab.role}
                      onChange={(event) =>
                        updateCollaboratorsForActiveEvent((current) =>
                          current.map((c) =>
                            c.id === collab.id ? { ...c, role: event.target.value as UserRole } : c,
                          ),
                        )
                      }
                      className={lightUiSelectClass}
                    >
                      {(["Couple", "DJ", "Planner", "Admin"] as UserRole[]).map((role) => (
                        <option key={`${collab.id}-${role}`} value={role} className="bg-white text-stone-900">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <PrimaryButton
                    onClick={() =>
                      updateCollaboratorsForActiveEvent((current) =>
                        current.map((c) =>
                          c.id === collab.id ? { ...c, status: c.status === "Pending" ? "Accepted" : "Pending" } : c,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-semibold text-stone-900 shadow-none hover:border-stone-400 hover:bg-stone-50 sm:w-auto sm:min-w-[8.5rem]"
                  >
                    {collab.status === "Pending" ? "Simulate accept" : "Mark pending"}
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
                    className="sm:col-span-2 w-full rounded-xl border border-rose-400 bg-white px-3 py-2.5 text-xs font-semibold text-rose-900 shadow-none hover:bg-rose-50 disabled:opacity-45"
                  >
                    Remove from event
                  </PrimaryButton>
                </div>
              </PremiumCard>
            ))}

            <PremiumCard className="border-stone-200 bg-white shadow-sm ring-1 ring-stone-200/80">
              <SectionTitle className="text-stone-950">How access levels work</SectionTitle>
              <p className={lightUiSectionCaptionClass}>
                Same roles your team already uses—shown here so couples know what each access level means.
              </p>
              <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-stone-700">
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <span className="font-semibold text-stone-900">Couple · </span>
                  Edit planning, music, and guest requests.
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <span className="font-semibold text-stone-900">DJ · </span>
                  Edit timeline, music, and day-of prep views.
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <span className="font-semibold text-stone-900">Planner · </span>
                  Edit timeline, notes, and vendor-facing areas.
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <span className="font-semibold text-stone-900">Admin · </span>
                  Full access (internal).
                </div>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Event Prep" && (
          <section
            className={`${workspaceSectionClass} overflow-x-hidden print-doc`}
          >
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
                    <p className="mt-1 text-[11px] leading-snug text-stone-600 sm:text-stone-600">
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">Music sections</p>
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">
                      Event team on document
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
                          {eventSettings.liveEventShowVendorContacts ? "Event team on" : "Event team off"}
                        </PrimaryButton>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">Scripts / notes</p>
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">Packet layout</p>
                    <p className="mt-0.5 text-[11px] text-stone-600">Screen preview and printed pages.</p>
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

                  <div className="border-t border-stone-200 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">Export</p>
                    <p className="mt-0.5 text-[11px] text-stone-600">
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
                        className="min-h-11 w-full border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-100 sm:w-auto"
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
                    <div className="doc-section print-break-avoid">
                      <p className="doc-section-phase">Phase 1</p>
                      <h3>Ceremony Timeline</h3>
                      <table className="doc-table">
                        <tbody>
                          <tr><th>Ceremony Start</th><td>{ceremonyStartTime || "TBD"}</td><th>Guest Arrival</th><td>{ceremonyGuestArrivalTime || "TBD"}</td></tr>
                          <tr><th>Location</th><td>{eventSettings.ceremonyLocation || eventSettings.venue || weddingDetails.venue || "TBD"}</td><th>Officiant</th><td>{officiantName || "TBD"}</td></tr>
                          <tr><th>Microphone Needs</th><td>{microphoneNeeds || "None"}</td><th>Ceremony Notes</th><td>{ceremonyNotes || "None"}</td></tr>
                        </tbody>
                      </table>
                      <div className="doc-table-scroll -mx-1 max-w-[100vw] print:!overflow-visible sm:mx-0">
                        <table className="doc-table live-event-timeline-table mt-2 min-w-[520px] sm:min-w-0">
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
                    <div className="doc-section live-reception-page-break print-break-avoid">
                      <p className="doc-section-phase">{sectionCeremonyEnabled ? "Phase 2" : "Phase 1"}</p>
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
                    {musicGenreEraSelections.length > 0 ? (
                      <p className="mb-2">
                        <span className="font-medium text-zinc-700 print:text-black">Genre / era picks: </span>
                        {musicGenreEraSelections.join(", ")}
                      </p>
                    ) : null}
                    {musicTasteProfileHasSelections(musicTasteProfile) ? (
                      <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3 print:border-black print:bg-white">
                        <p className="doc-note mb-2 font-medium text-zinc-700 print:text-black">
                          Music taste profile
                        </p>
                        {musicTasteProfile.danceFloorStyles.length > 0 ? (
                          <p className="mb-1.5 text-sm text-zinc-800 print:text-black">
                            <span className="font-medium text-zinc-700 print:text-black">Dance floor: </span>
                            {musicTasteProfile.danceFloorStyles.join(", ")}
                          </p>
                        ) : null}
                        {musicTasteProfile.crowdPreferences.length > 0 ? (
                          <p className="mb-1.5 text-sm text-zinc-800 print:text-black">
                            <span className="font-medium text-zinc-700 print:text-black">Crowd: </span>
                            {musicTasteProfile.crowdPreferences.join(", ")}
                          </p>
                        ) : null}
                        {musicTasteProfile.musicBehavior.length > 0 ? (
                          <p className="mb-1.5 text-sm text-zinc-800 print:text-black">
                            <span className="font-medium text-zinc-700 print:text-black">Behavior: </span>
                            {musicTasteProfile.musicBehavior.join(", ")}
                          </p>
                        ) : null}
                        {(musicTasteProfile.danceFloorVibeNotes ?? "").trim() ? (
                          <p className="mt-2 text-sm text-zinc-800 print:text-black">
                            <span className="font-medium text-zinc-700 print:text-black">Ideal dance floor vibe: </span>
                            {musicTasteProfile.danceFloorVibeNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {(musicVibeDetail.genres ?? "").trim() ? (
                      <p className="mb-2">
                        <span className="font-medium text-zinc-700 print:text-black">Extra genre notes: </span>
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
                    {musicPlaylistLinks.length > 0 ? (
                      <>
                        <p className="doc-note mb-2 mt-4 font-medium text-zinc-700 print:text-black">
                          Client playlist links
                        </p>
                        <table className="doc-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Label</th>
                              <th>URL</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {musicPlaylistLinks.map((link, index) => (
                              <tr key={`doc-plink-${link.id}`}>
                                <td>{index + 1}</td>
                                <td>{link.label?.trim() || "—"}</td>
                                <td className="max-w-[40%] break-all">{link.url}</td>
                                <td>{link.notes?.trim() || ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
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
                          {song.highPriority ? " (Priority block)" : ""}
                          {song.notes ? ` — ${song.notes}` : ""}
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
                              <td>
                                {song.title || "-"}
                                {song.highPriority ? " ★" : ""}
                              </td>
                              <td>{song.artist || ""}</td>
                              <td>{song.notes || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {sectionMustPlayEnabled && playIfPossibleSongs.length > 0 ? (
                      <div className="doc-section">
                        <h3>Play If Possible</h3>
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
                            {playIfPossibleSongs.map((song, index) => (
                              <tr key={`playlist-pip-${song.id}`}>
                                <td>{index + 1}</td>
                                <td>{song.title || "-"}</td>
                                <td>{song.artist || ""}</td>
                                <td>{song.notes || ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
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
                      <h3>Event Team</h3>
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
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600 print:text-black">
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
          <section className={workspaceSectionClass}>
            <EventHomeNav trail={["Event Settings"]} onBack={() => setActiveScreen("Dashboard")} />
            <input
              ref={eventCoverPhotoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={handleEventCoverPhotoChange}
            />
            <PremiumCard>
              <SectionTitle className="text-stone-950">Visual identity & cover photo</SectionTitle>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Preview a cover on the home hero for this session. Permanent cloud upload (e.g. Supabase Storage) is
                coming soon—refreshing the browser restores the default placeholder until then.
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
                <div className="relative aspect-[21/9] min-h-[140px] w-full sm:min-h-[160px]">
                  <EventHeroCover
                    coverPhotoDataUrl={eventSettings.coverPhotoDataUrl}
                    showPersonalizeGuidance={false}
                  />
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
                  onClick={openEventCoverPhotoPicker}
                  className={`${lightUiSecondaryButtonClass} font-semibold`}
                >
                  {eventSettings.coverPhotoDataUrl ? "Change Cover Photo" : "Add Cover Photo"}
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
                Track where this booked event is in planning and execution. Archived events stay in your database but
                are hidden from the default All Events list.
              </p>
              <div className="relative z-10 isolate mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${eventStatusPillClassOnLight(
                    activeEventStatus,
                  )}`}
                >
                  {activeEventStatus}
                </span>
              </div>
              <div className="relative z-10 isolate mt-3">
                <label htmlFor="event-status" className={lightUiFormLabelClass}>
                  Status
                </label>
                <select
                  id="event-status"
                  value={activeEventStatus}
                  disabled={!canEditEventStatus}
                  onChange={(e) => void applyEventStatus(e.target.value as EventStatus)}
                  className={lightUiSelectClass}
                >
                  {EVENT_STATUSES.map((status) => (
                    <option key={status} value={status} className="bg-white text-stone-900">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              {!canEditEventStatus ? (
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
                <div className="relative z-10 isolate">
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
                    { key: "sectionVendorContactsEnabled", label: "Event team contacts" },
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
                        className={`w-full ${enabled
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
                <div className="relative z-10 isolate">
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
                <div className="relative z-10 isolate">
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
                {!isCoupleView ? (
                  <TextArea
                    id="event-settings-client-notes"
                    label="Client-facing Notes"
                    value={eventSettings.clientFacingNotes}
                    onChange={(value) =>
                      setEventSettings((prev) => ({ ...prev, clientFacingNotes: value }))
                    }
                    rows={3}
                  />
                ) : null}
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
                  App access and day-of contacts are managed together under Event Team.
                </div>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Planning Checklist" && sectionPlanningChecklistEnabled && (
          <section className={workspaceSectionClass}>
            <EventHomeNav trail={["Planning Checklist"]} onBack={() => setActiveScreen("Dashboard")} />
            <PremiumCard variant="accent">
              <div className="flex items-center justify-between">
                <SectionTitle>Planning Checklist</SectionTitle>
                <span className="rounded-full bg-[#00D4FF]/20 px-2.5 py-1 text-xs font-semibold text-stone-900">
                  {completionPercent}% complete
                </span>
              </div>
              <p className="mt-2 text-xs text-stone-600">
                Track major planning milestones and jump directly to the linked section.
              </p>
            </PremiumCard>

            {planningChecklist.map((task) => (
              <PremiumCard key={`task-${task.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SectionTitle className="text-stone-950">{task.title}</SectionTitle>
                    <p className="mt-1 text-xs text-stone-600">{task.description}</p>
                    {shouldShowPlanningChecklistMissingNotes(task.status, task.missingNotes) ? (
                      <PlanningChecklistMissingNotesBlock notes={task.missingNotes} />
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${task.status === "Complete"
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
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                      Recommended due date
                    </p>
                    {canEditChecklistDueTiming ? (
                      <div className="mt-1">
                        {task.dueDateSource === "event" ? (
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-stone-500">Event override</p>
                            <button
                              type="button"
                              onClick={() =>
                                setEventSettings((prev) => {
                                  const nextDueDates = { ...(prev.checklistDueDates ?? {}) };
                                  delete nextDueDates[task.id];
                                  return { ...prev, checklistDueDates: nextDueDates };
                                })
                              }
                              className="text-[11px] font-semibold text-stone-700 hover:text-stone-950 hover:underline"
                            >
                              Reset to default
                            </button>
                          </div>
                        ) : (
                          <p className="mb-1.5 text-[11px] text-stone-500">
                            {task.dueDateSource === "global"
                              ? "Using global default"
                              : "Using built-in default"}
                          </p>
                        )}
                        <ChecklistDueDateFields
                          idPrefix={`task-due-${task.id}`}
                          value={
                            eventSettings.checklistDueDates?.[task.id] ??
                            task.dueDateConfig ?? { type: "relative", offsetDays: -14 }
                          }
                          onChange={(next) =>
                            setEventSettings((prev) => ({
                              ...prev,
                              checklistDueDates: {
                                ...(prev.checklistDueDates ?? {}),
                                [task.id]: next,
                              },
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <p className="mt-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800">
                        {task.dueDateLabel}
                      </p>
                    )}
                  </div>
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
            <section className={workspaceSectionLooseClass}>
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
              <PremiumCard variant="accent" className={premiumFormSectionCardClass}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <SectionTitle>Planning Questions</SectionTitle>
                  <PersistEcho persistFeedback={persistFeedback} className="pt-0.5" />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-stone-600">
                  Prompts match your event type and are grouped by topic. Expand a section to answer or edit—responses save with this event and can surface in the Event Document when that block is turned on.
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
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
                  cardClassName="border-dashed border-stone-300 bg-stone-50/80"
                />
              ) : (
                <div id="planning-questions-anchor" className="space-y-5">
                  {planningQuestionsGroupedBySection.map((row) => {
                    const pct = computePlanningQuestionGroupCompletion(
                      row.questions,
                      eventSettings.planningQuestionAnswers,
                    );
                    const isExpanded = expandedPlanningQuestionGroups[row.group.id] ?? true;
                    return (
                      <PremiumCard key={`pq-group-${row.group.id}`} className={premiumFormSectionCardClass}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 rounded-lg px-0.5 py-2.5 text-left transition hover:bg-stone-50 sm:items-center sm:justify-between sm:py-3"
                          onClick={() =>
                            setExpandedPlanningQuestionGroups((p) => ({
                              ...p,
                              [row.group.id]: !(p[row.group.id] ?? true),
                            }))
                          }
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-base font-semibold leading-snug text-stone-950">{row.group.label}</p>
                            <p className="text-[11px] font-medium leading-relaxed text-stone-600">
                              {pct}% answered · {row.questions.length}{" "}
                              {row.questions.length === 1 ? "question" : "questions"}
                            </p>
                            <div className="mt-3 h-1.5 max-w-full overflow-hidden rounded-full bg-stone-200 sm:max-w-xs">
                              <div
                                className="h-full rounded-full bg-[var(--cm-accent)]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <span className="shrink-0 pt-0.5 font-mono text-sm text-stone-500" aria-hidden>
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        </button>
                        {isExpanded ? (
                          <div className="mt-6 border-t border-stone-200 pt-6">
                            <div className="grid gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-5">
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
          <section className={workspaceSectionClass}>
            <PremiumCard variant="accent">
              <div className="flex items-center justify-between">
                <SectionTitle>Notification Center</SectionTitle>
                <span className="rounded-full bg-[#00D4FF]/20 px-2.5 py-1 text-xs font-semibold text-stone-900">
                  {unreadBadgeCount} unread
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="activity-event-filter" className={lightUiFormLabelClass}>
                    Filter Event
                  </label>
                  <select
                    id="activity-event-filter"
                    value={activityEventFilter}
                    onChange={(event) => setActivityEventFilter(event.target.value)}
                    className={lightUiSelectClass}
                  >
                    <option value="all" className="bg-white text-stone-900">
                      All Events
                    </option>
                    {events.map((evt) => (
                      <option key={`flt-evt-${evt.id}`} value={evt.id} className="bg-white text-stone-900">
                        {evt.settings?.eventName || evt.meta.couple || "Event"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="activity-type-filter" className={lightUiFormLabelClass}>
                    Filter Type
                  </label>
                  <select
                    id="activity-type-filter"
                    value={activityTypeFilter}
                    onChange={(event) => setActivityTypeFilter(event.target.value)}
                    className={lightUiSelectClass}
                  >
                    <option value="all" className="bg-white text-stone-900">
                      All Types
                    </option>
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
                      <option key={`flt-type-${type}`} value={type} className="bg-white text-stone-900">
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </PremiumCard>

            {notifications.slice(0, 3).map((notice) => (
              <PremiumCard key={`notice-${notice.id}`} className="border-[#00D4FF]/20">
                <p className="text-sm text-stone-900">
                  <span className="mr-1">{activityTypeIcon(notice.type)}</span>
                  {notice.summary}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {notice.eventName} · {formatRelativeTime(notice.timestamp)}
                </p>
              </PremiumCard>
            ))}

            {filteredActivities.map((item) => (
              <PremiumCard key={`activity-${item.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-stone-900">
                    <span className="mr-1">{activityTypeIcon(item.type)}</span>
                    {item.summary}
                  </p>
                  {item.unread && (
                    <span className="rounded-full bg-[#00D4FF]/20 px-2 py-1 text-[10px] font-semibold text-stone-900">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  {item.userRole} · {item.eventName} · {formatRelativeTime(item.timestamp)}
                </p>
              </PremiumCard>
            ))}
            {filteredActivities.length === 0 && (
              <PremiumCard>
                <p className="text-xs text-stone-600">
                  No activity matches the current filters. Try broadening event or type selection.
                </p>
              </PremiumCard>
            )}
          </section>
        )}
      </main>

      <GrandEntranceDetailSheet
        open={grandEntranceDetailEditor != null}
        title={grandEntranceDetailEditor?.title ?? "Grand Entrance"}
        subline={grandEntranceDetailEditor?.subline}
        songLabel={grandEntranceDetailEditor?.songLabel}
        savedDraft={grandEntranceDetailSavedDraft}
        draft={grandEntranceDetailDraft}
        onChange={(patch) => setGrandEntranceDetailDraft((prev) => ({ ...prev, ...patch }))}
        onDone={doneGrandEntranceDetail}
        onCancel={closeGrandEntranceDetailEditor}
        canEditDetail={canEditTimeline}
        canEditSideNote={canAccessRunOfShow}
      />

      {authStage === "app" && quickActions.length > 0 && (
        <>
          <div
            onClick={() => setQuickActionsOpen(false)}
            className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 lg:hidden ${quickActionsOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
              }`}
          />
          <div className="fixed bottom-24 right-4 z-50 flex w-[calc(100%-2rem)] max-w-[260px] flex-col items-end gap-2 lg:hidden">
            <div
              className={`w-full space-y-2 transition-all duration-200 ${quickActionsOpen
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
              className={`rounded-2xl border border-[#00D4FF]/35 bg-[#00D4FF] px-4 text-sm font-semibold text-black shadow-[0_10px_28px_rgba(143,107,47,0.35)] transition-transform ${quickActionsOpen ? "rotate-45" : ""
                }`}
            >
              +
            </PrimaryButton>
          </div>
        </>
      )}

      {noteModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:items-stretch lg:justify-end lg:p-5 lg:pt-5 lg:pb-5"
          role="dialog"
          aria-modal="true"
          aria-label={noteEditingId ? "Edit event note" : "Add event note"}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveEventNote();
            }}
            className="flex w-full max-w-md max-h-[min(92vh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/98 shadow-2xl shadow-stone-900/12 lg:h-full lg:max-h-none lg:max-w-lg lg:rounded-3xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
              <SectionTitle className="text-stone-950">
                {noteEditingId ? "Edit Note" : "Add Note"}
              </SectionTitle>
              <PrimaryButton
                type="button"
                onClick={closeEventNoteModal}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
              >
                Close
              </PrimaryButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="space-y-3">
                <div>
                  <label htmlFor="event-note-category" className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-600">
                    Category
                  </label>
                  <select
                    id="event-note-category"
                    value={noteCategoryDraft}
                    disabled={!canEditNotes}
                    onChange={(event) => setNoteCategoryDraft(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900 shadow-sm transition focus:border-cyan-500/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
                  >
                    {EVENT_NOTE_CATEGORIES.map((category) => (
                      <option key={`note-cat-${category}`} value={category} className="bg-white text-stone-900">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <TextInput
                  id="event-note-title"
                  label="Title (optional)"
                  value={noteTitleDraft}
                  onChange={setNoteTitleDraft}
                  disabled={!canEditNotes}
                />
                <TextArea
                  id="event-note-body"
                  label="Note"
                  value={noteBodyDraft}
                  onChange={setNoteBodyDraft}
                  rows={6}
                  disabled={!canEditNotes}
                  placeholder="Write the note body…"
                />
                <PrimaryButton
                  type="button"
                  onClick={() => setNotePinnedDraft((prev) => !prev)}
                  disabled={!canEditNotes}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold ${notePinnedDraft
                    ? "border-cyan-400/90 bg-cyan-50 text-cyan-950 shadow-sm hover:bg-cyan-100/80"
                    : "border-stone-300 bg-stone-50 text-stone-700 shadow-sm hover:bg-stone-100"
                    }`}
                >
                  {notePinnedDraft ? "Pinned to top" : "Not pinned"}
                </PrimaryButton>
                {noteFormStatus && (
                  <p
                    className={`rounded-xl px-3 py-2 text-xs ${noteFormStatus.kind === "success"
                      ? "border border-emerald-300/80 bg-emerald-50 text-emerald-950"
                      : "border border-rose-300/80 bg-rose-50 text-rose-950"
                      }`}
                  >
                    {noteFormStatus.message}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 border-t border-stone-200 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(28,25,23,0.12)] lg:pb-3">
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton
                  type="button"
                  onClick={closeEventNoteModal}
                  disabled={noteSaving}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50 disabled:opacity-60"
                >
                  Cancel
                </PrimaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={!canEditNotes || noteSaving}
                  className="rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-60"
                >
                  {noteSaving ? "Saving…" : noteEditingId ? "Save Changes" : "Save Note"}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </div>
      )}

      {teamModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:items-stretch lg:justify-end lg:p-5 lg:pt-5 lg:pb-5"
          role="dialog"
          aria-modal="true"
          aria-label={
            teamEditingId
              ? isCoupleView
                ? "Edit vendor or contact"
                : "Edit team member"
              : isCoupleView
                ? "Add vendor or contact"
                : "Add team member"
          }
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              console.log("REAL SAVE FORM SUBMIT");
              void saveTeamMember();
            }}
            className="flex w-full max-w-md max-h-[min(92vh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/98 shadow-2xl shadow-stone-900/12 lg:h-full lg:max-h-none lg:max-w-lg lg:rounded-3xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
              <SectionTitle className="text-stone-950">
                {teamEditingId
                  ? isCoupleView
                    ? "Edit vendor / contact"
                    : "Edit team member"
                  : isCoupleView
                    ? "Add vendor / contact"
                    : "Add team member"}
              </SectionTitle>
              <PrimaryButton
                type="button"
                onClick={closeTeamMemberModal}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
              >
                Close
              </PrimaryButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="space-y-3">
                <div>
                  <label htmlFor="team-member-role" className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-600">
                    {isCoupleView ? "Vendor type" : "Role"}
                  </label>
                  <select
                    id="team-member-role"
                    value={teamRoleDraft}
                    disabled={!canSaveTeamModal}
                    onChange={(event) =>
                      setTeamRoleDraft(event.target.value as TeamMemberRole)
                    }
                    className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900 shadow-sm transition focus:border-cyan-500/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
                  >
                    {eventTeamRoleGroupsForModal.map((group) => (
                      <optgroup key={`team-role-group-${group.label}`} label={group.label}>
                        {group.roles.map((role) => (
                          <option
                            key={`team-role-${role}`}
                            value={role}
                            className="bg-white text-stone-900"
                          >
                            {teamMemberRoleLabel(role)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] leading-snug text-stone-600">
                    {canManageInternalEventTeam
                      ? isInternalTeamRole(teamRoleDraft)
                        ? "Internal Cutmaster staff. Admin/DJ/Planner can also sign in via Invite to app."
                        : "External partner—company, contact info, and day-of notes save to this event."
                      : "Add vendors and day-of contacts your DJ needs. For a wedding planner, choose Planner and enter their company."}
                  </p>
                </div>
                <TextInput
                  id="team-member-name"
                  label={teamModalShowsCompanyField ? "Primary contact name" : "Name"}
                  value={teamNameDraft}
                  onChange={setTeamNameDraft}
                  disabled={!canSaveTeamModal}
                />
                {teamModalShowsCompanyField && (
                  <TextInput
                    id="team-member-company"
                    label="Company / business name"
                    value={teamCompanyDraft}
                    onChange={setTeamCompanyDraft}
                    disabled={!canSaveTeamModal}
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    id="team-member-email"
                    label="Email"
                    value={teamEmailDraft}
                    onChange={setTeamEmailDraft}
                    disabled={!canSaveTeamModal}
                  />
                  <TextInput
                    id="team-member-phone"
                    label="Phone"
                    value={teamPhoneDraft}
                    onChange={setTeamPhoneDraft}
                    disabled={!canSaveTeamModal}
                  />
                </div>
                {teamModalShowsCompanyField && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <TextInput
                        id="team-member-website"
                        label="Website"
                        value={teamWebsiteDraft}
                        onChange={setTeamWebsiteDraft}
                        disabled={!canSaveTeamModal}
                      />
                      <TextInput
                        id="team-member-instagram"
                        label="Instagram"
                        value={teamInstagramDraft}
                        onChange={setTeamInstagramDraft}
                        disabled={!canSaveTeamModal}
                      />
                    </div>
                    <TextInput
                      id="team-member-arrival"
                      label="Arrival / load-in time"
                      value={teamArrivalDraft}
                      onChange={setTeamArrivalDraft}
                      disabled={!canSaveTeamModal}
                    />
                    <TextArea
                      id="team-member-coordination"
                      label="Special coordination notes"
                      value={teamCoordinationDraft}
                      onChange={setTeamCoordinationDraft}
                      rows={2}
                      disabled={!canSaveTeamModal}
                    />
                  </>
                )}
                <TextArea
                  id="team-member-notes"
                  label="Notes"
                  value={teamNotesDraft}
                  onChange={setTeamNotesDraft}
                  rows={3}
                  disabled={!canSaveTeamModal}
                />
                <PrimaryButton
                  type="button"
                  onClick={() => setTeamActiveDraft((prev) => !prev)}
                  disabled={!canSaveTeamModal}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold ${teamActiveDraft
                    ? "border-emerald-300/90 bg-emerald-50 text-emerald-950 shadow-sm hover:bg-emerald-100/80"
                    : "border-stone-300 bg-stone-50 text-stone-700 shadow-sm hover:bg-stone-100"
                    }`}
                >
                  {teamActiveDraft ? "Active on this event" : "Inactive on this event"}
                </PrimaryButton>
                {teamFormStatus && (
                  <p
                    className={`rounded-xl px-3 py-2 text-xs ${teamFormStatus.kind === "success"
                      ? "border border-emerald-300/80 bg-emerald-50 text-emerald-950"
                      : "border border-rose-300/80 bg-rose-50 text-rose-950"
                      }`}
                  >
                    {teamFormStatus.message}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 border-t border-stone-200 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(28,25,23,0.12)] lg:pb-3">
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton
                  type="button"
                  onClick={closeTeamMemberModal}
                  disabled={teamSaving}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50 disabled:opacity-60"
                >
                  Cancel
                </PrimaryButton>
                <PrimaryButton
                  type="submit"
                  onClick={() => {
                    console.log("REAL SAVE BUTTON CLICKED");
                  }}
                  disabled={!canSaveTeamModal || teamSaving}
                  className="rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-stone-950 shadow-sm hover:brightness-105 disabled:opacity-60"
                >
                  {teamSaving
                    ? "Saving…"
                    : teamEditingId
                      ? "Save Changes"
                      : isCoupleView
                        ? "Save Contact"
                        : "Save Team Member"}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </div>
      )}

      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-stone-950">Invite to app</SectionTitle>
              <PrimaryButton
                onClick={() => setInviteModalOpen(false)}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
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
                <label htmlFor="invite-role" className={lightUiFormLabelClass}>
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as UserRole)}
                  className={lightUiSelectClass}
                >
                  {(["Couple", "DJ", "Planner", "Admin"] as UserRole[]).map((role) => (
                    <option key={`invite-${role}`} value={role} className="bg-white text-stone-900">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
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
                className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
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
              <p className="text-xs text-stone-600">
                Saves current reception timeline and planning suggestions.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <PrimaryButton
                onClick={() => {
                  setTemplateModalOpen(false);
                  setTemplateEditingId(null);
                }}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
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
        <EventModal
          title={eventModalMode === "new" ? "Create Event" : "Edit Event"}
          onClose={() => {
            setEventModalOpen(false);
            setEventEditingId(null);
            setEventModalStatus(null);
          }}
        >
          <EventModalForm
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveEventModal();

            }}
          >
            <EventModalBody>
            <EventModalContent>
            <EventBasicDetailsFields
              eventName={eventDraft.eventName}
              coupleNames={eventDraft.coupleNames}
              weddingDate={eventDraft.weddingDate}
              venue={eventDraft.venue}
              packageName={eventDraft.packageName}
              primaryPartyLabel={PRIMARY_PARTY_FIELD_LABEL[eventDraft.eventLayoutProfile]}
              dateLabel={
                eventDraft.eventLayoutProfile === "Wedding" ||
                  eventDraft.eventLayoutProfile === "Gender-Neutral Wedding"
                  ? "Wedding Date"
                  : "Event Date"
              }
              onEventNameChange={(value) =>
                setEventDraft((prev) => ({ ...prev, eventName: value }))
              }
              onCoupleNamesChange={(value) =>
                setEventDraft((prev) => ({ ...prev, coupleNames: value }))
              }
              onWeddingDateChange={(value) =>
                setEventDraft((prev) => ({ ...prev, weddingDate: value }))
              }
              onVenueChange={(value) =>
                setEventDraft((prev) => ({ ...prev, venue: value }))
              }
              onPackageNameChange={(value) =>
                setEventDraft((prev) => ({ ...prev, packageName: value }))
              }
              TextInputComponent={TextInput}
            />



            <EventTypeSection>
              <label htmlFor="event-type" className={lightUiFormLabelClass}>
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
                className={lightUiSelectClass}
              >
                {EVENT_TYPES.map((profile) => (
                  <option key={`draft-layout-${profile}`} value={profile} className="bg-white text-stone-900">
                    {profile}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-relaxed text-stone-600">
                {LAYOUT_PROFILE_DESCRIPTIONS[eventDraft.eventLayoutProfile]}
              </p>
              <div className="rounded-xl border border-stone-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                  Event Type Preview
                </p>
                <p className="mt-2 text-xs text-stone-700">{EVENT_TYPE_USE_CASE[eventDraft.eventLayoutProfile]}</p>
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-600">Enabled Sections</p>
                  <p className="mt-1 text-xs text-stone-700">
                    {getEnabledLayoutSectionLabels(getLayoutProfileDefaults(eventDraft.eventLayoutProfile)).join(" · ")}
                  </p>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-600">
                    Default Planning Questions
                  </p>
                  <p className="mt-1 text-xs text-stone-700">
                    {getPlanningQuestionsForProfile(eventDraft.eventLayoutProfile)
                      .map((q) => q.label)
                      .slice(0, 4)
                      .join(" · ")}
                  </p>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-600">
                    Event Document Default Sections
                  </p>
                  <p className="mt-1 text-xs text-stone-700">
                    {getDefaultLiveEventSectionLabels(eventDraft.eventLayoutProfile).join(" · ")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-600">
                  Sections enabled by default
                </p>
                <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-stone-700 sm:grid-cols-2">
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
            </EventTypeSection>

            <EventLocationsFields
              ceremonyLocation={eventDraft.ceremonyLocation}
              receptionLocation={eventDraft.receptionLocation}
              onCeremonyLocationChange={(value) =>
                setEventDraft((prev) => ({
                  ...prev,
                  ceremonyLocation: value,
                }))
              }
              onReceptionLocationChange={(value) =>
                setEventDraft((prev) => ({
                  ...prev,
                  receptionLocation: value,
                }))
              }
              TextInputComponent={TextInput}
            />
            <EventAssignedDjField
              value={eventDraft.assignedDj}
              onChange={(value) =>
                setEventDraft((prev) => ({ ...prev, assignedDj: value }))
              }
              teamMembers={activeDjTeamMembers}
              labelClassName={lightUiFormLabelClass}
              selectClassName={lightUiSelectClass}
            />

            <EventPlannerFields
              plannerName={eventDraft.plannerName}
              plannerEmail={eventDraft.plannerEmail}
              onPlannerNameChange={(value) =>
                setEventDraft((prev) => ({ ...prev, plannerName: value }))
              }
              onPlannerEmailChange={(value) =>
                setEventDraft((prev) => ({ ...prev, plannerEmail: value }))
              }
              TextInputComponent={TextInput}
            />
            <EventInternalNotesField
  value={eventDraft.internalNotes}
  onChange={(value) =>
    setEventDraft((prev) => ({ ...prev, internalNotes: value }))
  }
  TextAreaComponent={TextArea}
/>
            <EventModalStatus status={eventModalStatus} />


            <EventModalActions
              mode={eventModalMode}
              onCancel={() => {
                setEventModalOpen(false);
                setEventEditingId(null);
                setEventModalStatus(null);
              }}
            />
          </EventModalContent>
          </EventModalBody>
          </EventModalForm>
        </EventModal>
      )}

      {vendorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-5 sm:pt-5 sm:pb-5">
          <div className="flex w-full max-w-md max-h-[min(92vh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/98 shadow-2xl shadow-stone-900/12 sm:max-h-[min(90vh,calc(100dvh-2rem))] sm:max-w-2xl">
            <div className="shrink-0 border-b border-stone-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle className="text-stone-950">
                  {vendorEditingId ? "Edit day-of contact" : "Add day-of contact"}
                </SectionTitle>
                <PrimaryButton
                  onClick={closeVendorModal}
                  className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
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
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
                <div>
                  <label htmlFor="vendor-type" className={lightUiFormLabelClass}>
                    Role / category
                  </label>
                  <select
                    id="vendor-type"
                    value={vendorTypeDraft}
                    onChange={(event) => setVendorTypeDraft(event.target.value as VendorType)}
                    className={lightUiSelectClass}
                  >
                    {VENDOR_TYPES_ORDERED.map((type) => (
                      <option key={`vendor-type-option-${type}`} value={type} className="bg-white text-stone-900">
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

              <div className="shrink-0 border-t border-stone-200 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(28,25,23,0.12)] sm:pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <PrimaryButton
                    type="button"
                    onClick={closeVendorModal}
                    className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
                  >
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton
                    type="submit"
                    className="rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black hover:brightness-110"
                  >
                    Save team member
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
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-4 px-4 py-4 sm:gap-x-6 sm:px-6 sm:py-4 md:px-8 md:py-5 lg:px-10">
                <div className="min-w-0 flex-1 basis-full pr-0 sm:basis-[min(100%,32rem)] sm:pr-2 md:max-w-[min(100%,44rem)] lg:max-w-[min(100%,48rem)]">
                  <h2 className="text-[1.5rem] font-semibold leading-[1.15] tracking-tight text-stone-950 sm:text-[1.75rem] md:text-[2.125rem] lg:text-[2.375rem]">
                    {runOfShowHeadline}
                  </h2>
                  <p className="mt-2 max-w-3xl text-[13px] font-medium leading-snug text-stone-600 sm:text-sm md:text-[15px]">
                    {runOfShowSubline}
                  </p>
                  {runOfShowUpNextMeta.banner === "upNext" ? (
                    <div
                      className="mt-3 max-w-3xl rounded-xl border border-cyan-300/80 bg-gradient-to-r from-cyan-50/95 to-white px-4 py-3 shadow-[inset_3px_0_0_0_var(--cm-cyan)] sm:mt-3.5 md:mt-4 md:px-5 md:py-4"
                      role="status"
                      aria-live="polite"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-900/80 md:text-xs">
                        Up next
                      </p>
                      <p className="mt-1 text-base font-semibold leading-snug text-stone-950 md:text-lg md:leading-tight">
                        {runOfShowUpNextMeta.upNextTitle}
                      </p>
                    </div>
                  ) : runOfShowUpNextMeta.banner === "complete" ? (
                    <p className="mt-3 max-w-3xl rounded-lg border border-emerald-200/90 bg-emerald-50/80 px-4 py-2.5 text-sm font-medium leading-snug text-emerald-950 md:mt-4 md:py-3">
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
                  <div className="flex min-w-0 w-full flex-col gap-2.5 sm:w-auto sm:flex-none sm:items-end">
                    <div className="flex w-full flex-wrap items-stretch justify-end gap-2 sm:flex-nowrap">
                      {typeof document !== "undefined" && document.fullscreenEnabled ? (
                        <PrimaryButton
                          type="button"
                          onClick={() => void toggleRunOfShowFullscreen()}
                          className="min-h-11 flex-1 touch-manipulation rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:flex-none md:min-h-12 md:px-5 md:text-[15px]"
                        >
                          {runOfShowIsFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        </PrimaryButton>
                      ) : null}
                      <PrimaryButton
                        type="button"
                        onClick={closeRunOfShow}
                        className="min-h-11 flex-1 touch-manipulation rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 sm:flex-none md:min-h-12 md:px-5 md:text-[15px]"
                      >
                        Exit Run Of Show
                      </PrimaryButton>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-stone-100 pt-2 sm:border-t-0 sm:pt-0 md:gap-2.5">
                      {RUN_OF_SHOW_ANNOTATION_ENABLED ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setRunOfShowAnnotateMode((v) => !v)}
                            className={`min-h-11 shrink-0 touch-manipulation rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition md:min-h-12 md:px-4 md:text-sm ${runOfShowAnnotateMode
                              ? "border-stone-400 bg-stone-100 text-stone-800"
                              : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
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
                                className="min-h-11 shrink-0 touch-manipulation rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-600 transition hover:border-stone-300 hover:bg-stone-100 md:min-h-12 md:px-4 md:text-sm"
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                onClick={undoLastRunOfShowAnnotation}
                                disabled={runOfShowAnnotationStrokes.length === 0}
                                className="min-h-11 shrink-0 touch-manipulation rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-600 transition enabled:hover:border-stone-300 enabled:hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 md:min-h-12 md:px-4 md:text-sm"
                              >
                                Undo
                              </button>
                            </>
                          ) : null}
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={resetRunOfShowDone}
                        className="min-h-11 shrink-0 touch-manipulation rounded-xl border border-transparent bg-transparent px-3 py-2.5 text-xs font-medium text-stone-500 transition hover:bg-stone-50 hover:text-stone-700 md:min-h-12 md:px-4 md:text-sm"
                      >
                        Reset progress
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main
              ref={runOfShowScrollRef}
              className="relative min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 pb-20 pt-6 sm:px-8 sm:pb-24 sm:pt-8 md:px-10 md:pb-28 md:pt-10 lg:px-16 lg:pt-12"
            >
              <div
                className="relative z-0 mx-auto w-full max-w-5xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
                data-run-of-show-inner=""
              >
                {sectionCeremonyEnabled ? (
                  <section className="mb-14 sm:mb-16">
                    <h3 className="border-b border-stone-200 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 md:text-sm md:tracking-[0.16em]">
                      Ceremony
                    </h3>
                    <div className="mt-6 grid gap-3 text-sm leading-relaxed text-stone-700 sm:grid-cols-2 sm:gap-x-10 md:gap-4 md:text-base md:leading-relaxed">
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
                          className="group flex w-full min-h-[3.5rem] touch-manipulation items-start gap-3 rounded-xl border border-dashed border-stone-300/90 bg-white px-4 py-4 text-left text-stone-800 shadow-[inset_3px_0_0_0_rgb(120_113_108/0.35)] transition-colors duration-150 hover:border-stone-400/90 hover:bg-stone-50/80 md:min-h-14 md:gap-4 md:px-5 md:py-4"
                          aria-expanded="false"
                        >
                          <span
                            className="mt-0.5 shrink-0 text-xl leading-none text-stone-400 transition group-hover:text-stone-600 md:text-2xl"
                            aria-hidden
                          >
                            ▸
                          </span>
                          <span className="shrink-0 text-lg text-stone-500 md:text-xl" aria-hidden>
                            ✓
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 md:text-xs">
                              Summary · list hidden
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-snug text-stone-900 md:text-base">
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
                                className="shrink-0 touch-manipulation rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-xs font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-100 md:min-h-11 md:px-4 md:text-sm"
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
                                ? "rounded-2xl border border-stone-300/90 bg-white px-3 py-8 shadow-[inset_4px_0_0_0_var(--cm-cyan),0_1px_4px_rgba(15,23,42,0.06)] sm:px-4 sm:py-9 md:py-10"
                                : "py-8 sm:py-9 md:py-10";
                            return (
                              <article
                                key={`ros-ceremony-${row.id}`}
                                {...(isUpNext && !done ? { "data-run-of-show-up-next": "" } : {})}
                                className={`flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:gap-6 ${rowSurface}`}
                              >
                                <div className="shrink-0 pt-0.5 sm:pt-1 md:pt-1.5">
                                  <button
                                    type="button"
                                    className={`flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl border shadow-none transition active:scale-[0.98] md:h-14 md:w-14 ${done
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
                                        className="h-6 w-6 rounded-full border-2 border-stone-400 md:h-7 md:w-7 md:border-[2.5px]"
                                        aria-hidden
                                      />
                                    )}
                                  </button>
                                </div>
                                <div className="min-w-0 flex-1">
                                  {isUpNext && !done ? (
                                    <p className="mb-3 inline-block rounded-lg border border-cyan-300/80 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-950 shadow-sm md:text-xs md:px-3.5 md:py-2">
                                      Up next
                                    </p>
                                  ) : null}
                                  <p
                                    className={`font-mono text-2xl font-light tabular-nums sm:text-3xl md:text-[2rem] lg:text-[2.125rem] ${done ? "text-stone-500" : "text-stone-900"
                                      }`}
                                  >
                                    {row.order.trim() ? row.order : "—"}
                                  </p>
                                  <h4
                                    className={`mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl md:text-[1.75rem] lg:text-[2rem] ${done
                                      ? "text-stone-600 line-through decoration-stone-400 decoration-[1.5px]"
                                      : "text-stone-950"
                                      }`}
                                  >
                                    {row.moment}
                                  </h4>
                                  {row.song ? (
                                    <p
                                      className={`mt-5 text-lg leading-snug sm:text-xl ${done ? "text-stone-500" : "text-stone-800"
                                        }`}
                                    >
                                      {row.song}
                                    </p>
                                  ) : null}
                                  {row.notes ? (
                                    <p
                                      className={`mt-4 max-w-4xl text-base leading-relaxed sm:text-lg ${done ? "text-stone-500" : "text-stone-600"
                                        }`}
                                    >
                                      {row.notes}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="w-full shrink-0 md:w-[9.5rem] md:self-stretch md:border-l md:border-stone-200/70 md:pl-4 lg:w-[11rem] lg:pl-5 xl:w-[12.5rem]">
                                  <RunOfShowCardNote
                                    value={runOfShowCardNotes[doneKey] ?? ""}
                                    onChange={(value) => setRunOfShowCardNote(doneKey, value)}
                                    onExpandEditor={() =>
                                      openRunOfShowCardNoteEditor(
                                        doneKey,
                                        row.moment,
                                        row.order.trim() || undefined,
                                      )
                                    }
                                    done={done}
                                  />
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
                    <h3 className="border-b border-stone-200 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 md:text-sm md:tracking-[0.16em]">
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
                                  className="group flex w-full min-h-[3.5rem] touch-manipulation items-start gap-3 rounded-xl border border-dashed border-stone-300/90 bg-white px-4 py-4 text-left text-stone-800 shadow-[inset_3px_0_0_0_rgb(120_113_108/0.35)] transition-colors duration-150 hover:border-stone-400/90 hover:bg-stone-50/80 md:min-h-14 md:gap-4 md:px-5 md:py-4"
                                  aria-expanded="false"
                                >
                                  <span
                                    className="mt-0.5 shrink-0 text-xl leading-none text-stone-400 transition group-hover:text-stone-600 md:text-2xl"
                                    aria-hidden
                                  >
                                    ▸
                                  </span>
                                  <span className="shrink-0 text-lg text-stone-500 md:text-xl" aria-hidden>
                                    ✓
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 md:text-xs">
                                      Summary · list hidden
                                    </p>
                                    <p className="mt-1 text-sm font-semibold leading-snug text-stone-900 md:text-base">
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
                                        className="shrink-0 touch-manipulation rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-xs font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-100 md:min-h-11 md:px-4 md:text-sm"
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
                                    const isGrandEntrance = isGrandEntranceTimelineItem(item.title);
                                    const rowSurface = done
                                      ? "rounded-2xl bg-stone-100/95 px-3 py-8 ring-1 ring-inset ring-stone-200/80 sm:px-4 sm:py-9 md:py-10"
                                      : isUpNext
                                        ? "rounded-2xl border border-stone-300/90 bg-white px-3 py-8 shadow-[inset_4px_0_0_0_var(--cm-cyan),0_1px_4px_rgba(15,23,42,0.06)] sm:px-4 sm:py-9 md:py-10"
                                        : "py-8 sm:py-9 md:py-10";
                                    return (
                                      <article
                                        key={`ros-recv-${item.id}`}
                                        {...(isUpNext && !done ? { "data-run-of-show-up-next": "" } : {})}
                                        className={`flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:gap-6 ${rowSurface}`}
                                      >
                                        <div className="shrink-0 pt-1 sm:pt-1.5 md:pt-2">
                                          <button
                                            type="button"
                                            className={`flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl border shadow-none transition active:scale-[0.98] md:h-14 md:w-14 ${done
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
                                                className="h-6 w-6 rounded-full border-2 border-stone-400 md:h-7 md:w-7 md:border-[2.5px]"
                                                aria-hidden
                                              />
                                            )}
                                          </button>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          {isUpNext && !done ? (
                                            <p className="mb-3 inline-block rounded-lg border border-cyan-300/80 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-950 shadow-sm md:text-xs md:px-3.5 md:py-2">
                                              Up next
                                            </p>
                                          ) : null}
                                          <p
                                            className={`font-mono text-3xl font-light tabular-nums sm:text-4xl md:text-[2.5rem] lg:text-[2.75rem] ${done ? "text-stone-500" : "text-stone-900"
                                              }`}
                                          >
                                            {item.time?.trim() ? item.time.trim() : "—"}
                                          </p>
                                          <h4
                                            className={`mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl md:text-[1.75rem] lg:text-[2rem] ${done
                                              ? "text-stone-600 line-through decoration-stone-400 decoration-[1.5px]"
                                              : "text-stone-950"
                                              }`}
                                          >
                                            {item.title}
                                          </h4>
                                          <p
                                            className={`mt-2 text-xs font-semibold uppercase tracking-wide ${done ? "text-stone-400" : "text-stone-500"
                                              }`}
                                          >
                                            {item.category}
                                          </p>
                                          {songCell ? (
                                            <p
                                              className={`mt-6 text-lg leading-snug sm:text-xl ${done ? "text-stone-500" : "text-stone-800"
                                                }`}
                                            >
                                              {songCell}
                                            </p>
                                          ) : null}
                                          {notesLabel ? (
                                            <p
                                              className={`mt-4 max-w-4xl text-base leading-relaxed sm:text-lg ${done ? "text-stone-500" : "text-stone-600"
                                                }`}
                                            >
                                              {notesLabel}
                                            </p>
                                          ) : null}
                                          {isGrandEntrance ? (
                                            <button
                                              type="button"
                                              onClick={() => openGrandEntranceDetail(item)}
                                              className={`${GRAND_ENTRANCE_DETAIL_BTN_CLASS} mt-5`}
                                            >
                                              Open Entrance Details
                                            </button>
                                          ) : null}
                                        </div>
                                        <div className="w-full shrink-0 md:w-[9.5rem] md:self-stretch md:border-l md:border-stone-200/70 md:pl-4 lg:w-[11rem] lg:pl-5 xl:w-[12.5rem]">
                                          <RunOfShowCardNote
                                            value={runOfShowCardNotes[doneKey] ?? ""}
                                            onChange={(value) => setRunOfShowCardNote(doneKey, value)}
                                            onExpandEditor={() =>
                                              openRunOfShowCardNoteEditor(
                                                doneKey,
                                                item.title,
                                                [
                                                  item.time?.trim(),
                                                  item.category,
                                                  songCell || undefined,
                                                ]
                                                  .filter(Boolean)
                                                  .join(" · ") || undefined,
                                              )
                                            }
                                            done={done}
                                          />
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
                    <h3 className="border-b border-stone-200 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 md:text-sm md:tracking-[0.16em]">
                      Music notes
                    </h3>
                    <div className="mt-8 space-y-4 text-base leading-relaxed text-stone-800 md:text-lg md:leading-relaxed">
                      {layoutProfileForActiveEvent === "School Dance" ? (
                        <p className="text-sm text-stone-600">Clean edits and school-appropriate selections.</p>
                      ) : null}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Overall vibe</p>
                        <p className="mt-2">{generalDjNotes?.trim() ? generalDjNotes : "—"}</p>
                      </div>
                      {musicGenreEraSelections.length > 0 ? (
                        <p>
                          <span className="font-semibold text-stone-900">Genre / era picks · </span>
                          {musicGenreEraSelections.join(", ")}
                        </p>
                      ) : null}
                      {musicTasteProfileHasSelections(musicTasteProfile) ? (
                        <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                            Music taste profile
                          </p>
                          {musicTasteProfile.danceFloorStyles.length > 0 ? (
                            <p className="mt-2">
                              <span className="font-semibold text-stone-900">Dance floor · </span>
                              {musicTasteProfile.danceFloorStyles.join(", ")}
                            </p>
                          ) : null}
                          {musicTasteProfile.crowdPreferences.length > 0 ? (
                            <p className="mt-2">
                              <span className="font-semibold text-stone-900">Crowd · </span>
                              {musicTasteProfile.crowdPreferences.join(", ")}
                            </p>
                          ) : null}
                          {musicTasteProfile.musicBehavior.length > 0 ? (
                            <p className="mt-2">
                              <span className="font-semibold text-stone-900">Behavior · </span>
                              {musicTasteProfile.musicBehavior.join(", ")}
                            </p>
                          ) : null}
                          {(musicTasteProfile.danceFloorVibeNotes ?? "").trim() ? (
                            <p className="mt-2">
                              <span className="font-semibold text-stone-900">Ideal dance floor vibe · </span>
                              {musicTasteProfile.danceFloorVibeNotes}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
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
              {RUN_OF_SHOW_ANNOTATION_ENABLED &&
                (runOfShowAnnotateMode || runOfShowAnnotationStrokes.length > 0) &&
                runOfShowAnnotationCanvasSize.w > 0 &&
                runOfShowAnnotationCanvasSize.h > 0 ? (
                <canvas
                  ref={runOfShowAnnotationCanvasRef}
                  className={`absolute left-0 top-0 z-[6] ${runOfShowAnnotateMode ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                  style={{
                    width: runOfShowAnnotationCanvasSize.w,
                    height: runOfShowAnnotationCanvasSize.h,
                    touchAction: runOfShowAnnotateMode ? "pan-y" : "auto",
                  }}
                  aria-hidden={!runOfShowAnnotateMode}
                />
              ) : null}
            </main>

            <RunOfShowCardNoteEditor
              open={runOfShowCardNoteEditor != null}
              cardLabel={runOfShowCardNoteEditor?.cardLabel ?? ""}
              cardSubline={runOfShowCardNoteEditor?.cardSubline}
              savedValue={runOfShowCardNoteEditorSavedValue}
              value={runOfShowCardNoteEditorDraft}
              onChange={setRunOfShowCardNoteEditorDraft}
              onDone={doneRunOfShowCardNoteEditor}
              onCancel={cancelRunOfShowCardNoteEditor}
              onClear={clearRunOfShowCardNoteEditorDraft}
            />

            {runOfShowOverlayActive &&
              runOfShowUpNextMeta.banner === "upNext" &&
              runOfShowUpNextCueDetail ? (
              <button
                type="button"
                onClick={scrollRunOfShowToUpNext}
                tabIndex={runOfShowUpNextRowInView ? -1 : 0}
                aria-hidden={runOfShowUpNextRowInView}
                aria-label={`Scroll to up next: ${runOfShowUpNextCueDetail.title}`}
                className={`no-print fixed z-[8] flex min-h-[3.25rem] min-w-[11rem] max-w-[min(20rem,calc(100vw-2rem))] touch-manipulation flex-col justify-center rounded-2xl border border-cyan-200/90 bg-white px-4 py-3.5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-[opacity,transform] duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:transition-opacity md:min-h-[3.75rem] md:min-w-[12.5rem] md:px-5 md:py-4 ${runOfShowUpNextRowInView
                  ? "pointer-events-none translate-y-1 opacity-0 motion-reduce:translate-y-0"
                  : "translate-y-0 opacity-100"
                  }`}
                style={{
                  bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
                  right: "max(1rem, env(safe-area-inset-right, 0px))",
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-900/75 md:text-xs">
                  Up Next
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-stone-950 md:text-base">
                  {runOfShowUpNextCueDetail.title}
                </p>
                {runOfShowUpNextCueDetail.subline ? (
                  <p className="mt-1 line-clamp-1 text-xs font-medium leading-snug text-stone-600 md:text-sm">
                    {runOfShowUpNextCueDetail.subline}
                  </p>
                ) : null}
              </button>
            ) : null}
          </div>
        )}

      {timelineImportOpen ? (
        <div
          className="no-print fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center sm:p-6"
          role="presentation"
          onClick={closeTimelineImport}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-import-title"
            className="flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col rounded-2xl border border-stone-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
              <p id="timeline-import-title" className="text-base font-semibold text-stone-900">
                Import Timeline
              </p>
              <p className="mt-1.5 text-sm leading-snug text-stone-600">
                Paste a planner list. We&apos;ll suggest moments—you choose whether to add or replace.
              </p>

              {timelineImportStep === "paste" ? (
                <div className="mt-5 space-y-4">
                  <TextArea
                    id="timeline-import-paste"
                    label="Paste timeline text"
                    value={timelineImportRaw}
                    onChange={setTimelineImportRaw}
                    placeholder={"4:30 Ceremony begins\n6:15 Grand entrance — Song: Signed, Sealed, Delivered\n7:30 Toasts — Best man and maid of honor"}
                    rows={8}
                    disabled={!canEditTimeline}
                  />
                  {timelineImportParseError ? (
                    <p className="text-sm text-rose-700">{timelineImportParseError}</p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <p className="text-sm text-stone-700">
                    Review {timelineImportDrafts.length}{" "}
                    {timelineImportDrafts.length === 1 ? "moment" : "moments"} before adding.
                  </p>
                  {timelineImportReplaceDanger ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                      Replacing clears your current timeline. Confirm below, or tap Add to Timeline instead.
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {timelineImportDrafts.map((draft) => (
                      <div
                        key={draft.key}
                        className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 sm:p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                            Moment
                          </p>
                          <button
                            type="button"
                            onClick={() => removeTimelineImportDraft(draft.key)}
                            className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-medium text-rose-800 hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <TextInput
                            id={`ti-time-${draft.key}`}
                            label="Time"
                            value={draft.time}
                            onChange={(v) => updateTimelineImportDraft(draft.key, { time: v })}
                            placeholder="e.g. 6:30 PM"
                          />
                          <TextInput
                            id={`ti-title-${draft.key}`}
                            label="Moment"
                            value={draft.title}
                            onChange={(v) => updateTimelineImportDraft(draft.key, { title: v })}
                            placeholder="Title"
                          />
                          <TextInput
                            id={`ti-song-${draft.key}`}
                            label="Song"
                            value={draft.songTitle ?? ""}
                            onChange={(v) =>
                              updateTimelineImportDraft(draft.key, {
                                songTitle: v.trim() ? v : undefined,
                              })
                            }
                            placeholder="Optional"
                          />
                          <TextInput
                            id={`ti-artist-${draft.key}`}
                            label="Artist"
                            value={draft.artist ?? ""}
                            onChange={(v) =>
                              updateTimelineImportDraft(draft.key, { artist: v.trim() ? v : undefined })
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div className="mt-3">
                          <TextArea
                            id={`ti-notes-${draft.key}`}
                            label="Notes"
                            value={draft.notes}
                            onChange={(v) => updateTimelineImportDraft(draft.key, { notes: v })}
                            rows={2}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {timelineImportDrafts.length === 0 ? (
                    <p className="text-sm text-stone-600">All rows removed. Go back to paste or cancel.</p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-stone-200 bg-white p-4 sm:p-5">
              {timelineImportStep === "paste" ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
                  <PrimaryButton
                    type="button"
                    onClick={closeTimelineImport}
                    className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:w-auto"
                  >
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={handleParseTimelineImport}
                    disabled={!canEditTimeline || !timelineImportRaw.trim()}
                    className="w-full rounded-lg border border-black bg-[#00D4FF] px-4 py-2.5 text-[13px] font-semibold text-black shadow-none hover:brightness-105 disabled:opacity-45 sm:w-auto"
                  >
                    Parse Timeline
                  </PrimaryButton>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
                    <PrimaryButton
                      type="button"
                      onClick={closeTimelineImport}
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:w-auto"
                    >
                      Cancel
                    </PrimaryButton>
                    <PrimaryButton
                      type="button"
                      onClick={() => {
                        setTimelineImportStep("paste");
                        setTimelineImportReplaceDanger(false);
                      }}
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:w-auto"
                    >
                      Back
                    </PrimaryButton>
                    <PrimaryButton
                      type="button"
                      disabled={!canEditTimeline || timelineImportDrafts.length === 0}
                      onClick={() => {
                        setTimelineImportReplaceDanger(false);
                        applyTimelineImport("add");
                      }}
                      className="w-full rounded-lg border border-stone-400 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 disabled:opacity-45 sm:w-auto"
                    >
                      Add to Timeline
                    </PrimaryButton>
                    {timelineImportReplaceDanger ? (
                      <PrimaryButton
                        type="button"
                        disabled={!canEditTimeline || timelineImportDrafts.length === 0}
                        onClick={() => applyTimelineImport("replace")}
                        className="w-full rounded-lg border border-rose-500 bg-rose-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-none hover:bg-rose-700 disabled:opacity-45 sm:w-auto"
                      >
                        Confirm Replace Timeline
                      </PrimaryButton>
                    ) : (
                      <PrimaryButton
                        type="button"
                        disabled={!canEditTimeline || timelineImportDrafts.length === 0}
                        onClick={() => setTimelineImportReplaceDanger(true)}
                        className="w-full rounded-lg border border-rose-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-rose-900 shadow-none hover:bg-rose-50 disabled:opacity-45 sm:w-auto"
                      >
                        Replace Timeline
                      </PrimaryButton>
                    )}
                  </div>
                  {timelineImportReplaceDanger ? (
                    <button
                      type="button"
                      onClick={() => setTimelineImportReplaceDanger(false)}
                      className="w-full text-center text-[13px] font-medium text-stone-600 underline-offset-2 hover:underline sm:text-right"
                    >
                      Never mind — keep reviewing
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {pendingTimelineDelete ? (
        <div
          className="no-print fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center sm:p-6"
          role="presentation"
          onClick={() => setPendingTimelineDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-delete-title"
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="timeline-delete-title" className="text-base font-semibold text-stone-900">
              Delete this timeline item?
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-snug text-stone-600">
              {pendingTimelineDelete.label}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <PrimaryButton
                type="button"
                onClick={() => setPendingTimelineDelete(null)}
                className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 shadow-none hover:bg-stone-50 sm:w-auto"
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                type="button"
                onClick={() => {
                  if (!pendingTimelineDelete) return;
                  if (pendingTimelineDelete.kind === "reception") {
                    deleteTimelineItem(pendingTimelineDelete.id);
                  } else {
                    deleteCeremonyTimelineItem(pendingTimelineDelete.id);
                  }
                  setPendingTimelineDelete(null);
                }}
                className="w-full rounded-lg border border-rose-400 bg-white px-4 py-2.5 text-[13px] font-semibold text-rose-900 shadow-none hover:bg-rose-50 sm:w-auto"
              >
                Delete
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}

      {authStage === "app" && <PersistMobileChip persistFeedback={persistFeedback} />}

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
