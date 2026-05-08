import type {
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
} from "@/types/planning";

type SeedEventPlanningPayload = {
  timelineItems: TimelineItem[];
  formalities: FormalityItem[];
  mustPlaySongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  ceremonyStartTime: string;
  officiantName: string;
  ceremonyNotes: string;
  microphoneNeeds: string;
  weddingPartyProcessional: CeremonySongPlan;
  brideGroomProcessional: CeremonySongPlan;
  unityCeremonySong: CeremonySongPlan;
  recessionalSong: CeremonySongPlan;
  plannerNotes: string[];
  guestRequests: GuestRequestEntry[];
  generalDjNotes: string;
  mcAnnouncements: string;
};

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
  "DJ Prep Sheet",
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
    checklistDueDates: {},
    checklistManualStatuses: {},
  };
  const common = {
    timelineItems: payload.timelineItems,
    formalities: payload.formalities,
    mustPlaySongs: payload.mustPlaySongs,
    doNotPlaySongs: payload.doNotPlaySongs,
    ceremonyStartTime: payload.ceremonyStartTime,
    officiantName: payload.officiantName,
    ceremonyNotes: payload.ceremonyNotes,
    microphoneNeeds: payload.microphoneNeeds,
    weddingPartyProcessional: payload.weddingPartyProcessional,
    brideGroomProcessional: payload.brideGroomProcessional,
    unityCeremonySong: payload.unityCeremonySong,
    recessionalSong: payload.recessionalSong,
    plannerNotes: payload.plannerNotes,
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
        couple: "En Blanc Showcase",
        date: "Saturday, November 2, 2026",
        venue: "En Blanc Pavilion",
      },
      collaborators: seedCollaborators3,
      ...common,
    },
  ];
}

export const initialTemplates: TimelineTemplate[] = [
  {
    id: "tpl-traditional",
    name: "Traditional Wedding",
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
    id: "tpl-catholic",
    name: "Catholic Wedding",
    kind: "built_in",
    timelineItems: [
      { id: "ct1", time: "3:30 PM", title: "Ceremony", category: "Ceremony", notes: "Full mass schedule with live cues.", needsDjMcAttention: true },
      { id: "ct2", time: "5:00 PM", title: "Cocktail Hour", category: "Cocktail Hour", notes: "Extended guest transition.", needsDjMcAttention: false },
      { id: "ct3", time: "6:15 PM", title: "Grand Entrance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "ct4", time: "6:30 PM", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "ct5", time: "7:30 PM", title: "Toasts", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "ct6", time: "8:15 PM", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [
      { id: "cf1", momentName: "First Dance", time: "7:50 PM", songTitle: "", artist: "", notes: "", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
    ],
    planningSuggestions: ["Set clear ceremony mic plan for readings.", "Plan extra cocktail hour music coverage."],
  },
  {
    id: "tpl-micro",
    name: "Micro Wedding",
    kind: "built_in",
    timelineItems: [
      { id: "m1", time: "4:30 PM", title: "Ceremony", category: "Ceremony", notes: "", needsDjMcAttention: true },
      { id: "m2", time: "5:00 PM", title: "Cocktail Hour", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
      { id: "m3", time: "6:00 PM", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "m4", time: "7:00 PM", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Keep transitions short and intentional.", "Use intimate dinner playlist arc."],
  },
  {
    id: "tpl-party",
    name: "High-Energy Party Wedding",
    kind: "built_in",
    timelineItems: [
      { id: "p1", time: "5:00 PM", title: "Cocktail Hour", category: "Cocktail Hour", notes: "", needsDjMcAttention: false },
      { id: "p2", time: "6:00 PM", title: "Grand Entrance", category: "Formalities", notes: "Big hype intro.", needsDjMcAttention: true },
      { id: "p3", time: "6:20 PM", title: "Dinner", category: "Reception", notes: "Shorter dinner window.", needsDjMcAttention: false },
      { id: "p4", time: "7:15 PM", title: "Open Dancing", category: "Dancing", notes: "Early dance-floor launch.", needsDjMcAttention: true },
      { id: "p5", time: "10:55 PM", title: "Last Dance", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [
      { id: "pf1", momentName: "Open Dancing Kickoff", time: "7:15 PM", songTitle: "", artist: "", notes: "", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true },
    ],
    planningSuggestions: ["Add 2-3 trusted floor-fillers.", "Keep formalities concise."],
  },
  {
    id: "tpl-corporate",
    name: "Corporate Event",
    kind: "built_in",
    timelineItems: [
      { id: "co1", time: "6:00 PM", title: "Guest Arrival", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "co2", time: "6:30 PM", title: "Welcome Remarks", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "co3", time: "7:00 PM", title: "Dinner Service", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "co4", time: "8:15 PM", title: "Networking + Music", category: "Dancing", notes: "", needsDjMcAttention: false },
    ],
    formalities: [],
    planningSuggestions: ["Prioritize speech clarity.", "Keep music conversational during networking."],
  },
  {
    id: "tpl-quince",
    name: "Quinceañera",
    kind: "built_in",
    timelineItems: [
      { id: "q1", time: "5:00 PM", title: "Grand Entrance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "q2", time: "5:30 PM", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "q3", time: "6:30 PM", title: "Family Toasts", category: "Reception", notes: "", needsDjMcAttention: true },
      { id: "q4", time: "7:00 PM", title: "Formal Dances", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "q5", time: "8:00 PM", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [{ id: "qf1", momentName: "Father/Daughter Dance", time: "7:10 PM", songTitle: "", artist: "", notes: "", fadeOutEarly: false, fadeOutTimestamp: "", includeInTimeline: true, needsDjMcAttention: true }],
    planningSuggestions: ["Coordinate spotlight cues for formal dances."],
  },
  {
    id: "tpl-sweet16",
    name: "Sweet 16",
    kind: "built_in",
    timelineItems: [
      { id: "s1", time: "6:00 PM", title: "Grand Entrance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "s2", time: "6:20 PM", title: "Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "s3", time: "7:15 PM", title: "Special Dance", category: "Formalities", notes: "", needsDjMcAttention: true },
      { id: "s4", time: "7:45 PM", title: "Open Dancing", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Front-load teen favorites for early dance momentum."],
  },
  {
    id: "tpl-enblanc",
    name: "En Blanc Experience",
    kind: "built_in",
    timelineItems: [
      { id: "eb1", time: "5:30 PM", title: "Guest Arrival + Lounge", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "eb2", time: "6:30 PM", title: "Elegant Dinner", category: "Reception", notes: "", needsDjMcAttention: false },
      { id: "eb3", time: "8:00 PM", title: "Feature Set", category: "Dancing", notes: "Curated house/disco blend.", needsDjMcAttention: true },
      { id: "eb4", time: "10:45 PM", title: "Finale", category: "Dancing", notes: "", needsDjMcAttention: true },
    ],
    formalities: [],
    planningSuggestions: ["Use clean white-light transitions between sets.", "Keep stage intros concise and elegant."],
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
  globalTemplateDefaults: "Traditional Wedding, Catholic Wedding, Micro Wedding",
};
