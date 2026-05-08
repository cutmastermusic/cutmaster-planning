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
  buildSeedEvents,
  initialBrideGroomProcessional,
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
  Collaborator,
  DisplayTimelineItem,
  EventSettings,
  EventRecord,
  FormalityItem,
  GuestRequestEntry,
  GuestRequestStatus,
  ChecklistStatus,
  Screen,
  SongEntry,
  SongListType,
  TimelineCategory,
  TimelineItem,
  TimelineTemplate,
  UserRole,
  WeddingDetails,
  NotificationItem,
} from "@/types/planning";
import { buildPlanningInsights, cloneJson } from "@/utils/planning";

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
  activities: ActivityItem[];
  notifications: NotificationItem[];
  appState: LocalAppStateBackup;
};

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
  const [microphoneNeeds, setMicrophoneNeeds] = useState(initialMicrophoneNeeds);
  const [generalDjNotes, setGeneralDjNotes] = useState(initialGeneralDjNotes);
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
    checklistDueDates: {},
    checklistManualStatuses: {},
  });
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("Couple");
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupStatus, setBackupStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // `weddingDetails` is derived from the active event (see event management state below).

  const [plannerNotes, setPlannerNotes] = useState<string[]>(initialPlannerNotes);

  const [appMode, setAppMode] = useState<AppMode>("events");
  const [activeEventId, setActiveEventId] = useState<string>("evt-1");

  const [events, setEvents] = useState<EventRecord[]>(() =>
    buildSeedEvents({
      timelineItems,
      formalities,
      mustPlaySongs,
      doNotPlaySongs,
      ceremonyStartTime,
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
  const [eventDraft, setEventDraft] = useState<WeddingDetails>({
    couple: "",
    date: "",
    venue: "",
  });
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tpl-traditional");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<"new" | "edit">("new");
  const [templateEditingId, setTemplateEditingId] = useState<string | null>(null);
  const [templateDraftName, setTemplateDraftName] = useState("");
  const [templates, setTemplates] = useState<TimelineTemplate[]>(initialTemplates);

  const commitActiveEventPlanningToEventsState = () => {
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
              formalities,
              mustPlaySongs,
              doNotPlaySongs,
              ceremonyStartTime,
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
              mcAnnouncements,
              settings: eventSettings,
            }
          : evt,
      ),
    );
  };

  const loadEventPlanningIntoWorkingState = (evt: EventRecord) => {
    setTimelineItems(cloneJson(evt.timelineItems));
    setFormalities(cloneJson(evt.formalities));
    setMustPlaySongs(cloneJson(evt.mustPlaySongs));
    setDoNotPlaySongs(cloneJson(evt.doNotPlaySongs));
    setCeremonyStartTime(evt.ceremonyStartTime);
    setOfficiantName(evt.officiantName);
    setCeremonyNotes(evt.ceremonyNotes);
    setMicrophoneNeeds(evt.microphoneNeeds);
    setWeddingPartyProcessional(cloneJson(evt.weddingPartyProcessional));
    setBrideGroomProcessional(cloneJson(evt.brideGroomProcessional));
    setUnityCeremonySong(cloneJson(evt.unityCeremonySong));
    setRecessionalSong(cloneJson(evt.recessionalSong));
    setPlannerNotes(cloneJson(evt.plannerNotes));
    setGuestRequests(cloneJson(evt.guestRequests));
    setGeneralDjNotes(evt.generalDjNotes);
    setMcAnnouncements(evt.mcAnnouncements);
    setEventSettings(
      cloneJson({
        eventName: evt.settings?.eventName ?? evt.meta.couple ?? "",
        coupleNames: evt.settings?.coupleNames ?? evt.meta.couple ?? "",
        eventType: evt.settings?.eventType ?? "",
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
      formalities: templateFormalities,
      mustPlaySongs: cloneJson(mustPlaySongs),
      doNotPlaySongs: cloneJson(doNotPlaySongs),
      ceremonyStartTime,
      officiantName,
      ceremonyNotes,
      microphoneNeeds,
      weddingPartyProcessional: cloneJson(weddingPartyProcessional),
      brideGroomProcessional: cloneJson(brideGroomProcessional),
      unityCeremonySong: cloneJson(unityCeremonySong),
      recessionalSong: cloneJson(recessionalSong),
      plannerNotes: templateSuggestions,
      guestRequests: cloneJson(guestRequests),
      generalDjNotes,
      mcAnnouncements,
      settings: {
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
        checklistDueDates: {},
        checklistManualStatuses: {},
      },
    };
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
    const couple = draft.couple.trim();
    const date = draft.date.trim();
    const venue = draft.venue.trim();

    if (!couple) return;

    if (eventModalMode === "new") {
      const template = templates.find((t) => t.id === selectedTemplateId);
      const newEvent = buildEventFromTemplate(
        { couple, date, venue },
        template,
        {
          eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          collaboratorId: `col-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        },
      );
      setEvents((prev) => [...prev, newEvent]);
      setActiveEventId(newEvent.id);
      loadEventPlanningIntoWorkingState(newEvent);
      setAppMode("event");
      setActiveScreen("Dashboard");
      setEventModalOpen(false);
      setEventEditingId(null);
      logActivity("event_created", `Created event: ${couple}`, newEvent.id);
      return;
    }

    if (eventEditingId) {
      setEvents((prev) =>
        prev.map((evt) =>
          evt.id === eventEditingId ? { ...evt, meta: { couple, date, venue } } : evt,
        ),
      );
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

  const effectiveRole = currentRole ?? rolePreview;
  const canManageMusic = effectiveRole === "Admin" || effectiveRole === "DJ" || effectiveRole === "Couple";
  const canEditTimeline = effectiveRole === "Admin" || effectiveRole === "DJ" || effectiveRole === "Planner";
  const canManageGuestRequests = effectiveRole === "Admin" || effectiveRole === "Couple";
  const canViewPrepSheet = effectiveRole === "Admin" || effectiveRole === "DJ";
  const canEditNotes = effectiveRole === "Admin" || effectiveRole === "Planner";
  const canManageEvents = effectiveRole === "Admin";
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

  const checklistTasks = [
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
      linkedSection: "Formal Dances" as Screen,
      autoStatus: hasKeyFormalDanceSongs ? "Complete" : "Not Started",
    },
    {
      id: "build-must-play-list",
      title: "Build Must Play List",
      description: "Add must-play songs for the dance floor.",
      linkedSection: "Music" as Screen,
      autoStatus: mustPlaySongs.length > 0 ? "Complete" : "Not Started",
    },
    {
      id: "add-do-not-play-songs",
      title: "Add Do Not Play Songs",
      description: "Capture songs and genres to avoid.",
      linkedSection: "Music" as Screen,
      autoStatus: doNotPlaySongs.length > 0 ? "Complete" : "Not Started",
    },
    {
      id: "review-timeline",
      title: "Review Timeline",
      description: "Confirm key reception flow and transitions.",
      linkedSection: "Timeline" as Screen,
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
      linkedSection: "DJ Prep Sheet" as Screen,
      autoStatus: hasFinalDjNotes ? "Complete" : "Not Started",
    },
  ];

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
  const musicVibeBuckets = useMemo(
    () =>
      vibeBuckets.map((bucket) => {
        if (bucket.title === "Cocktail Hour Vibe") {
          return { ...bucket, songs: [...importCocktailSuggestions, ...bucket.songs] };
        }
        if (bucket.title === "Dinner Vibe") {
          return { ...bucket, songs: [...importDinnerSuggestions, ...bucket.songs] };
        }
        if (bucket.title === "Open Dancing Vibe") {
          return { ...bucket, songs: [...importOpenDancingSuggestions, ...bucket.songs] };
        }
        return bucket;
      }),
    [importCocktailSuggestions, importDinnerSuggestions, importOpenDancingSuggestions],
  );
  const unreadBadgeCount =
    activities.filter((a) => a.unread).length + notifications.filter((n) => n.unread).length;
  const filteredActivities = activities.filter((item) => {
    const eventOk = activityEventFilter === "all" || item.eventId === activityEventFilter;
    const typeOk = activityTypeFilter === "all" || item.type === activityTypeFilter;
    return eventOk && typeOk;
  });

  const visibleEvents = useMemo(() => {
    if (!currentRole || currentRole === "Admin") return events;
    return events.filter((evt) =>
      (evt.collaborators ?? []).some(
        (c) => c.role === currentRole && c.status === "Accepted",
      ),
    );
  }, [events, currentRole]);

  const navItems: Screen[] = useMemo(() => {
    if (effectiveRole === "Admin") {
      return [
        "Dashboard",
        "Music",
        "Music Import",
        "Timeline",
        "Timeline Templates",
        "Planning Checklist",
        "Notification Center",
        "Event Settings",
        "Collaborators",
        "Formal Dances",
        "DJ Prep Sheet",
      ];
    }
    if (effectiveRole === "DJ") {
      return ["Dashboard", "Notification Center", "Planning Checklist", "Timeline", "Music", "Music Import", "DJ Prep Sheet", "Collaborators"];
    }
    if (effectiveRole === "Planner") {
      return ["Dashboard", "Notification Center", "Planning Checklist", "Timeline", "Event Settings", "Notes", "Collaborators"];
    }
    return ["Dashboard", "Notification Center", "Planning Checklist", "Music", "Music Import", "Timeline", "Event Settings", "Guest Requests", "Formal Dances"];
  }, [effectiveRole]);

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
        collaborators: Array.isArray(evt.collaborators) ? evt.collaborators : [],
        settings: {
          eventName: evt.settings?.eventName ?? evt.meta.couple ?? "",
          coupleNames: evt.settings?.coupleNames ?? evt.meta.couple ?? "",
          eventType: evt.settings?.eventType ?? "",
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
          checklistDueDates: evt.settings?.checklistDueDates ?? {},
          checklistManualStatuses: evt.settings?.checklistManualStatuses ?? {},
        },
      }));
      setEvents(loadedEvents);
      setAppMode(loadedEvents.length > 0 ? "event" : "events");
      if (Array.isArray(parsed.templates)) setTemplates(parsed.templates);
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
        setActiveScreen(parsed.appState.activeScreen ?? "Dashboard");
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
        setFormalities(active.formalities);
        setMustPlaySongs(active.mustPlaySongs);
        setDoNotPlaySongs(active.doNotPlaySongs);
        setCeremonyStartTime(active.ceremonyStartTime);
        setOfficiantName(active.officiantName);
        setCeremonyNotes(active.ceremonyNotes);
        setMicrophoneNeeds(active.microphoneNeeds);
        setWeddingPartyProcessional(active.weddingPartyProcessional);
        setBrideGroomProcessional(active.brideGroomProcessional);
        setUnityCeremonySong(active.unityCeremonySong);
        setRecessionalSong(active.recessionalSong);
        setPlannerNotes(active.plannerNotes);
        setGuestRequests(active.guestRequests);
        setGeneralDjNotes(active.generalDjNotes);
        setMcAnnouncements(active.mcAnnouncements);
        setEventSettings({
          eventName: active.settings?.eventName ?? active.meta.couple ?? "",
          coupleNames: active.settings?.coupleNames ?? active.meta.couple ?? "",
          eventType: active.settings?.eventType ?? "",
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
            formalities,
            mustPlaySongs,
            doNotPlaySongs,
            ceremonyStartTime,
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
            mcAnnouncements,
            settings: eventSettings,
          }
        : e,
    );

    const payload = {
      events: payloadEvents,
      activeEventId,
      templates,
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
    formalities,
    mustPlaySongs,
    doNotPlaySongs,
    ceremonyStartTime,
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
    setActiveScreen("Dashboard");
  }, [activeScreen, appMode, canManageEvents, setActiveScreen]);

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
      weddingPartyProcessional.title,
      brideGroomProcessional.title,
      unityCeremonySong.title,
      recessionalSong.title,
      ceremonyStartTime,
      officiantName,
      microphoneNeeds,
      ceremonyNotes,
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
    weddingPartyProcessional.title,
    brideGroomProcessional.title,
    unityCeremonySong.title,
    recessionalSong.title,
    ceremonyStartTime,
    officiantName,
    logActivity,
    microphoneNeeds,
    ceremonyNotes,
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
              formalities,
              mustPlaySongs,
              doNotPlaySongs,
              ceremonyStartTime,
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
              mcAnnouncements,
              settings: eventSettings,
            }
          : e,
      ),
    [
      events,
      activeEventId,
      timelineItems,
      formalities,
      mustPlaySongs,
      doNotPlaySongs,
      ceremonyStartTime,
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
        eventName: evt.settings?.eventName ?? evt.meta?.couple ?? "",
        coupleNames: evt.settings?.coupleNames ?? evt.meta?.couple ?? "",
        eventType: evt.settings?.eventType ?? "",
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
    setActiveScreen(backupAppState.activeScreen ?? "Dashboard");
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
        formalities
          .filter((item) => item.includeInTimeline)
          .map((item) => item.momentName.trim().toLowerCase()),
      ),
    [formalities],
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
      ...formalities
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
    [formalities, includedFormalityNames, timelineItems],
  );

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

  const prepSheetText = [
    `${appSettings.appName.toUpperCase()} - DJ PREP SHEET`,
    "",
    "EVENT OVERVIEW",
    `Event Name: ${eventSettings.eventName || weddingDetails.couple || "TBD"}`,
    `Couple: ${eventSettings.coupleNames || weddingDetails.couple || "TBD"}`,
    `Date: ${eventSettings.weddingDate || weddingDetails.date || "TBD"}`,
    `Venue: ${eventSettings.venue || weddingDetails.venue || "TBD"}`,
    `Timezone: ${effectiveTimezone || "TBD"}`,
    `Event Type: ${effectiveEventType || "TBD"}`,
    `Ceremony Start: ${ceremonyStartTime || "TBD"}`,
    `Officiant: ${officiantName || "TBD"}`,
    `Microphones: ${microphoneNeeds || "TBD"}`,
    "",
    "TIMELINE",
    ...mergedTimelineItems.map(
      (item) =>
        `- ${item.time || "TBD"} | ${item.title} [${item.category}]${item.needsDjMcAttention ? " (DJ/MC ATTENTION)" : ""}${item.notes ? ` - ${item.notes}` : ""}`,
    ),
    "",
    "CEREMONY SONGS + NOTES",
    `- Wedding Party Processional: ${weddingPartyProcessional.title || "TBD"}${weddingPartyProcessional.artist ? ` - ${weddingPartyProcessional.artist}` : ""}${weddingPartyProcessional.notes ? ` | ${weddingPartyProcessional.notes}` : ""}`,
    `- Bride/Groom Processional: ${brideGroomProcessional.title || "TBD"}${brideGroomProcessional.artist ? ` - ${brideGroomProcessional.artist}` : ""}${brideGroomProcessional.notes ? ` | ${brideGroomProcessional.notes}` : ""}`,
    `- Unity Ceremony: ${unityCeremonySong.title || "TBD"}${unityCeremonySong.artist ? ` - ${unityCeremonySong.artist}` : ""}${unityCeremonySong.notes ? ` | ${unityCeremonySong.notes}` : ""}`,
    `- Recessional: ${recessionalSong.title || "TBD"}${recessionalSong.artist ? ` - ${recessionalSong.artist}` : ""}${recessionalSong.notes ? ` | ${recessionalSong.notes}` : ""}`,
    `- Ceremony Notes: ${ceremonyNotes || "None"}`,
    "",
    "FORMAL DANCES / FORMALITIES",
    ...formalities.map(
      (item) =>
        `- ${item.time || "TBD"} | ${item.momentName || "Untitled"} | ${item.songTitle || "Song TBD"}${item.artist ? ` - ${item.artist}` : ""}${item.fadeOutEarly ? ` | Fade at ${item.fadeOutTimestamp || "TBD"}` : ""}${item.includeInTimeline ? " | In Timeline" : ""}${item.needsDjMcAttention ? " | DJ/MC ATTENTION" : ""}${item.notes ? ` | ${item.notes}` : ""}`,
    ),
    "",
    "MUST PLAY SONGS",
    ...mustPlaySongs.map(
      (song) =>
        `- ${song.title}${song.artist ? ` - ${song.artist}` : ""}${song.highPriority ? " (PRIORITY)" : ""}${song.notes ? ` | ${song.notes}` : ""}`,
    ),
    "",
    "DO NOT PLAY SONGS",
    ...doNotPlaySongs.map(
      (song) =>
        `- ${song.title}${song.artist ? ` - ${song.artist}` : ""}${song.highPriority ? " (PRIORITY BLOCK)" : ""}${song.notes ? ` | ${song.notes}` : ""}`,
    ),
    "",
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
    "GENERAL DJ NOTES",
    generalDjNotes || "None",
    "",
    "EVENT NOTES / PREFERENCES",
    eventSettings.internalNotes || "None",
    eventSettings.clientFacingNotes || "None",
    "",
    "MC ANNOUNCEMENTS",
    mcAnnouncements || "None",
    "",
    "FOOTER",
    effectivePrepSheetFooter || "None",
    "",
  ].join("\n");

  const copyPrepSheetText = async () => {
    try {
      await navigator.clipboard.writeText(prepSheetText);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus(""), 2200);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(201,163,92,0.12),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#090909_0%,#101012_55%,#0b0b0c_100%)] text-zinc-100">
      <main className="mx-auto w-full max-w-md px-5 pb-28 pt-7">
        <AppHeader
          screenTitle={appMode === "events" ? "Events" : screenTitle}
          weddingDetails={weddingDetails}
          savedLocally={savedLocally}
          appSettings={{
            ...appSettings,
            coupleWelcomeMessage: effectiveCoupleWelcomeMessage,
            logoUrl: appSettings.logoUrl.startsWith("/") ? appSettings.logoUrl : "/cmm-logo-white.png",
          }}
        />

        {authStage === "app" && currentRole && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
            <span className="text-zinc-300">
              Current role: <span className="text-[#f5e6c8]">{currentRole}</span>
            </span>
            <div className="flex items-center gap-2">
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
                Switch Role
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
                      const scopedEvents =
                        role === "Admin"
                          ? events
                          : events.filter((evt) =>
                              (evt.collaborators ?? []).some(
                                (c) => c.role === role && c.status === "Accepted",
                              ),
                            );
                      if (scopedEvents.length > 0) {
                        const first = scopedEvents[0];
                        setActiveEventId(first.id);
                        loadEventPlanningIntoWorkingState(first);
                        setAppMode(role === "Couple" ? "event" : "events");
                      } else {
                        setAppMode("events");
                      }
                      setAuthStage("app");
                      setActiveScreen(role === "DJ" ? "DJ Prep Sheet" : "Dashboard");
                    }}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
                  >
                    Continue as {role}
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
                You&apos;ve been invited to plan your wedding with Cutmaster Music
              </SectionTitle>
              <div className="mt-3 space-y-1 text-xs text-zinc-300">
                <p>Event: {events.find((e) => e.id === inviteAccessPreview.eventId)?.meta.couple || "Event"}</p>
                <p>Date: {events.find((e) => e.id === inviteAccessPreview.eventId)?.meta.date || "TBD"}</p>
                <p>Venue: {events.find((e) => e.id === inviteAccessPreview.eventId)?.meta.venue || "TBD"}</p>
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
                  onClick={() => setActiveScreen("Dashboard")}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs text-zinc-200 hover:bg-white/15"
                >
                  Back to Events
                </PrimaryButton>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Global settings apply across all events and are stored outside event records.
              </p>
              <div className="mt-4 space-y-3">
                <TextInput id="global-company-name" label="Company Name" value={appSettings.companyName} onChange={(value) => setAppSettings((prev) => ({ ...prev, companyName: value }))} disabled={!canManageEvents} />
                <TextInput id="global-app-name" label="App Name" value={appSettings.appName} onChange={(value) => setAppSettings((prev) => ({ ...prev, appName: value }))} disabled={!canManageEvents} />
                <TextInput id="global-logo-url" label="Logo/Branding Path" value={appSettings.logoUrl} onChange={(value) => setAppSettings((prev) => ({ ...prev, logoUrl: value }))} disabled={!canManageEvents} />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput id="global-brand-color" label="Brand Color" value={appSettings.brandColor} onChange={(value) => setAppSettings((prev) => ({ ...prev, brandColor: value }))} disabled={!canManageEvents} />
                  <TextInput id="global-accent-color" label="Accent Color" value={appSettings.accentColor} onChange={(value) => setAppSettings((prev) => ({ ...prev, accentColor: value }))} disabled={!canManageEvents} />
                </div>
                <TextInput id="global-timezone" label="Default Event Timezone" value={appSettings.defaultEventTimezone} onChange={(value) => setAppSettings((prev) => ({ ...prev, defaultEventTimezone: value }))} disabled={!canManageEvents} />
                <TextInput id="global-event-type" label="Default Event Type" value={appSettings.defaultEventType} onChange={(value) => setAppSettings((prev) => ({ ...prev, defaultEventType: value }))} disabled={!canManageEvents} />
                <TextArea id="global-prep-footer" label="Default Prep Sheet Footer" value={appSettings.prepSheetFooterText} onChange={(value) => setAppSettings((prev) => ({ ...prev, prepSheetFooterText: value }))} rows={3} disabled={!canManageEvents} />
                <TextArea id="global-guest-msg" label="Default Guest Request Message" value={appSettings.publicGuestRequestMessage} onChange={(value) => setAppSettings((prev) => ({ ...prev, publicGuestRequestMessage: value }))} rows={3} disabled={!canManageEvents} />
                <TextInput id="global-couple-welcome" label="Default Couple Welcome Message" value={appSettings.coupleWelcomeMessage} onChange={(value) => setAppSettings((prev) => ({ ...prev, coupleWelcomeMessage: value }))} disabled={!canManageEvents} />
                <TextArea id="global-template-defaults" label="Global Template Defaults" value={appSettings.globalTemplateDefaults} onChange={(value) => setAppSettings((prev) => ({ ...prev, globalTemplateDefaults: value }))} rows={3} disabled={!canManageEvents} />
              </div>
              <div className="mt-5 rounded-xl border border-[#c9a35c]/25 bg-[#c9a35c]/10 p-3 text-xs text-[#f5e6c8]">
                Backup recommended while this remains a frontend-only prototype.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
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
                  className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                    backupStatus.kind === "success"
                      ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                      : "border border-rose-400/25 bg-rose-500/10 text-rose-100"
                  }`}
                >
                  {backupStatus.message}
                </p>
              )}
            </PremiumCard>
          </section>
        )}

        {authStage === "app" &&
          appMode === "events" &&
          activeScreen !== "Settings" &&
          activeScreen !== "Notification Center" && (
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
                        couple: "",
                        date: "",
                        venue: "",
                      });
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
                  <p className="text-sm font-medium text-[#f5e6c8]">
                    {canManageEvents ? "No events yet" : "No assigned events yet"}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
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
                          setEventDraft({ couple: "", date: "", venue: "" });
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
              <div className="space-y-3">
                {visibleEvents.map((evt) => {
                  const isActive = evt.id === activeEventId;
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
                            {evt.meta.couple || "Untitled Event"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {evt.meta.date || "Date TBD"} · {evt.meta.venue || "Venue TBD"}
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
                              setEventDraft({
                                couple: evt.meta.couple,
                                date: evt.meta.date,
                                venue: evt.meta.venue,
                              });
                              setEventModalOpen(true);
                            }}
                            className="rounded-xl bg-white/5 px-3 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-white/10"
                          >
                            Edit
                          </PrimaryButton>
                        ) : (
                          <PrimaryButton
                            onClick={() => setAppMode("event")}
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
                          Copy Couple Invite Link
                        </PrimaryButton>
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {authStage === "app" && appMode === "event" && effectiveRole !== "Couple" && (
          <div className="mt-4">
            <PrimaryButton
              onClick={() => {
                commitActiveEventPlanningToEventsState();
                setAppMode("events");
              }}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/10"
            >
              Manage Events
            </PrimaryButton>
          </div>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Dashboard" && (
          <>
            <section className="mt-6 space-y-3">
              <PremiumCard className="border-[#c9a35c]/30 bg-gradient-to-br from-[#20160a]/55 via-[#17171d]/85 to-[#121217]/95 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#c9a35c]">
                  {isCoupleView ? "Your wedding planning journey" : "Event planning dashboard"}
                </p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#f7ecd4]">{coupleDisplayName}</h2>
                    <p className="mt-1 text-xs text-zinc-400">{eventDisplayName}</p>
                  </div>
                  <span className="rounded-full border border-[#c9a35c]/35 bg-[#c9a35c]/15 px-2.5 py-1 text-xs font-semibold text-[#f5e6c8]">
                    {completionPercent}% complete
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-zinc-500">Wedding date</p>
                    <p className="mt-1 font-medium text-zinc-100">{eventDateDisplay}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-zinc-500">Venue</p>
                    <p className="mt-1 font-medium text-zinc-100">{eventVenueDisplay}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-[#c9a35c]/25 bg-gradient-to-r from-[#c9a35c]/15 to-transparent px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-[#d8b874]">Wedding countdown</p>
                  <p className="mt-1 text-sm font-medium text-[#f7ecd4]">
                    {daysUntilWedding === null
                      ? "Add a wedding date to start your countdown"
                      : `${daysUntilWedding} day${daysUntilWedding === 1 ? "" : "s"} until your wedding`}
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
                  {(["Music", "Timeline", "Ceremony", "Formal Dances", "Guest Requests", "DJ Prep Sheet"] as Screen[]).map((target) => (
                    <PrimaryButton
                      key={`quick-${target}`}
                      onClick={() => setActiveScreen(target)}
                      className="rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-[11px] text-zinc-200 transition hover:-translate-y-0.5 hover:border-[#c9a35c]/35 hover:bg-white/15"
                    >
                      {target === "DJ Prep Sheet" ? "Prep Sheet" : target}
                    </PrimaryButton>
                  ))}
                </div>
              </PremiumCard>
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
                    <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-500">
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
                    <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-500">
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
                    insights={planningInsights}
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
              <div className="grid grid-cols-2 gap-3">
                {navItems
                  .filter((section) => section !== "Dashboard")
                  .map((section) => (
                    <PrimaryButton
                      key={section}
                      onClick={() => setActiveScreen(section)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-zinc-100 transition duration-200 hover:-translate-y-0.5 hover:border-[#c9a35c]/45 hover:bg-white/10"
                    >
                      {section}
                    </PrimaryButton>
                  ))}
              </div>
            </section>
          </>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Music" && (
          <section className="mt-6 space-y-3">
            {!canManageMusic && (
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">
                  {effectiveRole} role can view music, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
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

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Add Song</SectionTitle>
              <p className="mt-1 text-xs text-zinc-400">
                Build your custom must-play and do-not-play lists for the DJ.
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

            <PremiumCard>
              <div className="flex items-center justify-between">
                <SectionTitle className="text-[#e9d5a8]">Must Play Songs</SectionTitle>
                <span className="rounded-full bg-[#c9a35c]/15 px-2.5 py-1 text-[11px] text-[#e9d5a8]">
                  {mustPlaySongs.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
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

            <PremiumCard>
              <div className="flex items-center justify-between">
                <SectionTitle className="text-[#d8c7aa]">Do Not Play Songs</SectionTitle>
                <span className="rounded-full bg-[#6f5353]/35 px-2.5 py-1 text-[11px] text-[#e5d7be]">
                  {doNotPlaySongs.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
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

            {musicVibeBuckets.map((bucket) => (
              <PremiumCard key={bucket.title}>
                <SectionTitle className="text-[#e9d5a8]">{bucket.title}</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {bucket.songs.map((song, index) => (
                    <li
                      key={`vibe-${bucket.title}-${song}-${index}`}
                      className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-300"
                    >
                      {song}
                    </li>
                  ))}
                </ul>
              </PremiumCard>
            ))}
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Music Import" && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/20 via-[#17171c] to-[#141419]">
              <SectionTitle className="text-[#e9d5a8]">Spotify Playlist Import (Prototype)</SectionTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Paste a Spotify playlist link to simulate import and build wedding-ready song guidance.
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
                    Building your wedding soundtrack...
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

        {authStage === "app" && appMode === "event" && activeScreen === "Timeline" && (
          <section className="mt-6 space-y-3">
            {!canEditTimeline && (
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">
                  {effectiveRole} role can view timeline, but editing is limited in this prototype.
                </p>
              </PremiumCard>
            )}
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
                  <p className="text-sm font-medium text-[#f5e6c8]">Your timeline is empty</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Add your first event to start shaping the perfect wedding flow.
                  </p>
                </div>
              </PremiumCard>
            ) : (
              mergedTimelineItems.map((item, index) => {
                const isTimelineItem = item.source === "timeline";
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
                    <div>
                      <span className="rounded-full bg-[#c9a35c]/15 px-2.5 py-1 text-xs font-medium text-[#e9d5a8]">
                        {item.time || "TBD"}
                      </span>
                      <SectionTitle className="mt-2 text-zinc-100">{item.title}</SectionTitle>
                    </div>
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
                  {item.notes && <p className="mt-2 text-xs text-zinc-400">{item.notes}</p>}
                  {item.needsDjMcAttention && (
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
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a35c]/30 bg-gradient-to-b from-[#c9a35c]/15 to-[#c9a35c]/5 px-3 py-2 text-[11px] text-[#f5e6c8] transition hover:border-[#c9a35c]/45 hover:bg-[#c9a35c]/20 active:scale-[0.98] disabled:opacity-50"
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
                      </>
                    ) : (
                      <PrimaryButton
                        onClick={() => setActiveScreen("Formal Dances")}
                        className="bg-[#c9a35c]/20 px-3 py-2 text-[11px] text-[#f5e6c8] hover:bg-[#c9a35c]/30"
                      >
                        Edit in Formal Dances
                      </PrimaryButton>
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

        {authStage === "app" && appMode === "event" && activeScreen === "Timeline Templates" && (
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

        {authStage === "app" && appMode === "event" && activeScreen === "Guest Requests" && (
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

        {authStage === "app" && appMode === "event" && activeScreen === "Ceremony" && (
          <section className="mt-6 space-y-3">
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

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Ceremony Details</SectionTitle>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="ceremony-start-time"
                  label="Ceremony Start Time"
                  value={ceremonyStartTime}
                  onChange={setCeremonyStartTime}
                  placeholder="e.g. 4:00 PM"
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
              <SectionTitle className="text-[#e9d5a8]">
                Wedding Party Processional
              </SectionTitle>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="wedding-party-song-title"
                  label="Song Title"
                  value={weddingPartyProcessional.title}
                  onChange={(value) =>
                    setWeddingPartyProcessional((prev) => ({ ...prev, title: value }))
                  }
                  placeholder="Song title"
                />
                <TextInput
                  id="wedding-party-song-artist"
                  label="Artist"
                  value={weddingPartyProcessional.artist}
                  onChange={(value) =>
                    setWeddingPartyProcessional((prev) => ({ ...prev, artist: value }))
                  }
                  placeholder="Artist"
                />
                <TextArea
                  id="wedding-party-song-notes"
                  label="Notes"
                  value={weddingPartyProcessional.notes}
                  onChange={(value) =>
                    setWeddingPartyProcessional((prev) => ({ ...prev, notes: value }))
                  }
                  placeholder="Timing or mix notes..."
                  rows={2}
                />
              </div>
            </PremiumCard>

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Bride/Groom Processional</SectionTitle>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="bride-groom-song-title"
                  label="Song Title"
                  value={brideGroomProcessional.title}
                  onChange={(value) =>
                    setBrideGroomProcessional((prev) => ({ ...prev, title: value }))
                  }
                  placeholder="Song title"
                />
                <TextInput
                  id="bride-groom-song-artist"
                  label="Artist"
                  value={brideGroomProcessional.artist}
                  onChange={(value) =>
                    setBrideGroomProcessional((prev) => ({ ...prev, artist: value }))
                  }
                  placeholder="Artist"
                />
                <TextArea
                  id="bride-groom-song-notes"
                  label="Notes"
                  value={brideGroomProcessional.notes}
                  onChange={(value) =>
                    setBrideGroomProcessional((prev) => ({ ...prev, notes: value }))
                  }
                  placeholder="Timing or cue notes..."
                  rows={2}
                />
              </div>
            </PremiumCard>

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Unity Ceremony Song</SectionTitle>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="unity-song-title"
                  label="Song Title"
                  value={unityCeremonySong.title}
                  onChange={(value) =>
                    setUnityCeremonySong((prev) => ({ ...prev, title: value }))
                  }
                  placeholder="Song title"
                />
                <TextInput
                  id="unity-song-artist"
                  label="Artist"
                  value={unityCeremonySong.artist}
                  onChange={(value) =>
                    setUnityCeremonySong((prev) => ({ ...prev, artist: value }))
                  }
                  placeholder="Artist"
                />
                <TextArea
                  id="unity-song-notes"
                  label="Notes"
                  value={unityCeremonySong.notes}
                  onChange={(value) =>
                    setUnityCeremonySong((prev) => ({ ...prev, notes: value }))
                  }
                  placeholder="Level, fade, and cue notes..."
                  rows={2}
                />
              </div>
            </PremiumCard>

            <PremiumCard>
              <SectionTitle className="text-[#e9d5a8]">Recessional Song</SectionTitle>
              <div className="mt-4 space-y-3">
                <TextInput
                  id="recessional-song-title"
                  label="Song Title"
                  value={recessionalSong.title}
                  onChange={(value) => setRecessionalSong((prev) => ({ ...prev, title: value }))}
                  placeholder="Song title"
                />
                <TextInput
                  id="recessional-song-artist"
                  label="Artist"
                  value={recessionalSong.artist}
                  onChange={(value) => setRecessionalSong((prev) => ({ ...prev, artist: value }))}
                  placeholder="Artist"
                />
                <TextArea
                  id="recessional-song-notes"
                  label="Notes"
                  value={recessionalSong.notes}
                  onChange={(value) => setRecessionalSong((prev) => ({ ...prev, notes: value }))}
                  placeholder="Exit cue and energy notes..."
                  rows={2}
                />
              </div>
            </PremiumCard>

            <PremiumCard className="border-[#c9a35c]/40 bg-gradient-to-b from-[#1d1a14] to-[#141419]">
              <SectionTitle className="text-[#f5e6c8]">DJ Ceremony Prep Summary</SectionTitle>
              <div className="mt-3 space-y-3 text-xs text-zinc-300">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                    Ceremony Logistics
                  </p>
                  <p className="mt-1">Start: {ceremonyStartTime || "TBD"}</p>
                  <p className="mt-1">Officiant: {officiantName || "TBD"}</p>
                  <p className="mt-1">Microphones: {microphoneNeeds || "TBD"}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                    Music Cue Sheet
                  </p>
                  <p className="mt-2 text-zinc-200">
                    Wedding Party Processional: {weddingPartyProcessional.title || "TBD"}
                    {weddingPartyProcessional.artist
                      ? ` - ${weddingPartyProcessional.artist}`
                      : ""}
                  </p>
                  <p className="mt-1 text-zinc-200">
                    Bride/Groom Processional: {brideGroomProcessional.title || "TBD"}
                    {brideGroomProcessional.artist
                      ? ` - ${brideGroomProcessional.artist}`
                      : ""}
                  </p>
                  <p className="mt-1 text-zinc-200">
                    Unity Ceremony: {unityCeremonySong.title || "TBD"}
                    {unityCeremonySong.artist ? ` - ${unityCeremonySong.artist}` : ""}
                  </p>
                  <p className="mt-1 text-zinc-200">
                    Recessional: {recessionalSong.title || "TBD"}
                    {recessionalSong.artist ? ` - ${recessionalSong.artist}` : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                    Ceremony Notes
                  </p>
                  <p className="mt-1">{ceremonyNotes || "No additional notes yet."}</p>
                </div>
              </div>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Formal Dances" && (
          <section className="mt-6 space-y-3">
            <PremiumCard className="border-[#c9a35c]/20 bg-gradient-to-b from-amber-950/15 to-transparent">
              <SectionTitle className="text-[#e9d5a8]">Formalities Assistant</SectionTitle>
              <p className="mt-1 text-xs text-zinc-500">
                Spacing between formal moments and key dance-floor cues.
              </p>
              <div className="mt-3">
                <InsightStack
                  insights={planningInsights.filter(
                    (i) =>
                      i.id.startsWith("tl-formality-gap") ||
                      i.id === "music-last-dance" ||
                      i.id === "music-kickoff",
                  )}
                  emptyLabel="Formalities read well spaced and song-ready."
                />
              </div>
            </PremiumCard>

            {formalities.map((formality) => (
              <PremiumCard key={formality.id}>
                <SectionTitle className="text-[#e9d5a8]">{formality.momentName}</SectionTitle>
                <div className="mt-4 space-y-3">
                  <TextInput
                    id={`${formality.id}-time`}
                    label="Approximate Time"
                    value={formality.time}
                    onChange={(value) => updateFormality(formality.id, { time: value })}
                    placeholder="e.g. 7:30 PM"
                  />
                  <TextInput
                    id={`${formality.id}-moment-name`}
                    label="Moment Name"
                    value={formality.momentName}
                    onChange={(value) =>
                      updateFormality(formality.id, { momentName: value })
                    }
                    placeholder="Moment name"
                  />
                  <TextInput
                    id={`${formality.id}-song-title`}
                    label="Song Title"
                    value={formality.songTitle}
                    onChange={(value) => updateFormality(formality.id, { songTitle: value })}
                    placeholder="Song title"
                  />
                  <TextInput
                    id={`${formality.id}-artist`}
                    label="Artist"
                    value={formality.artist}
                    onChange={(value) => updateFormality(formality.id, { artist: value })}
                    placeholder="Artist"
                  />
                  <TextArea
                    id={`${formality.id}-notes`}
                    label="Notes"
                    value={formality.notes}
                    onChange={(value) => updateFormality(formality.id, { notes: value })}
                    placeholder="MC cues, transitions, crowd management notes..."
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <PrimaryButton
                      onClick={() =>
                        updateFormality(formality.id, {
                          fadeOutEarly: !formality.fadeOutEarly,
                        })
                      }
                      className={`w-full ${
                        formality.fadeOutEarly
                          ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {formality.fadeOutEarly ? "Fade Out Early: On" : "Fade Out Early"}
                    </PrimaryButton>
                    <TextInput
                      id={`${formality.id}-fade-timestamp`}
                      label="Fade Timestamp"
                      value={formality.fadeOutTimestamp}
                      onChange={(value) =>
                        updateFormality(formality.id, { fadeOutTimestamp: value })
                      }
                      placeholder="e.g. 1:20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PrimaryButton
                      onClick={() =>
                        updateFormality(formality.id, {
                          includeInTimeline: !formality.includeInTimeline,
                        })
                      }
                      className={`w-full ${
                        formality.includeInTimeline
                          ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {formality.includeInTimeline
                        ? "Included in Timeline"
                        : "Include in Timeline"}
                    </PrimaryButton>
                    <PrimaryButton
                      onClick={() =>
                        updateFormality(formality.id, {
                          needsDjMcAttention: !formality.needsDjMcAttention,
                        })
                      }
                      className={`w-full ${
                        formality.needsDjMcAttention
                          ? "bg-[#c9a35c]/20 text-[#f5e6c8]"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {formality.needsDjMcAttention
                        ? "DJ/MC Attention: On"
                        : "DJ/MC Attention"}
                    </PrimaryButton>
                  </div>
                </div>
              </PremiumCard>
            ))}

            <PremiumCard className="border-[#c9a35c]/40 bg-gradient-to-b from-[#1d1a14] to-[#141419]">
              <SectionTitle className="text-[#f5e6c8]">DJ Formalities Prep Summary</SectionTitle>
              <div className="mt-3 space-y-2">
                {formalities.map((item) => (
                  <div key={`${item.id}-summary`} className="rounded-xl bg-white/5 p-3 text-xs">
                    <p className="text-zinc-100">
                      {item.time || "TBD"} - {item.momentName || "Untitled Formality"}
                    </p>
                    <p className="mt-1 text-zinc-400">
                      {item.songTitle || "Song TBD"}
                      {item.artist ? ` - ${item.artist}` : ""}
                    </p>
                    <p className="mt-1 text-zinc-500">{item.notes || "No notes yet."}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.includeInTimeline && (
                        <span className="rounded-full bg-[#c9a35c]/20 px-2 py-1 text-[10px] text-[#f5e6c8]">
                          In Timeline
                        </span>
                      )}
                      {item.needsDjMcAttention && (
                        <span className="rounded-full bg-[#c9a35c]/20 px-2 py-1 text-[10px] text-[#f5e6c8]">
                          DJ/MC Attention
                        </span>
                      )}
                      {item.fadeOutEarly && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-zinc-300">
                          Fade: {item.fadeOutTimestamp || "TBD"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

        {authStage === "app" && appMode === "event" && activeScreen === "DJ Prep Sheet" && (
          <section className="mt-6 space-y-3">
            {!canViewPrepSheet && (
              <PremiumCard className="border-[#c9a35c]/20 bg-amber-950/10">
                <p className="text-xs text-[#f5e6c8]">
                  {effectiveRole} role can’t access full prep sheet in this prototype.
                </p>
              </PremiumCard>
            )}
            <PremiumCard className="bg-gradient-to-b from-[#1c1c22] to-[#15151a]">
              <SectionTitle className="text-[#f5e6c8]">DJ Prep Sheet</SectionTitle>
              <p className="mt-2 text-xs text-zinc-400">
                Event-day summary pulled from live planning data.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PrimaryButton
                  onClick={() => window.print()}
                  className="w-full bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] py-2.5 text-sm font-semibold text-white hover:brightness-110"
                >
                  Print Prep Sheet
                </PrimaryButton>
                <PrimaryButton
                  onClick={copyPrepSheetText}
                  className="w-full bg-white/10 py-2.5 text-sm text-zinc-200 hover:bg-white/15"
                >
                  Copy Prep Sheet Text
                </PrimaryButton>
              </div>
              {copyStatus === "copied" && (
                <p className="mt-2 text-xs text-[#e9d5a8]">Prep sheet copied to clipboard.</p>
              )}
              {copyStatus === "error" && (
                <p className="mt-2 text-xs text-[#f2dede]">
                  Could not copy. Please try again.
                </p>
              )}
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Event Overview</SectionTitle>
              <div className="mt-3 space-y-1 text-xs text-zinc-300">
                <p>Couple: {weddingDetails.couple}</p>
                <p>Date: {weddingDetails.date}</p>
                <p>Venue: {weddingDetails.venue}</p>
                <p>Timezone: {effectiveTimezone}</p>
                <p>Type: {effectiveEventType}</p>
                <p>Assigned DJ: {eventSettings.assignedDj || "TBD"}</p>
                <p>Package: {eventSettings.packageName || "TBD"}</p>
                <p>Ceremony Start: {ceremonyStartTime || "TBD"}</p>
                <p>Officiant: {officiantName || "TBD"}</p>
                <p>Microphones: {microphoneNeeds || "TBD"}</p>
                <p>Internal Notes: {eventSettings.internalNotes || "None"}</p>
                <p>Client Notes: {eventSettings.clientFacingNotes || "None"}</p>
              </div>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Timeline</SectionTitle>
              <div className="mt-3 space-y-2">
                {mergedTimelineItems.map((item) => (
                  <div key={`${item.source}-${item.id}`} className="rounded-xl bg-white/5 p-3 text-xs">
                    <p className="text-zinc-100">
                      {item.time || "TBD"} - {item.title}
                    </p>
                    <p className="mt-1 text-zinc-400">
                      {item.category}
                      {item.needsDjMcAttention ? " | DJ/MC Attention" : ""}
                    </p>
                    {item.notes && <p className="mt-1 text-zinc-500">{item.notes}</p>}
                  </div>
                ))}
              </div>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Ceremony Songs and Notes</SectionTitle>
              <div className="mt-3 space-y-2 text-xs text-zinc-300">
                <p>
                  Wedding Party Processional: {weddingPartyProcessional.title || "TBD"}
                  {weddingPartyProcessional.artist
                    ? ` - ${weddingPartyProcessional.artist}`
                    : ""}
                </p>
                <p>
                  Bride/Groom Processional: {brideGroomProcessional.title || "TBD"}
                  {brideGroomProcessional.artist ? ` - ${brideGroomProcessional.artist}` : ""}
                </p>
                <p>
                  Unity Ceremony: {unityCeremonySong.title || "TBD"}
                  {unityCeremonySong.artist ? ` - ${unityCeremonySong.artist}` : ""}
                </p>
                <p>
                  Recessional: {recessionalSong.title || "TBD"}
                  {recessionalSong.artist ? ` - ${recessionalSong.artist}` : ""}
                </p>
                <p className="text-zinc-500">Notes: {ceremonyNotes || "None"}</p>
              </div>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Formal Dances</SectionTitle>
              <div className="mt-3 space-y-2">
                {formalities.map((item) => (
                  <div key={`${item.id}-prep`} className="rounded-xl bg-white/5 p-3 text-xs">
                    <p className="text-zinc-100">
                      {item.time || "TBD"} - {item.momentName}
                    </p>
                    <p className="mt-1 text-zinc-400">
                      {item.songTitle || "Song TBD"}
                      {item.artist ? ` - ${item.artist}` : ""}
                    </p>
                    <p className="mt-1 text-zinc-500">
                      {item.includeInTimeline ? "In Timeline" : "Not in Timeline"}
                      {item.needsDjMcAttention ? " | DJ/MC Attention" : ""}
                      {item.fadeOutEarly
                        ? ` | Fade ${item.fadeOutTimestamp || "TBD"}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Must Play Songs</SectionTitle>
              <ul className="mt-3 space-y-1 text-xs text-zinc-300">
                {mustPlaySongs.map((song) => (
                  <li key={`${song.id}-prep`}>
                    {song.title}
                    {song.artist ? ` - ${song.artist}` : ""}
                    {song.highPriority ? " (Priority)" : ""}
                  </li>
                ))}
              </ul>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Do Not Play Songs</SectionTitle>
              <ul className="mt-3 space-y-1 text-xs text-zinc-300">
                {doNotPlaySongs.map((song) => (
                  <li key={`${song.id}-block`}>
                    {song.title}
                    {song.artist ? ` - ${song.artist}` : ""}
                  </li>
                ))}
              </ul>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Guest Requests</SectionTitle>
              <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                {guestRequests.map((request) => (
                  <li key={`${request.id}-prep`} className="rounded-lg bg-white/5 px-2 py-2">
                    <span className="font-medium text-zinc-100">{request.songTitle}</span>
                    {request.artist ? ` - ${request.artist}` : ""}
                    <span className="text-zinc-500"> · {request.guestName}</span>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase ${guestRequestStatusBadgeClass(request.status)}`}
                    >
                      {request.status}
                    </span>
                  </li>
                ))}
              </ul>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">General DJ Notes</SectionTitle>
              <div className="mt-3">
                <TextArea
                  id="general-dj-notes"
                  label="General DJ Notes"
                  value={generalDjNotes}
                  onChange={setGeneralDjNotes}
                  rows={4}
                  placeholder="Add live event notes, reminders, and technical prep..."
                />
              </div>
            </PremiumCard>

            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">MC Announcements</SectionTitle>
              <div className="mt-3">
                <TextArea
                  id="mc-announcements"
                  label="MC Announcements"
                  value={mcAnnouncements}
                  onChange={setMcAnnouncements}
                  rows={4}
                  placeholder="Add key MC script points and announcement sequence..."
                />
              </div>
            </PremiumCard>
            <PremiumCard className="bg-[#16161c]">
              <SectionTitle className="text-zinc-100">Prep Sheet Footer</SectionTitle>
              <p className="mt-2 text-xs text-zinc-400">{effectivePrepSheetFooter}</p>
            </PremiumCard>
          </section>
        )}

        {authStage === "app" && appMode === "event" && activeScreen === "Event Settings" && (
          <section className="mt-6 space-y-3">
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
                  label="Couple Names"
                  value={eventSettings.coupleNames}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, coupleNames: value }))}
                />
                <TextInput
                  id="event-settings-event-type"
                  label="Event Type"
                  value={eventSettings.eventType}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, eventType: value }))}
                  placeholder={appSettings.defaultEventType}
                />
                <TextInput
                  id="event-settings-date"
                  label="Wedding Date"
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
                <TextInput
                  id="event-settings-assigned-dj"
                  label="Assigned DJ"
                  value={eventSettings.assignedDj}
                  onChange={(value) => setEventSettings((prev) => ({ ...prev, assignedDj: value }))}
                />
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

        {authStage === "app" && appMode === "event" && activeScreen === "Planning Checklist" && (
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
                    Go to {task.linkedSection}
                  </PrimaryButton>
                </div>
              </PremiumCard>
            ))}
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
                <p className="text-xs text-zinc-500">No activity matches the current filters.</p>
              </PremiumCard>
            )}
          </section>
        )}
      </main>

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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b14]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle className="text-[#e9d5a8]">
                {eventModalMode === "new" ? "New Event" : "Edit Event"}
              </SectionTitle>
              <PrimaryButton
                onClick={() => {
                  setEventModalOpen(false);
                  setEventEditingId(null);
                }}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Close
              </PrimaryButton>
            </div>

            <div className="mt-4 space-y-3">
              <TextInput
                id="event-couple"
                label="Event Name"
                value={eventDraft.couple}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, couple: value }))
                }
                placeholder="e.g. Matt & Chaandra"
              />
              <TextInput
                id="event-date"
                label="Wedding Date"
                value={eventDraft.date}
                onChange={(value) =>
                  setEventDraft((prev) => ({ ...prev, date: value }))
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
              {eventModalMode === "new" && (
                <div>
                  <label
                    htmlFor="event-template"
                    className="text-[11px] uppercase tracking-wide text-zinc-400"
                  >
                    Apply Template
                  </label>
                  <select
                    id="event-template"
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 transition focus:border-[#c9a35c]/70 focus:outline-none"
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id} className="bg-[#141419] text-zinc-100">
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Defaults: {effectiveEventType} · {effectiveTimezone}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <PrimaryButton
                onClick={() => {
                  setEventModalOpen(false);
                  setEventEditingId(null);
                }}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/15"
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                onClick={handleSaveEventModal}
                className="w-full rounded-xl bg-gradient-to-r from-[#8f6b2f] to-[#c9a35c] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
              >
                {eventModalMode === "new" ? "Create" : "Save"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {authStage === "app" && appMode === "event" && (
        <BottomNav
          items={navItems}
          activeScreen={activeScreen}
          onSelect={setActiveScreen}
        />
      )}
    </div>
  );
}
