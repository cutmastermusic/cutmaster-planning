import type { EventStatus } from "@/lib/eventStatus";

export type { EventStatus };

export type ChecklistDueDate =
  | { type: "relative"; offsetDays: number }
  | { type: "custom"; date: string };

export type Screen =
  | "All Events"
  | "Team"
  | "Dashboard"
  | "Command Center"
  | "Music Hub"
  | "Timeline"
  | "Timeline Templates"
  | "Guest Requests"
  | "Ceremony"
  | "Reception Hub"
  /** Couple/staff entry from Reception Hub — same editor as Timeline */
  | "Reception Timeline"
  | "Event Prep"
  | "Notes"
  /** DJ/admin-only operational scripts (not client-facing, not in Event Document). */
  | "Scripts"
  /** Unified people & contacts (vendors + app access); replaces legacy Vendors / Collaborators screens. */
  | "Event Team"
  | "Planning Checklist"
  | "Planning Questions"
  /** Guided planning dashboard shell that fronts the planning experience. */
  | "Planning Assistant"
  | "Notification Center"
  | "Settings"
  | "Event Settings";

export type AppMode = "events" | "event";
export type AuthStage = "login" | "invite" | "app";
export type SongListType = "mustPlay" | "doNotPlay" | "playIfPossible";
export type GuestRequestStatus = "Pending" | "Approved" | "Rejected";
export type ChecklistStatus = "Not Started" | "In Progress" | "Complete";
export type TimelineCategory =
  | "Ceremony"
  | "Cocktail Hour"
  | "Reception"
  | "Formalities"
  | "Dancing"
  | "Other";
export type UserRole = "Couple" | "DJ" | "Planner" | "Admin";
export type InviteStatus = "Pending" | "Accepted";

/**
 * How a timeline item's Shared Team Cue (notes) should render in Run Of Show.
 * Missing/null is treated as "plain" everywhere.
 */
export type TeamCueFormat = "plain" | "bullets" | "numbered";

export type SongEntry = {
  id: string;
  title: string;
  artist?: string;
  notes?: string;
  spotifyId?: string;
  album?: string;
  albumArt?: string;
  albumArtSmall?: string;
  highPriority: boolean;
};

export type SongRequest = {
  id: string;
  guestName: string;
  songTitle: string;
  artist: string;
  dedication: string;
  status: GuestRequestStatus;
  addedToMustPlay: boolean;
  addedToDoNotPlay: boolean;
};

export type TimelineMomentType =
  | "ceremony"
  | "playlist"
  | "introduction"
  | "speech"
  | "meal"
  | "dance"
  | "tradition"
  | "photo"
  | "open_dance"
  | "exit"
  | "custom";

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  category: TimelineCategory;
  notes: string;
  needsDjMcAttention: boolean;
  /** Optional persisted moment type; inferred from title when absent. */
  momentType?: TimelineMomentType;
  /** Song cue for reception/main timeline rows (optional for legacy persisted events). */
  songTitle?: string;
  artist?: string;
  /** Optional DJ cue detail (formerly on separate formalities rows). */
  fadeOutEarly?: boolean;
  fadeOutTimestamp?: string;
  /** Run Of Show execution: moment marked complete (persisted on timeline row). */
  runOfShowDone?: boolean;
  /** How the Shared Team Cue (notes) renders in Run Of Show. Defaults to "plain". */
  teamCueFormat?: TeamCueFormat;
};

export type Formality = {
  id: string;
  momentName: string;
  time: string;
  songTitle: string;
  artist: string;
  notes: string;
  fadeOutEarly: boolean;
  fadeOutTimestamp: string;
  includeInTimeline: boolean;
  needsDjMcAttention: boolean;
};

export type DisplayTimelineItem = {
  id: string;
  source: "timeline";
  time: string;
  title: string;
  category: TimelineCategory;
  notes: string;
  needsDjMcAttention: boolean;
  momentType?: TimelineMomentType;
  songTitle?: string;
  artist?: string;
  fadeOutEarly?: boolean;
  fadeOutTimestamp?: string;
  teamCueFormat?: TeamCueFormat;
};

