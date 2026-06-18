import type { CoupleWeddingChapterStatus } from "@/lib/coupleWeddingJourney";
import {
  CEREMONY_CHAPTER_QUESTION_IDS,
  ceremonyCutmasterServicesLabelFromValue,
  ceremonyLocationLabelFromValue,
  hasLegacyCeremonyPlanningAnswer,
  normalizeCeremonyCutmasterServicesAnswer,
  normalizeCeremonyLocationAnswer,
} from "@/lib/coupleCeremonyPlanning";
import {
  MUSIC_PROFILE_QUESTION_IDS,
  formatPlanningQuestionChipAnswerForDisplay,
} from "@/lib/coupleMusicProfilePlanning";
import {
  YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS,
  YOUR_TEAM_QUESTION_IDS,
  bookedContactIsValid,
  parseYourTeamOtherPartnersAnswer,
  parseYourTeamRoleSlotAnswer,
} from "@/lib/coupleYourTeamPlanning";
import { formatEventDateForDisplay } from "@/utils/planning";

export type CoupleOperationalReadinessRow = {
  id: "timeline" | "music_hub" | "event_team";
  label: string;
  status: CoupleWeddingChapterStatus;
  detail: string;
};

export type CoupleOperationalReadinessInput = {
  timelineItemsCount: number;
  hasKeyTimelineMoments: boolean;
  hasKeyFormalDanceSongs: boolean;
  hasMusicHubSignal: boolean;
  musicProfileChapterComplete: boolean;
  eventTeamVendorCount: number;
  collaboratorCount: number;
};

function readinessStatus(complete: boolean, started: boolean): CoupleWeddingChapterStatus {
  if (complete) return "Complete";
  if (started) return "In Progress";
  return "Not Started";
}

export function buildCoupleOperationalReadinessRows(
  input: CoupleOperationalReadinessInput,
): CoupleOperationalReadinessRow[] {
  const timelineComplete = input.hasKeyTimelineMoments && input.hasKeyFormalDanceSongs;
  const timelineStarted = input.timelineItemsCount > 0;

  const musicComplete = input.hasMusicHubSignal;
  const musicStarted = input.musicProfileChapterComplete || input.hasMusicHubSignal;

  const teamComplete = input.eventTeamVendorCount > 0 || input.collaboratorCount > 1;
  const teamStarted = teamComplete;

  return [
    {
      id: "timeline",
      label: "Timeline",
      status: readinessStatus(timelineComplete, timelineStarted),
      detail: timelineComplete
        ? "Key moments and formal dances are in place"
        : timelineStarted
          ? "Moments added—keep refining times and songs"
          : "Add your first moments when timing feels real",
    },
    {
      id: "music_hub",
      label: "Music Hub",
      status: readinessStatus(musicComplete, musicStarted),
      detail: musicComplete
        ? "Playlists or song picks are ready for your DJ"
        : musicStarted
          ? "Your music profile is saved—add playlists or must-plays when ready"
          : "Share a playlist link or a few must-play songs",
    },
    {
      id: "event_team",
      label: "Vendor contacts",
      status: readinessStatus(teamComplete, teamStarted),
      detail: teamComplete
        ? "Day-of vendor contacts are on file"
        : "Add vendors as you book them",
    },
  ];
}

export function coupleReadinessStatusPillClass(status: CoupleWeddingChapterStatus): string {
  switch (status) {
    case "Complete":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "In Progress":
      return "border-[#00D4FF]/35 bg-[#00D4FF]/10 text-stone-900";
    default:
      return "border-stone-200 bg-stone-50 text-stone-600";
  }
}

export type CoupleFinalReviewSummaryLine = {
  label: string;
  value: string;
};

export type CoupleFinalReviewChapterSummary = {
  title: string;
  lines: CoupleFinalReviewSummaryLine[];
};

export type CoupleFinalReviewWeddingSummary = {
  coupleNames: string | null;
  weddingDate: string | null;
  venue: string | null;
  chapters: CoupleFinalReviewChapterSummary[];
};

export type CoupleFinalReviewSummaryInput = {
  coupleNames: string;
  weddingDate: string;
  venue: string;
  answers: Record<string, string | undefined>;
};

