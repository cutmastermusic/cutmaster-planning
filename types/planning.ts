export type Screen =
  | "All Events"
  | "Team"
  | "Dashboard"
  | "Command Center"
  | "Music"
  | "Music Import"
  | "Timeline"
  | "Timeline Templates"
  | "Collaborators"
  | "Guest Requests"
  | "Ceremony"
  | "Formal Dances"
  | "Event Prep"
  | "Vendors"
  | "Notes"
  | "Planning Checklist"
  | "Planning Questions"
  | "Notification Center"
  | "Settings"
  | "Event Settings";

export type AppMode = "events" | "event";
export type AuthStage = "login" | "invite" | "app";
export type SongListType = "mustPlay" | "doNotPlay";
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

export type SongEntry = {
  id: string;
  title: string;
  artist?: string;
  notes?: string;
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

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  category: TimelineCategory;
  notes: string;
  needsDjMcAttention: boolean;
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
  source: "timeline" | "formality";
  time: string;
  title: string;
  category: TimelineCategory | "Formality";
  notes: string;
  needsDjMcAttention: boolean;
};

export type CeremonyPlan = {
  title: string;
  artist: string;
  notes: string;
};

export type CeremonyTimelineItem = {
  id: string;
  timeOrOrder: string;
  moment: string;
  songTitle: string;
  artist: string;
  notes: string;
  needsDjMcAttention: boolean;
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
  | "Florist"
  | "Hair/Makeup"
  | "Photo Booth"
  | "Officiant"
  | "Band"
  | "Content Creator"
  | "Other";

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
};

export type TeamMember = {
  id: string;
  name: string;
  role: "Admin" | "DJ" | "Planner";
  email: string;
  phone: string;
  notes: string;
  isActive: boolean;
};

export type InviteAccessPreview = {
  eventId: string;
  role: UserRole;
  token: string;
  link: string;
};

export type Event = {
  id: string;
  meta: WeddingDetails;
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
  vendors: Vendor[];
  settings: EventSettings;
};

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
  globalTemplateDefaults: string;
  planningQuestionSets: Partial<Record<EventSettings["eventLayoutProfile"], PlanningQuestionDef[]>>;
  timelinePresetSets: Partial<Record<EventSettings["eventLayoutProfile"], TimelinePresetItem[]>>;
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
  checklistDueDates: Record<string, string>;
  checklistManualStatuses: Record<string, ChecklistStatus>;
};

export type ActivityType =
  | "event_created"
  | "timeline_updated"
  | "song_added"
  | "guest_request_submitted"
  | "guest_request_reviewed"
  | "ceremony_updated"
  | "formality_updated"
  | "collaborator_invited"
  | "team_member_added"
  | "team_member_assigned"
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