export type CeremonyPlan = {
  title: string;
  artist: string;
  notes: string;
};

export type CeremonyCoverageStatus = "provided" | "not_provided" | "unknown";

/** DB-backed ceremony planning fields (Event.ceremonyPlan JSON). */
export type ClientEventDetailsSnapshot = {
  coupleNames: string;
  eventStartTime: string;
  eventEndTime: string;
  guestRequestMessageOverride: string;
};

export type EventCeremonyPlanSnapshot = {
  ceremonyStartTime: string;
  ceremonyGuestArrivalTime: string;
  officiantName: string;
  ceremonyNotes: string;
  microphoneNeeds: string;
  weddingPartyProcessional: CeremonyPlan;
  brideGroomProcessional: CeremonyPlan;
  unityCeremonySong: CeremonyPlan;
  recessionalSong: CeremonyPlan;
  /** Client-safe Event Settings fields without dedicated DB columns. */
  clientEventDetails?: ClientEventDetailsSnapshot;
  /** Staff-owned: whether Cutmaster provides ceremony audio for this event. */
  ceremonyCoverageStatus?: CeremonyCoverageStatus;
};

export type CeremonyTimelineItem = {
  id: string;
  timeOrOrder: string;
  moment: string;
  songTitle: string;
  artist: string;
  notes: string;
  needsDjMcAttention: boolean;
  runOfShowDone?: boolean;
  /** How the Shared Team Cue (notes) renders in Run Of Show. Defaults to "plain". */
  teamCueFormat?: TeamCueFormat;
};

export type PlanningInsight = {
  id: string;
  section: "timeline" | "music" | "ceremony" | "guest";
  variant: "warning" | "suggestion";
  message: string;
};

export type WeddingDetails = {
  couple: string;
  date: string;
  venue: string;
};

export type Collaborator = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: InviteStatus;
};

export type VendorType =
  | "Planner"
  | "Photographer"
  | "Videographer"
  | "Venue"
  | "Caterer"
  | "Bar"
  | "Florist"
  | "Hair/Makeup"
  | "DJ/Entertainment"
  | "Transportation"
  | "Photo Booth"
  | "Officiant"
  | "Content Creator"
  | "Other";

/** Internal Cutmaster staff on the event vs external partners (default when omitted). */
export type VendorAffiliation = "cutmaster_event_team" | "event_partner";

export type Vendor = {
  id: string;
  vendorType: VendorType;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  website: string;
  instagram: string;
  arrivalTime: string;
  specialCoordinationNotes: string;
  affiliation?: VendorAffiliation;
};

/**
 * Internal Cutmaster staff roles. Kept as a literal union for permission
 * checks (e.g. "Admin" gates most settings UIs) and for legacy data that
 * predates the unified Event Team concept.
 */
export type InternalTeamRole = "Admin" | "DJ" | "Planner";

/**
 * Any role that can appear on the unified Event Team. Includes the three
 * internal roles plus every {@link VendorType} so a single roster can
 * hold both internal staff and external vendors (venue, photographer,
 * catering, entertainment, etc.).
 */
export type TeamMemberRole = InternalTeamRole | VendorType;

/** Persisted per-event note (DB-backed via EventNote). */
export type EventNote = {
  id: string;
  category: string;
  title: string;
  body: string;
  isPinned: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  role: TeamMemberRole;
  email: string;
  phone: string;
  notes: string;
  /** Vendor company name (blank for internal staff). */
  company?: string;
  /** Optional vendor URL. */
  website?: string;
  /** Optional vendor social handle (Instagram). */
  instagram?: string;
  /** Day-of arrival/load-in time as free-form text. */
  arrivalTime?: string;
  /** Special coordination notes (parking, power, ceremony cues, etc.). */
  specialCoordinationNotes?: string;
  isActive: boolean;
};