const ABOUT_YOU_SUMMARY_CANDIDATES: ReadonlyArray<{ id: string; label: string }> = [
  { id: "pq_about_remember_most", label: "Hope guests remember" },
  { id: "pq_about_liked_weddings", label: "Moments you've loved" },
  { id: "pq_about_wedding_colors_style", label: "Colors & style" },
  { id: "pq_about_honeymoon", label: "Honeymoon" },
  { id: "pq_about_full_names", label: "Full names" },
  { id: "pq_about_wedding_hashtag", label: "Hashtag" },
];

const SUMMARY_TEXT_MAX = 140;

function trimSummaryText(raw: string | undefined): string {
  return (raw ?? "").trim();
}

function truncateSummaryText(text: string, max = SUMMARY_TEXT_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function firstLinePreview(text: string, max = SUMMARY_TEXT_MAX): string {
  const line = text.split(/\r?\n/).map((entry) => entry.trim()).find(Boolean) ?? text;
  return truncateSummaryText(line, max);
}

function bookedContactLabel(contact: {
  company: string;
  name: string;
}): string {
  const parts = [contact.company.trim(), contact.name.trim()].filter(Boolean);
  return parts.join(" · ") || "Booked";
}

function summarizeYourTeamRole(
  raw: string | undefined,
  roleLabel: string,
): CoupleFinalReviewSummaryLine | null {
  const parsed = parseYourTeamRoleSlotAnswer(raw);
  if (!parsed) return null;
  if (parsed.status === "booked") {
    if (!bookedContactIsValid(parsed.contact)) return null;
    return { label: roleLabel, value: bookedContactLabel(parsed.contact!) };
  }
  if (parsed.status === "not_booked") {
    return { label: roleLabel, value: "Not yet" };
  }
  return { label: roleLabel, value: "Not part of plans" };
}

function buildAboutYouSummaryLines(
  answers: Record<string, string | undefined>,
): CoupleFinalReviewSummaryLine[] {
  const lines: CoupleFinalReviewSummaryLine[] = [];
  for (const candidate of ABOUT_YOU_SUMMARY_CANDIDATES) {
    if (lines.length >= 3) break;
    const value = trimSummaryText(answers[candidate.id]);
    if (!value) continue;
    lines.push({
      label: candidate.label,
      value: truncateSummaryText(value),
    });
  }
  return lines;
}

function buildCeremonySummaryLines(
  answers: Record<string, string | undefined>,
): CoupleFinalReviewSummaryLine[] {
  if (hasLegacyCeremonyPlanningAnswer(answers)) {
    const ceremony = trimSummaryText(answers.pq_ceremony);
    if (!ceremony) return [];
    return [{ label: "Ceremony notes", value: firstLinePreview(ceremony) }];
  }

  const lines: CoupleFinalReviewSummaryLine[] = [];
  const services = normalizeCeremonyCutmasterServicesAnswer(
    answers[CEREMONY_CHAPTER_QUESTION_IDS.cutmasterServices],
  );
  if (services) {
    lines.push({
      label: "Ceremony audio",
      value: ceremonyCutmasterServicesLabelFromValue(services),
    });
  }

  const startTime = trimSummaryText(answers[CEREMONY_CHAPTER_QUESTION_IDS.startTime]);
  if (startTime) {
    lines.push({ label: "Ceremony start", value: truncateSummaryText(startTime) });
  }

  const location = normalizeCeremonyLocationAnswer(answers[CEREMONY_CHAPTER_QUESTION_IDS.location]);
  if (location) {
    const locationLabel = ceremonyLocationLabelFromValue(location);
    const details = trimSummaryText(answers[CEREMONY_CHAPTER_QUESTION_IDS.locationDetails]);
    lines.push({
      label: "Ceremony location",
      value: location === "different" && details ? `${locationLabel} · ${truncateSummaryText(details)}` : locationLabel,
    });
  }

  return lines;
}

function buildMusicProfileSummaryLines(
  answers: Record<string, string | undefined>,
): CoupleFinalReviewSummaryLine[] {
  const lines: CoupleFinalReviewSummaryLine[] = [];

  const decades = formatPlanningQuestionChipAnswerForDisplay(
    answers[MUSIC_PROFILE_QUESTION_IDS.decades],
  );
  if (decades) lines.push({ label: "Decades", value: decades });

  const genres = formatPlanningQuestionChipAnswerForDisplay(
    answers[MUSIC_PROFILE_QUESTION_IDS.genresLove],
  );
  if (genres) lines.push({ label: "Genres", value: genres });

  const danceFloor = formatPlanningQuestionChipAnswerForDisplay(
    answers[MUSIC_PROFILE_QUESTION_IDS.danceFloorStyle],
  );
  if (danceFloor) lines.push({ label: "Dance floor style", value: danceFloor });

  const lineDanceAttitude = trimSummaryText(answers[MUSIC_PROFILE_QUESTION_IDS.lineDancesAttitude]);
  if (lineDanceAttitude) {
    lines.push({ label: "Line dances", value: lineDanceAttitude });
  }

  const lineDancePicks = formatPlanningQuestionChipAnswerForDisplay(
    answers[MUSIC_PROFILE_QUESTION_IDS.lineDancesPick],
  );
  if (lineDancePicks) {
    lines.push({ label: "Line dance favorites", value: lineDancePicks });
  }

  return lines;
}

function buildYourTeamSummaryLines(
  answers: Record<string, string | undefined>,
): CoupleFinalReviewSummaryLine[] {
  const lines: CoupleFinalReviewSummaryLine[] = [];

  const roleSlots: ReadonlyArray<[string, string]> = [
    [YOUR_TEAM_QUESTION_IDS.planner, "Planner"],
    [YOUR_TEAM_QUESTION_IDS.photographer, "Photographer"],
    [YOUR_TEAM_QUESTION_IDS.videographer, "Videographer"],
    [YOUR_TEAM_QUESTION_IDS.officiant, "Officiant"],
  ];

  for (const [questionId, label] of roleSlots) {
    const line = summarizeYourTeamRole(answers[questionId], label);
    if (line) lines.push(line);
  }

  const otherParsed = parseYourTeamOtherPartnersAnswer(answers[YOUR_TEAM_QUESTION_IDS.otherPartners]);
  if (otherParsed?.status === "booked") {
    for (const partner of otherParsed.partners ?? []) {
      if (!bookedContactIsValid(partner)) continue;
      const chipLabel =
        YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS[
          partner.role as keyof typeof YOUR_TEAM_OTHER_PARTNER_CHIP_LABELS
        ] ?? partner.role;
      lines.push({ label: chipLabel, value: bookedContactLabel(partner) });
    }
  } else if (otherParsed?.status === "not_booked") {
    lines.push({ label: "Other vendors", value: "None right now" });
  }

  const coordinationNotes = trimSummaryText(answers[YOUR_TEAM_QUESTION_IDS.coordinationNotes]);
  if (coordinationNotes) {
    lines.push({ label: "Coordination notes", value: truncateSummaryText(coordinationNotes) });
  }

  return lines;
}

export function buildCoupleFinalReviewWeddingSummary(
  input: CoupleFinalReviewSummaryInput,
): CoupleFinalReviewWeddingSummary {
  const coupleNames = trimSummaryText(input.coupleNames);
  const weddingDateRaw = trimSummaryText(input.weddingDate);
  const venue = trimSummaryText(input.venue);

  const chapters: CoupleFinalReviewChapterSummary[] = [];

  const aboutLines = buildAboutYouSummaryLines(input.answers);
  if (aboutLines.length > 0) chapters.push({ title: "About You", lines: aboutLines });

  const ceremonyLines = buildCeremonySummaryLines(input.answers);
  if (ceremonyLines.length > 0) chapters.push({ title: "Ceremony", lines: ceremonyLines });

  const musicLines = buildMusicProfileSummaryLines(input.answers);
  if (musicLines.length > 0) chapters.push({ title: "Music Profile", lines: musicLines });

  const teamLines = buildYourTeamSummaryLines(input.answers);
  if (teamLines.length > 0) chapters.push({ title: "Your Team", lines: teamLines });

  return {
    coupleNames: coupleNames || null,
    weddingDate: weddingDateRaw
      ? formatEventDateForDisplay(weddingDateRaw, weddingDateRaw)
      : null,
    venue: venue || null,
    chapters,
  };
}
