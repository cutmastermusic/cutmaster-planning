import type {
  CeremonyTimelineItem,
  CeremonySongPlan,
  Collaborator,
  EventRecord,
  FormalityItem,
  GuestRequestEntry,
  Screen,
  SongEntry,
  TimelineCategory,
  TimelineItem,
  TimelineTemplate,
  AppSettings,
  EventSettings,
  TeamMember,
  TimelinePresetItem,
  Vendor,
} from "@/types/planning";
import { getDefaultPlanningQuestionSets } from "@/data/planningQuestionsCatalog";
import { getDefaultChecklistDueDateSetsForProfiles } from "@/lib/planningChecklist";
import { migrateFormalitiesIntoTimelineItems } from "@/utils/planning";

type SeedEventPlanningPayload = {
  timelineItems: TimelineItem[];
  ceremonyTimelineItems: CeremonyTimelineItem[];
  formalities: FormalityItem[];
  mustPlaySongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  ceremonyStartTime: string;
  ceremonyGuestArrivalTime: string;
  officiantName: string;
  ceremonyNotes: string;
  microphoneNeeds: string;
  weddingPartyProcessional: CeremonySongPlan;
  brideGroomProcessional: CeremonySongPlan;
  unityCeremonySong: CeremonySongPlan;
  recessionalSong: CeremonySongPlan;
  plannerNotes: string[];
  vendors: Vendor[];
  guestRequests: GuestRequestEntry[];
  generalDjNotes: string;
  mcAnnouncements: string;
};

/** Default timeline preset rows per event type (Global Settings → Timeline Presets). */
export const getDefaultTimelinePresetSets = (): Record<
  EventSettings["eventLayoutProfile"],
  TimelinePresetItem[]
