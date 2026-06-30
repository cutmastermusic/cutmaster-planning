import type { EventSettings, PlanningQuestionDef } from "@/types/planning";
import {
  formatSpeechesToastsForDisplay,
  SPEECHES_TOASTS_PLANNING_KEY,
} from "@/lib/speechesToasts";

export type PlanningLayoutProfile = EventSettings["eventLayoutProfile"];

const WEDDING_QUESTIONS: PlanningQuestionDef[] = [
  { id: "pq_about_full_names", label: "What are your full names?", helpText: "Legal or preferred names for introductions and personalization.", answerType: "short_text", required: false, showInLiveEventMode: false, placeholder: "Partner one & partner two…", sectionGroup: "about_you" },
  { id: "pq_about_hs_grad_year", label: "What year did each of you graduate high school?", helpText: "Helps with era-appropriate music and crowd references.", answerType: "short_text", required: false, showInLiveEventMode: false, placeholder: "e.g. 2012 & 2014…", sectionGroup: "about_you" },
  { id: "pq_about_wedding_colors_style", label: "What are your wedding colors or overall design style?", helpText: "Palette, theme, or aesthetic direction.", answerType: "short_text", required: false, showInLiveEventMode: false, placeholder: "Colors, theme, mood…", sectionGroup: "about_you" },
  { id: "pq_about_honeymoon", label: "Where are you headed for your honeymoon?", helpText: "Destination or plans after the wedding.", answerType: "short_text", required: false, showInLiveEventMode: false, placeholder: "City, country, or staycation…", sectionGroup: "about_you" },
  { id: "pq_about_wedding_website", label: "Do you have a wedding website?", helpText: "Share the URL if guests can find details there.", answerType: "short_text", required: false, showInLiveEventMode: false, placeholder: "URL or “not yet”…", sectionGroup: "about_you" },
  { id: "pq_about_wedding_hashtag", label: "Are you using a wedding hashtag?", helpText: "For social posts and photo sharing.", answerType: "short_text", required: false, showInLiveEventMode: false, placeholder: "#YourHashtag or “none”…", sectionGroup: "about_you" },
  { id: "pq_about_liked_weddings", label: "What are 3–5 things you've loved at weddings you've attended?", helpText: "Moments, music, flow, or details you'd like to echo.", answerType: "long_text", required: false, showInLiveEventMode: false, placeholder: "One per line or short list…", sectionGroup: "about_you" },
  { id: "pq_about_disliked_weddings", label: "What are 3–5 things you've disliked at weddings you've attended?", helpText: "Anything you'd prefer to avoid at yours.", answerType: "long_text", required: false, showInLiveEventMode: false, placeholder: "One per line or short list…", sectionGroup: "about_you" },
  { id: "pq_about_remember_most", label: "When your wedding is over, what do you hope people remember most?", helpText: "The feeling or moments you want guests to carry with them.", answerType: "long_text", required: false, showInLiveEventMode: false, placeholder: "Joy, connection, celebration…", sectionGroup: "about_you" },
  { id: "pq_event_expected_guest_count", label: "Expected guest count", helpText: "Approximate number of guests you are expecting.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "e.g. 150", sectionGroup: "about_you" },
  { id: "pq_team_dress_code", label: "Dress code", helpText: "Attire guidance for guests and your team.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["Black Tie", "Formal", "Semi-Formal", "Business Casual", "Cocktail Attire", "Casual", "Theme Attire", "Other"], sectionGroup: "your_team" },
  { id: "pq_team_dress_code_other", label: "Dress code (other detail)", helpText: "When dress code is Other, describe the attire.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "Describe your dress code…", sectionGroup: "your_team" },
  { id: "pq_team_social_instagram", label: "Instagram handle", helpText: "Couple Instagram for tagging and coordination.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "@handle", sectionGroup: "your_team" },
  { id: "pq_team_social_tiktok", label: "TikTok handle", helpText: "Couple TikTok for tagging and coordination.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "@handle", sectionGroup: "your_team" },
  { id: "pq_team_social_facebook", label: "Facebook handle", helpText: "Optional couple Facebook page or profile.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "Page or profile name", sectionGroup: "your_team" },
  { id: "pq_team_social_media_capture", label: "Social media photo/video permission", helpText: "Whether Cutmaster may capture content for social media.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["Absolutely!", "Please ask first.", "We'd rather not."], sectionGroup: "your_team" },
  { id: "pq_music_cocktail_hour_vibe", label: "Cocktail hour music vibe", helpText: "DJ guidance for cocktail hour — stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["Jazz","Acoustic"]', sectionGroup: "music_vibe" },
  { id: "pq_music_cocktail_hour_vibe_custom", label: "Cocktail hour custom vibe", helpText: "Custom cocktail hour vibe detail when Custom is selected.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "Describe your vibe…", sectionGroup: "music_vibe" },
  { id: "pq_music_dinner_vibe", label: "Dinner music vibe", helpText: "DJ guidance for dinner — stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["Jazz","Chill"]', sectionGroup: "music_vibe" },
  { id: "pq_music_dinner_vibe_custom", label: "Dinner custom vibe", helpText: "Custom dinner vibe detail when Custom is selected.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: "Describe your vibe…", sectionGroup: "music_vibe" },
  { id: "pq_reception_dinner_service_style", label: "Dinner service style", helpText: "How dinner will be served at the reception.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["Plated", "Buffet", "Family Style", "Stations"], sectionGroup: "reception_moments" },
  { id: "pq_reception_buffet_table_release", label: "Buffet table release", helpText: "Who releases tables for buffet service.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["Planner", "Venue Staff (recommended)", "DJ"], sectionGroup: "reception_moments" },
  { id: "pq_grand_entrance", label: "Wedding party lineup", helpText: "Introduction order for the wedding party. One person or pair per line — include role/title and pronunciation notes if helpful.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Best man — Alex (AL-eks)\nMaid of honor — Jordan\nBridesmaids — Sam & Riley\n…", sectionGroup: "reception_moments" },
  { id: "pq_formal_dances", label: "Formal dances / family dances", helpText: "List sequence and songs.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Who, order, songs…", sectionGroup: "reception_moments" },
  { id: "pq_toasts", label: "Speeches / Toasts", helpText: "Who speaks and in what order.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Add speakers with role and name…", sectionGroup: "reception_moments" },
  { id: "pq_ceremony", label: "Ceremony details", helpText: "Processional and transition notes.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Music moments, transitions…", sectionGroup: "ceremony" },
  { id: "pq_traditions", label: "Special traditions", helpText: "Cultural/family rituals to support.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Cultural or family rituals…", sectionGroup: "reception_moments" },
  { id: "pq_last_dance", label: "Last dance", helpText: "Closing moment direction.", answerType: "song", required: false, showInLiveEventMode: true, placeholder: "Song, vibe, closing moment…", sectionGroup: "reception_moments" },
  { id: "pq_music_importance", label: "Music importance", helpText: "How central music is to the celebration.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["Music is everything", "Very important", "Somewhat important", "We trust our DJ"], sectionGroup: "music_vibe" },
  { id: "pq_music_dance_floor_style", label: "Dance floor style", helpText: "Preferred dance-floor energy. Stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["Sing-Alongs","High Energy"]', sectionGroup: "music_vibe" },
  { id: "pq_music_decades", label: "Preferred decades", helpText: "Decades to lean into. Stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["80s","90s","2000s"]', sectionGroup: "music_vibe" },
  { id: "pq_music_genres_love", label: "Genres you love", helpText: "Favorite genres. Stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["Pop","R&B"]', sectionGroup: "music_vibe" },
  { id: "pq_music_genres_avoid", label: "Genres to avoid", helpText: "Optional genres to minimize. Stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["Country"]', sectionGroup: "music_vibe" },
  { id: "pq_music_line_dances_attitude", label: "Line dance preference", helpText: "Overall line-dance attitude.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["We love them", "Some are fine", "Only if requested", "Please avoid them"], sectionGroup: "music_vibe" },
  { id: "pq_music_line_dances_pick", label: "Welcome line dances", helpText: "Optional specific line dances. Stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["Cupid Shuffle","Wobble"]', sectionGroup: "music_vibe" },
  { id: "pq_music_other_notes", label: "Additional music notes", helpText: "Optional freeform music preferences.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Guests, culture, family tastes, concerns…", sectionGroup: "music_vibe" },
  { id: "pq_must_play_vibe", label: "Must-play vibe (legacy)", helpText: "Legacy free-text field superseded by Music Profile and Music Hub.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Energy, eras, artists…", sectionGroup: "legacy_music_notes" },
  { id: "pq_do_not_play_notes", label: "Do-not-play notes (legacy)", helpText: "Legacy free-text field superseded by Music Hub do-not-play lists.", answerType: "long_text", required: false, showInLiveEventMode: true, placeholder: "Songs, genres, sensitivities…", sectionGroup: "legacy_music_notes" },
  { id: "pq_music_participation_attitude", label: "Participation song preference (legacy)", helpText: "Retired from Music Profile; preserved for saved answers.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["We love them", "Some are fine", "Only if requested", "Please avoid them"], sectionGroup: "legacy_music_notes" },
  { id: "pq_music_participation_pick", label: "Welcome participation songs (legacy)", helpText: "Retired from Music Profile; stored as JSON array.", answerType: "short_text", required: false, showInLiveEventMode: true, placeholder: '["Sweet Caroline"]', sectionGroup: "legacy_music_notes" },
  { id: "pq_music_involvement", label: "Music involvement (legacy)", helpText: "Retired from Music Profile; preserved for saved answers.", answerType: "multiple_choice", required: false, showInLiveEventMode: true, options: ["We'll build everything ourselves", "We'll provide lots of guidance", "We'll provide a few must-plays", "We trust our DJ completely"], sectionGroup: "legacy_music_notes" },
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
    const raw = (safe[q.id] ?? "").trim();
    const v =
      q.id === SPEECHES_TOASTS_PLANNING_KEY
        ? formatSpeechesToastsForDisplay(safe[q.id]) || raw
        : raw;
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