export type InviteAccessPreview = {
  eventId: string;
  role: UserRole;
  token: string;
  link: string;
};

/** Stable ids for editable playlist buckets (persisted via optional overrides). */
export type PlaylistBucketId =
  | "cocktailHour"
  | "dinner"
  | "openDancing"
  | "afterparty"
  | "custom";

export const PLAYLIST_BUCKET_LABELS: Record<PlaylistBucketId, string> = {
  cocktailHour: "Cocktail Hour",
  dinner: "Dinner",
  openDancing: "Open Dancing",
  afterparty: "Afterparty",
  custom: "Custom",
};

export const PLAYLIST_BUCKET_IDS: PlaylistBucketId[] = [
  "cocktailHour",
  "dinner",
  "openDancing",
  "afterparty",
  "custom",
];

/** Client-shared streaming playlist (links only — no automated extraction in V1). */
export type SharedPlaylistLink = {
  id: string;
  url: string;
  label?: string;
  notes?: string;
};

/** Optional structured fields for Music Hub / DJ vibe (stored on the event). */
export type MusicVibeDetail = {
  genres?: string;
  energy?: string;
  crowdNotes?: string;
  cleanMusicPrefs?: string;
};

/**
 * Structured music taste signals for DJs (and future tooling).
 * Stored on the event; keep labels stable for downstream consumers.
 */
export type MusicTasteProfile = {
  danceFloorStyles: string[];
  crowdPreferences: string[];
  musicBehavior: string[];
  /** Line dances & group songs the couple welcomes (or not). */
  lineDancesAndGroupSongs?: string[];
  /** Optional freeform dance-floor vibe. */
  danceFloorVibeNotes?: string;
};

export type Event = {
  id: string;
  meta: WeddingDetails;
  /** Unix ms — last planning save for sorting "recently updated". */
  lastUpdatedAt: number;
  collaborators: Collaborator[];
  timelineItems: TimelineItem[];
  ceremonyTimelineItems: CeremonyTimelineItem[];
  formalities: Formality[];
  mustPlaySongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  ceremonyStartTime: string;
  ceremonyGuestArrivalTime: string;
  officiantName: string;
  ceremonyNotes: string;
  microphoneNeeds: string;
  weddingPartyProcessional: CeremonyPlan;
  brideGroomProcessional: CeremonyPlan;
  unityCeremonySong: CeremonyPlan;
  recessionalSong: CeremonyPlan;
  plannerNotes: string[];
  guestRequests: SongRequest[];
  generalDjNotes: string;
  mcAnnouncements: string;
  /** Full playlist line lists per bucket; replaces merged defaults when set for that bucket. */
  playlistVibeOverrides?: Partial<Record<PlaylistBucketId, string[]>>;
  /** Spotify, Apple Music, YouTube, etc. — URLs + labels for the DJ. */
  musicPlaylistLinks?: SharedPlaylistLink[];
  /** Selected genre / era chips from Music Hub. */
  musicGenreEraSelections?: string[];
  /** Nice-to-have songs (optional list). */
  playIfPossibleSongs?: SongEntry[];
  musicVibeDetail?: MusicVibeDetail;
  /** Structured taste tags + optional vibe notes (Music Hub). */
  musicTasteProfile?: MusicTasteProfile;
  vendors: Vendor[];
  /** DJ/admin operational scripts (DB-backed via Event.djScripts JSON column). */
  djScripts?: DjScripts;
  /** DJ/admin operational music notes (DB-backed via Event.djMusicNotes JSON column). */
  djMusicNotes?: DjMusicNotes;
  settings: EventSettings;
};

/**
 * A single DJ-only operational script entry (Show Book Phase 1).
 * DJs/admins can add, rename, edit, and delete entries per event.
 */
export type DjScriptEntry = {
  id: string;
  title: string;
  body: string;
  order: number;
};