> => ({
  Wedding: [
    { id: "w-main-1", timelineType: "main", timeOrOrder: "", momentName: "Cocktail Hour", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Cocktail Hour" },
    { id: "w-main-2", timelineType: "main", timeOrOrder: "", momentName: "Grand Entrance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-3", timelineType: "main", timeOrOrder: "", momentName: "Welcome Speech", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "w-main-4", timelineType: "main", timeOrOrder: "", momentName: "Blessing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "w-main-5", timelineType: "main", timeOrOrder: "", momentName: "Dinner", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "w-main-6", timelineType: "main", timeOrOrder: "", momentName: "Toasts", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-7", timelineType: "main", timeOrOrder: "", momentName: "Cake Cutting", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-8", timelineType: "main", timeOrOrder: "", momentName: "First Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-9", timelineType: "main", timeOrOrder: "", momentName: "Father/Daughter Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-10", timelineType: "main", timeOrOrder: "", momentName: "Mother/Son Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-11", timelineType: "main", timeOrOrder: "", momentName: "Bouquet Toss", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-12", timelineType: "main", timeOrOrder: "", momentName: "Garter Toss", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "w-main-13", timelineType: "main", timeOrOrder: "", momentName: "Open Dancing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "w-main-14", timelineType: "main", timeOrOrder: "", momentName: "Last Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
  ],
  "Gender-Neutral Wedding": [
    { id: "gnw-main-1", timelineType: "main", timeOrOrder: "", momentName: "Cocktail Hour", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Cocktail Hour" },
    { id: "gnw-main-2", timelineType: "main", timeOrOrder: "", momentName: "Grand Entrance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-3", timelineType: "main", timeOrOrder: "", momentName: "Welcome Speech", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "gnw-main-4", timelineType: "main", timeOrOrder: "", momentName: "Blessing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "gnw-main-5", timelineType: "main", timeOrOrder: "", momentName: "Dinner", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "gnw-main-6", timelineType: "main", timeOrOrder: "", momentName: "Toasts", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-7", timelineType: "main", timeOrOrder: "", momentName: "Cake Cutting", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-8", timelineType: "main", timeOrOrder: "", momentName: "First Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-9", timelineType: "main", timeOrOrder: "", momentName: "Father/Daughter Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-10", timelineType: "main", timeOrOrder: "", momentName: "Mother/Son Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-11", timelineType: "main", timeOrOrder: "", momentName: "Bouquet Toss", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-12", timelineType: "main", timeOrOrder: "", momentName: "Garter Toss", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Formalities" },
    { id: "gnw-main-13", timelineType: "main", timeOrOrder: "", momentName: "Open Dancing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "gnw-main-14", timelineType: "main", timeOrOrder: "", momentName: "Last Dance", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
  ],
  Corporate: [
    { id: "co-main-1", timelineType: "main", timeOrOrder: "", momentName: "Guest Arrival", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "co-main-2", timelineType: "main", timeOrOrder: "", momentName: "Cocktail / Networking", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Cocktail Hour" },
    { id: "co-main-3", timelineType: "main", timeOrOrder: "", momentName: "Welcome Remarks", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "co-main-4", timelineType: "main", timeOrOrder: "", momentName: "Dinner", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "co-main-5", timelineType: "main", timeOrOrder: "", momentName: "Awards / Recognition", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "co-main-6", timelineType: "main", timeOrOrder: "", momentName: "Presentation / Speaker", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "co-main-7", timelineType: "main", timeOrOrder: "", momentName: "Open Networking / Dancing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "co-main-8", timelineType: "main", timeOrOrder: "", momentName: "Closing Remarks", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
  ],
  "Holiday Party": [
    { id: "hp-main-1", timelineType: "main", timeOrOrder: "", momentName: "Guest Arrival", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "hp-main-2", timelineType: "main", timeOrOrder: "", momentName: "Cocktail Hour", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Cocktail Hour" },
    { id: "hp-main-3", timelineType: "main", timeOrOrder: "", momentName: "Welcome Remarks", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "hp-main-4", timelineType: "main", timeOrOrder: "", momentName: "Dinner", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "hp-main-5", timelineType: "main", timeOrOrder: "", momentName: "Awards / Raffle", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "hp-main-6", timelineType: "main", timeOrOrder: "", momentName: "Dancing / Entertainment", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "hp-main-7", timelineType: "main", timeOrOrder: "", momentName: "Closing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
  ],
  "Graduation Celebration": [
    { id: "gc-main-1", timelineType: "main", timeOrOrder: "", momentName: "Guest Arrival", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
    { id: "gc-main-2", timelineType: "main", timeOrOrder: "", momentName: "Family / Special Moments", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
    { id: "gc-main-3", timelineType: "main", timeOrOrder: "", momentName: "Open Dancing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
  ],
  "Birthday Party": [
    { id: "bd-main-1", timelineType: "main", timeOrOrder: "", momentName: "Guest Arrival", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
    { id: "bd-main-2", timelineType: "main", timeOrOrder: "", momentName: "Special Moments", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
    { id: "bd-main-3", timelineType: "main", timeOrOrder: "", momentName: "Open Dancing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
  ],
  "Private Party": [
    { id: "pp-main-1", timelineType: "main", timeOrOrder: "", momentName: "Guest Arrival", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
    { id: "pp-main-2", timelineType: "main", timeOrOrder: "", momentName: "Main Event Timeline", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
    { id: "pp-main-3", timelineType: "main", timeOrOrder: "", momentName: "Open Dancing", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true },
  ],
  "Bar/Club Event": [
    { id: "bc-main-1", timelineType: "main", timeOrOrder: "", momentName: "Doors Open", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "bc-main-2", timelineType: "main", timeOrOrder: "", momentName: "Opening Set", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "bc-main-3", timelineType: "main", timeOrOrder: "", momentName: "Peak Hour", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "bc-main-4", timelineType: "main", timeOrOrder: "", momentName: "Special Announcement", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "bc-main-5", timelineType: "main", timeOrOrder: "", momentName: "Last Call", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "bc-main-6", timelineType: "main", timeOrOrder: "", momentName: "Closing Track", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
  ],
  "School Dance": [
    { id: "sd-main-1", timelineType: "main", timeOrOrder: "", momentName: "Doors Open", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "sd-main-2", timelineType: "main", timeOrOrder: "", momentName: "Warm-Up Set", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "sd-main-3", timelineType: "main", timeOrOrder: "", momentName: "Announcements", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Reception" },
    { id: "sd-main-4", timelineType: "main", timeOrOrder: "", momentName: "Dance Block", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "sd-main-5", timelineType: "main", timeOrOrder: "", momentName: "Slow Set", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
    { id: "sd-main-6", timelineType: "main", timeOrOrder: "", momentName: "Last Song", songPlaceholder: "", notesPlaceholder: "", defaultIncluded: true, timelineCategory: "Dancing" },
  ],
});

export const initialMustPlaySongs: SongEntry[] = [
  {
    id: "must-1",
    title: "September",
    artist: "Earth, Wind & Fire",
    notes: "Play during first 30 mins of open dancing.",
    highPriority: true,
  },
  {
    id: "must-2",
    title: "I Wanna Dance with Somebody",
    artist: "Whitney Houston",
    notes: "Pair with bridesmaid dance circle moment.",
    highPriority: false,
  },
];

export const initialDoNotPlaySongs: SongEntry[] = [
  {
    id: "no-1",
    title: "Chicken Dance",
    notes: "Couple strongly prefers modern set energy.",
    highPriority: true,
  },
  { id: "no-2", title: "Macarena", highPriority: false },
];

export const initialGuestRequests: GuestRequestEntry[] = [
  {
    id: "gr-1",
    guestName: "Taylor M.",
    songTitle: "Shut Up and Dance",
    artist: "WALK THE MOON",
    dedication: "For the whole wedding crew!",
    status: "Pending",
    addedToMustPlay: false,
    addedToDoNotPlay: false,
  },
  {
    id: "gr-2",
    guestName: "Chris R.",
    songTitle: "Ain't No Mountain High Enough",
    artist: "Marvin Gaye",
    dedication: "",
    status: "Pending",
    addedToMustPlay: false,
    addedToDoNotPlay: false,
  },
  {
    id: "gr-3",
    guestName: "Jordan L.",
    songTitle: "Mr. Brightside",
    artist: "The Killers",
    dedication: "Open dancing energy!",
    status: "Approved",
    addedToMustPlay: false,
    addedToDoNotPlay: false,
  },
];

/** Demo reception timeline — structure-first (times/songs filled in by couple/DJ). */
export const initialTimelineItems: TimelineItem[] = [
  { id: "timeline-1", title: "Cocktail Hour", time: "", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
  { id: "timeline-2", title: "Grand Entrance", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-3", title: "Welcome Speech", time: "", category: "Reception", notes: "", needsDjMcAttention: true },
  { id: "timeline-4", title: "Blessing", time: "", category: "Reception", notes: "", needsDjMcAttention: true },
  { id: "timeline-5", title: "Dinner", time: "", category: "Reception", notes: "", needsDjMcAttention: false },
  { id: "timeline-6", title: "Toasts", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-7", title: "Cake Cutting", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-8", title: "First Dance", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-9", title: "Father/Daughter Dance", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-10", title: "Mother/Son Dance", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-11", title: "Bouquet Toss", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-12", title: "Garter Toss", time: "", category: "Formalities", notes: "", needsDjMcAttention: true },
  { id: "timeline-13", title: "Open Dancing", time: "", category: "Dancing", notes: "", needsDjMcAttention: true },
  { id: "timeline-14", title: "Last Dance", time: "", category: "Dancing", notes: "", needsDjMcAttention: true },
];

export const initialCeremonyTimelineItems: CeremonyTimelineItem[] = [
  {
    id: "ceremony-timeline-1",
    timeOrOrder: "",
    moment: "Pre-Ceremony Music",
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-2",
    timeOrOrder: "",
    moment: "Prelude",
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-3",
    timeOrOrder: "",
    moment: "Family Processional",
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-4",
    timeOrOrder: "",
    moment: "Wedding Party Processional",
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-5",
    timeOrOrder: "",
    moment: "Bride Processional",
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-6",
    timeOrOrder: "",
    moment: "During Ceremony",
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-7",
    timeOrOrder: "",
    moment: "Recessional",
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  },
];

/** Legacy field kept empty — formal moments live on {@link initialTimelineItems}. */
export const initialFormalities: FormalityItem[] = [];

/** Reception timeline seed (same as merged; legacy formalities array is empty). */
export const seedMergedTimelineItems = migrateFormalitiesIntoTimelineItems(
  initialTimelineItems,
  initialFormalities,
);

export const initialWeddingPartyProcessional: CeremonySongPlan = {
  title: "Canon in D",
  artist: "The O'Neill Brothers",
  notes: "Fade in softly as first pair starts.",
};
export const initialBrideGroomProcessional: CeremonySongPlan = {
  title: "A Thousand Years (Instrumental)",
  artist: "The Piano Guys",
  notes: "Begin at aisle doors opening.",
};
export const initialUnityCeremonySong: CeremonySongPlan = {
  title: "Stand by Me",
  artist: "Florence + The Machine",
  notes: "Play low underneath officiant guidance.",
};
export const initialRecessionalSong: CeremonySongPlan = {
  title: "Signed, Sealed, Delivered",
  artist: "Stevie Wonder",
  notes: "Start right after first kiss announcement.",
};

export const initialCeremonyNotes =
  "Coordinate with planner for final cue confirmations 10 minutes before start.";
export const initialOfficiantName = "Reverend Taylor Brooks";
export const initialCeremonyStartTime = "4:00 PM";
export const initialCeremonyGuestArrivalTime = "3:30 PM";
export const initialMicrophoneNeeds =
  "Wireless lav for officiant, handheld backup near first row.";
export const initialGeneralDjNotes =
  "Check in with planner 60 minutes before guest arrival. Confirm wireless backups and ceremony speakers.";
export const initialMcAnnouncements =
  "Welcome everyone, invite guests for cocktail hour, cue reception timeline moments (grand entrance through last dance), last call reminder, final thank-you.";
export const initialPlannerNotes: string[] = [
  "Confirm final timeline with photographer by Monday.",
  "Upload final must-play list after tasting night.",
  "Review sparkler exit safety timing with venue team.",
];

export const initialVendors: Vendor[] = [
  {
    id: "vendor-1",
    vendorType: "Photographer",
    companyName: "Lumen Wedding Photo",
    contactName: "Mia Carter",
    email: "mia@lumenphoto.com",
    phone: "(505) 555-0191",
    notes: "Golden hour portraits before sunset.",
    website: "https://lumenphoto.com",
    instagram: "@lumenphoto",
    arrivalTime: "2:00 PM",
    specialCoordinationNotes: "Coordinate first look timing with planner and DJ.",
  },
  {
    id: "vendor-2",
    vendorType: "Caterer",
    companyName: "Sage & Salt Catering",
    contactName: "Jordan Hayes",
    email: "events@sageandsalt.com",
    phone: "(505) 555-0177",
    notes: "Late-night bite opens at 9:45 PM.",
    website: "https://sageandsalt.com",
    instagram: "@sageandsalt",
    arrivalTime: "12:00 PM",
    specialCoordinationNotes: "Sync timeline with speeches and dinner service transitions.",
  },
];

export const progressCards = [
  { label: "Overall Planning", value: "74%", detail: "Most major milestones complete" },
  { label: "Music Prep", value: "68%", detail: "Ceremony + cocktail playlist pending" },
  { label: "Timeline Finalization", value: "82%", detail: "Vendor confirmations in progress" },
] as const;

export const sectionTabs: Screen[] = [
  "Dashboard",
  "Music Hub",
  "Timeline",
  "Timeline Templates",
  "Event Team",
  "Guest Requests",
  "Ceremony",
  "Notes",
  "Event Prep",
];

export const initialTeamMembers: TeamMember[] = [
  {
    id: "tm-admin-1",
    name: "Cutmaster Admin",
    role: "Admin",
    email: "admin@cutmastermusic.com",
    phone: "(505) 555-0101",
    notes: "Oversees all production and operations.",
    isActive: true,
  },
  {
    id: "tm-dj-1",
    name: "Jordan Vega",
    role: "DJ",
    email: "jordan@cutmastermusic.com",
    phone: "(505) 555-0110",
    notes: "Lead bilingual wedding DJ.",
    isActive: true,
  },
  {
    id: "tm-planner-1",
    name: "Avery Lane",
    role: "Planner",
    email: "avery@cutmastermusic.com",
    phone: "(505) 555-0120",
    notes: "Planning ops and vendor coordination.",
    isActive: true,
  },
];

export const vibeBuckets = [
  { title: "Cocktail Hour Vibe", songs: ["Golden - Jill Scott", "Put Your Records On - Corinne Bailey Rae", "Best Part - H.E.R. ft. Daniel Caesar"] },
  { title: "Dinner Vibe", songs: ["Lovely Day - Bill Withers", "Beyond - Leon Bridges", "Adore You - Harry Styles"] },
  { title: "Open Dancing Vibe", songs: ["Pepas - Farruko", "Yeah! - Usher", "Levitating - Dua Lipa"] },
];

export const timelineCategories: TimelineCategory[] = [
  "Ceremony",
  "Cocktail Hour",
  "Reception",
  "Formalities",
  "Dancing",
  "Other",
];

const seedCollaborators1: Collaborator[] = [
  { id: "c1", name: "Matt", email: "matt@example.com", role: "Couple", status: "Accepted" },
  { id: "c2", name: "Chaandra", email: "chaandra@example.com", role: "Couple", status: "Accepted" },
  { id: "c3", name: "Cutmaster DJ", email: "dj@cutmastermusic.com", role: "DJ", status: "Accepted" },
];
const seedCollaborators2: Collaborator[] = [
  { id: "c4", name: "Event Planner", email: "planner@example.com", role: "Planner", status: "Accepted" },
  { id: "c5", name: "Lead DJ", email: "lead.dj@example.com", role: "DJ", status: "Pending" },
];
const seedCollaborators3: Collaborator[] = [
  { id: "c6", name: "Brand Admin", email: "admin@cutmastermusic.com", role: "Admin", status: "Accepted" },
];

export function buildSeedEvents(payload: SeedEventPlanningPayload): EventRecord[] {
  const defaultEventSettings: EventSettings = {
    eventLayoutProfile: "Wedding",
    eventName: "Wedding Reception",
    coupleNames: "Alex & Jordan",
    eventType: "Wedding",
    weddingDate: "",
    venue: "",
    ceremonyLocation: "Ceremony Lawn",
    receptionLocation: "Main Ballroom",
    eventStartTime: "4:00 PM",
    eventEndTime: "11:00 PM",
    assignedDj: "Cutmaster Lead DJ",
    plannerName: "Event Planner",
    plannerEmail: "planner@example.com",
    packageName: "Signature Wedding Experience",
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
  };
  const seedNow = Date.now();
  const common = {
    timelineItems: payload.timelineItems,
    ceremonyTimelineItems: payload.ceremonyTimelineItems,
    formalities: payload.formalities,
    mustPlaySongs: payload.mustPlaySongs,
    doNotPlaySongs: payload.doNotPlaySongs,
    ceremonyStartTime: payload.ceremonyStartTime,
    ceremonyGuestArrivalTime: payload.ceremonyGuestArrivalTime,
    officiantName: payload.officiantName,
    ceremonyNotes: payload.ceremonyNotes,
    microphoneNeeds: payload.microphoneNeeds,
    weddingPartyProcessional: payload.weddingPartyProcessional,
    brideGroomProcessional: payload.brideGroomProcessional,
    unityCeremonySong: payload.unityCeremonySong,
    recessionalSong: payload.recessionalSong,
    plannerNotes: payload.plannerNotes,
    vendors: payload.vendors,
    guestRequests: payload.guestRequests,
    generalDjNotes: payload.generalDjNotes,
    mcAnnouncements: payload.mcAnnouncements,
    settings: defaultEventSettings,
  };

  return [
    {
      id: "evt-1",
      lastUpdatedAt: seedNow - 86400000 * 5,
      meta: {
        couple: "Matt & Chaandra",
        date: "Saturday, August 8, 2026",
        venue: "Black Orchid Terrace",
      },
      collaborators: seedCollaborators1,
      ...common,
    },
    {
      id: "evt-2",
      lastUpdatedAt: seedNow - 86400000 * 2,
      meta: {
        couple: "Los Poblanos Wedding",
        date: "Saturday, September 27, 2026",
        venue: "Los Poblanos Historic Inn & Organic Farm",
      },
      collaborators: seedCollaborators2,
      ...common,
    },
    {
      id: "evt-3",
      lastUpdatedAt: seedNow - 3600000,
      meta: {
        couple: "Downtown Showcase",
        date: "Saturday, November 2, 2026",
        venue: "Downtown Pavilion",
      },
      collaborators: seedCollaborators3,
      ...common,
    },
  ];
}

const rawInitialTemplates: TimelineTemplate[] = [
  {
    id: "tpl-wedding",
    name: "Wedding",
    kind: "built_in",
    timelineItems: [
      { id: "tw1", time: "", title: "Cocktail Hour", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
      { id: "tw2", time: "", title: "Grand Entrance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw3", time: "", title: "Welcome Speech", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "tw4", time: "", title: "Blessing", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "tw5", time: "", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "tw6", time: "", title: "Toasts", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw7", time: "", title: "Cake Cutting", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw8", time: "", title: "First Dance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw9", time: "", title: "Father/Daughter Dance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw10", time: "", title: "Mother/Son Dance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw11", time: "", title: "Bouquet Toss", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw12", time: "", title: "Garter Toss", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tw13", time: "", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "tw14", time: "", title: "Last Dance", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Confirm timing once your venue publishes the schedule.", "Toggle bouquet/garter preset rows in Global Settings if you want them off by default."],
  },
  {
    id: "tpl-gender-neutral-wedding",
    name: "Gender-Neutral Wedding",
    kind: "built_in",
    timelineItems: [
      { id: "tgn1", time: "", title: "Cocktail Hour", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
      { id: "tgn2", time: "", title: "Grand Entrance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn3", time: "", title: "Welcome Speech", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "tgn4", time: "", title: "Blessing", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "tgn5", time: "", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "tgn6", time: "", title: "Toasts", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn7", time: "", title: "Cake Cutting", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn8", time: "", title: "First Dance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn9", time: "", title: "Father/Daughter Dance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn10", time: "", title: "Mother/Son Dance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn11", time: "", title: "Bouquet Toss", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn12", time: "", title: "Garter Toss", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "tgn13", time: "", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "tgn14", time: "", title: "Last Dance", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Use inclusive announcement language.", "Confirm pronunciation for all names in scripts."],
  },
  {
    id: "tpl-corporate",
    name: "Corporate",
    kind: "built_in",
    timelineItems: [
      { id: "co1", time: "", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "co2", time: "", title: "Cocktail / Networking", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
      { id: "co3", time: "", title: "Welcome Remarks", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "co4", time: "", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "co5", time: "", title: "Awards / Recognition", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "co6", time: "", title: "Presentation / Speaker", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "co7", time: "", title: "Open Networking / Dancing", category: "Dancing", notes: "", needsDjMcAttention: false },
      { id: "co8", time: "", title: "Closing Remarks", category: "Reception", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Prioritize speech clarity.", "Keep dinner beds under speech intelligibility."],
  },
  {
    id: "tpl-holiday-party",
    name: "Holiday Party",
    kind: "built_in",
    timelineItems: [
      { id: "hp1", time: "", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "hp2", time: "", title: "Cocktail Hour", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
      { id: "hp3", time: "", title: "Welcome Remarks", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "hp4", time: "", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "hp5", time: "", title: "Awards / Raffle", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "hp6", time: "", title: "Dancing / Entertainment", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "hp7", time: "", title: "Closing", category: "Reception", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Keep announcements brief and upbeat.", "Use themed transitions for seasonal moments."],
  },
  {
    id: "tpl-graduation",
    name: "Graduation Celebration",
    kind: "built_in",
    timelineItems: [
      { id: "gc1", time: "", title: "Doors Open", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "gc2", time: "", title: "Graduate Entrance", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "gc3", time: "", title: "Family Toasts", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "gc4", time: "", title: "Dance Floor", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Keep clean edits queued early.", "Prepare shout-out blocks for family recognition."],
  },
  {
    id: "tpl-birthday",
    name: "Birthday Party",
    kind: "built_in",
    timelineItems: [
      { id: "bd1", time: "", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "bd2", time: "", title: "Birthday Intro", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "bd3", time: "", title: "Cake Moment", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "bd4", time: "", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Front-load celebratory singalong tracks.", "Mark special dedications in MC notes."],
  },
  {
    id: "tpl-private-party",
    name: "Private Party",
    kind: "built_in",
    timelineItems: [
      { id: "pp1", time: "", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "pp2", time: "", title: "Dinner / Social", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "pp3", time: "", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Capture any surprise cues before doors open.", "Build a smooth energy arc between dinner and dancing."],
  },
  {
    id: "tpl-bar-club",
    name: "Bar/Club Event",
    kind: "built_in",
    timelineItems: [
      { id: "bc1", time: "", title: "Doors Open", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "bc2", time: "", title: "Opening Set", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "bc3", time: "", title: "Peak Hour", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "bc4", time: "", title: "Special Announcement", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "bc5", time: "", title: "Last Call", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "bc6", time: "", title: "Closing Track", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Stage transitions between sets to avoid dead air.", "Pre-plan clean fallback tracks for request-heavy windows."],
  },
  {
    id: "tpl-school-dance",
    name: "School Dance",
    kind: "built_in",
    timelineItems: [
      { id: "sd1", time: "", title: "Doors Open", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "sd2", time: "", title: "Warm-Up Set", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "sd3", time: "", title: "Announcements", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "sd4", time: "", title: "Dance Block", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "sd5", time: "", title: "Slow Set", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "sd6", time: "", title: "Last Song", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Keep clean edits in a dedicated crate.", "Plan admin announcement checkpoints."],
  },
];

export const initialTemplates: TimelineTemplate[] = rawInitialTemplates.map((tpl) => ({
  ...tpl,
  timelineItems: migrateFormalitiesIntoTimelineItems(tpl.timelineItems, tpl.formalities ?? []),
  formalities: [],
}));

export const defaultAppSettings: AppSettings = {
  companyName: "Cutmaster Music",
  appName: "Cutmaster Planning",
  logoUrl: "/cmm-logo-white.png",
  brandColor: "#000000",
  accentColor: "#00D4FF",
  defaultEventTimezone: "America/Denver",
  defaultEventType: "Wedding",
  prepSheetFooterText: "Prepared by Cutmaster Music. Confirm final cues with your planner and DJ.",
  publicGuestRequestMessage:
    "For Alex & Jordan's celebration. The couple and DJ review all requests.",
  coupleWelcomeMessage: "Welcome back",
  globalTemplateDefaults: "Wedding, Corporate, Private Party",
  planningQuestionSets: getDefaultPlanningQuestionSets(),
  timelinePresetSets: getDefaultTimelinePresetSets(),
  checklistDueDateSets: getDefaultChecklistDueDateSetsForProfiles(),
};
