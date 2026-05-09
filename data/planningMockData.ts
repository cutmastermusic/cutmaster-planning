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

const getDefaultTimelinePresetSets = (): Record<EventSettings["eventLayoutProfile"], TimelinePresetItem[]> => ({
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

export const initialTimelineItems: TimelineItem[] = [
  {
    id: "timeline-1",
    title: "Cocktail Hour",
    time: "5:00 PM",
    category: "Cocktail Hour",
    notes: "Lounge set while guests transition from ceremony.",
    needsDjMcAttention: false,
  },
  {
    id: "timeline-2",
    title: "Welcome Toast",
    time: "6:00 PM",
    category: "Reception",
    notes: "MC welcome before blessing.",
    needsDjMcAttention: true,
  },
  {
    id: "timeline-3",
    title: "Blessing",
    time: "6:05 PM",
    category: "Reception",
    notes: "Soft instrumental bed under prayer.",
    needsDjMcAttention: true,
  },
  {
    id: "timeline-4",
    title: "Dinner",
    time: "6:10 PM",
    category: "Reception",
    notes: "Keep volume low for table conversation.",
    needsDjMcAttention: false,
  },
  {
    id: "timeline-5",
    title: "Speeches",
    time: "7:00 PM",
    category: "Reception",
    notes: "MOH, Best Man, and parent toast queue.",
    needsDjMcAttention: true,
  },
  {
    id: "timeline-6",
    title: "Open Dancing",
    time: "8:30 PM",
    category: "Dancing",
    notes: "Kick into high-energy set after formalities.",
    needsDjMcAttention: true,
  },
  {
    id: "timeline-7",
    title: "Late Night Bite",
    time: "9:45 PM",
    category: "Reception",
    notes: "Drop to mid-tempo while food opens.",
    needsDjMcAttention: false,
  },
  {
    id: "timeline-8",
    title: "Last Call",
    time: "10:40 PM",
    category: "Reception",
    notes: "MC final bar call announcement.",
    needsDjMcAttention: true,
  },
];

export const initialCeremonyTimelineItems: CeremonyTimelineItem[] = [
  {
    id: "ceremony-timeline-1",
    timeOrOrder: "Prelude",
    moment: "Guest Arrival / Prelude",
    songTitle: "",
    artist: "",
    notes: "Soft arrival bed while guests are seated.",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-2",
    timeOrOrder: "Processional",
    moment: "Wedding Party Processional",
    songTitle: "Canon in D",
    artist: "The O'Neill Brothers",
    notes: "Fade in softly as first pair starts.",
    needsDjMcAttention: true,
  },
  {
    id: "ceremony-timeline-3",
    timeOrOrder: "Bride/Groom Processional",
    moment: "Bride/Groom Processional",
    songTitle: "A Thousand Years (Instrumental)",
    artist: "The Piano Guys",
    notes: "Begin at aisle doors opening.",
    needsDjMcAttention: true,
  },
  {
    id: "ceremony-timeline-4",
    timeOrOrder: "Unity",
    moment: "Unity Ceremony",
    songTitle: "Stand by Me",
    artist: "Florence + The Machine",
    notes: "Play low underneath officiant guidance.",
    needsDjMcAttention: false,
  },
  {
    id: "ceremony-timeline-5",
    timeOrOrder: "Recessional",
    moment: "Recessional",
    songTitle: "Signed, Sealed, Delivered",
    artist: "Stevie Wonder",
    notes: "Start right after first kiss announcement.",
    needsDjMcAttention: true,
  },
];

export const initialFormalities: FormalityItem[] = [
  { id: "formality-1", momentName: "Grand Entrance", time: "5:50 PM", songTitle: "Bring Em Out", artist: "T.I.", notes: "Announce wedding party then couple with energy.", fadeOutEarly: true, fadeOutTimestamp: "0:55", includeInTimeline: true, needsDjMcAttention: true },
  { id: "formality-2", momentName: "First Dance", time: "7:25 PM", songTitle: "At Last", artist: "Etta James", notes: "Fade into applause and invite parents for next dance.", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
  { id: "formality-3", momentName: "Father/Daughter Dance", time: "7:30 PM", songTitle: "My Girl", artist: "The Temptations", notes: "Spotlight center floor.", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
  { id: "formality-4", momentName: "Mother/Son Dance", time: "7:34 PM", songTitle: "Stand by Me", artist: "Ben E. King", notes: "Cue immediately after father/daughter applause.", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
  { id: "formality-5", momentName: "Anniversary Dance", time: "7:45 PM", songTitle: "Unforgettable", artist: "Nat King Cole", notes: "Transition to bouquet after final couple remains.", fadeOutEarly: true, fadeOutTimestamp: "2:15", includeInTimeline: true, needsDjMcAttention: true },
  { id: "formality-6", momentName: "Bouquet Toss", time: "7:55 PM", songTitle: "Single Ladies", artist: "Beyonce", notes: "MC gather guests before hit section.", fadeOutEarly: true, fadeOutTimestamp: "1:20", includeInTimeline: false, needsDjMcAttention: true },
  { id: "formality-7", momentName: "Garter Toss", time: "8:00 PM", songTitle: "Pony", artist: "Ginuwine", notes: "Keep clean radio edit available.", fadeOutEarly: true, fadeOutTimestamp: "1:05", includeInTimeline: false, needsDjMcAttention: true },
  { id: "formality-8", momentName: "Open Dancing Kickoff", time: "8:05 PM", songTitle: "Yeah!", artist: "Usher", notes: "Big countdown and floor invite.", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
  { id: "formality-9", momentName: "Last Dance", time: "10:55 PM", songTitle: "Closing Time", artist: "Semisonic", notes: "Final circle and thank-you outro.", fadeOutEarly: true, fadeOutTimestamp: "2:10", includeInTimeline: true, needsDjMcAttention: true },
  { id: "formality-10", momentName: "Custom Formality", time: "", songTitle: "", artist: "", notes: "", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: false, needsDjMcAttention: false },
];

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
  "Welcome everyone, invite guests for cocktail hour, announce formal dances, last call reminder, final thank-you.";
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
  "Music",
  "Timeline",
  "Timeline Templates",
  "Collaborators",
  "Guest Requests",
  "Ceremony",
  "Formal Dances",
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
    sectionFormalitiesEnabled: true,
    sectionPlanningChecklistEnabled: true,
    sectionPlanningQuestionsEnabled: true,
    planningQuestionAnswers: {},
    checklistDueDates: {},
    checklistManualStatuses: {},
  };
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

export const initialTemplates: TimelineTemplate[] = [
  {
    id: "tpl-wedding",
    name: "Wedding",
    kind: "built_in",
    timelineItems: [
      { id: "t1", time: "5:00 PM", title: "Cocktail Hour", category: "Cocktail Hour", notes: "Lounge and mingling set.", needsDjMcAttention: false },
      { id: "t2", time: "6:00 PM", title: "Grand Entrance", category: "Formalities", notes: "MC intros wedding party and couple.", needsDjMcAttention: true },
      { id: "t3", time: "6:15 PM", title: "Dinner", category: "Reception", notes: "Low-volume dinner ambiance.", needsDjMcAttention: false },
      { id: "t4", time: "7:05 PM", title: "Toasts", category: "Reception", notes: "MOH and Best Man first.", needsDjMcAttention: true },
      { id: "t5", time: "8:00 PM", title: "Open Dancing", category: "Dancing", notes: "Energy shift into dance set.", needsDjMcAttention: true },
      { id: "t6", time: "9:45 PM", title: "Late Night Bite", category: "Reception", notes: "Drop to mid-tempo while serving food.", needsDjMcAttention: false },
      { id: "t7", time: "10:55 PM", title: "Last Dance", category: "Dancing", notes: "Final circle moment.", needsDjMcAttention: true },
    ],
    formalities: [
      { id: "f1", momentName: "First Dance", time: "7:30 PM", songTitle: "", artist: "", notes: "After toasts.", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
      { id: "f2", momentName: "Father/Daughter Dance", time: "7:35 PM", songTitle: "", artist: "", notes: "", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
      { id: "f3", momentName: "Mother/Son Dance", time: "7:40 PM", songTitle: "", artist: "", notes: "", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
    ],
    planningSuggestions: ["Leave a 10-minute speech buffer.", "Add one high-energy open dancing kickoff song."],
  },
  {
    id: "tpl-gender-neutral-wedding",
    name: "Gender-Neutral Wedding",
    kind: "built_in",
    timelineItems: [
      { id: "gn1", time: "4:30 PM", title: "Ceremony", category: "Ceremony", notes: "Processional and vows.", needsDjMcAttention: true },
      { id: "gn2", time: "5:30 PM", title: "Cocktail Hour", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
      { id: "gn3", time: "6:15 PM", title: "Grand Entrance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "gn4", time: "6:30 PM", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "gn5", time: "7:25 PM", title: "Toasts", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "gn6", time: "8:00 PM", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [
      { id: "gnf1", momentName: "First Dance", time: "7:45 PM", songTitle: "", artist: "", notes: "", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
    ],
    planningSuggestions: ["Use inclusive announcement language.", "Confirm pronunciation for all names in scripts."],
  },
  {
    id: "tpl-corporate",
    name: "Corporate",
    kind: "built_in",
    timelineItems: [
      { id: "co1", time: "6:00 PM", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "co2", time: "6:30 PM", title: "Welcome Remarks", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "co3", time: "7:00 PM", title: "Program Segment", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "co4", time: "7:45 PM", title: "Networking + Music", category: "Dancing", notes: "", needsDjMcAttention: false },
    ],
    formalities: [],
    planningSuggestions: ["Prioritize speech clarity.", "Keep music conversational during networking."],
  },
  {
    id: "tpl-holiday-party",
    name: "Holiday Party",
    kind: "built_in",
    timelineItems: [
      { id: "hp1", time: "6:30 PM", title: "Doors Open / Welcome", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "hp2", time: "7:00 PM", title: "Dinner + Mingling", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "hp3", time: "8:00 PM", title: "Holiday Toasts", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "hp4", time: "8:30 PM", title: "Dance Floor Opens", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Keep announcements brief and upbeat.", "Use themed transitions for seasonal moments."],
  },
  {
    id: "tpl-graduation",
    name: "Graduation Celebration",
    kind: "built_in",
    timelineItems: [
      { id: "gc1", time: "6:00 PM", title: "Doors Open", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "gc2", time: "6:30 PM", title: "Graduate Entrance", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "gc3", time: "7:15 PM", title: "Family Toasts", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "gc4", time: "8:00 PM", title: "Dance Floor", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Keep clean edits queued early.", "Prepare shout-out blocks for family recognition."],
  },
  {
    id: "tpl-birthday",
    name: "Birthday Party",
    kind: "built_in",
    timelineItems: [
      { id: "bd1", time: "6:00 PM", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "bd2", time: "6:30 PM", title: "Birthday Intro", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "bd3", time: "7:15 PM", title: "Cake Moment", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "bd4", time: "7:45 PM", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Front-load celebratory singalong tracks.", "Mark special dedications in MC notes."],
  },
  {
    id: "tpl-private-party",
    name: "Private Party",
    kind: "built_in",
    timelineItems: [
      { id: "pp1", time: "5:30 PM", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "pp2", time: "6:30 PM", title: "Dinner / Social", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "pp3", time: "7:45 PM", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Capture any surprise cues before doors open.", "Build a smooth energy arc between dinner and dancing."],
  },
  {
    id: "tpl-bar-club",
    name: "Bar/Club Event",
    kind: "built_in",
    timelineItems: [
      { id: "bc1", time: "9:00 PM", title: "Doors Open", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "bc2", time: "10:30 PM", title: "Peak Set 1", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "bc3", time: "12:00 AM", title: "Peak Set 2", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "bc4", time: "1:45 AM", title: "Last Call Push", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Stage transitions between sets to avoid dead air.", "Pre-plan clean fallback tracks for request-heavy windows."],
  },
  {
    id: "tpl-school-dance",
    name: "School Dance",
    kind: "built_in",
    timelineItems: [
      { id: "sd1", time: "7:00 PM", title: "Doors Open", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "sd2", time: "7:30 PM", title: "Announcements", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "sd3", time: "8:00 PM", title: "Dance Set 1", category: "Dancing", notes: "", needsDjMcAttention: true },
      { id: "sd4", time: "9:15 PM", title: "Dance Set 2", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Keep clean edits in a dedicated crate.", "Plan admin announcement checkpoints."],
  },
];

export const defaultAppSettings: AppSettings = {
  companyName: "Cutmaster Music",
  appName: "Cutmaster Planning",
  logoUrl: "/cmm-logo-white.png",
  brandColor: "#8f6b2f",
  accentColor: "#c9a35c",
  defaultEventTimezone: "America/Denver",
  defaultEventType: "Wedding",
  prepSheetFooterText: "Prepared by Cutmaster Music. Confirm final cues with your planner and DJ.",
  publicGuestRequestMessage:
    "For Alex & Jordan's celebration. The couple and DJ review all requests.",
  coupleWelcomeMessage: "Welcome back",
  globalTemplateDefaults: "Wedding, Corporate, Private Party",
  planningQuestionSets: getDefaultPlanningQuestionSets(),
  timelinePresetSets: getDefaultTimelinePresetSets(),
};