/**
 * DJ-only operational scripts. Stored as a single JSON array on
 * Event.djScripts. Never shown to clients and excluded from the Event Document.
 */
export type DjScripts = DjScriptEntry[];

/**
 * A single DJ-only operational music note (Show Book Phase 1).
 * Operational guidance like genres, eras, or reminders — not the Must/Do-Not
 * Play playlist and not client-facing music planning.
 */
export type DjMusicNote = {
  id: string;
  text: string;
  order: number;
};

/**
 * DJ-only operational music notes. Stored as a single JSON array on
 * Event.djMusicNotes. Never shown to clients and excluded from the Event
 * Document. Defaults to an empty list (no seeded sample content).
 */
export type DjMusicNotes = DjMusicNote[];

export type TimelineTemplate = {
  id: string;
  name: string;
  kind: "built_in" | "custom";
  timelineItems: TimelineItem[];
  formalities: Formality[];
  planningSuggestions: string[];
};

export type AppSettings = {
  companyName: string;
  appName: string;
  logoUrl: string;
  brandColor: string;
  accentColor: string;
  defaultEventTimezone: string;
  defaultEventType: string;
  prepSheetFooterText: string;
  publicGuestRequestMessage: string;
  coupleWelcomeMessage: string;
  /** Admin default welcome photo (data URL) for new Couple Portal dashboards. */
  defaultWelcomePhotoDataUrl?: string;
  /** Pan/zoom framing for the global default welcome photo. */
  defaultWelcomePhotoTransform?: CoverPhotoTransform;
  globalTemplateDefaults: string;
  planningQuestionSets: Partial<Record<EventSettings["eventLayoutProfile"], PlanningQuestionDef[]>>;
  timelinePresetSets: Partial<Record<EventSettings["eventLayoutProfile"], TimelinePresetItem[]>>;
  /** Admin default checklist due dates per event type. */
  checklistDueDateSets?: Partial<Record<EventSettings["eventLayoutProfile"], Record<string, ChecklistDueDate>>>;
  /** @deprecated Use checklistDueDateSets. */
  checklistDueOffsetSets?: Partial<Record<EventSettings["eventLayoutProfile"], Record<string, number>>>;
};

export type PlanningQuestionAnswerType =
  | "short_text"
  | "long_text"
  | "yes_no"
  | "multiple_choice"
  | "song"
  | "contact";

export type PlanningQuestionDef = {
  id: string;
  label: string;
  helpText: string;
  answerType: PlanningQuestionAnswerType;
  required: boolean;
  showInLiveEventMode: boolean;
  /** Section bucket for grouped Planning Questions UI (event-type-specific group ids). */
  sectionGroup?: string;
  options?: string[];
  placeholder?: string;
};

export type TimelinePresetItem = {
  id: string;
  timelineType: "ceremony" | "main";
  timeOrOrder: string;
  momentName: string;
  songPlaceholder: string;
  notesPlaceholder: string;
  defaultIncluded: boolean;
  /** Reception/main timeline category when this preset is applied (defaults to Reception). */
  timelineCategory?: TimelineCategory;
};

/** Pan/zoom framing for the couple dashboard welcome photo hero. */
export type CoverPhotoTransform = {
  scale: number;
  /** Horizontal offset as % of hero frame width. */
  x: number;
  /** Vertical offset as % of hero frame height. */
  y: number;
  /** Image width at scale 1, as % of frame width (contain-fit baseline). */
  baseWidthPercent: number;
  /** Image height at scale 1, as % of frame height (contain-fit baseline). */
  baseHeightPercent: number;
};

