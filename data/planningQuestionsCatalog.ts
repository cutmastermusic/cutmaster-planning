import type { EventSettings, PlanningQuestionDef } from "@/types/planning";

export type PlanningLayoutProfile = EventSettings["eventLayoutProfile"];

const WEDDING_QUESTIONS: PlanningQuestionDef[] = [
  { id: "pq_grand_entrance", label: "Grand entrance details", helpText: "Order and staging cues.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Order, vibe, staging…", sectionGroup: "reception_timeline" },
  { id: "pq_formal_dances", label: "Formal dances / family dances", helpText: "List sequence and songs.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Who, order, songs…", sectionGroup: "special_moments" },
  { id: "pq_toasts", label: "Toasts / speeches", helpText: "Who speaks and when.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Who speaks and when…", sectionGroup: "reception_timeline" },
  { id: "pq_ceremony", label: "Ceremony details", helpText: "Processional and transition notes.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Music moments, transitions…", sectionGroup: "ceremony" },
  { id: "pq_traditions", label: "Special traditions", helpText: "Cultural/family rituals to support.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Cultural or family rituals…", sectionGroup: "special_moments" },
  { id: "pq_last_dance", label: "Last dance", helpText: "Closing moment direction.", answerType: "song", required: false, showInLiveEventMode: true, placeholder: "Song, vibe, closing moment…", sectionGroup: "special_moments" },
  { id: "pq_must_play_vibe", label: "Must-play vibe", helpText: "Overall dance-floor direction.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Energy, eras, artists…", sectionGroup: "music_preferences" },
  { id: "pq_do_not_play_notes", label: "Do-not-play notes", helpText: "Songs/genres to avoid.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Songs, genres, sensitivities…", sectionGroup: "music_preferences" },
];

const CORPORATE_QUESTIONS: PlanningQuestionDef[] = [
  { id: "pq_corp_purpose", label: "Event purpose", helpText: "Business goal and audience.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Goals, audience, tone…", sectionGroup: "event_details" },
  { id: "pq_corp_run_of_show", label: "Program / run-of-show notes", helpText: "Segments and timing.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Segments, timing…", sectionGroup: "run_of_show" },
  { id: "pq_corp_presenters", label: "Presenter / emcee names", helpText: "Primary contacts on stage.", answerType: "contact", required: false, showInLiveEventMode: true, placeholder: "Who introduces what…", sectionGroup: "event_details" },
  { id: "pq_corp_award_music", label: "Award walk-up music", helpText: "Stingers and beds.", answerType: "song", required: false, showInLiveEventMode: true, placeholder: "Stingers, beds, lengths…", sectionGroup: "music_direction" },
  { id: "pq_corp_brand", label: "Brand / sponsor notes", helpText: "Messaging constraints.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Mentions, logos, restrictions…", sectionGroup: "vendors_coordination" },
  { id: "pq_corp_bg_vibe", label: "Background music vibe", helpText: "Tempo and volume targets.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Tempo, genre, volume…", sectionGroup: "music_direction" },
  { id: "pq_corp_announcements", label: "Announcements", helpText: "Housekeeping/script lines.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Housekeeping, transitions…", sectionGroup: "announcements_scripts" },
  { id: "pq_corp_do_not_play", label: "Do-not-play notes", helpText: "Restricted music notes.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Lyrics, genres, artist bans…", sectionGroup: "music_direction" },
];

const SCHOOL_DANCE_QUESTIONS: PlanningQuestionDef[] = [
  { id: "pq_school_clean", label: "Clean music requirements", helpText: "Policy and edit requirements.", answerType: "yes_no", required: true, showInLiveEventMode: true, placeholder: "Explicit policy, edits…", sectionGroup: "music_clean_edits" },
  { id: "pq_school_announcements", label: "School announcements", helpText: "Admin/chaperone scripts.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Admin lines, chaperone notes…", sectionGroup: "announcements" },
  { id: "pq_school_theme", label: "Theme", helpText: "Theme tie-ins and vibes.", answerType: "short_text", required: false, showInLiveEventMode: false, placeholder: "Dress, décor tie-ins…", sectionGroup: "event_details" },
  { id: "pq_school_requests", label: "Student request policy", helpText: "How requests are accepted.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["Open", "Moderated", "Closed"], placeholder: "How requests are handled…", sectionGroup: "requests" },
  { id: "pq_school_genres", label: "Must-play genres", helpText: "Genre priorities.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Top 40, Latin, country…", sectionGroup: "music_clean_edits" },
  { id: "pq_school_do_not_play", label: "Do-not-play songs / artists", helpText: "Banned titles and artists.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Banned titles or acts…", sectionGroup: "music_clean_edits" },
];

const PRIVATE_PARTY_QUESTIONS: PlanningQuestionDef[] = [
  { id: "pq_pp_guest_of_honor", label: "Guest of honor", helpText: "Primary person or group celebrated.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "Who we’re celebrating…", sectionGroup: "event_details" },
  { id: "pq_pp_occasion", label: "Occasion", helpText: "Type of event.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "Birthday, anniversary, etc.", sectionGroup: "event_details" },
  { id: "pq_pp_surprises", label: "Surprise moments", helpText: "Reveal timing and music cues.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Reveal timing, cues…", sectionGroup: "special_moments" },
  { id: "pq_pp_music_vibe", label: "Music vibe", helpText: "Overall direction.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Energy, eras…", sectionGroup: "music_direction" },
  { id: "pq_pp_announcements", label: "Special announcements", helpText: "Shout-outs and dedications.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Shout-outs, dedications…", sectionGroup: "announcements" },
  { id: "pq_pp_must_do_not", label: "Must-play / do-not-play", helpText: "Key songs in and out.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Requests and hard nos…", sectionGroup: "music_direction" },
];

export function formatPlanningQuestionsPlainTextLines(
  questions: PlanningQuestionDef[],
  answers: Record<string, string> | undefined,
): string[] {
  const safe = answers ?? {};
  const lines: string[] = ["PLANNING QUESTIONS"];
  for (const q of questions) {
    const v = (safe[q.id] ?? "").trim();
    lines.push(`${q.label}: ${v || "None"}`);
  }
  return lines;
}

export function getDefaultPlanningQuestionSets(): Record<PlanningLayoutProfile, PlanningQuestionDef[]> {
  return {
    Wedding: WEDDING_QUESTIONS,
    "Gender-Neutral Wedding": WEDDING_QUESTIONS,
    Corporate: CORPORATE_QUESTIONS,
    "Holiday Party": CORPORATE_QUESTIONS,
    "Graduation Celebration": SCHOOL_DANCE_QUESTIONS,
    "Birthday Party": PRIVATE_PARTY_QUESTIONS,
    "Private Party": PRIVATE_PARTY_QUESTIONS,
    "Bar/Club Event": PRIVATE_PARTY_QUESTIONS,
    "School Dance": SCHOOL_DANCE_QUESTIONS,
  };
}

export function getPlanningQuestionsForProfile(profile: PlanningLayoutProfile): PlanningQuestionDef[] {
  return getDefaultPlanningQuestionSets()[profile];
}