export type EventSettings = {
  eventLayoutProfile:
    | "Wedding"
    | "Gender-Neutral Wedding"
    | "Corporate"
    | "Holiday Party"
    | "Graduation Celebration"
    | "Birthday Party"
    | "Bar/Club Event"
    | "School Dance"
    | "Private Party";
  eventName: string;
  coupleNames: string;
  eventType: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  ceremonyLocation: string;
  receptionLocation: string;
  eventStartTime: string;
  eventEndTime: string;
  assignedDj: string;
  plannerName: string;
  plannerEmail: string;
  packageName: string;
  internalNotes: string;
  clientFacingNotes: string;
  guestRequestMessageOverride: string;
  prepSheetFooterOverride: string;
  coupleWelcomeMessageOverride: string;
  liveEventShowMusicNotes: boolean;
  liveEventShowDoNotPlay: boolean;
  liveEventShowVendorContacts: boolean;
  liveEventShowMcScript: boolean;
  liveEventShowPlaylists: boolean;
  liveEventShowPlanningQuestions: boolean;
  liveEventShowGuestRequests: boolean;
  liveEventCompactMode: boolean;
  liveEventLargePrintMode: boolean;
  sectionCeremonyEnabled: boolean;
  sectionReceptionTimelineEnabled: boolean;
  sectionPlaylistsEnabled: boolean;
  sectionMustPlayEnabled: boolean;
  sectionDoNotPlayEnabled: boolean;
  sectionMcScriptEnabled: boolean;
  sectionVendorContactsEnabled: boolean;
  sectionMusicNotesEnabled: boolean;
  sectionGuestRequestsEnabled: boolean;
  sectionFormalitiesEnabled: boolean;
  sectionPlanningChecklistEnabled: boolean;
  sectionPlanningQuestionsEnabled: boolean;
  planningQuestionAnswers: Record<string, string>;
  /** Per-task checklist due date (relative to event or custom fixed date). */
  checklistDueDates: Record<string, ChecklistDueDate>;
  /** @deprecated Use checklistDueDates with ChecklistDueDate objects. */
  checklistDueOffsets?: Record<string, number>;
  checklistManualStatuses: Record<string, ChecklistStatus>;
  /** Per-task operator sign-off: task scope handled for this event (Admin/DJ only). */
  checklistHandledTasks?: Record<string, true>;
  /** HTTPS URL, data URL while editing, or transient local preview. */
  coverPhotoDataUrl?: string;
  /** Supabase Storage object path when persisted to the database. */
  coverPhotoStoragePath?: string;
  /** Pan/zoom framing for couple dashboard welcome photo. */
  coverPhotoTransform?: CoverPhotoTransform;
  /** True after the couple uploads their first custom welcome photo; onboarding never reappears. */
  hasPersonalizedWelcomePhoto?: boolean;
  /** Planning/execution stage; defaults to Planning when missing. */
  eventStatus?: EventStatus;
  /** ISO timestamp for the couple's simple timeline review request. Editing remains open. */
  timelineReviewRequestedAt?: string;
  /** Whether Cutmaster provides ceremony audio; defaults by event type when missing. */
  ceremonyCoverageStatus?: CeremonyCoverageStatus;
};

export type ActivityType =
  | "event_created"
  | "timeline_updated"
  | "timeline_item_added"
  | "song_added"
  | "guest_request_submitted"
  | "guest_request_reviewed"
  | "ceremony_updated"
  | "formality_updated"
  | "collaborator_invited"
  | "collaborator_removed_from_event"
  | "team_member_added"
  | "team_member_assigned"
  | "team_member_removed_from_event"
  | "vendor_updated"
  | "checklist_completed"
  | "template_applied";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  summary: string;
  userRole: UserRole;
  eventId: string;
  eventName: string;
  timestamp: number;
  unread: boolean;
};

export type NotificationItem = {
  id: string;
  type: ActivityType | "system";
  summary: string;
  eventId: string;
  eventName: string;
  timestamp: number;
  unread: boolean;
};

// Backward-compatible aliases for existing component code.
export type EventRecord = Event;
export type FormalityItem = Formality;
export type CeremonySongPlan = CeremonyPlan;
export type GuestRequestEntry = SongRequest;
